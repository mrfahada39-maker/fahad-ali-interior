/**
 * Centralized Business Contact Configuration
 *
 * Reads contact details from environment variables or DB Settings,
 * using ONE consistent business phone number and email across the platform.
 * Personal emails and placeholder phone numbers are strictly prohibited in source.
 */

export const BUSINESS_CONTACT = {
  get adminEmail(): string {
    const candidate = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();
    if (candidate && candidate.toLowerCase() !== 'mrfahada39@gmail.com') {
      return candidate;
    }
    return 'concierge@fahadali.pk';
  },
  get supportEmail(): string {
    return process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'concierge@fahadali.pk';
  },
  get phone(): string {
    return process.env.NEXT_PUBLIC_CONTACT_PHONE || '+92 320 7006110';
  },
  get phoneDial(): string {
    return (process.env.NEXT_PUBLIC_CONTACT_PHONE || '+923207006110').replace(/\s+/g, '');
  },
  get whatsapp(): string {
    return (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '923207006110').replace(/\D/g, '');
  },
  get address(): string {
    return (
      process.env.NEXT_PUBLIC_STORE_ADDRESS ||
      'Main Boulevard, Gulberg III, Lahore, Pakistan'
    );
  },
};
