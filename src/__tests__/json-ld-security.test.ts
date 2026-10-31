import fs from 'fs';
import path from 'path';
import JsonLd from '@/components/layout/JsonLd';

// Mock next/headers
const mockGetHeader = jest.fn();
jest.mock('next/headers', () => ({
  headers: jest.fn(() => ({
    get: mockGetHeader,
  })),
}));

describe('L1: Structured Data JSON-LD Security & </script> Escaping', () => {
  const rootDir = process.cwd();
  const blogPagePath = path.join(rootDir, 'src', 'app', 'blog', '[slug]', 'page.tsx');
  const faqPagePath = path.join(rootDir, 'src', 'app', 'faq', 'page.tsx');
  const jsonLdComponentPath = path.join(rootDir, 'src', 'components', 'layout', 'JsonLd.tsx');

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetHeader.mockReturnValue('test-nonce-token-xyz-12345');
  });

  describe('1. Static Code Analysis: Enforcement of JsonLd Component', () => {
    it('verifies blog/[slug]/page.tsx uses JsonLd component and has no raw ld+json script tags', () => {
      const content = fs.readFileSync(blogPagePath, 'utf8');

      // Must import JsonLd
      expect(content).toMatch(/import\s+JsonLd\s+from\s+['"]@\/components\/layout\/JsonLd['"]/);

      // Must render <JsonLd
      expect(content).toContain('<JsonLd');

      // Must NOT render raw unescaped script tags with dangerouslySetInnerHTML
      expect(content).not.toMatch(/<script\s+type=['"]application\/ld\+json['"]/);
      expect(content).not.toMatch(/dangerouslySetInnerHTML=\{\{\s*__html:\s*JSON\.stringify\(blogPostingSchema\)\s*\}\}/);
    });

    it('verifies faq/page.tsx uses JsonLd component and has no raw ld+json script tags', () => {
      const content = fs.readFileSync(faqPagePath, 'utf8');

      // Must import JsonLd
      expect(content).toMatch(/import\s+JsonLd\s+from\s+['"]@\/components\/layout\/JsonLd['"]/);

      // Must render <JsonLd
      expect(content).toContain('<JsonLd');

      // Must NOT render raw unescaped script tags with dangerouslySetInnerHTML
      expect(content).not.toMatch(/<script\s+type=['"]application\/ld\+json['"]/);
      expect(content).not.toMatch(/dangerouslySetInnerHTML=\{\{\s*__html:\s*JSON\.stringify\(faqSchema\)\s*\}\}/);
    });

    it('verifies JsonLd component exists and is the sole site-wide implementation of application/ld+json', () => {
      expect(fs.existsSync(jsonLdComponentPath)).toBe(true);

      const jsonLdContent = fs.readFileSync(jsonLdComponentPath, 'utf8');
      expect(jsonLdContent).toContain('type="application/ld+json"');
      expect(jsonLdContent).toContain('.replace(/<\\/script>/gi');
    });
  });

  describe('2. Component Execution & XSS Sanitization', () => {
    it('escapes </script> inside JSON-LD payload to prevent XSS script breakouts', async () => {
      const maliciousData = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: 'Luxury Living </script><script>alert("pwned")</script>',
        description: 'Nested evil payload </SCRIPT><svg onload=alert(1)>',
      };

      const element = await JsonLd({ data: maliciousData });
      expect(element).toBeDefined();

      const htmlContent = element.props.dangerouslySetInnerHTML?.__html;
      expect(htmlContent).toBeDefined();

      // Literal </script> or </SCRIPT> must NEVER exist in raw serialized output
      expect(htmlContent).not.toContain('</script>');
      expect(htmlContent).not.toContain('</SCRIPT>');

      // Must be safely escaped as <\/script>
      expect(htmlContent).toContain('<\\/script>');

      // Valid JSON parser must still decode payload properly
      const parsed = JSON.parse(htmlContent);
      expect(parsed.headline).toBe('Luxury Living </script><script>alert("pwned")</script>');
      expect(parsed.description).toBe('Nested evil payload </script><svg onload=alert(1)>');
    });

    it('attaches per-request cryptographic CSP nonce from x-nonce header', async () => {
      mockGetHeader.mockReturnValueOnce('secure-req-nonce-98765');

      const data = { '@context': 'https://schema.org', '@type': 'FAQPage' };
      const element = await JsonLd({ data });

      expect(element.props.nonce).toBe('secure-req-nonce-98765');
      expect(element.props.type).toBe('application/ld+json');
    });

    it('uses explicitly provided nonce when passed as prop', async () => {
      const data = { '@context': 'https://schema.org', '@type': 'Organization' };
      const element = await JsonLd({ data, nonce: 'explicit-prop-nonce-112233' });

      expect(element.props.nonce).toBe('explicit-prop-nonce-112233');
    });
  });
});
