#!/usr/bin/env node

/**
 * Pre-deployment Health Check Script
 * Run this before deploying to verify everything is configured correctly
 */

const https = require('https');
const http = require('http');

const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(color, symbol, message) {
    console.log(`${color}${symbol}${colors.reset} ${message}`);
}

function success(message) { log(colors.green, '✓', message); }
function error(message)   { log(colors.red,   '✗', message); }
function info(message)    { log(colors.blue,  'ℹ', message); }
function warning(message) { log(colors.yellow,'⚠', message); }

async function checkEnvironmentVariables() {
    console.log('\n📋 Checking Environment Variables...\n');

    const requiredVars = [
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY',
        'ENCRYPTION_KEY',
        'NODE_ENV'
    ];

    const optionalVars = [
        'SUPABASE_SERVICE_ROLE_KEY',
        'CORS_ORIGIN',
        'FRONTEND_URL',
        'PORT',
        'LOG_LEVEL'
    ];

    let allGood = true;

    for (const varName of requiredVars) {
        if (process.env[varName]) {
            if (varName === 'ENCRYPTION_KEY') {
                const keyBytes = Buffer.from(process.env[varName], 'utf8');
                if (keyBytes.length === 32) {
                    success(`${varName} - Set and valid (32 bytes UTF-8)`);
                } else {
                    error(`${varName} - Invalid length (must be 32 bytes UTF-8, got ${keyBytes.length})`);
                    allGood = false;
                }
            } else {
                success(`${varName} - Set`);
            }
        } else {
            error(`${varName} - Missing!`);
            allGood = false;
        }
    }

    for (const varName of optionalVars) {
        if (process.env[varName]) {
            success(`${varName} - Set`);
        } else {
            warning(`${varName} - Not set (using default)`);
        }
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        warning('SUPABASE_SERVICE_ROLE_KEY not set — backend will use anon key (RLS policies will apply)');
    }

    return allGood;
}

async function testDatabaseConnection() {
    console.log('\n🗄️  Testing Supabase Connection...\n');

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        error('SUPABASE_URL or SUPABASE_ANON_KEY not set, skipping database test');
        return false;
    }

    try {
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
            { auth: { persistSession: false, autoRefreshToken: false } }
        );

        const { data, error: err } = await supabase
            .from('audit_logs')
            .select('count', { count: 'exact', head: true });

        if (err && err.code !== 'PGRST116') {
            // PGRST116 = table doesn't exist yet, which is acceptable
            error(`Supabase connection failed: ${err.message}`);
            return false;
        }

        success('Supabase connection successful');
        success(`Project URL: ${process.env.SUPABASE_URL}`);
        return true;
    } catch (err) {
        error(`Supabase connection failed: ${err.message}`);
        return false;
    }
}

async function testHealthEndpoint() {
    console.log('\n🏥 Testing Health Endpoint...\n');

    const PORT = process.env.PORT || 5000;

    return new Promise((resolve) => {
        const express = require('express');
        const app = express();

        app.get('/health', (req, res) => {
            res.json({ status: 'ok' });
        });

        const server = app.listen(PORT, () => {
            info(`Test server started on port ${PORT}`);

            http.get(`http://localhost:${PORT}/health`, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        if (json.status === 'ok') {
                            success('Health endpoint responding correctly');
                        } else {
                            error('Health endpoint returned unexpected response');
                        }
                    } catch (err) {
                        error(`Health endpoint test failed: ${err.message}`);
                    }
                    server.close();
                    resolve(true);
                });
            }).on('error', (err) => {
                error(`Health endpoint test failed: ${err.message}`);
                server.close();
                resolve(false);
            });
        });
    });
}

function checkFileStructure() {
    console.log('\n📁 Checking File Structure...\n');

    const fs = require('fs');
    const path = require('path');

    const requiredFiles = [
        'package.json',
        'server.js',
        '.env',
        'config.json',
        'supabaseClient.js'
    ];

    const requiredDirs = [
        'services',
        'logs'
    ];

    let allGood = true;

    for (const file of requiredFiles) {
        if (fs.existsSync(path.join(__dirname, file))) {
            success(`${file} - Found`);
        } else {
            error(`${file} - Missing!`);
            allGood = false;
        }
    }

    for (const dir of requiredDirs) {
        if (fs.existsSync(path.join(__dirname, dir))) {
            success(`${dir}/ - Found`);
        } else {
            warning(`${dir}/ - Not found (will be created at runtime)`);
        }
    }

    return allGood;
}

async function main() {
    console.log('\n' + '='.repeat(60));
    console.log('   🚀 DecentraID Backend - Pre-Deployment Check');
    console.log('='.repeat(60));

    // Load environment variables
    require('dotenv').config();

    const results = {
        env:      await checkEnvironmentVariables(),
        files:    checkFileStructure(),
        database: await testDatabaseConnection(),
        health:   await testHealthEndpoint()
    };

    console.log('\n' + '='.repeat(60));
    console.log('   📊 Summary');
    console.log('='.repeat(60) + '\n');

    const allPassed = Object.values(results).every(r => r);

    if (allPassed) {
        success('All checks passed! ✨');
        success('Your backend is ready for production deployment.');
        console.log('\n👉 Next steps:');
        info('1. Commit and push to GitHub: git push');
        info('2. Make sure Render env vars are set (SUPABASE_URL, SUPABASE_ANON_KEY, ENCRYPTION_KEY, etc.)');
        info('3. Deploy using render.yaml or Render dashboard');
        info('4. Monitor deployment logs at https://dashboard.render.com');
        console.log('');
        process.exit(0);
    } else {
        error('Some checks failed. Please fix the issues above.');
        console.log('');
        process.exit(1);
    }
}

main().catch(err => {
    error(`Fatal error: ${err.message}`);
    process.exit(1);
});
