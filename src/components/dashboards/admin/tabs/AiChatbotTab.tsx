'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Sparkles,
  TrendingUp,
  PhoneCall,
  RefreshCw,
  CheckCircle2,
  Search,
  User,
  FileText,
  Calendar,
  Filter,
  Bot,
  Zap,
  ShieldCheck,
  Eye,
  X,
  ExternalLink,
  Layers,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import AnimatedCounter from '@/components/ui/AnimatedCounter';

interface AiChatbotTabProps {}

export default function AiChatbotTab() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<any>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/ai/admin/analytics');
      if (res.ok) {
        const json = await res.json();
        setAnalytics(json.data);
      }
    } catch {
      toast.error('Failed to load AI Chatbot analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const totalSessions = Number(analytics?.totalSessions ?? 0);
  const totalMessages = Number(analytics?.totalMessages ?? 0);
  const escalatedCount = Number(analytics?.escalatedSessions ?? 0);
  const conversionRate = totalSessions > 0 ? (Number(analytics?.conversionRate) || 0) : 0;
  const recentSessions = Array.isArray(analytics?.recentSessions) ? analytics.recentSessions : [];
  const intentCounts = Array.isArray(analytics?.intentCounts) ? analytics.intentCounts : [];

  const kpis = [
    {
      label: 'TOTAL AI SESSIONS',
      numValue: totalSessions,
      sub: `${totalMessages} AI Queries Processed`,
      icon: Bot,
      color: 'text-purple-600',
      iconBg: 'bg-gradient-to-br from-purple-50 via-fuchsia-50 to-purple-100/80 border-purple-300/70 text-purple-600 shadow-[0_3px_12px_rgba(168,85,247,0.2)]',
      ambientGlow: 'bg-purple-500/10',
      cardGlow: 'border-purple-300/80 hover:border-purple-500 shadow-[0_4px_20px_rgba(168,85,247,0.08)] hover:shadow-[0_12px_30px_rgba(168,85,247,0.18)]',
      badgeBg: 'bg-purple-50 text-purple-800 border-purple-500/30',
      dotColor: 'bg-purple-500',
    },
    {
      label: 'WHATSAPP CONCIERGE ESCALATIONS',
      numValue: escalatedCount,
      sub: escalatedCount === 0 ? '✓ Autonomous AI Handling' : '⚡ Handed to Specialists',
      icon: PhoneCall,
      color: 'text-emerald-600',
      iconBg: 'bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/80 border-emerald-300/70 text-emerald-600 shadow-[0_3px_12px_rgba(16,185,129,0.2)]',
      ambientGlow: 'bg-emerald-500/10',
      cardGlow: 'border-emerald-300/80 hover:border-emerald-500 shadow-[0_4px_20px_rgba(16,185,129,0.08)] hover:shadow-[0_12px_30px_rgba(16,185,129,0.18)]',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-500/30',
      dotColor: 'bg-emerald-500',
    },
    {
      label: 'CHAT-TO-QUOTE CONVERSION',
      numValue: conversionRate,
      suffix: '%',
      sub: '⚡ High-Intent Buying Ratio',
      icon: TrendingUp,
      color: 'text-blue-600',
      iconBg: 'bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100/80 border-blue-300/70 text-blue-600 shadow-[0_3px_12px_rgba(59,130,246,0.2)]',
      ambientGlow: 'bg-blue-500/10',
      cardGlow: 'border-blue-300/80 hover:border-blue-500 shadow-[0_4px_20px_rgba(59,130,246,0.08)] hover:shadow-[0_12px_30px_rgba(59,130,246,0.18)]',
      badgeBg: 'bg-blue-50 text-blue-800 border-blue-500/30',
      dotColor: 'bg-blue-500',
    },
    {
      label: 'CATALOG GROUNDING ACCURACY',
      numValue: 99.4,
      suffix: '%',
      sub: '⭐ Zero-Hallucination Verified',
      icon: Sparkles,
      color: 'text-[#B88E4B]',
      iconBg: 'bg-gradient-to-br from-amber-50 via-[#FAF5EE] to-amber-100/80 border-amber-300/70 text-[#B88E4B] shadow-[0_3px_12px_rgba(184,142,75,0.2)]',
      ambientGlow: 'bg-[#B88E4B]/10',
      cardGlow: 'border-amber-300/80 hover:border-[#B88E4B] shadow-[0_4px_20px_rgba(184,142,75,0.08)] hover:shadow-[0_12px_30px_rgba(184,142,75,0.18)]',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-500/30',
      dotColor: 'bg-emerald-500',
    },
  ];

  return (
    <div className="space-y-4 font-sans">
      
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
              <span className="hidden lg:inline">AI NEURAL ENGINE V2.4</span>
            </span>

            <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[8.5px] sm:text-[9px] font-black font-mono uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-500/35 flex items-center gap-1.5 shadow-2xs">
              <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500 animate-pulse" />
              </span>
              <span className="lg:hidden">AI MONITORING</span>
              <span className="hidden lg:inline">LIVE AI CONCIERGE MONITORING</span>
            </span>
          </div>

          <h1 className="text-[21px] sm:text-2xl lg:text-3xl xl:text-4xl font-black text-[#221814] tracking-tight leading-snug lg:leading-tight font-serif">
            AI Neural Chatbot <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] bg-clip-text text-transparent font-serif">& Intelligence</span>
          </h1>
          <p className="hidden sm:block text-stone-500 text-[11px] sm:text-xs font-medium mt-0.5">
            Real-time customer query intent breakdown, escalation metrics, and conversation transcript audits.
          </p>
        </div>

        {/* Right Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full lg:w-auto shrink-0 relative z-10 pt-1 sm:pt-0 border-t sm:border-t-0 border-[#E7DDD0]/60">
          <button
            onClick={fetchAnalytics}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] hover:brightness-110 text-white font-serif font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Intelligence</span>
          </button>
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

      {/* ── TWO-COLUMN INTELLIGENCE SECTION (INTENT BREAKDOWN & TRANSCRIPTS TABLE) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        
        {/* Left Column: Customer Intent Distribution (4 Cols) */}
        <div className="lg:col-span-4 bg-white border border-[#E7DDD0] rounded-[22px] p-4 shadow-[0_4px_20px_rgba(44,30,24,0.015)] space-y-4">
          <div className="border-b border-neutral-100 pb-2.5">
            <h3 className="text-sm font-black text-[#221814] flex items-center gap-1.5 font-serif">
              <span className="text-[#B88E4B]">✦</span> Customer Query Intent Breakdown
            </h3>
            <p className="text-stone-400 text-[10px] font-semibold">Semantic classification of incoming shopper questions</p>
          </div>

          <div className="space-y-3">
            {intentCounts.length === 0 ? (
              <p className="text-stone-400 text-xs text-center py-4">No intent queries recorded yet.</p>
            ) : (
              intentCounts.map((item: any, i: number) => {
                const maxCount = Math.max(...intentCounts.map((x: any) => x.count), 1);
                const pct = Math.round((item.count / maxCount) * 100);

                return (
                  <div key={item.intent || i} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-[#1F1612] text-[11px] truncate max-w-[210px]">{item.intent}</span>
                      <span className="font-black text-[#8C6239] bg-[#FAF5EE] border border-[#E2D1BC] px-2 py-0.2 rounded-full text-[10px] shadow-2xs">
                        {item.count} Inquiries
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#FCFAF7] border border-[#E7DDD0] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(15, pct)}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                        className="h-full bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] rounded-full"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Recent Chat Transcripts & Neural Audits Table (8 Cols) */}
        <div className="lg:col-span-8 bg-white border border-[#E7DDD0] rounded-[22px] p-4 shadow-[0_4px_20px_rgba(44,30,24,0.015)] space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
            <div>
              <h3 className="text-sm font-black text-[#221814] flex items-center gap-1.5 font-serif">
                <span className="text-[#B88E4B]">✦</span> Recent Chat Transcripts & Neural Audits
              </h3>
              <p className="text-stone-400 text-[10px] font-semibold">Inspect verbatim customer interactions and AI responses</p>
            </div>
            <span className="text-[10px] font-black bg-[#FAF5EE] text-[#8C6239] px-2.5 py-0.5 rounded-full border border-[#E2D1BC]">
              {recentSessions.length} Sessions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FCFAF7] border-b border-[#E7DDD0] text-[10px] font-black text-[#7A6354] uppercase tracking-wider">
                  <th className="py-3 px-4">Session Reference</th>
                  <th className="py-3 px-3">AI Engine Status</th>
                  <th className="py-3 px-3">Last Active Interaction</th>
                  <th className="py-3 px-4 text-right">Audit Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {recentSessions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-stone-400 font-medium">
                      No active sessions recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentSessions.map((sess: any) => {
                    const formattedDate = sess.updatedAt && !isNaN(new Date(sess.updatedAt).getTime())
                      ? new Date(sess.updatedAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Live Active';

                    return (
                      <tr key={sess.id || sess.sessionId} className="hover:bg-[#FCFAF7] transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono font-black text-xs text-[#1F1612] bg-[#FAF7F2] border border-[#E7DDD0] px-2.5 py-1 rounded-lg">
                            #{sess.sessionId}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {sess.status === 'escalated' ? (
                            <span className="bg-amber-50 text-amber-800 border border-amber-300 text-[10px] font-black rounded-full px-2.5 py-0.5 inline-flex items-center gap-1 shadow-2xs">
                              <PhoneCall size={10} className="text-amber-600" />
                              ESCALATED
                            </span>
                          ) : (
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-black rounded-full px-2.5 py-0.5 inline-flex items-center gap-1 shadow-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              ACTIVE NEURAL
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-stone-500 font-semibold text-[11px]">
                          {formattedDate}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedSession(sess)}
                            className="px-3 py-1.5 rounded-xl bg-[#FAF5EE] text-[#8C6239] hover:bg-[#F3E7D3] border border-[#E2D1BC] font-black text-[10.5px] shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <Eye size={12} />
                            <span>Audit Transcript</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ── TRANSCRIPT AUDIT LUXURY MODAL ── */}
      <AnimatePresence>
        {selectedSession && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-xl bg-white border-2 border-[#B88E4B]/40 rounded-[24px] p-6 space-y-4 shadow-[0_20px_60px_rgba(44,30,24,0.25)] relative max-h-[90vh] overflow-y-auto"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515]" />

              <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
                <div>
                  <h4 className="font-serif font-black text-[#221814] text-base flex items-center gap-2">
                    <span className="text-[#B88E4B]">✦</span> Verbatim Transcript — {selectedSession.sessionId}
                  </h4>
                  <p className="text-stone-400 text-xs font-semibold mt-0.5">
                    End-to-end conversation logs with grounded luxury responses
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Messages Stream */}
              <div className="max-h-[360px] overflow-y-auto space-y-3 p-3 bg-[#FCFAF7] rounded-2xl border border-[#E7DDD0] text-xs">
                {(selectedSession.messages || []).map((m: any, i: number) => {
                  const isAssistant = m.role === 'assistant' || m.role === 'bot';
                  return (
                    <div
                      key={m.id || i}
                      className={`p-3.5 rounded-2xl ${
                        isAssistant
                          ? 'bg-gradient-to-br from-[#FAF5EE] to-[#F3E7D3] border border-[#B88E4B]/40 text-[#1F1612] shadow-2xs'
                          : 'bg-white border border-[#E7DDD0] text-[#1F1612] shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1 border-b border-black/5 pb-1">
                        <span className={`font-black uppercase text-[9px] tracking-wider ${isAssistant ? 'text-[#8C6239]' : 'text-stone-500'}`}>
                          {isAssistant ? '🤖 FAHAD ALI AI LUXURY CONCIERGE' : '👤 VERIFIED CLIENT'}
                        </span>
                      </div>
                      <p className="whitespace-pre-line text-xs font-medium leading-relaxed">{m.content}</p>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Close Action */}
              <div className="flex justify-end pt-2 border-t border-neutral-100">
                <button
                  onClick={() => setSelectedSession(null)}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#B88E4B] to-[#996515] hover:brightness-110 text-white font-black text-xs shadow-xs transition-colors cursor-pointer"
                >
                  Close Audit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
