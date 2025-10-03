'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminAuthWrapper from '@/components/AdminAuthWrapper';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the import page
    router.push('/import');
  }, [router]);

  return (
    <AdminAuthWrapper>
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-sm">CG</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">CarsGate Portal</h1>
          <p className="text-slate-600">Redirecting to import...</p>
        </div>
      </div>
    </AdminAuthWrapper>
  );
}