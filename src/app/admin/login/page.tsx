/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Lock, Mail, ArrowRight, Sparkles, Home, MessageCircle, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeChannel, setActiveChannel] = useState<'WHATSAPP' | 'SMS'>('WHATSAPP');
  const [sendingChannel, setSendingChannel] = useState<'WHATSAPP' | 'SMS' | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [maskedPhone, setMaskedPhone] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSendAdminOtp = async (channel: 'WHATSAPP' | 'SMS') => {
    if (!email) return;
    setSendingChannel(channel);
    setActiveChannel(channel);
    try {
      const res = await fetch('/api/auth/2fa/login-otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), channel }),
      });
      const data = await res.json().catch(() => ({}));
      if (data?.cooldownSeconds) {
        setCooldown(data.cooldownSeconds);
      }
      if (res.ok && data?.success) {
        setCooldown(data.cooldownSeconds || 30);
        if (data.maskedPhone) setMaskedPhone(data.maskedPhone);
        toast.success('6-digit code sent to your WhatsApp!');
      } else {
        toast.error(data.error || 'Failed to dispatch verification code');
      }
    } catch {
      toast.error('Network error dispatching code');
    } finally {
      setSendingChannel(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }
    if (requires2FA && totpCode.trim().length < 6) {
      toast.error('Please enter your 6-digit verification code or backup code');
      return;
    }
    setLoading(true);
    try {
      const res = await signIn('credentials', {
        redirect: false,
        email: email.trim().toLowerCase(),
        password,
        ...(requires2FA ? { totpCode: totpCode.trim() } : {}),
      });

      if (res?.error) {
        if (res.error.includes('2FA_REQUIRED')) {
          setRequires2FA(true);
          handleSendAdminOtp('WHATSAPP');
          toast.info('Please enter your 2FA verification code to continue');
        } else {
          toast.error(res.error || 'Invalid credentials');
        }
      } else {
        toast.success('Authenticated to Executive Suite');
        router.push('/admin');
        router.refresh();
      }
    } catch {
      toast.error('Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#221814] flex flex-col justify-between p-4 sm:p-6 relative font-sans">
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
              <label htmlFor="admin-email" className="block text-[11px] font-black uppercase tracking-wider text-[#7A6354] mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  id="admin-email"
                  name="email"
                  autoComplete="email"
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
              <label htmlFor="admin-password" className="block text-[11px] font-black uppercase tracking-wider text-[#7A6354] mb-1.5">
                Master Passphrase
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  id="admin-password"
                  name="password"
                  autoComplete="current-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-amber-300/60 focus:outline-none focus:border-[#B88E4B] text-xs font-medium shadow-2xs transition-colors"
                />
              </div>
            </div>

            {requires2FA && (
              <div className="space-y-3 pt-1">
                {/* Official WhatsApp Notification Card */}
                <div className="relative overflow-hidden rounded-xl border border-emerald-500/40 bg-gradient-to-br from-emerald-50 via-emerald-100/30 to-white p-3.5 shadow-2xs">
                  <div className="flex items-start gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <MessageCircle size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-700 text-white px-2 py-0.5 rounded-full">
                          WhatsApp OTP
                        </span>
                        {maskedPhone ? (
                          <span className="text-[11px] font-mono font-bold text-emerald-950">
                            {maskedPhone}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs font-bold text-emerald-950 mt-1">
                        Code Sent via WhatsApp!
                      </p>
                      <p className="text-[11px] text-emerald-800/90 mt-0.5 leading-snug">
                        Fahad Ali Interior ka official 6-digit verification code aapke WhatsApp par send ho chuka hai.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="admin-totp" className="block text-[11px] font-black uppercase tracking-wider text-[#7A6354] mb-1.5">
                    6-Digit Verification Code
                  </label>
                  <div className="relative">
                    <ShieldCheck size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B88E4B]" />
                    <input
                      id="admin-totp"
                      name="totpCode"
                      autoComplete="one-time-code"
                      type="text"
                      maxLength={8}
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\s/g, '').slice(0, 8))}
                      placeholder="000000"
                      required
                      autoFocus
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border-2 border-[#B88E4B] focus:outline-none text-xs font-mono font-bold tracking-widest shadow-2xs transition-colors"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-stone-500 mt-1 px-1">
                    <span>
                      {cooldown > 0 ? (
                        <>Resend code in <strong className="font-mono text-[#8C6239]">{cooldown}s</strong></>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSendAdminOtp('WHATSAPP')}
                          disabled={sendingChannel !== null}
                          className="font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw size={10} /> Resend WhatsApp Code
                        </button>
                      )}
                    </span>
                    <span>Backup codes accepted</span>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] hover:brightness-110 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-98 disabled:opacity-70 mt-2"
            >
              {loading ? (
                <span>Verifying Access...</span>
              ) : (
                <>
                  <span>{requires2FA ? 'Verify 2FA & Enter' : 'Authenticate Session'}</span>
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
