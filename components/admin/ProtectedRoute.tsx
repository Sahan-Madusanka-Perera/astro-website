'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[100svh] flex-col items-center justify-center gap-4 bg-void">
        <Loader2 className="h-5 w-5 animate-spin text-azure-lit" />
        <p className="label-chart">Checking your session</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
