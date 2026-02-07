// Test Supabase Connection
// Run this to verify your Supabase setup is working

const { supabase, testSupabaseConnection } = require('./supabaseClient');

async function runTests() {
    console.log('🧪 Testing Supabase Integration...\n');

    // Test 1: Connection
    console.log('Test 1: Testing Supabase connection...');
    try {
        const isConnected = await testSupabaseConnection();
        if (isConnected) {
            console.log('✅ Connection successful!\n');
        } else {
            console.log('⚠️  Connection test returned false\n');
        }
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        console.log('\n💡 Make sure you have:');
        console.log('   1. Set SUPABASE_URL and SUPABASE_ANON_KEY in .env');
        console.log('   2. Run the supabase-schema.sql in Supabase SQL Editor\n');
        process.exit(1);
    }

    // Test 2: Check if tables exist
    console.log('Test 2: Checking if tables exist...');
    const tables = ['audit_logs', 'verification_requests', 'gasless_identities'];
    let allTablesExist = true;

    for (const table of tables) {
        try {
            const { data, error } = await supabase
                .from(table)
                .select('count', { count: 'exact', head: true });
            
            if (error && error.code === 'PGRST116') {
                console.log(`❌ Table '${table}' does not exist`);
                allTablesExist = false;
            } else if (error) {
                console.log(`⚠️  Error checking '${table}':`, error.message);
                allTablesExist = false;
            } else {
                console.log(`✅ Table '${table}' exists`);
            }
        } catch (error) {
            console.log(`❌ Error checking '${table}':`, error.message);
            allTablesExist = false;
        }
    }

    if (!allTablesExist) {
        console.log('\n⚠️  Some tables are missing!');
        console.log('💡 Please run the supabase-schema.sql in Supabase SQL Editor:');
        console.log('   https://app.supabase.com/project/ybzavfobzntdxvddmuyj/sql\n');
        process.exit(1);
    }

    console.log('\n✅ All tables exist!\n');

    // Test 3: Test CRUD operations
    console.log('Test 3: Testing CRUD operations...');
    
    try {
        // Create a test audit log
        const { data: insertData, error: insertError } = await supabase
            .from('audit_logs')
            .insert([{
                did: 'did:test:123',
                action: 'TEST_ACTION',
                details: 'Integration test',
                tx_hash: 'TEST'
            }])
            .select()
            .single();

        if (insertError) {
            throw insertError;
        }
        console.log('✅ Insert operation successful');

        // Read the test audit log
        const { data: selectData, error: selectError } = await supabase
            .from('audit_logs')
            .select('*')
            .eq('did', 'did:test:123')
            .single();

        if (selectError) {
            throw selectError;
        }
        console.log('✅ Select operation successful');

        // Delete the test audit log
        const { error: deleteError } = await supabase
            .from('audit_logs')
            .delete()
            .eq('did', 'did:test:123');

        if (deleteError) {
            throw deleteError;
        }
        console.log('✅ Delete operation successful');

    } catch (error) {
        console.error('❌ CRUD operation failed:', error.message);
        console.log('\n💡 Check your RLS policies in Supabase dashboard\n');
        process.exit(1);
    }

    console.log('\n🎉 All tests passed!');
    console.log('✅ Your Supabase integration is working correctly!\n');
    console.log('Next steps:');
    console.log('  1. Run: npm run dev');
    console.log('  2. Test your API endpoints\n');
}

runTests().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
});
