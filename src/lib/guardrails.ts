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
import { logger } from '@/lib/logger';

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
   * Enterprise Web Application Firewall (WAF) Payload Inspector
   * Detects SQL Injection, XSS, Path Traversal, Prototype Pollution, and RCE attempts.
   */
  static detectMaliciousPayload(input: string): { isMalicious: boolean; reason?: string } {
    if (!input || typeof input !== 'string') return { isMalicious: false };

    // Decode URI components to catch obfuscated bypasses like %27%20UNION
    let decoded = input;
    try {
      decoded = decodeURIComponent(input);
    } catch {
      // If decoding fails, check raw input
    }

    // 1. SQL Injection (SQLi) patterns
    const sqliPatterns = [
      /\b(union\s+all\s+select|union\s+select)\b/i,
      /\b(select\s+.+\s+from\s+information_schema)\b/i,
      /\b(drop\s+table|truncate\s+table|alter\s+table)\b/i,
      /(?:'|"|;)\s*(?:--|\/\*)/,
      /\b(?:waitfor\s+delay\s+'[\d:]+'|pg_sleep\s*\(\s*\d+\s*\)|sleep\s*\(\s*\d+\s*\))/i,
      /\bexec\s*\(\s*(?:xp_cmdshell|sp_executesql)\b/i,
    ];
    if (sqliPatterns.some((p) => p.test(decoded))) {
      return { isMalicious: true, reason: 'SQL_INJECTION_DETECTED' };
    }

    // 2. Cross-Site Scripting (XSS) patterns
    const xssPatterns = [
      /<script[\s>]/i,
      /javascript:\s*[^\s]/i,
      /data:\s*text\/html/i,
      /vbscript:\s*[^\s]/i,
      /on(?:load|error|click|mouseover|focus|blur|submit)\s*=/i,
      /<iframe[\s>]/i,
      /<object[\s>]/i,
      /<embed[\s>]/i,
      /document\.(?:cookie|location|write)/i,
    ];
    if (xssPatterns.some((p) => p.test(decoded))) {
      return { isMalicious: true, reason: 'XSS_PAYLOAD_DETECTED' };
    }

    // 3. Path Traversal & LFI / RFI
    const pathTraversalPatterns = [
      /(?:\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e\/|\.\.%2f)/i,
      /\/(etc\/(?:passwd|shadow|hosts)|boot\.ini|windows\/system32)/i,
      /\/proc\/self\/(?:environ|cmdline|status)/i,
    ];
    if (pathTraversalPatterns.some((p) => p.test(decoded))) {
      return { isMalicious: true, reason: 'PATH_TRAVERSAL_DETECTED' };
    }

    // 4. Remote Code Execution (RCE) / Log4j / Template Injection
    const rcePatterns = [
      /\${(?:jndi|env|lower|upper):/i,
      /{{(?:\s*\d+\s*\*\s*\d+\s*|\s*config\s*)}}/i,
      /(?:cmd\.exe|powershell(?:\.exe)?|\/bin\/sh|\/bin\/bash)\b/i,
      /<\?php/i,
    ];
    if (rcePatterns.some((p) => p.test(decoded))) {
      return { isMalicious: true, reason: 'RCE_OR_TEMPLATE_INJECTION_DETECTED' };
    }

    // 5. Prototype Pollution
    if (/(?:__proto__|constructor\s*\.\s*prototype)/i.test(decoded)) {
      return { isMalicious: true, reason: 'PROTOTYPE_POLLUTION_DETECTED' };
    }

    return { isMalicious: false };
  }

  /**
   * Anti-Probing & Scanner Firewall
   * Identifies automated vulnerability scanners, scrapers, and malicious reconnaissance requests.
   */
  static detectProbingOrScanner(pathname: string, userAgent?: string | null): { isBlocked: boolean; reason?: string } {
    // 1. Known malicious vulnerability scanners and aggressive probe tools
    if (userAgent) {
      const scannerUaRegex = /(sqlmap|nikto|acunetix|masscan|zgrab|censys|dirbuster|gobuster|wpscan|nmap|nessus|openvas|arachni)/i;
      if (scannerUaRegex.test(userAgent)) {
        return { isBlocked: true, reason: 'MALICIOUS_SCANNER_USER_AGENT' };
      }
    }

    // 2. Sensitive reconnaissance target paths
    const lowerPath = (pathname || '').toLowerCase();
    const probePathPatterns = [
      /\/\.env(?:\..*)?$/i,
      /\/\.git(?:\/.*)?$/i,
      /\/\.aws(?:\/.*)?$/i,
      /\/\.ssh(?:\/.*)?$/i,
      /\/(?:wp-admin|wp-login\.php|xmlrpc\.php)$/i,
      /\/(?:phpmyadmin|pma|phpinfo\.php|info\.php)$/i,
      /\/(?:eval-stdin\.php|setup\.php|admin\.php)$/i,
      /\/(?:actuator\/(?:health|env)|solr\/admin|swagger-ui)$/i,
    ];

    if (probePathPatterns.some((p) => p.test(lowerPath))) {
      return { isBlocked: true, reason: 'SUSPICIOUS_PROBE_PATH' };
    }

    return { isBlocked: false };
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
              logger.warn(`Price mismatch detected for ${product.name}: mentioned ${mentionedPrice}, actual ${product.price}`);
            }
            return false;
          }
        }
      }
    }
    return true;
  }
}
