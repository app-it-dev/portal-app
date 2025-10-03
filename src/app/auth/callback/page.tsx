'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase) {
          console.error('Supabase client not available');
          router.push('/login?error=client_not_available');
          return;
        }

        // Handle the auth callback
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          router.push('/login?error=auth_failed');
          return;
        }

        if (data.session) {
          console.log('Authentication successful');
          router.push('/import');
        } else {
          console.log('No session found');
          router.push('/login?error=no_session');
        }
      } catch (error) {
        console.error('Unexpected error during auth callback:', error);
        router.push('/login?error=unexpected_error');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}
