import { describe, it, expect } from '@jest/globals';
import {
  formatPKR,
  detectPakistaniTelecom,
  isValidPakistaniPhone,
  PAKISTAN_CITIES,
  PAKISTAN_PROVINCES,
  RAAST_SBP_DETAILS,
  PAKISTANI_COURIERS,
} from '@/lib/pakistan-localization';

describe('Pakistani Localization Engine', () => {
  describe('formatPKR', () => {
    it('formats numbers into Pakistani Rupee currency string', () => {
      expect(formatPKR(250000)).toMatch(/Rs\.\s*250,000/);
      expect(formatPKR(1500)).toMatch(/Rs\.\s*1,500/);
      expect(formatPKR(0)).toMatch(/Rs\.\s*0/);
    });

    it('rounds decimal rupee values correctly', () => {
      expect(formatPKR(99.8)).toMatch(/Rs\.\s*100/);
      expect(formatPKR(99.2)).toMatch(/Rs\.\s*99/);
    });
  });

  describe('detectPakistaniTelecom', () => {
    it('identifies Jazz / Mobilink numbers (0300-0309, 0320-0329)', () => {
      expect(detectPakistaniTelecom('03001234567')?.name).toBe('Jazz 4G');
      expect(detectPakistaniTelecom('+92 301 9876543')?.name).toBe('Jazz 4G');
      expect(detectPakistaniTelecom('923215555555')?.name).toBe('Jazz 4G');
    });

    it('identifies Zong numbers (0310-0319)', () => {
      expect(detectPakistaniTelecom('03129876543')?.name).toBe('Zong 4G');
      expect(detectPakistaniTelecom('+92 315 1122334')?.name).toBe('Zong 4G');
    });

    it('identifies Ufone numbers (0330-0339)', () => {
      expect(detectPakistaniTelecom('03335551234')?.name).toBe('Ufone 4G');
      expect(detectPakistaniTelecom('+92 331 4445566')?.name).toBe('Ufone 4G');
    });

    it('identifies Telenor numbers (0340-0349)', () => {
      expect(detectPakistaniTelecom('03451234567')?.name).toBe('Telenor 4G');
      expect(detectPakistaniTelecom('+92 346 9988776')?.name).toBe('Telenor 4G');
    });

    it('identifies SCOM numbers (0355)', () => {
      expect(detectPakistaniTelecom('03551234567')?.name).toBe('SCOM (AJK & GB)');
    });

    it('returns null for incomplete or invalid prefixes', () => {
      expect(detectPakistaniTelecom('03')).toBeNull();
      expect(detectPakistaniTelecom('0423123456')).toBeNull();
      expect(detectPakistaniTelecom('')).toBeNull();
    });
  });

  describe('isValidPakistaniPhone', () => {
    it('accepts valid 11-digit mobile numbers starting with 03', () => {
      expect(isValidPakistaniPhone('03001234567')).toBe(true);
      expect(isValidPakistaniPhone('0345-9876543')).toBe(true);
      expect(isValidPakistaniPhone('0312 3344556')).toBe(true);
    });

    it('accepts valid 12-digit mobile numbers starting with 923', () => {
      expect(isValidPakistaniPhone('+92 300 1234567')).toBe(true);
      expect(isValidPakistaniPhone('923459876543')).toBe(true);
    });

    it('rejects invalid numbers', () => {
      expect(isValidPakistaniPhone('02131234567')).toBe(false);
      expect(isValidPakistaniPhone('12345')).toBe(false);
      expect(isValidPakistaniPhone('')).toBe(false);
      expect(isValidPakistaniPhone('0300123456789')).toBe(false);
    });
  });

  describe('PAKISTAN_CITIES and Provinces', () => {
    it('contains major metropolitan hubs across Pakistan', () => {
      expect(PAKISTAN_CITIES['Lahore']).toBeDefined();
      expect(PAKISTAN_CITIES['Karachi']).toBeDefined();
      expect(PAKISTAN_CITIES['Islamabad']).toBeDefined();
      expect(PAKISTAN_CITIES['Peshawar']).toBeDefined();
      expect(PAKISTAN_CITIES['Quetta']).toBeDefined();
      expect(PAKISTAN_CITIES['Chiniot']).toBeDefined();
      expect(PAKISTAN_CITIES['Gilgit']).toBeDefined();
      expect(PAKISTAN_CITIES['Mirpur (AJK)']).toBeDefined();
    });

    it('provides postal codes and transit timelines', () => {
      expect(PAKISTAN_CITIES['Lahore'].postalCode).toBe('54000');
      expect(PAKISTAN_CITIES['Lahore'].province).toBe('Punjab');
      expect(PAKISTAN_CITIES['Lahore'].estDeliveryDays).toContain('1-2 Days');

      expect(PAKISTAN_CITIES['Karachi'].postalCode).toBe('74000');
      expect(PAKISTAN_CITIES['Karachi'].province).toBe('Sindh');
    });

    it('covers all official provinces and administrative territories', () => {
      expect(PAKISTAN_PROVINCES).toContain('Punjab');
      expect(PAKISTAN_PROVINCES).toContain('Sindh');
      expect(PAKISTAN_PROVINCES).toContain('Khyber Pakhtunkhwa (KPK)');
      expect(PAKISTAN_PROVINCES).toContain('Balochistan');
      expect(PAKISTAN_PROVINCES).toContain('Islamabad Capital Territory');
      expect(PAKISTAN_PROVINCES).toContain('Azad Jammu & Kashmir (AJK)');
      expect(PAKISTAN_PROVINCES).toContain('Gilgit-Baltistan');
    });
  });

  describe('RAAST_SBP_DETAILS and Couriers', () => {
    it('verifies State Bank Raast payment configuration', () => {
      expect(RAAST_SBP_DETAILS.iban).toMatch(/^PK\d{2}[A-Z]{4}\d{16}$/);
      expect(RAAST_SBP_DETAILS.bankName).toBe('Meezan Bank Limited');
      expect(RAAST_SBP_DETAILS.fee).toContain('0%');
    });

    it('lists major national courier partners', () => {
      const courierIds = PAKISTANI_COURIERS.map((c) => c.id);
      expect(courierIds).toContain('tcs');
      expect(courierIds).toContain('leopard');
      expect(courierIds).toContain('trax');
    });
  });
});
