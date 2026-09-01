'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, X, Check, CheckCheck, ShoppingBag, CreditCard, Info, Megaphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';

interface Notification {
  id: string;
  title: string;
  desc: string | null;
  type: string;
  isNew: boolean;
  createdAt: string;
}

const getNotificationIcon = (n: Notification) => {
  const t = (n.type || '').toLowerCase();
  const title = (n.title || '').toLowerCase();

  if (title.includes('approved') || t.includes('approve')) {
    return (
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/90 border border-emerald-300/80 text-emerald-700 flex items-center justify-center shadow-2xs shrink-0">
        <CheckCheck size={15} strokeWidth={2.2} />
      </div>
    );
  }
  if (title.includes('rejected') || title.includes('declined') || t.includes('reject')) {
    return (
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100/90 border border-rose-300/80 text-rose-700 flex items-center justify-center shadow-2xs shrink-0">
        <X size={15} strokeWidth={2.2} />
      </div>
    );
  }
  if (t === 'order' || title.includes('order')) {
    return (
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FAF5EE] via-[#FFF9EE] to-[#F3E5AB]/90 border border-[#D4AF37]/70 text-[#8C6239] flex items-center justify-center shadow-2xs shrink-0">
        <ShoppingBag size={15} strokeWidth={2} />
      </div>
    );
  }
  if (t === 'payment' || title.includes('payment')) {
    return (
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/90 border border-amber-300/80 text-amber-800 flex items-center justify-center shadow-2xs shrink-0">
        <CreditCard size={15} strokeWidth={2} />
      </div>
    );
  }
  if (t === 'promo' || title.includes('offer') || title.includes('discount')) {
    return (
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/90 border border-purple-300/80 text-purple-700 flex items-center justify-center shadow-2xs shrink-0">
        <Megaphone size={15} strokeWidth={2} />
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FAF5EE] to-[#F2ECE4] border border-[#E7DDD0] text-[#8C6239] flex items-center justify-center shadow-2xs shrink-0">
      <Info size={15} strokeWidth={2} />
    </div>
  );
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'Just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function NotificationBell({ isSolid = true }: { isSolid?: boolean }) {
  const { data: session } = useSession();
  const [open, setOpen]           = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread]       = useState(0);
  const [loading, setLoading]     = useState(false);
  const [mounted, setMounted]     = useState(false);
  const panelRef                  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ── Fetch notifications ───────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);
    try {
      const { apiFetchJson } = await import('@/lib/api-client');
      const data = await apiFetchJson<{ notifications: Notification[]; unreadCount: number }>(
        '/api/v1/user/notifications',
      );
      if (data) {
        setNotifications(data.notifications ?? []);
        setUnread(data.unreadCount ?? 0);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [session]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ── Periodic notification refresh (Polling every 60s) ──────────────────────
  useEffect(() => {
    if (!session?.user) return;
    const interval = setInterval(() => {
      fetchNotifications();
    }, 60000);
    return () => clearInterval(interval);
  }, [session, fetchNotifications]);

  // ── Close on outside click ────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Mark all as read ──────────────────────────────────────────────────────
  const markAllRead = async () => {
    try {
      const { apiFetchJson } = await import('@/lib/api-client');
      await apiFetchJson('/api/v1/user/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ all: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isNew: false })));
      setUnread(0);
    } catch { /* silent */ }
  };

  const markOneRead = async (id: string) => {
    try {
      const { apiFetchJson } = await import('@/lib/api-client');
      await apiFetchJson('/api/v1/user/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ notificationId: id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isNew: false } : n)),
      );
      setUnread((n) => Math.max(0, n - 1));
    } catch { /* silent */ }
  };

  if (!session?.user) return null;

  return (
    <div className="relative" ref={panelRef}>
      {/* ── Bell button ── */}
      <button
        onClick={() => { setOpen((o) => !o); if (!open) fetchNotifications(); }}
        className="relative flex items-center gap-1.5 text-[14px] xl:text-[15px] font-medium tracking-wide transition-opacity hover:opacity-75 focus:outline-none cursor-pointer select-none"
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
      >
        <Bell size={16} strokeWidth={1.7} />
        <span className="hidden xl:inline">Alerts</span>
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-gradient-to-r from-[#FFEAA0] via-[#F5C46B] to-[#C9A96E] text-[#1A0E07] text-[9px] font-black rounded-full flex items-center justify-center leading-none shadow-[0_0_8px_rgba(212,175,55,0.7)] border border-[#221814]/20 animate-pulse">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* ── Dropdown panel (Haute Couture Luxury Review-Matching Palette) ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-3 w-80 sm:w-96 bg-[#FCFAF7] backdrop-blur-2xl border-[1.5px] border-[#D4AF37]/50 rounded-2xl sm:rounded-3xl shadow-[0_20px_50px_rgba(44,30,24,0.18),0_0_30px_rgba(212,175,55,0.12)] z-50 overflow-hidden select-none font-sans"
          >
            {/* Ambient Gold Glow in Top-Right */}
            <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-amber-500/15 blur-2xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-[#FAF5EE] via-[#FCFAF7] to-[#FAF5EE] border-b border-[#E8DFC8]/70 relative z-10">
              <div className="flex items-center gap-2">
                <span className="font-serif font-black text-sm sm:text-[15px] uppercase tracking-wide text-[#221814]">
                  Notifications
                </span>
                {unread > 0 && (
                  <span className="bg-gradient-to-r from-[#FFEAA0] via-[#F5C46B] to-[#C9A96E] text-[#1A0E07] px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider border border-[#D4AF37]/40 shadow-2xs">
                    {unread} new
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                {unread > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[#8C6239] hover:text-[#221814] text-[11px] font-serif font-bold uppercase tracking-wider flex items-center gap-1 transition-colors hover:underline cursor-pointer"
                    title="Mark all as read"
                  >
                    <CheckCheck size={13} strokeWidth={2.2} /> All read
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="w-6 h-6 rounded-full bg-[#FAF5EE] border border-[#E7DDD0] text-[#5C483E] hover:text-[#221814] hover:bg-[#F2ECE4] flex items-center justify-center transition-all cursor-pointer"
                  aria-label="Close notifications"
                >
                  <X size={13} strokeWidth={2.2} />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-84 overflow-y-auto divide-y divide-[#EFE8DD] relative z-10">
              {loading ? (
                <div className="py-10 text-center">
                  <div className="w-6 h-6 border-2 border-[#B88E4B] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-[#8C6239] font-serif">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-12 text-center px-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#FAF5EE] border border-[#E8DFC8] flex items-center justify-center text-[#B88E4B] mx-auto mb-3 shadow-2xs">
                    <Bell size={22} strokeWidth={1.8} />
                  </div>
                  <h4 className="font-serif font-bold text-[#221814] text-sm">All caught up!</h4>
                  <p className="text-xs text-[#7A6354] mt-1">You have no new alerts or notifications at this moment.</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3.5 px-4.5 py-3.5 transition-all ${
                      n.isNew
                        ? 'bg-gradient-to-r from-[#FAF5EE] via-[#FCFAF7] to-white border-l-[3.5px] border-l-[#B88E4B]'
                        : 'bg-white/50 hover:bg-[#FAF7F2]'
                    }`}
                  >
                    {/* Thematic Icon Badge */}
                    {getNotificationIcon(n)}

                    {/* Notification Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className={`text-[13px] sm:text-[13.5px] leading-snug font-serif ${n.isNew ? 'font-black text-[#221814]' : 'font-bold text-[#423128]'}`}>
                          {n.title}
                        </h4>
                        {n.isNew && (
                          <button
                            onClick={() => markOneRead(n.id)}
                            className="text-[#C9A96E] hover:text-[#8C6239] transition-colors shrink-0 p-0.5 hover:scale-110"
                            title="Mark as read"
                          >
                            <Check size={14} strokeWidth={2.4} />
                          </button>
                        )}
                      </div>

                      {n.desc && (
                        <p className="text-xs text-[#5C483E] font-medium mt-0.5 leading-relaxed line-clamp-2">
                          {n.desc}
                        </p>
                      )}

                      <span className="text-[10px] font-serif font-bold text-[#8C6239]/85 uppercase tracking-wider block mt-1.5">
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2.5 bg-[#FAF7F2] border-t border-[#E8DFC8]/70 text-center relative z-10">
                <p className="font-serif text-[10.5px] font-bold text-[#8C6239] uppercase tracking-widest">
                  Showing last {notifications.length} notifications
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
