'use client';

import { useSupabaseStore } from '@/store/supabase-store';
import { useRouter } from 'next/navigation';

export default function UnauthorizedPage() {
  const { userId, signOut } = useSupabaseStore();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-red-600">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Access Denied
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            You don&apos;t have the required permissions to access this resource.
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-sm text-gray-500">
            <p><strong>User ID:</strong> {userId || 'Not authenticated'}</p>
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={() => router.push('/')}
            className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Go to Dashboard
          </button>
          <button
            onClick={handleSignOut}
            className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
