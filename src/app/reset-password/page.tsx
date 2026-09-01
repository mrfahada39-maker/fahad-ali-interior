'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import StoreShell from '@/components/layout/StoreShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { apiFetchJsonWithStatus } from '@/lib/api-client';
import Link from 'next/link';
import { KeyRound, Mail, Lock, CheckCircle2, ArrowRight, Eye, EyeOff, Sparkles, ShieldCheck } from 'lucide-react';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const tokenFromUrl = searchParams.get('token') || '';
  const emailFromUrl = searchParams.get('email') || '';

  const [step, setStep] = useState<'REQUEST' | 'RESET' | 'SUCCESS'>(
    tokenFromUrl ? 'RESET' : 'REQUEST'
  );

  const [email, setEmail] = useState(emailFromUrl);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tokenFromUrl) {
      setStep('RESET');
    }
  }, [tokenFromUrl]);

  // Request Reset Link / 6-Digit Code
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const { ok, data } = await apiFetchJsonWithStatus<{ success?: boolean; error?: string; message?: string }>(
        '/api/auth/forgot-password',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }
      );

      if (ok) {
        toast.success(data?.message || 'Reset code sent to your email!');
        setStep('RESET');
      } else {
        toast.error(data?.error || 'Failed to send reset code.');
      }
    } catch {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Submit New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || password.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match. Please verify.');
      return;
    }

    if (!tokenFromUrl && !code) {
      toast.error('Please enter the 6-digit code sent to your email.');
      return;
    }

    setLoading(true);
    try {
      const { ok, data } = await apiFetchJsonWithStatus<{ success?: boolean; error?: string; message?: string }>(
        '/api/auth/reset-password',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: tokenFromUrl || undefined,
            code: code ? code.trim() : undefined,
            email: email ? email.trim().toLowerCase() : undefined,
            password,
          }),
        }
      );

      if (ok) {
        toast.success(data?.message || 'Password successfully updated!');
        setStep('SUCCESS');
        setTimeout(() => {
          router.push('/?auth=login');
        }, 2500);
      } else {
        toast.error(data?.error || 'Failed to update password.');
      }
    } catch {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-[#FFFFFF] border border-[#E7DDD0] rounded-3xl p-6 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.06)] text-[#221814]">
      
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-[#FAF5EE] border border-[#B88E4B]/40 flex items-center justify-center mx-auto mb-3 text-[#B88E4B] shadow-2xs">
          {step === 'SUCCESS' ? (
            <CheckCircle2 size={24} className="text-emerald-600" />
          ) : (
            <KeyRound size={24} />
          )}
        </div>
        <h2 className="font-serif text-2xl font-black text-[#221814] tracking-tight">
          {step === 'REQUEST' && 'Forgot Password'}
          {step === 'RESET' && 'Set New Password'}
          {step === 'SUCCESS' && 'Password Updated!'}
        </h2>
        <p className="text-xs sm:text-sm text-[#7A6354] mt-1">
          {step === 'REQUEST' && 'Enter your account email to receive a password reset link & code.'}
          {step === 'RESET' && (tokenFromUrl ? 'Create your new strong account password.' : `Enter the 6-digit code sent to ${email || 'your email'}.`)}
          {step === 'SUCCESS' && 'Redirecting you to login portal in a few seconds...'}
        </p>
      </div>

      {/* Step 1: Request Email Form */}
      {step === 'REQUEST' && (
        <form onSubmit={handleRequestReset} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-[#7A6354]">
              Your Account Email
            </Label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E8A78]" size={16} />
              <Input
                id="email"
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-11 bg-[#FAF7F2] border-[#E2D9CD] focus:border-[#B88E4B] text-[#221814] rounded-xl text-sm"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-[#1F1612] hover:bg-[#35251F] text-[#F5D77F] font-bold rounded-xl text-sm transition-all shadow-md mt-2 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? 'Sending Instructions...' : 'Send Reset Link & Code'}
            {!loading && <ArrowRight size={16} />}
          </Button>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => setStep('RESET')}
              className="text-xs text-[#B88E4B] hover:underline font-semibold"
            >
              Already have a 6-digit code or reset link?
            </button>
          </div>
        </form>
      )}

      {/* Step 2: Reset Form */}
      {step === 'RESET' && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          {!tokenFromUrl && (
            <>
              <div>
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-[#7A6354]">
                  Account Email
                </Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E8A78]" size={16} />
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 bg-[#FAF7F2] border-[#E2D9CD] focus:border-[#B88E4B] text-[#221814] rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="code" className="text-xs font-bold uppercase tracking-wider text-[#7A6354]">
                  6-Digit Reset Code
                </Label>
                <Input
                  id="code"
                  type="text"
                  required
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="mt-1.5 h-11 text-center font-mono tracking-widest text-lg font-bold bg-[#FAF7F2] border-[#E2D9CD] focus:border-[#B88E4B] text-[#221814] rounded-xl"
                />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-[#7A6354]">
              New Password (Min 8 Characters)
            </Label>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E8A78]" size={16} />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-11 bg-[#FAF7F2] border-[#E2D9CD] focus:border-[#B88E4B] text-[#221814] rounded-xl text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9E8A78] hover:text-[#221814]"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-wider text-[#7A6354]">
              Confirm New Password
            </Label>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E8A78]" size={16} />
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 pr-10 h-11 bg-[#FAF7F2] border-[#E2D9CD] focus:border-[#B88E4B] text-[#221814] rounded-xl text-sm"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-[#1F1612] hover:bg-[#35251F] text-[#F5D77F] font-bold rounded-xl text-sm transition-all shadow-md mt-2 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? 'Updating Password...' : 'Save New Password'}
            {!loading && <ShieldCheck size={16} />}
          </Button>

          {!tokenFromUrl && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setStep('REQUEST')}
                className="text-xs text-[#7A6354] hover:underline"
              >
                ← Back to Request Reset
              </button>
            </div>
          )}
        </form>
      )}

      {/* Step 3: Success Screen */}
      {step === 'SUCCESS' && (
        <div className="space-y-4 text-center py-4">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-medium">
            Your password has been changed. You can now use your new password to access your Fahad Ali Interior account.
          </div>

          <Link href="/?auth=login">
            <Button className="w-full h-11 bg-[#1F1612] hover:bg-[#35251F] text-[#F5D77F] font-bold rounded-xl text-sm transition-all shadow-md">
              Proceed to Login Portal →
            </Button>
          </Link>
        </div>
      )}

      {/* Footer link */}
      <div className="border-t border-[#E7DDD0] mt-6 pt-4 text-center">
        <Link href="/?auth=login" className="text-xs text-[#7A6354] hover:text-[#221814] font-medium">
          Remember your password? <span className="text-[#B88E4B] font-bold underline">Log In Here</span>
        </Link>
      </div>

    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <StoreShell showFooter={true}>
      <main className="min-h-[85vh] bg-[#FAF8F5] pt-32 pb-20 px-4 flex flex-col items-center justify-center">
        <Suspense fallback={<div className="text-center text-sm text-[#7A6354]">Loading security portal...</div>}>
          <ResetPasswordContent />
        </Suspense>
      </main>
    </StoreShell>
  );
}
