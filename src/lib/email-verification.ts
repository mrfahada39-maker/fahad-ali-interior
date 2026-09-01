/** True when local/dev may skip verified-email checks (see SKIP_EMAIL_VERIFICATION + NEXTAUTH_URL). */
export function shouldSkipEmailVerification(): boolean {
  if (process.env.SKIP_EMAIL_VERIFICATION !== 'true') return false;
  if (process.env.NODE_ENV !== 'production') return true;
  const url = process.env.NEXTAUTH_URL ?? '';
  return url.includes('localhost') || url.includes('127.0.0.1');
}
