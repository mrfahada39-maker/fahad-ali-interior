'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  MapPin,
  ArrowRight,
  Check,
  CreditCard,
  Tag,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import { useCartStore } from '@/store';
import { apiFetch } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  PAKISTAN_CITIES,
  detectPakistaniTelecom,
  isValidPakistaniPhone,
} from '@/lib/pakistan-localization';

import {
  type PaymentMethodType,
  type BankItem,
  BANKS_LIST,
} from '@/components/checkout/checkout-banks';
export type { PaymentMethodType };
import { CheckoutSectionSummary } from '@/components/checkout/CheckoutSectionSummary';
import { CheckoutSectionCustomer } from '@/components/checkout/CheckoutSectionCustomer';
import { CheckoutSectionShipping } from '@/components/checkout/CheckoutSectionShipping';
import { CheckoutSectionPayment } from '@/components/checkout/CheckoutSectionPayment';
import { SavedAddressItem } from '@/components/checkout/checkout-types';

export default function Checkout() {
  const { items: cartStoreItems, clearCart, updateQuantity, removeItem } = useCartStore();
  const { data: session } = useSession();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Active step: 1 (Order Summary), 2 (Customer Info), 3 (Shipping Address), 4 (Payment Methods)
  const [currentSection, setCurrentSection] = useState<1 | 2 | 3 | 4>(1);

  // Active items directly from actual user cart
  const activeItems = cartStoreItems;

  // Form State
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: 'Lahore',
    province: 'Punjab',
    postalCode: '54000',
    country: 'Pakistan',
    saveAddress: true,
    notes: '',
  });
  const [savedAddresses, setSavedAddresses] = useState<SavedAddressItem[]>([]);

  // Cart Store Hook
  const cartStoreAppliedCoupon = useCartStore((s) => s.appliedCoupon);
  const setCartStoreAppliedCoupon = useCartStore((s) => s.setAppliedCoupon);

  // Coupon Engine
  const [couponCode, setCouponCode] = useState(cartStoreAppliedCoupon?.code || '');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; percent?: number; fixed?: number } | null>(
    cartStoreAppliedCoupon
      ? {
          code: cartStoreAppliedCoupon.code,
          percent: cartStoreAppliedCoupon.percent || (cartStoreAppliedCoupon.discountType === 'PERCENTAGE' ? cartStoreAppliedCoupon.discount : undefined),
          fixed: cartStoreAppliedCoupon.fixed || (cartStoreAppliedCoupon.discountType !== 'PERCENTAGE' ? cartStoreAppliedCoupon.discount : undefined),
        }
      : null
  );

  // 3D Tilt State
  const [tiltStyle, setTiltStyle] = useState({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // Card Inputs (Clean, unpopulated for real customer entry)
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
  });

  // Digital Details for JazzCash / Easypaisa / Bank
  const [digitalPaymentDetails, setDigitalPaymentDetails] = useState({
    senderNumber: '',
    transactionId: '',
    senderBank: 'Meezan Bank',
    screenshotUrl: null as string | null,
  });

  // Payment Method & Bank
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('cod');
  const [selectedBank, setSelectedBank] = useState<BankItem>(BANKS_LIST[0]);
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);
  const [cardType, setCardType] = useState<'debit' | 'credit'>('debit');
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const [placing, setPlacing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Pre-fill user data & saved addresses
  useEffect(() => {
    if (session?.user) {
      setForm((prev) => ({
        ...prev,
        name: session.user?.name || prev.name,
        email: session.user?.email || prev.email,
      }));
      let cancelled = false;
      Promise.all([
        fetch('/api/user/profile', { credentials: 'include' }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/user/addresses', { credentials: 'include' }).then((r) => (r.ok ? r.json() : [])).catch(() => []),
      ]).then(([profileData, addrList]) => {
        if (cancelled) return;
        const list = Array.isArray(addrList) ? (addrList as SavedAddressItem[]) : [];
        setSavedAddresses(list);
        const defaultAddr = list.find((a) => a.isDefault) || list[0];
        setForm((prev) => ({
          ...prev,
          name: prev.name || profileData?.name || session.user?.name || '',
          email: prev.email || profileData?.email || session.user?.email || '',
          phone: prev.phone || profileData?.phone || defaultAddr?.phone || '',
          address: prev.address || defaultAddr?.address || '',
          city: defaultAddr?.city || prev.city,
          province: defaultAddr?.province || prev.province,
        }));
      });
      return () => {
        cancelled = true;
      };
    }
  }, [session]);

  const handleSelectSavedAddress = (addr: SavedAddressItem) => {
    const cityData = PAKISTAN_CITIES[addr.city];
    setForm((prev) => ({
      ...prev,
      address: addr.address,
      city: addr.city || prev.city,
      province: addr.province || cityData?.province || prev.province,
      postalCode: cityData?.postalCode || prev.postalCode,
      phone: prev.phone || addr.phone || '',
    }));
    toast.success(`Selected "${addr.name}" delivery address`);
  };

  // Sync province & postal code on city change
  useEffect(() => {
    const cityData = PAKISTAN_CITIES[form.city];
    if (cityData) {
      setForm((p) => ({
        ...p,
        province: cityData.province,
        postalCode: cityData.postalCode || p.postalCode,
      }));
    }
  }, [form.city]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsBankDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;
    setTiltStyle({ rotateX, rotateY, glareX, glareY });
  };

  const handleCardMouseLeave = () => {
    setTiltStyle({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  };

  // ── Pricing Calculations ───────────────────────────────────────────────────
  const itemsSubtotal = activeItems.reduce((sum, i) => sum + (i.price ?? 0) * (i.quantity ?? 1), 0);
  const shippingFee = 0;
  const taxAmount = 0;

  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.percent) {
      discountAmount = Math.round((itemsSubtotal * appliedCoupon.percent) / 100);
    } else if (appliedCoupon.fixed) {
      discountAmount = Math.min(appliedCoupon.fixed, itemsSubtotal);
    }
  }

  const grandTotal = Math.max(0, itemsSubtotal - discountAmount + shippingFee + taxAmount);

  // Pakistani Telecom & Phone Validation
  const detectedTelecom = detectPakistaniTelecom(form.phone);
  const isPhoneValid = isValidPakistaniPhone(form.phone);

  const handleItemQuantity = (id: string, delta: number) => {
    const item = cartStoreItems.find((i) => i.id === id);
    if (item) {
      const next = (item.quantity ?? 1) + delta;
      if (next <= 0) removeItem(id);
      else updateQuantity(id, next);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardDetails((prev) => ({ ...prev, number: formatted }));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    const formatted = raw.length > 2 ? `${raw.slice(0, 2)}/${raw.slice(2)}` : raw;
    setCardDetails((prev) => ({ ...prev, expiry: formatted }));
  };

  const copyToClipboard = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    toast.success(`${fieldKey} copied to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setDigitalPaymentDetails((p) => ({ ...p, screenshotUrl: reader.result as string }));
      toast.success('Payment receipt screenshot attached!');
    };
    reader.readAsDataURL(file);
  };

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true);
    try {
      const res = await apiFetch('/api/v1/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal: itemsSubtotal }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.valid) {
        toast.error(data.error || 'Invalid or inactive voucher code.');
        return;
      }
      if (data.discountType === 'PERCENTAGE') {
        const c = { code: data.code, percent: Number(data.discount) };
        setAppliedCoupon(c);
        setCartStoreAppliedCoupon(c);
        toast.success(`✦ ${data.discount}% Discount (${data.code}) Applied!`);
      } else {
        const c = { code: data.code, fixed: Number(data.discount) };
        setAppliedCoupon(c);
        setCartStoreAppliedCoupon(c);
        toast.success(`✦ Rs. ${Number(data.discount).toLocaleString()} Voucher (${data.code}) Applied!`);
      }
    } catch {
      toast.error('Unable to validate voucher right now. Please try again.');
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCartStoreAppliedCoupon(null);
    toast.success('Voucher removed');
  };

  const goToNextSection = () => {
    if (currentSection === 1) {
      if (activeItems.length === 0) {
        toast.error('Your cart is empty');
        return;
      }
      setCurrentSection(2);
    } else if (currentSection === 2) {
      if (!form.name.trim() || !form.phone.trim() || !form.email.trim() || !form.email.includes('@')) {
        toast.error('Please enter your Full Name, valid Email Address, and Phone Number');
        return;
      }
      if (!isPhoneValid) {
        toast.error('Please enter a valid Pakistani mobile number (e.g. 0300 1234567)');
        return;
      }
      setCurrentSection(3);
    } else if (currentSection === 3) {
      if (!form.address.trim() || !form.city.trim()) {
        toast.error('Please enter your complete Street Address and City');
        return;
      }
      setCurrentSection(4);
    }
  };

  const handlePlaceOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!form.name.trim() || !form.phone.trim() || !form.email.trim() || !form.email.includes('@') || !form.address.trim()) {
      toast.error('Please complete Full Name, valid Email, Phone Number, and Shipping Address');
      setCurrentSection(2);
      return;
    }

    if (!isPhoneValid) {
      toast.error('Please enter a valid Pakistani mobile number (e.g. 0320 7006110)');
      setCurrentSection(2);
      return;
    }

    if (paymentMethod === 'jazzcash' || paymentMethod === 'easypaisa' || paymentMethod === 'bank') {
      const hasTxId = digitalPaymentDetails.transactionId.trim().length >= 4;
      const hasScreenshot = Boolean(digitalPaymentDetails.screenshotUrl);
      if (!hasTxId && !hasScreenshot) {
        toast.error('Please enter your Transaction / Reference ID or attach a payment screenshot to verify your transfer.');
        return;
      }
    }

    if (paymentMethod === 'card') {
      const cleanCardNum = cardDetails.number.replace(/\s+/g, '');
      if (cleanCardNum.length < 15 || cardDetails.expiry.length < 5 || cardDetails.cvv.length < 3) {
        toast.error('Please enter valid 16-digit Card Number, Expiry (MM/YY), and CVV, or choose Cash on Delivery / Bank Transfer.');
        return;
      }
    }

    setPlacing(true);

    try {
      const itemsToOrder = activeItems.map((i) => ({ productId: i.id, quantity: i.quantity ?? 1 }));

      const backendPaymentMethod =
        paymentMethod === 'cod'
          ? 'cod'
          : paymentMethod === 'jazzcash'
          ? 'jazzcash'
          : paymentMethod === 'easypaisa'
          ? 'easypaisa'
          : paymentMethod === 'card'
          ? 'card'
          : 'bank';

      const res = await apiFetch('/api/orders', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify({
          items: itemsToOrder,
          paymentMethod: backendPaymentMethod,
          selectedBank: selectedBank.name,
          transactionId: digitalPaymentDetails.transactionId || undefined,
          couponCode: appliedCoupon?.code,
          paymentScreenshot: digitalPaymentDetails.screenshotUrl || undefined,
          shippingName: form.name,
          shippingPhone: form.phone,
          shippingEmail: form.email,
          shippingAddress: form.address,
          shippingCity: form.city || 'Lahore',
          shippingProvince: form.province || 'Punjab',
          subtotal: itemsSubtotal,
          totalAmount: grandTotal,
          shippingInfo: {
            name: form.name,
            phone: form.phone,
            email: form.email,
            address: form.address,
            city: form.city || 'Lahore',
            province: form.province || 'Punjab',
            postalCode: form.postalCode,
            country: form.country,
            saveAddress: form.saveAddress,
            notes: `Method: ${paymentMethod.toUpperCase()} (${selectedBank.name}). TxID: ${digitalPaymentDetails.transactionId || 'N/A'}. Notes: ${form.notes}`,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const orderId = data.order?.id || data.id || 'ORD-' + Date.now().toString().slice(-6);
        const guestToken = data.guestTrackingToken || data.order?.guestTrackingToken || '';
        const email = form.email || '';
        clearCart();
        toast.success('Order placed successfully!');
        const guestQuery = email ? `&email=${encodeURIComponent(email)}${guestToken ? `&token=${encodeURIComponent(guestToken)}` : ''}` : '';
        router.push(`/orders/success?id=${orderId}${guestQuery}`);
      } else if (res.status === 401) {
        toast.error('Please sign in to confirm order');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('open-auth'));
        }
      } else {
        let errMsg = 'Failed to process order';
        try {
          const err = await res.json();
          errMsg = err.error || err.message || errMsg;
        } catch { /* ignore */ }
        toast.error(errMsg);
      }
    } catch {
      toast.error('Network error while placing order. Please check your connection and try again.');
    } finally {
      setPlacing(false);
    }
  };

  const SECTIONS_CONFIG = [
    { id: 1 as const, number: '1', title: 'Order Summary', subtitle: 'Review & Voucher', icon: Tag },
    { id: 2 as const, number: '2', title: 'Customer Info', subtitle: 'Contact Details', icon: User },
    { id: 3 as const, number: '3', title: 'Shipping Address', subtitle: 'White-Glove Delivery', icon: MapPin },
    { id: 4 as const, number: '4', title: 'Payment Methods', subtitle: 'Pakistan Suite', icon: CreditCard },
  ];

  if (!mounted) {
    return (
      <div className="w-full min-h-screen bg-[#FAF6F0] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#B88E4B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (activeItems.length === 0) {
    return (
      <div className="w-full min-h-screen bg-[#FAF6F0] text-[#1F1612] font-sans pt-28 sm:pt-32 pb-28 sm:pb-32 lg:pb-16 px-4 sm:px-6 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-lg bg-gradient-to-b from-white via-[#FCFAF7] to-[#FAF5EE] border-[1.5px] border-[#D4AF37]/50 p-8 sm:p-12 rounded-3xl shadow-[0_20px_50px_rgba(44,30,24,0.08),0_0_25px_rgba(212,175,55,0.12)]"
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#FFEAA0] via-[#C9A96E] to-[#6E4B1F] p-[2px] mx-auto mb-6 shadow-[0_0_25px_rgba(212,175,55,0.35)]">
            <div className="w-full h-full rounded-3xl bg-[#1A0E07] flex items-center justify-center text-[#FFEAA0]">
              <ShoppingBag size={34} strokeWidth={1.8} />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FAF5EE] border border-[#D4AF37]/50 shadow-xs mb-3.5">
            <Sparkles size={14} className="text-[#B88E4B]" />
            <span className="text-xs font-black uppercase tracking-[0.25em] text-[#8C6239]">
              SHOPPING CART (0 PIECES)
            </span>
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl font-black text-[#221814] mb-3">
            Your Cart is Empty
          </h2>
          <p className="text-xs sm:text-sm text-[#5C483E] leading-relaxed mb-8 max-w-sm mx-auto font-medium">
            Discover our timeless solid wood masterpieces and add your preferred selections to proceed with white-glove checkout.
          </p>

          <Link
            href="/#signature-categories"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[#2A170D] via-[#1A0E07] to-[#0D0603] text-[#FFEAA0] font-serif font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl hover:brightness-110 transition-all shadow-md active:scale-95"
          >
            <Sparkles size={15} />
            <span>Explore Collection</span>
            <ArrowRight size={15} />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#FAF6F0] text-[#1F1612] font-sans pt-21 sm:pt-22 lg:pt-23 pb-28 sm:pb-32 lg:pb-8 px-3 sm:px-5 lg:px-6 flex flex-col justify-start">
      <div className="w-full flex-1 flex flex-col gap-2 sm:gap-2.5">

        {/* ── 1. $100,000 LUXURY HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2.5 bg-gradient-to-r from-white via-[#FCFAF7] to-white border border-[#E7DDD0] p-3 sm:py-2.5 sm:px-5 lg:py-3 lg:px-6 rounded-2xl lg:rounded-[20px] shadow-[0_4px_20px_rgba(44,30,24,0.02)] shrink-0 relative overflow-hidden group hover:border-[#B88E4B]/40 transition-all"
        >
          <div className="relative z-10 w-full lg:w-auto">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
              <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-[#FAF0E2] to-[#F5E5CF] text-[#8C6239] border border-[#B88E4B]/35 flex items-center gap-1 shadow-2xs">
                <Sparkles size={9} className="text-[#B88E4B] animate-spin duration-3000" />
                <span className="lg:hidden">V2.4</span>
                <span className="hidden lg:inline">CHECKOUT SUITE V2.4</span>
              </span>

              <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[8.5px] sm:text-[9px] font-black font-mono uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-500/35 flex items-center gap-1.5 shadow-2xs">
                <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500 animate-pulse" />
                </span>
                <span className="lg:hidden">{activeItems.length} ITEMS</span>
                <span className="hidden lg:inline">{activeItems.length} ACTIVE PRODUCTS IN ORDER</span>
              </span>
            </div>

            <h1 className="text-[21px] sm:text-2xl lg:text-3xl xl:text-4xl font-black text-[#221814] tracking-tight leading-snug lg:leading-tight font-serif">
              Fahad Ali Interior <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] bg-clip-text text-transparent font-serif">& 4-Section Checkout</span>
            </h1>
            <p className="hidden sm:block text-stone-500 text-[11px] sm:text-xs font-medium mt-0.5">
              White-glove room placement across Pakistan, real-time SBP verified payment suite, and instant vouchers.
            </p>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full lg:w-auto shrink-0 relative z-10 pt-1 sm:pt-0 border-t sm:border-t-0 border-[#E7DDD0]/60">
            <Link
              href="/#signature-categories"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 sm:py-2.5 rounded-xl text-xs font-bold text-stone-600 hover:text-[#1F1612] bg-[#FAF7F2] hover:bg-[#F2ECE0] border border-[#DDD3C5] transition-all shadow-2xs cursor-pointer"
            >
              <ShoppingBag size={14} className="text-[#8C6239]" />
              <span>Back to Shop</span>
            </Link>

            <div className="w-full sm:w-auto bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] hover:brightness-110 text-white font-serif font-bold text-xs sm:text-sm px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 select-none">
              <span className="text-[10.5px] font-sans font-bold text-amber-100 uppercase tracking-wider">Payable:</span>
              <span className="font-sans font-black text-xs sm:text-sm tracking-tight">Rs. {grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </motion.div>

        {/* ── 2. 4-SECTION PROGRESS STEPPER TABS ───────────────────────────── */}
        <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white border border-[#E7DDD0] p-1.5 rounded-2xl shadow-2xs shrink-0">
          {SECTIONS_CONFIG.map((sec) => {
            const isActive = currentSection === sec.id;
            const isCompleted = currentSection > sec.id;

            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => {
                  if (sec.id > currentSection) {
                    if (currentSection === 1 && activeItems.length === 0) {
                      toast.error('Your cart is empty');
                      return;
                    }
                    if (currentSection <= 2 && (!form.name.trim() || !form.phone.trim() || !form.email.trim() || !form.email.includes('@'))) {
                      toast.error('Please enter Full Name, valid Email, and Phone Number first');
                      setCurrentSection(2);
                      return;
                    }
                    if (currentSection <= 3 && sec.id === 4 && (!form.address.trim() || !form.city.trim())) {
                      toast.error('Please enter complete Street Address and City first');
                      setCurrentSection(3);
                      return;
                    }
                  }
                  setCurrentSection(sec.id);
                }}
                className={`relative flex items-center gap-2.5 p-2 sm:p-2.5 rounded-xl transition-all cursor-pointer text-left border ${
                  isActive
                    ? 'bg-gradient-to-r from-[#FAF5EE] to-white border-amber-400 shadow-xs text-[#221814]'
                    : isCompleted
                    ? 'bg-[#F9F9F8] border-emerald-300 text-stone-800 hover:bg-[#FAF8F5]'
                    : 'bg-transparent border-transparent text-stone-400 hover:text-stone-800'
                }`}
              >
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 transition-colors ${
                    isActive
                      ? 'bg-[#B88E4B] text-white shadow-2xs'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  {isCompleted ? <Check size={15} strokeWidth={3.5} /> : sec.number}
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-black uppercase tracking-wider leading-tight truncate ${isActive ? 'text-[#221814]' : 'text-stone-700'}`}>
                    {sec.title}
                  </p>
                  <p className={`text-[10px] truncate font-medium ${isActive ? 'text-[#8C6239] font-bold' : 'text-stone-400'}`}>
                    {sec.subtitle}
                  </p>
                </div>

                {isActive && (
                  <span className="absolute top-1.5 right-2 px-1.5 py-0.2 rounded-full text-[7.5px] font-black uppercase tracking-widest bg-[#B88E4B] text-white shadow-2xs hidden sm:inline-block">
                    ACTIVE
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── 3. ACTIVE SECTION CARD ─────────── */}
        <AnimatePresence mode="wait">
          {currentSection === 1 && (
            <CheckoutSectionSummary
              activeItems={activeItems}
              handleItemQuantity={handleItemQuantity}
              removeItem={removeItem}
              itemsSubtotal={itemsSubtotal}
              shippingFee={shippingFee}
              taxAmount={taxAmount}
              discountAmount={discountAmount}
              grandTotal={grandTotal}
              appliedCoupon={appliedCoupon}
              couponCode={couponCode}
              setCouponCode={setCouponCode}
              applyCoupon={applyCoupon}
              removeCoupon={removeCoupon}
              couponLoading={couponLoading}
              goToNextSection={goToNextSection}
            />
          )}

          {currentSection === 2 && (
            <CheckoutSectionCustomer
              form={form}
              handleInputChange={handleInputChange}
              detectedTelecom={detectedTelecom}
              isPhoneValid={isPhoneValid}
              activeItems={activeItems}
              grandTotal={grandTotal}
              setCurrentSection={setCurrentSection}
              goToNextSection={goToNextSection}
            />
          )}

          {currentSection === 3 && (
            <CheckoutSectionShipping
              form={form}
              handleInputChange={handleInputChange}
              grandTotal={grandTotal}
              setCurrentSection={setCurrentSection}
              goToNextSection={goToNextSection}
              savedAddresses={savedAddresses}
              onSelectSavedAddress={handleSelectSavedAddress}
            />
          )}

          {currentSection === 4 && (
            <CheckoutSectionPayment
              form={form}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              selectedBank={selectedBank}
              setSelectedBank={setSelectedBank}
              cardType={cardType}
              setCardType={setCardType}
              cardDetails={cardDetails}
              setCardDetails={setCardDetails}
              cardholderName={form.name}
              handleCardNumberChange={handleCardNumberChange}
              handleExpiryChange={handleExpiryChange}
              dropdownRef={dropdownRef}
              isBankDropdownOpen={isBankDropdownOpen}
              setIsBankDropdownOpen={setIsBankDropdownOpen}
              bankSearchQuery={bankSearchQuery}
              setBankSearchQuery={setBankSearchQuery}
              cardRef={cardRef}
              isCardFlipped={isCardFlipped}
              setIsCardFlipped={setIsCardFlipped}
              tiltStyle={tiltStyle}
              handleCardMouseMove={handleCardMouseMove}
              handleCardMouseLeave={handleCardMouseLeave}
              digitalPaymentDetails={digitalPaymentDetails}
              setDigitalPaymentDetails={setDigitalPaymentDetails}
              copyToClipboard={copyToClipboard}
              copiedField={copiedField}
              handleFileUpload={handleFileUpload}
              paymentScreenshot={digitalPaymentDetails.screenshotUrl}
              fileInputRef={fileInputRef}
              placing={placing}
              handlePlaceOrder={handlePlaceOrder}
              setCurrentSection={setCurrentSection}
              grandTotal={grandTotal}
              formNotes={form.notes}
              handleInputChange={handleInputChange}
            />
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
