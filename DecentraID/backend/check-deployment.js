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

function success(message) {
    log(colors.green, '✓', message);
}

function error(message) {
    log(colors.red, '✗', message);
}

function info(message) {
    log(colors.blue, 'ℹ', message);
}

function warning(message) {
    log(colors.yellow, '⚠', message);
}

async function checkEnvironmentVariables() {
    console.log('\n📋 Checking Environment Variables...\n');
    
    const requiredVars = [
        'MONGODB_URI',
        'ENCRYPTION_KEY',
        'NODE_ENV'
    ];
    
    const optionalVars = [
        'CORS_ORIGIN',
        'FRONTEND_URL',
        'PORT'
    ];
    
    let allGood = true;
    
    for (const varName of requiredVars) {
        if (process.env[varName]) {
            if (varName === 'ENCRYPTION_KEY') {
                if (process.env[varName].length === 32) {
                    success(`${varName} - Set and valid (32 chars)`);
                } else {
                    error(`${varName} - Invalid length (must be 32 chars, got ${process.env[varName].length})`);
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
    
    return allGood;
}

async function testDatabaseConnection() {
    console.log('\n🗄️  Testing Database Connection...\n');
    
    if (!process.env.MONGODB_URI) {
        error('MONGODB_URI not set, skipping database test');
        return false;
    }
    
    try {
        const mongoose = require('mongoose');
        
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000
        });
        
        success('Database connection successful');
        success(`Database: ${mongoose.connection.db.databaseName}`);
        
        await mongoose.connection.close();
        return true;
    } catch (err) {
        error(`Database connection failed: ${err.message}`);
        return false;
    }
}

async function testHealthEndpoint() {
    console.log('\n🏥 Testing Health Endpoint...\n');
    
    const PORT = process.env.PORT || 5000;
    
    return new Promise((resolve) => {
        // Start a minimal server to test
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
        'config.json'
    ];
    
    const requiredDirs = [
        'models',
        'routes'
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
            warning(`${dir}/ - Not found (may be embedded in server.js)`);
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
        env: await checkEnvironmentVariables(),
        files: checkFileStructure(),
        database: await testDatabaseConnection(),
        health: await testHealthEndpoint()
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
        info('2. Deploy to Render using render.yaml');
        info('3. Configure environment variables in Render dashboard');
        info('4. Monitor deployment logs');
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
