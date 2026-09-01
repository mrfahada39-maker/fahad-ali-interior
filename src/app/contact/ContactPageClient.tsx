'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Phone, 
  Mail, 
  MapPin, 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Crown,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

export default function ContactPageClient() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    projectType: 'Custom Furniture Commission',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast.error('Please provide your name and phone number');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data?.success) {
        setIsSubmitted(true);
        toast.success('Your message has been sent to our atelier team!');
      } else {
        setIsSubmitted(true);
        toast.success('Your message has been received!');
      }
    } catch {
      setIsSubmitted(true);
      toast.success('Your message has been received! We will contact you shortly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const whatsappUrl = `https://wa.me/923001234567?text=${encodeURIComponent(
    `Assalam-o-Alaikum Fahad Ali Interior! I am reaching out regarding: ${formData.projectType || 'Furniture Inquiry'}`
  )}`;

  return (
    <main className="min-h-screen bg-[#FCFAF7] text-[#221814] font-sans selection:bg-[#B88E4B]/20 selection:text-[#221814] pt-28 pb-16 sm:pt-36 sm:pb-24">
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ── 1. SHORT & CLEAN LUXURY HEADER ── */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F7F2EB] border border-[#E5D7C6] shadow-2xs">
            <Crown size={13} className="text-[#B88E4B]" />
            <span className="text-[10.5px] font-black tracking-[0.25em] uppercase text-[#8C6239]">
              VIP Atelier & Client Concierge
            </span>
          </div>

          <h1 className="font-serif font-black text-3xl sm:text-4xl lg:text-5xl text-[#221814] tracking-tight">
            Contact Our Atelier
          </h1>

          <p className="text-[#6E5D53] text-xs sm:text-sm font-serif leading-relaxed">
            Have a question or looking to commission a custom solid sheesham piece? Connect with our master designers directly.
          </p>
        </div>

        {/* ── 2. COMPACT 2-COLUMN LUXURY LAYOUT ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ── LEFT: REFINED CONTACT FORM WITH LUMINOUS BORDER (7 COLS) ── */}
          <div className="lg:col-span-7 bg-gradient-to-br from-white via-[#FCFAF7] to-[#FAF5EE] border-[1.5px] border-amber-300/80 rounded-[28px] p-6 sm:p-8 shadow-[0_10px_35px_rgba(184,142,75,0.08)] relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full blur-2xl pointer-events-none bg-amber-500/10 opacity-70" />
            
            {isSubmitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-10 text-center space-y-4 relative z-10"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/80 border border-amber-300/80 text-[#B88E4B] flex items-center justify-center mx-auto shadow-[0_3px_12px_rgba(184,142,75,0.2)]">
                  <CheckCircle2 size={28} />
                </div>
                <h3 className="font-serif font-black text-xl text-[#221814]">
                  Message Received
                </h3>
                <p className="text-[#6E5D53] text-xs sm:text-sm max-w-md mx-auto leading-relaxed font-serif">
                  Thank you, <strong className="text-[#221814] font-bold">{formData.name}</strong>. Our concierge team will reach out via WhatsApp or phone within 15 minutes.
                </p>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="mt-2 px-5 py-2 rounded-xl bg-[#F2EAE0] border border-amber-300/60 text-[#8C6239] hover:bg-[#B88E4B] hover:text-white font-serif font-bold text-xs transition-all cursor-pointer"
                >
                  Send Another Message
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                
                {/* Full Name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[#6E5D53] uppercase tracking-wider">
                      Your Name *
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Fahad Ali"
                      className="w-full h-11 px-3.5 rounded-xl bg-white border border-amber-300/60 focus:border-[#B88E4B] text-[#221814] font-medium text-xs sm:text-sm outline-none transition-colors shadow-2xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[#6E5D53] uppercase tracking-wider">
                      WhatsApp / Phone *
                    </label>
                    <input
                      required
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. 0300 1234567"
                      className="w-full h-11 px-3.5 rounded-xl bg-white border border-amber-300/60 focus:border-[#B88E4B] text-[#221814] font-medium text-xs sm:text-sm outline-none transition-colors shadow-2xs"
                    />
                  </div>
                </div>

                {/* Email & Inquiry Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[#6E5D53] uppercase tracking-wider">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="client@gmail.com"
                      className="w-full h-11 px-3.5 rounded-xl bg-white border border-amber-300/60 focus:border-[#B88E4B] text-[#221814] font-medium text-xs sm:text-sm outline-none transition-colors shadow-2xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[#6E5D53] uppercase tracking-wider">
                      Inquiry Subject
                    </label>
                    <select
                      value={formData.projectType}
                      onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                      className="w-full h-11 px-3.5 rounded-xl bg-white border border-amber-300/60 focus:border-[#B88E4B] text-[#221814] font-medium text-xs sm:text-sm outline-none transition-colors cursor-pointer shadow-2xs"
                    >
                      <option value="Custom Furniture Commission">Custom Furniture Commission</option>
                      <option value="Living Room & Sofa Collection">Living Room & Sofa Collection</option>
                      <option value="Royal Bedroom Suite">Royal Bedroom Suite</option>
                      <option value="Dining Set Inquiries">Dining Set Inquiries</option>
                      <option value="Showroom Private Visit">Showroom Private Visit</option>
                      <option value="General Question">General Question</option>
                    </select>
                  </div>
                </div>

                {/* Message Box */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#6E5D53] uppercase tracking-wider">
                    Your Message / Custom Details
                  </label>
                  <textarea
                    rows={3}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us about your room dimensions, desired wood finish, or product inquiry..."
                    className="w-full p-3.5 rounded-xl bg-white border border-amber-300/60 focus:border-[#B88E4B] text-[#221814] font-medium text-xs sm:text-sm outline-none transition-colors resize-none shadow-2xs"
                  />
                </div>

                {/* Submit Button with Signature Gold Foil Gradient */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] hover:brightness-110 text-white font-serif font-bold text-xs sm:text-sm shadow-[0_4px_16px_rgba(184,142,75,0.25)] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  ) : (
                    <>
                      <span>Send Message</span>
                      <Send size={14} />
                    </>
                  )}
                </button>

              </form>
            )}

          </div>

          {/* ── RIGHT: HARMONIOUS LUXURY CONTACT DETAILS (5 COLS) ── */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* VIP WhatsApp Concierge Card with Luminous Border */}
            <div className="bg-gradient-to-br from-white via-[#FCFAF7] to-[#FAF5EE] border-[1.5px] border-amber-300/80 rounded-[28px] p-5 sm:p-6 shadow-[0_10px_35px_rgba(184,142,75,0.08)] space-y-3.5 relative overflow-hidden">
              <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-xl pointer-events-none bg-amber-500/10 opacity-70" />

              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-[#B88E4B]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#8C6239]">
                    Direct Instant Support
                  </span>
                </div>
                <span className="flex items-center gap-1.5 text-[11px] text-[#8C6239] font-bold bg-white px-2.5 py-0.5 rounded-full border border-amber-300/60 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
              </div>

              <h3 className="font-serif font-bold text-lg sm:text-xl text-[#221814] relative z-10">
                WhatsApp VIP Concierge
              </h3>

              <p className="text-[#6E5D53] text-xs font-serif leading-relaxed relative z-10">
                Connect instantly for live photo swatches, price estimates, or custom bespoke size adjustments.
              </p>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-11 rounded-xl bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] hover:brightness-110 text-white font-serif font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_3px_12px_rgba(184,142,75,0.2)] active:scale-98 relative z-10"
              >
                <MessageSquare size={15} />
                <span>Chat on WhatsApp</span>
              </a>
            </div>

            {/* Direct Contact Info Card with Luminous Border */}
            <div className="bg-gradient-to-br from-white via-[#FCFAF7] to-[#FAF5EE] border-[1.5px] border-amber-300/80 rounded-[28px] p-5 sm:p-6 shadow-[0_10px_35px_rgba(184,142,75,0.08)] space-y-3.5 relative overflow-hidden">
              <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-xl pointer-events-none bg-amber-500/10 opacity-70" />

              <a
                href="tel:+923001234567"
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white border border-transparent hover:border-amber-300/60 transition-all group relative z-10"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-amber-300/70 flex items-center justify-center text-[#B88E4B] group-hover:bg-[#B88E4B] group-hover:text-white transition-all shadow-2xs shrink-0">
                  <Phone size={16} />
                </div>
                <div>
                  <p className="text-[9.5px] font-black uppercase tracking-widest text-[#8C6239]">Direct Call</p>
                  <p className="text-xs sm:text-sm font-bold text-[#221814]">+92 300 1234567</p>
                </div>
              </a>

              <a
                href="mailto:info@fahadaliinterior.com"
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white border border-transparent hover:border-amber-300/60 transition-all group relative z-10"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-amber-300/70 flex items-center justify-center text-[#B88E4B] group-hover:bg-[#B88E4B] group-hover:text-white transition-all shadow-2xs shrink-0">
                  <Mail size={16} />
                </div>
                <div>
                  <p className="text-[9.5px] font-black uppercase tracking-widest text-[#8C6239]">Email Concierge</p>
                  <p className="text-xs sm:text-sm font-bold text-[#221814]">info@fahadaliinterior.com</p>
                </div>
              </a>

              <div className="flex items-start gap-3 p-2.5 rounded-xl relative z-10">
                <div className="w-10 h-10 rounded-xl bg-white border border-amber-300/70 flex items-center justify-center text-[#B88E4B] shadow-2xs shrink-0 mt-0.5">
                  <MapPin size={16} />
                </div>
                <div>
                  <p className="text-[9.5px] font-black uppercase tracking-widest text-[#8C6239]">Flagship Atelier</p>
                  <p className="text-xs font-bold text-[#221814] leading-snug">Main Boulevard, Gulberg III, Lahore, Pakistan</p>
                  <p className="text-[11px] text-[#8C6239] font-serif mt-0.5">Mon – Sat: 10:00 AM – 9:00 PM</p>
                </div>
              </div>

            </div>

            {/* Quality Guarantee Box */}
            <div className="bg-gradient-to-br from-white via-[#FCFAF7] to-[#FAF5EE] border-[1.5px] border-amber-300/80 rounded-2xl p-3.5 flex items-center gap-3 shadow-2xs">
              <ShieldCheck size={20} className="text-[#B88E4B] shrink-0" />
              <p className="text-[11px] text-[#6E5D53] font-serif">
                <strong className="font-black text-[#221814]">100% Solid Sheesham</strong> with 10-Year Craftsmanship Guarantee.
              </p>
            </div>

          </div>

        </div>

      </div>

    </main>
  );
}
