'use client';

import { useSupabaseStore } from '@/store/supabase-store';

interface AdminAuthWrapperProps {
  children: React.ReactNode;
}

export default function AdminAuthWrapper({ 
  children
}: AdminAuthWrapperProps) {
  const { isHydrated } = useSupabaseStore();

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return <>{children}</>;
}
