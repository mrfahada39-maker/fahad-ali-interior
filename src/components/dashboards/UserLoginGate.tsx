'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, Home, Sparkles, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface UserLoginGateProps {
  onLoginSuccess?: () => void;
}

export default function UserLoginGate({ onLoginSuccess }: UserLoginGateProps) {
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
      const res = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (res?.error) {
        toast.error(res.error || 'Invalid client credentials. Please check your password.');
        setSubmitting(false);
        return;
      }

      toast.success('Welcome back! Unlocking your VIP Client Dashboard...');
      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        window.location.reload();
      }
    } catch {
      toast.error('Authentication failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#221814] flex flex-col items-center justify-center p-4 sm:p-6 select-none relative overflow-hidden">
      
      {/* Ambient Warm Champagne Glow */}
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.18)_0%,transparent_70%)]" />

      {/* Main Luxury Login Card */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-3xl border-2 border-[#D4AF37]/40 p-6 sm:p-8 shadow-[0_20px_50px_rgba(44,30,24,0.08)] space-y-6">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#FAF5EE] border border-[#B88E4B]/40 text-[#B88E4B] shadow-2xs">
            <UserCheck size={28} className="stroke-[1.8]" />
          </div>
          <div>
            <div className="flex items-center justify-center gap-1.5 text-xs uppercase tracking-widest text-[#B88E4B] font-bold">
              <Sparkles size={12} />
              <span>VIP Client Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#221814] font-serif tracking-tight mt-1">
              Fahad Ali Interior
            </h1>
          </div>
          <p className="text-xs text-[#7A6354]">
            Please enter your client credentials to access your bespoke orders, wishlist, and VIP concierge.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-xs font-bold text-[#7A6354] uppercase tracking-wider">
              Account Email
            </Label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E8A78]" size={16} />
              <Input
                id="email"
                type="email"
                required
                placeholder="client@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-11 bg-[#FAF7F2] border-[#E2D9CD] focus:border-[#B88E4B] text-[#221814] rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-bold text-[#7A6354] uppercase tracking-wider">
                Password
              </Label>
              <Link href="/reset-password" className="text-[11px] text-[#B88E4B] hover:underline font-semibold">
                Forgot password?
              </Link>
            </div>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E8A78]" size={16} />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-11 bg-[#FAF7F2] border-[#E2D9CD] focus:border-[#B88E4B] text-[#221814] rounded-xl text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9E8A78] hover:text-[#221814] cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full h-11 bg-gradient-to-r from-[#1F1612] via-[#2A1D17] to-[#1F1612] hover:brightness-125 text-[#F5D77F] font-bold rounded-xl text-sm transition-all shadow-md mt-2 flex items-center justify-center gap-2 cursor-pointer border border-[#B88E4B]/40"
          >
            {submitting ? 'Authenticating VIP Portal...' : 'Unlock VIP Dashboard'}
            {!submitting && <ArrowRight size={16} />}
          </Button>
        </form>

        {/* Storefront return link */}
        <div className="border-t border-[#E7DDD0] pt-4 text-center">
          <Link
            href="/"
            className="text-xs text-[#7A6354] hover:text-[#221814] font-medium flex items-center justify-center gap-1.5 group"
          >
            <Home size={14} className="text-[#B88E4B] group-hover:scale-110 transition-transform" />
            <span>Return to Storefront Catalog</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
