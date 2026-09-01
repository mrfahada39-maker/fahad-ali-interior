/**
 * XSS Sanitization utility
 * Uses isomorphic-dompurify — works on both server (Node.js) and client (browser).
 *
 * Usage:
 *   import { sanitizeHtml, sanitizeText, sanitizeBlogContent } from '@/lib/sanitize';
 *
 *   // For dangerouslySetInnerHTML
 *   <p dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />
 *
 *   // For plain text (strips ALL tags)
 *   <p>{sanitizeText(userInput)}</p>
 */

import DOMPurify from 'isomorphic-dompurify';

// ─── Allowed tags/attrs for blog/rich content ─────────────────────────────────
const BLOG_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'b', 'i', 'u', 's',
    'h1', 'h2', 'h3', 'h4',
    'ul', 'ol', 'li',
    'blockquote', 'pre', 'code',
    'a', 'span',
  ] as string[],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'id'] as string[],
  FORCE_BODY: true as boolean,
  ALLOW_DATA_ATTR: false as boolean,
};

// Force external links to open safely
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if ((node as Element).tagName === 'A') {
    const el = node as Element;
    el.setAttribute('rel', 'noopener noreferrer');
    const href = el.getAttribute('href') ?? '';
    if (href && !href.startsWith('/') && !href.startsWith('https://')) {
      el.removeAttribute('href');
    }
  }
});

// ─── Strict config for user-submitted content (reviews/comments) ─────────────
const USER_CONTENT_CONFIG = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br'] as string[],
  ALLOWED_ATTR: [] as string[],
  ALLOW_DATA_ATTR: false as boolean,
};

// ─── Exported sanitizers ──────────────────────────────────────────────────────

/**
 * Sanitize HTML for blog/rich text rendering.
 * Allows safe formatting tags only.
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return '';
  return String(DOMPurify.sanitize(dirty, BLOG_CONFIG));
}

/**
 * Sanitize user-submitted content (reviews, comments, bio).
 * Very restrictive — only basic formatting allowed.
 */
export function sanitizeUserContent(dirty: string): string {
  if (!dirty) return '';
  return String(DOMPurify.sanitize(dirty, USER_CONTENT_CONFIG));
}

/**
 * Strip ALL HTML tags — returns plain text only.
 * Use for: meta descriptions, alt text, search snippets.
 */
export function sanitizeText(dirty: string): string {
  if (!dirty) return '';
  return String(DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }));
}

/**
 * Sanitize blog content with **markdown-like** bold syntax.
 * Converts **text** → <strong> safely, then sanitizes the result.
 */
export function sanitizeBlogContent(content: string): string {
  if (!content) return '';
  const withBold = content.replace(
    /\*\*(.+?)\*\*/g,
    '<strong class="text-white font-semibold">$1</strong>',
  );
  return sanitizeHtml(withBold);
}
