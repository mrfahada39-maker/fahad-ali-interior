import { create } from 'zustand';

export type SiteSettings = {
  siteName?: string | null;
  contactPhone?: string | null;
  adminEmail?: string | null;
  storeAddress?: string | null;
  socialInstagram?: string | null;
  socialFacebook?: string | null;
  socialWhatsapp?: string | null;
  foundedYear?: string | null;
  currency?: string | null;
  themeFontFamily?: string | null;
  themeBgColor?: string | null;
  themeSurfaceColor?: string | null;
  themeBorderColor?: string | null;
  themeDarkColor?: string | null;
  themeMutedColor?: string | null;
  themeAccentColor?: string | null;
};

interface SiteSettingsStore {
  settings: SiteSettings | null;
  hydrated: boolean;
  setSettings: (settings: SiteSettings) => void;
}

export const useSiteSettingsStore = create<SiteSettingsStore>((set) => ({
  settings: null,
  hydrated: false,
  setSettings: (settings) => set({ settings, hydrated: true }),
}));
