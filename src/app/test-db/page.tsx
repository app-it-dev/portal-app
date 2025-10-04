'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';

export default function TestDatabase() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function testDatabase() {
      const supabase = getSupabase();
      if (!supabase) {
        setResults({ error: 'Supabase client not available' });
        setLoading(false);
        return;
      }

      const testResults: any = {};

      // Test 1: Portal schema
      try {
        const { data, error } = await supabase
          .schema('portal')
          .from('portal_import_posts')
          .select('*')
          .limit(1);
        testResults.portal = { data, error };
      } catch (err) {
        testResults.portal = { error: err };
      }

      // Test 2: Admins table
      try {
        const { data, error } = await supabase
          .from('admins')
          .select('*')
          .limit(1);
        testResults.admins = { data, error };
      } catch (err) {
        testResults.admins = { error: err };
      }

      // Test 3: Merchants table
      try {
        const { data, error } = await supabase
          .from('merchants')
          .select('*')
          .limit(1);
        testResults.merchants = { data, error };
      } catch (err) {
        testResults.merchants = { error: err };
      }

      // Test 4: Orders table
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .limit(1);
        testResults.orders = { data, error };
      } catch (err) {
        testResults.orders = { error: err };
      }

      // Test 5: Posts table
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .limit(1);
        testResults.posts = { data, error };
      } catch (err) {
        testResults.posts = { error: err };
      }

      // Test 6: Customers table
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .limit(1);
        testResults.customers = { data, error };
      } catch (err) {
        testResults.customers = { error: err };
      }

      // Test 7: Posts dash view
      try {
        const { data, error } = await supabase
          .from('posts_dash')
          .select('*')
          .limit(1);
        testResults.posts_dash = { data, error };
      } catch (err) {
        testResults.posts_dash = { error: err };
      }

      // Test 8: is_deposit_paid function
      try {
        const { data, error } = await supabase
          .rpc('is_deposit_paid', { p_order_id: 1 });
        testResults.is_deposit_paid = { data, error };
      } catch (err) {
        testResults.is_deposit_paid = { error: err };
      }

      setResults(testResults);
      setLoading(false);
    }

    testDatabase();
  }, []);

  if (loading) {
    return <div>Testing database connections...</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Database Test Results</h1>
      <pre>{JSON.stringify(results, null, 2)}</pre>
    </div>
  );
}
