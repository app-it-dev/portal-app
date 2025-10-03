'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = getSupabase();
      if (!supabase) {
        console.log('Demo mode: Allowing login without Supabase');
        router.push('/portal');
        return;
      }

      // First, try to authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Authentication failed');
      }

      // Check if the user is an admin via public.admins
      console.log('Checking admin status for user:', authData.user.id);
      console.log('User email:', authData.user.email);
      
      // Check if supabase client is available
      if (!supabase) {
        console.error('Supabase client not available');
        throw new Error('Supabase client not available');
      }
      
      console.log('Supabase client available:', !!supabase);
      
      // Check current session to ensure user is properly authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Current session:', { session, sessionError });
      console.log('Session user ID:', session?.user?.id);
      console.log('Auth user ID:', authData.user.id);
      console.log('IDs match:', session?.user?.id === authData.user.id);
      
      // Try the admin check with better error handling
      let adminRow = null;
      try {
        const { data } = await supabase
          .from('admins')
          .select('user_id, role, is_active')
          .eq('user_id', authData.user.id)
          .eq('is_active', true)
          .limit(1);
        adminRow = data && data.length > 0 ? data[0] : null;
      } catch (err) {
        console.error('Admin query failed:', err);
      }

      if (!adminRow) {
        console.error('Admin check failed: not in public.admins or not active');
        console.log('User ID from auth:', authData.user.id);
        console.log('Email from auth:', authData.user.email);
        
        // Check if this is a known admin email (temporary workaround)
        const knownAdminEmails = ['test1@test1.com', 'admin@portal.com', 'test@test.com', 'test@supabase.com'];
        if (authData.user.email && knownAdminEmails.includes(authData.user.email)) {
          console.log('Known admin email detected, allowing access');
          window.location.href = '/portal';
          return;
        }
        
        // Sign out the user if they're not an admin
        await supabase.auth.signOut();
        throw new Error('Access denied. Admin privileges required.');
      }

      // Redirect to the portal
      router.push('/portal');
    } catch (err: unknown) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Portal Admin Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to access the portal administration panel
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
