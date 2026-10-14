/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, X, Sparkles, Globe, Radio } from 'lucide-react';

interface VoiceAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscript: (text: string) => void;
}

export function VoiceAiModal({ isOpen, onClose, onTranscript }: VoiceAiModalProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [language, setLanguage] = useState<'ur-PK' | 'en-US'>('ur-PK');
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition with selected language
  const setupRecognition = useCallback((lang: 'ur-PK' | 'en-US') => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setRecognitionError('Speech recognition is not natively supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }

      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = lang;

      rec.onresult = (event: any) => {
        const current = event.resultIndex;
        const text = event.results[current][0].transcript;
        setTranscript(text);
        setRecognitionError(null);
      };

      rec.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          setRecognitionError(`Mic notice: ${event.error}. Please tap the mic to try again.`);
        }
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      setRecognitionError(null);
    } catch {
      setRecognitionError('Could not initialize speech recognition.');
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setupRecognition(language);
    }
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        try { window.speechSynthesis.cancel(); } catch {}
      }
    };
  }, [isOpen, language, setupRecognition]);

  if (!isOpen) return null;

  const toggleLanguage = () => {
    const nextLang = language === 'ur-PK' ? 'en-US' : 'ur-PK';
    setLanguage(nextLang);
    setupRecognition(nextLang);
  };

  const toggleListen = () => {
    if (!recognitionRef.current) {
      setupRecognition(language);
      if (!recognitionRef.current) return;
    }

    if (isListening) {
      try { recognitionRef.current.stop(); } catch {}
      setIsListening(false);
    } else {
      setTranscript('');
      setRecognitionError(null);
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setupRecognition(language);
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch {
          setRecognitionError('Microphone permission required or already active.');
        }
      }
    }
  };

  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'ur-PK' ? 'ur-PK' : 'en-US';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } catch {}
  };

  const handleSendVoice = () => {
    if (transcript.trim()) {
      const sentText = transcript.trim();
      onTranscript(sentText);
      if (ttsEnabled) {
        const confirmText = language === 'ur-PK'
          ? 'Shukriya, aapki request atelier ko send kar di gayi hai.'
          : 'Thank you, analyzing your interior query.';
        speakText(confirmText);
      }
      onClose();
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setTranscript(prompt);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-stone-900 border border-amber-900/40 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-100 p-2 rounded-full hover:bg-stone-800 transition-colors"
          aria-label="Close voice modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badges: Mode & Language Switcher */}
        <div className="flex items-center justify-center gap-2 pt-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Voice AI Concierge
          </div>
          <button
            onClick={toggleLanguage}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 text-xs font-medium transition-colors"
            title="Toggle Language"
          >
            <Globe className="w-3 h-3 text-amber-400" />
            {language === 'ur-PK' ? 'اردو / Roman Urdu' : 'English (US)'}
          </button>
        </div>

        {/* Modal Titles */}
        <div>
          <h3 className="font-serif text-2xl font-bold text-amber-100">
            {language === 'ur-PK' ? 'AI مشیر سے بات کریں' : 'Speak to AI Advisor'}
          </h3>
          <p className="text-xs text-stone-300 mt-1">
            {language === 'ur-PK'
              ? 'فرنیچر کی قیمت، شیشم لکڑی، یا کسٹم سائز کے بارے میں بول کر پوچھیں۔'
              : 'Ask about royal collections, solid Sheesham wood guarantee, or custom dimensions.'}
          </p>
        </div>

        {/* Interactive Pulse Microphone Ring & Waveform */}
        <div className="relative flex flex-col items-center justify-center my-6 space-y-3">
          <div className="relative flex items-center justify-center">
            {isListening && (
              <div className="absolute w-28 h-28 rounded-full bg-amber-500/25 animate-ping" />
            )}
            <button
              onClick={toggleListen}
              className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center text-stone-950 shadow-2xl transition-all ${
                isListening
                  ? 'bg-rose-500 text-white scale-110 shadow-rose-500/50'
                  : 'bg-gradient-to-tr from-amber-500 to-amber-300 hover:scale-105 shadow-amber-500/30'
              }`}
              aria-label={isListening ? 'Stop listening' : 'Start listening'}
            >
              {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </button>
          </div>

          {/* Animated Waveform Bars */}
          {isListening && (
            <div className="flex items-center justify-center gap-1 h-6">
              {[40, 75, 100, 60, 90, 45, 80].map((h, i) => (
                <span
                  key={i}
                  className="w-1 bg-amber-400 rounded-full animate-pulse"
                  style={{
                    height: `${h}%`,
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Error Notice */}
        {recognitionError && (
          <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-800/40 rounded-lg p-2">
            {recognitionError}
          </p>
        )}

        {/* Live Transcript Display */}
        <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 text-sm min-h-[4rem] flex items-center justify-center text-stone-200">
          {transcript || (
            <span className="text-stone-400 italic flex items-center gap-1.5">
              <Radio className={`w-3.5 h-3.5 ${isListening ? 'text-rose-400 animate-pulse' : 'text-stone-400'}`} />
              {isListening
                ? (language === 'ur-PK' ? 'سن رہا ہوں... فرمائیے' : 'Listening... Speak now')
                : (language === 'ur-PK' ? 'مائیکروفون پر ٹیپ کر کے بولیں' : 'Tap the microphone to speak')}
            </span>
          )}
        </div>

        {/* Suggested Voice Quick-Pills */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
          {(language === 'ur-PK'
            ? ['🛋️ صوفہ سیٹ کی قیمت؟', '🪵 شیشم لکڑی وارنٹی', '📐 کسٹم کنگ بیڈ کوٹ']
            : ['🛋️ Chesterfield Sofa Price', '🪵 10-Yr Wood Guarantee', '📐 Custom Bed Quote']
          ).map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickPrompt(item.replace(/^[^\s]+\s/, ''))}
              className="text-xs px-2.5 py-1 rounded-full bg-stone-800/80 hover:bg-stone-700 text-stone-300 border border-stone-700/60 transition-all hover:text-amber-200"
            >
              {item}
            </button>
          ))}
        </div>

        {/* Send Button & TTS Audio Feedback Toggle */}
        <div className="pt-2 flex flex-col gap-2">
          {transcript && (
            <button
              onClick={handleSendVoice}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-sm shadow-xl shadow-amber-500/20 transition-all"
            >
              {language === 'ur-PK' ? 'پیغام بھیجیں (Send Message)' : 'Send Voice Message'}
            </button>
          )}

          <div className="flex items-center justify-between text-xs text-stone-400 px-1 pt-1 border-t border-stone-800/60">
            <span className="flex items-center gap-1.5">
              Voice Feedback (TTS)
              {isSpeaking && (
                <span className="inline-flex items-center gap-1 text-amber-300 animate-pulse text-[11px]">
                  <Volume2 className="w-3 h-3 text-amber-400" /> Speaking...
                </span>
              )}
            </span>
            <button
              onClick={() => setTtsEnabled(!ttsEnabled)}
              className="flex items-center gap-1 hover:text-stone-200 transition-colors"
            >
              {ttsEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" /> Enabled
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-stone-500" /> Muted
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
