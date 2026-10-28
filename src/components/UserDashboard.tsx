/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useWishlistStore, useCartStore } from '@/store';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api-client';
import LuxuryCallModal from '@/components/LuxuryCallModal';
import { useUserCall } from '@/hooks/use-user-call';
import { UserOrderModals } from '@/components/user-dashboard/UserOrderModals';
import { buildDashboardKpis } from '@/components/user-dashboard/dashboard-kpis';
import { DashboardSidebarAndMobileNav, DashboardTopTabDock } from '@/components/user-dashboard/DashboardNav';
import { DashboardOverviewTab, DashboardOrdersTab } from '@/components/user-dashboard/DashboardOverviewOrdersTabs';
import { DashboardWishlistTab, DashboardConciergeTab } from '@/components/user-dashboard/DashboardWishlistConciergeTabs';
import { DashboardReviewsTab, DashboardAddressesTab } from '@/components/user-dashboard/DashboardReviewsAddressesTabs';
import {
  DashboardProfileTab,
  DashboardSecurityTab,
  DashboardSettingsTab,
} from '@/components/user-dashboard/DashboardProfileSecuritySettingsTabs';

const DEFAULT_USER_STATS = {
  totalSpent: 0,
  totalOrders: 0,
  completedOrders: 0,
  activeTickets: 0,
  loyaltyPoints: 0,
  wishlistCount: 0,
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
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', bio: '' });
  const [addrForm, setAddrForm] = useState({ name: '', phone: '', address: '', city: '', province: '', isDefault: false });
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [myReviews, setMyReviews] = useState<any[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ productId: '', rating: 5, comment: '', image: '' });
  const [reviewUploading, setReviewUploading] = useState(false);
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab) {
        setActiveTab(tab);
      }
    }
  }, []);

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
    startCall,
    acceptIncomingCall,
    endCall,
    toggleMute,
    toggleVideo,
  } = useUserCall(
    session?.user as { id?: string; name?: string | null; email?: string | null } | undefined,
    profile
  );

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
          setMessages((prev) => prev.map((m) => (m.id === tempId ? created : m)));
        }
      }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (activeTab === 'concierge') {
      userChatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, activeTab]);

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
      } catch { /* ignore */ }
    }, 2500);
    return () => clearInterval(interval);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'reviews') return;
    const fetchReviews = () => {
      apiFetch('/api/reviews/my-reviews')
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          const fresh = Array.isArray(data) ? data : data.reviews || data.data || [];
          setMyReviews(fresh);
        })
        .catch(() => {});
    };
    fetchReviews();
    const interval = setInterval(fetchReviews, 3000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const loadAllData = async () => {
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
        if (data.timberFinish) setSelectedTimberFinish(data.timberFinish);
        if (data.fabricPreference) setSelectedFabricPreference(data.fabricPreference);
      }
      if (addrRes.status === 'fulfilled' && addrRes.value.ok) {
        const data = await addrRes.value.json();
        setAddresses(Array.isArray(data) ? data : []);
      }
      if (revRes.status === 'fulfilled' && revRes.value.ok) {
        const data = await revRes.value.json();
        setMyReviews(Array.isArray(data) ? data : data.reviews || data.data || []);
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
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const groupedProducts = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const p of products) {
      const cat = p.category || 'Living Room';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(p);
    }
    return Array.from(map.entries());
  }, [products]);

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
            image: w.product.image || '/cat-thumb-sofas-2x.webp',
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
            image: item.image || '/cat-thumb-sofas-2x.webp',
            category: item.category || 'Living Room',
            material: item.material || 'Solid Sheesham Wood',
          },
        });
      }
    });
    return Array.from(map.values());
  }, [dbWishlist, localWishlistItems]);

  const filteredOrders = useMemo(() => {
    return (orders || []).filter((o) => {
      if (!o) return false;
      const statusUpper = String(o.status || 'PENDING').toUpperCase();
      if (orderFilter === 'PENDING' && statusUpper !== 'PENDING') return false;
      if (orderFilter === 'SHIPPED' && !['SHIPPED', 'PROCESSING'].includes(statusUpper)) return false;
      if (orderFilter === 'DELIVERED' && statusUpper !== 'DELIVERED') return false;

      const rawQ = searchQuery.trim();
      if (!rawQ) return true;

      const q = rawQ.toLowerCase();
      const cleanQ = q.replace(/^[#\s]+/, '');
      const digitsQ = q.replace(/\D/g, '');

      const orderId = String(o.id || '').toLowerCase();
      const shortId = orderId.slice(-8);
      const matchId = orderId.includes(q) || (cleanQ.length > 0 && (orderId.includes(cleanQ) || shortId.includes(cleanQ)));

      const clientName = String(
        o.customerName || o.shippingName || o.shippingInfo?.name || o.user?.name || session?.user?.name || profile?.name || ''
      ).toLowerCase();
      const matchName = clientName.includes(q) || (cleanQ.length > 0 && clientName.includes(cleanQ));

      const clientEmail = String(
        o.customerEmail || o.shippingEmail || o.shippingInfo?.email || o.user?.email || session?.user?.email || profile?.email || ''
      ).toLowerCase();
      const matchEmail = clientEmail.includes(q) || (cleanQ.length > 0 && clientEmail.includes(cleanQ));

      const rawPhone = String(
        o.customerPhone || o.shippingPhone || o.shippingInfo?.phone || o.user?.phone || profileForm.phone || ''
      );
      const phoneDigits = rawPhone.replace(/\D/g, '');
      const matchPhone =
        (rawPhone.length > 0 && rawPhone.toLowerCase().includes(q)) ||
        (digitsQ.length >= 3 && phoneDigits.includes(digitsQ));

      const destination = `${o.shippingAddress || o.shippingInfo?.address || ''} ${o.shippingCity || o.shippingInfo?.city || ''}`.toLowerCase();
      const matchDestination = destination.includes(q) || (cleanQ.length > 0 && destination.includes(cleanQ));

      const matchItems = Boolean(
        Array.isArray(o.items) &&
          o.items.some((i: any) => {
            const title = String(i?.name || i?.productName || i?.title || i?.product?.name || '').toLowerCase();
            return title.includes(q) || (cleanQ.length > 0 && title.includes(cleanQ));
          })
      );

      const statusText = String(o.status || '').toLowerCase();
      const matchStatus = statusText.includes(q) || (cleanQ.length > 0 && statusText.includes(cleanQ));

      const amountStr = String(o.totalAmount || '');
      const matchAmount = digitsQ.length >= 3 && amountStr.includes(digitsQ);

      return matchId || matchName || matchEmail || matchPhone || matchDestination || matchItems || matchStatus || matchAmount;
    });
  }, [orders, orderFilter, searchQuery, session?.user?.name, session?.user?.email, profile?.name, profile?.email, profileForm.phone]);

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

  const trajectoryData = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const buckets: Array<{ key: string; name: string; revenue: number; count: number }> = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      buckets.push({ key, name: monthNames[d.getMonth()], revenue: 0, count: 0 });
    }
    const bucketMap = new Map(buckets.map((b) => [b.key, b]));
    for (const o of orders || []) {
      const dt = o?.createdAt ? new Date(o.createdAt) : now;
      const validDate = Number.isNaN(dt.getTime()) ? now : dt;
      const key = `${validDate.getFullYear()}-${validDate.getMonth()}`;
      const bucket = bucketMap.get(key) || buckets[buckets.length - 1];
      if (bucket) {
        bucket.revenue += Number(o?.totalAmount || 0);
        bucket.count += 1;
      }
    }
    return buckets.map(({ name, revenue, count }) => ({ name, revenue, count }));
  }, [orders]);

  const fulfillmentData = useMemo(() => {
    const pendingCount = (orders || []).filter((o) => !o?.status || String(o.status).toUpperCase() === 'PENDING').length;
    const processingCount = (orders || []).filter((o) => String(o?.status || '').toUpperCase() === 'PROCESSING').length;
    const shippedCount = (orders || []).filter((o) => String(o?.status || '').toUpperCase() === 'SHIPPED').length;
    const deliveredCount = (orders || []).filter((o) => String(o?.status || '').toUpperCase() === 'DELIVERED').length;
    const cancelledCount = (orders || []).filter((o) => String(o?.status || '').toUpperCase() === 'CANCELLED').length;

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
      image: product.image || '/cat-thumb-sofas-2x.webp',
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
        body: JSON.stringify({
          ...profileForm,
          timberFinish: selectedTimberFinish,
          fabricPreference: selectedFabricPreference,
        }),
      });
      if (res.ok) {
        toast.success('Royal Profile & Bespoke Preferences updated successfully');
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

    const tempId = 'user_temp_' + Date.now();
    const optimisticMsg = {
      id: tempId,
      text,
      sender: 'user',
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setMsgInput('');

    try {
      const res = await apiFetch('/api/user/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      if (res.ok) {
        const created = await res.json().catch(() => null);
        if (created?.id) {
          setMessages((prev) => prev.map((m) => (m.id === tempId ? created : m)));
        }
      }
    } catch { /* ignore */ }
  };

  const handleReviewImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG, PNG, WebP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    setReviewUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await apiFetch('/api/v1/uploads/image?folder=fahad-ali-interior/reviews', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();
      const imageUrl = data.url || data.secure_url || data.imageUrl || '';
      if (imageUrl) {
        setReviewForm((prev) => ({ ...prev, image: imageUrl }));
        toast.success('Piece photo attached successfully');
      } else {
        toast.error('Failed to get uploaded image URL');
      }
    } catch {
      toast.error('Image upload failed. Please try again.');
    } finally {
      setReviewUploading(false);
      e.target.value = '';
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
        setReviewForm({ productId: '', rating: 5, comment: '', image: '' });
        loadAllData();
      }
    } catch {
      toast.error('Failed to submit review');
    }
  };

  const handleDeleteReview = async (id: string) => {
    try {
      setMyReviews((prev) => prev.filter((r) => r.id !== id));
      toast.success('Review removed');
      await apiFetch(`/api/v1/user/reviews?id=${id}`, { method: 'DELETE' });
    } catch {
      toast.error('Failed to remove review');
      loadAllData();
    }
  };

  const totalSpentCalculated = Number(
    stats?.totalSpent ?? (orders || []).reduce((sum, o) => sum + Number(o?.totalAmount || 0), 0)
  );
  const totalOrdersCount = (orders || []).length || Number(stats?.totalOrders ?? 0);
  const deliveredCount = (orders || []).filter((o) => String(o?.status || '').toUpperCase() === 'DELIVERED').length;

  const {
    overviewKpis,
    ordersKpis,
    wishlistKpis,
    conciergeKpis,
    reviewsKpis,
    addressesKpis,
    profileKpis,
    securityKpis,
    settingsKpis,
  } = buildDashboardKpis({
    totalSpentCalculated,
    totalOrdersCount,
    deliveredCount,
    orders,
    mergedWishlist,
    stats,
    myReviews,
    addresses,
  });

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1F1612] flex flex-col font-sans selection:bg-[#B88E4B]/20 relative">
      <DashboardSidebarAndMobileNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mergedWishlistLength={mergedWishlist.length}
        ordersLength={orders.length}
      />

      <div className="flex-1 lg:pl-[108px] pt-[124px] lg:pt-0 flex flex-col min-w-0">
        <main className="flex-1 flex flex-col min-w-0 p-3 sm:p-4 lg:p-5 pb-24 lg:pb-5 gap-3.5 max-w-[1700px] w-full mx-auto">
          <DashboardTopTabDock
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            ordersLength={orders.length}
            mergedWishlistLength={mergedWishlist.length}
          />

          {activeTab === 'overview' && (
            <DashboardOverviewTab
              overviewKpis={overviewKpis}
              chartMetric={chartMetric}
              setChartMetric={setChartMetric}
              totalSpentCalculated={totalSpentCalculated}
              orders={orders}
              trajectoryData={trajectoryData}
              fulfillmentData={fulfillmentData}
            />
          )}

          {activeTab === 'orders' && (
            <DashboardOrdersTab
              ordersKpis={ordersKpis}
              orders={orders}
              orderFilter={orderFilter}
              setOrderFilter={setOrderFilter}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filteredOrders={filteredOrders}
              session={session}
              profile={profile}
              profileForm={profileForm}
              setTrackingOrder={setTrackingOrder}
              setSelectedOrderDetails={setSelectedOrderDetails}
            />
          )}

          {activeTab === 'wishlist' && (
            <DashboardWishlistTab
              mergedWishlist={mergedWishlist}
              wishlistKpis={wishlistKpis}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              wishlistCategoryFilter={wishlistCategoryFilter}
              setWishlistCategoryFilter={setWishlistCategoryFilter}
              addItem={addItem}
              openCart={openCart}
              filteredWishlist={filteredWishlist}
              setQuickViewProduct={setQuickViewProduct}
              handleMoveToCart={handleMoveToCart}
              handleRemoveWishlist={handleRemoveWishlist}
            />
          )}

          {activeTab === 'concierge' && (
            <DashboardConciergeTab
              conciergeKpis={conciergeKpis}
              startCall={startCall}
              messages={messages}
              userChatBottomRef={userChatBottomRef}
              msgInput={msgInput}
              setMsgInput={setMsgInput}
              handleSendMessage={handleSendMessage}
              handleSendVoiceNote={handleSendVoiceNote}
            />
          )}

          {activeTab === 'reviews' && (
            <DashboardReviewsTab
              myReviews={myReviews}
              reviewsKpis={reviewsKpis}
              showReviewForm={showReviewForm}
              setShowReviewForm={setShowReviewForm}
              handleSubmitReview={handleSubmitReview}
              reviewForm={reviewForm}
              setReviewForm={setReviewForm}
              groupedProducts={groupedProducts}
              reviewUploading={reviewUploading}
              handleReviewImageUpload={handleReviewImageUpload}
              handleDeleteReview={handleDeleteReview}
            />
          )}

          {activeTab === 'addresses' && (
            <DashboardAddressesTab
              addresses={addresses}
              addressesKpis={addressesKpis}
              showAddrForm={showAddrForm}
              setShowAddrForm={setShowAddrForm}
              handleAddAddress={handleAddAddress}
              addrForm={addrForm}
              setAddrForm={setAddrForm}
              handleDeleteAddress={handleDeleteAddress}
            />
          )}

          {activeTab === 'profile' && (
            <DashboardProfileTab
              profileKpis={profileKpis}
              session={session}
              profile={profile}
              copiedId={copiedId}
              setCopiedId={setCopiedId}
              totalSpentCalculated={totalSpentCalculated}
              handleSaveProfile={handleSaveProfile}
              profileForm={profileForm}
              setProfileForm={setProfileForm}
              selectedTimberFinish={selectedTimberFinish}
              setSelectedTimberFinish={setSelectedTimberFinish}
              selectedFabricPreference={selectedFabricPreference}
              setSelectedFabricPreference={setSelectedFabricPreference}
            />
          )}

          {activeTab === 'security' && <DashboardSecurityTab securityKpis={securityKpis} />}

          {activeTab === 'settings' && <DashboardSettingsTab settingsKpis={settingsKpis} profile={profile} />}
        </main>
      </div>

      <UserOrderModals
        selectedOrderDetails={selectedOrderDetails}
        setSelectedOrderDetails={setSelectedOrderDetails}
        trackingOrder={trackingOrder}
        setTrackingOrder={setTrackingOrder}
        quickViewProduct={quickViewProduct}
        setQuickViewProduct={setQuickViewProduct}
        onAddQuickViewToCart={(prod) => {
          addItem({
            id: prod.id,
            name: prod.name,
            price: Number(prod.price || 0),
            image: prod.image || '/cat-thumb-sofas-2x.webp',
            category: prod.category || 'Furniture',
          });
          openCart();
          setQuickViewProduct(null);
          toast.success(`${prod.name} added to Shopping Bag`);
        }}
      />

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
