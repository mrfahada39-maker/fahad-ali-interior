/**
 * JSON-LD structured data component.
 *
 * Security: JSON.stringify is safe for structured data, but we also escape
 * </script> sequences to prevent injection attacks in edge cases.
 */
export default function JsonLd({
  data,
  nonce,
}: {
  data: Record<string, unknown>;
  nonce?: string;
}) {
  // Escape </script> to prevent premature script tag closing
  const json = JSON.stringify(data).replace(/<\/script>/gi, '<\\/script>');

  return (
    <script
      type="application/ld+json"
      {...(nonce ? { nonce } : {})}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
