'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-theme-bg flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-lg"
      >
        <div className="text-theme-accent text-8xl font-bold mb-4" style={{ fontFamily: 'var(--font-playfair)' }}>
          404
        </div>
        <h1 className="text-3xl font-semibold text-theme-dark mb-4" style={{ fontFamily: 'var(--font-playfair)' }}>
          Page Not Found
        </h1>
        <p className="text-theme-muted mb-8 leading-relaxed">
          The page you are looking for might have been removed, had its name changed,
          or is temporarily unavailable. Let us help you find your way back.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/"
            className="px-8 py-3 bg-theme-accent text-[#2C1E18] font-medium rounded-lg hover:bg-[#b8964f] transition-colors"
          >
            Go Home
          </Link>
          <Link
            href="/shop"
            className="px-8 py-3 border border-theme-accent text-theme-accent font-medium rounded-lg hover:bg-theme-accent/10 transition-colors"
          >
            Browse Shop
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
