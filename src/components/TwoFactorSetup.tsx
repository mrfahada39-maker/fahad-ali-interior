/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Shield, Smartphone, Copy, Check, Download, AlertTriangle, Loader2, KeyRound } from 'lucide-react';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { toast } from 'sonner';
import { apiFetchJson } from '@/lib/api-client';

export default function TwoFactorSetup() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupMode, setSetupMode] = useState<'idle' | 'verify' | 'codes' | 'disable'>('idle');
  const [qrCode, setQrCode] = useState('');
  const [manualKey, setManualKey] = useState('');
  const [token, setToken] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [disableToken, setDisableToken] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verifying, setVerifying] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [settingUp, setSettingUp] = useState(false);
  const [copied, setCopied] = useState(false);
  const [codesSavedConfirmed, setCodesSavedConfirmed] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await apiFetchJson<{ enabled: boolean }>('/api/auth/2fa/status');
      setEnabled(data?.enabled ?? false);
    } catch {
      setEnabled(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleSetup = async () => {
    setSettingUp(true);
    setErrorMessage('');
    try {
      const data = await apiFetchJson<{ qrCode: string; manualKey: string }>('/api/auth/2fa/setup', {
        method: 'POST',
      });
      if (!data?.qrCode) {
        const err = 'Failed to start 2FA setup. Please try again.';
        setErrorMessage(err);
        toast.error(err);
        return;
      }
      setQrCode(data.qrCode);
      setManualKey(data.manualKey);
      setToken('');
      setSetupMode('verify');
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'Failed to start 2FA setup';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setSettingUp(false);
    }
  };

  const handleEnable = async () => {
    if (token.length !== 6) {
      const msg = 'Please enter a valid 6-digit authentication code';
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }
    setVerifying(true);
    setErrorMessage('');
    try {
      const data = await apiFetchJson<{ enabled: boolean; backupCodes: string[] }>('/api/auth/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (!data?.enabled) {
        const msg = 'Invalid authentication code. Please check your authenticator app.';
        setErrorMessage(msg);
        toast.error(msg);
        return;
      }
      setBackupCodes(data.backupCodes || []);
      setCodesSavedConfirmed(false);
      setSetupMode('codes');
      setEnabled(true);
      toast.success('2FA enabled successfully!');
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'Verification failed. Try again.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setVerifying(false);
    }
  };

  const handleDisable = async () => {
    if (!disablePassword) {
      const msg = 'Account password is required to disable 2FA';
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }
    if (!disableToken.trim()) {
      const msg = 'Current 2FA code or backup code is required';
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    setDisabling(true);
    setErrorMessage('');
    try {
      const data = await apiFetchJson<{ disabled: boolean }>('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: disablePassword, token: disableToken.trim() }),
      });
      if (data?.disabled) {
        setEnabled(false);
        setSetupMode('idle');
        setQrCode('');
        setManualKey('');
        setToken('');
        setDisablePassword('');
        setDisableToken('');
        toast.success('Two-factor authentication disabled');
      } else {
        const msg = 'Failed to disable 2FA. Please verify your password and 2FA code.';
        setErrorMessage(msg);
        toast.error(msg);
      }
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'Failed to disable 2FA. Verify password and code.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setDisabling(false);
    }
  };

  const copyCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopied(true);
    toast.success('Backup codes copied to clipboard');
    setTimeout(() => setCopied(false), 2500);
  };

  const downloadCodes = () => {
    const blob = new Blob([backupCodes.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fahad-ali-interior-2fa-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Backup codes file downloaded');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-theme-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-6">
      <h2 className="text-2xl font-bold text-theme-dark" style={{ fontFamily: 'Georgia, serif' }}>
        Security Settings
      </h2>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0 text-red-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {setupMode === 'codes' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center gap-2 text-green-700">
            <Check size={20} />
            <span className="font-semibold">2FA Enabled Successfully!</span>
          </div>
          <p className="text-green-700/80 text-sm">
            Save these 8 backup codes in a safe place. Each code can be used once if you lose access to your authenticator app.
          </p>
          <div className="bg-white border border-green-200 rounded-lg p-4 font-mono text-sm text-green-800 grid grid-cols-2 gap-2">
            {backupCodes.map((c, i) => (
              <div key={i} className="p-1 bg-green-50/50 rounded text-center tracking-wider font-semibold">
                {c}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button onClick={copyCodes} className="bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg">
              {copied ? (
                <>
                  <Check size={14} className="mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={14} className="mr-1" />
                  Copy Codes
                </>
              )}
            </Button>
            <Button
              onClick={downloadCodes}
              variant="outline"
              className="border-green-300 text-green-700 hover:bg-green-50 text-xs rounded-lg"
            >
              <Download size={14} className="mr-1" />
              Download
            </Button>
          </div>

          <div className="pt-3 border-t border-green-200 space-y-3">
            <label className="flex items-center gap-2 text-xs text-green-900 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={codesSavedConfirmed}
                onChange={(e) => setCodesSavedConfirmed(e.target.checked)}
                className="rounded border-green-300 text-green-600 focus:ring-green-500"
              />
              <span className="font-medium">I have safely saved and stored these backup codes</span>
            </label>
            <Button
              onClick={() => {
                setBackupCodes([]);
                setSetupMode('idle');
                setCodesSavedConfirmed(false);
              }}
              disabled={!codesSavedConfirmed}
              className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white text-xs rounded-lg py-2"
            >
              Finish Setup
            </Button>
          </div>
        </motion.div>
      )}

      {setupMode === 'verify' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-theme-surface border border-theme-border rounded-xl p-6 space-y-5"
        >
          <h3 className="text-lg font-semibold text-theme-dark">Scan QR Code</h3>
          <p className="text-theme-muted text-sm">
            Scan this QR code with your authenticator app (Google Authenticator, Microsoft Authenticator, Authy), then enter the 6-digit code below.
          </p>
          {qrCode && (
            <div className="flex justify-center p-2 bg-white rounded-lg border border-theme-border w-fit mx-auto">
              <img src={qrCode} alt="2FA QR Code" className="w-48 h-48 rounded" />
            </div>
          )}
          <div className="bg-theme-bg border border-theme-border rounded-lg p-3 text-center">
            <p className="text-theme-muted text-xs mb-1">Can&apos;t scan? Enter this key manually:</p>
            <div className="flex items-center justify-center gap-2">
              <code className="text-theme-dark font-mono text-sm bg-theme-surface px-3 py-1 rounded border border-theme-border select-all">
                {manualKey}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(manualKey);
                  toast.success('Copied manual key!');
                }}
                className="text-theme-muted hover:text-theme-accent shrink-0"
              >
                <Copy size={14} />
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-theme-muted text-xs uppercase tracking-wider">Verification Code</span>
            <Input
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="bg-theme-bg border-theme-border text-theme-dark text-center text-2xl tracking-[0.5em] font-mono rounded-lg h-14 focus:border-theme-accent"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleEnable}
              disabled={verifying || token.length !== 6}
              className="bg-theme-brown hover:bg-theme-dark text-white rounded-lg text-sm font-semibold"
            >
              {verifying ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Shield size={16} className="mr-1" />}
              {verifying ? 'Verifying...' : 'Enable 2FA'}
            </Button>
            <Button
              onClick={() => {
                setSetupMode('idle');
                setToken('');
                setErrorMessage('');
              }}
              variant="outline"
              className="border-theme-border text-theme-muted rounded-lg text-sm"
            >
              Cancel
            </Button>
          </div>
        </motion.div>
      )}

      {setupMode === 'disable' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-theme-surface border border-red-200 rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center gap-2 text-red-600 font-semibold text-lg">
            <AlertTriangle size={20} />
            <h3>Disable Two-Factor Authentication</h3>
          </div>
          <p className="text-theme-muted text-sm">
            To disable 2FA, enter your current account password and a 6-digit authenticator code (or one of your backup codes).
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-theme-muted block mb-1">Current Account Password</label>
              <Input
                type="password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                placeholder="Enter account password"
                className="bg-theme-bg border-theme-border text-theme-dark rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-theme-muted block mb-1">Current 2FA Code or Backup Code</label>
              <Input
                type="text"
                value={disableToken}
                onChange={(e) => setDisableToken(e.target.value.trim())}
                placeholder="000000 or backup code"
                className="bg-theme-bg border-theme-border text-theme-dark rounded-lg text-sm font-mono"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleDisable}
              disabled={disabling || !disablePassword || !disableToken}
              className="bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold"
            >
              {disabling ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <AlertTriangle size={16} className="mr-1" />}
              {disabling ? 'Disabling...' : 'Confirm Disable 2FA'}
            </Button>
            <Button
              onClick={() => {
                setSetupMode('idle');
                setDisablePassword('');
                setDisableToken('');
                setErrorMessage('');
              }}
              variant="outline"
              className="border-theme-border text-theme-muted rounded-lg text-sm"
            >
              Cancel
            </Button>
          </div>
        </motion.div>
      )}

      {setupMode === 'idle' && (
        <div className="bg-theme-surface border border-theme-border rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  enabled ? 'bg-green-100' : 'bg-theme-border'
                }`}
              >
                <Shield size={20} className={enabled ? 'text-green-600' : 'text-theme-muted'} />
              </div>
              <div>
                <p className="text-theme-dark font-medium text-sm">Two-Factor Authentication</p>
                <p className="text-theme-muted text-xs">{enabled ? 'Enabled' : 'Not configured'}</p>
              </div>
            </div>
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full ${
                enabled ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              {enabled ? 'ON' : 'OFF'}
            </span>
          </div>

          {!enabled ? (
            <div className="space-y-3">
              <p className="text-theme-muted text-sm">
                Add an extra layer of security to your account. Use an authenticator app to generate one-time codes.
              </p>
              <Button
                onClick={handleSetup}
                disabled={settingUp}
                className="bg-theme-brown hover:bg-theme-dark text-white rounded-lg text-sm font-semibold"
              >
                {settingUp ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Smartphone size={16} className="mr-1" />}
                {settingUp ? 'Preparing...' : 'Set Up 2FA'}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-theme-muted text-sm">
                Two-factor authentication is active. Your account is protected with a time-based one-time password.
              </p>
              <Button
                onClick={() => {
                  setErrorMessage('');
                  setDisablePassword('');
                  setDisableToken('');
                  setSetupMode('disable');
                }}
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs"
              >
                <KeyRound size={14} className="mr-1" /> Disable 2FA
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
