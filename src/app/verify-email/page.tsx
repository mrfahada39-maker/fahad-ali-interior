'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import StoreShell from '@/components/layout/StoreShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { apiFetchJsonWithStatus } from '@/lib/api-client';
import Link from 'next/link';
import { MailCheck, Mail, ShieldCheck, CheckCircle2, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tokenFromUrl = searchParams.get('token') || '';
  const emailFromUrl = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailFromUrl);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [statusMessage, setStatusMessage] = useState('');

  // Auto-verify if token is present in the URL
  useEffect(() => {
    if (!tokenFromUrl) return;

    const autoVerify = async () => {
      setStatus('LOADING');
      try {
        const { ok, data } = await apiFetchJsonWithStatus<{ success?: boolean; error?: string; message?: string }>(
          '/api/auth/verify-email',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: tokenFromUrl }),
          }
        );

        if (ok) {
          setStatus('SUCCESS');
          setStatusMessage(data?.message || 'Your email has been successfully verified! You can now log in.');
          toast.success('Email verified successfully!');
          setTimeout(() => {
            router.push('/?auth=login');
          }, 2500);
        } else {
          setStatus('ERROR');
          setStatusMessage(data?.error || 'Invalid or expired verification link.');
          toast.error(data?.error || 'Verification link expired.');
        }
      } catch {
        setStatus('ERROR');
        setStatusMessage('An unexpected error occurred while verifying your email.');
      }
    };

    autoVerify();
  }, [tokenFromUrl, router]);

  // Manual 6-digit code verification
  const handleManualVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    if (!code || code.length < 6) {
      toast.error('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const { ok, data } = await apiFetchJsonWithStatus<{ success?: boolean; error?: string; message?: string }>(
        '/api/auth/verify-email',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            code: code.trim(),
          }),
        }
      );

      if (ok) {
        setStatus('SUCCESS');
        setStatusMessage(data?.message || 'Email verified successfully! You can now log in.');
        toast.success('Email verified successfully!');
        setTimeout(() => {
          router.push('/?auth=login');
        }, 2500);
      } else {
        toast.error(data?.error || 'Invalid or expired code. Please try again.');
      }
    } catch {
      toast.error('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Resend Verification Code
  const handleResendCode = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter your account email to resend verification code.');
      return;
    }

    setResending(true);
    try {
      const { ok, data } = await apiFetchJsonWithStatus<{ success?: boolean; error?: string; message?: string }>(
        '/api/auth/resend-verification',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim().toLowerCase() }),
        }
      );

      if (ok) {
        toast.success(data?.message || 'A new verification code has been sent to your email!');
      } else {
        toast.error(data?.error || 'Failed to resend verification email.');
      }
    } catch {
      toast.error('Could not resend email. Please try again later.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-[#FFFFFF] border border-[#E7DDD0] rounded-3xl p-6 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.06)] text-[#221814]">
      
      {/* Header Icon & Title */}
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-[#FAF5EE] border border-[#B88E4B]/40 flex items-center justify-center mx-auto mb-3 text-[#B88E4B] shadow-2xs">
          {status === 'SUCCESS' ? (
            <CheckCircle2 size={24} className="text-emerald-600" />
          ) : status === 'ERROR' ? (
            <AlertCircle size={24} className="text-rose-600" />
          ) : (
            <MailCheck size={24} />
          )}
        </div>
        <h2 className="font-serif text-2xl font-black text-[#221814] tracking-tight">
          {status === 'SUCCESS' ? 'Email Verified!' : status === 'ERROR' ? 'Verification Failed' : 'Verify Your Email'}
        </h2>
        <p className="text-xs sm:text-sm text-[#7A6354] mt-1">
          {status === 'SUCCESS'
            ? 'Redirecting to login portal in a few seconds...'
            : status === 'LOADING'
            ? 'Verifying your security credentials with the server...'
            : 'Enter the 6-digit code sent to your email or click the link.'}
        </p>
      </div>

      {/* Auto-verification loading state */}
      {status === 'LOADING' && (
        <div className="text-center py-6 space-y-3">
          <div className="w-8 h-8 border-3 border-[#B88E4B] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#7A6354]">Authenticating verification token...</p>
        </div>
      )}

      {/* Success View */}
      {status === 'SUCCESS' && (
        <div className="space-y-4 text-center py-4">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-medium">
            {statusMessage}
          </div>
          <Link href="/?auth=login">
            <Button className="w-full h-11 bg-[#1F1612] hover:bg-[#35251F] text-[#F5D77F] font-bold rounded-xl text-sm transition-all shadow-md">
              Proceed to Login Portal →
            </Button>
          </Link>
        </div>
      )}

      {/* Manual Input Form (Active if not in auto-success) */}
      {status !== 'SUCCESS' && status !== 'LOADING' && (
        <form onSubmit={handleManualVerify} className="space-y-4">
          {status === 'ERROR' && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs text-center font-medium">
              {statusMessage}
            </div>
          )}

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
            <div className="flex items-center justify-between">
              <Label htmlFor="code" className="text-xs font-bold uppercase tracking-wider text-[#7A6354]">
                6-Digit Verification Code
              </Label>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resending}
                className="text-[11px] text-[#B88E4B] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw size={11} className={resending ? 'animate-spin' : ''} />
                {resending ? 'Sending...' : 'Resend Code'}
              </button>
            </div>
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

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-[#1F1612] hover:bg-[#35251F] text-[#F5D77F] font-bold rounded-xl text-sm transition-all shadow-md mt-2 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? 'Verifying Code...' : 'Verify Email Address'}
            {!loading && <ShieldCheck size={16} />}
          </Button>
        </form>
      )}

      {/* Footer login link */}
      <div className="border-t border-[#E7DDD0] mt-6 pt-4 text-center">
        <Link href="/?auth=login" className="text-xs text-[#7A6354] hover:text-[#221814] font-medium">
          Already verified? <span className="text-[#B88E4B] font-bold underline">Log In Here</span>
        </Link>
      </div>

    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <StoreShell showFooter={true}>
      <main className="min-h-[85vh] bg-[#FAF8F5] pt-32 pb-20 px-4 flex flex-col items-center justify-center">
        <Suspense fallback={<div className="text-center text-sm text-[#7A6354]">Loading email verification portal...</div>}>
          <VerifyEmailContent />
        </Suspense>
      </main>
    </StoreShell>
  );
}
