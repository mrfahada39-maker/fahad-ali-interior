'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-theme-bg flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6 text-theme-accent" style={{ fontFamily: 'var(--font-playfair)' }}>
          Oops!
        </div>
        <h2 className="text-2xl font-semibold text-theme-dark mb-4">Something went wrong</h2>
        <p className="text-theme-muted mb-8">
          We encountered an unexpected error. Please try again or contact support if the issue persists.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="px-8 py-3 bg-theme-accent text-[#2C1E18] font-medium rounded-lg hover:bg-[#b8964f] transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-8 py-3 border border-theme-accent text-theme-accent font-medium rounded-lg hover:bg-theme-accent/10 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
