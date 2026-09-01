'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import StoreShell from '@/components/layout/StoreShell';
import OrdersPageClient from './OrdersPageClient';

export default function OrdersPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/?auth=login&next=/orders');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <StoreShell>
        <main className="min-h-screen bg-theme-bg pt-24 flex items-center justify-center">
          <p className="text-theme-muted">Loading orders...</p>
        </main>
      </StoreShell>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <StoreShell>
      <OrdersPageClient />
    </StoreShell>
  );
}
