'use client';

import { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase';
import type { PortalAdmin } from '@/types/supabase';

interface AdminUser {
  id: string;
  email: string;
  admin_id: string;
  role: 'super_admin' | 'admin' | 'moderator';
}

export function useAdminAuth() {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const supabase = getSupabase();
      if (!supabase) {
        setLoading(false);
        return;
      }

      // Check if we have admin info in session storage
      const storedAdmin = sessionStorage.getItem('admin_user');
      if (storedAdmin) {
        const adminData = JSON.parse(storedAdmin);
        setAdminUser(adminData);
        setIsAuthenticated(true);
        setLoading(false);
        return;
      }

      // Check if user is authenticated with Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
             // Verify admin status
             const { data: adminData, error } = await supabase
               .from('admins')
               .select('*')
               .eq('user_id', session.user.id)
               .eq('is_active', true)
               .single();

        if (adminData && !error) {
          const adminUser: AdminUser = {
            id: session.user.id,
            email: session.user.email || '',
            admin_id: (adminData as any).id,
            role: (adminData as any).role,
          };
          
          setAdminUser(adminUser);
          setIsAuthenticated(true);
          
          // Store in session storage
          sessionStorage.setItem('admin_user', JSON.stringify(adminUser));
        } else {
          // User is authenticated but not an admin
          await supabase.auth.signOut();
          sessionStorage.removeItem('admin_user');
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const supabase = getSupabase();
      if (supabase) {
        await supabase.auth.signOut();
      }
      sessionStorage.removeItem('admin_user');
      setAdminUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const hasRole = (requiredRole: 'super_admin' | 'admin' | 'moderator') => {
    if (!adminUser) return false;
    
    const roleHierarchy = {
      'moderator': 1,
      'admin': 2,
      'super_admin': 3,
    };
    
    return roleHierarchy[adminUser.role] >= roleHierarchy[requiredRole];
  };

  const canManageAdmins = () => hasRole('super_admin');
  const canManagePosts = () => hasRole('admin');
  const canModerate = () => hasRole('moderator');

  return {
    adminUser,
    isAuthenticated,
    loading,
    signOut,
    hasRole,
    canManageAdmins,
    canManagePosts,
    canModerate,
    checkAuthStatus,
  };
}
