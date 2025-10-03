'use client';

import { useSupabaseStore } from '@/store/supabase-store';

export function Header() {
  const { signOut } = useSupabaseStore();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/login';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
      <div className="container-responsive">
        <div className="flex h-14 sm:h-16 items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm sm:text-base">CG</span>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                  CarsGate Portal
                </h1>
                <p className="text-xs sm:text-sm text-slate-600">
                  Admin Portal
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                Supabase Connected
              </span>
            </div>
          </div>
          
          {/* User info and sign out */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handleSignOut}
              className="inline-flex items-center px-3 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
