'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Shield, Smartphone, Copy, Check, Download, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { apiFetchJson } from '@/lib/api-client';

export default function TwoFactorSetup() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupMode, setSetupMode] = useState<'idle' | 'setup' | 'verify' | 'codes'>('idle');
  const [qrCode, setQrCode] = useState('');
  const [manualKey, setManualKey] = useState('');
  const [token, setToken] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetchJson<{ enabled: boolean }>('/api/auth/2fa/status');
      setEnabled(data?.enabled ?? false);
    } catch {
      setEnabled(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  const handleSetup = async () => {
    const data = await apiFetchJson<{ qrCode: string; manualKey: string }>('/api/auth/2fa/setup', { method: 'GET' });
    if (!data) { toast.error('Failed to start 2FA setup'); return; }
    setQrCode(data.qrCode);
    setManualKey(data.manualKey);
    setSetupMode('verify');
  };

  const handleEnable = async () => {
    if (token.length !== 6) { toast.error('Enter a 6-digit code'); return; }
    setVerifying(true);
    try {
      const data = await apiFetchJson<{ enabled: boolean; backupCodes: string[] }>('/api/auth/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (!data?.enabled) { toast.error('Invalid code. Try again.'); return; }
      setBackupCodes(data.backupCodes);
      setSetupMode('codes');
      setEnabled(true);
      toast.success('2FA enabled successfully!');
    } catch {
      toast.error('Verification failed. Try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleDisable = async () => {
    const code = prompt('Enter your current 2FA code to disable:');
    if (!code || code.length !== 6) { toast.error('A 6-digit code is required'); return; }
    const data = await apiFetchJson<{ disabled: boolean }>('/api/auth/2fa/disable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: code }),
    });
    if (data?.disabled) {
      setEnabled(false);
      setSetupMode('idle');
      setQrCode('');
      setManualKey('');
      setToken('');
      toast.success('2FA disabled');
    } else {
      toast.error('Failed to disable 2FA');
    }
  };

  const copyCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const downloadCodes = () => {
    const blob = new Blob([backupCodes.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'fahad-ali-2fa-backup-codes.txt';
    a.click(); URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-theme-accent animate-spin" /></div>;
  }

  return (
    <div className="max-w-lg space-y-6">
      <h2 className="text-2xl font-bold text-theme-dark" style={{ fontFamily: 'Georgia, serif' }}>Security Settings</h2>

      {setupMode === 'codes' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 border border-green-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-green-700">
            <Check size={20} /><span className="font-semibold">2FA Enabled Successfully!</span>
          </div>
          <p className="text-green-700/80 text-sm">Save these backup codes in a safe place. Each code can be used once if you lose access to your authenticator app.</p>
          <div className="bg-white border border-green-200 rounded-lg p-4 font-mono text-sm text-green-800 space-y-1">
            {backupCodes.map((c, i) => <div key={i}>{c}</div>)}
          </div>
          <div className="flex gap-2">
            <Button onClick={copyCodes} className="bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg">
              {copied ? <><Check size={14} className="mr-1" />Copied</> : <><Copy size={14} className="mr-1" />Copy Codes</>}
            </Button>
            <Button onClick={downloadCodes} variant="outline" className="border-green-300 text-green-700 hover:bg-green-50 text-xs rounded-lg">
              <Download size={14} className="mr-1" />Download
            </Button>
            <Button onClick={() => setSetupMode('idle')} variant="outline" className="border-green-300 text-green-700 hover:bg-green-50 text-xs rounded-lg ml-auto">
              Done
            </Button>
          </div>
        </motion.div>
      )}

      {setupMode === 'verify' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-theme-surface border border-theme-border rounded-xl p-6 space-y-5">
          <h3 className="text-lg font-semibold text-theme-dark">Scan QR Code</h3>
          <p className="text-theme-muted text-sm">Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.), then enter the 6-digit code below.</p>
          {qrCode && (
            <div className="flex justify-center">
              <img src={qrCode} alt="2FA QR Code" className="w-48 h-48 border border-theme-border rounded-lg" />
            </div>
          )}
          <div className="bg-theme-bg border border-theme-border rounded-lg p-3 text-center">
            <p className="text-theme-muted text-xs mb-1">Can&apos;t scan? Enter this key manually:</p>
            <div className="flex items-center justify-center gap-2">
              <code className="text-theme-dark font-mono text-sm bg-theme-surface px-3 py-1 rounded border border-theme-border select-all">{manualKey}</code>
              <button onClick={() => { navigator.clipboard.writeText(manualKey); toast.success('Copied!'); }} className="text-theme-muted hover:text-theme-accent shrink-0">
                <Copy size={14} />
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-theme-muted text-xs uppercase tracking-wider">Verification Code</label>
            <Input
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="bg-theme-bg border-theme-border text-theme-dark text-center text-2xl tracking-[0.5em] font-mono rounded-lg h-14 focus:border-theme-accent"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleEnable} disabled={verifying || token.length !== 6} className="bg-theme-brown hover:bg-theme-dark text-white rounded-lg text-sm font-semibold">
              {verifying ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Shield size={16} className="mr-1" />}
              {verifying ? 'Verifying...' : 'Enable 2FA'}
            </Button>
            <Button onClick={() => { setSetupMode('idle'); setToken(''); }} variant="outline" className="border-theme-border text-theme-muted rounded-lg text-sm">
              Cancel
            </Button>
          </div>
        </motion.div>
      )}

      {setupMode === 'idle' && (
        <div className="bg-theme-surface border border-theme-border rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${enabled ? 'bg-green-100' : 'bg-theme-border'}`}>
                <Shield size={20} className={enabled ? 'text-green-600' : 'text-theme-muted'} />
              </div>
              <div>
                <p className="text-theme-dark font-medium text-sm">Two-Factor Authentication</p>
                <p className="text-theme-muted text-xs">{enabled ? 'Enabled' : 'Not configured'}</p>
              </div>
            </div>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
              enabled ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {enabled ? 'ON' : 'OFF'}
            </span>
          </div>

          {!enabled ? (
            <div className="space-y-3">
              <p className="text-theme-muted text-sm">Add an extra layer of security to your account. Use an authenticator app to generate one-time codes.</p>
              <Button onClick={handleSetup} className="bg-theme-brown hover:bg-theme-dark text-white rounded-lg text-sm font-semibold">
                <Smartphone size={16} className="mr-1" /> Set Up 2FA
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-theme-muted text-sm">Two-factor authentication is active. Your account is protected with a time-based one-time password.</p>
              <Button onClick={handleDisable} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs">
                <AlertTriangle size={14} className="mr-1" /> Disable 2FA
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
