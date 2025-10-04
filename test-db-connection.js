// Test script to check database connection and schema
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testDatabaseConnection() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables');
    return;
  }
  
  console.log('🔗 Testing database connection...');
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseAnonKey.substring(0, 20) + '...');
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  // Test 1: Check if portal schema exists
  console.log('\n📋 Testing portal schema...');
  try {
    const { data, error } = await supabase
      .schema('portal')
      .from('portal_import_posts')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Portal schema error:', error);
    } else {
      console.log('✅ Portal schema accessible');
    }
  } catch (err) {
    console.error('❌ Portal schema exception:', err.message);
  }
  
  // Test 2: Check if posts_dash view exists
  console.log('\n📋 Testing posts_dash view...');
  try {
    const { data, error } = await supabase
      .from('posts_dash')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ posts_dash view error:', error);
    } else {
      console.log('✅ posts_dash view accessible');
    }
  } catch (err) {
    console.error('❌ posts_dash view exception:', err.message);
  }
  
  // Test 3: Check if orders table has buyer_snapshot column
  console.log('\n📋 Testing orders table...');
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('id, buyer_snapshot')
      .limit(1);
    
    if (error) {
      console.error('❌ Orders table error:', error);
    } else {
      console.log('✅ Orders table accessible');
    }
  } catch (err) {
    console.error('❌ Orders table exception:', err.message);
  }
  
  // Test 4: Check if is_deposit_paid function exists
  console.log('\n📋 Testing is_deposit_paid function...');
  try {
    const { data, error } = await supabase
      .rpc('is_deposit_paid', { p_order_id: 1 });
    
    if (error) {
      console.error('❌ is_deposit_paid function error:', error);
    } else {
      console.log('✅ is_deposit_paid function accessible');
    }
  } catch (err) {
    console.error('❌ is_deposit_paid function exception:', err.message);
  }
  
  // Test 5: Check admins table
  console.log('\n📋 Testing admins table...');
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Admins table error:', error);
    } else {
      console.log('✅ Admins table accessible');
    }
  } catch (err) {
    console.error('❌ Admins table exception:', err.message);
  }
}

testDatabaseConnection().catch(console.error);
