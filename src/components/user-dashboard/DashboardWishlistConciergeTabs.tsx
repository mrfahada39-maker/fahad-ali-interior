/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Plus, Search, ShoppingBag, Heart, Sparkles, Eye, ShieldCheck, Trash2,
  Phone, Video, MessageCircle, Crown, Send,
} from 'lucide-react';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { toast } from 'sonner';
import { resolveImageUrl } from '@/lib/images';
import VoiceNotePlayer from '@/components/VoiceNotePlayer';
import VoiceNoteRecorder from '@/components/VoiceNoteRecorder';
import { renderHeaderBanner, renderKpiGrid, formatPrice } from './dashboard-kpis';

export function DashboardWishlistTab({
  mergedWishlist,
  wishlistKpis,
  searchQuery,
  setSearchQuery,
  wishlistCategoryFilter,
  setWishlistCategoryFilter,
  addItem,
  openCart,
  filteredWishlist,
  setQuickViewProduct,
  handleMoveToCart,
  handleRemoveWishlist,
}: {
  mergedWishlist: any[];
  wishlistKpis: any[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  wishlistCategoryFilter: string;
  setWishlistCategoryFilter: (c: string) => void;
  addItem: (prod: any) => void;
  openCart: () => void;
  filteredWishlist: any[];
  setQuickViewProduct: (prod: any) => void;
  handleMoveToCart: (prod: any) => void;
  handleRemoveWishlist: (item: any) => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {renderHeaderBanner(
        '✦ HAUTE GALLERY',
        '✦ HAUTE GALLERY REGISTRY',
        `${mergedWishlist.length} CURATIONS`,
        `${mergedWishlist.length} ACTIVE CURATIONS`,
        'Private Curated',
        'Wishlist & Living Pieces',
        'Solid Sheesham specifications, Turkish velvet customization, Cloudinary high-res gallery, and instant bag allocation.',
        <Link
          href="/shop"
          className="inline-flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] text-white font-serif font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all shadow-md shrink-0 active:scale-95"
        >
          <Plus size={14} />
          <span>Explore More Pieces</span>
        </Link>
      )}

      {renderKpiGrid(wishlistKpis)}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white/80 backdrop-blur-md p-2.5 sm:p-3 rounded-2xl border border-[#E7DDD0] shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search curated pieces by name, timber, or category..."
            className="pl-9 pr-8 rounded-xl border-[#E7DDD0] bg-white text-xs h-9 focus:ring-[#B88E4B] placeholder:text-stone-400 shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select id="fai-dashboardwishlistconciergetabs-field-1" name="fai_dashboardwishlistconciergetabs_field_1"
            aria-label="Filter wishlist by category"
            value={wishlistCategoryFilter}
            onChange={(e) => setWishlistCategoryFilter(e.target.value)}
            className="h-9 px-3 rounded-xl border border-[#E7DDD0] bg-[#FAF5EE] text-xs font-bold text-[#7A6354] cursor-pointer focus:ring-1 focus:ring-[#B88E4B]"
          >
            <option value="ALL">All Categories ({mergedWishlist.length})</option>
            <option value="Living Room">Living Room</option>
            <option value="Bedroom">Bedroom</option>
            <option value="Dining Room">Dining Room</option>
            <option value="Center Tables">Center Tables</option>
            <option value="Coffee Chairs">Coffee Chairs</option>
          </select>

          {mergedWishlist.length > 0 && (
            <Button
              onClick={() => {
                mergedWishlist.forEach((item) => addItem(item.product));
                openCart();
                toast.success('All curated pieces transferred to Shopping Bag');
              }}
              className="rounded-xl bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] text-white text-xs font-bold h-9 px-4 cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5"
            >
              <ShoppingBag size={13} />
              <span className="hidden sm:inline">Add All to Bag</span>
            </Button>
          )}
        </div>
      </div>

      {filteredWishlist.length === 0 ? (
        <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-[22px] border-2 border-dashed border-[#E7DDD0] p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-200 text-rose-500 flex items-center justify-center mx-auto shadow-xs">
            <Heart size={26} />
          </div>
          <h3 className="font-serif font-black text-lg text-[#1F1612]">Your Haute Wishlist Is Empty</h3>
          <p className="text-xs text-[#7A6354] max-w-md mx-auto">
            Explore our private bespoke catalog and save handcrafted Solid Sheesham and Turkish velvet pieces to your royal suite.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#B88E4B] text-white font-serif font-bold text-xs shadow-md hover:bg-[#8C6239] transition-all"
          >
            <Plus size={14} /> Explore Master Catalog
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredWishlist.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl sm:rounded-[22px] border border-[#E7DDD0] overflow-hidden shadow-[0_4px_20px_rgba(44,30,24,0.03)] hover:border-[#B88E4B] hover:shadow-[0_12px_32px_rgba(184,142,75,0.12)] transition-all flex flex-col justify-between group"
            >
              <div className="relative aspect-[4/3] bg-[#FAF5EE] overflow-hidden">
                <Image
                  src={resolveImageUrl(item.product.image, item.product.category)}
                  alt={item.product.name}
                  fill
                  className="object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-md text-[8.5px] font-black text-[#1F1612] uppercase tracking-wider border border-[#E7DDD0] shadow-xs">
                    {item.product.category || 'CENTER TABLES'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#B88E4B] to-[#996515] text-white text-[8px] font-black uppercase tracking-wider shadow-xs flex items-center gap-1">
                    <Sparkles size={8} /> PREMIUM BESPOKE
                  </span>
                </div>

                <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-emerald-600/90 backdrop-blur-xs text-white text-[9px] font-black shadow-xs z-10 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  5 Left
                </span>

                <div className="absolute bottom-2.5 left-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
                  <button
                    onClick={() => setQuickViewProduct(item.product)}
                    className="w-full py-1.5 rounded-xl bg-white/95 backdrop-blur-md text-[#1F1612] text-[11px] font-bold border border-[#E7DDD0] shadow-md hover:bg-[#B88E4B] hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Eye size={12} /> View Crafting Specs
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif font-black text-[15px] sm:text-base text-[#1F1612] truncate group-hover:text-[#B88E4B] transition-colors">
                    {item.product.name}
                  </h3>
                  <p className="text-[11px] text-[#7A6354] font-medium mt-0.5 flex items-center gap-1">
                    <ShieldCheck size={12} className="text-[#B88E4B]" />
                    {item.product.material || 'Solid Sheesham Wood'}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-[#E7DDD0]/80 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-mono font-bold text-stone-400 block">Commission</span>
                    <span className="font-serif font-black text-base sm:text-[17px] text-[#1F1612]">
                      Rs. {formatPrice(item.product.price)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        handleMoveToCart(item.product);
                        toast.success(`${item.product.name} added to Shopping Bag`);
                      }}
                      className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#B88E4B] to-[#996515] hover:brightness-110 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                      title="Add to Shopping Bag"
                    >
                      <ShoppingBag size={13} />
                      <span className="hidden sm:inline text-[11px]">Bag</span>
                    </button>

                    <button
                      onClick={() => handleRemoveWishlist(item)}
                      className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                      title="Remove from Wishlist"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export function DashboardConciergeTab({
  conciergeKpis,
  startCall,
  messages,
  userChatBottomRef,
  msgInput,
  setMsgInput,
  handleSendMessage,
  handleSendVoiceNote,
}: {
  conciergeKpis: any[];
  startCall: (type: 'voice' | 'video') => void;
  messages: any[];
  userChatBottomRef: React.RefObject<HTMLDivElement | null>;
  msgInput: string;
  setMsgInput: (v: string) => void;
  handleSendMessage: (t?: string) => void;
  handleSendVoiceNote: (url: string, duration: number) => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {renderHeaderBanner(
        '✦ ATELIER HOTLINE',
        '✦ ATELIER PRIVATE HOTLINE',
        'ONLINE',
        'MASTER CRAFTSMAN ONLINE',
        'VIP Concierge',
        '& Atelier Dialogue',
        'Direct encrypted channel with Fahad Ali master artisans and architectural styling team.',
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => startCall('voice')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#B88E4B] to-[#8C6239] hover:brightness-110 text-white font-black text-xs transition-all shadow-md shrink-0 cursor-pointer active:scale-95"
            title="Start VIP Audio Call"
          >
            <Phone size={13} />
            <span>Voice Call</span>
          </button>

          <button
            type="button"
            onClick={() => startCall('video')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1F1612] hover:bg-[#32231C] text-amber-200 border border-[#B88E4B]/40 font-black text-xs transition-all shadow-md shrink-0 cursor-pointer active:scale-95"
            title="Start VIP Video Consultation"
          >
            <Video size={13} />
            <span>Video Call</span>
          </button>

          <a
            href="https://wa.me/923207006110?text=Hello%20Fahad%20Ali%20Interior%20Team,%20connecting%20via%20VIP%20Concierge."
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#25D366] text-white font-bold text-xs hover:brightness-110 transition-all shadow-md shrink-0"
          >
            <Phone size={13} /> WhatsApp
          </a>
        </div>
      )}

      {renderKpiGrid(conciergeKpis)}

      <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-[24px] border border-[#E7DDD0] shadow-[0_4px_24px_rgba(44,30,24,0.04)] flex flex-col h-[560px] overflow-hidden">
        <div className="p-3.5 sm:px-5 sm:py-3.5 bg-gradient-to-r from-[#FAF5EE] via-white to-[#FAF5EE] border-b border-[#E7DDD0] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#B88E4B] via-[#996515] to-[#5A3A1A] text-white flex items-center justify-center font-serif font-black text-sm shadow-md border-2 border-white">
                FA
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-serif font-black text-sm text-[#1F1612]">Master Artisan Atelier</h4>
                <span className="px-2 py-0.2 rounded-full text-[8.5px] font-black uppercase tracking-wider bg-amber-50 text-[#8C6239] border border-[#B88E4B]/30">
                  👑 HEAD DESIGNER
                </span>
              </div>
              <p className="text-[10.5px] text-[#7A6354] font-medium flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1 text-emerald-700 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active in Lahore Atelier
                </span>
                <span>•</span>
                <span className="font-mono text-stone-400">Avg response &lt; 2 min</span>
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={() => startCall('voice')}
              className="w-8 h-8 rounded-xl bg-[#FAF5EE] hover:bg-[#B88E4B] text-[#8C6239] hover:text-white border border-[#E7DDD0] flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105"
              title="Audio Call"
            >
              <Phone size={13} />
            </button>
            <button
              onClick={() => startCall('video')}
              className="w-8 h-8 rounded-xl bg-[#FAF5EE] hover:bg-[#B88E4B] text-[#8C6239] hover:text-white border border-[#E7DDD0] flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105"
              title="Video Consultation"
            >
              <Video size={13} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 scrollbar-thin bg-gradient-to-b from-[#FCFAF7]/40 via-white to-[#FCFAF7]/40">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400">
              <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 text-[#8C6239] flex items-center justify-center mx-auto mb-3 shadow-xs">
                <MessageCircle size={28} />
              </div>
              <p className="font-serif font-black text-base text-[#1F1612]">Private Atelier Channel</p>
              <p className="text-xs text-[#7A6354] max-w-sm mt-1">
                Send a message or voice note to discuss custom timber seasoning, polish finish, or delivery schedules with master craftsmen.
              </p>
            </div>
          ) : (
            messages.map((m: any, i: number) => {
              const isMe = m.sender === 'user';
              const isVoiceNote = typeof m.text === 'string' && m.text.startsWith('[VOICE_NOTE]:');
              const voiceAudioUrl = isVoiceNote ? m.text.replace('[VOICE_NOTE]:', '') : '';

              return (
                <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}>
                  {!isMe && (
                    <span className="text-[10px] font-bold text-[#8C6239] ml-1 flex items-center gap-1">
                      <Crown size={10} /> Fahad Ali Concierge
                    </span>
                  )}
                  <div
                    className={`max-w-[85%] sm:max-w-md p-3.5 rounded-2xl text-xs relative ${
                      isMe
                        ? 'bg-gradient-to-r from-[#B88E4B] via-[#A87B3C] to-[#8C6239] text-white rounded-br-xs shadow-[0_4px_16px_rgba(184,142,75,0.25)]'
                        : 'bg-white text-[#1F1612] border border-[#E7DDD0] rounded-bl-xs shadow-[0_3px_12px_rgba(44,30,24,0.04)]'
                    }`}
                  >
                    {isVoiceNote ? (
                      <VoiceNotePlayer src={voiceAudioUrl} isMe={isMe} />
                    ) : (
                      <p className="font-medium leading-relaxed tracking-wide">{m.text}</p>
                    )}

                    <div className="flex items-center justify-end gap-1 mt-1.5 pt-1 border-t border-black/5 dark:border-white/10">
                      <span className={`text-[9px] font-mono ${isMe ? 'text-amber-100/80' : 'text-stone-400'}`}>
                        {new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isMe && <span className="text-[10px] text-amber-200 font-bold ml-0.5">✓✓</span>}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={userChatBottomRef} />
        </div>

        <div className="px-4 py-2 bg-[#FAF5EE]/70 border-t border-[#E7DDD0]/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px]">
          <span className="text-[10px] font-mono font-black uppercase text-[#8C6239] shrink-0">Quick Ask:</span>
          {[
            '🪵 Sheesham Polish Options',
            '🚚 Delivery to my address',
            '📍  Custom Dimensions Inquiry',
            '📸 Request Workshop Video',
          ].map((chip, idx) => (
            <button
              key={idx}
              onClick={() => setMsgInput(chip)}
              className="px-2.5 py-1 rounded-full bg-white hover:bg-[#B88E4B] text-[#7A6354] hover:text-white border border-[#E7DDD0] text-[10.5px] font-medium shrink-0 transition-colors cursor-pointer shadow-2xs"
            >
              {chip}
            </button>
          ))}
        </div>

        <div className="p-3 sm:p-3.5 bg-white border-t border-[#E7DDD0] flex items-center gap-2">
          <VoiceNoteRecorder onSendVoiceNote={handleSendVoiceNote} />
          <Input
            value={msgInput}
            onChange={(e) => setMsgInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            placeholder="Type your bespoke commission inquiry or record voice..."
            className="rounded-xl border-[#E7DDD0] bg-[#FAF5EE]/50 text-xs h-10 focus:ring-[#B88E4B] placeholder:text-stone-400"
          />
          <Button
            onClick={() => handleSendMessage()}
            disabled={!msgInput.trim()}
            className="rounded-xl bg-gradient-to-r from-[#B88E4B] to-[#8C6239] hover:brightness-110 text-white px-5 h-10 cursor-pointer shadow-xs active:scale-95 transition-all disabled:opacity-50"
          >
            <Send size={14} className="mr-1" />
            <span className="hidden sm:inline text-xs font-bold">Send</span>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
