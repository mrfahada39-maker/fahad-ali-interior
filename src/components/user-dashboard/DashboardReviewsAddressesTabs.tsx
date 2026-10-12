/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Plus, Star, UploadCloud, X, Camera, Trash2, User, Phone, Home, MapPin, ShieldCheck, Crown, Truck,
} from 'lucide-react';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { Textarea } from '@/components/textarea';
import { renderHeaderBanner, renderKpiGrid, formatPrice } from './dashboard-kpis';

export function DashboardReviewsTab({
  myReviews,
  reviewsKpis,
  showReviewForm,
  setShowReviewForm,
  handleSubmitReview,
  reviewForm,
  setReviewForm,
  groupedProducts,
  reviewUploading,
  handleReviewImageUpload,
  handleDeleteReview,
}: {
  myReviews: any[];
  reviewsKpis: any[];
  showReviewForm: boolean;
  setShowReviewForm: (s: boolean) => void;
  handleSubmitReview: (e: React.FormEvent) => void;
  reviewForm: { productId: string; rating: number; comment: string; image: string };
  setReviewForm: React.Dispatch<React.SetStateAction<{ productId: string; rating: number; comment: string; image: string }>>;
  groupedProducts: [string, any[]][];
  reviewUploading: boolean;
  handleReviewImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDeleteReview: (id: string) => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
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

      {renderKpiGrid(reviewsKpis)}

      {showReviewForm && (
        <form onSubmit={handleSubmitReview} className="bg-white/95 backdrop-blur-md rounded-2xl border border-[#B88E4B]/40 p-5 space-y-3.5 shadow-sm">
          <h3 className="font-serif font-black text-sm text-[#1F1612]">Craft a New Review</h3>

          <div className="space-y-1">
            <label htmlFor="review-product-select" className="text-xs font-bold text-[#7A6354]">
              Select Furniture Piece / Category
            </label>
            <select
              id="review-product-select"
              name="productId"
              value={reviewForm.productId}
              onChange={(e) => setReviewForm({ ...reviewForm, productId: e.target.value })}
              className="w-full h-9 px-3 rounded-xl border border-[#E7DDD0] bg-[#FAF5EE] text-xs font-medium cursor-pointer"
              required
            >
              <option value="">-- Choose piece by category from catalog --</option>
              {groupedProducts.map(([category, items]) => (
                <optgroup key={category} label={`✦ ${category.toUpperCase()}`}>
                  {items.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (PKR {formatPrice(p.price)})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold text-[#7A6354]">Artisanship Rating</span>
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
            <span className="text-xs font-bold text-[#7A6354]">Your Experience & Wood Finishing Notes</span>
            <Textarea
              value={reviewForm.comment}
              onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
              placeholder="Describe the build quality, wood seasoning, comfort grade..."
              className="rounded-xl border-[#E7DDD0] text-xs"
              rows={3}
              required
            />
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-bold text-[#7A6354] flex items-center justify-between">
              <span>Attach Photo of Your Piece / Room (Optional)</span>
              {reviewUploading && (
                <span className="text-[11px] text-[#B88E4B] flex items-center gap-1 font-semibold">
                  <UploadCloud size={12} className="animate-bounce" /> Uploading image...
                </span>
              )}
            </span>

            {reviewForm.image ? (
              <div className="relative inline-block border-2 border-[#B88E4B]/50 rounded-xl overflow-hidden shadow-sm group">
                <Image
                  src={reviewForm.image}
                  alt="Review attachment"
                  width={96}
                  height={96}
                  className="w-24 h-24 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setReviewForm((prev) => ({ ...prev, image: '' }))}
                  className="absolute top-1 right-1 bg-black/70 hover:bg-rose-600 text-white p-1 rounded-full text-xs transition-colors cursor-pointer"
                  title="Remove photo"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <label className={`flex items-center justify-center gap-2 border-2 border-dashed border-[#E7DDD0] hover:border-[#B88E4B] bg-[#FAF5EE]/70 hover:bg-[#FAF5EE] rounded-xl p-3 cursor-pointer transition-all ${reviewUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <Camera size={16} className="text-[#B88E4B]" />
                <span className="text-xs font-medium text-[#7A6354]">
                  {reviewUploading ? 'Uploading to royal vault...' : 'Click to select or capture piece photo'}
                </span>
                <input id="fai-dashboardreviewsaddressestabs-field-2" name="fai_dashboardreviewsaddressestabs_field_2"
                  type="file"
                  accept="image/*"
                  onChange={handleReviewImageUpload}
                  className="hidden"
                  disabled={reviewUploading}
                />
              </label>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowReviewForm(false)} className="rounded-xl text-xs h-8">
              Cancel
            </Button>
            <Button type="submit" disabled={reviewUploading} className="rounded-xl bg-[#B88E4B] text-white text-xs font-bold h-8">
              {reviewUploading ? 'Uploading...' : 'Publish Review'}
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
          {myReviews.map((rev) => {
            const isApproved = (rev.status || '').toLowerCase() === 'approved';
            const isRejected = (rev.status || '').toLowerCase() === 'rejected';

            return (
              <div key={rev.id} className="bg-white/95 backdrop-blur-md rounded-2xl border border-[#E7DDD0] hover:border-[#B88E4B]/40 p-4 shadow-2xs space-y-2.5 transition-all">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    {[...Array(rev.rating || 5)].map((_, i) => (
                      <Star key={i} size={13} className="fill-[#B88E4B] text-[#B88E4B]" />
                    ))}
                    <span className="text-[11px] font-black text-[#1F1612] ml-1">{rev.rating || 5}.0</span>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider flex items-center gap-1 ${
                    isApproved
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                      : isRejected
                      ? 'bg-rose-50 text-rose-800 border border-rose-300'
                      : 'bg-amber-50 text-amber-800 border border-amber-300'
                  }`}>
                    {isApproved ? '✓ Published Live' : isRejected ? '✕ Revision Requested' : '⏳ Under Verification'}
                  </span>
                </div>

                {rev.product && (
                  <div className="flex items-center gap-2.5 bg-[#FAF5EE] p-2 rounded-xl border border-[#E7DDD0]">
                    {rev.product.image && (
                      <Image
                        src={rev.product.image}
                        alt={rev.product.name}
                        width={36}
                        height={36}
                        className="w-9 h-9 rounded-lg object-cover border border-[#E2D1BC] shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#1F1612] truncate">{rev.product.name}</p>
                      {rev.product.price && (
                        <p className="text-[10px] font-mono text-[#8C6239]">PKR {formatPrice(rev.product.price)}</p>
                      )}
                    </div>
                  </div>
                )}

                {rev.image && (
                  <div className="relative h-36 rounded-xl overflow-hidden border border-[#E7DDD0] bg-[#FAF5EE]">
                    <Image
                      src={rev.image}
                      alt="Client review photo"
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                      onClick={() => window.open(rev.image, '_blank')}
                    />
                  </div>
                )}

                <p className="text-xs text-[#1F1612] font-medium italic bg-[#FCFAF7] p-2.5 rounded-xl border border-[#E7DDD0]/70 leading-relaxed">
                  &ldquo;{rev.comment}&rdquo;
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-[#E7DDD0]/60 text-[10px] text-stone-400">
                  <span>
                    {new Date(rev.createdAt || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteReview(rev.id)}
                    className="p-1 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer rounded-lg hover:bg-rose-50"
                    title="Delete Review"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

export function DashboardAddressesTab({
  addresses,
  addressesKpis,
  showAddrForm,
  setShowAddrForm,
  handleAddAddress,
  addrForm,
  setAddrForm,
  handleDeleteAddress,
}: {
  addresses: any[];
  addressesKpis: any[];
  showAddrForm: boolean;
  setShowAddrForm: (s: boolean) => void;
  handleAddAddress: (e: React.FormEvent) => void;
  addrForm: { name: string; phone: string; address: string; city: string; province: string; isDefault: boolean };
  setAddrForm: React.Dispatch<React.SetStateAction<{ name: string; phone: string; address: string; city: string; province: string; isDefault: boolean }>>;
  handleDeleteAddress: (id: string) => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {renderHeaderBanner(
        '✦ HAVENS REGISTRY',
        '✦ RESIDENTIAL REGISTRY V2.4',
        `${addresses.length} HAVENS`,
        `${addresses.length} SAVED ESTATES`,
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

      {renderKpiGrid(addressesKpis)}

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
              <span className="text-[11px] font-bold text-[#7A6354] uppercase tracking-wider flex items-center gap-1.5">
                <User size={12} className="text-[#B88E4B]" /> Recipient Full Name
              </span>
              <Input
                placeholder="e.g. Your Full Name"
                value={addrForm.name}
                onChange={(e) => setAddrForm({ ...addrForm, name: e.target.value })}
                className="rounded-xl border-[#E7DDD0] bg-[#FAF5EE]/40 text-xs h-9.5 focus:ring-[#B88E4B]"
                required
              />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-[#7A6354] uppercase tracking-wider flex items-center gap-1.5">
                <Phone size={12} className="text-[#B88E4B]" /> Contact Phone
              </span>
              <Input
                placeholder="e.g. 0300 1234567"
                value={addrForm.phone}
                onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })}
                className="rounded-xl border-[#E7DDD0] bg-[#FAF5EE]/40 text-xs h-9.5 focus:ring-[#B88E4B] font-mono"
                required
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <span className="text-[11px] font-bold text-[#7A6354] uppercase tracking-wider flex items-center gap-1.5">
                <Home size={12} className="text-[#B88E4B]" /> Street Address / Villa / Estate / Phase
              </span>
              <Input
                placeholder="e.g. House / Villa, Street, Sector, Phase"
                value={addrForm.address}
                onChange={(e) => setAddrForm({ ...addrForm, address: e.target.value })}
                className="rounded-xl border-[#E7DDD0] bg-[#FAF5EE]/40 text-xs h-9.5 focus:ring-[#B88E4B]"
                required
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="user-address-city" className="text-[11px] font-bold text-[#7A6354] uppercase tracking-wider flex items-center gap-1.5">
                <MapPin size={12} className="text-[#B88E4B]" /> City
              </label>
              <select
                id="user-address-city"
                name="city"
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
              <label htmlFor="user-address-province" className="text-[11px] font-bold text-[#7A6354] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={12} className="text-[#B88E4B]" /> Province / State
              </label>
              <select
                id="user-address-province"
                name="province"
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
            <input name="fai_dashboardreviewsaddressestabs_field_5"
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

      {addresses.length === 0 ? (
        <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-[22px] border-2 border-dashed border-[#E7DDD0] p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-[#8C6239] flex items-center justify-center mx-auto shadow-xs">
            <Home size={22} />
          </div>
          <h3 className="font-serif font-black text-base text-[#1F1612]">No Residences Registered Yet</h3>
          <p className="text-xs text-[#7A6354] max-w-sm mx-auto">
            Save your primary residence or architectural project address for seamless insured white-glove installations.
          </p>
          <Button
            onClick={() => setShowAddrForm(true)}
            className="rounded-xl bg-gradient-to-r from-[#B88E4B] to-[#8C6239] text-white text-xs font-bold px-4 py-2 shadow-xs cursor-pointer active:scale-95"
          >
            <Plus size={13} className="mr-1" /> Add Your Residence
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
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
                {addr.phone && (
                  <p className="text-xs font-mono font-bold text-[#8C6239] pl-5 flex items-center gap-1">
                    📞 {addr.phone}
                  </p>
                )}
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
      )}
    </motion.div>
  );
}
