import { describe, it, expect } from '@jest/globals';

jest.mock('isomorphic-dompurify', () => ({
  sanitize: (dirty: string, config?: { ALLOWED_TAGS?: string[] }) => {
    if (!dirty) return '';
    const allowed = config?.ALLOWED_TAGS ?? [];
    if (allowed.length === 0) {
      return dirty.replace(/<[^>]*>/g, '');
    }
    return dirty.replace(
      /<(\/?)(\w+)[^>]*>/g,
      (_m: string, slash: string, tag: string) => {
        if (allowed.includes(tag)) return `<${slash}${tag}>`;
        return '';
      },
    );
  },
  addHook: () => {},
}));

import {
  sanitizeHtml,
  sanitizeText,
  sanitizeUserContent,
  sanitizeBlogContent,
} from '@/lib/sanitize';

describe('sanitizeHtml', () => {
  it('allows safe HTML tags', () => {
    const result = sanitizeHtml('<p>Hello</p>');
    expect(result).toContain('<p>');
    expect(result).toContain('Hello');
  });

  it('strips script tags', () => {
    const result = sanitizeHtml('<script>alert("xss")</script>');
    expect(result).not.toContain('<script>');
  });

  it('removes disallowed attributes like onclick', () => {
    const result = sanitizeHtml('<p onclick="alert(1)">text</p>');
    expect(result).not.toContain('onclick');
    expect(result).toContain('text');
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeHtml('')).toBe('');
  });

  it('strips iframe tags', () => {
    const result = sanitizeHtml('<iframe src="https://evil.com"></iframe>');
    expect(result).not.toContain('<iframe>');
    expect(result).not.toContain('iframe');
  });
});

describe('sanitizeUserContent', () => {
  it('allows basic formatting tags like b and i', () => {
    const result = sanitizeUserContent('<b>bold</b> and <i>italic</i>');
    expect(result).toContain('<b>bold</b>');
    expect(result).toContain('<i>italic</i>');
  });

  it('strips disallowed tags from user content', () => {
    const result = sanitizeUserContent(
      '<b>bold</b><script>bad</script><h1>heading</h1>',
    );
    expect(result).toContain('<b>bold</b>');
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('<h1>');
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeUserContent('')).toBe('');
  });

  it('returns empty string for null-like input', () => {
    expect(sanitizeUserContent('')).toBe('');
  });
});

describe('sanitizeText', () => {
  it('strips all HTML tags leaving plain text', () => {
    expect(sanitizeText('<b>bold</b>')).toBe('bold');
  });

  it('strips nested HTML tags', () => {
    const result = sanitizeText('<div><p>Hello <b>world</b></p></div>');
    expect(result).toBe('Hello world');
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeText('')).toBe('');
  });

  it('preserves text content when stripping tags', () => {
    expect(sanitizeText('<h1>Title</h1><p>Paragraph</p>')).toBe(
      'TitleParagraph',
    );
  });
});

describe('sanitizeBlogContent', () => {
  it('converts markdown bold syntax to strong tag', () => {
    const result = sanitizeBlogContent('This is **important** text');
    expect(result).toContain('important');
    expect(result).toContain('strong');
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeBlogContent('')).toBe('');
  });
});
