'use client';

import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, X, Sparkles } from 'lucide-react';

interface VoiceAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscript: (text: string) => void;
}

export function VoiceAiModal({ isOpen, onClose, onTranscript }: VoiceAiModalProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = true;
        rec.lang = 'en-US';

        rec.onresult = (event: any) => {
          const current = event.resultIndex;
          const text = event.results[current][0].transcript;
          setTranscript(text);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        setRecognition(rec);
      }
    }
  }, []);

  if (!isOpen) return null;

  const toggleListen = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in this browser. Please type your message.');
      return;
    }
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      recognition.start();
      setIsListening(true);
    }
  };

  const handleSendVoice = () => {
    if (transcript.trim()) {
      onTranscript(transcript.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-md bg-stone-900 border border-amber-900/40 rounded-3xl p-8 shadow-2xl text-center space-y-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-100 p-2"
          aria-label="Close voice modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Voice AI Employee Mode
        </div>

        <h3 className="font-serif text-2xl font-bold text-amber-100">Speak To AI Advisor</h3>
        <p className="text-xs text-stone-300">
          Ask about products, prices, wood quality, or custom estimates using your voice.
        </p>

        {/* Pulse Microphone Ring */}
        <div className="relative flex items-center justify-center my-6">
          {isListening && (
            <div className="absolute w-28 h-28 rounded-full bg-amber-500/20 animate-ping" />
          )}
          <button
            onClick={toggleListen}
            className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center text-stone-950 shadow-2xl transition-all ${
              isListening
                ? 'bg-rose-500 text-white scale-110'
                : 'bg-gradient-to-tr from-amber-500 to-amber-300 hover:scale-105'
            }`}
          >
            {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          </button>
        </div>

        {/* Live Transcript Display */}
        <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 text-sm min-h-[4rem] flex items-center justify-center text-stone-200">
          {transcript || (isListening ? 'Listening...' : 'Tap the microphone to speak')}
        </div>

        {transcript && (
          <button
            onClick={handleSendVoice}
            className="w-full py-3.5 rounded-xl bg-amber-500 text-stone-950 font-bold text-sm shadow-xl hover:bg-amber-400 transition-colors"
          >
            Send Voice Message
          </button>
        )}
      </div>
    </div>
  );
}
