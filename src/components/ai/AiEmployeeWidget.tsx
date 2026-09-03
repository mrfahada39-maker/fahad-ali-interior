'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import {
  Sparkles, X, Send, Camera, Mic, MicOff, ShoppingBag, PhoneCall, Crown, Calculator, Layers, ShieldCheck
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { VoiceAiModal } from './VoiceAiModal';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  products?: any[];
  roomAnalysis?: any;
  quote?: any;
  bundle?: any;
  whatsAppUrl?: string;
  suggestedPrompts?: string[];
  timestamp: string;
}

export function AiEmployeeWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<'sales' | 'interior' | 'support' | 'quote' | 'analytics'>('sales');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [roomImage, setRoomImage] = useState<string | null>(null);
  const [isListeningMic, setIsListeningMic] = useState(false);

  // Custom Quote Interactive Form State
  const [customLength, setCustomLength] = useState('78');
  const [customWidth, setCustomWidth] = useState('72');
  const [customStain, setCustomStain] = useState('Royal Dark Walnut');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Floating Draggable AssistiveTouch State
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragInfoRef = useRef<{
    startX: number;
    startY: number;
    initialLeft: number;
    initialTop: number;
    hasMoved: boolean;
  }>({
    startX: 0,
    startY: 0,
    initialLeft: 0,
    initialTop: 0,
    hasMoved: false,
  });

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const rect = e.currentTarget.getBoundingClientRect();
    dragInfoRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialLeft: rect.left,
      initialTop: rect.top,
      hasMoved: false,
    };
    setIsDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragInfoRef.current.startX;
    const dy = e.clientY - dragInfoRef.current.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      dragInfoRef.current.hasMoved = true;
    }
    const buttonSize = 56;
    const maxX = (typeof window !== 'undefined' ? window.innerWidth : 400) - buttonSize - 10;
    const maxY = (typeof window !== 'undefined' ? window.innerHeight : 800) - buttonSize - 10;
    const newX = Math.max(10, Math.min(maxX, dragInfoRef.current.initialLeft + dx));
    const newY = Math.max(10, Math.min(maxY, dragInfoRef.current.initialTop + dy));
    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    if (!dragInfoRef.current.hasMoved) {
      setIsOpen(true);
    }
  };
  const addItem = useCartStore((s) => s.addItem);
  const speechRecognitionRef = useRef<any>(null);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          sender: 'ai',
          text: "Assalam-o-Alaikum! Welcome to **FAHAD ALI INTERIOR** 👑\n\nHamare store me Total **15 Luxury Categories** (54 Live Items) available hain:\n\n1. 🛋️ Living Room | 2. 🛏️ Bedroom | 3. 🍽️ Dining Room\n4. 💼 Office | 5. 🛋️ Luxury Sofas | 6. 🪑 Coffee Chairs\n7. 📺 TV Units | 8. 📦 Storage | 9. 🛠️ Custom Solutions\n10. 🌿 Outdoor | 11. 🪞 Mirrors | 12. 🏺 Accessories\n13. ☕ Center Tables | 14. 👑 Showcase | 15. 🚪 Wardrobes\n\nAap kis category ke products dekhna chahte hain?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedPrompts: [
            '🎁 View Room Packages & Bundles',
            '🛋️ View Sheesham Sofas',
            '🛏️ Royal Sheesham Beds',
            '👑 Request Custom Quote',
          ],
        },
      ]);
    }
  }, [messages.length]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Listen for open-ai-chat events triggered from bottom navbar or anywhere in UI
  useEffect(() => {
    const handleOpenAi = () => setIsOpen(true);
    window.addEventListener('open-ai-chat', handleOpenAi);
    return () => window.removeEventListener('open-ai-chat', handleOpenAi);
  }, []);

  const handleSendMessage = async (userText?: string, overrideAgent?: string) => {
    const textToSend = userText || inputMessage;
    if (!textToSend.trim()) return;

    const activeRole = overrideAgent || selectedAgent;

    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!userText) setInputMessage('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          agentRole: activeRole,
          roomImage: roomImage,
        }),
      });

      const json = await res.json();
      setIsTyping(false);

      if (json.success && json.data) {
        const aiMsg: Message = {
          id: `ai_${Date.now()}`,
          sender: 'ai',
          text: json.data.replyText,
          products: json.data.products,
          roomAnalysis: json.data.roomAnalysis,
          quote: json.data.quote,
          bundle: json.data.bundle,
          whatsAppUrl: json.data.whatsAppUrl,
          suggestedPrompts: json.data.suggestedPrompts,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (e) {
      setIsTyping(false);
      const fallbackMsg: Message = {
        id: `ai_err_${Date.now()}`,
        sender: 'ai',
        text: "Assalam-o-Alaikum! Welcome to FAHAD ALI INTERIOR 👑\nHamare store me Total 15 Luxury Categories (54 Live Items) hain: Living Room, Bedroom, Dining, Office, Sofas, Coffee Chairs, TV Units, Storage, Custom Solutions, Outdoor, Mirrors, Accessories, Center Tables, Showcase, Wardrobes.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    }
  };

  const handleRoleTabChange = (role: 'sales' | 'interior' | 'support' | 'quote' | 'analytics') => {
    setSelectedAgent(role);
    let prompt = "Show me top featured Sheesham furniture collections & room packages.";
    if (role === 'interior') {
      prompt = "I want executive interior design advice & spatial room layout guidance for my room.";
    } else if (role === 'quote') {
      prompt = "I need a custom bespoke furniture price calculation estimate for my room size.";
    } else if (role === 'support') {
      prompt = "I need help with my order tracking, delivery status, or 10-Year guarantee.";
    }
    handleSendMessage(prompt, role);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64 = uploadEvent.target?.result as string;
        setRoomImage(base64);
        handleSendMessage("I uploaded my room photo. Please analyze the spatial layout and recommend matching Sheesham furniture.");
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleMicListening = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceModalOpen(true);
      return;
    }

    if (isListeningMic) {
      speechRecognitionRef.current?.stop();
      setIsListeningMic(false);
    } else {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => setIsListeningMic(true);
      rec.onresult = (e: any) => {
        const text = e.results[0][0].transcript;
        if (text) {
          setInputMessage(text);
          handleSendMessage(text);
        }
      };
      rec.onerror = () => setIsListeningMic(false);
      rec.onend = () => setIsListeningMic(false);

      speechRecognitionRef.current = rec;
      rec.start();
    }
  };

  const handleCalculateCustomQuote = () => {
    const prompt = `Please calculate custom quote for dimensions: ${customLength}" Length x ${customWidth}" Width in ${customStain} finish.`;
    handleSendMessage(prompt, 'quote');
  };

  return (
    <>
      {/* ── DRAGGABLE FLOATING AI CHATBOT TRIGGER (MOVE ANYWHERE ON SCREEN) ── */}
      {!isOpen && (
        <button
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => setIsDragging(false)}
          style={
            position
              ? {
                  left: `${position.x}px`,
                  top: `${position.y}px`,
                  bottom: 'auto',
                  right: 'auto',
                  touchAction: 'none',
                }
              : { touchAction: 'none' }
          }
          className={`fixed z-50 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#1A1009] hover:bg-[#8A5A2B] text-[#F3E5AB] shadow-[0_10px_30px_rgba(0,0,0,0.6),0_0_20px_rgba(201,169,110,0.3)] border-2 border-[#C9A96E]/70 flex items-center justify-center cursor-grab active:cursor-grabbing select-none transition-shadow duration-200 ${
            !position ? 'bottom-[68px] lg:bottom-6 right-4 sm:right-6' : ''
          } ${isDragging ? 'scale-110 shadow-[0_15px_35px_rgba(0,0,0,0.8),0_0_25px_rgba(201,169,110,0.5)] ring-4 ring-[#C9A96E]/40' : 'hover:scale-105'}`}
          aria-label="Drag AI Anywhere or Tap to Open"
          title="Drag anywhere on screen or click to open"
        >
          <div className="relative flex items-center justify-center pointer-events-none">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-[#F3E5AB] group-hover:rotate-12 transition-transform duration-300" />
            <span className="absolute -top-1 -right-1 px-1 py-0.2 rounded-full bg-rose-600 text-white font-sans text-[7.5px] font-black tracking-tighter flex items-center justify-center border border-[#1A1009] shadow-sm">
              AI
            </span>
          </div>
        </button>
      )}

      {/* Floating AI Employee Modal (Warm Royal Cream Theme) */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-[95vw] sm:w-[460px] h-[670px] max-h-[92vh] bg-[#FAF7F2] border border-[#E2D7C5] rounded-3xl shadow-[0_20px_50px_rgba(138,90,43,0.25)] flex flex-col overflow-hidden text-stone-900 font-sans">
          {/* Header (Admin Page Matching Cream & Sheesham Brown) */}
          <div className="p-4 bg-white border-b border-[#EAE2D5] flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#8A5A2B] flex items-center justify-center text-white font-bold shadow-md border border-[#A67543]">
                <Crown className="w-5 h-5 text-amber-200" />
              </div>
              <div>
                <h3 className="font-serif font-extrabold text-sm text-[#2C1810] flex items-center gap-2">
                  FAHAD ALI Executive AI <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#F4ECE1] border border-[#E2D4C3] text-[#8A5A2B] font-mono font-semibold">
                    100% Solid Sheesham
                  </span>
                  <span className="text-[9px] text-stone-500 font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-amber-600 inline" /> 10-Yr Guarantee
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-stone-400 hover:text-[#8A5A2B] rounded-full hover:bg-[#F5ECE0] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Agent Role Switcher (Warm Cream Active Tabs) */}
          <div className="flex items-center gap-1.5 px-3 py-2.5 bg-[#F4ECE1]/90 border-b border-[#E5DDD0] overflow-x-auto text-[11px]">
            <button
              onClick={() => handleRoleTabChange('sales')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedAgent === 'sales'
                  ? 'bg-[#8A5A2B] text-white shadow-md border border-[#734820]'
                  : 'bg-white text-[#7A6048] hover:text-[#2C1810] border border-[#E5DDD0]'
              }`}
            >
              👑 Senior Sales
            </button>
            <button
              onClick={() => handleRoleTabChange('interior')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedAgent === 'interior'
                  ? 'bg-[#8A5A2B] text-white shadow-md border border-[#734820]'
                  : 'bg-white text-[#7A6048] hover:text-[#2C1810] border border-[#E5DDD0]'
              }`}
            >
              🎨 Designer
            </button>
            <button
              onClick={() => handleRoleTabChange('quote')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedAgent === 'quote'
                  ? 'bg-[#8A5A2B] text-white shadow-md border border-[#734820]'
                  : 'bg-white text-[#7A6048] hover:text-[#2C1810] border border-[#E5DDD0]'
              }`}
            >
              🧮 Custom Quote
            </button>
            <button
              onClick={() => handleRoleTabChange('support')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedAgent === 'support'
                  ? 'bg-[#8A5A2B] text-white shadow-md border border-[#734820]'
                  : 'bg-white text-[#7A6048] hover:text-[#2C1810] border border-[#E5DDD0]'
              }`}
            >
              📦 Support
            </button>
          </div>

          {/* Interactive Custom Quote Calculator Panel (When Quote Tab Active) */}
          {selectedAgent === 'quote' && (
            <div className="p-3 bg-amber-900/5 border-b border-[#E2D7C5] space-y-2 text-xs">
              <div className="flex items-center justify-between font-serif font-bold text-[#8A5A2B]">
                <span className="flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-amber-700" /> Interactive Size Estimator
                </span>
                <span className="text-[10px] text-stone-500 font-sans">100% Solid Sheesham</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-stone-600 font-bold block mb-1">Length (in)</label>
                  <input
                    type="number"
                    value={customLength}
                    onChange={(e) => setCustomLength(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-[#E5DDD0] rounded-lg text-xs font-mono font-bold text-[#2C1810]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-stone-600 font-bold block mb-1">Width (in)</label>
                  <input
                    type="number"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-[#E5DDD0] rounded-lg text-xs font-mono font-bold text-[#2C1810]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-stone-600 font-bold block mb-1">Wood Finish</label>
                  <select
                    value={customStain}
                    onChange={(e) => setCustomStain(e.target.value)}
                    className="w-full px-1.5 py-1 bg-white border border-[#E5DDD0] rounded-lg text-[10px] font-bold text-[#2C1810]"
                  >
                    <option value="Royal Dark Walnut">Dark Walnut</option>
                    <option value="Natural Sheesham">Natural</option>
                    <option value="Satin Ebony">Satin Ebony</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleCalculateCustomQuote}
                className="w-full py-1.5 bg-[#8A5A2B] hover:bg-[#734820] text-white font-bold rounded-lg text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Calculator className="w-3.5 h-3.5 text-amber-200" /> Calculate Instant Bespoke Estimate
              </button>
            </div>
          )}

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs bg-[#FAF7F2]">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                    m.sender === 'user'
                      ? 'bg-[#8A5A2B] text-white font-medium rounded-tr-none shadow-md'
                      : 'bg-white border border-[#EAE2D5] text-[#2C1810] rounded-tl-none shadow-sm'
                  }`}
                >
                  {m.text}

                  {/* Render Custom Quote Card */}
                  {m.quote && (
                    <div className="mt-3 p-3 rounded-xl bg-[#FAF6F0] border border-[#E2D4C3] text-stone-900 space-y-1.5 shadow-sm">
                      <div className="flex justify-between items-center text-[#8A5A2B] font-bold">
                        <span>Bespoke Estimate</span>
                        <span className="font-mono text-xs text-[#9B6B38]">{m.quote.quoteId}</span>
                      </div>
                      <p className="text-[11px] text-stone-600">{m.quote.dimensions} • {m.quote.woodStain}</p>
                      <div className="pt-2 border-t border-[#EAE2D5] flex justify-between font-bold text-[#8A5A2B] text-sm">
                        <span>Total:</span>
                        <span>{m.quote.formattedTotal || `PKR ${m.quote.finalTotalAmount}`}</span>
                      </div>
                    </div>
                  )}

                  {/* Render Smart Room Bundle Card */}
                  {m.bundle && (
                    <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-br from-[#FAF6F0] to-[#F4ECE1] border-2 border-[#8A5A2B]/40 text-stone-900 space-y-2.5 shadow-md">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#8A5A2B] text-white px-2 py-0.5 rounded-full">
                            🎁 Smart Room Package
                          </span>
                          <h4 className="font-serif font-extrabold text-sm text-[#2C1810] mt-1">{m.bundle.title}</h4>
                        </div>
                        <span className="text-[10px] font-mono font-black text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-lg whitespace-nowrap">
                          Save PKR {new Intl.NumberFormat('en-PK').format(m.bundle.savings)}
                        </span>
                      </div>

                      <p className="text-[11px] text-stone-600 leading-snug">{m.bundle.description}</p>

                      <div className="space-y-1 pt-1.5 border-t border-[#EAE2D5]">
                        {m.bundle.items?.map((item: any) => (
                          <div key={item.id} className="flex justify-between items-center text-[11px]">
                            <span className="text-stone-700 font-medium truncate max-w-[210px]">• {item.name}</span>
                            <span className="font-mono text-[#8A5A2B] font-bold">PKR {new Intl.NumberFormat('en-PK').format(item.price)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-[#EAE2D5] flex items-center justify-between">
                        <div>
                          <span className="text-[10px] line-through text-stone-400 font-mono block">
                            PKR {new Intl.NumberFormat('en-PK').format(m.bundle.originalPrice)}
                          </span>
                          <span className="text-sm font-extrabold text-[#8A5A2B]">
                            PKR {new Intl.NumberFormat('en-PK').format(m.bundle.discountedPrice)}
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            m.bundle.items?.forEach((item: any) => addItem(item));
                          }}
                          className="bg-[#8A5A2B] hover:bg-[#734820] text-white px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-amber-200" /> 1-Click Add Bundle
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Render Product Cards Grid */}
                  {m.products && m.products.length > 0 && (
                    <div className="mt-3 grid grid-cols-1 gap-2 pt-2 border-t border-[#EAE2D5]">
                      {m.products.map((p: any) => (
                        <div key={p.id} className="p-2.5 rounded-xl bg-white border border-[#E5DDD0] hover:border-[#8A5A2B] flex items-center justify-between gap-3 shadow-sm transition-all">
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-[#FAF7F2] border border-[#EAE2D5]">
                            <Image src={p.image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80'} alt={p.name} fill className="object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-serif font-bold text-[#2C1810] truncate text-xs">{p.name}</h5>
                            <span className="text-[#8A5A2B] font-extrabold text-xs block">
                              PKR {new Intl.NumberFormat('en-PK').format(p.price)}
                            </span>
                          </div>
                          <button
                            onClick={() => addItem(p)}
                            className="bg-[#8A5A2B] hover:bg-[#734820] text-white px-2.5 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                            title="Add to cart"
                          >
                            <ShoppingBag className="w-3.5 h-3.5 text-amber-200" /> Cart
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* WhatsApp Direct Escalation Button */}
                  {m.whatsAppUrl && (
                    <a
                      href={m.whatsAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all"
                    >
                      <PhoneCall className="w-3.5 h-3.5" /> Connect on WhatsApp Specialist
                    </a>
                  )}
                </div>

                <span className="text-[9px] text-stone-400 mt-1 px-1">{m.timestamp}</span>

                {/* Suggested Quick Prompts */}
                {m.suggestedPrompts && (
                  <div className="flex flex-wrap gap-1.5 mt-2 max-w-[88%]">
                    {m.suggestedPrompts.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(prompt)}
                        className="px-2.5 py-1 rounded-full bg-white hover:bg-[#F4ECE1] border border-[#E2D4C3] text-[10px] text-[#8A5A2B] font-bold shadow-sm transition-colors cursor-pointer"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-[#8A5A2B] text-xs py-2">
                <Sparkles className="w-4 h-4 text-amber-600 animate-spin" />
                <span className="font-mono font-medium">AI Executive is analyzing database...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Attached Room Photo Preview */}
          {roomImage && (
            <div className="px-3 py-1.5 bg-[#F4ECE1] border-t border-[#E5DDD0] flex items-center justify-between text-xs">
              <span className="text-[#8A5A2B] font-bold flex items-center gap-1.5">
                🖼️ Room Photo Attached (Vision AI Ready)
              </span>
              <button
                onClick={() => setRoomImage(null)}
                className="text-stone-500 hover:text-rose-600 text-xs font-bold"
              >
                ✕ Remove
              </button>
            </div>
          )}

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-[#EAE2D5] space-y-2 shadow-sm">
            <div className="flex items-center gap-2">
              {/* Hidden File Input for Camera */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                onClick={() => cameraInputRef.current?.click()}
                className="p-2 text-stone-500 hover:text-[#8A5A2B] rounded-xl hover:bg-[#F5ECE0] transition-colors cursor-pointer"
                title="Upload Room Photo for Vision AI Analysis"
              >
                <Camera className="w-4.5 h-4.5" />
              </button>

              <button
                onClick={toggleMicListening}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isListeningMic
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'text-stone-500 hover:text-[#8A5A2B] hover:bg-[#F5ECE0]'
                }`}
                title="Voice Input (Speech-to-Text)"
              >
                {isListeningMic ? <MicOff className="w-4.5 h-4.5" /> : <Mic className="w-4.5 h-4.5" />}
              </button>

              <input
                type="text"
                placeholder={isListeningMic ? "Listening..." : "Ask Executive AI Employee..."}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 bg-[#FAF7F4] border border-[#E5DDD0] rounded-xl px-3.5 py-2 text-xs text-[#2C1810] focus:outline-none focus:border-[#8A5A2B] focus:bg-white transition-colors"
              />

              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim()}
                className="p-2 rounded-xl bg-[#8A5A2B] hover:bg-[#734820] text-white font-bold disabled:opacity-40 transition-all shadow-sm cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voice AI Modal */}
      <VoiceAiModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        onTranscript={(text) => handleSendMessage(text)}
      />
    </>
  );
}
