/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Mail,
  Lock,
  User,
  Phone,
  Shield,
  Loader2,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  MessageSquare,
  MessageCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { apiFetchJsonWithStatus, setEnterpriseTokens } from '@/lib/api-client';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Passed from server — true only when GOOGLE_CLIENT_ID/SECRET are configured */
  googleEnabled?: boolean;
}

function GoogleButton({
  enabled,
  loading,
  onSignIn,
}: {
  enabled?: boolean;
  loading: boolean;
  onSignIn: () => Promise<void>;
}) {
  if (!enabled) return null;
  return (
    <button
      type="button"
      disabled={loading}
      onClick={onSignIn}
      className="w-full flex items-center justify-center gap-2.5 sm:gap-3 bg-white hover:bg-[#FAF7F2] text-[#221814] border border-[#E2D6C8] hover:border-[#B88E4B] rounded-xl h-11 sm:h-11.5 font-sans font-bold text-xs sm:text-sm tracking-wide transition-all shadow-2xs hover:shadow-md disabled:opacity-50 cursor-pointer group mt-3"
    >
      <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
      <span>Continue with Google</span>
    </button>
  );
}

function getSafeRedirectUrl(rawUrl: string | null | undefined, fallback: string = '/dashboard'): string {
  if (!rawUrl || typeof rawUrl !== 'string') return fallback;
  const trimmed = rawUrl.trim();
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.startsWith('/\\') && !trimmed.includes(':')) {
    return trimmed;
  }
  return fallback;
}

export default function AuthModal({ isOpen, onClose, googleEnabled = true }: AuthModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });

  const [twoFactorStep, setTwoFactorStep] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [twoFactorChannel, setTwoFactorChannel] = useState<'WHATSAPP' | 'SMS'>('WHATSAPP');
  const [sendingChannel, setSendingChannel] = useState<'WHATSAPP' | 'SMS' | null>(null);
  const [twoFactorCooldown, setTwoFactorCooldown] = useState(0);
  const [twoFactorMaskedPhone, setTwoFactorMaskedPhone] = useState('');

  // Cooldown timer ticker
  useEffect(() => {
    if (twoFactorCooldown <= 0) return;
    const timer = setInterval(() => {
      setTwoFactorCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [twoFactorCooldown]);

  async function handleSendLoginOtp(channel: 'WHATSAPP' | 'SMS') {
    if (!loginData.email) return;
    setSendingChannel(channel);
    setTwoFactorChannel(channel);
    try {
      const res = await fetch('/api/auth/2fa/login-otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginData.email, channel }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success) {
        setTwoFactorCooldown(data.cooldownSeconds || 45);
        if (data.maskedPhone) setTwoFactorMaskedPhone(data.maskedPhone);
        toast.success('6-digit code sent to your WhatsApp!');
      } else {
        toast.error(data.error || 'Failed to dispatch verification code');
      }
    } catch {
      toast.error('Network error dispatching verification code');
    } finally {
      setSendingChannel(null);
    }
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    try {
      await signIn('google', { callbackUrl: window.location.href });
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!loginData.email.trim() || !loginData.password) {
      toast.error('Please enter your email and password');
      return;
    }

    setLoading(true);
    try {
      const authRes = await signIn('credentials', {
        email: loginData.email,
        password: loginData.password,
        redirect: false,
      });

      if (authRes?.error) {
        if (authRes.error.includes('2FA_REQUIRED')) {
          setTwoFactorStep(true);
          handleSendLoginOtp('WHATSAPP');
          return;
        }
        if (authRes.error.toLowerCase().includes('verify')) {
          toast.error(authRes.error);
        } else {
          toast.error('Invalid email or password. Please check your credentials.');
        }
      } else {
        setEnterpriseTokens('present', '');
        toast.success('Welcome back to Fahad Ali Interior!');
        onClose();
        const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const fallback = typeof window !== 'undefined' && window.location.pathname === '/checkout' ? '/checkout' : '/dashboard';
        const nextUrl = getSafeRedirectUrl(searchParams?.get('next'), fallback);
        if (typeof window !== 'undefined') {
          window.location.href = nextUrl;
        } else {
          router.push(nextUrl);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleTwoFactorVerify() {
    if (twoFactorCode.length < 6 && twoFactorCode.length !== 8) {
      toast.error('Enter a valid 6-digit code or 8-character backup code');
      return;
    }
    setTwoFactorLoading(true);
    try {
      const authRes = await signIn('credentials', {
        email: loginData.email,
        password: loginData.password,
        totpCode: twoFactorCode,
        redirect: false,
      });

      if (authRes?.error) {
        toast.error('Invalid verification code. Try again.');
      } else {
        setEnterpriseTokens('present', '');
        toast.success('Welcome back!');
        onClose();
        const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const fallback = typeof window !== 'undefined' && window.location.pathname === '/checkout' ? '/checkout' : '/dashboard';
        const nextUrl = getSafeRedirectUrl(searchParams?.get('next'), fallback);
        if (typeof window !== 'undefined') {
          window.location.href = nextUrl;
        } else {
          router.push(nextUrl);
        }
      }
    } finally {
      setTwoFactorLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!registerData.name.trim() || !registerData.email.trim() || !registerData.password) {
      toast.error('Please complete all required fields');
      return;
    }
    if (registerData.password !== registerData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (registerData.password.length < 10 || !/[A-Za-z]/.test(registerData.password) || !/[0-9]/.test(registerData.password)) {
      toast.error('Password must be at least 10 characters and include both letters and numbers');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerData.name,
          email: registerData.email,
          phone: registerData.phone,
          password: registerData.password,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || err.message || 'Registration failed');
        return;
      }
      toast.success('VIP Account created successfully! Please sign in.');
      setActiveTab('login');
      setLoginData({ email: registerData.email, password: registerData.password });
      setRegisterData({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="VIP Authentication Portal"
          className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 md:p-6 overflow-y-auto bg-[#221814]/40 backdrop-blur-sm transition-all duration-300"
        >
          {/* Backdrop Click Dismiss */}
          <div
            className="fixed inset-0 -z-10"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Exact Matching Luxury Ivory & Imperial Gold Palette Container (Like SearchModal) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{ backgroundColor: '#FCFAF7' }}
            className="relative w-full max-w-[440px] sm:max-w-[480px] max-h-[92vh] bg-[#FCFAF7] rounded-[28px] border-2 border-[#D4AF37]/50 shadow-[0_20px_70px_rgba(184,142,75,0.20),0_4px_25px_rgba(44,30,24,0.08)] p-5 sm:p-7 my-auto flex flex-col gap-4.5 z-20 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Brand Header (Exact Match to SearchModal Image 1) */}
            <div className="relative flex items-center justify-center pb-3.5 border-b border-[#E2D6C8]/80 text-center w-full shrink-0">
              <div className="flex flex-col items-center justify-center text-center px-8">
                <span className="font-serif font-black text-xl sm:text-2xl md:text-[25px] tracking-tight text-[#221814] uppercase leading-tight whitespace-nowrap">
                  FAHAD ALI <span className="font-serif italic font-normal text-[#C9A24D] mx-1 sm:mx-1.5 text-[1.05em]">&</span> <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] bg-clip-text text-transparent font-serif">INTERIOR</span>
                </span>
                <span className="text-[9px] sm:text-[10px] tracking-[0.35em] font-bold text-[#8C6239] uppercase mt-0.5">
                  {twoFactorStep ? 'SECURITY VERIFICATION PROTOCOL' : 'HAUTE COUTURE VIP PORTAL'}
                </span>
              </div>

              {/* Matching Round Close Button */}
              <button
                onClick={onClose}
                className="absolute right-0 top-1/2 -translate-y-1/2 w-8.5 h-8.5 rounded-full bg-white/80 hover:bg-white border border-[#E2D6C8] hover:border-[#B88E4B] text-[#7A6354] hover:text-[#221814] flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                title="Close"
                aria-label="Close authentication modal"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto overscroll-contain pr-0.5 space-y-4">
              {twoFactorStep ? (
                /* ── 2FA Screen with SMS & WhatsApp OTP ── */
                <div className="space-y-3.5 py-1">
                  {/* Dynamic Animated WhatsApp Delivery Card */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="relative overflow-hidden rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-br from-emerald-50 via-emerald-100/50 to-white p-3.5 sm:p-4 text-left shadow-sm"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />

                    <div className="flex items-start gap-3 relative z-10">
                      {/* Animated WhatsApp Icon with Ping Ring */}
                      <div className="relative shrink-0 mt-0.5">
                        <motion.div
                          animate={{ scale: [1, 1.08, 1] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                          className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-md shadow-emerald-600/30"
                        >
                          <MessageCircle size={22} />
                        </motion.div>
                        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white shadow-xs" />
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9.5px] font-black uppercase tracking-wider bg-emerald-700 text-white px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-pulse" />
                            WhatsApp Par Code Sent
                          </span>
                          {twoFactorMaskedPhone && (
                            <span className="text-[11px] font-mono font-bold text-emerald-950">
                              {twoFactorMaskedPhone}
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-xs sm:text-sm text-emerald-950 mt-1 leading-snug">
                          Apna WhatsApp Kholiye — Code Wahan Aaya Hai!
                        </h4>

                        <p className="text-[11px] text-emerald-800/95 mt-0.5 leading-relaxed">
                          Aapke WhatsApp par Fahad Ali Interior ka official <strong>6-digit OTP code</strong> send ho gaya hai. Code dekh kar niche enter karein.
                        </p>

                        <div className="mt-2 pt-1.5 border-t border-emerald-200/60 flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-emerald-800">
                            💬 Sender: <strong>Fahad Ali Interior</strong>
                          </span>
                          <a
                            href="https://wa.me/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-900 bg-emerald-200/70 hover:bg-emerald-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                          >
                            Open WhatsApp ↗
                          </a>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* 6-Digit Code Input */}
                  <div className="space-y-1">
                    <label htmlFor="twoFactorCode" className="sr-only">
                      Two-Factor Authentication Code
                    </label>
                    <input
                      id="twoFactorCode"
                      name="twoFactorCode"
                      autoComplete="one-time-code"
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value.replace(/\s/g, '').slice(0, 8))}
                      placeholder="000000"
                      maxLength={8}
                      className="w-full bg-white border-2 border-[#E2D6C8] focus:border-[#B88E4B] text-[#221814] rounded-xl sm:rounded-2xl text-center text-xl sm:text-2xl tracking-[0.45em] font-mono font-black h-12 sm:h-13 outline-none shadow-2xs transition-colors"
                      autoFocus
                    />
                    <div className="flex items-center justify-between text-[10px] text-[#8C7667] px-1 pt-0.5">
                      <span>
                        {twoFactorCooldown > 0 ? (
                          <>
                            Resend code in{' '}
                            <strong className="font-mono text-[#8C6239]">{twoFactorCooldown}s</strong>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSendLoginOtp('WHATSAPP')}
                            disabled={sendingChannel !== null}
                            className="font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <RefreshCw size={10} /> Resend WhatsApp Code
                          </button>
                        )}
                      </span>
                      <span>Backup codes also accepted</span>
                    </div>
                  </div>

                  <button
                    onClick={handleTwoFactorVerify}
                    disabled={twoFactorLoading || (twoFactorCode.length !== 6 && twoFactorCode.length !== 8)}
                    className="w-full bg-[#221814] hover:bg-[#38261E] text-[#F5D77F] font-sans font-bold text-xs tracking-widest uppercase rounded-xl h-11 sm:h-12 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
                  >
                    {twoFactorLoading ? (
                      <>
                        <Loader2 size={15} className="animate-spin" /> Verifying Code...
                      </>
                    ) : (
                      <>
                        <span>Confirm & Enter</span> <ArrowRight size={14} />
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setTwoFactorStep(false);
                      setTwoFactorToken('');
                      setTwoFactorCode('');
                    }}
                    className="w-full text-center text-[11px] sm:text-xs font-bold text-[#8C6239] hover:text-[#221814] tracking-wider uppercase transition-colors pt-1 cursor-pointer"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              ) : (
                /* ── Standard Auth Flow ── */
                <div className="space-y-4">
                  {/* Matching Segmented Switch */}
                  <div className="bg-[#EFEAE2] p-1.5 rounded-2xl grid grid-cols-2 gap-1.5 border border-[#E2D6C8]">
                    <button
                      type="button"
                      onClick={() => setActiveTab('login')}
                      className={`py-2 sm:py-2.5 rounded-xl font-sans font-bold text-xs tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === 'login'
                          ? 'bg-[#221814] text-[#F5D77F] shadow-sm'
                          : 'text-[#7A6354] hover:text-[#221814] hover:bg-white/60'
                        }`}
                      data-testid="login-tab"
                    >
                      <Lock size={13} />
                      <span>Sign In</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('register')}
                      className={`py-2 sm:py-2.5 rounded-xl font-sans font-bold text-xs tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === 'register'
                          ? 'bg-[#221814] text-[#F5D77F] shadow-sm'
                          : 'text-[#7A6354] hover:text-[#221814] hover:bg-white/60'
                        }`}
                      data-testid="register-tab"
                    >
                      <User size={13} />
                      <span>Register VIP</span>
                    </button>
                  </div>

                  {activeTab === 'login' ? (
                    /* ── Sign In Form ── */
                    <form onSubmit={handleLogin} className="space-y-3.5">
                      {/* Email Field */}
                      <div className="space-y-1">
                        <label htmlFor="login-email-input" className="block text-[10.5px] sm:text-[11px] font-sans font-bold tracking-wider text-[#7A6354] uppercase">
                          Email Address *
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9C8272]" size={15} />
                          <input
                            id="login-email-input"
                            name="email"
                            autoComplete="email"
                            type="email"
                            required
                            value={loginData.email}
                            onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                            placeholder="your.email@domain.com"
                            className="w-full bg-white border border-[#E2D6C8] focus:border-[#B88E4B] text-[#221814] placeholder:text-[#9C8272] rounded-xl pl-10 pr-4 h-11 sm:h-11.5 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-[#B88E4B]/15 transition-all shadow-2xs"
                            data-testid="login-email"
                          />
                        </div>
                      </div>

                      {/* Password Field */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label htmlFor="login-password-input" className="block text-[10.5px] sm:text-[11px] font-sans font-bold tracking-wider text-[#7A6354] uppercase">
                            Password *
                          </label>
                          <a
                            href="/reset-password"
                            onClick={(e) => {
                              e.preventDefault();
                              onClose();
                              router.push('/reset-password');
                            }}
                            className="text-[10.5px] font-bold text-[#8C6239] hover:text-[#221814] transition-colors"
                          >
                            Forgot Password?
                          </a>
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9C8272]" size={15} />
                          <input
                            id="login-password-input"
                            name="password"
                            autoComplete="current-password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={loginData.password}
                            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                            placeholder="••••••••••••"
                            className="w-full bg-white border border-[#E2D6C8] focus:border-[#B88E4B] text-[#221814] placeholder:text-[#9C8272] rounded-xl pl-10 pr-10 h-11 sm:h-11.5 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-[#B88E4B]/15 transition-all shadow-2xs"
                            data-testid="login-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9C8272] hover:text-[#221814] p-1 cursor-pointer transition-colors"
                            title={showPassword ? 'Hide password' : 'Show password'}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-[#221814] via-[#2F211B] to-[#221814] hover:from-[#38261E] hover:to-[#38261E] text-[#F5D77F] font-sans font-bold text-xs sm:text-sm tracking-widest uppercase rounded-xl h-11.5 sm:h-12 flex items-center justify-center gap-2 shadow-[0_6px_20px_rgba(34,24,20,0.25)] hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 mt-2"
                        data-testid="login-button"
                      >
                        {loading ? (
                          <>
                            <Loader2 size={15} className="animate-spin" />
                            <span>Signing In...</span>
                          </>
                        ) : (
                          <>
                            <span>Access VIP Account</span>
                            <ArrowRight size={14} />
                          </>
                        )}
                      </button>

                      {/* Google Sign In Divider */}
                      <div className="relative my-3 text-center">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-[#E2D6C8]" />
                        </div>
                        <span className="relative bg-[#FCFAF7] px-2.5 text-[10px] sm:text-[11px] font-bold text-[#8C6239] uppercase tracking-wider">
                          Or continue with
                        </span>
                      </div>

                      <GoogleButton enabled={googleEnabled} loading={loading} onSignIn={handleGoogleSignIn} />
                    </form>
                  ) : (
                    /* ── Register VIP Form ── */
                    <form onSubmit={handleRegister} className="space-y-3">
                      {/* Full Name */}
                      <div className="space-y-1">
                        <label htmlFor="register-name-input" className="block text-[10.5px] sm:text-[11px] font-sans font-bold tracking-wider text-[#7A6354] uppercase">
                          Full Name *
                        </label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9C8272]" size={15} />
                          <input
                            id="register-name-input"
                            name="name"
                            autoComplete="name"
                            type="text"
                            required
                            value={registerData.name}
                            onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                            placeholder="Muhammad Fahad Ali"
                            className="w-full bg-white border border-[#E2D6C8] focus:border-[#B88E4B] text-[#221814] placeholder:text-[#9C8272] rounded-xl pl-10 pr-4 h-10.5 sm:h-11 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-[#B88E4B]/15 transition-all shadow-2xs"
                            data-testid="register-name"
                          />
                        </div>
                      </div>

                      {/* Email Address */}
                      <div className="space-y-1">
                        <label htmlFor="register-email-input" className="block text-[10.5px] sm:text-[11px] font-sans font-bold tracking-wider text-[#7A6354] uppercase">
                          Email Address *
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9C8272]" size={15} />
                          <input
                            id="register-email-input"
                            name="email"
                            autoComplete="email"
                            type="email"
                            required
                            value={registerData.email}
                            onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                            placeholder="your.email@domain.com"
                            className="w-full bg-white border border-[#E2D6C8] focus:border-[#B88E4B] text-[#221814] placeholder:text-[#9C8272] rounded-xl pl-10 pr-4 h-10.5 sm:h-11 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-[#B88E4B]/15 transition-all shadow-2xs"
                            data-testid="register-email"
                          />
                        </div>
                      </div>

                      {/* Phone Number */}
                      <div className="space-y-1">
                        <label htmlFor="register-phone-input" className="block text-[10.5px] sm:text-[11px] font-sans font-bold tracking-wider text-[#7A6354] uppercase">
                          Mobile Contact
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9C8272]" size={15} />
                          <input
                            id="register-phone-input"
                            name="phone"
                            autoComplete="tel"
                            type="tel"
                            value={registerData.phone}
                            onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                            placeholder="+92 300 1234567"
                            className="w-full bg-white border border-[#E2D6C8] focus:border-[#B88E4B] text-[#221814] placeholder:text-[#9C8272] rounded-xl pl-10 pr-4 h-10.5 sm:h-11 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-[#B88E4B]/15 transition-all shadow-2xs"
                          />
                        </div>
                      </div>

                      {/* Dual Password Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                        <div className="space-y-1">
                          <label htmlFor="register-password-input" className="block text-[10.5px] sm:text-[11px] font-sans font-bold tracking-wider text-[#7A6354] uppercase">
                            Password *
                          </label>
                          <div className="relative">
                            <input
                              id="register-password-input"
                              name="password"
                              autoComplete="new-password"
                              type={showPassword ? 'text' : 'password'}
                              required
                              minLength={10}
                              value={registerData.password}
                              onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                              placeholder="Min 10 chars (A-Z, 0-9)"
                              className="w-full bg-white border border-[#E2D6C8] focus:border-[#B88E4B] text-[#221814] placeholder:text-[#9C8272] rounded-xl pl-3 pr-8 h-10.5 sm:h-11 text-xs font-medium outline-none focus:ring-2 focus:ring-[#B88E4B]/15 transition-all shadow-2xs"
                              data-testid="register-password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9C8272] hover:text-[#221814] p-1 cursor-pointer transition-colors"
                              title={showPassword ? 'Hide password' : 'Show password'}
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label htmlFor="register-confirm-password-input" className="block text-[10.5px] sm:text-[11px] font-sans font-bold tracking-wider text-[#7A6354] uppercase">
                            Confirm *
                          </label>
                          <div className="relative">
                            <input
                              id="register-confirm-password-input"
                              name="confirmPassword"
                              autoComplete="new-password"
                              type={showConfirmPassword ? 'text' : 'password'}
                              required
                              minLength={10}
                              value={registerData.confirmPassword}
                              onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                              placeholder="Confirm password"
                              className="w-full bg-white border border-[#E2D6C8] focus:border-[#B88E4B] text-[#221814] placeholder:text-[#9C8272] rounded-xl pl-3 pr-8 h-10.5 sm:h-11 text-xs font-medium outline-none focus:ring-2 focus:ring-[#B88E4B]/15 transition-all shadow-2xs"
                              data-testid="register-confirm-password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9C8272] hover:text-[#221814] p-1 cursor-pointer transition-colors"
                              title={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                            >
                              {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* VIP Member Perks Note */}
                      <div className="flex items-center gap-2 text-[10.5px] sm:text-[11px] font-medium text-[#7A6354] bg-[#F5EFEB] border border-[#E2D6C8] p-2.5 rounded-xl">
                        <CheckCircle2 size={14} className="text-emerald-700 shrink-0" />
                        <span>Includes 10% VIP welcome discount & bespoke concierge access.</span>
                      </div>

                      {/* Create Button */}
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-[#221814] via-[#2F211B] to-[#221814] hover:from-[#38261E] hover:to-[#38261E] text-[#F5D77F] font-sans font-bold text-xs sm:text-sm tracking-widest uppercase rounded-xl h-11.5 sm:h-12 flex items-center justify-center gap-2 shadow-[0_6px_20px_rgba(34,24,20,0.25)] hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 mt-2"
                        data-testid="create-account-button"
                      >
                        {loading ? (
                          <>
                            <Loader2 size={15} className="animate-spin" />
                            <span>Creating VIP Account...</span>
                          </>
                        ) : (
                          <>
                            <span>Register Membership</span>
                            <ArrowRight size={14} />
                          </>
                        )}
                      </button>

                      <GoogleButton enabled={googleEnabled} loading={loading} onSignIn={handleGoogleSignIn} />
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* Matching Luxury Subtle Footer */}
            <div className="pt-2 border-t border-[#E2D6C8]/80 text-center shrink-0">
              <p className="text-[9.5px] sm:text-[10px] font-sans font-medium text-[#8C6239]">
                🔒 256-Bit SSL Encrypted & Protected by Fahad Ali Interior Security Protocol.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
