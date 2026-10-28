'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api-client';
import { toneGenerator, WebRtcCallClient, acquireUserMediaWithFallback } from '@/lib/webrtc-call-manager';

export interface CallerInfo {
  id?: string;
  userId?: string;
  name?: string;
  email?: string;
}

export function useAdminCall() {
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [callType, setCallType] = useState<'voice' | 'video'>('voice');
  const [callStatus, setCallStatus] = useState<'outgoing' | 'incoming' | 'connected' | 'ended'>('outgoing');
  const [currentCaller, setCurrentCaller] = useState<CallerInfo | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callConnectedAt, setCallConnectedAt] = useState<number | null>(null);
  const callDurationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const adminRtcClientRef = useRef<WebRtcCallClient | null>(null);
  const adminIncomingOfferSdpRef = useRef<RTCSessionDescriptionInit | null>(null);
  const adminAutoAnswerTimerRef = useRef<NodeJS.Timeout | null>(null);

  const endAdminCall = useCallback(() => {
    toneGenerator.stop();
    if (adminAutoAnswerTimerRef.current) {
      clearTimeout(adminAutoAnswerTimerRef.current);
      adminAutoAnswerTimerRef.current = null;
    }
    if (callDurationIntervalRef.current) {
      clearInterval(callDurationIntervalRef.current);
      callDurationIntervalRef.current = null;
    }
    if (adminRtcClientRef.current) {
      adminRtcClientRef.current.cleanup();
      adminRtcClientRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
    setIsCallOpen(false);
    setCallStatus('ended');
    setCallConnectedAt(null);

    void apiFetch('/api/calls/signal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'end',
        fromUserId: 'admin',
        toUserId: currentCaller?.id || 'client',
      }),
    });
  }, [currentCaller?.id, localStream]);

  const startAdminCall = async (type: 'voice' | 'video', targetUser: CallerInfo) => {
    setCurrentCaller(targetUser);
    setCallType(type);
    setIsCallOpen(true);
    setCallStatus('outgoing');
    setCallDuration(0);
    setCallConnectedAt(null);
    toneGenerator.playOutgoingRing();

    try {
      const { stream, fallbackNote } = await acquireUserMediaWithFallback(type);
      setLocalStream(stream);
      if (fallbackNote) toast.info(fallbackNote);

      const targetId = targetUser?.id || targetUser?.userId || 'client';

      const rtcClient = new WebRtcCallClient(
        (remote) => setRemoteStream(remote),
        async (candidate) => {
          await apiFetch('/api/calls/signal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'candidate', fromUserId: 'admin', toUserId: targetId, candidate }),
          }).catch(() => {});
        }
      );
      rtcClient.init(stream);
      adminRtcClientRef.current = rtcClient;

      const offerSdp = await rtcClient.createOffer();

      await apiFetch('/api/calls/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'initiate',
          fromUserId: 'admin',
          fromUserName: 'Fahad Ali Atelier Concierge',
          toUserId: targetId,
          toUserName: targetUser?.name || 'Valued Client',
          toUserEmail: targetUser?.email || '',
          callType: type,
          offerSdp,
        }),
      });

      if (adminAutoAnswerTimerRef.current) clearTimeout(adminAutoAnswerTimerRef.current);
      adminAutoAnswerTimerRef.current = setTimeout(() => {
        setCallStatus((prev) => {
          if (prev === 'outgoing') {
            toast.info(`Calling client. If client does not pick up, you can also connect via WhatsApp hotline.`);
          }
          return prev;
        });
      }, 7000);
    } catch {
      toast.error('Could not initiate audio/video call channel');
      endAdminCall();
    }
  };

  const acceptIncomingCall = async () => {
    toneGenerator.stop();
    setCallStatus('connected');
    setCallDuration(0);
    const now = Date.now();
    setCallConnectedAt(now);

    try {
      const { stream, fallbackNote } = await acquireUserMediaWithFallback(callType);
      setLocalStream(stream);
      if (fallbackNote) toast.info(fallbackNote);

      const callerId = currentCaller?.id || 'client';

      const rtcClient = new WebRtcCallClient(
        (remote) => setRemoteStream(remote),
        async (candidate) => {
          await apiFetch('/api/calls/signal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'candidate', fromUserId: 'admin', toUserId: callerId, candidate }),
          }).catch(() => {});
        }
      );
      rtcClient.init(stream);
      adminRtcClientRef.current = rtcClient;

      const answerSdp = adminIncomingOfferSdpRef.current
        ? await rtcClient.createAnswer(adminIncomingOfferSdpRef.current)
        : null;

      if (!callDurationIntervalRef.current) {
        callDurationIntervalRef.current = setInterval(() => {
          setCallDuration((d) => d + 1);
        }, 1000);
      }

      const acceptRes = await apiFetch('/api/calls/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'accept',
          fromUserId: 'admin',
          toUserId: callerId,
          answerSdp,
        }),
      });
      if (acceptRes.ok) {
        const acceptData = await acceptRes.json().catch(() => ({}));
        if (acceptData.session?.connectedAt) {
          setCallConnectedAt(acceptData.session.connectedAt);
        }
      }
      toast.success(`Connected to VIP Client: ${currentCaller?.name || 'Customer'}`);
    } catch {
      toast.error('Could not connect call');
      endAdminCall();
    }
  };

  const toggleAdminMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
      setIsMuted((prev) => !prev);
    }
  };

  const toggleAdminVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
      setIsVideoOff((prev) => !prev);
    }
  };

  useEffect(() => {
    const checkIncomingCalls = async () => {
      try {
        const res = await apiFetch('/api/calls/signal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'status', fromUserId: 'admin' }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.session) {
            if (data.session.status === 'outgoing' && data.session.fromUserId !== 'admin' && !isCallOpen) {
              adminIncomingOfferSdpRef.current = data.session.offerSdp;
              setCurrentCaller({ id: data.session.fromUserId, name: data.session.fromUserName || 'VIP Customer' });
              setCallType(data.session.callType || 'voice');
              setCallStatus('incoming');
              setIsCallOpen(true);
              toneGenerator.playIncomingRing();
            } else if (data.session.status === 'connected' && isCallOpen) {
              if (adminAutoAnswerTimerRef.current) {
                clearTimeout(adminAutoAnswerTimerRef.current);
                adminAutoAnswerTimerRef.current = null;
              }
              if (data.session.connectedAt) {
                setCallConnectedAt(data.session.connectedAt);
              }
              toneGenerator.stop();

              if (callStatus === 'outgoing') {
                setCallStatus('connected');
                if (data.session.answerSdp && adminRtcClientRef.current) {
                  await adminRtcClientRef.current.handleAnswer(data.session.answerSdp);
                }
                if (!callDurationIntervalRef.current) {
                  callDurationIntervalRef.current = setInterval(() => {
                    setCallDuration((d) => d + 1);
                  }, 1000);
                }
              }

              if (data.session.candidates && adminRtcClientRef.current) {
                for (const c of data.session.candidates) {
                  const sender = c.fromUserId || (typeof c === 'object' && c.fromUserId);
                  if (!sender || sender !== 'admin') {
                    await adminRtcClientRef.current.addIceCandidate(c);
                  }
                }
              }
            } else if ((data.session.status === 'ended' || data.session.status === 'declined') && isCallOpen) {
              endAdminCall();
            }
          }
        }
      } catch {}
    };

    const interval = setInterval(checkIncomingCalls, isCallOpen ? 1200 : 2000);
    return () => clearInterval(interval);
  }, [isCallOpen, callStatus, currentCaller, endAdminCall]);

  return {
    isCallOpen,
    callType,
    callStatus,
    currentCaller,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    callDuration,
    callConnectedAt,
    startAdminCall,
    acceptIncomingCall,
    endAdminCall,
    toggleAdminMute,
    toggleAdminVideo,
  };
}
