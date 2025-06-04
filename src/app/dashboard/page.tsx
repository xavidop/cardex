'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  useEffect(() => {
    // For now, redirect to scan page as the primary action
    router.replace('/dashboard/scan');
  }, [router]);

  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold font-headline">Welcome to your Cardex Dashboard</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Manage your Pokémon card collection with ease.
      </p>
      <p className="mt-2 text-md text-muted-foreground">Redirecting to card scanner...</p>
    </div>
  );
}
