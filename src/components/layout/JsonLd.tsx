import { headers } from 'next/headers';

/**
 * JSON-LD structured data component.
 *
 * Security: JSON.stringify is safe for structured data, but we also escape
 * </script> sequences to prevent injection attacks in edge cases.
 * Attaches per-request cryptographic nonce from x-nonce header for strict CSP.
 */
export default async function JsonLd({
  data,
  nonce,
}: {
  data: Record<string, unknown>;
  nonce?: string;
}) {
  let resolvedNonce = nonce;
  if (!resolvedNonce) {
    try {
      const h = await headers();
      resolvedNonce = h.get('x-nonce') || undefined;
    } catch {
      // Static generation / prerender / testing fallback
    }
  }

  // Escape </script> to prevent premature script tag closing
  const json = JSON.stringify(data).replace(/<\/script>/gi, '<\\/script>');

  return (
    <script
      type="application/ld+json"
      {...(resolvedNonce ? { nonce: resolvedNonce } : {})}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
