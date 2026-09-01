'use client';

import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/cartStore';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { apiFetch, apiFetchJson } from '@/lib/api-client';
import type {
  CheckoutStep,
  PaymentMethod,
  ShippingInfo,
  PricingInfo,
  PaymentSettings,
  PaymentGatewayResponse,
} from '@/components/checkout/types';

export function useCheckout() {
  const { items, clearCart } = useCartStore();
  const router = useRouter();
  const { data: session } = useSession();

  const [step, setStep] = useState<CheckoutStep>('shipping');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [placing, setPlacing] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({});
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [pricing, setPricing] = useState<PricingInfo>({ subtotal: 0, discount: 0, gst: 0, totalAmount: 0 });
  const [pricingLoading, setPricingLoading] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState('');

  useEffect(() => { setIdempotencyKey(crypto.randomUUID()); }, []);

  useEffect(() => {
    apiFetchJson<{ methods?: Record<string, unknown> }>('/api/checkout/payment-details', { credentials: 'include' })
      .then((data) => {
        if (data?.methods) {
          const m = data.methods as Record<string, Record<string, string>>;
          setPaymentSettings({
            jazzcashNumber: m.jazzcash?.number,
            easypaisaNumber: m.easypaisa?.number,
            bankName: m.bank?.bankName,
            accountTitle: m.bank?.accountTitle,
            accountNumber: m.bank?.accountNumber,
            iban: m.bank?.iban,
          });
        }
      })
      .catch(() => {});
  }, []);

  const refreshPricing = async (code?: string) => {
    if (items.length === 0) return;
    setPricingLoading(true);
    try {
      const res = await apiFetch('/api/checkout/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
          couponCode: code ?? appliedCoupon ?? undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPricing({ subtotal: data.subtotal, discount: data.discount, gst: data.gst, totalAmount: data.totalAmount });
        setAppliedCoupon(data.couponCode ?? null);
      } else {
        toast.error(data.error || 'Could not calculate pricing');
      }
    } catch {
      toast.error('Could not calculate pricing');
    } finally {
      setPricingLoading(false);
    }
  };

  useEffect(() => { refreshPricing(); }, [items, appliedCoupon]);

  const [shipping, setShipping] = useState<ShippingInfo>({
    name: session?.user?.name || '', phone: '', email: session?.user?.email || '',
    address: '', city: '', province: 'Punjab', notes: '',
  });

  const shippingCost = pricing.subtotal >= 50000 ? 0 : 2500;
  const grandTotal = pricing.totalAmount + shippingCost;

  const handleScreenshot = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiFetch('/api/v1/uploads/image', { method: 'POST', body: formData, credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setScreenshot(data.url);
      } else {
        toast.error('Screenshot upload failed');
      }
    } catch {
      toast.error('Screenshot upload failed');
    }
  };

  const handlePlaceOrder = async () => {
    if (!shipping.name || !shipping.phone || !shipping.address || !shipping.city) {
      toast.error('Please fill all required fields');
      setStep('shipping');
      return;
    }

    setPlacing(true);
    try {
      const res = await apiFetch('/api/orders', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey || crypto.randomUUID(),
        },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
          couponCode: appliedCoupon || undefined,
          paymentMethod,
          paymentScreenshot: screenshot || undefined,
          shippingInfo: shipping,
        }),
      });

      if (res.ok) {
        const data: PaymentGatewayResponse = await res.json();

        if (data.paymentInit?.status === 'redirect' && data.paymentInit.endpoint) {
          const form = document.createElement('form');
          form.method = 'POST';
          form.action = data.paymentInit.endpoint;
          Object.entries(data.paymentInit.payload ?? {}).forEach(([key, value]) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = String(value);
            form.appendChild(input);
          });
          document.body.appendChild(form);
          form.submit();
          return;
        }

        setIdempotencyKey(crypto.randomUUID());
        setOrderId(data.order?.id || data.id || 'ORD-' + Date.now());
        setStep('success');
        clearCart();
        toast.success('Order placed successfully!');
      } else if (res.status === 503) {
        toast.error('Backend API is not available. Please try again later.');
      } else if (res.status === 401) {
        toast.error('Please log in to place an order');
      } else {
        let errMsg = 'Failed to place order';
        try { const err = await res.json(); errMsg = err.error || err.message || errMsg; } catch { /* ignore */ }
        toast.error(errMsg);
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  return {
    items, step, setStep, paymentMethod, setPaymentMethod, placing, orderId,
    screenshot, setScreenshot, paymentSettings, couponCode, setCouponCode,
    appliedCoupon, setAppliedCoupon, pricing, pricingLoading,
    shipping, setShipping, shippingCost, grandTotal, idempotencyKey,
    handleScreenshot, handlePlaceOrder, refreshPricing, session, router, clearCart,
  };
}
