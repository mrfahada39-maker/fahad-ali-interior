'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Smartphone,
  MessageCircle,
  Check,
  RefreshCw,
  AlertTriangle,
  Loader2,
  Lock,
  Edit3,
  Phone,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { toast } from 'sonner';
import { apiFetchJson } from '@/lib/api-client';

interface TwoFactorStatusResponse {
  enabled: boolean;
  phone?: string | null;
  maskedPhone?: string | null;
  authenticated?: boolean;
}

interface SendOtpResponse {
  success: boolean;
  token: string;
  channel: 'WHATSAPP' | 'SMS' | 'DEV_LOG';
  cooldownSeconds: number;
  maskedPhone: string;
  phone: string;
  devCode?: string;
  error?: string;
}

interface VerifyOtpResponse {
  success: boolean;
  enabled: boolean;
  channel: 'WHATSAPP' | 'SMS';
  phone: string;
  maskedPhone: string;
  message?: string;
  error?: string;
}

export default function TwoFactorSetup() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [registeredPhone, setRegisteredPhone] = useState<string>('');
  const [maskedPhone, setMaskedPhone] = useState<string>('');
  const [editingPhone, setEditingPhone] = useState(false);
  const [customPhoneInput, setCustomPhoneInput] = useState('');

  // Active setup flow
  const [setupStep, setSetupStep] = useState<'idle' | 'verify' | 'disable'>('idle');
  const [selectedChannel, setSelectedChannel] = useState<'SMS' | 'WHATSAPP'>('WHATSAPP');
  const [sendingChannel, setSendingChannel] = useState<'SMS' | 'WHATSAPP' | null>(null);
  const [challengeToken, setChallengeToken] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Verification & Disable state
  const [verifying, setVerifying] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  // ── Cooldown timer ticker ──
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // ── Load 2FA status and registered phone ──
  const loadStatus = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await apiFetchJson<TwoFactorStatusResponse>('/api/auth/2fa/status');
      setEnabled(Boolean(data?.enabled));
      if (data?.phone) {
        setRegisteredPhone(data.phone);
        setCustomPhoneInput(data.phone);
      }
      if (data?.maskedPhone) {
        setMaskedPhone(data.maskedPhone);
      }
    } catch {
      setEnabled(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // ── Send 6-digit OTP code via chosen channel ──
  const handleSendOtp = async (channel: 'SMS' | 'WHATSAPP') => {
    const targetPhone = customPhoneInput.trim() || registeredPhone.trim();
    if (!targetPhone) {
      toast.error('Baraye meherbani apna mobile number enter karein.');
      setEditingPhone(true);
      return;
    }

    setSendingChannel(channel);
    setSelectedChannel(channel);
    setErrorMessage('');

    try {
      const data = await apiFetchJson<SendOtpResponse>('/api/auth/2fa/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel,
          phone: targetPhone,
        }),
      });

      if (!data?.token) {
        const err = data?.error || 'Failed to dispatch verification code. Please try again.';
        setErrorMessage(err);
        toast.error(err);
        return;
      }

      setChallengeToken(data.token);
      setCooldown(data.cooldownSeconds || 45);
      if (data.maskedPhone) setMaskedPhone(data.maskedPhone);
      if (data.phone) setRegisteredPhone(data.phone);
      setOtpCode('');
      setSetupStep('verify');

      const channelName = channel === 'SMS' ? 'Cellular SMS' : 'WhatsApp';
      toast.success(`6-digit code ${channelName} par bhej diya gaya hai!`);

      setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'Failed to dispatch verification code.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setSendingChannel(null);
    }
  };

  // ── Verify 6-digit OTP and activate 2FA ──
  const handleVerifyOtp = async () => {
    if (otpCode.replace(/\D/g, '').length !== 6) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      toast.error('6-digit code enter karein');
      return;
    }

    setVerifying(true);
    setErrorMessage('');

    const targetPhone = customPhoneInput.trim() || registeredPhone.trim();

    try {
      const data = await apiFetchJson<VerifyOtpResponse>('/api/auth/2fa/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: targetPhone,
          token: challengeToken,
          code: otpCode.trim(),
          channel: selectedChannel,
        }),
      });

      if (!data?.success) {
        const err = data?.error || 'Invalid verification code. Please check and try again.';
        setErrorMessage(err);
        toast.error(err);
        return;
      }

      setEnabled(true);
      setSetupStep('idle');
      setEditingPhone(false);
      setOtpCode('');
      setChallengeToken('');
      if (data.maskedPhone) setMaskedPhone(data.maskedPhone);
      if (data.phone) setRegisteredPhone(data.phone);

      toast.success('Two-Step Verification successfully activated! 🎉');
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'Verification failed. Try again.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setVerifying(false);
    }
  };

  // ── Disable 2FA ──
  const handleDisable2Fa = async () => {
    setDisabling(true);
    setErrorMessage('');
    try {
      const data = await apiFetchJson<{ success: boolean; disabled: boolean }>(
        '/api/auth/2fa/disable',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: disablePassword }),
        }
      );

      if (data?.disabled || data?.success) {
        setEnabled(false);
        setSetupStep('idle');
        setDisablePassword('');
        toast.success('Two-Step Verification has been disabled.');
      } else {
        const err = 'Failed to disable 2-Step Verification.';
        setErrorMessage(err);
        toast.error(err);
      }
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'Failed to disable 2-step verification.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setDisabling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-[#B88E4B] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-5">
      {/* ── Section Title ── */}
      <div className="flex items-center justify-between border-b border-[#E7DDD0] pb-3">
        <div>
          <h2
            className="text-xl sm:text-2xl font-bold text-[#1F1612] flex items-center gap-2"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            <Shield className="w-5 h-5 text-[#B88E4B]" />
            Security Settings
          </h2>
          <p className="text-stone-500 text-xs mt-0.5">
            Two-Step Mobile OTP Verification (Official WhatsApp OTP)
          </p>
        </div>
        <span
          className={`text-[11px] font-bold px-3 py-1 rounded-full border transition-all ${
            enabled
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-xs'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}
        >
          {enabled ? '● ACTIVE' : '○ OFF'}
        </span>
      </div>

      {/* ── Error Banner ── */}
      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl text-xs flex items-center gap-2 shadow-xs"
        >
          <AlertTriangle size={15} className="shrink-0 text-rose-600" />
          <span className="font-medium">{errorMessage}</span>
        </motion.div>
      )}

      {/* ── Main Two-Step Verification Card ── */}
      <div className="bg-[#FAF5EE]/70 border border-[#E7DDD0] rounded-2xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
        {/* Subtle Luxury Gold Accent Line */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#8C6239]" />

        <AnimatePresence mode="wait">
          {/* ══════════════════════════════════════════════════════════
              VIEW 1: ACTIVE / PROTECTED STATE
          ══════════════════════════════════════════════════════════ */}
          {enabled && setupStep === 'idle' && (
            <motion.div
              key="active-state"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-[#E7DDD0] rounded-xl p-4 shadow-xs">
                <div className="flex items-center gap-3.5">
                  <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-md shadow-emerald-700/20">
                    <motion.svg
                      viewBox="0 0 24 24"
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <motion.path
                        d="M5 13l4 4L19 7"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                      />
                    </motion.svg>
                    <span className="absolute -inset-1 rounded-xl bg-emerald-400/20 animate-pulse pointer-events-none" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm sm:text-base text-[#1F1612]">
                        Two-Step Verification is Active
                      </h3>
                      <span className="text-[10px] uppercase font-black tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                        PROTECTED
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Account is secured with instant 6-digit WhatsApp OTP verification.
                    </p>
                  </div>
                </div>
              </div>

              {/* Registered Phone Card */}
              <div className="bg-white border border-[#E7DDD0] rounded-xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-600">
                    <Phone size={15} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                      Registered Mobile Number
                    </span>
                    <span className="text-xs sm:text-sm font-mono font-bold text-[#1F1612]">
                      {maskedPhone || registeredPhone || '+92 3XX •••••••'}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Sparkles size={11} className="text-emerald-600" />
                  WhatsApp OTP
                </span>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  onClick={() => setSetupStep('disable')}
                  variant="outline"
                  className="border-rose-200 text-rose-600 hover:bg-rose-50 text-xs rounded-xl font-bold transition-colors cursor-pointer"
                >
                  <Lock size={13} className="mr-1.5" />
                  Disable Two-Step Verification
                </Button>
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════════════
              VIEW 2: IDLE STATE — 2 OPTIONS (SMS & WHATSAPP)
          ══════════════════════════════════════════════════════════ */}
          {!enabled && setupStep === 'idle' && (
            <motion.div
              key="idle-state"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-5"
            >
              {/* Header inside card */}
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#B88E4B] to-[#5A3A1A] flex items-center justify-center text-white shadow-md shadow-[#B88E4B]/20 shrink-0">
                  <Smartphone className="w-5 h-5 text-amber-100" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1F1612]">
                    Two-Step Mobile Verification
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
                    Customer registration number per 6-digit WhatsApp OTP code bhej kar account ko protect
                    karein. Fahad Ali Interior ke official WhatsApp se instant code aayega.
                  </p>
                </div>
              </div>

              {/* Registered Phone Display / Edit */}
              <div className="bg-white border border-[#E7DDD0] rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Phone size={12} className="text-[#B88E4B]" />
                    Registered Mobile Number
                  </span>
                  {!editingPhone && registeredPhone && (
                    <button
                      type="button"
                      onClick={() => setEditingPhone(true)}
                      className="text-[11px] font-bold text-[#8C6239] hover:text-[#5A3A1A] flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 size={11} />
                      Change Number
                    </button>
                  )}
                </div>

                {!editingPhone && registeredPhone ? (
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-sm sm:text-base font-bold text-[#1F1612] tracking-wider">
                      {maskedPhone || registeredPhone}
                    </p>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                      Verified On File
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <Input
                        type="tel"
                        value={customPhoneInput}
                        onChange={(e) => setCustomPhoneInput(e.target.value)}
                        placeholder="0300 1234567 or +92 300 1234567"
                        className="bg-[#FAF5EE] border-[#E7DDD0] text-xs font-mono font-bold text-[#1F1612] rounded-lg focus:border-[#B88E4B]"
                      />
                      {registeredPhone && (
                        <Button
                          type="button"
                          onClick={() => {
                            setCustomPhoneInput(registeredPhone);
                            setEditingPhone(false);
                          }}
                          variant="outline"
                          className="text-xs border-[#E7DDD0] text-stone-500 rounded-lg px-3"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                    <p className="text-[10px] text-stone-400">
                      Yeh wahi Pakistani number hai jo aapne register karte waqt enter kiya tha.
                    </p>
                  </div>
                )}
              </div>

              {/* ── WHATSAPP VERIFICATION ACTIVATION (USER REQUIREMENT) ── */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                  Verification Channel:
                </span>

                {/* WHATSAPP OTP EXCLUSIVE CHANNEL */}
                <button
                  type="button"
                  onClick={() => handleSendOtp('WHATSAPP')}
                  disabled={sendingChannel !== null}
                  className="w-full group relative text-left p-4 sm:p-5 rounded-2xl border-2 border-emerald-500/80 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/40 hover:border-emerald-600 hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-400/15 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-center gap-3.5 mb-2 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white flex items-center justify-center shadow-md shadow-emerald-700/20 shrink-0">
                      {sendingChannel === 'WHATSAPP' ? (
                        <Loader2 size={20} className="animate-spin text-emerald-200" />
                      ) : (
                        <MessageCircle size={22} className="text-emerald-100" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm sm:text-base text-[#1F1612] group-hover:text-emerald-800 transition-colors">
                          Send Verification Code via WhatsApp
                        </h4>
                        <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-700 text-white px-2.5 py-0.5 rounded-full shadow-2xs">
                          Instant OTP
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5 leading-snug">
                        Aapke registered WhatsApp number par Fahad Ali Interior ka official 6-digit OTP code bhej kar verify karein.
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-emerald-100 flex items-center justify-between text-xs font-bold text-emerald-800 group-hover:text-emerald-950 relative z-10">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      {sendingChannel === 'WHATSAPP' ? 'Sending WhatsApp...' : 'Send via WhatsApp'}
                    </span>
                    <span className="text-sm font-black transition-transform group-hover:translate-x-1.5">
                      →
                    </span>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════════════
              VIEW 3: VERIFY 6-DIGIT CODE STEP
          ══════════════════════════════════════════════════════════ */}
          {setupStep === 'verify' && (
            <motion.div
              key="verify-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Animated WhatsApp Notification Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-br from-emerald-50 via-emerald-100/40 to-white p-4 sm:p-5 shadow-sm"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-start gap-3.5 relative z-10">
                  {/* Animated Pulsing WhatsApp Icon */}
                  <div className="relative shrink-0 mt-0.5">
                    <motion.div
                      animate={{ scale: [1, 1.08, 1] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                      className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-800 flex items-center justify-center text-white shadow-lg shadow-emerald-700/30"
                    >
                      <MessageCircle size={24} />
                    </motion.div>
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white shadow-xs" />
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-700 text-white px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-pulse" />
                        Code Sent to WhatsApp
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-950">
                        {maskedPhone || registeredPhone}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm sm:text-base text-emerald-950 mt-1.5 leading-snug">
                      Apna WhatsApp Kholiye — Code Wahan Aaya Hai!
                    </h4>

                    <p className="text-xs text-emerald-800/95 mt-1 leading-relaxed">
                      Fahad Ali Interior ka official <strong>6-digit verification code</strong> aapke WhatsApp message me send ho chuka hai. WhatsApp khol kar code check karein aur niche enter karein.
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-emerald-200/60 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1">
                        💬 Sender: <strong>Fahad Ali Interior Official</strong>
                      </span>
                      <a
                        href="https://wa.me/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-900 bg-emerald-200/70 hover:bg-emerald-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        Open WhatsApp <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* 6-Digit Code Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                  6-Digit Verification Code
                </label>
                <div className="relative">
                  <Input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otpCode}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtpCode(clean);
                    }}
                    placeholder="••••••"
                    maxLength={6}
                    className="bg-white border-[#E7DDD0] text-[#1F1612] text-center text-2xl sm:text-3xl tracking-[0.45em] font-mono font-black rounded-xl h-14 sm:h-16 shadow-inner focus:border-[#B88E4B]"
                  />
                  {otpCode.length === 6 && (
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <Check size={14} />
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <Button
                  onClick={handleVerifyOtp}
                  disabled={verifying || otpCode.length !== 6}
                  className="flex-1 bg-gradient-to-r from-[#B88E4B] via-[#996515] to-[#5A3A1A] hover:brightness-110 text-white rounded-xl h-11 text-xs sm:text-sm font-bold shadow-md cursor-pointer disabled:opacity-50"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Verifying Code...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Verify &amp; Activate 2FA
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => {
                    setSetupStep('idle');
                    setOtpCode('');
                    setErrorMessage('');
                  }}
                  variant="outline"
                  className="border-[#E7DDD0] text-stone-600 hover:bg-stone-50 rounded-xl h-11 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </Button>
              </div>

              {/* Resend Action */}
              <div className="pt-2 border-t border-[#E7DDD0]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-stone-500">
                <div>
                  {cooldown > 0 ? (
                    <span>
                      Resend code in <strong className="font-mono text-[#8C6239]">{cooldown}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendOtp('WHATSAPP')}
                      disabled={sendingChannel !== null}
                      className="font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw size={12} />
                      Resend Code via WhatsApp
                    </button>
                  )}
                </div>

                <span className="text-[11px] text-stone-400">
                  Official WhatsApp Delivery (Fahad Ali Interior)
                </span>
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════════════
              VIEW 4: DISABLE 2FA CONFIRMATION
          ══════════════════════════════════════════════════════════ */}
          {setupStep === 'disable' && (
            <motion.div
              key="disable-step"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-4 bg-white border border-rose-200 rounded-xl p-5 shadow-xs"
            >
              <div className="flex items-center gap-2.5 text-rose-700">
                <AlertTriangle size={18} />
                <h3 className="font-bold text-sm sm:text-base">
                  Disable Two-Step Verification?
                </h3>
              </div>
              <p className="text-xs text-stone-500 leading-relaxed">
                Disabling 2FA will remove the extra layer of security. Any future login will only
                require your email and password without WhatsApp or SMS OTP.
              </p>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                  Confirm Account Password
                </label>
                <Input
                  type="password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  placeholder="Enter current account password"
                  className="bg-[#FAF5EE] border-[#E7DDD0] text-xs text-[#1F1612] rounded-lg focus:border-rose-400"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  onClick={handleDisable2Fa}
                  disabled={disabling}
                  className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  {disabling ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      Disabling...
                    </>
                  ) : (
                    'Confirm Disable'
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setSetupStep('idle');
                    setDisablePassword('');
                    setErrorMessage('');
                  }}
                  variant="outline"
                  className="border-stone-200 text-stone-600 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
