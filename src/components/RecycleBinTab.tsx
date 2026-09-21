'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2,
  RotateCcw,
  Search,
  RefreshCw,
  FolderOpen,
  Armchair,
  ShoppingBag,
  Star,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Info,
  Calendar,
  User,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { Badge } from '@/components/badge';
import { toast } from 'sonner';

type RecycleSection = 'ALL' | 'PRODUCT' | 'CATEGORY' | 'ORDER' | 'REVIEW';

interface RecycleBinItem {
  id: string;
  entityType: 'PRODUCT' | 'CATEGORY' | 'ORDER' | 'REVIEW';
  entityId: string;
  name: string;
  payload: any;
  deletedBy?: string | null;
  deletedAt: string;
}

interface Counts {
  ALL: number;
  PRODUCT: number;
  CATEGORY: number;
  ORDER: number;
  REVIEW: number;
}

const SECTION_CONFIG: Record<
  RecycleSection,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  ALL: { label: 'All Items', icon: Layers, color: 'text-amber-400' },
  PRODUCT: { label: 'Products', icon: Armchair, color: 'text-emerald-400' },
  CATEGORY: { label: 'Categories', icon: FolderOpen, color: 'text-blue-400' },
  ORDER: { label: 'Orders', icon: ShoppingBag, color: 'text-purple-400' },
  REVIEW: { label: 'Reviews', icon: Star, color: 'text-amber-300' },
};

export default function RecycleBinTab() {
  const [activeSection, setActiveSection] = useState<RecycleSection>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<RecycleBinItem[]>([]);
  const [counts, setCounts] = useState<Counts>({
    ALL: 0,
    PRODUCT: 0,
    CATEGORY: 0,
    ORDER: 0,
    REVIEW: 0,
  });
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [purgingId, setPurgingId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    type: 'SINGLE' | 'SECTION' | 'ALL';
    itemId?: string;
    itemName?: string;
    section?: RecycleSection;
  }>({ open: false, type: 'SINGLE' });

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeSection !== 'ALL') {
        params.set('entityType', activeSection);
      }
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }

      const res = await fetch(`/api/admin/recycle-bin?${params.toString()}`, {
        cache: 'no-store',
      });
      const data = await res.json();

      if (data && data.success) {
        setItems(data.items || []);
        if (data.counts) {
          setCounts(data.counts);
        }
      }
    } catch {
      toast.error('Failed to load Recycle Bin items');
    } finally {
      setLoading(false);
    }
  }, [activeSection, searchQuery]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleRestore = async (item: RecycleBinItem) => {
    setRestoringId(item.id);
    try {
      const res = await fetch('/api/admin/recycle-bin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore', id: item.id }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(`Restored "${item.name}" back to active database!`, {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
        });
        // Optimistic UI update
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        setCounts((prev) => {
          const type = item.entityType;
          return {
            ...prev,
            ALL: Math.max(0, prev.ALL - 1),
            [type]: Math.max(0, prev[type] - 1),
          };
        });
      } else {
        toast.error(data.error || 'Failed to restore item');
      }
    } catch {
      toast.error('Network error during restore');
    } finally {
      setRestoringId(null);
    }
  };

  const handlePermanentDelete = async (id: string) => {
    setPurgingId(id);
    try {
      const res = await fetch(`/api/admin/recycle-bin?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success('Item permanently deleted from database');
        setItems((prev) => prev.filter((i) => i.id !== id));
        fetchItems();
      } else {
        toast.error(data.error || 'Failed to delete permanently');
      }
    } catch {
      toast.error('Network error while deleting item');
    } finally {
      setPurgingId(null);
      setConfirmModal({ open: false, type: 'SINGLE' });
    }
  };

  const handleEmpty = async (section?: RecycleSection) => {
    try {
      const targetType = section && section !== 'ALL' ? section : undefined;
      const url = targetType
        ? `/api/admin/recycle-bin?entityType=${targetType}&action=empty`
        : `/api/admin/recycle-bin?all=true`;

      const res = await fetch(url, { method: 'DELETE' });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(
          targetType
            ? `Emptied ${SECTION_CONFIG[targetType].label} section (${data.deletedCount} items permanently purged)`
            : `Recycle Bin completely emptied (${data.deletedCount} items purged)`
        );
        fetchItems();
      } else {
        toast.error(data.error || 'Failed to empty recycle bin');
      }
    } catch {
      toast.error('Network error while emptying recycle bin');
    } finally {
      setConfirmModal({ open: false, type: 'SINGLE' });
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (activeSection !== 'ALL' && item.entityType !== activeSection) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.name?.toLowerCase().includes(q) ||
        item.entityId?.toLowerCase().includes(q) ||
        item.entityType?.toLowerCase().includes(q)
      );
    });
  }, [items, activeSection, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header & Status Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-900/90 to-amber-950/30 p-6 md:p-8 border border-amber-500/20 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Trash2 className="w-5 h-5" />
              </span>
              <h2 className="text-2xl font-serif tracking-wide text-amber-100">
                Recycle Bin Archive
              </h2>
            </div>
            <p className="text-sm text-neutral-400 max-w-xl">
              Deleted items are safely stored in separate sections away from your active database.
              Your live tables stay 100% clean and match the website 1-to-1.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchItems()}
              disabled={loading}
              className="border-neutral-700 bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            {counts.ALL > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() =>
                  setConfirmModal({
                    open: true,
                    type: activeSection === 'ALL' ? 'ALL' : 'SECTION',
                    section: activeSection,
                  })
                }
                className="bg-red-950/80 hover:bg-red-900 border border-red-500/30 text-red-200"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {activeSection === 'ALL' ? 'Empty All Bin' : `Empty ${SECTION_CONFIG[activeSection].label}`}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* SECTION TABS: Separate & Distinct (Zero Mixing) */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-xl bg-neutral-900/80 border border-neutral-800 backdrop-blur-md">
        {(Object.keys(SECTION_CONFIG) as RecycleSection[]).map((sectionKey) => {
          const cfg = SECTION_CONFIG[sectionKey];
          const Icon = cfg.icon;
          const count = counts[sectionKey] || 0;
          const isActive = activeSection === sectionKey;

          return (
            <button
              key={sectionKey}
              onClick={() => setActiveSection(sectionKey)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? cfg.color : 'text-neutral-500'}`} />
              <span>{cfg.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  isActive
                    ? 'bg-amber-500/30 text-amber-200'
                    : count > 0
                    ? 'bg-neutral-800 text-neutral-300'
                    : 'bg-neutral-800/40 text-neutral-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search within ${SECTION_CONFIG[activeSection].label.toLowerCase()}...`}
            className="pl-9 bg-neutral-900/90 border-neutral-800 text-neutral-100 placeholder:text-neutral-500 focus:border-amber-500/50"
          />
        </div>
      </div>

      {/* Items Section Container */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-amber-500/60" />
            <p className="text-sm font-medium">Scanning Recycle Bin sections...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30 text-center">
            <div className="p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-serif text-neutral-200 mb-1">
              {searchQuery
                ? 'No items matched your search query'
                : `No Deleted Items in ${SECTION_CONFIG[activeSection].label}`}
            </h3>
            <p className="text-sm text-neutral-500 max-w-md">
              {searchQuery
                ? 'Try a different search keyword or switch to another section.'
                : 'Your database in this section is 100% clean and pristine. Any items you delete will appear safely here.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item) => {
                const cfg = SECTION_CONFIG[item.entityType] || SECTION_CONFIG.ALL;
                const Icon = cfg.icon;
                const payload = item.payload || {};
                const isRestoring = restoringId === item.id;
                const isPurging = purgingId === item.id;

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="group relative flex flex-col md:flex-row md:items-center justify-between p-4 md:p-5 rounded-xl bg-neutral-900/70 border border-neutral-800 hover:border-amber-500/30 transition-all gap-4"
                  >
                    <div className="flex items-start gap-4">
                      {/* Thumbnail / Entity Icon */}
                      <div className="relative w-14 h-14 rounded-lg bg-neutral-800/80 border border-neutral-700/50 flex items-center justify-center overflow-hidden shrink-0">
                        {payload.image ? (
                          <img
                            src={payload.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Icon className={`w-6 h-6 ${cfg.color}`} />
                        )}
                      </div>

                      {/* Details */}
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-base font-medium text-neutral-100 group-hover:text-amber-200 transition-colors">
                            {item.name}
                          </h4>
                          <Badge
                            variant="outline"
                            className="text-[10px] tracking-wider uppercase bg-neutral-800/60 border-neutral-700 text-neutral-300"
                          >
                            {item.entityType}
                          </Badge>
                          {payload.price && (
                            <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                              ₨ {new Intl.NumberFormat('en-PK').format(Number(payload.price))}
                            </span>
                          )}
                          {payload.totalAmount && (
                            <span className="text-xs font-semibold text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-500/20">
                              ₨ {new Intl.NumberFormat('en-PK').format(Number(payload.totalAmount))}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-neutral-400 line-clamp-1 max-w-xl">
                          {payload.description ||
                            (payload.category && `Category: ${payload.category}`) ||
                            (payload.shippingAddress && `Ship to: ${payload.shippingCity || 'Pakistan'}`) ||
                            'Archived snapshot available'}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-neutral-500 pt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(item.deletedAt).toLocaleString('en-PK', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                          {item.deletedBy && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              Deleted by: {item.deletedBy}
                            </span>
                          )}
                          <span className="font-mono text-neutral-600">ID: {item.entityId}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      <Button
                        size="sm"
                        onClick={() => handleRestore(item)}
                        disabled={isRestoring || isPurging}
                        className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs"
                      >
                        <RotateCcw className={`w-3.5 h-3.5 mr-1.5 ${isRestoring ? 'animate-spin' : ''}`} />
                        {isRestoring ? 'Restoring...' : 'Restore'}
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setConfirmModal({
                            open: true,
                            type: 'SINGLE',
                            itemId: item.id,
                            itemName: item.name,
                          })
                        }
                        disabled={isRestoring || isPurging}
                        className="text-neutral-400 hover:text-red-400 hover:bg-red-950/20 text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                        Delete Forever
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md p-6 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-serif text-neutral-100">
                    {confirmModal.type === 'SINGLE'
                      ? 'Permanently Delete Item?'
                      : confirmModal.type === 'SECTION'
                      ? `Empty ${SECTION_CONFIG[confirmModal.section || 'ALL'].label}?`
                      : 'Empty Entire Recycle Bin?'}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    {confirmModal.type === 'SINGLE' ? (
                      <>
                        Are you sure you want to permanently delete{' '}
                        <strong className="text-neutral-200">"{confirmModal.itemName}"</strong>? This
                        action cannot be undone and the record will be erased forever from the database.
                      </>
                    ) : confirmModal.type === 'SECTION' ? (
                      <>
                        Are you sure you want to permanently purge all items in the{' '}
                        <strong className="text-neutral-200">
                          {SECTION_CONFIG[confirmModal.section || 'ALL'].label}
                        </strong>{' '}
                        section? This cannot be undone.
                      </>
                    ) : (
                      <>
                        Are you sure you want to completely empty all items from the Recycle Bin? All
                        sections will be permanently erased.
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmModal({ open: false, type: 'SINGLE' })}
                  className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (confirmModal.type === 'SINGLE' && confirmModal.itemId) {
                      handlePermanentDelete(confirmModal.itemId);
                    } else if (confirmModal.type === 'SECTION') {
                      handleEmpty(confirmModal.section);
                    } else {
                      handleEmpty();
                    }
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Confirm & Delete Forever
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
