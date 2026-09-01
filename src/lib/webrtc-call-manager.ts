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

  // Add remote ICE candidate with queueing
  async addIceCandidate(candidate: RTCIceCandidateInit) {
    if (!this.pc) return;
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
