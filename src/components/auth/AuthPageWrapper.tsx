'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface AuthPageWrapperProps {
  children: React.ReactNode;
}

/**
 * Wrapper component for authentication pages (login/signup).
 * Handles automatic redirect to dashboard if user is already authenticated.
 * Shows loading spinner during authentication check.
 */
export function AuthPageWrapper({ children }: AuthPageWrapperProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, authLoading, router]);

  if (authLoading || (!authLoading && user)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
