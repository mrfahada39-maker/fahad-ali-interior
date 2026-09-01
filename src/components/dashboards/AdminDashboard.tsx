'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, MessageSquare, Star,
  Loader2, Trash2, CheckCircle, XCircle, DollarSign, TrendingUp, Box, Plus, Send, Sparkles,
  Headphones, Mail, Inbox, Search, Filter, Lightbulb, MoreVertical, Smile, Paperclip, CheckCheck, Settings, LogOut, Clock, Database, User, Home
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { apiFetch, apiFetchJsonWithStatus, clearEnterpriseTokens } from '@/lib/api-client';
import { apiErrorMessage, ensureEnterpriseTokens } from '@/hooks/use-enterprise-auth-sync';
import { signOut } from 'next-auth/react';
import { defaultProductImage } from '@/lib/images';
import OverviewTab from './admin/tabs/OverviewTab';
import ProductsTab from './admin/tabs/ProductsTab';
import OrdersTab from './admin/tabs/OrdersTab';
import CustomersTab from './admin/tabs/CustomersTab';
import MessagesTab from './admin/tabs/MessagesTab';
import ReviewsTab from './admin/tabs/ReviewsTab';
import BlogTab from './admin/tabs/BlogTab';
import SettingsTab from './admin/tabs/SettingsTab';
import CmsTab from './admin/tabs/CmsTab';
import InquiriesTab from './admin/tabs/InquiriesTab';
import AnalyticsTab from './admin/tabs/AnalyticsTab';
import AiChatbotTab from './admin/tabs/AiChatbotTab';
import AiRadarTab from './admin/tabs/AiRadarTab';
import LuxuryCallModal from '@/components/chat/LuxuryCallModal';
import { toneGenerator, WebRtcCallClient } from '@/lib/webrtc-call-manager';
import { tabs, AdminBundle, STORE_SETTINGS_KEYS, statusStyles } from './admin/tabs/types';

import { useSiteSettingsStore } from '@/store/siteSettingsStore';
import AdminLoginGate from './admin/AdminLoginGate';
import { DEFAULT_ADMIN_STATS, DEFAULT_ADMIN_ORDERS } from '@/lib/admin-defaults';
import { CURATED_FALLBACK_PRODUCTS } from '@/lib/curated-products';

const formatPrice = (n: number) => new Intl.NumberFormat('en-PK').format(n);


function normalizeWhatsapp(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return trimmed;
  if (digits.startsWith('92')) return `https://wa.me/${digits}`;
  if (digits.startsWith('0')) return `https://wa.me/92${digits.slice(1)}`;
  return `https://wa.me/${digits}`;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<any>(DEFAULT_ADMIN_STATS);
  const [analytics, setAnalytics] = useState<any>(null);
  const [products, setProducts] = useState<any[]>(CURATED_FALLBACK_PRODUCTS);
  const [orders, setOrders] = useState<any[]>(DEFAULT_ADMIN_ORDERS);
  const [categories, setCategories] = useState<any[]>([]);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [telemetry, setTelemetry] = useState<any>(null);

  useEffect(() => {
    const fetchTelemetry = () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      fetch('/api/admin/telemetry', { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } })
        .then((res) => res.json())
        .then((data) => {
          if (data && !data.error) {
            setTelemetry(data);
          }
        })
        .catch(() => {});
    };
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 15000);
    return () => clearInterval(interval);
  }, []);

  const [messages, setMessages] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [siteSettings, setSiteSettings] = useState<any>({});
  const [adminAccount, setAdminAccount] = useState({ name: '', email: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState({ current: false, next: false, confirm: false });
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [selectedThreadIndex, setSelectedThreadIndex] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [dbProgress, setDbProgress] = useState(0);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddBlog, setShowAddBlog] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    image: '',
    images: '',
    material: '',
    dimensions: '',
    stockCount: 0,
    isPremium: false,
    compareAtPrice: '',
    woodType: '',
    upholstery: '',
    finish: '',
    leadTime: '',
    warranty: '',
  });
  const [blogForm, setBlogForm] = useState({ id: '', title: '', slug: '', content: '', excerpt: '', image: '', author: 'Admin', isActive: true, tags: '' });
  const seenUserMessageIdsRef = useRef<Set<string>>(new Set());
  const initializedMessageTrackingRef = useRef(false);

  // ── ADMIN CALLING & VOICE NOTE SYSTEM ──
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
  const adminRtcClientRef = useRef<WebRtcCallClient | null>(null);
  const adminIncomingOfferSdpRef = useRef<any>(null);

  const startAdminCall = async (type: 'voice' | 'video', targetUser: any) => {
    setCurrentCaller(targetUser);
    setCallType(type);
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

      const targetId = targetUser?.id || 'client';

      const rtcClient = new WebRtcCallClient(
        (remote) => setRemoteStream(remote),
        async (candidate) => {
          await apiFetch('/api/calls/signal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'candidate', fromUserId: 'admin', toUserId: targetId, candidate }),
          }).catch(() => {});
        }
      );
      rtcClient.init(stream);
      adminRtcClientRef.current = rtcClient;

      const offerSdp = await rtcClient.createOffer();

      await apiFetch('/api/calls/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'initiate',
          fromUserId: 'admin',
          fromUserName: 'Fahad Ali Atelier Concierge',
          toUserId: targetId,
          toUserName: targetUser?.name || 'Valued Client',
          toUserEmail: targetUser?.email || '',
          callType: type,
          offerSdp,
        }),
      });
    } catch {
      toast.error(`Please allow ${type === 'video' ? 'camera and microphone' : 'microphone'} permissions`);
      endAdminCall();
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

      const callerId = currentCaller?.id || 'client';

      const rtcClient = new WebRtcCallClient(
        (remote) => setRemoteStream(remote),
        async (candidate) => {
          await apiFetch('/api/calls/signal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'candidate', fromUserId: 'admin', toUserId: callerId, candidate }),
          }).catch(() => {});
        }
      );
      rtcClient.init(stream);
      adminRtcClientRef.current = rtcClient;

      const answerSdp = adminIncomingOfferSdpRef.current
        ? await rtcClient.createAnswer(adminIncomingOfferSdpRef.current)
        : null;

      callDurationIntervalRef.current = setInterval(() => {
        setCallDuration((d) => d + 1);
      }, 1000);

      await apiFetch('/api/calls/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'accept',
          fromUserId: 'admin',
          toUserId: callerId,
          answerSdp,
        }),
      });
    } catch {
      toast.error('Could not access microphone/camera');
      endAdminCall();
    }
  };

  const endAdminCall = () => {
    toneGenerator.stop();
    if (callDurationIntervalRef.current) clearInterval(callDurationIntervalRef.current);
    if (adminRtcClientRef.current) {
      adminRtcClientRef.current.cleanup();
      adminRtcClientRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
    setIsCallOpen(false);
    setCallStatus('ended');
    setCallConnectedAt(null);

    void apiFetch('/api/calls/signal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'end',
        fromUserId: 'admin',
        toUserId: currentCaller?.id || 'client',
      }),
    });
  };

  const toggleAdminMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
      setIsMuted((prev) => !prev);
    }
  };

  const toggleAdminVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
      setIsVideoOff((prev) => !prev);
    }
  };

  // Background listener for incoming customer calls to Admin
  useEffect(() => {
    const checkIncomingCalls = async () => {
      try {
        const res = await apiFetch('/api/calls/signal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'status', fromUserId: 'admin' }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.session) {
            // Incoming call from Client
            if (data.session.status === 'outgoing' && data.session.fromUserId !== 'admin' && !isCallOpen) {
              adminIncomingOfferSdpRef.current = data.session.offerSdp;
              setCurrentCaller({ id: data.session.fromUserId, name: data.session.fromUserName || 'VIP Customer' });
              setCallType(data.session.callType || 'voice');
              setCallStatus('incoming');
              setIsCallOpen(true);
              toneGenerator.playIncomingRing();
            }
            // Outgoing call answered by Client
            else if (data.session.status === 'connected' && isCallOpen && callStatus === 'outgoing') {
              setCallStatus('connected');
              if (data.session.connectedAt) {
                setCallConnectedAt(data.session.connectedAt);
              }
              toneGenerator.stop();
              if (data.session.answerSdp && adminRtcClientRef.current) {
                await adminRtcClientRef.current.handleAnswer(data.session.answerSdp);
              }
              if (data.session.candidates && adminRtcClientRef.current) {
                for (const c of data.session.candidates) {
                  await adminRtcClientRef.current.addIceCandidate(c);
                }
              }
              if (!callDurationIntervalRef.current) {
                callDurationIntervalRef.current = setInterval(() => {
                  setCallDuration((d) => d + 1);
                }, 1000);
              }
            }
            // Call ended or declined
            else if ((data.session.status === 'ended' || data.session.status === 'declined') && isCallOpen) {
              endAdminCall();
            }
          }
        }
      } catch {}
    };

    const interval = setInterval(checkIncomingCalls, 1500);
    return () => clearInterval(interval);
  }, [isCallOpen, callStatus, currentCaller]);

  const handleSendAdminVoiceNote = async (threadId: string, audioUrl: string, duration: number) => {
    const tempId = 'admin_audio_' + Date.now();
    const optimisticMsg = {
      id: tempId,
      text: `[VOICE_NOTE]:${audioUrl}`,
      sender: 'support',
      userId: threadId,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev: any[]) => {
      if (!Array.isArray(prev)) return [optimisticMsg];
      return prev.map((thread: any) => {
        if (thread.id === threadId) {
          return {
            ...thread,
            messages: [...(thread.messages || []), optimisticMsg],
          };
        }
        return thread;
      });
    });

    try {
      const res = await apiFetch('/api/admin/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: threadId, audioUrl, duration }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.message?.id) {
          setMessages((prev: any[]) => {
            if (!Array.isArray(prev)) return prev;
            return prev.map((thread: any) => {
              if (thread.id === threadId) {
                return {
                  ...thread,
                  messages: (thread.messages || []).map((m: any) => m.id === tempId ? data.message : m),
                };
              }
              return thread;
            });
          });
        }
      }
    } catch {}
  };

  const applyMessageThreads = (messageThreads: unknown) => {
    setMessages(messageThreads as typeof messages);
    const userMessageIds = (messageThreads as any[])
      .flatMap((thread) => (thread.messages || []))
      .filter((msg: any) => msg.sender === 'user')
      .map((msg: any) => msg.id);
    if (!initializedMessageTrackingRef.current) {
      userMessageIds.forEach((id: string) => seenUserMessageIdsRef.current.add(id));
      initializedMessageTrackingRef.current = true;
    }
  };

  const applyBundle = (bundle: AdminBundle) => {
    setStats(bundle.stats);
    const p = bundle.products;
    setProducts(Array.isArray(p) ? p : (p as { products?: unknown[] }).products || []);
    setOrders(bundle.orders);
    applyMessageThreads(bundle.messages);
    setReviews(bundle.reviews);
    setInquiries(bundle.inquiries);
    setSiteSettings(bundle.siteSettings);
    setAnalytics(bundle.analytics);
    setAdminAccount({
      name: bundle.account?.name || '',
      email: bundle.account?.email || '',
      phone: bundle.account?.phone || '',
    });
  };

  const loadAll = async () => {
    setLoading(true);
    setDbProgress(1);
    try {
      let hasToken = await ensureEnterpriseTokens();
      if (!hasToken) {
        setAuthError('Executive authentication required.');
        setLoading(false);
        return;
      }
      setDbProgress(50);

      let result = await apiFetchJsonWithStatus<AdminBundle>('/api/admin/dashboard-bundle');

      if (!result.ok && (result.status === 401 || result.status === 403)) {
        clearEnterpriseTokens();
        hasToken = await ensureEnterpriseTokens(true);
        if (hasToken) {
          result = await apiFetchJsonWithStatus<AdminBundle>('/api/admin/dashboard-bundle');
          setDbProgress(75);
        }
      }

      if (result.ok && result.data) {
        setAuthError(null);
        applyBundle(result.data);
        setDbProgress(100);
        setLoading(false);

        // Fetch secondary non-critical data (blogs and categories) in background
        Promise.all([
          apiFetch('/api/v1/blog'),
          apiFetch('/api/admin/categories'),
        ]).then(async ([blogRes, catRes]) => {
          if (blogRes.ok) {
            const blogData = await blogRes.json();
            setBlogs(blogData);
          }
          if (catRes.ok) {
            const catData = await catRes.json();
            setCategories(Array.isArray(catData.data || catData) ? (catData.data || catData) : []);
          }
        }).catch(() => {});

        return;
      }

      if (result.status === 503) {
        setAuthError('Database connecting, please retry in a few moments.');
        setLoading(false);
        return;
      }

      setAuthError(
        result.status === 403
          ? 'Admin access only — log in with an administrator account.'
          : 'Authentication session expired.',
      );
    } catch {
      setAuthError('Unable to connect to admin services.');
    } finally {
      setDbProgress(100);
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  // Silent 15-second background auto-sync loop (No manual refresh needed ever)
  useEffect(() => {
    const silentSync = async () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      try {
        const res = await apiFetchJsonWithStatus<AdminBundle>('/api/admin/dashboard-bundle');
        if (res.ok && res.data) {
          applyBundle(res.data);
        }
      } catch {}
    };

    const intervalId = setInterval(silentSync, 15000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const pollMessages = async () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      try {
        const res = await apiFetch('/api/admin/messages');
        if (!res.ok) return;
        const messageThreads = await res.json();
        setMessages(messageThreads);

        const newUserMessages = (messageThreads as any[])
          .flatMap((thread) =>
            (thread.messages || [])
              .filter((msg: any) => msg.sender === 'user' && !seenUserMessageIdsRef.current.has(msg.id))
              .map((msg: any) => ({ ...msg, userName: thread.name || 'Customer' }))
          );

        if (newUserMessages.length > 0) {
          newUserMessages.forEach((msg: any) => seenUserMessageIdsRef.current.add(msg.id));
          setUnreadMessageCount((prev) => prev + newUserMessages.length);
          const latest = newUserMessages[newUserMessages.length - 1];
          toast.success(`New message from ${latest.userName}`);
        }
      } catch {
        // Silent polling failure
      }
    };

    const intervalId = setInterval(pollMessages, activeTab === 'messages' ? 2500 : 15000);
    return () => clearInterval(intervalId);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'messages' && unreadMessageCount > 0) {
      setUnreadMessageCount(0);
    }
  }, [activeTab, unreadMessageCount]);

  const updateOrderStatus = async (id: string, status: string) => {
    const res = await apiFetch('/api/admin/orders', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
    if (res.ok) { toast.success('Order updated'); loadAll(); }
  };

  const updateReviewStatus = async (id: string, status: string) => {
    const res = await apiFetch('/api/admin/reviews', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
    if (res.ok) { toast.success(`Review ${status}`); loadAll(); }
  };

  const updateInquiryStatus = async (id: string, status: string) => {
    const res = await apiFetch('/api/admin/inquiries', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
    if (res.ok) { toast.success('Inquiry updated'); loadAll(); }
  };

  const sendAdminReply = async (userId: string) => {
    const text = (replyDrafts[userId] || '').trim();
    if (!text) {
      toast.error('Please write a reply first');
      return;
    }

    // 1. WhatsApp-style instant optimistic message append (0ms latency, NO loading screen)
    const tempId = 'admin_temp_' + Date.now();
    const optimisticMsg = {
      id: tempId,
      text,
      sender: 'support',
      userId,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev: any[]) => {
      if (!Array.isArray(prev)) return [optimisticMsg];
      return prev.map((thread: any) => {
        if (thread.id === userId) {
          return {
            ...thread,
            messages: [...(thread.messages || []), optimisticMsg],
          };
        }
        return thread;
      });
    });

    setReplyDrafts((prev) => ({ ...prev, [userId]: '' }));

    // 2. Background delivery without triggering full reload or loading screens
    try {
      const res = await apiFetch('/api/admin/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, text }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.message?.id) {
          setMessages((prev: any[]) => {
            if (!Array.isArray(prev)) return prev;
            return prev.map((thread: any) => {
              if (thread.id === userId) {
                return {
                  ...thread,
                  messages: (thread.messages || []).map((m: any) => m.id === tempId ? data.message : m),
                };
              }
              return thread;
            });
          });
        }
        return;
      }

      const data = await res.json().catch(() => null);
      toast.error(data?.error || 'Failed to send reply');
    } catch {
      // Keep optimistic message in UI
    }
  };

  const addProduct = async () => {
    if (!productForm.name || !productForm.category) {
      toast.error('Product name and Category are required');
      return;
    }
    const specsObj = {
      compareAtPrice: productForm.compareAtPrice ? Number(productForm.compareAtPrice) : null,
      woodType: productForm.woodType || null,
      upholstery: productForm.upholstery || null,
      finish: productForm.finish || null,
      leadTime: productForm.leadTime || null,
      warranty: productForm.warranty || null,
    };
    const payload = {
      name: productForm.name,
      description: productForm.description,
      price: Number(productForm.price),
      category: productForm.category,
      image: productForm.image,
      images: productForm.images
        ? (typeof productForm.images === 'string' ? productForm.images.split(',').map(i => i.trim()).filter(Boolean) : productForm.images)
        : [],
      material: productForm.material,
      dimensions: productForm.dimensions,
      stockCount: Number(productForm.stockCount),
      isPremium: productForm.isPremium,
      specs: specsObj,
    };
    const method = editingProductId ? 'PUT' : 'POST';
    const body = editingProductId ? { ...payload, id: editingProductId } : payload;
    const res = await apiFetch('/api/admin/products', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      toast.success(editingProductId ? 'Product updated!' : 'Product added!');
      setShowAddProduct(false);
      setEditingProductId(null);
      setProductForm({
        name: '',
        description: '',
        price: 0,
        category: '',
        image: '',
        images: '',
        material: '',
        dimensions: '',
        stockCount: 0,
        isPremium: false,
        compareAtPrice: '',
        woodType: '',
        upholstery: '',
        finish: '',
        leadTime: '',
        warranty: '',
      });
      loadAll();
    } else {
      const errorText = await res.text();
      toast.error(`Error: ${errorText || 'Failed to save product'}`);
    }
  };

  const deleteProduct = async (id: string) => {
    const res = await apiFetch(`/api/admin/products?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Product deleted');
      loadAll();
      return;
    }
    const data = await res.json().catch(() => null);
    toast.error(data?.error || 'Failed to delete product');
  };

  const saveBlog = async () => {
    const payload = {
      title: blogForm.title,
      slug: blogForm.slug,
      content: blogForm.content,
      excerpt: blogForm.excerpt,
      image: blogForm.image,
      author: blogForm.author,
      isActive: blogForm.isActive,
      tags: blogForm.tags ? blogForm.tags.split(',').map(t => t.trim()) : [],
    };
    
    let res;
    if (blogForm.id) {
      res = await apiFetch(`/api/v1/blog/${blogForm.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } else {
      res = await apiFetch('/api/v1/blog', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    }
    
    if (res.ok) {
      toast.success(`Blog post ${blogForm.id ? 'updated' : 'created'}!`);
      setShowAddBlog(false);
      setBlogForm({ id: '', title: '', slug: '', content: '', excerpt: '', image: '', author: 'Admin', isActive: true, tags: '' });
      loadAll();
    } else {
      toast.error('Failed to save blog post');
    }
  };

  const deleteBlog = async (id: string) => {
    const res = await apiFetch(`/api/v1/blog/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Blog post deleted');
      loadAll();
    } else {
      toast.error('Failed to delete blog post');
    }
  };

  const editBlog = (b: any) => {
    setBlogForm({
      id: b.id, title: b.title, slug: b.slug, content: b.content, excerpt: b.excerpt || '',
      image: b.image || '', author: b.author, isActive: b.isActive, tags: (b.tags || []).join(', ')
    });
    setShowAddBlog(true);
  };

  const saveSettings = async () => {
    const payload = STORE_SETTINGS_KEYS.reduce<Record<string, string>>((acc, key) => {
      const raw = siteSettings?.[key];
      let value = raw === null || raw === undefined ? '' : String(raw).trim();
      if (key === 'socialWhatsapp' && value) {
        value = normalizeWhatsapp(value);
      }
      acc[key] = value;
      return acc;
    }, {});

    if (!payload.siteName?.trim()) {
      toast.error('Site name is required');
      return;
    }
    if (!payload.adminEmail) {
      delete payload.adminEmail;
    }

    const res = await apiFetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const updated = await res.json().catch(() => null);
      if (updated) {
        setSiteSettings(updated);
        useSiteSettingsStore.getState().setSettings(updated);
      }
      toast.success('Store settings saved! Changes will appear on the website.');
      loadAll();
      return;
    }

    const data = await res.json().catch(() => null);
    toast.error(data?.error || data?.message || 'Failed to save settings');
  };

  const saveAdminAccount = async () => {
    const payload = {
      name: adminAccount.name.trim(),
      email: adminAccount.email.trim().toLowerCase(),
      phone: adminAccount.phone.trim(),
    };

    const res = await apiFetch('/api/admin/account', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      toast.success('Admin account updated');
      loadAll();
      return;
    }

    const data = await res.json().catch(() => null);
    toast.error(data?.error || 'Failed to update admin account');
  };

  const changeAdminPassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('All password fields are required');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }

    const res = await apiFetch('/api/admin/account', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      }),
    });

    if (res.ok) {
      toast.success('Password changed. Please login again.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        signOut({ callbackUrl: '/?auth=login' });
      }, 800);
      return;
    }

    const data = await res.json().catch(() => null);
    toast.error(data?.error || 'Failed to change password');
  };

  // Generate chart data from analytics
  const revenueChartData = (() => {
    if (!analytics?.revenueByMonth) return [];
    return Object.entries(analytics.revenueByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, revenue]) => ({
        name: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
        revenue: revenue as number,
      }));
  })();

  const orderStatusData = (() => {
    const statusCounts: Record<string, number> = { pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 };
    orders.forEach(o => { if (statusCounts[o.status] !== undefined) statusCounts[o.status]++; });
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  })();

  const categoryChartData = analytics?.categoryDistribution?.map((c: any) => ({
    name: c.category,
    count: c._count?.category || 0,
    value: c._count?.category || 0,
  })) || [];

  // Use only real revenue data from database
  const chartData = revenueChartData;

  const statusColor = (s: string) => {
    return statusStyles[s] || 'bg-white/10 text-white/50';
  };

  if (authError) {
    return (
      <AdminLoginGate
        error={authError}
        onLoginSuccess={() => {
          setAuthError(null);
          loadAll();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-[#FAF7F2] text-[#2D231E] font-sans selection:bg-[#B88E4B] selection:text-black flex flex-row p-3 gap-3 select-none">
      {unreadMessageCount > 0 && activeTab !== 'messages' && (
        <div className="fixed top-24 right-4 z-50 bg-[#A68254] text-white px-4 py-2 rounded-lg shadow-xl text-sm font-semibold">
          {unreadMessageCount} new message{unreadMessageCount > 1 ? 's' : ''} received
        </div>
      )}
      
      {/* ── LEFT SIDEBAR NAVIGATION ($100,000 ULTRA-LUXURY CAPSULE STYLE) ── */}
      <aside className="hidden lg:flex w-18 flex-col gap-2.5 h-full shrink-0 z-30">
        
        {/* Top Navigation Capsule */}
        <div className="bg-white/95 backdrop-blur-md rounded-[26px] border-2 border-[#E7DDD0] py-3.5 px-2 flex flex-col items-center gap-2 shadow-[0_8px_30px_rgba(44,30,24,0.03)] w-full overflow-y-auto scrollbar-hide flex-1 hover:border-[#B88E4B]/35 transition-all">
          
          {/* Live Storefront Home Website Button */}
          <div className="relative group/nav shrink-0 pb-2 mb-1 border-b border-[#E7DDD0]/80 w-full flex justify-center">
            <Link
              href="/"
              className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FAF5EE] to-[#F3E7D3] text-[#8C6239] hover:bg-gradient-to-br hover:from-[#B88E4B] hover:to-[#996515] hover:text-white flex items-center justify-center border border-[#E2D1BC] shadow-2xs hover:shadow-[0_4px_16px_rgba(184,142,75,0.35)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <Home size={19} className="stroke-[2.2]" />
            </Link>

            {/* Tooltip */}
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover/nav:flex items-center z-50 pointer-events-none">
              <div className="bg-[#221814] text-white font-serif font-black text-[11px] px-3 py-1.5 rounded-xl shadow-xl whitespace-nowrap border border-white/10 flex items-center gap-1.5">
                <span className="text-[#B88E4B]">✦</span>
                <span>Go to Storefront Website</span>
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
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-200 relative ${
                    isActive 
                      ? 'bg-gradient-to-br from-[#B88E4B] via-[#A87E47] to-[#8C6239] text-white shadow-[0_4px_16px_rgba(184,142,75,0.35)] scale-105 border border-white/30' 
                      : 'text-[#7A6354] hover:text-[#1F1612] hover:bg-[#FAF5EE] hover:border-[#E2D1BC] border border-transparent'
                  }`}
                >
                  <tab.icon size={19} className="relative z-10 stroke-[2.1]" />
                  
                  {/* Active Indicator Glow Ring */}
                  {isActive && (
                    <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-5 bg-[#B88E4B] rounded-r-full shadow-sm" />
                  )}

                  {/* Unread Message Pill */}
                  {tab.id === 'messages' && unreadMessageCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-pulse">
                      {unreadMessageCount}
                    </span>
                  )}
                </button>

                {/* Floating Tooltip Bubble */}
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover/nav:flex items-center z-50 pointer-events-none">
                  <div className="bg-[#221814] text-white font-serif font-black text-[11px] px-3 py-1.5 rounded-xl shadow-xl whitespace-nowrap border border-white/10 flex items-center gap-1.5">
                    <span className="text-[#B88E4B]">✦</span>
                    {tab.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Configuration Capsule */}
        <div className="bg-white/95 backdrop-blur-md rounded-[26px] border-2 border-[#E7DDD0] py-2.5 px-2 flex flex-col items-center gap-2 shadow-[0_8px_30px_rgba(44,30,24,0.03)] w-full shrink-0 hover:border-[#B88E4B]/35 transition-all">
          
          {/* Settings */}
          <div className="relative group/nav">
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-200 ${
                activeTab === 'settings'
                  ? 'bg-gradient-to-br from-[#B88E4B] via-[#A87E47] to-[#8C6239] text-white shadow-[0_4px_16px_rgba(184,142,75,0.35)] scale-105 border border-white/30'
                  : 'text-[#7A6354] hover:text-[#1F1612] hover:bg-[#FAF5EE] hover:border-[#E2D1BC] border border-transparent'
              }`}
            >
              <Settings size={19} className="group-hover/nav:rotate-45 transition-transform duration-300 stroke-[2.1]" />
            </button>

            {/* Tooltip */}
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover/nav:flex items-center z-50 pointer-events-none">
              <div className="bg-[#221814] text-white font-serif font-black text-[11px] px-3 py-1.5 rounded-xl shadow-xl whitespace-nowrap border border-white/10">
                ⚙️ Enterprise Settings
              </div>
            </div>
          </div>

          {/* Glowing Red Logout Button */}
          <div className="relative group/nav">
            <button 
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500/15 via-red-500/10 to-rose-600/20 text-rose-600 hover:text-white hover:bg-gradient-to-br hover:from-rose-500 hover:to-red-600 flex items-center justify-center border-2 border-rose-400/40 hover:border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.25)] hover:shadow-[0_0_22px_rgba(244,63,94,0.6)] relative cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <LogOut size={18} className="stroke-[2.3] group-hover/nav:-translate-x-0.5 transition-transform" />
              {/* Pulsing Red Glowing Dot */}
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white absolute -bottom-0.5 -right-0.5 shadow-xs animate-pulse" />
            </button>

            {/* Tooltip */}
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover/nav:flex items-center z-50 pointer-events-none">
              <div className="bg-[#221814] text-white font-serif font-black text-[11px] px-3 py-1.5 rounded-xl shadow-xl whitespace-nowrap border border-rose-500/30 flex items-center gap-1.5">
                <LogOut size={12} className="text-rose-400" />
                Sign Out / Logout
              </div>
            </div>
          </div>

        </div>

      </aside>

      {/* ── MOBILE & TABLET DUAL FLOATING LUXURY CARDS (SEPARATE TOP NAVBAR & SEPARATE TAB SLIDER) ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 p-2 sm:p-3 flex flex-col gap-2 bg-gradient-to-b from-[#FAF7F2] via-[#FAF7F2]/95 to-transparent pointer-events-none">
        
        {/* 1. SEPARATE TOP BRAND NAVBAR CARD (ULTRA-LUXURY MASTERPIECE EDITION) */}
        <div className="bg-gradient-to-r from-white via-[#FCFAF7] to-white backdrop-blur-2xl border border-[#E7DDD0] rounded-2xl sm:rounded-[22px] shadow-[0_8px_25px_rgba(44,30,24,0.04)] px-4 py-3 sm:py-3.5 flex items-center justify-between pointer-events-auto relative overflow-hidden group">
          
          {/* Ambient Gold Glimmer in Background */}
          <div className="absolute -top-12 -left-12 w-32 h-32 bg-[#B88E4B]/5 rounded-full blur-xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />

          {/* Left: Storefront Home Button (Pure Glowing Gold Icon) */}
          <Link
            href="/"
            className="w-10 h-10 flex items-center justify-center text-[#8C6239] hover:text-[#B88E4B] transition-all duration-200 active:scale-90 group cursor-pointer shrink-0 relative z-10"
            title="Go to Storefront Website"
          >
            <Home size={18} className="stroke-[2.5] text-[#8C6239] group-hover:text-[#B88E4B] group-hover:scale-115 transition-transform drop-shadow-[0_0_8px_rgba(184,142,75,0.6)]" />
          </Link>

          {/* Center: Brand Title & Executive Suite with Live Pulse Micro-Capsule */}
          <Link href="/admin" className="flex flex-col items-center text-center px-2 group relative z-10">
            <span className="font-serif font-black text-[17px] sm:text-[19px] tracking-tight text-[#1F1612] uppercase leading-none whitespace-nowrap">
              FAHAD ALI <span className="font-serif italic font-normal text-[#C9A24D] text-sm sm:text-base">&</span> <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] bg-clip-text text-transparent font-serif">INTERIOR</span>
            </span>
            <div className="flex items-center gap-1.5 mt-1.5 px-2.5 py-0.5 rounded-full bg-[#FAF5EE]/90 border border-[#E7DDD0] shadow-2xs">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              <span className="text-[8.5px] sm:text-[9.5px] tracking-[0.25em] font-mono font-black text-[#8C6239] uppercase whitespace-nowrap">
                EXECUTIVE SUITE
              </span>
            </div>
          </Link>

          {/* Right: Sign Out Button (Pure Glowing Red Icon) */}
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-10 h-10 flex items-center justify-center text-rose-500 hover:text-rose-600 transition-all duration-200 active:scale-90 group cursor-pointer shrink-0 relative z-10"
            title="Sign Out"
          >
            <LogOut size={18} className="stroke-[2.5] text-rose-500 group-hover:scale-115 transition-transform drop-shadow-[0_0_8px_rgba(244,63,94,0.7)]" />
          </button>

        </div>

        {/* 2. SEPARATE BOTTOM TAB SLIDER CARD (PRECISION SIZED FOR 4 VISIBLE TABS) */}
        <div className="bg-white/95 backdrop-blur-2xl border border-[#E7DDD0] rounded-2xl shadow-[0_4px_20px_rgba(44,30,24,0.035)] p-1 sm:p-1.5 flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-hide pointer-events-auto relative">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const isAiRadar = tab.id === 'ai-control-center';
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-1 sm:gap-1.5 h-[34px] sm:h-[36px] px-2 sm:px-3.5 rounded-xl text-[11px] sm:text-[12.5px] whitespace-nowrap transition-colors duration-200 cursor-pointer shrink-0 z-10 ${
                  isActive
                    ? 'text-white font-black'
                    : 'text-[#6B5345] hover:text-[#18110D] font-bold'
                }`}
              >
                {/* Fluid Framer-Motion Animated Pill Background */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabMobileHighlight"
                    className="absolute inset-0 bg-gradient-to-r from-[#B88E4B] via-[#C9A24D] to-[#996515] rounded-xl shadow-[0_2px_10px_rgba(184,142,75,0.4)] border border-white/25 -z-10"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}

                <tab.icon size={13.5} className={isActive ? 'text-white stroke-[2.2]' : 'text-[#8C6239] shrink-0 stroke-[2.2]'} />
                <span>
                  {isAiRadar ? (
                    <>
                      <span className="sm:hidden">AI Radar</span>
                      <span className="hidden sm:inline">AI Control Radar</span>
                    </>
                  ) : (
                    tab.label
                  )}
                </span>
                {isAiRadar && (
                  <span className="relative flex h-1.5 w-1.5 ml-0.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                  </span>
                )}
                {tab.id === 'messages' && unreadMessageCount > 0 && (
                  <span className="min-w-4 h-4 px-1 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center animate-pulse shadow-xs">
                    {unreadMessageCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full pr-0 pt-[130px] lg:pt-0 min-h-0 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col min-h-0 pb-3"
          >

            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <OverviewTab
                stats={stats}
                analytics={analytics}
                orders={orders}
                setActiveTab={setActiveTab}
              />
            )}

            {/* AI CONTROL RADAR */}
            {activeTab === 'ai-control-center' && (
              <AiRadarTab telemetry={telemetry} stats={stats} />
            )}

            {activeTab === 'products' && (
              <ProductsTab
                products={products}
                categories={categories}
                showAddProduct={showAddProduct}
                setShowAddProduct={setShowAddProduct}
                productForm={productForm}
                setProductForm={setProductForm}
                addProduct={addProduct}
                deleteProduct={deleteProduct}
                defaultProductImage={defaultProductImage}
                editingProductId={editingProductId}
                setEditingProductId={setEditingProductId}
              />
            )}

            {/* ORDERS */}
            {activeTab === 'orders' && (
              <OrdersTab
                orders={orders}
                updateOrderStatus={updateOrderStatus}
              />
            )}

            {/* CUSTOMERS */}
            {activeTab === 'customers' && <CustomersTab />}

            {/* AI CHATBOT */}
            {activeTab === 'ai-chatbot' && <AiChatbotTab />}

            {/* MESSAGES */}
            {activeTab === 'messages' && (
              <MessagesTab
                messages={messages}
                replyDrafts={replyDrafts}
                setReplyDrafts={setReplyDrafts}
                sendAdminReply={sendAdminReply}
                selectedThreadIndex={selectedThreadIndex}
                setSelectedThreadIndex={setSelectedThreadIndex}
                onStartCall={startAdminCall}
                onSendAdminVoiceNote={handleSendAdminVoiceNote}
              />
            )}

            {/* BLOG */}
            {activeTab === 'blog' && (
              <BlogTab
                blogs={blogs}
                blogForm={blogForm}
                setBlogForm={setBlogForm}
                showAddBlog={showAddBlog}
                setShowAddBlog={setShowAddBlog}
                saveBlog={saveBlog}
                deleteBlog={deleteBlog}
                editBlog={editBlog}
              />
            )}

            {/* REVIEWS */}
            {activeTab === 'reviews' && (
              <ReviewsTab
                reviews={reviews}
                updateReviewStatus={updateReviewStatus}
                deleteReview={async (id: string) => {
                  await apiFetch('/api/admin/reviews', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
                  toast.success('Review deleted');
                  loadAll();
                }}
                statusColor={statusColor}
              />
            )}

            {/* INQUIRIES */}
            {activeTab === 'inquiries' && (
              <InquiriesTab
                inquiries={inquiries}
                updateInquiryStatus={updateInquiryStatus}
              />
            )}

            {/* ANALYTICS */}
            {activeTab === 'analytics' && (
              <AnalyticsTab
                stats={stats}
                analytics={analytics}
                orders={orders}
                products={products}
              />
            )}

            {/* CMS Tab */}
            {activeTab === 'cms' && (
              <CmsTab />
            )}

            {/* SETTINGS */}
            {activeTab === 'settings' && (
              <SettingsTab
                siteSettings={siteSettings}
                setSiteSettings={setSiteSettings}
                saveSettings={saveSettings}
                adminAccount={adminAccount}
                setAdminAccount={setAdminAccount}
                saveAdminAccount={saveAdminAccount}
                passwordForm={passwordForm}
                setPasswordForm={setPasswordForm}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                changeAdminPassword={changeAdminPassword}
              />
            )}


          </motion.div>
        </AnimatePresence>
      </main>

      {/* Royal Luxury Call Modal for Admin */}
      <LuxuryCallModal
        isOpen={isCallOpen}
        callType={callType}
        callStatus={callStatus}
        remoteUserName={currentCaller?.name || 'Valued Client'}
        localStream={localStream}
        remoteStream={remoteStream}
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        callDuration={callDuration}
        connectedAt={callConnectedAt}
        onAccept={acceptIncomingCall}
        onDecline={endAdminCall}
        onEndCall={endAdminCall}
        onToggleMute={toggleAdminMute}
        onToggleVideo={toggleAdminVideo}
      />

    </div>
  );
}
