'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, Mail, ShoppingBag, Tag, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api-client';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface Profile {
  emailNotif?: boolean;
  pushNotif?:  boolean;
  orderNotif?: boolean;
  promoNotif?: boolean;
}

interface Props {
  profile:  Profile | null;
  onSaved?: () => void;
}

function Toggle({ value, onChange }: { value: boolean; onChange: (_v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`w-11 h-6 rounded-full relative transition-colors duration-200 ${
        value ? 'bg-theme-accent' : 'bg-theme-border'
      }`}
      aria-checked={value}
      role="switch"
    >
      <div
        className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform duration-200 shadow-sm ${
          value ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export default function SettingsTab({ profile, onSaved }: Props) {
  const { permission, isSubscribed, isLoading: pushLoading, subscribe, unsubscribe } = usePushNotifications();

  const [prefs, setPrefs] = useState({
    emailNotif: profile?.emailNotif ?? true,
    pushNotif:  profile?.pushNotif  ?? true,
    orderNotif: profile?.orderNotif ?? true,
    promoNotif: profile?.promoNotif ?? false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setPrefs({
        emailNotif: profile.emailNotif ?? true,
        pushNotif:  profile.pushNotif  ?? true,
        orderNotif: profile.orderNotif ?? true,
        promoNotif: profile.promoNotif ?? false,
      });
    }
  }, [profile]);

  const savePrefs = async (updated: typeof prefs) => {
    setSaving(true);
    try {
      const res = await apiFetch('/api/user/profile', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(updated),
      });
      if (res.ok) {
        toast.success('Preferences saved');
        onSaved?.();
      }
    } catch {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: keyof typeof prefs) => (val: boolean) => {
    const updated = { ...prefs, [key]: val };
    setPrefs(updated);
    void savePrefs(updated);
  };

  const handlePushToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
      toast.success('Push notifications disabled');
    } else {
      if (permission === 'denied') {
        toast.error('Notifications blocked', {
          description: 'Enable notifications in your browser settings.',
        });
        return;
      }
      await subscribe();
      if (permission === 'granted' || Notification.permission === 'granted') {
        toast.success('Push notifications enabled');
      }
    }
  };

  const notificationRows = [
    {
      key:  'emailNotif' as const,
      icon: <Mail size={16} className="text-blue-500" />,
      label: 'Email Notifications',
      desc:  'Order confirmations, receipts, and account updates',
    },
    {
      key:  'orderNotif' as const,
      icon: <ShoppingBag size={16} className="text-theme-accent" />,
      label: 'Order Updates',
      desc:  'Shipping updates and order status changes',
    },
    {
      key:  'promoNotif' as const,
      icon: <Tag size={16} className="text-green-600" />,
      label: 'Promotions & Offers',
      desc:  'Exclusive deals, new arrivals, and special events',
    },
  ];

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-theme-dark" style={{ fontFamily: 'Georgia, serif' }}>
          Notification Settings
        </h2>
        {saving && <Loader2 size={16} className="animate-spin text-theme-accent" />}
      </div>

      {/* Email & In-App Prefs */}
      <div className="bg-theme-surface border border-theme-border rounded-xl p-5 space-y-4">
        <p className="text-theme-muted text-xs tracking-wider uppercase mb-2">Preferences</p>
        {notificationRows.map((row) => (
          <div key={row.key} className="flex items-center justify-between py-2 border-b border-theme-border last:border-0">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{row.icon}</div>
              <div>
                <p className="text-theme-dark text-sm">{row.label}</p>
                <p className="text-theme-muted text-xs">{row.desc}</p>
              </div>
            </div>
            <Toggle value={prefs[row.key]} onChange={handleToggle(row.key)} />
          </div>
        ))}
      </div>

      {/* Web Push */}
      <div className="bg-theme-surface border border-theme-border rounded-xl p-5">
        <p className="text-theme-muted text-xs tracking-wider uppercase mb-4">Push Notifications</p>

        {permission === 'unsupported' ? (
          <div className="flex items-center gap-3 text-theme-muted">
            <BellOff size={18} />
            <p className="text-sm">Push notifications not supported in this browser</p>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {isSubscribed
                  ? <Bell size={16} className="text-theme-accent" />
                  : <BellOff size={16} className="text-theme-muted" />}
              </div>
              <div>
                <p className="text-theme-dark text-sm">Browser Push Notifications</p>
                <p className="text-theme-muted text-xs">
                  {permission === 'denied'
                    ? 'Blocked — enable in browser settings'
                    : isSubscribed
                    ? 'Active — you will receive push notifications'
                    : 'Get notified even when the app is closed'}
                </p>
              </div>
            </div>
            <button
              onClick={handlePushToggle}
              disabled={pushLoading || permission === 'denied'}
              className={`px-4 py-1.5 text-xs font-semibold tracking-wider uppercase rounded-lg transition-colors disabled:opacity-40 ${
                isSubscribed
                  ? 'bg-theme-border text-theme-muted hover:bg-theme-border/70'
                  : 'bg-theme-brown text-white hover:bg-theme-dark'
              }`}
            >
              {pushLoading ? (
                <Loader2 size={12} className="animate-spin" />
              ) : isSubscribed ? 'Disable' : 'Enable'}
            </button>
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="bg-theme-surface border border-red-200 rounded-xl p-5">
        <p className="text-theme-muted text-xs tracking-wider uppercase mb-4">Account</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-theme-dark text-sm">Delete Account</p>
            <p className="text-theme-muted text-xs">Permanently remove your account and all data</p>
          </div>
          <button
            className="px-4 py-1.5 text-xs font-semibold tracking-wider uppercase rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors border border-red-200"
            onClick={() => toast.error('Contact support to delete your account')}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
