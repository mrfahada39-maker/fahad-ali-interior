'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AdminDashboard from '@/components/AdminDashboard';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [hasAdminCookie, setHasAdminCookie] = useState<boolean | null>(null);

  useEffect(() => {
    // Only check the httpOnly admin cookie presence via document.cookie
    // (localStorage check removed — tokens are httpOnly cookies only for security)
    const hasToken =
      typeof window !== 'undefined' &&
      document.cookie.includes('fai_admin_token=');
    setHasAdminCookie(hasToken);

    if (status === 'unauthenticated' && !hasToken) {
      router.replace('/admin/login?next=/admin');
    } else if (status === 'authenticated') {
      const role = String((session?.user as { role?: string })?.role ?? '').toUpperCase();
      if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && !hasToken) {
        router.replace('/dashboard');
      }
    }
  }, [status, session, router]);

  if (status === 'loading' && hasAdminCookie === null) {
    return null;
  }

  if (status === 'unauthenticated' && !hasAdminCookie) {
    return null;
  }

  return <AdminDashboard />;
}

