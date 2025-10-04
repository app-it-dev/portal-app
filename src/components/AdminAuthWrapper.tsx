'use client';

import { useSupabaseStore } from '@/store/supabase-store';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface AdminAuthWrapperProps {
  children: React.ReactNode;
  requiredRole?: 'super_admin' | 'admin' | 'moderator';
}

export default function AdminAuthWrapper({ 
  children,
  requiredRole
}: AdminAuthWrapperProps) {
  const { isHydrated } = useSupabaseStore();
  const { hasRole, loading } = useAdminAuth();

  if (!isHydrated || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have the required permissions to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
