/**
 * Enterprise AI Security Guardrails & Prompt Injection Defense Engine
 * Fahad Ali Haute Interior Architecture & Artisanal Furniture
 *
 * Implements OWASP Top 10 for LLMs / ASVS Enterprise Protection:
 * 1. Multi-vector prompt injection detection (Jailbreaks, Delimiter escapes, Role mimicry)
 * 2. System prompt and secret credential extraction neutralization
 * 3. Output sanitization & confidential token leak prevention
 * 4. Price & financial integrity validation
 */

import { recordAuditLog } from '@/lib/db-utils';

export class SecurityGuardrails {
  /**
   * Detects prompt injection, jailbreak, and adversarial extraction attempts.
   */
  static detectPromptInjection(input: string): boolean {
    if (!input || typeof input !== 'string') return false;

    const injectionPatterns = [
      // Direct instruction override
      /ignore\s+(all\s+)?(previous|above|prior|system)\s+(instructions|prompts|system|rules)/i,
      /forget\s+(everything|all|prior\s+instructions)/i,
      /override\s+(all\s+)?(system|guidelines|guardrails|safety)/i,
      /disregard\s+(previous|all)\s+context/i,

      // Jailbreak & Roleplay personas
      /jailbreak/i,
      /you\s+are\s+now\s+(a\s+)?(dan|developer|unrestricted|god|anarchy)/i,
      /developer\s+mode\s+(enabled|on|activate)/i,
      /pretend\s+(you\s+have\s+no\s+rules|you\s+are\s+an\s+ai\s+without)/i,
      /hypothetical\s+scenario\s+where\s+you\s+can\s+bypass/i,

      // Delimiter escapes & format injection
      /\[\/?(INST|SYS)\]/i,
      /---BEGIN\s+(SYSTEM|ADMIN)\s+PROMPT---/i,
      /<\|im_start\|>|<\|im_end\|>/i,
      /```(system|admin|override)/i,

      // Secret & Preamble Extraction
      /(print|repeat|show|leak|reveal|dump|output)\s+(your\s+)?(system\s+prompt|initial\s+prompt|preamble|instructions)/i,
      /what\s+are\s+your\s+(exact\s+)?(system\s+instructions|secret\s+rules|hidden\s+prompts)/i,
      /(show|print|leak)\s+(env|process\.env|secret|api_key|password|database_url|token)/i,
      /\b(DATABASE_URL|NEXTAUTH_SECRET|UPSTASH_REDIS|INTERNAL_KEY)\b/i,
    ];

    const isSuspicious = injectionPatterns.some((pattern) => pattern.test(input));
    if (isSuspicious) {
      // Async non-blocking security audit logging
      recordAuditLog({
        action: 'AI_PROMPT_INJECTION_FLAGGED',
        entity: 'AiInput',
        metadata: { snippet: input.slice(0, 150) },
      }).catch(() => {});
    }

    return isSuspicious;
  }

  /**
   * Sanitizes string against XSS, HTML script execution, and control characters.
   */
  static sanitizeString(input: string): string {
    if (!input) return '';
    return input
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, '') // Strip control characters
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Sanitizes AI response text to strictly block accidental leak of API keys,
   * database connection strings, or internal bearer tokens.
   */
  static sanitizeAiOutput(responseText: string): string {
    if (!responseText) return '';

    return responseText
      // Strip OpenAI / Anthropic / VAPID API keys
      .replace(/(sk-[a-zA-Z0-9_-]{20,})/g, '[REDACTED_API_KEY]')
      .replace(/(AIza[0-9A-Za-z-_]{35})/g, '[REDACTED_API_KEY]')
      // Strip database connection strings
      .replace(/postgres(?:ql)?:\/\/[^\s"'<>]+/gi, '[REDACTED_DATABASE_CONNECTION]')
      // Strip JWT or Bearer tokens
      .replace(/Bearer\s+[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/gi, 'Bearer [REDACTED_TOKEN]')
      // Strip Upstash Redis tokens
      .replace(/https:\/\/[a-z0-9-]+\.upstash\.io/gi, '[REDACTED_UPSTASH_HOST]');
  }

  /**
   * Verifies that prices mentioned in AI responses match live database pricing.
   */
  static validatePriceIntegrity(aiResponseText: string, knownProducts: { name: string; price: number }[]): boolean {
    for (const product of knownProducts) {
      if (aiResponseText.toLowerCase().includes(product.name.toLowerCase())) {
        const regex = new RegExp(`${product.name}[^\\d]*(\\d[\\d,.]*)`, 'i');
        const match = aiResponseText.match(regex);
        if (match && match[1]) {
          const mentionedPrice = parseFloat(match[1].replace(/,/g, ''));
          if (Math.abs(mentionedPrice - product.price) > 100) {
            if (process.env.NODE_ENV === 'development') {
              console.warn(`Price mismatch detected for ${product.name}: mentioned ${mentionedPrice}, actual ${product.price}`);
            }
            return false;
          }
        }
      }
    }
    return true;
  }
}
