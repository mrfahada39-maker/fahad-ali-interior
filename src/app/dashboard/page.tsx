'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';

const UserDashboard = dynamic(() => import('@/components/UserDashboard'), {
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-[#FCFAF7]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-[#B88E4B] border-t-transparent rounded-full animate-spin" />
        <p className="font-serif tracking-widest uppercase text-xs text-[#8C6239]">Loading Member Suite...</p>
      </div>
    </div>
  ),
  ssr: false,
});

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
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FCFAF7]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#B88E4B] border-t-transparent rounded-full animate-spin" />
          <p className="font-serif tracking-widest uppercase text-xs text-[#8C6239]">
            {status === 'loading' ? 'Loading Member Suite...' : 'Redirecting to Sign In...'}
          </p>
        </div>
      </div>
    );
  }

  return <UserDashboard />;
}
