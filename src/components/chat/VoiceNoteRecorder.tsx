'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Trash2, Send, Square } from 'lucide-react';
import { toast } from 'sonner';

interface VoiceNoteRecorderProps {
  onSendVoiceNote: (audioUrl: string, duration: number) => void;
  disabled?: boolean;
}

export default function VoiceNoteRecorder({ onSendVoiceNote, disabled = false }: VoiceNoteRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    if (disabled) return;
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        toast.error('Microphone not supported on this browser');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      let mediaRecorder: MediaRecorder;
      const candidates = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/aac',
        'audio/ogg;codecs=opus',
      ];
      let selectedMime = '';
      for (const m of candidates) {
        if (typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported(m)) {
          selectedMime = m;
          break;
        }
      }

      try {
        mediaRecorder = selectedMime
          ? new MediaRecorder(stream, { mimeType: selectedMime })
          : new MediaRecorder(stream);
      } catch {
        mediaRecorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      toast.error('Please allow microphone permissions to record voice note');
    }
  };

  const cancelRecording = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const finishAndSend = () => {
    if (!mediaRecorderRef.current || audioChunksRef.current.length === 0) {
      cancelRecording();
      return;
    }

    const duration = Math.max(1, recordingSeconds);
    const mediaRecorder = mediaRecorderRef.current;

    mediaRecorder.onstop = () => {
      const mimeType = mediaRecorder.mimeType || 'audio/webm';
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Audio = reader.result as string;
        if (base64Audio) {
          onSendVoiceNote(base64Audio, duration);
        }
      };
      reader.readAsDataURL(audioBlob);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      setIsRecording(false);
      setRecordingSeconds(0);
    };

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    mediaRecorder.stop();
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isRecording) {
    return (
      <button
        type="button"
        onClick={startRecording}
        disabled={disabled}
        className="w-8.5 h-8.5 rounded-lg bg-[#FAF5EE] hover:bg-[#F3E7D3] border border-[#E2D1BC] text-[#8C6239] hover:text-[#B88E4B] flex items-center justify-center shrink-0 shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
        title="Record Voice Note"
      >
        <Mic size={15} />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-red-50/90 border border-red-200 text-red-700 px-3 py-1 rounded-xl shadow-xs animate-in fade-in duration-200">
      {/* Blinking Red Recording Orb */}
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600" />
      </span>

      {/* Recording Timer */}
      <span className="text-xs font-mono font-black">{formatTime(recordingSeconds)}</span>

      {/* Live Pulsing Audio Waveform Indicator */}
      <div className="flex items-center gap-0.5 h-3 px-1">
        {[40, 80, 50, 100, 70, 90, 60].map((h, i) => (
          <span
            key={i}
            style={{ height: `${h}%` }}
            className="w-0.5 bg-red-500 rounded-full animate-pulse"
          />
        ))}
      </div>

      {/* Cancel Button */}
      <button
        type="button"
        onClick={cancelRecording}
        className="p-1 rounded-lg text-stone-500 hover:text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
        title="Cancel Recording"
      >
        <Trash2 size={13} />
      </button>

      {/* Send Button */}
      <button
        type="button"
        onClick={finishAndSend}
        className="bg-gradient-to-r from-red-600 to-red-700 hover:brightness-110 text-white p-1 rounded-lg shadow-2xs flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
        title="Send Voice Note"
      >
        <Send size={13} />
      </button>
    </div>
  );
}
