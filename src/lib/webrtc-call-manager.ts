'use client';

// WebRTC STUN configurations for NAT traversal
export const RTC_CONFIGURATION: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
};

export class WebRtcCallClient {
  public pc: RTCPeerConnection | null = null;
  public localStream: MediaStream | null = null;
  public remoteStream: MediaStream | null = null;
  private onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null;
  private onIceCandidateCallback: ((candidate: RTCIceCandidate) => void) | null = null;

  constructor(
    onRemoteStream?: (stream: MediaStream) => void,
    onIceCandidate?: (candidate: RTCIceCandidate) => void
  ) {
    if (onRemoteStream) this.onRemoteStreamCallback = onRemoteStream;
    if (onIceCandidate) this.onIceCandidateCallback = onIceCandidate;
  }

  // Initialize peer connection with local audio/video media stream
  init(localStream: MediaStream) {
    this.cleanup();
    this.localStream = localStream;
    this.remoteStream = new MediaStream();

    if (typeof window === 'undefined' || !window.RTCPeerConnection) {
      return null;
    }

    const pc = new RTCPeerConnection(RTC_CONFIGURATION);
    this.pc = pc;

    // Add local tracks to peer connection
    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    // Receive remote tracks
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
        if (this.onRemoteStreamCallback) {
          this.onRemoteStreamCallback(event.streams[0]);
        }
      } else if (event.track) {
        if (this.remoteStream) {
          this.remoteStream.addTrack(event.track);
          if (this.onRemoteStreamCallback) {
            this.onRemoteStreamCallback(this.remoteStream);
          }
        }
      }
    };

    // Handle ICE Candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && this.onIceCandidateCallback) {
        this.onIceCandidateCallback(event.candidate);
      }
    };

    return pc;
  }

  private queuedCandidates: RTCIceCandidateInit[] = [];

  // Caller creates offer
  async createOffer(): Promise<RTCSessionDescriptionInit | null> {
    if (!this.pc) return null;
    try {
      const offer = await this.pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await this.pc.setLocalDescription(offer);
      return offer;
    } catch {
      return null;
    }
  }

  // Callee receives offer and creates answer
  async createAnswer(offerSdp: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit | null> {
    if (!this.pc) return null;
    try {
      await this.pc.setRemoteDescription(new RTCSessionDescription(offerSdp));
      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);
      this.flushQueuedCandidates();
      return answer;
    } catch {
      return null;
    }
  }

  // Caller receives callee's answer
  async handleAnswer(answerSdp: RTCSessionDescriptionInit) {
    if (!this.pc) return;
    try {
      if (this.pc.signalingState !== 'stable') {
        await this.pc.setRemoteDescription(new RTCSessionDescription(answerSdp));
        this.flushQueuedCandidates();
      }
    } catch {}
  }

  private seenCandidates = new Set<string>();

  // Add remote ICE candidate with queueing & deduplication
  async addIceCandidate(candidate: RTCIceCandidateInit) {
    if (!this.pc || !candidate) return;
    const key = `${candidate.candidate || ''}_${candidate.sdpMid || ''}_${candidate.sdpMLineIndex ?? ''}`;
    if (this.seenCandidates.has(key)) return;
    this.seenCandidates.add(key);

    try {
      if (this.pc.remoteDescription && this.pc.remoteDescription.type) {
        await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        this.queuedCandidates.push(candidate);
      }
    } catch {
      this.queuedCandidates.push(candidate);
    }
  }

  private async flushQueuedCandidates() {
    if (!this.pc || !this.pc.remoteDescription) return;
    while (this.queuedCandidates.length > 0) {
      const c = this.queuedCandidates.shift();
      if (c) {
        try {
          await this.pc.addIceCandidate(new RTCIceCandidate(c));
        } catch {}
      }
    }
  }

  cleanup() {
    this.seenCandidates.clear();
    this.queuedCandidates = [];
    if (this.pc) {
      this.pc.ontrack = null;
      this.pc.onicecandidate = null;
      this.pc.close();
      this.pc = null;
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
    this.remoteStream = null;
  }
}

// Web Audio API Luxury Ringtone & Ringback Tone Synthesizer
class LuxuryAudioToneGenerator {
  public ctx: AudioContext | null = null;
  private intervalId: NodeJS.Timeout | null = null;

  public initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  playOutgoingRing() {
    this.stop();
    this.initContext();
    if (!this.ctx) return;

    const playBeep = () => {
      if (!this.ctx) return;
      try {
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.frequency.value = 440;
        osc2.frequency.value = 480;

        gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.8);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(this.ctx.currentTime + 1.8);
        osc2.stop(this.ctx.currentTime + 1.8);
      } catch {}
    };

    playBeep();
    this.intervalId = setInterval(playBeep, 4000);
  }

  playIncomingRing() {
    this.stop();
    this.initContext();
    if (!this.ctx) return;

    const playChime = () => {
      if (!this.ctx) return;
      try {
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.frequency.value = freq;
          const startTime = this.ctx.currentTime + idx * 0.12;

          gain.gain.setValueAtTime(0.08, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.2);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + 1.2);
        });
      } catch {}
    };

    playChime();
    this.intervalId = setInterval(playChime, 3000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export const toneGenerator = new LuxuryAudioToneGenerator();

if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    toneGenerator.initContext();
    window.removeEventListener('touchstart', unlockAudio);
    window.removeEventListener('click', unlockAudio);
  };
  window.addEventListener('touchstart', unlockAudio, { passive: true });
  window.addEventListener('click', unlockAudio, { passive: true });
}

/**
 * Creates a synthetic silent audio and canvas-based video MediaStream
 * for reliable fallback when hardware webcam or microphone is not plugged in or permitted.
 */
export function createSyntheticMediaStream(withVideo = false): MediaStream {
  if (typeof window === 'undefined') return new MediaStream();
  try {
    const AudioCtx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return new MediaStream();
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const dst = ctx.createMediaStreamDestination();
    const gain = ctx.createGain();
    gain.gain.value = 0; // silent
    osc.connect(gain);
    gain.connect(dst);
    osc.start();
    const stream = dst.stream;

    if (withVideo && typeof document !== 'undefined') {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const cCtx = canvas.getContext('2d');
        if (cCtx) {
          cCtx.fillStyle = '#140E0A';
          cCtx.fillRect(0, 0, 640, 480);
          cCtx.fillStyle = '#B88E4B';
          cCtx.font = 'bold 22px serif';
          cCtx.textAlign = 'center';
          cCtx.fillText('✦ FAHAD ALI ATELIER ✦', 320, 230);
          cCtx.fillStyle = '#E7DDD0';
          cCtx.font = '14px sans-serif';
          cCtx.fillText('VIP Private Consultation Desk', 320, 260);
        }
        const canvasWithCapture = canvas as HTMLCanvasElement & { captureStream?: (fps?: number) => MediaStream };
        const videoStream = canvasWithCapture.captureStream ? canvasWithCapture.captureStream(10) : null;
        if (videoStream && videoStream.getVideoTracks()[0]) {
          stream.addTrack(videoStream.getVideoTracks()[0]);
        }
      } catch {}
    }
    return stream;
  } catch {
    return new MediaStream();
  }
}

/**
 * Resilient hardware acquisition:
 * 1. Tries user requested constraints (audio + optional video).
 * 2. If video fails, falls back to audio-only.
 * 3. If audio fails (e.g. no microphone device), falls back to synthetic stream.
 * Call NEVER throws or crashes; always provides working media.
 */
export async function acquireUserMediaWithFallback(
  type: 'voice' | 'video'
): Promise<{ stream: MediaStream; fallbackNote?: string }> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return {
      stream: createSyntheticMediaStream(type === 'video'),
      fallbackNote: 'Microphone/Camera unavailable in this browser. Connected via VIP Concierge Channel.',
    };
  }

  // 1. Try requested stream
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === 'video',
    });
    return { stream };
  } catch {
    // 2. If video was requested and failed, try audio only
    if (type === 'video') {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        return {
          stream: audioStream,
          fallbackNote: 'Camera not detected. Connected via High-Definition Voice Call.',
        };
      } catch {}
    }

    // 3. Synthetic stream fallback so call always connects smoothly
    return {
      stream: createSyntheticMediaStream(type === 'video'),
      fallbackNote: 'Microphone permission not granted. Connected via VIP Concierge Channel.',
    };
  }
}

/**
 * Web Speech API Luxury Voice Synthesizer
 */
export function speakLuxuryGreeting(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 0.85;
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Natural') ||
          v.name.includes('Google') ||
          v.name.includes('Samantha') ||
          v.name.includes('Daniel') ||
          v.name.includes('English'))
    );
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  } catch {}
}
