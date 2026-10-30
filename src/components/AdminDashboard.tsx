/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api-client';
import { signOut } from 'next-auth/react';
import { defaultProductImage } from '@/lib/images';
import { BUSINESS_CONTACT } from '@/lib/contact-config';
import dynamic from 'next/dynamic';
import ProductsTab from './ProductsTab';
import OrdersTab from './OrdersTab';
import CustomersTab from './CustomersTab';
import MessagesTab from './MessagesTab';
import ReviewsTab from './ReviewsTab';
import BlogTab from './BlogTab';
import SettingsTab from './AdminSettingsTab';
import CmsTab from './CmsTab';
import InquiriesTab from './InquiriesTab';
import RecycleBinTab from './RecycleBinTab';
const OverviewTab = dynamic(() => import('./OverviewTab'), { ssr: false });
const AnalyticsTab = dynamic(() => import('./AnalyticsTab'), { ssr: false });
const AiChatbotTab = dynamic(() => import('./AiChatbotTab'), { ssr: false });
const AiRadarTab = dynamic(() => import('./AiRadarTab'), { ssr: false });
const DiscountsTab = dynamic(() => import('./DiscountsTab'), { ssr: false });
const LuxuryCallModal = dynamic(() => import('@/components/LuxuryCallModal'), { ssr: false });
import { useAdminCall } from '@/hooks/use-admin-call';
import { AdminNavigationChrome } from '@/components/admin/AdminNavigationChrome';
import { PaymentVerificationsTab } from '@/components/admin/PaymentVerificationsTab';
import { AdminBundle, STORE_SETTINGS_KEYS, statusStyles } from './admin-tab-types';

import { useSiteSettingsStore } from '@/store';
import { DEFAULT_ADMIN_STATS } from '@/lib/utils';


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

  // Synchronous cache snapshot for instant 0ms initial render (Zero blank page / zero loading delay)
  const [stats, setStats] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('fahad_admin_live_bundle');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.stats) return parsed.stats;
        }
      } catch { }
    }
    return DEFAULT_ADMIN_STATS;
  });

  const [analytics, setAnalytics] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('fahad_admin_live_bundle');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.analytics) return parsed.analytics;
        }
      } catch { }
    }
    return null;
  });

  const [products, setProducts] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('fahad_admin_live_bundle');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.products) {
            return Array.isArray(parsed.products) ? parsed.products : (parsed.products?.products || []);
          }
        }
      } catch { }
    }
    return [];
  });

  const [orders, setOrders] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('fahad_admin_live_bundle');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed?.orders)) return parsed.orders;
        }
      } catch { }
    }
    return [];
  });

  const [users, setUsers] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('fahad_admin_live_bundle');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed?.users)) return parsed.users;
        }
      } catch { }
    }
    return [];
  });

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
        .catch(() => { });
    };
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 30000);
    return () => clearInterval(interval);
  }, []);

  const [messages, setMessages] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('fahad_admin_live_bundle');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed?.messages)) return parsed.messages;
        }
      } catch { }
    }
    return [];
  });

  const [reviews, setReviews] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('fahad_admin_live_bundle');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed?.reviews)) return parsed.reviews;
        }
      } catch { }
    }
    return [];
  });

  const [blogs, setBlogs] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('fahad_admin_live_bundle');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed?.inquiries)) return parsed.inquiries;
        }
      } catch { }
    }
    return [];
  });

  const [siteSettings, setSiteSettings] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('fahad_admin_live_bundle');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.siteSettings) return parsed.siteSettings;
        }
      } catch { }
    }
    return {};
  });

  const [adminAccount, setAdminAccount] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('fahad_admin_live_bundle');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.account) {
            return {
              name: parsed.account.name || 'Fahad Ali',
              email: parsed.account.email || BUSINESS_CONTACT.adminEmail,
              phone: parsed.account.phone || BUSINESS_CONTACT.phone,
            };
          }
        }
      } catch { }
    }
    return { name: 'Fahad Ali', email: BUSINESS_CONTACT.adminEmail, phone: BUSINESS_CONTACT.phone };
  });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState({ current: false, next: false, confirm: false });
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [selectedThreadIndex, setSelectedThreadIndex] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
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
  const {
    isCallOpen,
    callType,
    callStatus,
    currentCaller,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    callDuration,
    callConnectedAt,
    startAdminCall,
    acceptIncomingCall,
    endAdminCall,
    toggleAdminMute,
    toggleAdminVideo,
  } = useAdminCall();

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
    } catch { }
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

  const applyBundle = (bundle: AdminBundle, saveToCache = true) => {
    if (!bundle) return;
    if (bundle.stats) setStats(bundle.stats);
    if (bundle.products) {
      const p = bundle.products;
      setProducts(Array.isArray(p) ? p : (p as { products?: unknown[] }).products || []);
    }
    if (Array.isArray(bundle.orders)) setOrders(bundle.orders);
    const bUsers = Array.isArray(bundle.users) ? bundle.users : (bundle as any).customers;
    if (Array.isArray(bUsers)) setUsers(bUsers);
    if (bundle.messages) applyMessageThreads(bundle.messages);
    if (Array.isArray(bundle.reviews)) setReviews(bundle.reviews);
    if (Array.isArray(bundle.inquiries)) setInquiries(bundle.inquiries);
    if (bundle.siteSettings) setSiteSettings(bundle.siteSettings);
    if (bundle.analytics) setAnalytics(bundle.analytics);
    if (bundle.account) {
      setAdminAccount({
        name: bundle.account?.name || '',
        email: bundle.account?.email || '',
        phone: bundle.account?.phone || '',
      });
    }

    if (saveToCache && typeof window !== 'undefined') {
      try {
        localStorage.setItem('fahad_admin_live_bundle', JSON.stringify(bundle));
      } catch { }
    }
  };

  const loadAll = async () => {
    try {
      const res = await fetch('/api/v1/admin/dashboard-bundle', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });

      if (res.ok) {
        const bundle = (await res.json()) as AdminBundle;
        if (bundle && bundle.stats) {
          applyBundle(bundle, true);
        }
      }

      // Fetch secondary non-critical data (blogs and categories) in background
      fetch('/api/v1/blog', { cache: 'no-store' })
        .then((r) => r.ok ? r.json() : null)
        .then((data) => { if (data) setBlogs(data); })
        .catch(() => { });

      fetch('/api/v1/admin/categories', { cache: 'no-store' })
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (data) setCategories(Array.isArray(data.data || data) ? (data.data || data) : []);
        })
        .catch(() => { });
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    // 0ms Instant SWR Cache Hydration (Render immediately without waiting)
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('fahad_admin_live_bundle');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.stats) {
            applyBundle(parsed, false);
          }
        }
      } catch { }
    }
    loadAll();
  }, []);

  // Fast 6-second background live sync loop + instant sync on tab focus
  useEffect(() => {
    const silentSync = async () => {
      try {
        const res = await fetch('/api/v1/admin/dashboard-bundle', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
          },
        });
        if (res.ok) {
          const bundle = (await res.json()) as AdminBundle;
          if (bundle && bundle.stats) {
            applyBundle(bundle);
          }
        }
      } catch { }
    };

    const intervalId = setInterval(silentSync, 6000);

    const onFocus = () => silentSync();
    const onVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        silentSync();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', onFocus);
      document.addEventListener('visibilitychange', onVisibility);
    }

    return () => {
      clearInterval(intervalId);
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', onFocus);
        document.removeEventListener('visibilitychange', onVisibility);
      }
    };
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

    const intervalId = setInterval(pollMessages, activeTab === 'messages' ? 5000 : 30000);
    return () => clearInterval(intervalId);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'messages' && unreadMessageCount > 0) {
      setUnreadMessageCount(0);
    }
  }, [activeTab, unreadMessageCount]);

  const updateOrderStatus = async (id: string, status: string, paymentStatus?: string) => {
    setOrders((prev: any[]) =>
      prev.map((o) =>
        o.id === id
          ? { ...o, status, ...(paymentStatus ? { paymentStatus } : {}) }
          : o
      )
    );
    toast.success(`Order updated: ${status}${paymentStatus ? ` (${paymentStatus})` : ''}`);
    const res = await apiFetch('/api/admin/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, ...(paymentStatus ? { paymentStatus } : {}) }),
    });
    if (!res.ok) {
      toast.error('Failed to update order');
      loadAll();
    }
  };

  const updateReviewStatus = async (id: string, status: string) => {
    try {
      const res = await apiFetch('/api/admin/reviews', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
      if (res.ok) {
        setReviews((prev: any[]) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
        toast.success(`Review ${status}`);
      } else {
        toast.error('Failed to update review');
      }
    } catch {
      toast.error('Network error updating review');
    }
  };

  const updateInquiryStatus = async (id: string, status: string) => {
    try {
      const res = await apiFetch('/api/admin/inquiries', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
      if (res.ok) {
        setInquiries((prev: any[]) => prev.map((inq) => (inq.id === id ? { ...inq, status } : inq)));
        toast.success('Inquiry updated');
      } else {
        toast.error('Failed to update inquiry');
      }
    } catch {
      toast.error('Network error updating inquiry');
    }
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
    if (isSubmittingProduct) return;
    if (!productForm.name || !productForm.category) {
      toast.error('Product name and Category are required');
      return;
    }
    if (!productForm.image?.trim()) {
      toast.error('Primary product showcase image is required');
      return;
    }
    setIsSubmittingProduct(true);
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
    const editingId = editingProductId;

    // 0ms instant UI close and form clear
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

    try {
      const res = await apiFetch('/api/admin/products', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const saved = await res.json().catch(() => null);
        if (saved && saved.id) {
          setProducts((prev) => {
            const arr = Array.isArray(prev) ? prev : [];
            if (editingId) {
              return arr.map((p) => (p.id === editingId ? { ...p, ...saved } : p));
            }
            return [saved, ...arr.filter((p) => p.id !== saved.id)];
          });
          if (!editingId) {
            setStats((prev: any) => ({ ...prev, totalProducts: (prev?.totalProducts || 0) + 1 }));
          }
        }
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('fahad_catalog_updated', String(Date.now()));
            window.dispatchEvent(new Event('fahad_catalog_updated'));
          } catch { }
        }
        toast.success(editingId ? 'Product updated!' : 'Product published!');
      } else {
        const errorText = await res.text();
        toast.error(`Error: ${errorText || 'Failed to save product'}`);
        loadAll();
      }
    } catch {
      toast.error('Network error saving product');
      loadAll();
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (deletingProductId) return;
    setDeletingProductId(id);
    try {
      const res = await apiFetch(`/api/admin/products?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res.ok) {
        setProducts((prev) => (Array.isArray(prev) ? prev.filter((p) => p.id !== id) : []));
        setStats((prev: any) => ({ ...prev, totalProducts: Math.max(0, (prev?.totalProducts || 1) - 1) }));
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('fahad_catalog_updated', String(Date.now()));
            window.dispatchEvent(new Event('fahad_catalog_updated'));
          } catch { }
        }
        toast.success('Product permanently deleted from database');
      } else {
        const data = await res.json().catch(() => null);
        toast.error(data?.error || 'Failed to delete product from database');
      }
    } catch {
      toast.error('Network error. Failed to delete product.');
    } finally {
      setDeletingProductId(null);
    }
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
    const blogId = blogForm.id;
    setShowAddBlog(false);
    setBlogForm({ id: '', title: '', slug: '', content: '', excerpt: '', image: '', author: 'Admin', isActive: true, tags: '' });

    let res;
    if (blogId) {
      res = await apiFetch(`/api/v1/blog/${blogId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } else {
      res = await apiFetch('/api/v1/blog', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    }

    if (res.ok) {
      const saved = await res.json().catch(() => null);
      if (saved && saved.id) {
        setBlogs((prev) => {
          const arr = Array.isArray(prev) ? prev : [];
          if (blogId) return arr.map((b) => (b.id === blogId ? { ...b, ...saved } : b));
          return [saved, ...arr];
        });
      }
      toast.success(`Blog post ${blogId ? 'updated' : 'created'}!`);
    } else {
      toast.error('Failed to save blog post');
      loadAll();
    }
  };

  const deleteBlog = async (id: string) => {
    try {
      const res = await apiFetch(`/api/v1/blog/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setBlogs((prev: any[]) => prev.filter((b) => b.id !== id));
        toast.success('Blog post permanently deleted');
      } else {
        toast.error('Failed to delete blog post');
      }
    } catch {
      toast.error('Network error deleting blog post');
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
    if (
      passwordForm.newPassword.length < 10 ||
      !/[A-Za-z]/.test(passwordForm.newPassword) ||
      !/[0-9]/.test(passwordForm.newPassword)
    ) {
      toast.error('New password must be at least 10 characters and include a letter and a number');
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

  const statusColor = (s: string) => {
    return statusStyles[s] || 'bg-white/10 text-white/50';
  };

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-[#FAF7F2] text-[#2D231E] font-sans selection:bg-[#B88E4B] selection:text-black flex flex-row p-2 sm:p-3 gap-2 sm:gap-3 select-none">
      {unreadMessageCount > 0 && activeTab !== 'messages' && (
        <div className="fixed top-24 right-4 z-50 bg-[#A68254] text-white px-4 py-2 rounded-lg shadow-xl text-sm font-semibold">
          {unreadMessageCount} new message{unreadMessageCount > 1 ? 's' : ''} received
        </div>
      )}

      <AdminNavigationChrome
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unreadMessageCount={unreadMessageCount}
        pendingVerificationCount={
          (orders || []).filter(
            (o: any) => (o.paymentStatus || '').toUpperCase() === 'AWAITING_VERIFICATION'
          ).length
        }
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full pr-0 pt-[118px] sm:pt-[124px] lg:pt-0 min-h-0 overflow-y-auto">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0.9 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.05 }}
          className="flex-1 flex flex-col min-h-0 pb-24 lg:pb-3"
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
              isSubmittingProduct={isSubmittingProduct}
              deletingProductId={deletingProductId}
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

          {/* PAYMENT SLIP VERIFICATIONS */}
          {activeTab === 'payment-verifications' && (
            <PaymentVerificationsTab
              orders={orders}
              updateOrderStatus={updateOrderStatus}
              onRefresh={loadAll}
            />
          )}

          {/* DISCOUNTS & PROMOTIONAL COUPONS */}
          {activeTab === 'discounts' && (
            <DiscountsTab />
          )}

          {/* CUSTOMERS */}
          {activeTab === 'customers' && <CustomersTab initialUsers={users} />}

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
                try {
                  const res = await apiFetch('/api/admin/reviews', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
                  if (res.ok) {
                    setReviews((prev: any[]) => prev.filter((r) => r.id !== id));
                    toast.success('Review permanently deleted');
                  } else {
                    toast.error('Failed to delete review');
                  }
                } catch {
                  toast.error('Network error deleting review');
                }
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

          {/* RECYCLE BIN */}
          {activeTab === 'recycle-bin' && (
            <RecycleBinTab />
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
