'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import UserDashboard from '@/components/UserDashboard';

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  const role = (session?.user as { role?: string })?.role;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (status === 'unauthenticated') {
      router.replace('/?auth=login&next=/dashboard');
    } else if (status === 'authenticated') {
      const rUpper = role?.toUpperCase();
      if (rUpper === 'ADMIN' || rUpper === 'SUPER_ADMIN') {
        router.replace('/admin');
      }
    }
  }, [mounted, status, role, router]);

  if (!mounted || status === 'loading' || status === 'unauthenticated') {
    return null;
  }

  return <UserDashboard />;
}
