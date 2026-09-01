'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';
import { ensureEnterpriseTokens } from '@/hooks/use-enterprise-auth-sync';

interface AdminLoginGateProps {
  onLoginSuccess: () => void;
  error?: string | null;
}

export default function AdminLoginGate({ onLoginSuccess, error }: AdminLoginGateProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter your email and password');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Direct High-Priority Executive Authentication
      const loginRes = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await loginRes.json().catch(() => null);

      if (!loginRes.ok || !data?.success) {
        toast.error(data?.error || 'Invalid executive credentials');
        setSubmitting(false);
        return;
      }

      if (data?.token) {
        setEnterpriseTokens(data.token, data.token);
        try {
          localStorage.setItem('fai_admin_token', data.token);
          sessionStorage.setItem('fai_admin_token', data.token);
          document.cookie = `fai_admin_token=${data.token}; path=/; max-age=2592000; SameSite=Lax`;
        } catch {}
      }

      // 2. Background NextAuth sync
      signIn('credentials', { email: email.trim(), password, redirect: false }).catch(() => {});

      toast.success('Executive Command Center Unlocked!');
      onLoginSuccess();
    } catch {
      toast.error('Authentication failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#221814] flex flex-col items-center justify-center p-4 sm:p-6 select-none relative overflow-hidden">
      
      {/* Ambient Warm Champagne Glow */}
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.15)_0%,transparent_70%)]" />

      {/* Main Luxury Login Card */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-3xl border-2 border-[#D4AF37]/50 p-6 sm:p-8 shadow-[0_20px_50px_rgba(44,30,24,0.08)] space-y-6">
        
        {/* Top Header & Crown Monogram */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-[#DFB86C] via-[#C9A24D] to-[#B38738] flex items-center justify-center shadow-[0_10px_25px_rgba(184,142,75,0.3)] border border-white/60">
            <ShieldCheck size={32} className="text-white drop-shadow-xs" />
          </div>

          <div className="space-y-1">
            <h1 className="font-serif font-black text-xl sm:text-2xl text-[#221814] tracking-tight">
              FAHAD ALI & INTERIOR
            </h1>
            <p className="text-xs font-serif italic text-[#8C6239] uppercase tracking-widest font-semibold">
              Executive Atelier Command Center
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
              {error}
            </div>
          )}
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-serif font-bold uppercase tracking-wider text-[#7A6048]">
              Executive Email
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A68254]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@fahadali.com"
                required
                className="w-full h-12 pl-11 pr-4 bg-[#FAF6F0] border border-[#E7DDD0] focus:border-[#B88E4B] rounded-xl text-sm font-medium text-[#221814] placeholder:text-stone-400 focus:outline-none transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-serif font-bold uppercase tracking-wider text-[#7A6048]">
              Security Key / Password
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A68254]" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full h-12 pl-11 pr-11 bg-[#FAF6F0] border border-[#E7DDD0] focus:border-[#B88E4B] rounded-xl text-sm font-medium text-[#221814] placeholder:text-stone-400 focus:outline-none transition-all shadow-2xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A68254] hover:text-[#221814] transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full h-12 mt-2 bg-gradient-to-r from-[#B88E4B] via-[#C9A24D] to-[#B88E4B] hover:brightness-105 text-white font-serif font-bold text-sm tracking-wider uppercase rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Unlock Command Center</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Back Link */}
        <div className="pt-2 text-center border-t border-[#EAE0D5]">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-serif text-[#8C6239] hover:text-[#221814] transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Return to Storefront Website</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
