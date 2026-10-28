'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api-client';
import { toneGenerator, WebRtcCallClient, acquireUserMediaWithFallback } from '@/lib/webrtc-call-manager';

export interface UserCallIdentity {
  id?: string;
  name?: string | null;
  email?: string | null;
}

export function useUserCall(
  sessionUser: UserCallIdentity | undefined,
  profile: UserCallIdentity | null
) {
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [callType, setCallType] = useState<'voice' | 'video'>('voice');
  const [callStatus, setCallStatus] = useState<'outgoing' | 'incoming' | 'connected' | 'ended'>('outgoing');
  const [currentCaller, setCurrentCaller] = useState<{ id: string; name: string } | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callConnectedAt, setCallConnectedAt] = useState<number | null>(null);
  const callDurationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const rtcClientRef = useRef<WebRtcCallClient | null>(null);
  const incomingOfferSdpRef = useRef<RTCSessionDescriptionInit | null>(null);
  const autoAnswerTimerRef = useRef<NodeJS.Timeout | null>(null);

  const endCall = useCallback(() => {
    toneGenerator.stop();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (autoAnswerTimerRef.current) {
      clearTimeout(autoAnswerTimerRef.current);
      autoAnswerTimerRef.current = null;
    }
    if (callDurationIntervalRef.current) {
      clearInterval(callDurationIntervalRef.current);
      callDurationIntervalRef.current = null;
    }
    if (rtcClientRef.current) {
      rtcClientRef.current.cleanup();
      rtcClientRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
    setIsCallOpen(false);
    setCallStatus('ended');
    setCallConnectedAt(null);

    const userId = sessionUser?.id || profile?.id || 'client';
    const userEmail = sessionUser?.email || profile?.email || '';
    const specificIds = [sessionUser?.id, profile?.id, userEmail].filter(Boolean) as string[];
    const userAliases = Array.from(new Set(specificIds.length > 0 ? specificIds : ['client']));

    void apiFetch('/api/calls/signal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'end',
        fromUserId: userId,
        fromUserEmail: userEmail,
        toUserId: 'admin',
        userAliases,
      }),
    });
  }, [localStream, profile?.email, profile?.id, sessionUser?.email, sessionUser?.id]);

  const startCall = async (type: 'voice' | 'video') => {
    setCallType(type);
    setCurrentCaller({ id: 'admin', name: 'Atelier Concierge' });
    setIsCallOpen(true);
    setCallStatus('outgoing');
    setCallDuration(0);
    setCallConnectedAt(null);
    toneGenerator.playOutgoingRing();

    try {
      const { stream, fallbackNote } = await acquireUserMediaWithFallback(type);
      setLocalStream(stream);
      if (fallbackNote) {
        toast.info(fallbackNote);
      }

      const userId = sessionUser?.id || profile?.id || 'client';
      const myName = profile?.name || sessionUser?.name || 'VIP Client';
      const myEmail = sessionUser?.email || profile?.email || '';
      const specificIds = [sessionUser?.id, profile?.id, myEmail].filter(Boolean) as string[];
      const userAliases = Array.from(new Set(specificIds.length > 0 ? specificIds : ['client']));

      const rtcClient = new WebRtcCallClient(
        (remote) => setRemoteStream(remote),
        async (candidate) => {
          await apiFetch('/api/calls/signal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'candidate',
              fromUserId: userId,
              fromUserEmail: myEmail,
              toUserId: 'admin',
              candidate,
              userAliases,
            }),
          }).catch(() => {});
        }
      );
      rtcClient.init(stream);
      rtcClientRef.current = rtcClient;

      const offerSdp = await rtcClient.createOffer();

      await apiFetch('/api/calls/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'initiate',
          fromUserId: userId,
          fromUserName: myName,
          fromUserEmail: myEmail,
          toUserId: 'admin',
          callType: type,
          offerSdp,
          userAliases,
        }),
      });

      if (autoAnswerTimerRef.current) clearTimeout(autoAnswerTimerRef.current);
      autoAnswerTimerRef.current = setTimeout(() => {
        setCallStatus((prev) => {
          if (prev === 'outgoing') {
            toneGenerator.stop();
            toast.info('Admin is currently attending another patron. Please leave a message or try again.');
            endCall();
            return 'ended';
          }
          return prev;
        });
      }, 45000);
    } catch {
      toast.error('Could not connect consultation channel');
      endCall();
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

      const userId = sessionUser?.id || profile?.id || 'client';
      const userEmail = sessionUser?.email || profile?.email || '';
      const userAliases = Array.from(new Set([userId, userEmail, profile?.id, profile?.email, 'client'].filter(Boolean)));

      const rtcClient = new WebRtcCallClient(
        (remote) => setRemoteStream(remote),
        async (candidate) => {
          await apiFetch('/api/calls/signal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'candidate',
              fromUserId: userId,
              fromUserEmail: userEmail,
              toUserId: 'admin',
              candidate,
              userAliases,
            }),
          }).catch(() => {});
        }
      );
      rtcClient.init(stream);
      rtcClientRef.current = rtcClient;

      const answerSdp = incomingOfferSdpRef.current
        ? await rtcClient.createAnswer(incomingOfferSdpRef.current)
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
          fromUserId: userId,
          fromUserEmail: userEmail,
          toUserId: 'admin',
          answerSdp,
          userAliases,
        }),
      });
      if (acceptRes.ok) {
        const acceptData = await acceptRes.json().catch(() => ({}));
        if (acceptData.session?.connectedAt) {
          setCallConnectedAt(acceptData.session.connectedAt);
        }
      }
    } catch {
      toast.error('Could not access microphone/camera');
      endCall();
    }
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted((prev) => !prev);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff((prev) => !prev);
    }
  };

  useEffect(() => {
    const userId = sessionUser?.id || profile?.id || 'client';
    const userEmail = sessionUser?.email || profile?.email || '';
    const specificIds = [sessionUser?.id, profile?.id, userEmail].filter(Boolean) as string[];
    const userAliases = Array.from(new Set(specificIds.length > 0 ? specificIds : ['client']));

    const interval = setInterval(async () => {
      try {
        const res = await apiFetch('/api/calls/signal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'status',
            fromUserId: userId,
            fromUserEmail: userEmail,
            userAliases,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.session) {
            if (data.session.status === 'connected' && isCallOpen) {
              if (autoAnswerTimerRef.current) {
                clearTimeout(autoAnswerTimerRef.current);
                autoAnswerTimerRef.current = null;
              }
              if (data.session.connectedAt) {
                setCallConnectedAt(data.session.connectedAt);
              }
              toneGenerator.stop();

              if (callStatus === 'outgoing') {
                setCallStatus('connected');
                if (data.session.answerSdp && rtcClientRef.current) {
                  await rtcClientRef.current.handleAnswer(data.session.answerSdp);
                }
                if (!callDurationIntervalRef.current) {
                  callDurationIntervalRef.current = setInterval(() => {
                    setCallDuration((d) => d + 1);
                  }, 1000);
                }
              }

              if (data.session.candidates && rtcClientRef.current) {
                for (const c of data.session.candidates) {
                  const sender = c.fromUserId || (typeof c === 'object' && c.fromUserId);
                  if (!sender || sender === 'admin') {
                    await rtcClientRef.current.addIceCandidate(c);
                  }
                }
              }
            } else if (data.session.status === 'outgoing' && data.session.fromUserId === 'admin' && !isCallOpen) {
              incomingOfferSdpRef.current = data.session.offerSdp;
              setCurrentCaller({ id: data.session.fromUserId, name: data.session.fromUserName || 'Atelier Concierge' });
              setCallType(data.session.callType || 'voice');
              setCallStatus('incoming');
              setIsCallOpen(true);
              toneGenerator.playIncomingRing();
            } else if ((data.session.status === 'ended' || data.session.status === 'declined') && isCallOpen) {
              endCall();
            }
          }
        }
      } catch {}
    }, 1500);

    return () => clearInterval(interval);
  }, [isCallOpen, callStatus, profile, sessionUser, endCall]);

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
    startCall,
    acceptIncomingCall,
    endCall,
    toggleMute,
    toggleVideo,
  };
}
