'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Crown,
  Sparkles,
  Maximize2,
  Minimize2,
  Volume2
} from 'lucide-react';

interface LuxuryCallModalProps {
  isOpen: boolean;
  callType: 'voice' | 'video';
  callStatus: 'outgoing' | 'incoming' | 'connected' | 'ended';
  remoteUserName: string;
  remoteUserAvatar?: string;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  callDuration: number;
  connectedAt?: number | null;
  onAccept: () => void;
  onDecline: () => void;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
}

export default function LuxuryCallModal({
  isOpen,
  callType,
  callStatus,
  remoteUserName,
  localStream,
  remoteStream,
  isMuted,
  isVideoOff,
  callDuration,
  connectedAt,
  onAccept,
  onDecline,
  onEndCall,
  onToggleMute,
  onToggleVideo,
}: LuxuryCallModalProps) {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const [internalDuration, setInternalDuration] = React.useState(0);
  const fallbackStartRef = useRef<number | null>(null);

  // Synchronized live duration counter based on shared server timestamp
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isOpen && callStatus === 'connected') {
      if (!fallbackStartRef.current) {
        fallbackStartRef.current = connectedAt || Date.now();
      }
      const tick = () => {
        const start = connectedAt || fallbackStartRef.current || Date.now();
        setInternalDuration(Math.max(0, Math.floor((Date.now() - start) / 1000)));
      };
      tick();
      interval = setInterval(tick, 500);
    } else {
      fallbackStartRef.current = null;
      setInternalDuration(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, callStatus, connectedAt]);

  const activeDuration = internalDuration || callDuration || 0;

  // Attach local stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isOpen, isVideoOff]);

  // Attach remote stream to video
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(() => {});
    }
  }, [remoteStream, isOpen, callStatus]);

  // Attach remote stream to audio
  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play().catch(() => {});
    }
  }, [remoteStream, isOpen, callStatus]);

  if (!isOpen) return null;

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const initialLetter = (remoteUserName || 'C')[0].toUpperCase();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-in fade-in duration-300">
        <audio
          ref={remoteAudioRef}
          autoPlay
          playsInline
          style={{ position: 'fixed', top: -9999, left: -9999, opacity: 0, pointerEvents: 'none' }}
        />
        {/* Main Luxury Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-xl bg-gradient-to-b from-[#1F1612] via-[#140E0A] to-[#0A0705] border border-[#B88E4B]/40 rounded-3xl sm:rounded-[32px] overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.85)] flex flex-col min-h-[480px] sm:min-h-[520px] text-white"
        >
          {/* Top Gold Accented Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 relative z-20">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#B88E4B] to-[#8C6239] flex items-center justify-center text-white shadow-2xs">
                <Crown size={12} />
              </span>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#D4AF37] block leading-none">
                  Fahad Ali Atelier
                </span>
                <span className="text-xs font-serif font-black text-white/90">
                  {callType === 'video' ? 'VIP Video Consultation' : 'VIP Concierge Audio Call'}
                </span>
              </div>
            </div>

            {callStatus === 'connected' && (
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-black flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {formatDuration(activeDuration)}
              </span>
            )}
          </div>

          {/* ── CALL BODY VIEWPORTS ── */}
          <div className="relative flex-1 flex flex-col items-center justify-center p-6 overflow-hidden">
            
            {/* 1. Video Active Viewport */}
            {callType === 'video' ? (
              <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center">
                {callStatus === 'connected' ? (
                  <>
                    {/* Remote Stream Video */}
                    {remoteStream ? (
                      <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-stone-400 gap-2">
                        <div className="w-20 h-20 rounded-2xl bg-[#2C1E18] border border-[#B88E4B]/40 flex items-center justify-center text-2xl font-serif text-[#D4AF37]">
                          {initialLetter}
                        </div>
                        <span className="text-xs font-medium">Connecting video feed...</span>
                      </div>
                    )}

                    {/* Local PiP Video in Top Right */}
                    <div className="absolute top-4 right-4 w-28 sm:w-36 h-36 sm:h-48 rounded-2xl border-2 border-[#B88E4B] overflow-hidden shadow-2xl bg-stone-900 z-10">
                      {!isVideoOff ? (
                        <video
                          ref={localVideoRef}
                          autoPlay
                          muted
                          playsInline
                          className="w-full h-full object-cover scale-x-[-1]"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-black/80 text-white/50 gap-1">
                          <VideoOff size={16} />
                          <span className="text-[9px]">Camera Off</span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  /* Outgoing / Incoming Video Preview Screen */
                  <div className="relative w-full h-full flex items-center justify-center">
                    {!isVideoOff && localStream && (
                      <video
                        ref={localVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover scale-x-[-1] opacity-40 blur-xs"
                      />
                    )}
                    <div className="flex flex-col items-center justify-center text-center z-10 space-y-4 p-6">
                      <div className="relative flex items-center justify-center my-2">
                        <span className="animate-ping absolute inline-flex h-32 w-32 rounded-full bg-[#B88E4B]/20 duration-1000" />
                        <span className="animate-pulse absolute inline-flex h-28 w-28 rounded-full bg-[#B88E4B]/30 duration-700" />
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-[#B88E4B] via-[#996515] to-[#5A3A1A] border-2 border-[#D4AF37] flex items-center justify-center text-white font-serif font-black text-3xl sm:text-4xl shadow-[0_10px_40px_rgba(184,142,75,0.4)] relative z-10">
                          {initialLetter}
                        </div>
                      </div>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-black font-serif text-white tracking-wide">
                          {remoteUserName || 'Valued Client'}
                        </h2>
                        <p className="text-xs text-[#D4AF37] font-semibold mt-1 flex items-center justify-center gap-1.5">
                          <Sparkles size={12} />
                          {callStatus === 'outgoing' ? 'Starting VIP Video Consultation...' : 'Incoming VIP Video Consultation...'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* 2. Audio Call Viewport */
              <div className="flex flex-col items-center justify-center text-center z-10 space-y-4">
                <div className="relative flex items-center justify-center my-2">
                  <span className="animate-ping absolute inline-flex h-32 w-32 rounded-full bg-[#B88E4B]/20 duration-1000" />
                  <span className="animate-pulse absolute inline-flex h-28 w-28 rounded-full bg-[#B88E4B]/30 duration-700" />
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-[#B88E4B] via-[#996515] to-[#5A3A1A] border-2 border-[#D4AF37] flex items-center justify-center text-white font-serif font-black text-3xl sm:text-4xl shadow-[0_10px_40px_rgba(184,142,75,0.4)] relative z-10">
                    {initialLetter}
                  </div>
                </div>

                <div>
                  <h2 className="text-xl sm:text-2xl font-black font-serif text-white tracking-wide">
                    {remoteUserName || 'Valued Client'}
                  </h2>
                  <p className="text-xs text-[#D4AF37] font-semibold mt-1 flex items-center justify-center gap-1.5">
                    <Sparkles size={12} />
                    {callStatus === 'outgoing' && `Calling ${remoteUserName || 'Valued Client'}...`}
                    {callStatus === 'incoming' && 'Incoming VIP Atelier Call...'}
                    {callStatus === 'connected' && `Voice Connected (${formatDuration(activeDuration)})`}
                    {callStatus === 'ended' && 'Call Completed'}
                  </p>
                </div>
              </div>
            )}

          </div>

          {/* ── BOTTOM CONTROL BAR ── */}
          <div className="p-5 sm:p-6 bg-black/40 border-t border-white/10 flex items-center justify-center gap-4 relative z-20">
            
            {/* Incoming Call Action Controls */}
            {callStatus === 'incoming' ? (
              <div className="flex items-center justify-center gap-8 w-full">
                {/* Decline Button */}
                <div className="flex flex-col items-center gap-1.5">
                  <button
                    onClick={onDecline}
                    className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg transition-transform active:scale-90 cursor-pointer"
                    title="Decline Call"
                  >
                    <PhoneOff size={22} />
                  </button>
                  <span className="text-[10px] font-bold text-red-300">Decline</span>
                </div>

                {/* Accept Button */}
                <div className="flex flex-col items-center gap-1.5">
                  <button
                    onClick={onAccept}
                    className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg transition-transform active:scale-90 animate-bounce cursor-pointer"
                    title="Accept Call"
                  >
                    <Phone size={22} />
                  </button>
                  <span className="text-[10px] font-bold text-emerald-300">Accept</span>
                </div>
              </div>
            ) : (
              /* Outgoing / Connected Call Controls */
              <div className="flex items-center justify-center gap-4 sm:gap-6">
                {/* Mic Mute Toggle */}
                <button
                  onClick={onToggleMute}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md active:scale-90 cursor-pointer ${
                    isMuted ? 'bg-red-500/30 border border-red-500 text-red-400' : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                  }`}
                  title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
                >
                  {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                </button>

                {/* Camera Toggle (For Video Calls) */}
                {callType === 'video' && (
                  <button
                    onClick={onToggleVideo}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md active:scale-90 cursor-pointer ${
                      isVideoOff ? 'bg-red-500/30 border border-red-500 text-red-400' : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                    }`}
                    title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
                  >
                    {isVideoOff ? <VideoOff size={18} /> : <Video size={18} />}
                  </button>
                )}

                {/* End Call Button */}
                <button
                  onClick={onEndCall}
                  className="w-14 h-14 rounded-full bg-gradient-to-r from-red-600 to-red-700 hover:brightness-110 text-white flex items-center justify-center shadow-[0_4px_25px_rgba(220,38,38,0.5)] transition-transform active:scale-90 cursor-pointer"
                  title="End Call"
                >
                  <PhoneOff size={22} />
                </button>
              </div>
            )}

          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
