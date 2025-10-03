import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Create client only on client-side
let supabaseInstance: SupabaseClient<Database> | null = null;

function getSupabaseClient(): SupabaseClient<Database> | null {
  if (typeof window === 'undefined') {
    // Return null for SSR
    return null;
  }

  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables. Please check .env.local file');
      return null;
    }

    // Check if URL is valid for testing
    if (supabaseUrl === 'your_supabase_project_url' || supabaseUrl === 'https://demo-project.supabase.co') {
      console.warn('Using demo Supabase URL. For production, update .env.local with your actual Supabase credentials');
      // Return null to prevent errors, but allow the app to run in demo mode
      return null;
    }

    console.log('Initializing Supabase client...', {
      url: supabaseUrl,
      keyLength: supabaseAnonKey.length,
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey
    });

    supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
      db: {
        schema: 'portal'
      }
    });
    
    console.log('✅ Supabase client initialized successfully');
  }

  return supabaseInstance;
}

// Export a getter function instead of the client directly
export function getSupabase(): SupabaseClient<Database> | null {
  return getSupabaseClient();
}

// For backward compatibility, export as supabase too
export const supabase = getSupabaseClient();

// Helper to get current user (returns null if no session)
export const getCurrentUser = async () => {
  if (typeof window === 'undefined') return null;
  
  try {
    const client = getSupabaseClient();
    if (!client) return null;
    
    const { data: { session } } = await client.auth.getSession();
    return session?.user ?? null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

// Authentication methods following Supabase docs
export const signInWithEmail = async (email: string, password: string) => {
  if (typeof window === 'undefined') {
    throw new Error('Cannot sign in on server side');
  }
  
  try {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client not initialized');
    
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error signing in with email:', error);
    throw error;
  }
};

export const signUpWithEmail = async (email: string, password: string) => {
  if (typeof window === 'undefined') {
    throw new Error('Cannot sign up on server side');
  }
  
  try {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client not initialized');
    
    const { data, error } = await client.auth.signUp({
      email,
      password
    });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error signing up with email:', error);
    throw error;
  }
};

export const signInWithMagicLink = async (email: string) => {
  if (typeof window === 'undefined') {
    throw new Error('Cannot send magic link on server side');
  }
  
  try {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client not initialized');
    
    const { data, error } = await client.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error sending magic link:', error);
    throw error;
  }
};

export const signOut = async () => {
  if (typeof window === 'undefined') {
    throw new Error('Cannot sign out on server side');
  }
  
  try {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client not initialized');
    
    const { error } = await client.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Helper to sign in anonymously for development
export const signInAnonymously = async () => {
  if (typeof window === 'undefined') {
    throw new Error('Cannot sign in on server side');
  }
  
  try {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client not initialized');
    
    const { data, error } = await client.auth.signInAnonymously();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error signing in anonymously:', error);
    throw error;
  }
};
