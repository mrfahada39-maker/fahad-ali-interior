export type PaymentMethod = 'cod' | 'jazzcash' | 'easypaisa' | 'bank';
export type CheckoutStep = 'shipping' | 'payment' | 'confirm' | 'success';
export type PaymentProvider = 'jazzcash' | 'easypaisa' | 'bank';

export interface ShippingInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  province: string;
  notes: string;
}

export interface PricingInfo {
  subtotal: number;
  discount: number;
  gst: number;
  totalAmount: number;
}

export interface PaymentSettings {
  bankName?: string;
  accountTitle?: string;
  accountNumber?: string;
  iban?: string;
  jazzcashNumber?: string;
  easypaisaNumber?: string;
}

export interface PaymentMethodOption {
  id: PaymentMethod;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  desc: string;
  color: string;
}

export interface PaymentGatewayResponse {
  paymentInit?: {
    status: string;
    endpoint?: string;
    payload?: Record<string, string>;
  };
  order?: { id: string };
  id?: string;
}
