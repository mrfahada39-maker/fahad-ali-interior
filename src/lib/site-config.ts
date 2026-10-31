import { getSiteUrl } from '@/lib/utils';
import { BUSINESS_CONTACT } from '@/lib/contact-config';

/**
 * Centralized Site Domain & Email Configuration (L2 Security Remediation)
 *
 * Consolidates all disparate domains and emails (fahadali.pk, fahadaliinterior.com,
 * fahadali.com, vercel.app) into unified, environment-aware constants.
 */
export const SITE_CONFIG = {
  /** Brand Name */
  brandName: 'Fahad Ali Interior',

  /** Canonical site origin URL without trailing slash */
  get siteUrl(): string {
    return getSiteUrl();
  },

  /** Canonical domain name (e.g. fahadaliinterior.com or deployment host) */
  get domain(): string {
    const url = getSiteUrl();
    try {
      return new URL(url).hostname;
    } catch {
      return process.env.NEXT_PUBLIC_SITE_DOMAIN || 'fahadaliinterior.com';
    }
  },

  /** Standard system emails */
  emails: {
    get admin(): string {
      return BUSINESS_CONTACT.adminEmail;
    },
    get support(): string {
      return BUSINESS_CONTACT.supportEmail;
    },
    get noReply(): string {
      return (
        process.env.SMTP_FROM_EMAIL ||
        process.env.NO_REPLY_EMAIL ||
        `no-reply@${SITE_CONFIG.domain}`
      );
    },
    get fromHeader(): string {
      const user = process.env.SMTP_USER;
      return (
        process.env.SMTP_FROM ||
        (user
          ? `${SITE_CONFIG.brandName} <${user}>`
          : `${SITE_CONFIG.brandName} <${SITE_CONFIG.emails.noReply}>`)
      );
    },
    get pushSubject(): string {
      return process.env.VAPID_SUBJECT || `mailto:${BUSINESS_CONTACT.adminEmail}`;
    },
  },
} as const;

