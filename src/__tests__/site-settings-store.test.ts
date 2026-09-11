import { describe, it, expect, beforeEach } from '@jest/globals';
import { useSiteSettingsStore } from '@/store';

describe('Site Settings Zustand Store', () => {
  beforeEach(() => {
    useSiteSettingsStore.setState({ settings: null, hydrated: false });
  });

  it('initializes with null settings and unhydrated state', () => {
    const state = useSiteSettingsStore.getState();
    expect(state.settings).toBeNull();
    expect(state.hydrated).toBe(false);
  });

  it('updates settings and flags hydrated as true', () => {
    useSiteSettingsStore.getState().setSettings({
      siteName: 'Fahad Ali Atelier',
      contactPhone: '+92 300 1234567',
      adminEmail: 'atelier@fahad-ali.com',
      currency: 'PKR',
      themeAccentColor: '#D4AF37',
    });

    const state = useSiteSettingsStore.getState();
    expect(state.hydrated).toBe(true);
    expect(state.settings?.siteName).toBe('Fahad Ali Atelier');
    expect(state.settings?.currency).toBe('PKR');
    expect(state.settings?.themeAccentColor).toBe('#D4AF37');
  });

  it('stores full social and contact metadata', () => {
    useSiteSettingsStore.getState().setSettings({
      socialWhatsapp: '923001234567',
      socialInstagram: 'fahadaliinterior',
      socialFacebook: 'fahadaliinterior',
      foundedYear: '2018',
    });

    const settings = useSiteSettingsStore.getState().settings;
    expect(settings?.socialWhatsapp).toBe('923001234567');
    expect(settings?.socialInstagram).toBe('fahadaliinterior');
    expect(settings?.foundedYear).toBe('2018');
  });
});
