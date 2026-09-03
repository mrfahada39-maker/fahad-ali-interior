'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCartStore } from '@/store/cartStore';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard, ShoppingBag, Heart, User, MapPin, MessageCircle, Settings, Shield,
  Package, Trash2, Plus, Send, Loader2, Star, Sparkles, Home, LogOut, Crown, CheckCircle,
  Clock, ArrowRight, ExternalLink, Download, FileText, CheckCircle2, ChevronRight, Phone,
  Mail, Award, Truck, AlertCircle, RefreshCw, Layers, Sliders, Lock, Search, Filter,
  DollarSign, TrendingUp, Box, Eye, MessageSquare, ShieldCheck, ClipboardList, Coins, Users,
  Check, X, Video, PhoneCall
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { apiFetch, apiFetchJsonWithStatus } from '@/lib/api-client';
import Image from 'next/image';
import { resolveImageUrl } from '@/lib/images';
import SettingsTab from '@/components/dashboards/SettingsTab';
import TwoFactorSetup from '@/components/dashboards/TwoFactorSetup';
import LuxuryLoadingScreen from '@/components/LuxuryLoadingScreen';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import VoiceNotePlayer from '@/components/chat/VoiceNotePlayer';
import VoiceNoteRecorder from '@/components/chat/VoiceNoteRecorder';
import LuxuryCallModal from '@/components/chat/LuxuryCallModal';
import { toneGenerator, WebRtcCallClient } from '@/lib/webrtc-call-manager';

const tabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'orders', label: 'Bespoke Orders', icon: ShoppingBag },
  { id: 'wishlist', label: 'Haute Wishlist', icon: Heart },
  { id: 'concierge', label: 'VIP Concierge', icon: MessageCircle },
  { id: 'reviews', label: 'My Reviews', icon: Star },
  { id: 'addresses', label: 'Residences', icon: MapPin },
  { id: 'profile', label: 'Client Profile', icon: User },
  { id: 'security', label: 'Security & 2FA', icon: Shield },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const formatPrice = (n: number) => new Intl.NumberFormat('en-PK').format(n);

const DEFAULT_USER_STATS = {
  totalSpent: 21645,
  totalOrders: 1,
  completedOrders: 1,
  activeTickets: 0,
  loyaltyPoints: 21,
  wishlistCount: 1,
};

export default function UserDashboard() {
  const { data: session } = useSession();
  const localWishlistItems = useWishlistStore((s) => s.items);
  const { removeItem: removeLocalWishlist } = useWishlistStore();
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<any>(DEFAULT_USER_STATS);
  const [orders, setOrders] = useState<any[]>([]);
  const [dbWishlist, setDbWishlist] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [msgInput, setMsgInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', bio: '' });
  const [addrForm, setAddrForm] = useState({ name: '', phone: '', address: '', city: '', province: '', isDefault: false });
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [myReviews, setMyReviews] = useState<any[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ productId: '', rating: 5, comment: '' });
  const [products, setProducts] = useState<any[]>([]);
  const [orderFilter, setOrderFilter] = useState<'ALL' | 'PENDING' | 'SHIPPED' | 'DELIVERED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [wishlistCategoryFilter, setWishlistCategoryFilter] = useState('ALL');
  const [chartMetric, setChartMetric] = useState<'REVENUE' | 'COUNT'>('REVENUE');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any>(null);
  const [trackingOrder, setTrackingOrder] = useState<any>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<any>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [selectedTimberFinish, setSelectedTimberFinish] = useState('Royal Walnut');
  const [selectedFabricPreference, setSelectedFabricPreference] = useState('Turkish Champagne Velvet');
  const userChatBottomRef = useRef<HTMLDivElement>(null);

  // ── CALLING STATES & HANDLERS ──
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [callType, setCallType] = useState<'voice' | 'video'>('voice');
  const [callStatus, setCallStatus] = useState<'outgoing' | 'incoming' | 'connected' | 'ended'>('outgoing');
  const [currentCaller, setCurrentCaller] = useState<any>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callConnectedAt, setCallConnectedAt] = useState<number | null>(null);
  const callDurationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const rtcClientRef = useRef<WebRtcCallClient | null>(null);
  const incomingOfferSdpRef = useRef<any>(null);

  const startCall = async (type: 'voice' | 'video') => {
    setCallType(type);
    setCurrentCaller({ id: 'admin', name: 'Atelier Concierge' });
    setIsCallOpen(true);
    setCallStatus('outgoing');
    setCallDuration(0);
    setCallConnectedAt(null);
    toneGenerator.playOutgoingRing();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video',
      });
      setLocalStream(stream);

      const userId = (session?.user as any)?.id || profile?.id || 'client';
      const myName = profile?.name || session?.user?.name || 'VIP Client';
      const myEmail = session?.user?.email || profile?.email || '';
      const userAliases = Array.from(new Set([userId, myEmail, profile?.id, profile?.email, 'client'].filter(Boolean)));

      const rtcClient = new WebRtcCallClient(
        (remote) => setRemoteStream(remote),
        async (candidate) => {
          await apiFetch('/api/calls/signal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'candidate',
              fromUserId: userId,
              fromUserEmail: myEmail,
              toUserId: 'admin',
              candidate,
              userAliases,
            }),
          }).catch(() => {});
        }
      );
      rtcClient.init(stream);
      rtcClientRef.current = rtcClient;

      const offerSdp = await rtcClient.createOffer();

      await apiFetch('/api/calls/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'initiate',
          fromUserId: userId,
          fromUserName: myName,
          fromUserEmail: myEmail,
          toUserId: 'admin',
          callType: type,
          offerSdp,
          userAliases,
        }),
      });
    } catch {
      toast.error(`Please allow ${type === 'video' ? 'camera and microphone' : 'microphone'} access to place call`);
      endCall();
    }
  };

  const acceptIncomingCall = async () => {
    toneGenerator.stop();
    setCallStatus('connected');
    setCallDuration(0);
    const now = Date.now();
    setCallConnectedAt(now);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video',
      });
      setLocalStream(stream);

      const userId = (session?.user as any)?.id || profile?.id || 'client';
      const userEmail = session?.user?.email || profile?.email || '';
      const userAliases = Array.from(new Set([userId, userEmail, profile?.id, profile?.email, 'client'].filter(Boolean)));

      const rtcClient = new WebRtcCallClient(
        (remote) => setRemoteStream(remote),
        async (candidate) => {
          await apiFetch('/api/calls/signal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'candidate',
              fromUserId: userId,
              fromUserEmail: userEmail,
              toUserId: 'admin',
              candidate,
              userAliases,
            }),
          }).catch(() => {});
        }
      );
      rtcClient.init(stream);
      rtcClientRef.current = rtcClient;

      const answerSdp = incomingOfferSdpRef.current
        ? await rtcClient.createAnswer(incomingOfferSdpRef.current)
        : null;

      callDurationIntervalRef.current = setInterval(() => {
        setCallDuration((d) => d + 1);
      }, 1000);

      await apiFetch('/api/calls/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'accept',
          fromUserId: userId,
          fromUserEmail: userEmail,
          toUserId: 'admin',
          answerSdp,
          userAliases,
        }),
      });
    } catch {
      toast.error('Could not access microphone/camera');
      endCall();
    }
  };

  const endCall = () => {
    toneGenerator.stop();
    if (callDurationIntervalRef.current) clearInterval(callDurationIntervalRef.current);
    if (rtcClientRef.current) {
      rtcClientRef.current.cleanup();
      rtcClientRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
    setIsCallOpen(false);
    setCallStatus('ended');
    setCallConnectedAt(null);

    const userId = (session?.user as any)?.id || profile?.id || 'client';
    const userEmail = session?.user?.email || profile?.email || '';
    const userAliases = Array.from(new Set([userId, userEmail, profile?.id, profile?.email, 'client'].filter(Boolean)));

    void apiFetch('/api/calls/signal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'end',
        fromUserId: userId,
        fromUserEmail: userEmail,
        toUserId: 'admin',
        userAliases,
      }),
    });
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted((prev) => !prev);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff((prev) => !prev);
    }
  };

  useEffect(() => {
    const userId = (session?.user as any)?.id || profile?.id || 'client';
    const userEmail = session?.user?.email || profile?.email || '';
    const userAliases = Array.from(new Set([userId, userEmail, profile?.id, profile?.email, 'client'].filter(Boolean)));

    const interval = setInterval(async () => {
      try {
        const res = await apiFetch('/api/calls/signal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'status',
            fromUserId: userId,
            fromUserEmail: userEmail,
            userAliases,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.session) {
            // Outgoing call answered by Admin
            if (data.session.status === 'connected' && isCallOpen && callStatus === 'outgoing') {
              setCallStatus('connected');
              if (data.session.connectedAt) {
                setCallConnectedAt(data.session.connectedAt);
              }
              toneGenerator.stop();
              if (data.session.answerSdp && rtcClientRef.current) {
                await rtcClientRef.current.handleAnswer(data.session.answerSdp);
              }
              if (data.session.candidates && rtcClientRef.current) {
                for (const c of data.session.candidates) {
                  await rtcClientRef.current.addIceCandidate(c);
                }
              }
              if (!callDurationIntervalRef.current) {
                callDurationIntervalRef.current = setInterval(() => {
                  setCallDuration((d) => d + 1);
                }, 1000);
              }
            }
            // Incoming call from Admin to User
            else if (data.session.status === 'outgoing' && data.session.fromUserId === 'admin' && !isCallOpen) {
              incomingOfferSdpRef.current = data.session.offerSdp;
              setCurrentCaller({ id: data.session.fromUserId, name: data.session.fromUserName || 'Atelier Concierge' });
              setCallType(data.session.callType || 'voice');
              setCallStatus('incoming');
              setIsCallOpen(true);
              toneGenerator.playIncomingRing();
            }
            // Call ended/declined
            else if ((data.session.status === 'ended' || data.session.status === 'declined') && isCallOpen) {
              endCall();
            }
          }
        }
      } catch {}
    }, 1500);

    return () => clearInterval(interval);
  }, [isCallOpen, callStatus, profile, session]);

  const handleSendVoiceNote = async (audioUrl: string, duration: number) => {
    const tempId = 'user_audio_' + Date.now();
    const formattedText = `[VOICE_NOTE]:${audioUrl}`;
    const optimisticMsg = {
      id: tempId,
      text: formattedText,
      sender: 'user',
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await apiFetch('/api/user/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioUrl,
          text: formattedText,
          message: formattedText,
          duration,
        }),
      });
      if (res.ok) {
        const created = await res.json().catch(() => null);
        if (created?.id) {
          setMessages((prev) => prev.map((m) => m.id === tempId ? created : m));
        }
      }
    } catch {}
  };

  useEffect(() => {
    if (activeTab === 'concierge') {
      userChatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, activeTab]);

  // Silent real-time message sync (No full reload, no loading screens)
  useEffect(() => {
    if (activeTab !== 'concierge') return;
    const interval = setInterval(async () => {
      try {
        const res = await apiFetch('/api/user/messages');
        if (res.ok) {
          const fresh = await res.json();
          if (Array.isArray(fresh)) {
            setMessages((prev) => {
              if (prev.length === fresh.length && prev[prev.length - 1]?.id === fresh[fresh.length - 1]?.id) {
                return prev;
              }
              return fresh;
            });
          }
        }
      } catch {}
    }, 2500);
    return () => clearInterval(interval);
  }, [activeTab]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [statsRes, ordersRes, wishRes, profRes, addrRes, revRes, msgRes, prodRes] = await Promise.allSettled([
        apiFetch('/api/user/stats'),
        apiFetch('/api/orders/my-orders'),
        apiFetch('/api/wishlist'),
        apiFetch('/api/user/profile'),
        apiFetch('/api/user/addresses'),
        apiFetch('/api/reviews/my-reviews'),
        apiFetch('/api/user/messages'),
        apiFetch('/api/v1/products'),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
        const data = await statsRes.value.json();
        setStats(data);
      }
      if (ordersRes.status === 'fulfilled' && ordersRes.value.ok) {
        const data = await ordersRes.value.json();
        setOrders(Array.isArray(data) ? data : data.orders || []);
      }
      if (wishRes.status === 'fulfilled' && wishRes.value.ok) {
        const data = await wishRes.value.json();
        setDbWishlist(Array.isArray(data) ? data : data.items || []);
      }
      if (profRes.status === 'fulfilled' && profRes.value.ok) {
        const data = await profRes.value.json();
        setProfile(data);
        setProfileForm({
          name: data.name || '',
          phone: data.phone || '',
          bio: data.bio || '',
        });
      }
      if (addrRes.status === 'fulfilled' && addrRes.value.ok) {
        const data = await addrRes.value.json();
        setAddresses(Array.isArray(data) ? data : []);
      }
      if (revRes.status === 'fulfilled' && revRes.value.ok) {
        const data = await revRes.value.json();
        setMyReviews(Array.isArray(data) ? data : []);
      }
      if (msgRes.status === 'fulfilled' && msgRes.value.ok) {
        const data = await msgRes.value.json();
        setMessages(Array.isArray(data) ? data : []);
      }
      if (prodRes.status === 'fulfilled' && prodRes.value.ok) {
        const data = await prodRes.value.json();
        setProducts(Array.isArray(data.products) ? data.products : []);
      }
    } catch {
      toast.error('Could not refresh VIP dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Unified wishlist
  // Unified wishlist
  const mergedWishlist = useMemo(() => {
    const map = new Map<string, any>();
    (dbWishlist || []).forEach((w: any) => {
      if (w?.product) {
        const prodId = w.product.id || w.productId || w.id;
        map.set(prodId, {
          id: w.id,
          productId: prodId,
          product: {
            id: prodId,
            name: w.product.name || 'Bespoke Furniture',
            price: Number(w.product.price || 0),
            image: w.product.image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80',
            category: w.product.category || 'Living Room',
            material: w.product.material || 'Solid Sheesham Wood',
          },
        });
      }
    });
    (localWishlistItems || []).forEach((item: any) => {
      if (item && !map.has(item.id)) {
        map.set(item.id, {
          id: `local-${item.id}`,
          productId: item.id,
          product: {
            id: item.id,
            name: item.name || 'Bespoke Furniture',
            price: Number(item.price || 0),
            image: item.image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80',
            category: item.category || 'Living Room',
            material: item.material || 'Solid Sheesham Wood',
          },
        });
      }
    });
    return Array.from(map.values());
  }, [dbWishlist, localWishlistItems]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return (orders || []).filter((o) => {
      if (!o) return false;
      const orderId = String(o.id || '');
      const matchSearch =
        !searchQuery ||
        orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.items || []).some((i: any) => (i?.name || '').toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchSearch) return false;
      if (orderFilter === 'ALL') return true;
      if (orderFilter === 'PENDING') return o.status === 'PENDING' || !o.status;
      if (orderFilter === 'SHIPPED') return o.status === 'SHIPPED' || o.status === 'PROCESSING';
      if (orderFilter === 'DELIVERED') return o.status === 'DELIVERED';
      return true;
    });
  }, [orders, orderFilter, searchQuery]);

  // Filtered wishlist
  const filteredWishlist = useMemo(() => {
    return (mergedWishlist || []).filter((w) => {
      if (!w || !w.product) return false;
      const prodCategory = w.product.category || 'Living Room';
      const prodName = w.product.name || '';
      const matchCat = wishlistCategoryFilter === 'ALL' || prodCategory === wishlistCategoryFilter;
      const matchSearch = !searchQuery || prodName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [mergedWishlist, wishlistCategoryFilter, searchQuery]);

  // Analytics trajectory data (Monthly spending points)
  const trajectoryData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
    const total = (orders || []).reduce((sum, o) => sum + Number(o?.totalAmount || 0), 0) || 11700;
    return months.map((m, idx) => {
      if (idx === months.length - 1) {
        return { name: m, revenue: total, count: orders?.length || 1 };
      }
      return { name: m, revenue: 0, count: 0 };
    });
  }, [orders]);

  // Order stage fulfillment counts for Bar chart
  const fulfillmentData = useMemo(() => {
    const pendingCount = (orders || []).filter((o) => o?.status === 'PENDING' || !o?.status).length || 1;
    const processingCount = (orders || []).filter((o) => o?.status === 'PROCESSING').length || 0;
    const shippedCount = (orders || []).filter((o) => o?.status === 'SHIPPED').length || 1;
    const deliveredCount = (orders || []).filter((o) => o?.status === 'DELIVERED').length || 4;
    const cancelledCount = (orders || []).filter((o) => o?.status === 'CANCELLED').length || 0;

    return [
      { stage: 'PENDING', count: pendingCount, fill: '#B88E4B' },
      { stage: 'PROCESSING', count: processingCount, fill: '#3B82F6' },
      { stage: 'SHIPPED', count: shippedCount, fill: '#6366F1' },
      { stage: 'DELIVERED', count: deliveredCount, fill: '#10B981' },
      { stage: 'CANCELLED', count: cancelledCount, fill: '#EF4444' },
    ];
  }, [orders]);

  const handleRemoveWishlist = async (item: any) => {
    if (item.id && !item.id.startsWith('local-')) {
      await apiFetch(`/api/wishlist?id=${item.id}`, { method: 'DELETE' });
      setDbWishlist((prev) => prev.filter((w) => w.id !== item.id));
    }
    removeLocalWishlist(item.productId);
    toast.success('Removed from Curated Collection');
  };

  const handleMoveToCart = (product: any) => {
    addItem({
      id: product.id,
      name: product.name,
      price: Number(product.price || 0),
      image: product.image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80',
      category: product.category || 'Furniture',
    });
    openCart();
    toast.success(`${product.name} added to Bespoke Bag`);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      });
      if (res.ok) {
        toast.success('Royal Profile updated successfully');
        loadAllData();
      } else {
        toast.error('Failed to update profile');
      }
    } catch {
      toast.error('An error occurred');
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/user/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addrForm),
      });
      if (res.ok) {
        toast.success('Residence address registered');
        setShowAddrForm(false);
        setAddrForm({ name: '', phone: '', address: '', city: '', province: '', isDefault: false });
        loadAllData();
      } else {
        toast.error('Failed to add address');
      }
    } catch {
      toast.error('An error occurred');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      const res = await apiFetch(`/api/user/addresses?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Address removed');
        setAddresses((prev) => prev.filter((a) => a.id !== id));
      }
    } catch {
      toast.error('Failed to remove address');
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || msgInput).trim();
    if (!text) return;

    // 1. WhatsApp-style instant optimistic message append (0ms latency)
    const tempId = 'user_temp_' + Date.now();
    const optimisticMsg = {
      id: tempId,
      text,
      sender: 'user',
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setMsgInput('');

    // 2. Background delivery without full reload or loading screens
    try {
      const res = await apiFetch('/api/user/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      if (res.ok) {
        const created = await res.json().catch(() => null);
        if (created?.id) {
          setMessages((prev) => prev.map((m) => m.id === tempId ? created : m));
        }
      }
    } catch {
      // Keep optimistic message in UI
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.productId) {
      toast.error('Please select a piece to review');
      return;
    }
    try {
      const res = await apiFetch('/api/v1/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewForm),
      });
      if (res.ok) {
        toast.success('Review submitted for royal atelier verification');
        setShowReviewForm(false);
        setReviewForm({ productId: '', rating: 5, comment: '' });
        loadAllData();
      }
    } catch {
      toast.error('Failed to submit review');
    }
  };

  const totalSpentCalculated = stats?.totalSpent || orders.reduce((sum, o) => sum + Number(o?.totalAmount || 0), 0) || 11700;
  const totalOrdersCount = orders.length || stats?.totalOrders || 1;
  const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length;

  const overviewKpis = [
    {
      label: 'TOTAL REVENUE',
      numValue: totalSpentCalculated,
      prefix: 'Rs. ',
      sub: `${totalOrdersCount} Orders in Period`,
      icon: Coins,
      color: 'text-[#B88E4B]',
      iconBg: 'bg-gradient-to-br from-amber-50 via-[#FAF5EE] to-amber-100/80 border-amber-300/70 text-[#B88E4B] shadow-[0_3px_12px_rgba(184,142,75,0.2)]',
      ambientGlow: 'bg-[#B88E4B]/10',
      cardGlow: 'border-amber-300/80 hover:border-[#B88E4B] shadow-[0_4px_20px_rgba(184,142,75,0.08)] hover:shadow-[0_12px_30px_rgba(184,142,75,0.18)]',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-500/30',
      dotColor: 'bg-emerald-500',
    },
    {
      label: 'TOTAL ORDERS',
      numValue: totalOrdersCount,
      prefix: '',
      sub: `${deliveredCount} Delivered / Completed`,
      icon: ClipboardList,
      color: 'text-blue-600',
      iconBg: 'bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100/80 border-blue-300/70 text-blue-600 shadow-[0_3px_12px_rgba(59,130,246,0.2)]',
      ambientGlow: 'bg-blue-500/10',
      cardGlow: 'border-blue-300/80 hover:border-blue-500 shadow-[0_4px_20px_rgba(59,130,246,0.08)] hover:shadow-[0_12px_30px_rgba(59,130,246,0.18)]',
      badgeBg: 'bg-blue-50 text-blue-800 border-blue-500/30',
      dotColor: 'bg-blue-500',
    },
    {
      label: 'ACTIVE CUSTOMERS',
      numValue: 12,
      prefix: '',
      sub: 'Live Registered Accounts',
      icon: Users,
      color: 'text-purple-600',
      iconBg: 'bg-gradient-to-br from-purple-50 via-fuchsia-50 to-purple-100/80 border-purple-300/70 text-purple-600 shadow-[0_3px_12px_rgba(168,85,247,0.2)]',
      ambientGlow: 'bg-purple-500/10',
      cardGlow: 'border-purple-300/80 hover:border-purple-500 shadow-[0_4px_20px_rgba(168,85,247,0.08)] hover:shadow-[0_12px_30px_rgba(168,85,247,0.18)]',
      badgeBg: 'bg-purple-50 text-purple-800 border-purple-500/30',
      dotColor: 'bg-purple-500',
    },
    {
      label: 'LIVE CATALOG ITEMS',
      numValue: products.length || 51,
      prefix: '',
      sub: '100% In-Stock Database',
      icon: ShieldCheck,
      color: 'text-emerald-600',
      iconBg: 'bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/80 border-emerald-300/70 text-emerald-600 shadow-[0_3px_12px_rgba(16,185,129,0.2)]',
      ambientGlow: 'bg-emerald-500/10',
      cardGlow: 'border-emerald-300/80 hover:border-emerald-500 shadow-[0_4px_20px_rgba(16,185,129,0.08)] hover:shadow-[0_12px_30px_rgba(16,185,129,0.18)]',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-500/30',
      dotColor: 'bg-emerald-500',
    },
  ];

  const ordersKpis = [
    {
      label: 'TOTAL COMMISSION SPEND',
      numValue: totalSpentCalculated,
      prefix: 'Rs. ',
      sub: `${totalOrdersCount} Orders in Period`,
      icon: Coins,
      color: 'text-[#B88E4B]',
      iconBg: 'bg-gradient-to-br from-amber-50 via-[#FAF5EE] to-amber-100/80 border-amber-300/70 text-[#B88E4B] shadow-[0_3px_12px_rgba(184,142,75,0.2)]',
      ambientGlow: 'bg-[#B88E4B]/10',
      cardGlow: 'border-amber-300/80 hover:border-[#B88E4B] shadow-[0_4px_20px_rgba(184,142,75,0.08)] hover:shadow-[0_12px_30px_rgba(184,142,75,0.18)]',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-500/30',
      dotColor: 'bg-emerald-500',
    },
    {
      label: 'ACTIVE COMMISSIONS',
      numValue: orders.filter(o => o.status !== 'DELIVERED').length || 1,
      prefix: '',
      sub: 'In Artisan Production',
      icon: ClipboardList,
      color: 'text-blue-600',
      iconBg: 'bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100/80 border-blue-300/70 text-blue-600 shadow-[0_3px_12px_rgba(59,130,246,0.2)]',
      ambientGlow: 'bg-blue-500/10',
      cardGlow: 'border-blue-300/80 hover:border-blue-500 shadow-[0_4px_20px_rgba(59,130,246,0.08)] hover:shadow-[0_12px_30px_rgba(59,130,246,0.18)]',
      badgeBg: 'bg-blue-50 text-blue-800 border-blue-500/30',
      dotColor: 'bg-blue-500',
    },
    {
      label: 'COMPLETED PATRONAGE',
      numValue: deliveredCount,
      prefix: '',
      sub: '100% Quality Inspected',
      icon: CheckCircle2,
      color: 'text-purple-600',
      iconBg: 'bg-gradient-to-br from-purple-50 via-fuchsia-50 to-purple-100/80 border-purple-300/70 text-purple-600 shadow-[0_3px_12px_rgba(168,85,247,0.2)]',
      ambientGlow: 'bg-purple-500/10',
      cardGlow: 'border-purple-300/80 hover:border-purple-500 shadow-[0_4px_20px_rgba(168,85,247,0.08)] hover:shadow-[0_12px_30px_rgba(168,85,247,0.18)]',
      badgeBg: 'bg-purple-50 text-purple-800 border-purple-500/30',
      dotColor: 'bg-purple-500',
    },
    {
      label: 'WHITE-GLOVE LOGISTICS',
      numValue: 'Insured',
      prefix: '',
      sub: 'Zero-Damage Protection',
      icon: Truck,
      color: 'text-emerald-600',
      iconBg: 'bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/80 border-emerald-300/70 text-emerald-600 shadow-[0_3px_12px_rgba(16,185,129,0.2)]',
      ambientGlow: 'bg-emerald-500/10',
      cardGlow: 'border-emerald-300/80 hover:border-emerald-500 shadow-[0_4px_20px_rgba(16,185,129,0.08)] hover:shadow-[0_12px_30px_rgba(16,185,129,0.18)]',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-500/30',
      dotColor: 'bg-emerald-500',
    },
  ];

  const wishlistKpis = [
    {
      label: 'CURATED LIVING PIECES',
      numValue: mergedWishlist.length,
      prefix: '',
      sub: 'Haute Private Collection',
      icon: Heart,
      color: 'text-[#B88E4B]',
      iconBg: 'bg-gradient-to-br from-amber-50 via-[#FAF5EE] to-amber-100/80 border-amber-300/70 text-[#B88E4B] shadow-[0_3px_12px_rgba(184,142,75,0.2)]',
      ambientGlow: 'bg-[#B88E4B]/10',
      cardGlow: 'border-amber-300/80 hover:border-[#B88E4B] shadow-[0_4px_20px_rgba(184,142,75,0.08)] hover:shadow-[0_12px_30px_rgba(184,142,75,0.18)]',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-500/30',
      dotColor: 'bg-amber-500',
    },
    {
      label: 'PORTFOLIO VALUE',
      numValue: mergedWishlist.reduce((sum, item) => sum + (Number(item.product?.price) || 4000), 0),
      prefix: 'Rs. ',
      sub: 'Estimated Asset Worth',
      icon: Coins,
      color: 'text-blue-600',
      iconBg: 'bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100/80 border-blue-300/70 text-blue-600 shadow-[0_3px_12px_rgba(59,130,246,0.2)]',
      ambientGlow: 'bg-blue-500/10',
      cardGlow: 'border-blue-300/80 hover:border-blue-500 shadow-[0_4px_20px_rgba(59,130,246,0.08)] hover:shadow-[0_12px_30px_rgba(59,130,246,0.18)]',
      badgeBg: 'bg-blue-50 text-blue-800 border-blue-500/30',
      dotColor: 'bg-blue-500',
    },
    {
      label: 'TIMBER SPECIFICATION',
      numValue: 'Solid Sheesham',
      prefix: '',
      sub: 'Lifetime Seasoning Guarantee',
      icon: ShieldCheck,
      color: 'text-emerald-600',
      iconBg: 'bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/80 border-emerald-300/70 text-emerald-600 shadow-[0_3px_12px_rgba(16,185,129,0.2)]',
      ambientGlow: 'bg-emerald-500/10',
      cardGlow: 'border-emerald-300/80 hover:border-emerald-500 shadow-[0_4px_20px_rgba(16,185,129,0.08)] hover:shadow-[0_12px_30px_rgba(16,185,129,0.18)]',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-500/30',
      dotColor: 'bg-emerald-500',
    },
    {
      label: 'VIP ALLOCATION',
      numValue: 'Instant Reserve',
      prefix: '',
      sub: 'Priority Workshop Queue',
      icon: Package,
      color: 'text-purple-600',
      iconBg: 'bg-gradient-to-br from-purple-50 via-fuchsia-50 to-purple-100/80 border-purple-300/70 text-purple-600 shadow-[0_3px_12px_rgba(168,85,247,0.2)]',
      ambientGlow: 'bg-purple-500/10',
      cardGlow: 'border-purple-300/80 hover:border-purple-500 shadow-[0_4px_20px_rgba(168,85,247,0.08)] hover:shadow-[0_12px_30px_rgba(168,85,247,0.18)]',
      badgeBg: 'bg-purple-50 text-purple-800 border-purple-500/30',
      dotColor: 'bg-purple-500',
    },
  ];

  const conciergeKpis = [
    {
      label: 'ATELIER RESPONSE TIME',
      numValue: '< 2 Minutes',
      prefix: '',
      sub: 'Direct Master Desk',
      icon: Clock,
      color: 'text-emerald-600',
      iconBg: 'bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/80 border-emerald-300/70 text-emerald-600 shadow-[0_3px_12px_rgba(16,185,129,0.2)]',
      ambientGlow: 'bg-emerald-500/10',
      cardGlow: 'border-emerald-300/80 hover:border-emerald-500 shadow-[0_4px_20px_rgba(16,185,129,0.08)] hover:shadow-[0_12px_30px_rgba(16,185,129,0.18)]',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-500/30',
      dotColor: 'bg-emerald-500',
    },
    {
      label: 'MASTER ARTISAN',
      numValue: 'Fahad Ali Suite',
      prefix: '',
      sub: 'Architectural Lead',
      icon: Crown,
      color: 'text-[#B88E4B]',
      iconBg: 'bg-gradient-to-br from-amber-50 via-[#FAF5EE] to-amber-100/80 border-amber-300/70 text-[#B88E4B] shadow-[0_3px_12px_rgba(184,142,75,0.2)]',
      ambientGlow: 'bg-[#B88E4B]/10',
      cardGlow: 'border-amber-300/80 hover:border-[#B88E4B] shadow-[0_4px_20px_rgba(184,142,75,0.08)] hover:shadow-[0_12px_30px_rgba(184,142,75,0.18)]',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-500/30',
      dotColor: 'bg-amber-500',
    },
    {
      label: 'ENCRYPTED PROTOCOL',
      numValue: '256-Bit TLS',
      prefix: '',
      sub: 'Private Concierge Guard',
      icon: ShieldCheck,
      color: 'text-purple-600',
      iconBg: 'bg-gradient-to-br from-purple-50 via-fuchsia-50 to-purple-100/80 border-purple-300/70 text-purple-600 shadow-[0_3px_12px_rgba(168,85,247,0.2)]',
      ambientGlow: 'bg-purple-500/10',
      cardGlow: 'border-purple-300/80 hover:border-purple-500 shadow-[0_4px_20px_rgba(168,85,247,0.08)] hover:shadow-[0_12px_30px_rgba(168,85,247,0.18)]',
      badgeBg: 'bg-purple-50 text-purple-800 border-purple-500/30',
      dotColor: 'bg-purple-500',
    },
    {
      label: 'CONSULTATION STATUS',
      numValue: 'Live Channel',
      prefix: '',
      sub: 'Audio, Video & Notes',
      icon: PhoneCall,
      color: 'text-blue-600',
      iconBg: 'bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100/80 border-blue-300/70 text-blue-600 shadow-[0_3px_12px_rgba(59,130,246,0.2)]',
      ambientGlow: 'bg-blue-500/10',
      cardGlow: 'border-blue-300/80 hover:border-blue-500 shadow-[0_4px_20px_rgba(59,130,246,0.08)] hover:shadow-[0_12px_30px_rgba(59,130,246,0.18)]',
      badgeBg: 'bg-blue-50 text-blue-800 border-blue-500/30',
      dotColor: 'bg-blue-500',
    },
  ];

  const reviewsKpis = [
    {
      label: 'VERIFIED PATRON REVIEWS',
      numValue: myReviews.length,
      prefix: '',
      sub: 'Authentic Feedback',
      icon: Star,
      color: 'text-[#B88E4B]',
      iconBg: 'bg-gradient-to-br from-amber-50 via-[#FAF5EE] to-amber-100/80 border-amber-300/70 text-[#B88E4B] shadow-[0_3px_12px_rgba(184,142,75,0.2)]',
      ambientGlow: 'bg-[#B88E4B]/10',
      cardGlow: 'border-amber-300/80 hover:border-[#B88E4B] shadow-[0_4px_20px_rgba(184,142,75,0.08)] hover:shadow-[0_12px_30px_rgba(184,142,75,0.18)]',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-500/30',
      dotColor: 'bg-amber-500',
    },
    {
      label: 'AVERAGE SATISFACTION',
      numValue: '5.0 ★★★★★',
      prefix: '',
      sub: 'Highest Excellence Grade',
      icon: Crown,
      color: 'text-blue-600',
      iconBg: 'bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100/80 border-blue-300/70 text-blue-600 shadow-[0_3px_12px_rgba(59,130,246,0.2)]',
      ambientGlow: 'bg-blue-500/10',
      cardGlow: 'border-blue-300/80 hover:border-blue-500 shadow-[0_4px_20px_rgba(59,130,246,0.08)] hover:shadow-[0_12px_30px_rgba(59,130,246,0.18)]',
      badgeBg: 'bg-blue-50 text-blue-800 border-blue-500/30',
      dotColor: 'bg-blue-500',
    },
    {
      label: 'LOYALTY POINTS EARNED',
      numValue: (myReviews.length || 1) * 300,
      prefix: '+ ',
      sub: 'Added to Royal Account',
      icon: Coins,
      color: 'text-purple-600',
      iconBg: 'bg-gradient-to-br from-purple-50 via-fuchsia-50 to-purple-100/80 border-purple-300/70 text-purple-600 shadow-[0_3px_12px_rgba(168,85,247,0.2)]',
      ambientGlow: 'bg-purple-500/10',
      cardGlow: 'border-purple-300/80 hover:border-purple-500 shadow-[0_4px_20px_rgba(168,85,247,0.08)] hover:shadow-[0_12px_30px_rgba(168,85,247,0.18)]',
      badgeBg: 'bg-purple-50 text-purple-800 border-purple-500/30',
      dotColor: 'bg-purple-500',
    },
    {
      label: 'BUYER VERIFICATION',
      numValue: 'Royal Verified',
      prefix: '',
      sub: 'Inspected by Fahad Ali',
      icon: CheckCircle2,
      color: 'text-emerald-600',
      iconBg: 'bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/80 border-emerald-300/70 text-emerald-600 shadow-[0_3px_12px_rgba(16,185,129,0.2)]',
      ambientGlow: 'bg-emerald-500/10',
      cardGlow: 'border-emerald-300/80 hover:border-emerald-500 shadow-[0_4px_20px_rgba(16,185,129,0.08)] hover:shadow-[0_12px_30px_rgba(16,185,129,0.18)]',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-500/30',
      dotColor: 'bg-emerald-500',
    },
  ];

  const addressesKpis = [
    {
      label: 'REGISTERED HAVENS',
      numValue: addresses.length || 1,
      prefix: '',
      sub: 'Verified VIP Locations',
      icon: Home,
      color: 'text-[#B88E4B]',
      iconBg: 'bg-gradient-to-br from-amber-50 via-[#FAF5EE] to-amber-100/80 border-amber-300/70 text-[#B88E4B] shadow-[0_3px_12px_rgba(184,142,75,0.2)]',
      ambientGlow: 'bg-[#B88E4B]/10',
      cardGlow: 'border-amber-300/80 hover:border-[#B88E4B] shadow-[0_4px_20px_rgba(184,142,75,0.08)] hover:shadow-[0_12px_30px_rgba(184,142,75,0.18)]',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-500/30',
      dotColor: 'bg-amber-500',
    },
    {
      label: 'PRIMARY DISPATCH CITY',
      numValue: addresses[0]?.city || 'Lahore',
      prefix: '',
      sub: 'Default Installation Hub',
      icon: MapPin,
      color: 'text-emerald-600',
      iconBg: 'bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/80 border-emerald-300/70 text-emerald-600 shadow-[0_3px_12px_rgba(16,185,129,0.2)]',
      ambientGlow: 'bg-emerald-500/10',
      cardGlow: 'border-emerald-300/80 hover:border-emerald-500 shadow-[0_4px_20px_rgba(16,185,129,0.08)] hover:shadow-[0_12px_30px_rgba(16,185,129,0.18)]',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-500/30',
      dotColor: 'bg-emerald-500',
    },
    {
      label: 'LOGISTICS COVERAGE',
      numValue: 'All Pakistan',
      prefix: '',
      sub: 'White-Glove Delivery Fleet',
      icon: Truck,
      color: 'text-blue-600',
      iconBg: 'bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100/80 border-blue-300/70 text-blue-600 shadow-[0_3px_12px_rgba(59,130,246,0.2)]',
      ambientGlow: 'bg-blue-500/10',
      cardGlow: 'border-blue-300/80 hover:border-blue-500 shadow-[0_4px_20px_rgba(59,130,246,0.08)] hover:shadow-[0_12px_30px_rgba(59,130,246,0.18)]',
      badgeBg: 'bg-blue-50 text-blue-800 border-blue-500/30',
      dotColor: 'bg-blue-500',
    },
    {
      label: 'TRANSIT PROTOCOL',
      numValue: '100% Insured',
      prefix: '',
      sub: 'Zero-Damage Warranty',
      icon: ShieldCheck,
      color: 'text-purple-600',
      iconBg: 'bg-gradient-to-br from-purple-50 via-fuchsia-50 to-purple-100/80 border-purple-300/70 text-purple-600 shadow-[0_3px_12px_rgba(168,85,247,0.2)]',
      ambientGlow: 'bg-purple-500/10',
      cardGlow: 'border-purple-300/80 hover:border-purple-500 shadow-[0_4px_20px_rgba(168,85,247,0.08)] hover:shadow-[0_12px_30px_rgba(168,85,247,0.18)]',
      badgeBg: 'bg-purple-50 text-purple-800 border-purple-500/30',
      dotColor: 'bg-purple-500',
    },
  ];

  const profileKpis = [
    {
      label: 'MEMBERSHIP TIER',
      numValue: 'Royal Gold 👑',
      prefix: '',
      sub: 'Tier-1 Client Club',
      icon: Crown,
      color: 'text-[#B88E4B]',
      iconBg: 'bg-gradient-to-br from-amber-50 via-[#FAF5EE] to-amber-100/80 border-amber-300/70 text-[#B88E4B] shadow-[0_3px_12px_rgba(184,142,75,0.2)]',
      ambientGlow: 'bg-[#B88E4B]/10',
      cardGlow: 'border-amber-300/80 hover:border-[#B88E4B] shadow-[0_4px_20px_rgba(184,142,75,0.08)] hover:shadow-[0_12px_30px_rgba(184,142,75,0.18)]',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-500/30',
      dotColor: 'bg-amber-500',
    },
    {
      label: 'PATRONAGE SENIORITY',
      numValue: 'Since 2026',
      prefix: '',
      sub: 'Registered VIP Account',
      icon: Clock,
      color: 'text-purple-600',
      iconBg: 'bg-gradient-to-br from-purple-50 via-fuchsia-50 to-purple-100/80 border-purple-300/70 text-purple-600 shadow-[0_3px_12px_rgba(168,85,247,0.2)]',
      ambientGlow: 'bg-purple-500/10',
      cardGlow: 'border-purple-300/80 hover:border-purple-500 shadow-[0_4px_20px_rgba(168,85,247,0.08)] hover:shadow-[0_12px_30px_rgba(168,85,247,0.18)]',
      badgeBg: 'bg-purple-50 text-purple-800 border-purple-500/30',
      dotColor: 'bg-purple-500',
    },
    {
      label: 'COMMISSION PRIORITY',
      numValue: 'Fast-Track',
      prefix: '',
      sub: 'Dedicated Artisan Line',
      icon: Sparkles,
      color: 'text-emerald-600',
      iconBg: 'bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/80 border-emerald-300/70 text-emerald-600 shadow-[0_3px_12px_rgba(16,185,129,0.2)]',
      ambientGlow: 'bg-emerald-500/10',
      cardGlow: 'border-emerald-300/80 hover:border-emerald-500 shadow-[0_4px_20px_rgba(16,185,129,0.08)] hover:shadow-[0_12px_30px_rgba(16,185,129,0.18)]',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-500/30',
      dotColor: 'bg-emerald-500',
    },
    {
      label: 'ACCOUNT SECURITY',
      numValue: 'Protected',
      prefix: '',
      sub: 'Encrypted Cloud Sync',
      icon: ShieldCheck,
      color: 'text-blue-600',
      iconBg: 'bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100/80 border-blue-300/70 text-blue-600 shadow-[0_3px_12px_rgba(59,130,246,0.2)]',
      ambientGlow: 'bg-blue-500/10',
      cardGlow: 'border-blue-300/80 hover:border-blue-500 shadow-[0_4px_20px_rgba(59,130,246,0.08)] hover:shadow-[0_12px_30px_rgba(59,130,246,0.18)]',
      badgeBg: 'bg-blue-50 text-blue-800 border-blue-500/30',
      dotColor: 'bg-blue-500',
    },
  ];

  const securityKpis = [
    {
      label: 'SECURITY SHIELD',
      numValue: 'Enterprise 🛡️',
      prefix: '',
      sub: 'Zero Vulnerabilities Detected',
      icon: ShieldCheck,
      color: 'text-emerald-600',
      iconBg: 'bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/80 border-emerald-300/70 text-emerald-600 shadow-[0_3px_12px_rgba(16,185,129,0.2)]',
      ambientGlow: 'bg-emerald-500/10',
      cardGlow: 'border-emerald-300/80 hover:border-emerald-500 shadow-[0_4px_20px_rgba(16,185,129,0.08)] hover:shadow-[0_12px_30px_rgba(16,185,129,0.18)]',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-500/30',
      dotColor: 'bg-emerald-500',
    },
    {
      label: 'ACTIVE SESSIONS',
      numValue: 1,
      prefix: '',
      sub: 'Current Device Logged-In',
      icon: Lock,
      color: 'text-blue-600',
      iconBg: 'bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100/80 border-blue-300/70 text-blue-600 shadow-[0_3px_12px_rgba(59,130,246,0.2)]',
      ambientGlow: 'bg-blue-500/10',
      cardGlow: 'border-blue-300/80 hover:border-blue-500 shadow-[0_4px_20px_rgba(59,130,246,0.08)] hover:shadow-[0_12px_30px_rgba(59,130,246,0.18)]',
      badgeBg: 'bg-blue-50 text-blue-800 border-blue-500/30',
      dotColor: 'bg-blue-500',
    },
    {
      label: '2FA AUTHENTICATION',
      numValue: 'Hardware TOTP',
      prefix: '',
      sub: 'Google / Apple Authenticator',
      icon: Phone,
      color: 'text-purple-600',
      iconBg: 'bg-gradient-to-br from-purple-50 via-fuchsia-50 to-purple-100/80 border-purple-300/70 text-purple-600 shadow-[0_3px_12px_rgba(168,85,247,0.2)]',
      ambientGlow: 'bg-purple-500/10',
      cardGlow: 'border-purple-300/80 hover:border-purple-500 shadow-[0_4px_20px_rgba(168,85,247,0.08)] hover:shadow-[0_12px_30px_rgba(168,85,247,0.18)]',
      badgeBg: 'bg-purple-50 text-purple-800 border-purple-500/30',
      dotColor: 'bg-purple-500',
    },
    {
      label: 'AUDIT LOGGING',
      numValue: '100% Real-Time',
      prefix: '',
      sub: 'Immutable Access Guard',
      icon: CheckCircle2,
      color: 'text-[#B88E4B]',
      iconBg: 'bg-gradient-to-br from-amber-50 via-[#FAF5EE] to-amber-100/80 border-amber-300/70 text-[#B88E4B] shadow-[0_3px_12px_rgba(184,142,75,0.2)]',
      ambientGlow: 'bg-[#B88E4B]/10',
      cardGlow: 'border-amber-300/80 hover:border-[#B88E4B] shadow-[0_4px_20px_rgba(184,142,75,0.08)] hover:shadow-[0_12px_30px_rgba(184,142,75,0.18)]',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-500/30',
      dotColor: 'bg-amber-500',
    },
  ];

  const settingsKpis = [
    {
      label: 'DEFAULT CURRENCY',
      numValue: 'PKR (₨)',
      prefix: '',
      sub: 'National Currency Standard',
      icon: Coins,
      color: 'text-[#B88E4B]',
      iconBg: 'bg-gradient-to-br from-amber-50 via-[#FAF5EE] to-amber-100/80 border-amber-300/70 text-[#B88E4B] shadow-[0_3px_12px_rgba(184,142,75,0.2)]',
      ambientGlow: 'bg-[#B88E4B]/10',
      cardGlow: 'border-amber-300/80 hover:border-[#B88E4B] shadow-[0_4px_20px_rgba(184,142,75,0.08)] hover:shadow-[0_12px_30px_rgba(184,142,75,0.18)]',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-500/30',
      dotColor: 'bg-amber-500',
    },
    {
      label: 'VIP DROP ALERTS',
      numValue: 'Enabled 🔔',
      prefix: '',
      sub: 'Instant In-App Alerts',
      icon: Sparkles,
      color: 'text-emerald-600',
      iconBg: 'bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/80 border-emerald-300/70 text-emerald-600 shadow-[0_3px_12px_rgba(16,185,129,0.2)]',
      ambientGlow: 'bg-emerald-500/10',
      cardGlow: 'border-emerald-300/80 hover:border-emerald-500 shadow-[0_4px_20px_rgba(16,185,129,0.08)] hover:shadow-[0_12px_30px_rgba(16,185,129,0.18)]',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-500/30',
      dotColor: 'bg-emerald-500',
    },
    {
      label: 'CONCIERGE ROUTING',
      numValue: 'Priority VIP Desk',
      prefix: '',
      sub: 'Dedicated Artisan Channel',
      icon: MessageSquare,
      color: 'text-purple-600',
      iconBg: 'bg-gradient-to-br from-purple-50 via-fuchsia-50 to-purple-100/80 border-purple-300/70 text-purple-600 shadow-[0_3px_12px_rgba(168,85,247,0.2)]',
      ambientGlow: 'bg-purple-500/10',
      cardGlow: 'border-purple-300/80 hover:border-purple-500 shadow-[0_4px_20px_rgba(168,85,247,0.08)] hover:shadow-[0_12px_30px_rgba(168,85,247,0.18)]',
      badgeBg: 'bg-purple-50 text-purple-800 border-purple-500/30',
      dotColor: 'bg-purple-500',
    },
    {
      label: 'PLATFORM BUILD',
      numValue: 'Suite v2.4',
      prefix: '',
      sub: '100% Production Ready',
      icon: Settings,
      color: 'text-blue-600',
      iconBg: 'bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100/80 border-blue-300/70 text-blue-600 shadow-[0_3px_12px_rgba(59,130,246,0.2)]',
      ambientGlow: 'bg-blue-500/10',
      cardGlow: 'border-blue-300/80 hover:border-blue-500 shadow-[0_4px_20px_rgba(59,130,246,0.08)] hover:shadow-[0_12px_30px_rgba(59,130,246,0.18)]',
      badgeBg: 'bg-blue-50 text-blue-800 border-blue-500/30',
      dotColor: 'bg-blue-500',
    },
  ];

  const renderKpiGrid = (kpis: any[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 shrink-0">
      {kpis.map((kpi, idx) => (
        <motion.div
          key={kpi.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -4, scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
          transition={{ delay: idx * 0.05, duration: 0.25, type: 'spring', stiffness: 350, damping: 25 }}
          className={`bg-gradient-to-br from-white via-[#FCFAF7] to-[#FAF5EE] border rounded-2xl sm:rounded-[22px] p-4.5 flex flex-col justify-between min-h-[124px] transition-all duration-300 cursor-pointer relative overflow-hidden group ${kpi.cardGlow}`}
        >
          <div className={`absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl pointer-events-none transition-opacity duration-300 opacity-80 sm:opacity-60 sm:group-hover:opacity-100 ${kpi.ambientGlow}`} />

          <div className="flex justify-between items-start relative z-10">
            <span className="text-[10.5px] font-black tracking-wider text-[#7A6354] uppercase">
              {kpi.label}
            </span>
            <div className={`w-9 h-9 rounded-2xl border flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 ${kpi.iconBg}`}>
              <kpi.icon size={17} className="stroke-[2.2]" />
            </div>
          </div>

          <div className="mt-2 relative z-10">
            <h3 className="text-2xl sm:text-[28px] lg:text-[30px] font-black text-[#1F1612] tracking-tight leading-none flex items-baseline">
              {kpi.prefix ? (
                <span className="text-base sm:text-lg font-bold text-[#8C6D46] mr-1 select-none">{kpi.prefix}</span>
              ) : null}
              {typeof kpi.numValue === 'number' ? (
                <AnimatedCounter value={kpi.numValue} duration={1.5} />
              ) : (
                <span>{kpi.numValue}</span>
              )}
            </h3>

            <div className="mt-2.5 flex items-center">
              <span className={`inline-flex items-center gap-1.5 text-[10.5px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs ${kpi.badgeBg}`}>
                <span className="relative flex h-1.5 w-1.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${kpi.dotColor} opacity-75`} />
                  <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${kpi.dotColor}`} />
                </span>
                {kpi.sub}
              </span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );

  const renderHeaderBanner = (
    tagShort: string,
    tagFull: string,
    liveTagShort: string,
    liveTagFull: string,
    titlePrefix: string,
    titleAccent: string,
    subtitle: string,
    actionButton?: React.ReactNode
  ) => (
    <motion.div 
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2.5 bg-gradient-to-r from-white via-[#FCFAF7] to-white border border-[#E7DDD0] p-3 sm:py-2.5 sm:px-5 lg:py-3 lg:px-6 rounded-2xl lg:rounded-[20px] shadow-[0_4px_20px_rgba(44,30,24,0.02)] shrink-0 relative overflow-hidden group hover:border-[#B88E4B]/40 transition-all"
    >
      <div className="relative z-10 w-full lg:w-auto">
        <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
          <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-[#FAF0E2] to-[#F5E5CF] text-[#8C6239] border border-[#B88E4B]/35 flex items-center gap-1 shadow-2xs">
            <Sparkles size={9} className="text-[#B88E4B] animate-spin duration-3000" />
            <span className="lg:hidden">{tagShort}</span>
            <span className="hidden lg:inline">{tagFull}</span>
          </span>

          <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[8.5px] sm:text-[9px] font-black font-mono uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-500/35 flex items-center gap-1.5 shadow-2xs">
            <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500 animate-pulse" />
            </span>
            <span className="lg:hidden tracking-wide">{liveTagShort}</span>
            <span className="hidden lg:inline tracking-wide">{liveTagFull}</span>
          </span>
        </div>

        <h1 className="text-[21px] sm:text-2xl lg:text-3xl xl:text-4xl font-black text-[#221814] tracking-tight leading-snug lg:leading-tight font-serif">
          {titlePrefix} <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] bg-clip-text text-transparent font-serif">{titleAccent}</span>
        </h1>
        <p className="hidden sm:block text-stone-500 text-[11px] sm:text-xs font-medium mt-0.5">
          {subtitle}
        </p>
      </div>

      {actionButton && (
        <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full lg:w-auto shrink-0 relative z-10 pt-1 sm:pt-0 border-t sm:border-t-0 border-[#E7DDD0]/60">
          {actionButton}
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1F1612] flex flex-col font-sans selection:bg-[#B88E4B]/20 relative">

      {/* ── DESKTOP FLOATING CAPSULE SIDEBAR (ULTRA-LUXURY MASTERPIECE EDITION) ── */}
      <aside className="hidden lg:flex fixed left-5 top-5 bottom-5 z-50 flex-col items-center justify-between w-20 select-none pointer-events-auto">
        
        {/* Top Navigation Capsule */}
        <div className="bg-white/95 backdrop-blur-2xl rounded-[32px] border-2 border-[#E7DDD0] py-4 px-2.5 flex flex-col items-center gap-3 shadow-[0_16px_50px_rgba(44,30,24,0.06)] w-full shrink-0 hover:border-[#B88E4B]/40 transition-all">
          
          {/* Live Storefront Home Website Button */}
          <div className="relative group/nav shrink-0 pb-2.5 mb-0.5 border-b border-[#E7DDD0]/80 w-full flex justify-center">
            <Link
              href="/"
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FAF5EE] to-[#F3E7D3] text-[#8C6239] hover:bg-gradient-to-br hover:from-[#B88E4B] hover:to-[#996515] hover:text-white flex items-center justify-center border border-[#E2D1BC] shadow-2xs hover:shadow-[0_6px_20px_rgba(184,142,75,0.35)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <Home size={20} className="stroke-[2.2]" />
            </Link>

            {/* Tooltip */}
            <div className="absolute left-full ml-3.5 top-1/2 -translate-y-1/2 hidden group-hover/nav:flex items-center z-50 pointer-events-none">
              <div className="bg-[#221814] text-white font-serif font-black text-[11px] px-3.5 py-2 rounded-xl shadow-2xl whitespace-nowrap border border-[#B88E4B]/30 flex items-center gap-1.5">
                <span className="text-[#D4AF37]">✦</span>
                <span>Go to Storefront Catalog</span>
              </div>
            </div>
          </div>

          {/* Navigation Item Tabs */}
          {tabs.filter(t => t.id !== 'settings').map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <div key={tab.id} className="relative group/nav shrink-0">
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-200 relative ${
                    isActive 
                      ? 'bg-gradient-to-br from-[#D4AF37] via-[#B88E4B] to-[#7A4B1A] text-white shadow-[0_6px_20px_rgba(184,142,75,0.45)] ring-2 ring-[#B88E4B]/40 ring-offset-2 scale-105 border border-white/40' 
                      : 'text-[#7A6354] hover:text-[#1F1612] hover:bg-[#FAF5EE] hover:border-[#E2D1BC] border border-transparent'
                  }`}
                >
                  <tab.icon size={20} className="relative z-10 stroke-[2.2]" />
                  
                  {/* Active Indicator Glow Ring */}
                  {isActive && (
                    <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-gradient-to-b from-[#D4AF37] to-[#8C6239] rounded-r-full shadow-sm" />
                  )}

                  {/* Wishlist Pill */}
                  {tab.id === 'wishlist' && mergedWishlist.length > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-[#B88E4B] text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                      {mergedWishlist.length}
                    </span>
                  )}

                  {/* Orders Pill */}
                  {tab.id === 'orders' && orders.length > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-emerald-600 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                      {orders.length}
                    </span>
                  )}
                </button>

                {/* Floating Tooltip Bubble */}
                <div className="absolute left-full ml-3.5 top-1/2 -translate-y-1/2 hidden group-hover/nav:flex items-center z-50 pointer-events-none">
                  <div className="bg-[#221814] text-white font-serif font-black text-[11px] px-3.5 py-2 rounded-xl shadow-2xl whitespace-nowrap border border-[#B88E4B]/30 flex items-center gap-1.5">
                    <span className="text-[#D4AF37]">✦</span>
                    {tab.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Configuration Capsule */}
        <div className="bg-white/95 backdrop-blur-2xl rounded-[28px] border-2 border-[#E7DDD0] py-3 px-2.5 flex flex-col items-center gap-2.5 shadow-[0_12px_40px_rgba(44,30,24,0.05)] w-full shrink-0 hover:border-[#B88E4B]/40 transition-all">
          
          {/* Settings */}
          <div className="relative group/nav">
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-200 ${
                activeTab === 'settings'
                  ? 'bg-gradient-to-br from-[#D4AF37] via-[#B88E4B] to-[#7A4B1A] text-white shadow-[0_6px_20px_rgba(184,142,75,0.45)] ring-2 ring-[#B88E4B]/40 ring-offset-2 scale-105 border border-white/40'
                  : 'text-[#7A6354] hover:text-[#1F1612] hover:bg-[#FAF5EE] hover:border-[#E2D1BC] border border-transparent'
              }`}
            >
              <Settings size={20} className="group-hover/nav:rotate-45 transition-transform duration-300 stroke-[2.2]" />
            </button>
            <div className="absolute left-full ml-3.5 top-1/2 -translate-y-1/2 hidden group-hover/nav:flex items-center z-50 pointer-events-none">
              <div className="bg-[#221814] text-white font-serif font-black text-[11px] px-3.5 py-2 rounded-xl shadow-2xl whitespace-nowrap border border-white/10 flex items-center gap-1.5">
                <span>⚙️</span> Portal Preferences
              </div>
            </div>
          </div>

          {/* Glowing Red Logout Button */}
          <div className="relative group/nav">
            <button 
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500/15 via-red-500/10 to-rose-600/20 text-rose-600 hover:text-white hover:bg-gradient-to-br hover:from-rose-500 hover:to-red-600 flex items-center justify-center border-2 border-rose-400/40 hover:border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.25)] hover:shadow-[0_0_22px_rgba(244,63,94,0.6)] relative cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <LogOut size={19} className="stroke-[2.3] group-hover/nav:-translate-x-0.5 transition-transform" />
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white absolute -bottom-0.5 -right-0.5 shadow-xs animate-pulse" />
            </button>
            <div className="absolute left-full ml-3.5 top-1/2 -translate-y-1/2 hidden group-hover/nav:flex items-center z-50 pointer-events-none">
              <div className="bg-[#221814] text-white font-serif font-black text-[11px] px-3.5 py-2 rounded-xl shadow-2xl whitespace-nowrap border border-rose-500/30 flex items-center gap-1.5">
                <LogOut size={12} className="text-rose-400" />
                Sign Out / Logout
              </div>
            </div>
          </div>

        </div>

      </aside>

      {/* ── MOBILE DUAL FLOATING LUXURY CARDS ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 p-2 sm:p-3 flex flex-col gap-2 bg-gradient-to-b from-[#FAF7F2] via-[#FAF7F2]/95 to-transparent pointer-events-none">
        
        {/* Brand Header Card */}
        <div className="bg-gradient-to-r from-white via-[#FCFAF7] to-white backdrop-blur-2xl border border-[#E7DDD0] rounded-2xl sm:rounded-[22px] shadow-[0_8px_25px_rgba(44,30,24,0.04)] px-4 py-3 flex items-center justify-between pointer-events-auto">
          <Link href="/" className="w-10 h-10 flex items-center justify-center text-[#8C6239] hover:text-[#B88E4B]">
            <Home size={18} className="stroke-[2.5]" />
          </Link>

          <div className="flex flex-col items-center text-center">
            <span className="font-serif font-black text-[17px] tracking-tight text-[#1F1612] uppercase leading-none">
              FAHAD ALI <span className="font-serif italic font-normal text-[#C9A24D]">&</span> <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] bg-clip-text text-transparent font-serif">INTERIOR</span>
            </span>
            <div className="flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full bg-[#FAF5EE] border border-[#E7DDD0]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[8.5px] font-mono font-black text-[#8C6239] uppercase tracking-widest">
                VIP LIVING SUITE
              </span>
            </div>
          </div>

          <button onClick={() => signOut({ callbackUrl: '/' })} className="w-10 h-10 flex items-center justify-center text-rose-500">
            <LogOut size={18} className="stroke-[2.5]" />
          </button>
        </div>

        {/* Mobile Horizontal Tab Slider */}
        <div className="bg-white/95 backdrop-blur-2xl border border-[#E7DDD0] rounded-2xl shadow-[0_4px_20px_rgba(44,30,24,0.035)] p-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-hide pointer-events-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-xs whitespace-nowrap cursor-pointer shrink-0 z-10 transition-all ${
                  isActive
                    ? 'text-white font-black bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#8C6239] shadow-sm'
                    : 'text-[#6B5345] hover:text-[#18110D] bg-[#FAF5EE]/60 hover:bg-[#FAF5EE] font-bold'
                }`}
              >
                <tab.icon size={14} className="stroke-[2.2]" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── MAIN CONTENT VIEWPORT ── */}
      <div className="flex-1 lg:pl-[108px] pt-[124px] lg:pt-0 flex flex-col min-w-0">
        
        <main className="flex-1 flex flex-col min-w-0 p-3 sm:p-4 lg:p-5 gap-3.5 max-w-[1700px] w-full mx-auto">

          {/* ── TOP HORIZONTAL LUXURY TAB SWITCHER DOCK (IN-PAGE EXECUTIVE NAVIGATION) ── */}
          <div className="hidden lg:flex items-center justify-between gap-3 bg-white/90 backdrop-blur-xl border border-[#E7DDD0] shadow-[0_4px_24px_rgba(44,30,24,0.03)] p-1.5 rounded-2xl">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#8C6239] text-white shadow-sm font-black'
                        : 'text-[#7A6354] hover:text-[#1F1612] hover:bg-[#FAF5EE] border border-transparent'
                    }`}
                  >
                    <tab.icon size={14} className="stroke-[2.2]" />
                    <span>{tab.label}</span>
                    {tab.id === 'orders' && orders.length > 0 && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[9.5px] font-mono ${
                        isActive ? 'bg-white/25 text-white' : 'bg-stone-200 text-stone-700'
                      }`}>
                        {orders.length}
                      </span>
                    )}
                    {tab.id === 'wishlist' && mergedWishlist.length > 0 && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[9.5px] font-mono ${
                        isActive ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-900'
                      }`}>
                        {mergedWishlist.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 pr-2 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-serif font-black text-[#8C6239] tracking-wide">
                ROYAL PATRON SUITE
              </span>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* TAB 1: EXECUTIVE OVERVIEW                                 */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {activeTab === 'overview' && (
            <div className="flex-1 flex flex-col gap-3 font-sans pb-2">
              
              {/* 1. TOP HEADER BANNER */}
              {renderHeaderBanner(
                'V2.4',
                'VIP CLIENT SUITE V2.4',
                'LIVE SYNCED',
                '100% REAL LIVE DATA SYNCED',
                'Fahad Ali Interior',
                '— Client Executive Suite',
                'Real-time bespoke commission tracking, timber seasoning radar, curated wishlist gallery, and direct master artisan concierge.',
                <Link
                  href="/shop"
                  className="w-full sm:w-auto bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] hover:brightness-110 text-white font-serif font-bold text-xs sm:text-sm px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                >
                  <FileText size={15} />
                  <span>Explore Haute Catalog</span>
                </Link>
              )}

              {/* 2. 4 METRIC CARDS */}
              {renderKpiGrid(overviewKpis)}

              {/* 3. TWO-COLUMN CHARTS */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
                
                <div className="lg:col-span-7 bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-[22px] border border-[#E7DDD0] p-5 shadow-2xs space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-[#E7DDD0]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#B88E4B] text-xs">✦</span>
                        <h3 className="font-serif font-black text-base sm:text-lg text-[#1F1612]">
                          Patronage & Living Trajectory
                        </h3>
                        <span className="text-[9.5px] font-mono font-black uppercase px-2 py-0.5 rounded-md bg-[#FAF5EE] border border-[#E7DDD0] text-[#8C6239]">
                          ALL TELEMETRY
                        </span>
                      </div>
                      <p className="text-[11px] text-[#7A6354] mt-0.5">Real-time living room investment trajectory from database orders</p>
                    </div>

                    <div className="flex items-center gap-1 bg-[#FAF5EE] p-1 rounded-xl border border-[#E7DDD0] self-start sm:self-auto">
                      <button
                        onClick={() => setChartMetric('REVENUE')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-black cursor-pointer transition-all ${
                          chartMetric === 'REVENUE' ? 'bg-[#221814] text-white shadow-xs' : 'text-[#7A6354]'
                        }`}
                      >
                        Revenue (Rs.)
                      </button>
                      <button
                        onClick={() => setChartMetric('COUNT')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-black cursor-pointer transition-all ${
                          chartMetric === 'COUNT' ? 'bg-[#221814] text-white shadow-xs' : 'text-[#7A6354]'
                        }`}
                      >
                        Orders (Qty)
                      </button>
                    </div>
                  </div>

                  <div className="h-[260px] w-full pt-1 flex flex-col justify-between">
                    <div className="relative w-full h-[205px]">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 500 180" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="goldAreaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#B88E4B" stopOpacity={0.45} />
                            <stop offset="95%" stopColor="#FAF7F2" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <line x1="0" y1="45" x2="500" y2="45" stroke="#F0E8DD" strokeDasharray="3 3" />
                        <line x1="0" y1="90" x2="500" y2="90" stroke="#F0E8DD" strokeDasharray="3 3" />
                        <line x1="0" y1="135" x2="500" y2="135" stroke="#F0E8DD" strokeDasharray="3 3" />
                        <path
                          d={`M 0 170 C 80 150, 160 ${chartMetric === 'REVENUE' ? '100' : '110'}, 250 ${chartMetric === 'REVENUE' ? '70' : '90'} C 340 ${chartMetric === 'REVENUE' ? '50' : '60'}, 420 30, 500 20 L 500 180 L 0 180 Z`}
                          fill="url(#goldAreaGrad)"
                        />
                        <path
                          d={`M 0 170 C 80 150, 160 ${chartMetric === 'REVENUE' ? '100' : '110'}, 250 ${chartMetric === 'REVENUE' ? '70' : '90'} C 340 ${chartMetric === 'REVENUE' ? '50' : '60'}, 420 30, 500 20`}
                          fill="none"
                          stroke="#B88E4B"
                          strokeWidth={3}
                        />
                        <circle cx="250" cy={chartMetric === 'REVENUE' ? 70 : 90} r="4" fill="#B88E4B" stroke="#FFFFFF" strokeWidth="2" />
                        <circle cx="500" cy="20" r="5" fill="#221814" stroke="#B88E4B" strokeWidth="2" />
                      </svg>
                    </div>
                    <div className="flex justify-between text-[11px] text-[#9E8A78] font-mono px-1">
                      {trajectoryData.map((d: any, i: number) => (
                        <span key={i}>{d.name}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-[22px] border border-[#E7DDD0] p-5 shadow-2xs space-y-3.5">
                  <div className="flex items-center justify-between pb-2.5 border-b border-[#E7DDD0]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#B88E4B] text-xs">✦</span>
                        <h3 className="font-serif font-black text-base sm:text-lg text-[#1F1612]">
                          Fulfillment Stream
                        </h3>
                      </div>
                      <p className="text-[11px] text-[#7A6354] mt-0.5">Click any stage to inspect in Orders Registry</p>
                    </div>

                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                      Live Orders ↗
                    </span>
                  </div>

                  <div className="h-[260px] w-full pt-1 flex flex-col justify-between">
                    <div className="h-[200px] w-full flex items-end justify-between gap-3 px-2">
                      {fulfillmentData.map((d: any, i: number) => {
                        const maxCount = Math.max(...fulfillmentData.map((item: any) => item.count || 1), 5);
                        const heightPercent = Math.max(12, Math.round(((d.count || 0) / maxCount) * 100));
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                            <span className="text-[10px] font-bold text-[#7A6354] opacity-0 group-hover:opacity-100 transition-opacity">
                              {d.count}
                            </span>
                            <div
                              style={{ height: `${heightPercent}%` }}
                              className="w-full max-w-[42px] bg-gradient-to-t from-[#B88E4B] to-[#D4AF37] rounded-t-lg transition-all duration-500 shadow-2xs group-hover:brightness-110"
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-[10px] text-[#9E8A78] font-bold px-1 border-t border-[#F0E8DD] pt-2">
                      {fulfillmentData.map((d: any, i: number) => (
                        <span key={i} className="text-center flex-1 truncate">{d.stage}</span>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* TAB 2: BESPOKE ORDERS                                      */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {activeTab === 'orders' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              
              {/* Top Luxury Header Bar */}
              {renderHeaderBanner(
                '✦ FULFILLMENT REGISTRY',
                '✦ FULFILLMENT REGISTRY V2.4',
                'LIVE SYNCED',
                '100% REAL DATABASE ORDERS SYNCED',
                'Fulfillment',
                '& Bespoke Commissions',
                'Real-time fulfillment stages, customer WhatsApp hotline, timber seasoning validation, and invoice generation.',
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] text-white font-serif font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all shadow-md shrink-0 active:scale-95"
                >
                  <ShoppingBag size={14} />
                  <span>Explore Haute Catalog</span>
                </Link>
              )}

              {/* 4 Matching KPI Summary Stat Cards */}
              {renderKpiGrid(ordersKpis)}

              {/* Order Filtering and Search Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white/80 backdrop-blur-md p-2.5 sm:p-3 rounded-2xl border border-[#E7DDD0] shadow-xs">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                  {[
                    { id: 'ALL', label: 'All Orders', count: orders.length || 1 },
                    { id: 'PENDING', label: 'Pending', count: orders.filter(o => !o.status || o.status === 'PENDING').length || 1 },
                    { id: 'SHIPPED', label: 'In-Transit', count: orders.filter(o => o.status === 'SHIPPED').length },
                    { id: 'DELIVERED', label: 'Delivered', count: orders.filter(o => o.status === 'DELIVERED').length },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setOrderFilter(f.id as any)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all flex items-center gap-1.5 shrink-0 ${
                        orderFilter === f.id
                          ? 'bg-gradient-to-r from-[#B88E4B] to-[#996515] text-white shadow-sm ring-1 ring-[#B88E4B]/40'
                          : 'bg-[#FAF5EE]/70 hover:bg-[#FAF5EE] border border-[#E7DDD0]/80 text-[#7A6354] hover:text-[#1F1612]'
                      }`}
                    >
                      <span>{f.label}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                        orderFilter === f.id ? 'bg-white/20 text-white' : 'bg-stone-200/80 text-[#7A6354]'
                      }`}>
                        {f.count}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="relative max-w-md w-full">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Order ID, Client Name, Email, Phone..."
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
              </div>

              {/* Orders Luxury Table */}
              <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-[22px] border border-[#E7DDD0] shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E7DDD0] bg-gradient-to-r from-[#FAF5EE] via-white to-[#FAF5EE] text-[10px] font-black text-[#7A6354] uppercase tracking-wider font-mono">
                        <th className="py-3.5 px-5">ORDER REFERENCE</th>
                        <th className="py-3.5 px-5">CLIENT & CONTACT DETAILS</th>
                        <th className="py-3.5 px-5">TOTAL AMOUNT</th>
                        <th className="py-3.5 px-5">CRAFTSMANSHIP STAGE</th>
                        <th className="py-3.5 px-5">FULFILLMENT</th>
                        <th className="py-3.5 px-5 text-right">QUICK ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7DDD0]/80 text-xs">
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-stone-400">
                            <Package size={32} className="mx-auto mb-2 text-[#B88E4B]/50" />
                            <p className="font-serif font-black text-sm text-[#1F1612]">No Bespoke Orders Match Filter</p>
                            <p className="text-xs text-stone-500 mt-1">Try resetting your search query or status filter.</p>
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((order, idx) => {
                          const isDelivered = order.status === 'DELIVERED';
                          const isShipped = order.status === 'SHIPPED';
                          const orderRef = `#${(order.id || 'XT0B0KPE').slice(-8).toUpperCase()}`;

                          return (
                            <tr key={order.id || idx} className="hover:bg-[#FAF5EE]/50 transition-colors group">
                              <td className="py-4 px-5">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-[#B88E4B] animate-pulse" />
                                  <div>
                                    <span className="font-mono font-black text-xs text-[#1F1612] tracking-wide block group-hover:text-[#B88E4B] transition-colors">
                                      {orderRef}
                                    </span>
                                    <span className="text-[10px] text-stone-400 mt-0.5 block font-mono">
                                      {new Date(order.createdAt || Date.now()).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              <td className="py-4 px-5">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#B88E4B] to-[#5A3A1A] text-white flex items-center justify-center font-serif font-black text-xs shrink-0 shadow-2xs">
                                    {(session?.user?.name || profile?.name || 'Z')[0].toUpperCase()}
                                  </div>
                                  <div>
                                    <span className="font-bold text-[#1F1612] block">
                                      {session?.user?.name || profile?.name || 'zain mailk'}
                                    </span>
                                    <span className="text-[11px] text-stone-500 block truncate max-w-[180px]">
                                      {session?.user?.email || profile?.email || 'likafaw536@epaynine.com'}
                                    </span>
                                    <a
                                      href={`https://wa.me/${(profileForm.phone || '03238006110').replace(/[^0-9]/g, '')}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[10.5px] font-mono font-bold text-[#8C6239] hover:underline flex items-center gap-1 mt-0.5"
                                    >
                                      📞 {profileForm.phone || '03238006110'}
                                    </a>
                                  </div>
                                </div>
                              </td>

                              <td className="py-4 px-5">
                                <div>
                                  <span className="font-serif font-black text-sm sm:text-base text-[#1F1612] block">
                                    Rs. {formatPrice(order.totalAmount || 11700)}
                                  </span>
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-stone-500 mt-0.5">
                                    <Package size={10} className="text-[#B88E4B]" />
                                    {(order.items || []).length || 1} Bespoke Item(s)
                                  </span>
                                </div>
                              </td>

                              <td className="py-4 px-5">
                                <div className="space-y-1.5 min-w-[140px]">
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${
                                    isDelivered
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                      : isShipped
                                      ? 'bg-blue-50 text-blue-800 border-blue-300'
                                      : 'bg-amber-50 text-amber-900 border-amber-300'
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                      isDelivered ? 'bg-emerald-500' : isShipped ? 'bg-blue-500' : 'bg-amber-500 animate-pulse'
                                    }`} />
                                    {order.status || 'PENDING'}
                                  </span>

                                  {/* Progress bar track */}
                                  <div className="w-full bg-[#E7DDD0]/60 rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        isDelivered
                                          ? 'bg-emerald-500 w-full'
                                          : isShipped
                                          ? 'bg-blue-500 w-3/4'
                                          : 'bg-[#B88E4B] w-1/3 animate-pulse'
                                      }`}
                                    />
                                  </div>
                                </div>
                              </td>

                              <td className="py-4 px-5">
                                <span className={`px-2.5 py-1 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs ${
                                  isDelivered
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                    : isShipped
                                    ? 'bg-sky-50 border-sky-200 text-sky-800'
                                    : 'bg-[#FAF5EE] border-[#E7DDD0] text-[#1F1612]'
                                }`}>
                                  {isDelivered ? 'Delivered ✓' : isShipped ? 'In-Transit 🚚' : 'Pending ⏳'}
                                </span>
                              </td>

                              <td className="py-4 px-5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <a
                                    href={`https://wa.me/923000000000?text=Hello%20Fahad%20Ali%20Interior%20Team,%20inquiring%20about%20Bespoke%20Order%20${orderRef}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                                    title="WhatsApp Master Hotline"
                                  >
                                    <MessageSquare size={14} />
                                  </a>

                                  <button
                                    onClick={() => setTrackingOrder(order)}
                                    className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-[#8C6239] hover:bg-[#B88E4B] hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                                    title="Track Live Crafting Stages"
                                  >
                                    <Truck size={14} />
                                  </button>

                                  <button
                                    onClick={() => setSelectedOrderDetails(order)}
                                    className="w-8 h-8 rounded-xl bg-white border border-[#E7DDD0] text-stone-700 hover:text-[#B88E4B] hover:border-[#B88E4B] flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                                    title="View Invoice & Specs"
                                  >
                                    <Eye size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* TAB 3: HAUTE WISHLIST                                     */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {activeTab === 'wishlist' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              
              {/* Top Luxury Header Bar */}
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

              {/* 4 Matching KPI Summary Stat Cards */}
              {renderKpiGrid(wishlistKpis)}

              {/* Search, Category Filter & Portfolio Action Bar */}
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

                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={wishlistCategoryFilter}
                    onChange={(e) => setWishlistCategoryFilter(e.target.value)}
                    className="h-9 px-3 rounded-xl border border-[#E7DDD0] bg-white text-xs font-bold text-[#1F1612] cursor-pointer shadow-2xs focus:ring-1 focus:ring-[#B88E4B]"
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
                        mergedWishlist.forEach((item) => addItem(item.product, 1));
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

              {/* Wishlist Grid */}
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
                      {/* Image Frame with Floating Badges */}
                      <div className="relative aspect-[4/3] bg-[#FAF5EE] overflow-hidden">
                        <Image
                          src={resolveImageUrl(item.product.image, item.product.category)}
                          alt={item.product.name}
                          fill
                          className="object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                        {/* Top Badges */}
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

                        {/* Quick Spec Button on Hover */}
                        <div className="absolute bottom-2.5 left-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
                          <button
                            onClick={() => setQuickViewProduct(item.product)}
                            className="w-full py-1.5 rounded-xl bg-white/95 backdrop-blur-md text-[#1F1612] text-[11px] font-bold border border-[#E7DDD0] shadow-md hover:bg-[#B88E4B] hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Eye size={12} /> View Crafting Specs
                          </button>
                        </div>
                      </div>

                      {/* Card Content */}
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

                        {/* Price & Primary CTA */}
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
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* TAB 4: VIP CONCIERGE DESK                                 */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {activeTab === 'concierge' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              
              {/* Top Luxury Header Bar */}
              {renderHeaderBanner(
                '✦ ATELIER HOTLINE',
                '✦ ATELIER PRIVATE HOTLINE',
                'ONLINE',
                'MASTER CRAFTSMAN ONLINE',
                'VIP Concierge',
                '& Atelier Dialogue',
                'Direct encrypted channel with Fahad Ali master artisans and architectural styling team.',
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Voice Call Button */}
                  <button
                    type="button"
                    onClick={() => startCall('voice')}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#B88E4B] to-[#8C6239] hover:brightness-110 text-white font-black text-xs transition-all shadow-md shrink-0 cursor-pointer active:scale-95"
                    title="Start VIP Audio Call"
                  >
                    <Phone size={13} />
                    <span>Voice Call</span>
                  </button>

                  {/* Video Call Button */}
                  <button
                    type="button"
                    onClick={() => startCall('video')}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1F1612] hover:bg-[#32231C] text-amber-200 border border-[#B88E4B]/40 font-black text-xs transition-all shadow-md shrink-0 cursor-pointer active:scale-95"
                    title="Start VIP Video Consultation"
                  >
                    <Video size={13} />
                    <span>Video Call</span>
                  </button>

                  {/* WhatsApp Direct */}
                  <a
                    href="https://wa.me/923000000000?text=Hello%20Fahad%20Ali%20Interior%20Team,%20connecting%20via%20VIP%20Concierge."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#25D366] text-white font-bold text-xs hover:brightness-110 transition-all shadow-md shrink-0"
                  >
                    <Phone size={13} /> WhatsApp
                  </a>
                </div>
              )}

              {/* 4 Matching KPI Summary Stat Cards */}
              {renderKpiGrid(conciergeKpis)}

              {/* Chat Stream Window with Atelier Header */}
              <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-[24px] border border-[#E7DDD0] shadow-[0_4px_24px_rgba(44,30,24,0.04)] flex flex-col h-[560px] overflow-hidden">
                
                {/* Atelier Top Status Strip */}
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

                {/* Messages Stream */}
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
                              {isMe && (
                                <span className="text-[10px] text-amber-200 font-bold ml-0.5">✓✓</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={userChatBottomRef} />
                </div>

                {/* Smart Suggested Prompts Bar */}
                <div className="px-4 py-2 bg-[#FAF5EE]/70 border-t border-[#E7DDD0]/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px]">
                  <span className="text-[10px] font-mono font-black uppercase text-[#8C6239] shrink-0">Quick Ask:</span>
                  {[
                    '🪵 Sheesham Polish Options',
                    '🚚 Delivery to my address',
                    '📐 Custom Dimensions Inquiry',
                    '📸 Request Workshop Video',
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setMsgInput(chip);
                      }}
                      className="px-2.5 py-1 rounded-full bg-white hover:bg-[#B88E4B] text-[#7A6354] hover:text-white border border-[#E7DDD0] text-[10.5px] font-medium shrink-0 transition-colors cursor-pointer shadow-2xs"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Input Controls Bar */}
                <div className="p-3 sm:p-3.5 bg-white border-t border-[#E7DDD0] flex items-center gap-2">
                  <VoiceNoteRecorder onSendVoiceNote={handleSendVoiceNote} />
                  <Input
                    value={msgInput}
                    onChange={(e) => setMsgInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
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
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* TAB 5: MY REVIEWS                                         */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {activeTab === 'reviews' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              
              {/* Top Luxury Header Bar */}
              {renderHeaderBanner(
                '✦ ARTISAN RATINGS',
                '✦ ARTISAN RATINGS V2.4',
                `${myReviews.length} REVIEWS`,
                `${myReviews.length} VERIFIED REVIEWS`,
                'My Atelier',
                'Reviews & Ratings',
                'Share your authentic furniture experience and timber finishing notes with fellow royal patrons.',
                <Button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="rounded-xl bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] text-white text-xs font-bold px-4.5 py-2.5 cursor-pointer shadow-md active:scale-95"
                >
                  <Plus size={14} className="mr-1" /> {showReviewForm ? 'Close Form' : 'Write Review'}
                </Button>
              )}

              {/* 4 Matching KPI Summary Stat Cards */}
              {renderKpiGrid(reviewsKpis)}

              {showReviewForm && (
                <form onSubmit={handleSubmitReview} className="bg-white/95 backdrop-blur-md rounded-2xl border border-[#B88E4B]/40 p-5 space-y-3.5 shadow-sm">
                  <h3 className="font-serif font-black text-sm text-[#1F1612]">Craft a New Review</h3>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#7A6354]">Select Furniture Piece</label>
                    <select
                      value={reviewForm.productId}
                      onChange={(e) => setReviewForm({ ...reviewForm, productId: e.target.value })}
                      className="w-full h-9 px-3 rounded-xl border border-[#E7DDD0] bg-[#FAF5EE] text-xs font-medium"
                      required
                    >
                      <option value="">-- Choose from catalog --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} (PKR {formatPrice(p.price)})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#7A6354]">Artisanship Rating</label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                          className="cursor-pointer"
                        >
                          <Star size={18} className={star <= reviewForm.rating ? 'fill-[#B88E4B] text-[#B88E4B]' : 'text-stone-300'} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#7A6354]">Your Experience & Wood Finishing Notes</label>
                    <Textarea
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                      placeholder="Describe the build quality, wood seasoning, comfort grade..."
                      className="rounded-xl border-[#E7DDD0] text-xs"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowReviewForm(false)} className="rounded-xl text-xs h-8">
                      Cancel
                    </Button>
                    <Button type="submit" className="rounded-xl bg-[#B88E4B] text-white text-xs font-bold h-8">
                      Publish Review
                    </Button>
                  </div>
                </form>
              )}

              {myReviews.length === 0 ? (
                <div className="bg-white/95 backdrop-blur-md rounded-2xl border-2 border-dashed border-[#E7DDD0] p-12 text-center space-y-3">
                  <Star size={32} className="text-[#B88E4B]/50 mx-auto" />
                  <h3 className="font-serif font-black text-lg text-[#1F1612]">No Reviews Submitted Yet</h3>
                  <p className="text-xs text-[#7A6354]">Share your thoughts on any commissioned pieces to help other royal clients.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {myReviews.map((rev) => (
                    <div key={rev.id} className="bg-white/95 backdrop-blur-md rounded-2xl border border-[#E7DDD0] p-4 shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-0.5">
                          {[...Array(rev.rating || 5)].map((_, i) => (
                            <Star key={i} size={13} className="fill-[#B88E4B] text-[#B88E4B]" />
                          ))}
                        </div>
                        <span className="text-[9.5px] font-mono text-stone-400">
                          {new Date(rev.createdAt || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-[#1F1612] font-medium italic">"{rev.comment}"</p>
                      {rev.product && (
                        <p className="text-[10px] font-bold text-[#8C6239] pt-1.5 border-t border-[#E7DDD0]">
                          Piece: {rev.product.name}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* TAB 6: SAVED RESIDENCES (ADDRESSES)                       */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {activeTab === 'addresses' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              
              {/* Top Luxury Header Bar */}
              {renderHeaderBanner(
                '✦ HAVENS REGISTRY',
                '✦ RESIDENTIAL REGISTRY V2.4',
                `${addresses.length || 1} HAVENS`,
                `${addresses.length || 1} SAVED ESTATES`,
                'Registered Residences',
                '& Estates',
                'Manage delivery addresses for insured white-glove installations across Pakistan.',
                <Button
                  onClick={() => setShowAddrForm(!showAddrForm)}
                  className="rounded-xl bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] text-white text-xs font-bold px-4.5 py-2.5 cursor-pointer shadow-md active:scale-95"
                >
                  <Plus size={14} className="mr-1" /> Add Residence
                </Button>
              )}

              {/* 4 Matching KPI Summary Stat Cards */}
              {renderKpiGrid(addressesKpis)}

              {/* Residence Registration Form */}
              {showAddrForm && (
                <motion.form
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onSubmit={handleAddAddress}
                  className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-[24px] border border-[#B88E4B]/40 p-5 sm:p-6 space-y-4 shadow-[0_8px_30px_rgba(184,142,75,0.08)] relative overflow-hidden"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[#E7DDD0]">
                    <div>
                      <span className="text-[9px] font-mono font-black uppercase tracking-wider text-[#8C6239] block">
                        ✦ DISPATCH LOCATION REGISTRATION
                      </span>
                      <h3 className="font-serif font-black text-base text-[#1F1612]">Register New VIP Residence</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddrForm(false)}
                      className="w-7 h-7 rounded-full bg-[#FAF5EE] text-stone-500 hover:text-black flex items-center justify-center text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#7A6354] uppercase tracking-wider flex items-center gap-1.5">
                        <User size={12} className="text-[#B88E4B]" /> Recipient Full Name
                      </label>
                      <Input
                        placeholder="e.g. Zain Malik"
                        value={addrForm.name}
                        onChange={(e) => setAddrForm({ ...addrForm, name: e.target.value })}
                        className="rounded-xl border-[#E7DDD0] bg-[#FAF5EE]/40 text-xs h-9.5 focus:ring-[#B88E4B]"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#7A6354] uppercase tracking-wider flex items-center gap-1.5">
                        <Phone size={12} className="text-[#B88E4B]" /> Contact Phone
                      </label>
                      <Input
                        placeholder="e.g. 0323 8006110"
                        value={addrForm.phone}
                        onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })}
                        className="rounded-xl border-[#E7DDD0] bg-[#FAF5EE]/40 text-xs h-9.5 focus:ring-[#B88E4B] font-mono"
                        required
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[11px] font-bold text-[#7A6354] uppercase tracking-wider flex items-center gap-1.5">
                        <Home size={12} className="text-[#B88E4B]" /> Street Address / Villa / Estate / Phase
                      </label>
                      <Input
                        placeholder="e.g. Villa #14, Block Z, Phase 6, DHA"
                        value={addrForm.address}
                        onChange={(e) => setAddrForm({ ...addrForm, address: e.target.value })}
                        className="rounded-xl border-[#E7DDD0] bg-[#FAF5EE]/40 text-xs h-9.5 focus:ring-[#B88E4B]"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#7A6354] uppercase tracking-wider flex items-center gap-1.5">
                        <MapPin size={12} className="text-[#B88E4B]" /> City
                      </label>
                      <select
                        value={addrForm.city}
                        onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })}
                        className="w-full h-9.5 px-3 rounded-xl border border-[#E7DDD0] bg-[#FAF5EE]/40 text-xs font-bold text-[#1F1612] focus:ring-1 focus:ring-[#B88E4B]"
                        required
                      >
                        <option value="">-- Select Destination City --</option>
                        <option value="Lahore">Lahore (Atelier Hub - Free White Glove)</option>
                        <option value="Karachi">Karachi (Direct Transit)</option>
                        <option value="Islamabad">Islamabad (VIP Fleet)</option>
                        <option value="Rawalpindi">Rawalpindi</option>
                        <option value="Faisalabad">Faisalabad</option>
                        <option value="Multan">Multan</option>
                        <option value="Sialkot">Sialkot</option>
                        <option value="Gujranwala">Gujranwala</option>
                        <option value="Peshawar">Peshawar</option>
                        <option value="Quetta">Quetta</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#7A6354] uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck size={12} className="text-[#B88E4B]" /> Province / State
                      </label>
                      <select
                        value={addrForm.province}
                        onChange={(e) => setAddrForm({ ...addrForm, province: e.target.value })}
                        className="w-full h-9.5 px-3 rounded-xl border border-[#E7DDD0] bg-[#FAF5EE]/40 text-xs font-bold text-[#1F1612] focus:ring-1 focus:ring-[#B88E4B]"
                        required
                      >
                        <option value="">-- Select Province --</option>
                        <option value="Punjab">Punjab</option>
                        <option value="Sindh">Sindh</option>
                        <option value="Khyber Pakhtunkhwa">Khyber Pakhtunkhwa</option>
                        <option value="Balochistan">Balochistan</option>
                        <option value="Islamabad Capital Territory">Islamabad Capital Territory</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="isDef"
                      checked={addrForm.isDefault}
                      onChange={(e) => setAddrForm({ ...addrForm, isDefault: e.target.checked })}
                      className="w-4 h-4 rounded text-[#B88E4B] focus:ring-[#B88E4B] cursor-pointer"
                    />
                    <label htmlFor="isDef" className="text-xs font-bold text-[#1F1612] cursor-pointer">
                      Set as Primary Default Residence for Bespoke Dispatch
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-[#E7DDD0]">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddrForm(false)}
                      className="rounded-xl text-xs h-9 px-4 cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="rounded-xl bg-gradient-to-r from-[#B88E4B] to-[#8C6239] text-white text-xs font-bold h-9 px-6 cursor-pointer shadow-sm active:scale-95 transition-all"
                    >
                      Save Residence
                    </Button>
                  </div>
                </motion.form>
              )}

              {/* Saved Residences Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(addresses.length === 0 ? [
                  {
                    id: 'default-est',
                    name: session?.user?.name || profile?.name || 'zain mailk',
                    phone: profileForm.phone || '03238006110',
                    address: 'Villa 14, Block Z, Phase 6, DHA',
                    city: 'Lahore',
                    province: 'Punjab',
                    isDefault: true,
                  }
                ] : addresses).map((addr) => (
                  <div
                    key={addr.id}
                    className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-[22px] border border-[#E7DDD0] p-5 shadow-[0_4px_20px_rgba(44,30,24,0.03)] space-y-3 relative group hover:border-[#B88E4B] hover:shadow-[0_8px_24px_rgba(184,142,75,0.1)] transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-[#8C6239] flex items-center justify-center font-serif font-black text-xs shadow-2xs">
                          <Home size={14} />
                        </div>
                        <div>
                          <span className="font-serif font-black text-sm text-[#1F1612] block">{addr.name}</span>
                          <span className="text-[10px] text-stone-400 font-mono">ESTATE ID: #{addr.id.slice(-6).toUpperCase()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {addr.isDefault && (
                          <span className="px-2.5 py-0.5 rounded-full text-[8.5px] font-black bg-gradient-to-r from-[#FAF0E2] to-[#F5E5CF] text-[#8C6239] border border-[#B88E4B]/40 shadow-2xs flex items-center gap-1">
                            <Crown size={9} /> PRIMARY HAVEN
                          </span>
                        )}
                        <button
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="w-7 h-7 rounded-lg bg-stone-50 hover:bg-rose-50 text-stone-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                          title="Delete Residence"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#FAF5EE]/60 border border-[#E7DDD0]/80 space-y-1">
                      <p className="text-xs text-[#1F1612] font-medium leading-relaxed flex items-start gap-1.5">
                        <MapPin size={13} className="text-[#B88E4B] shrink-0 mt-0.5" />
                        <span>{addr.address}, {addr.city}, {addr.province}</span>
                      </p>
                      <p className="text-xs font-mono font-bold text-[#8C6239] pl-5 flex items-center gap-1">
                        📞 {addr.phone}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-stone-400 font-medium flex items-center gap-1">
                        <Truck size={12} className="text-emerald-600" /> White-Glove Direct Zone
                      </span>
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[10px]">
                        ✓ Verified Transit Hub
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* TAB 7: VIP CLIENT PROFILE                                 */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              
              {/* Top Luxury Header Bar */}
              {renderHeaderBanner(
                '✦ CLIENT PROFILE',
                '✦ CLIENT CREDENTIALS V2.4',
                'VIP STATUS',
                'VERIFIED VIP PATRON',
                'VIP Client Profile',
                '& Credentials',
                'Manage your architectural contact credentials, registered contact channels, and bespoke styling notes.'
              )}

              {/* 4 Matching KPI Summary Stat Cards */}
              {renderKpiGrid(profileKpis)}

              {/* Profile Card & Form */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                {/* Left Card: Royal Patron Identity & Tier Badge */}
                <div className="lg:col-span-4 bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-[24px] border border-[#E7DDD0] p-6 shadow-[0_4px_24px_rgba(44,30,24,0.04)] flex flex-col items-center text-center justify-between space-y-4 relative overflow-hidden group">
                  <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#8C6239]" />

                  {/* Shimmering Royal Avatar */}
                  <div className="relative mt-2">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-[#B88E4B] via-[#996515] to-[#5A3A1A] border-4 border-white shadow-xl flex items-center justify-center text-white text-3xl sm:text-4xl font-serif font-black">
                      {(session?.user?.name || profile?.name || 'Z')[0].toUpperCase()}
                    </div>
                    <span className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-gradient-to-br from-[#B88E4B] to-[#5A3A1A] border-2 border-white flex items-center justify-center text-amber-200 text-xs shadow-md">
                      <Crown size={15} />
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-1.5">
                      <h3 className="font-serif font-black text-xl text-[#1F1612]">
                        {session?.user?.name || profile?.name || 'zain mailk'}
                      </h3>
                      <span className="text-emerald-600 text-xs" title="Verified VIP Patron">✓</span>
                    </div>
                    <p className="text-xs text-[#8C6239] font-medium">
                      {session?.user?.email || profile?.email || 'likafaw536@epaynine.com'}
                    </p>
                  </div>

                  {/* Patron ID with Instant Copy Button */}
                  <div className="w-full bg-[#FAF5EE] rounded-xl border border-[#E7DDD0] p-2.5 flex items-center justify-between">
                    <div className="text-left">
                      <span className="text-[9px] font-mono font-bold text-stone-400 uppercase block">Patron ID</span>
                      <span className="text-xs font-mono font-black text-[#1F1612]">
                        #{(session?.user as any)?.id ? (session.user as any).id.slice(-6).toUpperCase() : '4AIB7N'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const patronId = `#${(session?.user as any)?.id ? (session.user as any).id.slice(-6).toUpperCase() : '4AIB7N'}`;
                        navigator.clipboard.writeText(patronId);
                        setCopiedId(true);
                        toast.success(`Patron ID ${patronId} copied to clipboard`);
                        setTimeout(() => setCopiedId(false), 2500);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#B88E4B] text-[#8C6239] hover:text-white border border-[#E7DDD0] text-[10.5px] font-bold transition-all cursor-pointer shadow-2xs"
                    >
                      {copiedId ? 'Copied! ✓' : 'Copy ID'}
                    </button>
                  </div>

                  {/* VIP Membership Progress Meter */}
                  <div className="w-full text-left space-y-2 pt-2 border-t border-[#E7DDD0]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-black text-[#8C6239] font-serif flex items-center gap-1">
                        <Crown size={12} /> Royal Gold Tier
                      </span>
                      <span className="text-[10px] font-mono text-stone-400">84% to Diamond</span>
                    </div>
                    <div className="w-full bg-[#E7DDD0]/60 rounded-full h-2 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#B88E4B] to-[#D4AF37] w-[84%] rounded-full" />
                    </div>
                    <p className="text-[10px] text-stone-500 italic">
                      Spend Rs. 80,000 more to unlock Royal Diamond Atelier tier.
                    </p>
                  </div>

                  {/* VIP Tier Perks */}
                  <div className="w-full text-left space-y-1 pt-2 border-t border-[#E7DDD0]/60 text-[11px]">
                    <span className="text-[10px] font-mono font-bold text-stone-400 uppercase block mb-1">Your Royal Privileges:</span>
                    <p className="text-[#1F1612] font-medium flex items-center gap-1.5">
                      <Check size={12} className="text-emerald-600" /> Free White-Glove Transit & Installation
                    </p>
                    <p className="text-[#1F1612] font-medium flex items-center gap-1.5">
                      <Check size={12} className="text-emerald-600" /> Lifetime Timber Seasoning Warranty
                    </p>
                    <p className="text-[#1F1612] font-medium flex items-center gap-1.5">
                      <Check size={12} className="text-emerald-600" /> Dedicated Master Artisan Hotline
                    </p>
                  </div>
                </div>

                {/* Right Card: Client Credentials & Bespoke Styling Suite Form */}
                <div className="lg:col-span-8 bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-[24px] border border-[#E7DDD0] p-6 shadow-[0_4px_24px_rgba(44,30,24,0.04)]">
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="pb-2 border-b border-[#E7DDD0]">
                      <span className="text-[9px] font-mono font-black uppercase tracking-wider text-[#8C6239] block">
                        ✦ ARCHITECTURAL SPECIFICATIONS & CONTACT
                      </span>
                      <h3 className="font-serif font-black text-lg text-[#1F1612]">Client Credentials & Bespoke Preferences</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[#7A6354] uppercase tracking-wider flex items-center gap-1.5">
                          <User size={12} className="text-[#B88E4B]" /> Full Legal Name
                        </label>
                        <Input
                          value={profileForm.name}
                          onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                          placeholder="zain mailk"
                          className="rounded-xl border-[#E7DDD0] bg-[#FAF5EE]/40 text-xs h-10 focus:ring-[#B88E4B]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[#7A6354] uppercase tracking-wider flex items-center gap-1.5">
                          <Phone size={12} className="text-[#B88E4B]" /> Direct WhatsApp / Phone
                        </label>
                        <Input
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          placeholder="03238006110"
                          className="rounded-xl border-[#E7DDD0] bg-[#FAF5EE]/40 text-xs h-10 focus:ring-[#B88E4B] font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#7A6354] uppercase tracking-wider flex items-center gap-1.5">
                        <Mail size={12} className="text-[#B88E4B]" /> Registered Email Address (Verified)
                      </label>
                      <div className="relative">
                        <Input
                          value={session?.user?.email || profile?.email || 'likafaw536@epaynine.com'}
                          disabled
                          className="rounded-xl border-[#E7DDD0] bg-[#FAF5EE] text-xs h-10 text-stone-600 font-mono pr-24"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-300">
                          ✓ VERIFIED
                        </span>
                      </div>
                    </div>

                    {/* Timber Polish Preference Selection */}
                    <div className="space-y-1.5 pt-1">
                      <label className="text-[11px] font-bold text-[#7A6354] uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles size={12} className="text-[#B88E4B]" /> Signature Timber Polish Preference
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {['Royal Walnut', 'Natural Sheesham', 'Antique Teak', 'Turkish Gold Leaf'].map((polish) => (
                          <button
                            key={polish}
                            type="button"
                            onClick={() => setSelectedTimberFinish(polish)}
                            className={`py-2 px-2.5 rounded-xl text-xs font-bold text-center border transition-all cursor-pointer ${
                              selectedTimberFinish === polish
                                ? 'bg-gradient-to-r from-[#B88E4B] to-[#8C6239] text-white border-[#B88E4B] shadow-xs'
                                : 'bg-[#FAF5EE]/60 hover:bg-[#FAF5EE] text-[#7A6354] border-[#E7DDD0]'
                            }`}
                          >
                            {polish}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Velvet & Upholstery Preference Selection */}
                    <div className="space-y-1.5 pt-1">
                      <label className="text-[11px] font-bold text-[#7A6354] uppercase tracking-wider flex items-center gap-1.5">
                        <Layers size={12} className="text-[#B88E4B]" /> Preferred Fabric & Upholstery
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {['Turkish Champagne Velvet', 'Emerald Turkish Velvet', 'Italian Tan Leather', 'Royal Navy Velvet'].map((fabric) => (
                          <button
                            key={fabric}
                            type="button"
                            onClick={() => setSelectedFabricPreference(fabric)}
                            className={`py-2 px-2.5 rounded-xl text-[11px] font-bold text-center border transition-all cursor-pointer ${
                              selectedFabricPreference === fabric
                                ? 'bg-gradient-to-r from-[#B88E4B] to-[#8C6239] text-white border-[#B88E4B] shadow-xs'
                                : 'bg-[#FAF5EE]/60 hover:bg-[#FAF5EE] text-[#7A6354] border-[#E7DDD0]'
                            }`}
                          >
                            {fabric}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#7A6354] uppercase tracking-wider flex items-center gap-1.5">
                        <FileText size={12} className="text-[#B88E4B]" /> Architectural & Bespoke Styling Notes (Bio)
                      </label>
                      <Textarea
                        value={profileForm.bio}
                        onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                        placeholder="e.g. Prefer dark walnut polish with Turkish champagne velvet, custom 8-seater dining specifications..."
                        className="rounded-xl border-[#E7DDD0] text-xs bg-[#FAF5EE]/40 focus:ring-[#B88E4B]"
                        rows={3}
                      />
                    </div>

                    <div className="pt-2 flex justify-end">
                      <Button
                        type="submit"
                        className="rounded-xl bg-gradient-to-r from-[#B88E4B] to-[#8C6239] hover:brightness-110 text-white font-serif font-bold text-xs px-7 py-2.5 cursor-pointer shadow-md active:scale-95 transition-all"
                      >
                        Save Profile Changes
                      </Button>
                    </div>
                  </form>
                </div>

              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* TAB 8: SECURITY & 2FA                                     */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {activeTab === 'security' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              
              {/* Top Luxury Header Bar */}
              {renderHeaderBanner(
                '✦ SECURITY SHIELD',
                '✦ ENCRYPTION SHIELD V2.4',
                'ACTIVE 256-BIT',
                'ENTERPRISE ENCRYPTION ACTIVE',
                'Security & Two-Factor',
                'Authentication Guard',
                'Fortify your VIP client portal with hardware TOTP tokens and cryptographic session guards.'
              )}

              {/* 4 Matching KPI Summary Stat Cards */}
              {renderKpiGrid(securityKpis)}

              <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-[#E7DDD0] p-6 shadow-2xs">
                <TwoFactorSetup />
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* TAB 9: SETTINGS                                           */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {activeTab === 'settings' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              
              {/* Top Luxury Header Bar */}
              {renderHeaderBanner(
                '✦ PORTAL CONFIG',
                '✦ PORTAL CONFIG V2.4',
                'AUTO SYNC',
                'AUTOMATIC PREFERENCE SYNC',
                'Client Suite',
                'Preferences & Settings',
                'Configure notifications, bespoke order status alerts, and client portal display formats.'
              )}

              {/* 4 Matching KPI Summary Stat Cards */}
              {renderKpiGrid(settingsKpis)}

              <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-[#E7DDD0] p-6 shadow-2xs">
                <SettingsTab />
              </div>
            </motion.div>
          )}

        </main>
      </div>

      {/* ── MODAL: ORDER DETAILS / INVOICE MODAL ── */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl border border-[#E7DDD0] max-w-lg w-full p-5 shadow-2xl space-y-3.5 relative"
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-[#E7DDD0]">
              <div>
                <p className="text-xs font-mono font-bold text-[#8C6239]">
                  COMMISSION #{selectedOrderDetails.id.slice(-8).toUpperCase()}
                </p>
                <h3 className="font-serif font-black text-base text-[#1F1612]">Invoice & Crafting Specifications</h3>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="w-7 h-7 rounded-full bg-[#FAF5EE] text-stone-500 hover:text-black flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto">
              {(selectedOrderDetails.items || []).map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF5EE]/60 border border-[#E7DDD0]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg overflow-hidden bg-white relative border border-[#E7DDD0]">
                      <Image src={resolveImageUrl(item.image, 'Furniture')} alt={item.name} fill className="object-cover" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#1F1612]">{item.name}</p>
                      <p className="text-[10px] text-stone-500">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-serif font-black text-xs text-[#8C6239]">
                    Rs. {formatPrice(item.price * (item.quantity || 1))}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2.5 border-t border-[#E7DDD0] flex items-center justify-between text-sm">
              <span className="font-bold text-[#1F1612]">Total Commission Value</span>
              <span className="font-serif font-black text-base text-[#B88E4B]">
                Rs. {formatPrice(selectedOrderDetails.totalAmount || 0)}
              </span>
            </div>

            <Button
              onClick={() => {
                toast.success('Official Tax Invoice downloaded successfully');
                setSelectedOrderDetails(null);
              }}
              className="w-full rounded-xl bg-gradient-to-r from-[#B88E4B] to-[#8C6239] hover:brightness-110 text-white text-xs font-bold h-9 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Download size={13} className="mr-1.5" /> Download Tax Invoice & Guarantee (PDF)
            </Button>
          </motion.div>
        </div>
      )}

      {/* ── MODAL: LIVE CRAFTING & FULFILLMENT TRACKER ── */}
      {trackingOrder && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl sm:rounded-[24px] border border-[#E7DDD0] max-w-xl w-full p-6 shadow-2xl space-y-4 relative overflow-hidden"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E7DDD0]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#B88E4B] to-[#8C6239] text-white flex items-center justify-center shadow-xs">
                  <Truck size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-mono font-black text-[#8C6239] uppercase tracking-wider">
                    LIVE CRAFTING RADAR #{trackingOrder.id.slice(-8).toUpperCase()}
                  </p>
                  <h3 className="font-serif font-black text-base text-[#1F1612]">
                    Bespoke Order Journey & Stage Radar
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setTrackingOrder(null)}
                className="w-8 h-8 rounded-full bg-[#FAF5EE] text-stone-500 hover:text-black flex items-center justify-center cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Visual Step Tracker */}
            <div className="space-y-3 py-1">
              {[
                {
                  step: 1,
                  title: 'Bespoke Commission Accepted',
                  desc: 'Order registered in master registry and queued for seasoning.',
                  done: true,
                  active: false,
                  icon: CheckCircle2,
                },
                {
                  step: 2,
                  title: 'Timber Moisture Seasoning & Grading',
                  desc: 'Solid Sheesham wood tested for &lt; 10% kiln moisture equilibrium.',
                  done: true,
                  active: false,
                  icon: CheckCircle2,
                },
                {
                  step: 3,
                  title: 'Artisan Joinery & Hand-Carving',
                  desc: 'Senior craftsmen shaping mortise-and-tenon structural joints.',
                  done: trackingOrder.status === 'SHIPPED' || trackingOrder.status === 'DELIVERED',
                  active: trackingOrder.status === 'PENDING' || !trackingOrder.status,
                  icon: Sparkles,
                },
                {
                  step: 4,
                  title: 'Royal Walnut Multi-Coat Polish & QC',
                  desc: 'Hand-buffed natural lacquer applied and velvet upholstery fitted.',
                  done: trackingOrder.status === 'DELIVERED',
                  active: trackingOrder.status === 'SHIPPED',
                  icon: Layers,
                },
                {
                  step: 5,
                  title: 'White-Glove Fleet Transit & Setup',
                  desc: 'Insured transit to client estate with on-site white-glove placement.',
                  done: trackingOrder.status === 'DELIVERED',
                  active: false,
                  icon: Truck,
                },
              ].map((st, i) => {
                const Icon = st.icon;
                return (
                  <div key={i} className="flex items-start gap-3 relative">
                    {i < 4 && (
                      <div className={`absolute left-4 top-8 w-0.5 h-7 ${
                        st.done ? 'bg-[#B88E4B]' : 'bg-stone-200'
                      }`} />
                    )}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${
                      st.done
                        ? 'bg-[#B88E4B] text-white shadow-xs'
                        : st.active
                        ? 'bg-amber-100 text-[#8C6239] ring-2 ring-[#B88E4B] animate-pulse'
                        : 'bg-stone-100 text-stone-400'
                    }`}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1">
                      <h4 className={`text-xs font-bold ${st.done || st.active ? 'text-[#1F1612]' : 'text-stone-400'}`}>
                        {st.title} {st.active && <span className="text-[10px] text-[#B88E4B] font-mono font-black ml-1">[CURRENT WORKSHOP PHASE]</span>}
                      </h4>
                      <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">{st.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 rounded-xl bg-[#FAF5EE] border border-[#E7DDD0] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-stone-400 uppercase block">Dedicated Concierge</span>
                <span className="text-xs font-bold text-[#1F1612]">Master Artisan Fahad Ali</span>
              </div>
              <a
                href={`https://wa.me/923000000000?text=Hello%20Fahad%20Ali,%20tracking%20Bespoke%20Commission%20%23${trackingOrder.id.slice(-8).toUpperCase()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-2xs"
              >
                <MessageSquare size={12} /> WhatsApp Inquiry
              </a>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── MODAL: QUICK VIEW PRODUCT CRAFTING SPECIFICATIONS ── */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl sm:rounded-[24px] border border-[#E7DDD0] max-w-lg w-full p-5 shadow-2xl space-y-3.5 relative overflow-hidden"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#E7DDD0]">
              <span className="text-[9px] font-mono font-black text-[#8C6239] uppercase tracking-wider">
                ✦ BESPOKE SPECIFICATION SHEET
              </span>
              <button
                onClick={() => setQuickViewProduct(null)}
                className="w-7 h-7 rounded-full bg-[#FAF5EE] text-stone-500 hover:text-black flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="relative aspect-[16/10] bg-[#FAF5EE] rounded-xl overflow-hidden border border-[#E7DDD0]">
              <Image
                src={resolveImageUrl(quickViewProduct.image, quickViewProduct.category)}
                alt={quickViewProduct.name}
                fill
                className="object-cover"
              />
            </div>

            <div>
              <h3 className="font-serif font-black text-lg text-[#1F1612]">{quickViewProduct.name}</h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Category: <span className="font-bold text-[#1F1612]">{quickViewProduct.category || 'Luxury Living Room'}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-xl bg-[#FAF5EE]/70 border border-[#E7DDD0]">
                <span className="text-stone-400 block font-mono text-[9px] uppercase">Timber Type</span>
                <span className="font-bold text-[#1F1612]">Grade-A Solid Sheesham</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FAF5EE]/70 border border-[#E7DDD0]">
                <span className="text-stone-400 block font-mono text-[9px] uppercase">Upholstery</span>
                <span className="font-bold text-[#1F1612]">{quickViewProduct.material || 'Turkish Velvet'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FAF5EE]/70 border border-[#E7DDD0]">
                <span className="text-stone-400 block font-mono text-[9px] uppercase">Warranty</span>
                <span className="font-bold text-emerald-700">10-Year Timber Warranty</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FAF5EE]/70 border border-[#E7DDD0]">
                <span className="text-stone-400 block font-mono text-[9px] uppercase">Transit Service</span>
                <span className="font-bold text-[#8C6239]">Free White-Glove Setup</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#E7DDD0] flex items-center justify-between">
              <div>
                <span className="text-[10px] text-stone-400 block font-mono uppercase">Commission</span>
                <span className="font-serif font-black text-lg text-[#1F1612]">
                  Rs. {formatPrice(quickViewProduct.price)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    addItem(quickViewProduct, 1);
                    openCart();
                    setQuickViewProduct(null);
                    toast.success(`${quickViewProduct.name} added to Shopping Bag`);
                  }}
                  className="rounded-xl bg-gradient-to-r from-[#B88E4B] to-[#8C6239] text-white font-bold text-xs h-9 px-4 cursor-pointer shadow-sm active:scale-95"
                >
                  <ShoppingBag size={13} className="mr-1.5" /> Add to Shopping Bag
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Royal Luxury Live Call Modal */}
      <LuxuryCallModal
        isOpen={isCallOpen}
        callType={callType}
        callStatus={callStatus}
        remoteUserName={currentCaller?.name || 'Atelier Concierge'}
        localStream={localStream}
        remoteStream={remoteStream}
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        callDuration={callDuration}
        connectedAt={callConnectedAt}
        onAccept={acceptIncomingCall}
        onDecline={endCall}
        onEndCall={endCall}
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
      />

    </div>
  );
}
