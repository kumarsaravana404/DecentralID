const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

// Validate Supabase environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error('❌ Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env');
    if (process.env.NODE_ENV === 'production') {
        process.exit(1);
    }
}

// Create Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
    {
        auth: {
            persistSession: false, // Server-side doesn't need session persistence
            autoRefreshToken: false,
        },
        db: {
            schema: 'public'
        }
    }
);

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('⚠️ WARNING: Using SUPABASE_ANON_KEY. Backend should use SUPABASE_SERVICE_ROLE_KEY for full access without RLS policies.');
}

// Test connection function
async function testSupabaseConnection() {
    try {
        const { data, error } = await supabase.from('audit_logs').select('count', { count: 'exact', head: true });
        if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist yet
            throw error;
        }
        console.log('✅ Supabase Connected Successfully');
        return true;
    } catch (error) {
        console.error('❌ Supabase Connection Error:', error.message);
        return false;
    }
}

module.exports = { supabase, testSupabaseConnection };
