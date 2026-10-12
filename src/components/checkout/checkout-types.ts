export interface CheckoutFormState {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  saveAddress: boolean;
  notes: string;
}

export interface AppliedCoupon {
  code: string;
  percent?: number;
  fixed?: number;
}

export interface DigitalPaymentDetails {
  senderNumber: string;
  transactionId: string;
  senderBank: string;
  screenshotUrl: string | null;
}

export interface CardDetails {
  number: string;
  expiry: string;
  cvv: string;
}
