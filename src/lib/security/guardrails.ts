export class SecurityGuardrails {
  /** Detect prompt injection attempts in customer input */
  static detectPromptInjection(input: string): boolean {
    const injectionPatterns = [
      /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions|prompts|system)/i,
      /system\s+prompt/i,
      /you\s+are\s+now\s+a/i,
      /jailbreak/i,
      /override\s+system/i,
      /forget\s+(everything|all)/i,
    ];

    return injectionPatterns.some((pattern) => pattern.test(input));
  }

  /** Sanitize input string against XSS & HTML injections */
  static sanitizeString(input: string): string {
    if (!input) return '';
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /** Verify that prices mentioned in AI responses match live database pricing */
  static validatePriceIntegrity(aiResponseText: string, knownProducts: { name: string; price: number }[]): boolean {
    for (const product of knownProducts) {
      if (aiResponseText.toLowerCase().includes(product.name.toLowerCase())) {
        const regex = new RegExp(`${product.name}[^\\d]*(\\d[\\d,.]*)`, 'i');
        const match = aiResponseText.match(regex);
        if (match && match[1]) {
          const mentionedPrice = parseFloat(match[1].replace(/,/g, ''));
          if (Math.abs(mentionedPrice - product.price) > 100) {
            console.warn(`Price mismatch detected for ${product.name}: mentioned ${mentionedPrice}, actual ${product.price}`);
            return false;
          }
        }
      }
    }
    return true;
  }
}
