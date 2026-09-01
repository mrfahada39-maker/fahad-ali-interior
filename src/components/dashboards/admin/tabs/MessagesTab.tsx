'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Search,
  Users,
  Mail,
  Send,
  Sparkles,
  Phone,
  Clock,
  CheckCheck,
  Headphones,
  Paperclip,
  Smile,
  ShieldCheck,
  Star,
  ExternalLink,
  Crown,
  Zap,
  CheckCircle2,
  RefreshCw,
  MoreVertical,
  ChevronRight,
  ShoppingBag,
  Inbox,
  Filter,
  ArrowLeft,
  Video,
  PhoneCall
} from 'lucide-react';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import VoiceNotePlayer from '@/components/chat/VoiceNotePlayer';
import VoiceNoteRecorder from '@/components/chat/VoiceNoteRecorder';

const formatPrice = (n: number) => new Intl.NumberFormat('en-PK').format(n);

interface MessagesTabProps {
  messages: any[];
  replyDrafts: Record<string, string>;
  setReplyDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  sendAdminReply: (threadId: string) => void;
  selectedThreadIndex: number;
  setSelectedThreadIndex: (idx: number) => void;
  onStartCall?: (type: 'voice' | 'video', targetUser: any) => void;
  onSendAdminVoiceNote?: (threadId: string, audioUrl: string, duration: number) => void;
}

const QUICK_REPLIES = [
  'Assalam-o-Alaikum! How may we assist you today with our luxury collection?',
  'Our furniture is crafted from 100% Solid Sheesham Wood with 10-Year Lifetime Warranty.',
  'Your custom order has been verified and is in master artisan production.',
  'Our logistics team will coordinate delivery with you prior to shipment dispatch.',
  'We would love to share our exclusive bespoke catalogue and finish swatches.',
];

export default function MessagesTab({
  messages,
  replyDrafts,
  setReplyDrafts,
  sendAdminReply,
  selectedThreadIndex,
  setSelectedThreadIndex,
  onStartCall,
  onSendAdminVoiceNote,
}: MessagesTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread'>('all');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('chat');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Normalize threads
  const normalizedThreads = (() => {
    if (!Array.isArray(messages) || messages.length === 0) return [];
    if (messages[0] && Array.isArray(messages[0].messages)) {
      return messages;
    }
    const threadMap = new Map<string, any>();
    messages.forEach((msg: any) => {
      const uId = msg.userId || 'guest_user';
      if (!threadMap.has(uId)) {
        threadMap.set(uId, {
          id: uId,
          name: msg.userName || msg.name || 'Valued Client',
          email: msg.userEmail || msg.email || 'client@fahadali.com',
          phone: msg.userPhone || msg.phone || '',
          messages: [],
        });
      }
      threadMap.get(uId).messages.push(msg);
    });
    return Array.from(threadMap.values());
  })();

  const filteredThreads = normalizedThreads.filter((t) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      t.name?.toLowerCase().includes(q) ||
      t.email?.toLowerCase().includes(q) ||
      t.phone?.toLowerCase().includes(q) ||
      t.messages?.some((m: any) => m.text?.toLowerCase().includes(q));

    if (filterType === 'unread') {
      const last = t.messages?.[t.messages.length - 1];
      return matchesSearch && last?.sender === 'user';
    }
    return matchesSearch;
  });

  const activeThread = filteredThreads[selectedThreadIndex] || filteredThreads[0] || normalizedThreads[0];

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.messages?.length, selectedThreadIndex]);

  const totalMessagesCount = normalizedThreads.reduce((acc: number, t: any) => acc + (t.messages?.length || 0), 0);
  const unreadCount = normalizedThreads.filter((t: any) => {
    const last = t.messages?.[t.messages.length - 1];
    return last && last.sender === 'user';
  }).length;

  const kpis = [
    {
      label: 'ACTIVE INBOX THREADS',
      numValue: normalizedThreads.length,
      sub: `${unreadCount} Awaiting Reply`,
      icon: Users,
      color: 'text-purple-600',
      iconBg: 'bg-gradient-to-br from-purple-50 via-fuchsia-50 to-purple-100/80 border-purple-300/70 text-purple-600 shadow-[0_3px_12px_rgba(168,85,247,0.2)]',
      ambientGlow: 'bg-purple-500/10',
      cardGlow: 'border-purple-300/80 hover:border-purple-500 shadow-[0_4px_20px_rgba(168,85,247,0.08)] hover:shadow-[0_12px_30px_rgba(168,85,247,0.18)]',
      badgeBg: 'bg-purple-50 text-purple-800 border-purple-500/30',
      dotColor: 'bg-purple-500',
    },
    {
      label: 'TOTAL MESSAGES EXCHANGED',
      numValue: totalMessagesCount,
      sub: '✓ Bi-Directional Live Sync',
      icon: Mail,
      color: 'text-[#B88E4B]',
      iconBg: 'bg-gradient-to-br from-amber-50 via-[#FAF5EE] to-amber-100/80 border-amber-300/70 text-[#B88E4B] shadow-[0_3px_12px_rgba(184,142,75,0.2)]',
      ambientGlow: 'bg-[#B88E4B]/10',
      cardGlow: 'border-amber-300/80 hover:border-[#B88E4B] shadow-[0_4px_20px_rgba(184,142,75,0.08)] hover:shadow-[0_12px_30px_rgba(184,142,75,0.18)]',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-500/30',
      dotColor: 'bg-emerald-500',
    },
    {
      label: 'AVG FIRST RESPONSE SPEED',
      numValue: 2,
      suffix: ' mins',
      sub: '⚡ VIP Concierge Hotline',
      icon: Zap,
      color: 'text-amber-600',
      iconBg: 'bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100/80 border-amber-300/70 text-amber-600 shadow-[0_3px_12px_rgba(245,158,11,0.2)]',
      ambientGlow: 'bg-amber-500/10',
      cardGlow: 'border-amber-300/80 hover:border-amber-500 shadow-[0_4px_20px_rgba(245,158,11,0.08)] hover:shadow-[0_12px_30px_rgba(245,158,11,0.18)]',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-500/30',
      dotColor: 'bg-amber-500',
    },
    {
      label: 'SUPPORT SATISFACTION (CSAT)',
      numValue: 99.4,
      suffix: '%',
      sub: '⭐ 5-Star Client Rating',
      icon: Star,
      color: 'text-emerald-600',
      iconBg: 'bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/80 border-emerald-300/70 text-emerald-600 shadow-[0_3px_12px_rgba(16,185,129,0.2)]',
      ambientGlow: 'bg-emerald-500/10',
      cardGlow: 'border-emerald-300/80 hover:border-emerald-500 shadow-[0_4px_20px_rgba(16,185,129,0.08)] hover:shadow-[0_12px_30px_rgba(16,185,129,0.18)]',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-500/30',
      dotColor: 'bg-emerald-500',
    },
  ];

  const handleApplyQuickReply = (text: string) => {
    if (!activeThread?.id) return;
    setReplyDrafts((prev) => ({
      ...prev,
      [activeThread.id]: text,
    }));
  };

  const whatsappUrl = activeThread?.phone
    ? `https://wa.me/${activeThread.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${activeThread.name || 'Valued Client'}, from Fahad Ali Interior Support:`)}`
    : null;

  return (
    <div className="space-y-3 font-sans">
      
      {/* ── $100,000 EXECUTIVE HEADER (DUAL RESPONSIVE: GRAND ON DESKTOP, COMPACT ON MOBILE) ── */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2.5 bg-gradient-to-r from-white via-[#FCFAF7] to-white border border-[#E7DDD0] p-3 sm:py-2.5 sm:px-5 lg:py-3 lg:px-6 rounded-2xl lg:rounded-[20px] shadow-[0_4px_20px_rgba(44,30,24,0.02)] shrink-0 relative overflow-hidden group hover:border-[#B88E4B]/40 transition-all"
      >
        <div className="relative z-10 w-full lg:w-auto">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
            <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-[#FAF0E2] to-[#F5E5CF] text-[#8C6239] border border-[#B88E4B]/35 flex items-center gap-1 shadow-2xs">
              <Sparkles size={9} className="text-[#B88E4B] animate-spin duration-3000" />
              <span className="lg:hidden">V2.4</span>
              <span className="hidden lg:inline">OMNICHANNEL LIVE SUPPORT V2.4</span>
            </span>

            <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[8.5px] sm:text-[9px] font-black font-mono uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-500/35 flex items-center gap-1.5 shadow-2xs">
              <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500 animate-pulse" />
              </span>
              <span className="lg:hidden">LIVE MESSAGING</span>
              <span className="hidden lg:inline">LIVE BI-DIRECTIONAL CLIENT MESSAGING</span>
            </span>
          </div>

          <h1 className="text-[21px] sm:text-2xl lg:text-3xl xl:text-4xl font-black text-[#221814] tracking-tight leading-snug lg:leading-tight font-serif">
            {/* Mobile: Exactly 4 Words with & */}
            <span className="sm:hidden">
              Client Messages <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] bg-clip-text text-transparent font-serif">& Support</span>
            </span>

            {/* Desktop: Full Title */}
            <span className="hidden sm:inline">
              Client Messages <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] bg-clip-text text-transparent font-serif">& Live Support Console</span>
            </span>
          </h1>
          <p className="hidden sm:block text-stone-500 text-[11px] sm:text-xs font-medium mt-0.5">
            Real-time client conversations, instant WhatsApp hotline integration, and 1-click VIP Quick Responses.
          </p>
        </div>

        {/* Live Concierge Online Pill */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full lg:w-auto shrink-0 relative z-10 pt-1 sm:pt-0 border-t sm:border-t-0 border-[#E7DDD0]/60">
          <div className="bg-gradient-to-br from-[#FAF5EE] via-white to-[#F3E7D3] border border-[#E2D1BC] px-3 sm:px-4 py-1 sm:py-2 rounded-xl sm:rounded-2xl shadow-xs flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto justify-center sm:justify-start">
            <MessageSquare size={16} className="text-[#B88E4B]" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] sm:text-xs font-black text-[#1F1612] uppercase tracking-wider">Concierge Online</span>
              </div>
              <span className="text-[8.5px] sm:text-[9.5px] font-bold text-stone-500 block">Response Time: &lt; 2m</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── 4 KPI METRIC CARDS (ULTRA-MODERN, STYLISH & ANIMATED GLASS JEWEL EDITION WITH LUMINOUS BORDERS) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 shrink-0">
        {kpis.map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, scale: 1.015 }}
            whileTap={{ scale: 0.98 }}
            transition={{ delay: idx * 0.05, duration: 0.25, type: 'spring', stiffness: 350, damping: 25 }}
            className={`bg-gradient-to-br from-white via-[#FCFAF7] to-[#FAF5EE] border rounded-2xl sm:rounded-[22px] p-4.5 flex flex-col justify-between min-h-[124px] transition-all duration-300 cursor-pointer relative overflow-hidden group ${kpi.cardGlow}`}
          >
            {/* Ambient Colored Radial Glow in Top Corner */}
            <div className={`absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl pointer-events-none transition-opacity duration-300 opacity-80 sm:opacity-60 sm:group-hover:opacity-100 ${kpi.ambientGlow}`} />

            <div className="flex justify-between items-start relative z-10">
              <span className="text-[10.5px] font-black tracking-wider text-[#7A6354] uppercase">
                {kpi.label}
              </span>
              {/* 3D Glass Jewel Orb */}
              <div className={`w-9 h-9 rounded-2xl border flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 ${kpi.iconBg}`}>
                <kpi.icon size={17} className="stroke-[2.2]" />
              </div>
            </div>

            <div className="mt-2 relative z-10">
              <h3 className="text-2xl sm:text-[28px] lg:text-[30px] font-black text-[#1F1612] tracking-tight leading-none flex items-baseline">
                <AnimatedCounter value={kpi.numValue} duration={1.5} />
                {kpi.suffix ? <span className="text-base font-bold text-[#8C6D46] ml-1">{kpi.suffix}</span> : null}
              </h3>

              <div className="mt-2.5 flex items-center">
                <span className={`inline-flex items-center gap-1.5 text-[10.5px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs ${kpi.badgeBg}`}>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${kpi.dotColor} opacity-75`} />
                    <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${kpi.dotColor}`} />
                  </span>
                  {kpi.sub}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── MAIN ADVANCED TWO-PANE CHAT CONSOLE ── */}
      {normalizedThreads.length === 0 ? (
        <div className="bg-white border border-[#E7DDD0] rounded-[24px] p-16 text-center shadow-[0_4px_20px_rgba(44,30,24,0.015)]">
          <div className="w-16 h-16 rounded-2xl bg-[#FAF5EE] border border-[#E2D1BC] flex items-center justify-center mx-auto mb-3 text-[#B88E4B]">
            <MessageSquare size={32} />
          </div>
          <h3 className="text-lg font-black text-[#221814] font-serif">No Customer Conversations Yet</h3>
          <p className="text-stone-500 text-xs max-w-sm mx-auto mt-1">
            When clients send messages or product inquiries from the storefront, they will appear here instantly in real-time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start h-[560px] lg:h-[520px]">
          
          {/* ── LEFT PANE: INBOX THREADS SIDEBAR (4 COLS) ── */}
          <div className={`lg:col-span-4 bg-white border border-[#E7DDD0] rounded-[22px] p-3.5 shadow-[0_4px_20px_rgba(44,30,24,0.015)] flex-col justify-between h-full overflow-hidden ${
            mobileView === 'chat' ? 'hidden lg:flex' : 'flex'
          }`}>
            <div className="flex flex-col h-full overflow-hidden">
              
              {/* Header & Filter Pills */}
              <div className="flex items-center justify-between pb-2.5 border-b border-neutral-100 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#FAF5EE] text-[#8C6239] border border-[#E2D1BC] flex items-center justify-center shadow-2xs">
                    <Inbox size={14} />
                  </div>
                  <h3 className="text-sm font-black text-[#221814] font-serif">Inbox Threads</h3>
                </div>
                <span className="text-[10px] font-black bg-[#FAF5EE] text-[#8C6239] px-2.5 py-0.5 rounded-full border border-[#E2D1BC]">
                  {filteredThreads.length} Total
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative mt-2.5 mb-2 shrink-0">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  placeholder="Search client or message..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#FCFAF7] border border-[#E7DDD0] text-[#221814] placeholder:text-stone-400 font-bold rounded-xl h-8.5 pl-8.5 pr-3 text-xs focus:border-[#B88E4B] outline-none"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-[#FCFAF7] p-0.5 rounded-xl border border-[#E7DDD0] mb-2 shrink-0 text-[10px] font-black">
                <button
                  onClick={() => setFilterType('all')}
                  className={`flex-1 py-1 rounded-lg transition-all cursor-pointer ${
                    filterType === 'all' ? 'bg-gradient-to-r from-[#B88E4B] to-[#996515] text-white shadow-2xs' : 'text-stone-500 hover:text-[#221814]'
                  }`}
                >
                  All ({normalizedThreads.length})
                </button>
                <button
                  onClick={() => setFilterType('unread')}
                  className={`flex-1 py-1 rounded-lg transition-all cursor-pointer ${
                    filterType === 'unread' ? 'bg-gradient-to-r from-[#B88E4B] to-[#996515] text-white shadow-2xs' : 'text-stone-500 hover:text-[#221814]'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
              </div>

              {/* Threads List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-1">
                {filteredThreads.map((thread: any, idx: number) => {
                  const isSelected = activeThread?.id === thread.id;
                  const lastMsg = thread.messages?.[thread.messages.length - 1];
                  const lastMsgTime = lastMsg?.createdAt
                    ? new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Active';
                  const initial = thread.name ? thread.name[0].toUpperCase() : 'C';

                  return (
                    <button
                      key={thread.id}
                      onClick={() => {
                        setSelectedThreadIndex(idx);
                        setMobileView('chat');
                      }}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all duration-200 flex items-start gap-2.5 relative cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#FAF5EE] to-[#F3E7D3] border-[#B88E4B] shadow-xs'
                          : 'bg-[#FCFAF7] hover:bg-[#F7F2EB] border-[#E7DDD0]'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#B88E4B] to-[#996515] text-white font-serif font-black text-xs flex items-center justify-center shrink-0 shadow-2xs relative">
                        {initial}
                        <span className="w-2 h-2 rounded-full bg-emerald-500 border border-white absolute -bottom-0.5 -right-0.5" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 pr-8">
                        <p className="text-[#1F1612] font-black text-xs truncate font-serif leading-none">{thread.name || 'Valued Client'}</p>
                        <p className="text-stone-400 text-[9.5px] truncate mt-0.5">{thread.email || 'Direct Client'}</p>
                        {lastMsg && (
                          <p className="text-[#4A3B32] text-[10.5px] truncate font-medium mt-1">
                            <span className="text-[#8C6239] font-bold">{lastMsg.sender === 'support' ? 'You: ' : ''}</span>
                            {lastMsg.text}
                          </p>
                        )}
                      </div>

                      {/* Right Timestamp & Count */}
                      <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1">
                        <span className="text-[9px] text-stone-400 font-bold">
                          {lastMsgTime}
                        </span>
                        <span className="text-[8.5px] font-black bg-white text-[#8C6239] px-1.5 py-0.2 rounded-full border border-[#E2D1BC] shadow-2xs">
                          {thread.messages?.length || 0}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Bottom Support Tip */}
              <div className="bg-[#FCFAF7] border border-[#E7DDD0] rounded-xl p-2.5 flex items-center gap-2 shrink-0 mt-1">
                <Sparkles size={14} className="text-[#B88E4B] shrink-0" />
                <p className="text-[10px] text-stone-500 font-medium leading-snug">
                  Click any 1-Click Preset to auto-fill high-converting responses!
                </p>
              </div>

            </div>
          </div>

          {/* ── RIGHT PANE: ADVANCED LIVE CHAT WORKSPACE (8 COLS) ── */}
          <div className={`lg:col-span-8 bg-white border border-[#E7DDD0] rounded-[22px] overflow-hidden shadow-[0_4px_20px_rgba(44,30,24,0.015)] flex-col h-full justify-between ${
            mobileView === 'list' ? 'hidden lg:flex' : 'flex'
          }`}>
            
            {/* Active Thread Luxury Header */}
            <div className="px-3 sm:px-4 py-2.5 bg-[#FCFAF7] border-b border-[#E7DDD0] flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                {/* Mobile Back Button to Inbox List */}
                <button
                  onClick={() => setMobileView('list')}
                  className="lg:hidden px-2.5 py-1.5 rounded-xl bg-[#FAF5EE] text-[#8C6239] border border-[#E2D1BC] flex items-center gap-1 text-[10.5px] font-black shadow-2xs cursor-pointer hover:bg-[#B88E4B] hover:text-white transition-all shrink-0"
                  title="Back to Inbox list"
                >
                  <ArrowLeft size={13} className="stroke-[2.5]" />
                  <span>Inbox</span>
                </button>

                <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-gradient-to-br from-[#B88E4B] to-[#996515] text-white flex items-center justify-center font-serif font-black text-xs sm:text-sm shadow-2xs shrink-0">
                  {activeThread?.name ? activeThread.name[0].toUpperCase() : 'C'}
                </div>
                <div>
                  <h3 className="font-black text-xs sm:text-sm text-[#221814] flex items-center gap-1.5 font-serif leading-none">
                    {activeThread?.name || 'Valued Client'}
                    <span className="px-1.5 py-0.2 rounded-full text-[8px] sm:text-[8.5px] font-black bg-emerald-50 text-emerald-700 border border-emerald-300">
                      LIVE CLIENT
                    </span>
                  </h3>
                  <p className="text-stone-500 text-[9.5px] sm:text-[10px] font-semibold mt-0.5 truncate max-w-[170px] sm:max-w-none">
                    {activeThread?.email} {activeThread?.phone ? `• ${activeThread.phone}` : ''}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Audio Call Button */}
                <button
                  type="button"
                  onClick={() => onStartCall?.('voice', activeThread)}
                  className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-[#B88E4B] to-[#8C6239] hover:brightness-110 text-white font-black text-[10px] flex items-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer"
                  title="Voice Call Client"
                >
                  <Phone size={11} />
                  <span>Call</span>
                </button>

                {/* Video Call Button */}
                <button
                  type="button"
                  onClick={() => onStartCall?.('video', activeThread)}
                  className="px-2.5 py-1 rounded-xl bg-[#1F1612] hover:bg-[#32231C] text-amber-200 border border-[#B88E4B]/40 font-black text-[10px] flex items-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer"
                  title="Video Call Client"
                >
                  <Video size={11} />
                  <span>Video</span>
                </button>

                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 font-black text-[10px] flex items-center gap-1 shadow-2xs transition-colors"
                  >
                    <MessageSquare size={12} />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </a>
                )}
                <span className="text-[10px] font-mono font-black bg-[#FAF5EE] text-[#8C6239] px-2.5 py-1 rounded-xl border border-[#E2D1BC]">
                  Thread #{activeThread?.id?.slice(-6) || 'LIVE'}
                </span>
              </div>
            </div>

            {/* Quick AI Response Buttons Bar */}
            <div className="bg-[#FAF7F2] border-b border-[#E7DDD0] px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-hide shrink-0">
              <span className="text-[8.5px] font-black uppercase tracking-wider text-[#8C6239] shrink-0 flex items-center gap-1">
                <Zap size={10} className="text-[#B88E4B]" /> Presets:
              </span>
              {QUICK_REPLIES.map((reply, i) => (
                <button
                  key={i}
                  onClick={() => handleApplyQuickReply(reply)}
                  className="px-2 py-0.5 rounded-lg bg-white border border-[#E7DDD0] hover:border-[#B88E4B] text-[#1F1612] hover:text-[#B88E4B] text-[9.5px] font-semibold whitespace-nowrap shadow-2xs transition-all cursor-pointer"
                  title="Click to insert into reply draft"
                >
                  ⚡ {reply.slice(0, 26)}...
                </button>
              ))}
            </div>

            {/* Messages Chat Stream */}
            <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-white min-h-0">
              {/* Date Badge */}
              <div className="flex items-center justify-center my-0.5">
                <span className="text-[9px] font-black text-stone-400 bg-[#FCFAF7] px-2.5 py-0.2 rounded-full border border-[#E7DDD0]">
                  Today, {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>

              {(activeThread?.messages || []).map((msg: any, idx: number) => {
                const isSupport = msg.sender === 'support';
                const timeStr = msg.createdAt
                  ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '01:17 PM';

                const isVoiceNote = typeof msg.text === 'string' && msg.text.startsWith('[VOICE_NOTE]:');
                const voiceAudioUrl = isVoiceNote ? msg.text.replace('[VOICE_NOTE]:', '') : '';

                return (
                  <motion.div
                    key={msg.id || idx}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isSupport ? 'justify-end' : 'justify-start'} items-end gap-2`}
                  >
                    {!isSupport && (
                      <div className="w-6.5 h-6.5 rounded-lg bg-[#221814] text-white text-[9px] font-black flex items-center justify-center shrink-0 shadow-xs font-serif">
                        {activeThread?.name ? activeThread.name[0].toUpperCase() : 'C'}
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] p-3 rounded-2xl shadow-xs text-xs leading-relaxed ${
                        isSupport
                          ? 'bg-gradient-to-br from-[#B88E4B] via-[#A68254] to-[#8C6944] text-white rounded-br-xs'
                          : 'bg-[#FCFAF7] text-[#1F1612] rounded-bl-xs border border-[#E7DDD0]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-1 border-b pb-0.5 border-black/10">
                        <span className={`font-black text-[8.5px] uppercase tracking-wider ${isSupport ? 'text-amber-100' : 'text-[#8C6239]'}`}>
                          {isSupport ? 'FAHAD ALI LUXURY SUPPORT' : (activeThread?.name || 'CLIENT').toUpperCase()}
                        </span>
                        <span className={`text-[8.5px] ${isSupport ? 'text-white/80' : 'text-stone-400'}`}>
                          {timeStr}
                        </span>
                      </div>
                      <div className="flex items-end justify-between gap-2 pt-0.5">
                        {isVoiceNote ? (
                          <VoiceNotePlayer src={voiceAudioUrl} isMe={isSupport} />
                        ) : (
                          <p className="text-xs font-medium">{msg.text}</p>
                        )}
                        {isSupport && (
                          <CheckCheck size={13} className="text-amber-200 shrink-0 ml-1" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={chatBottomRef} />
            </div>

            {/* Floating Chat Reply Console (ALWAYS VISIBLE & PINNED AT BOTTOM) */}
            <div className="p-2.5 bg-[#FCFAF7] border-t border-[#E7DDD0] shrink-0">
              <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-[#E7DDD0] focus-within:border-[#B88E4B] focus-within:ring-2 focus-within:ring-[#B88E4B]/20 transition-all shadow-xs">
                <VoiceNoteRecorder onSendVoiceNote={(audioUrl, dur) => onSendAdminVoiceNote?.(activeThread?.id, audioUrl, dur)} />
                <input
                  value={replyDrafts[activeThread?.id] || ''}
                  onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [activeThread?.id]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendAdminReply(activeThread?.id);
                    }
                  }}
                  placeholder={`Type reply or record voice note to ${activeThread?.name || 'Client'}... (Press Enter)`}
                  className="bg-transparent border-0 text-[#221814] font-bold text-xs placeholder:text-stone-400 focus:outline-none h-8.5 flex-1 px-2"
                />
                <button
                  onClick={() => sendAdminReply(activeThread?.id)}
                  className="bg-gradient-to-r from-[#B88E4B] to-[#996515] hover:brightness-110 text-white font-black rounded-lg text-xs px-4 h-8.5 shadow-xs flex items-center gap-1.5 shrink-0 transition-all active:scale-95 cursor-pointer"
                >
                  <Send size={12} />
                  <span>Reply</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
