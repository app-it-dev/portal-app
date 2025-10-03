'use client';

import { useEffect } from 'react';
import { useSupabaseStore as useStore } from '@/store/supabase-store';
import { Header } from '@/components/Header';
import { UploadZone } from '@/components/UploadZone';
import { PostsTable } from '@/components/PostsTable';
import { DetailsPanel } from '@/components/DetailsPanel';
import { KeyboardShortcuts } from '@/components/KeyboardShortcuts';
import AdminAuthWrapper from '@/components/AdminAuthWrapper';

export default function ImportPage() {
  const hydrate = useStore(state => state.hydrate);
  const isHydrated = useStore(state => state.isHydrated);
  const isOnline = useStore(state => state.isOnline);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Show loading state while hydrating from Supabase
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Loading from Supabase...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <AdminAuthWrapper>
      <div className="min-h-screen flex flex-col">
        <Header />
        {/* Show offline warning banner */}
        {!isOnline && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
            <div className="flex items-center gap-2 text-amber-800 text-sm">
              <span className="text-lg">⚠️</span>
              <span>Offline - Changes won&apos;t sync in real-time. Check your connection to Supabase.</span>
            </div>
          </div>
        )}
        <main className="flex-1">
          <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
            {/* Left Sidebar - Upload Zone + Posts Table */}
            <div className="w-full lg:w-1/3 xl:w-2/5 flex flex-col border-r border-slate-200 overflow-hidden">
              <div className="flex-shrink-0">
                <UploadZone />
              </div>
              <div className="flex-1 overflow-hidden">
                <PostsTable />
              </div>
            </div>
            
            {/* Right Sidebar - Post Details (Full Height) */}
            <div className="hidden lg:flex lg:w-2/3 xl:w-3/5 flex-col overflow-hidden">
              <DetailsPanel />
            </div>
            
            {/* Mobile/Tablet Details Panel - Show when post is selected */}
            <div className="lg:hidden flex-1 overflow-hidden">
              <DetailsPanel />
            </div>
          </div>
          
          
        </main>
        <KeyboardShortcuts />
      </div>
    </AdminAuthWrapper>
  );
}
