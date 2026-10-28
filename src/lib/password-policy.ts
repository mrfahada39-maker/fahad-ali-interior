import bcrypt from 'bcryptjs';

/**
 * Enterprise Password Policy & Constant-Time Protection
 *
 * Rules:
 * - Minimum 10 characters, maximum 128 characters
 * - Must contain letters and numbers
 * - Strict check against comprehensive list of common/leaked passwords
 * - Dummy bcrypt compare for constant-time authentication (defeats user enumeration timing attacks)
 */

const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password12', 'password123', 'password1234', 'password12345',
  '1234567890', '12345678901', '123456789012', '0987654321', '1234512345',
  'qwerty1234', 'qwerty12345', 'qwertyuiop', 'asdfghjkl1', 'zxcvbnm123',
  'admin12345', 'administrator', 'adminpassword', 'welcome123', 'welcome1234',
  'letmein123', 'letmein1234', 'iloveyou123', 'monkey1234', 'dragon1234',
  'master1234', 'sunshine123', 'princess123', 'football123', 'baseball123',
  'superman12', 'batman1234', 'trustno123', 'shadow1234', 'killer1234',
  'charlie123', 'michael123', 'jordan1234', 'harley1234', 'robert1234',
  'pakistan12', 'pakistan123', 'lahore1234', 'karachi123', 'fahadali123',
  'sheesham12', 'furniture1', 'luxury1234', 'interiors1', 'interiors12',
]);

// Pre-computed valid 60-char bcrypt hash with cost 12 for constant-time dummy compare
const DUMMY_BCRYPT_HASH = '$2b$12$Mvm3eahlf.LRYNy9PCUsf.CQoRiT9U2uMsII7XZQ/HRCoZEwJTrka';

export function validatePasswordStrength(password: string): { valid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < 10) {
    return { valid: false, error: 'Password must be at least 10 characters long' };
  }

  if (password.length > 128) {
    return { valid: false, error: 'Password cannot exceed 128 characters' };
  }

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!hasLetter || !hasNumber) {
    return { valid: false, error: 'Password must contain both letters and numbers for high security.' };
  }

  if (COMMON_PASSWORDS.has(password.toLowerCase().trim())) {
    return { valid: false, error: 'This password is too common and easily guessed. Please choose a stronger password.' };
  }

  return { valid: true };
}

/** Runs a dummy bcrypt comparison to ensure constant-time response when user is not found. */
export async function runDummyBcryptCompare(password: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, DUMMY_BCRYPT_HASH);
  } catch {
    return false;
  }
}
