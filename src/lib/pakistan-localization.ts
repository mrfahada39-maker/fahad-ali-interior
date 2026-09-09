/**
 * Comprehensive Pakistani E-Commerce Localization Engine
 * Provides Pakistani Rupee formatting, mobile network detection,
 * courier integration helpers, and official SBP Raast details.
 */

export interface CityInfo {
  province: string;
  postalCode: string;
  estDeliveryDays: string;
}

export const PAKISTAN_CITIES: Record<string, CityInfo> = {
  Lahore: { province: 'Punjab', postalCode: '54000', estDeliveryDays: '1-2 Days (Same-City Atelier)' },
  Karachi: { province: 'Sindh', postalCode: '74000', estDeliveryDays: '3-4 Days' },
  Islamabad: { province: 'Islamabad Capital Territory', postalCode: '44000', estDeliveryDays: '2-3 Days' },
  Rawalpindi: { province: 'Punjab', postalCode: '46000', estDeliveryDays: '2-3 Days' },
  Faisalabad: { province: 'Punjab', postalCode: '38000', estDeliveryDays: '2-3 Days' },
  Multan: { province: 'Punjab', postalCode: '60000', estDeliveryDays: '2-3 Days' },
  Chiniot: { province: 'Punjab', postalCode: '35400', estDeliveryDays: '1-2 Days (Atelier Express)' },
  Gujranwala: { province: 'Punjab', postalCode: '52250', estDeliveryDays: '2 Days' },
  Sialkot: { province: 'Punjab', postalCode: '51310', estDeliveryDays: '2-3 Days' },
  Gujrat: { province: 'Punjab', postalCode: '50700', estDeliveryDays: '2-3 Days' },
  Peshawar: { province: 'Khyber Pakhtunkhwa (KPK)', postalCode: '25000', estDeliveryDays: '3-4 Days' },
  Quetta: { province: 'Balochistan', postalCode: '87300', estDeliveryDays: '4-5 Days' },
  Bahawalpur: { province: 'Punjab', postalCode: '63100', estDeliveryDays: '3 Days' },
  Sargodha: { province: 'Punjab', postalCode: '40100', estDeliveryDays: '2-3 Days' },
  Sahiwal: { province: 'Punjab', postalCode: '57000', estDeliveryDays: '2 Days' },
  'Rahim Yar Khan': { province: 'Punjab', postalCode: '64200', estDeliveryDays: '3-4 Days' },
  Jhelum: { province: 'Punjab', postalCode: '49600', estDeliveryDays: '2-3 Days' },
  Sheikhupura: { province: 'Punjab', postalCode: '39350', estDeliveryDays: '1-2 Days' },
  Kasur: { province: 'Punjab', postalCode: '55050', estDeliveryDays: '1-2 Days' },
  Okara: { province: 'Punjab', postalCode: '56300', estDeliveryDays: '2 Days' },
  Sukkur: { province: 'Sindh', postalCode: '65200', estDeliveryDays: '3-4 Days' },
  Hyderabad: { province: 'Sindh', postalCode: '71000', estDeliveryDays: '3-4 Days' },
  Larkana: { province: 'Sindh', postalCode: '77150', estDeliveryDays: '4 Days' },
  Abbottabad: { province: 'Khyber Pakhtunkhwa (KPK)', postalCode: '22010', estDeliveryDays: '3-4 Days' },
  Mardan: { province: 'Khyber Pakhtunkhwa (KPK)', postalCode: '23200', estDeliveryDays: '3-4 Days' },
  Swat: { province: 'Khyber Pakhtunkhwa (KPK)', postalCode: '19230', estDeliveryDays: '4-5 Days' },
  'Dera Ghazi Khan': { province: 'Punjab', postalCode: '32200', estDeliveryDays: '3-4 Days' },
  'Mirpur (AJK)': { province: 'Azad Jammu & Kashmir (AJK)', postalCode: '10250', estDeliveryDays: '3-4 Days' },
  'Muzaffarabad (AJK)': { province: 'Azad Jammu & Kashmir (AJK)', postalCode: '13100', estDeliveryDays: '4 Days' },
  Gilgit: { province: 'Gilgit-Baltistan', postalCode: '15100', estDeliveryDays: '4-5 Days' },
  Skardu: { province: 'Gilgit-Baltistan', postalCode: '16100', estDeliveryDays: '5 Days' },
  Gwadar: { province: 'Balochistan', postalCode: '91200', estDeliveryDays: '5 Days' },
};

export const PAKISTAN_PROVINCES = [
  'Punjab',
  'Sindh',
  'Khyber Pakhtunkhwa (KPK)',
  'Balochistan',
  'Islamabad Capital Territory',
  'Azad Jammu & Kashmir (AJK)',
  'Gilgit-Baltistan',
];

/**
 * Formats a currency amount into standard Pakistani Rupee (PKR).
 */
export function formatPKR(amount: number): string {
  return `Rs. ${new Intl.NumberFormat('en-PK').format(Math.round(amount))}`;
}

/**
 * Detects Pakistani telecom operator based on national 4-digit dialing prefix.
 */
export function detectPakistaniTelecom(phone: string): { name: string; brandColor: string } | null {
  const cleaned = phone.replace(/[^0-9]/g, '');
  // Normalize 923xxxxxxxxx or 03xxxxxxxxx to 03xxxxxxxxx
  let local = cleaned;
  if (local.startsWith('92') && local.length === 12) {
    local = '0' + local.slice(2);
  }

  if (local.length < 4) return null;
  const prefix = local.slice(0, 4);

  // Jazz / Mobilink (0300 - 0309, 0320 - 0329)
  if (/^03(0[0-9]|2[0-9])$/.test(prefix)) {
    return { name: 'Jazz 4G', brandColor: '#D9222A' };
  }
  // Zong 4G (0310 - 0319)
  if (/^031[0-9]$/.test(prefix)) {
    return { name: 'Zong 4G', brandColor: '#8CC63F' };
  }
  // Ufone 4G (0330 - 0339)
  if (/^033[0-9]$/.test(prefix)) {
    return { name: 'Ufone 4G', brandColor: '#F47920' };
  }
  // Telenor 4G (0340 - 0349)
  if (/^034[0-9]$/.test(prefix)) {
    return { name: 'Telenor 4G', brandColor: '#00A1E0' };
  }
  // SCOM (0355)
  if (prefix === '0355') {
    return { name: 'SCOM (AJK & GB)', brandColor: '#0055A5' };
  }

  return null;
}

/**
 * Validates whether an input phone number is a valid Pakistani phone number.
 */
export function isValidPakistaniPhone(phone: string): boolean {
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.length === 11 && cleaned.startsWith('03')) return true;
  if (cleaned.length === 12 && cleaned.startsWith('923')) return true;
  return false;
}

/**
 * State Bank of Pakistan (SBP) Raast Instant Payment Gateway Credentials
 */
export const RAAST_SBP_DETAILS = {
  serviceName: 'Raast (State Bank of Pakistan)',
  raastId: '03001234567',
  accountTitle: 'Fahad Ali Interior (Pvt) Ltd',
  iban: 'PK56MEZN0001088010203040',
  bankName: 'Meezan Bank Limited',
  fee: '0% (Zero Fee National Instant Transfer)',
  instructions: 'Open your banking app, select Raast / Send Money via Raast, enter our Raast ID or IBAN for instant 0ms settlement.',
};

/**
 * Major Pakistani Courier Tracking Partners
 */
export const PAKISTANI_COURIERS = [
  { id: 'tcs', name: 'TCS Express', trackingUrl: 'https://www.tcsexpress.com/track/' },
  { id: 'leopard', name: 'Leopards Courier', trackingUrl: 'https://www.leopardscourier.com/tracking/' },
  { id: 'trax', name: 'Trax Logistics', trackingUrl: 'https://trax.pk/tracking/' },
  { id: 'callcourier', name: 'CallCourier', trackingUrl: 'https://callcourier.com.pk/tracking/' },
  { id: 'mnp', name: 'M&P Express', trackingUrl: 'https://mulphilog.com/track/' },
];
