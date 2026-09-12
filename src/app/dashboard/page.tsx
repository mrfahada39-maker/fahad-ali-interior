'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import UserDashboard from '@/components/UserDashboard';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const role = (session?.user as { role?: string })?.role;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/?auth=login&next=/dashboard');
    } else if (status === 'authenticated') {
      const rUpper = role?.toUpperCase();
      if (rUpper === 'ADMIN' || rUpper === 'SUPER_ADMIN') {
        router.replace('/admin');
      }
    }
  }, [status, role, router]);

  if (status === 'loading' || status === 'unauthenticated') {
    return null;
  }

  return <UserDashboard />;
}
