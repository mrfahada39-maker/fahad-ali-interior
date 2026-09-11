'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Mic } from 'lucide-react';

interface VoiceNotePlayerProps {
  src: string;
  duration?: number;
  isMe?: boolean;
}

export default function VoiceNotePlayer({ src, duration: initialDuration, isMe = false }: VoiceNotePlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(initialDuration || 0);
  const [playbackRate, setPlaybackRate] = useState<1 | 1.5 | 2>(1);
  const [audioSrc, setAudioSrc] = useState<string>(src);

  useEffect(() => {
    if (src && src.startsWith('data:audio/')) {
      try {
        const parts = src.split(';base64,');
        const contentType = parts[0].split(':')[1] || 'audio/webm';
        const raw = window.atob(parts[1]);
        const rawLength = raw.length;
        const uInt8Array = new Uint8Array(rawLength);
        for (let i = 0; i < rawLength; ++i) {
          uInt8Array[i] = raw.charCodeAt(i);
        }
        const blob = new Blob([uInt8Array], { type: contentType });
        const url = URL.createObjectURL(blob);
        setAudioSrc(url);
        return () => {
          URL.revokeObjectURL(url);
        };
      } catch {
        setAudioSrc(src);
      }
    } else {
      setAudioSrc(src);
    }
  }, [src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity) {
        setTotalDuration(Math.round(audio.duration));
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioSrc]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    const newTime = Number(e.target.value);
    if (audio) {
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const cycleSpeed = () => {
    const nextRate = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div className={`flex items-center gap-2.5 p-2 rounded-2xl min-w-[210px] sm:min-w-[250px] max-w-[300px] select-none ${
      isMe ? 'bg-black/15 text-white' : 'bg-[#FAF5EE] text-[#1F1612] border border-[#E7DDD0]'
    }`}>
      <audio ref={audioRef} src={audioSrc} preload="metadata" />

      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        className={`w-8.5 h-8.5 rounded-full flex items-center justify-center shrink-0 shadow-xs transition-transform active:scale-90 cursor-pointer ${
          isMe
            ? 'bg-white text-[#8C6239] hover:bg-amber-100'
            : 'bg-gradient-to-r from-[#B88E4B] to-[#996515] text-white hover:brightness-110'
        }`}
        title={isPlaying ? 'Pause' : 'Play Voice Note'}
      >
        {isPlaying ? <Pause size={14} className="fill-current" /> : <Play size={14} className="fill-current ml-0.5" />}
      </button>

      {/* Waveform & Scrubber */}
      <div className="flex-1 flex flex-col justify-center relative">
        {/* Animated Simulated Waveform Bars */}
        <div className="flex items-center gap-[2px] h-4 mb-1 overflow-hidden">
          {[40, 70, 30, 90, 60, 100, 45, 80, 55, 95, 35, 75, 50, 85, 65, 40, 70, 90, 50, 80].map((h, i) => {
            const barProgress = (i / 20) * 100;
            const isPassed = barProgress <= progressPercent;
            return (
              <span
                key={i}
                style={{ height: `${h}%` }}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isPassed
                    ? isMe ? 'bg-white' : 'bg-[#B88E4B]'
                    : isMe ? 'bg-white/40' : 'bg-[#E0D4C5]'
                } ${isPlaying && isPassed ? 'animate-pulse' : ''}`}
              />
            );
          })}
        </div>

        {/* Scrubber Input */}
        <input
          type="range"
          min="0"
          max={totalDuration || 1}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-4 bg-transparent cursor-pointer opacity-0 absolute inset-0 z-10"
        />

        {/* Duration & Timestamp */}
        <div className="flex items-center justify-between text-[9.5px] font-mono font-bold leading-none">
          <span className={isMe ? 'text-white/90' : 'text-[#8C6239]'}>
            {formatSeconds(isPlaying ? Math.round(currentTime) : Math.round(totalDuration))}
          </span>
          <span className="flex items-center gap-0.5 text-[8.5px] opacity-75">
            <Mic size={9} /> Voice
          </span>
        </div>
      </div>

      {/* Playback Speed Multiplier (1x, 1.5x, 2x) */}
      <button
        onClick={cycleSpeed}
        className={`px-1.5 py-0.5 rounded-md text-[9px] font-mono font-black border transition-all cursor-pointer ${
          isMe
            ? 'bg-white/20 border-white/30 text-white hover:bg-white/30'
            : 'bg-white border-[#E7DDD0] text-[#8C6239] hover:border-[#B88E4B]'
        }`}
        title="Change Playback Speed"
      >
        {playbackRate}x
      </button>
    </div>
  );
}
