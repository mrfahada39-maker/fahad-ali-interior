'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Lock, Mail, ArrowRight, Sparkles, Home } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }
    setLoading(true);
    try {
      const res = await signIn('credentials', {
        redirect: false,
        email: email.trim().toLowerCase(),
        password,
      });

      if (res?.error) {
        toast.error(res.error || 'Invalid credentials');
      } else {
        toast.success('Authenticated to Executive Suite');
        router.push('/admin');
      }
    } catch {
      toast.error('Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#221814] flex flex-col justify-between p-4 sm:p-6 relative select-none font-sans">
      {/* Background Subtle Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-[#E7DDD0] text-xs font-bold text-[#7A6354] hover:text-[#B88E4B] hover:border-[#B88E4B] shadow-2xs transition-all"
        >
          <Home size={14} />
          <span>Storefront</span>
        </Link>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF5EE] border border-amber-300/60 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#8C6239]">
            SECURE PORTAL
          </span>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md mx-auto my-auto relative z-10">
        <div className="bg-gradient-to-br from-white via-[#FCFAF7] to-[#FAF5EE] border-[1.5px] border-amber-300/80 rounded-[28px] p-6 sm:p-8 shadow-[0_12px_40px_rgba(184,142,75,0.14)] relative overflow-hidden">
          
          <div className="text-center mb-7">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#B88E4B] via-[#D4AF37] to-[#996515] text-white flex items-center justify-center mx-auto mb-3 shadow-md border border-white/30">
              <ShieldCheck size={26} />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-black text-[#221814] uppercase tracking-tight">
              FAHAD ALI <span className="text-[#B88E4B] font-serif italic">&</span> INTERIOR
            </h1>
            <p className="text-xs font-serif italic text-[#7A6048] mt-1">
              Executive Administration & Master Control Suite
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-[#7A6354] mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@fahadaliinterior.com"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-amber-300/60 focus:outline-none focus:border-[#B88E4B] text-xs font-medium shadow-2xs transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-[#7A6354] mb-1.5">
                Master Passphrase
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-amber-300/60 focus:outline-none focus:border-[#B88E4B] text-xs font-medium shadow-2xs transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] hover:brightness-110 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-98 disabled:opacity-70 mt-2"
            >
              {loading ? (
                <span>Verifying Access...</span>
              ) : (
                <>
                  <span>Authenticate Session</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

        </div>
      </div>

      {/* Bottom Footer */}
      <div className="w-full text-center text-[11px] text-stone-500 font-serif italic relative z-10">
        © 2026 Fahad Ali Interior. Authorized Atelier Personnel Only.
      </div>
    </div>
  );
}
