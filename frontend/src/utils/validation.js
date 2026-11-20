/**
 * Strict Mobile Number Validation
 * Rules:
 * - Required (cannot be empty)
 * - Digits only (0-9)
 * - Length: Exactly 10 digits
 * - Starting digit: Must start with 6, 7, 8, or 9
 * - Cannot start with 0 or 1-5
 * - No alphabets, special characters, spaces, or decimals
 */
export function validateMobileNumber(mobile) {
  if (!mobile || !mobile.trim()) {
    return 'Mobile Number is required.';
  }
  const clean = mobile.trim();
  if (/\s/.test(clean)) {
    return 'Mobile number cannot contain spaces.';
  }
  if (/\./.test(clean)) {
    return 'Mobile number cannot contain decimal values.';
  }
  if (/[a-zA-Z]/.test(clean)) {
    return 'Mobile number cannot contain alphabets.';
  }
  if (/\D/.test(clean)) {
    return 'Mobile number cannot contain special characters (digits 0–9 only).';
  }
  if (clean.length !== 10) {
    return 'Mobile number must be exactly 10 digits.';
  }
  if (clean.startsWith('0')) {
    return 'Mobile number cannot start with 0. Must start with 6, 7, 8, or 9.';
  }
  if (/^[1-5]/.test(clean)) {
    return 'Mobile number cannot start with 1–5. Must start with 6, 7, 8, or 9.';
  }
  if (!/^[6-9]\d{9}$/.test(clean)) {
    return 'Mobile number must start with 6, 7, 8, or 9.';
  }
  return null;
}

/**
 * Strict Email Address Validation
 * Rules:
 * - Required (cannot be empty)
 * - Exactly one '@' symbol
 * - Username required (cannot be empty, max 64 chars)
 * - Domain required (cannot be empty, max 254 chars total)
 * - Must contain valid domain extension (.com, .in, .org, etc.)
 * - No spaces
 * - No consecutive dots ('..') in username or domain
 * - Cannot start or end with a dot
 * - Valid domain characters (letters, numbers, hyphens, dots)
 * - No consecutive '@'
 */
export function validateEmailAddress(email) {
  if (!email || !email.trim()) {
    return 'Email ID is required.';
  }
  const clean = email.trim();
  if (clean.length > 254) {
    return 'Email address cannot exceed 254 characters.';
  }
  if (/\s/.test(clean)) {
    return 'Email address cannot contain spaces.';
  }
  const atCount = (clean.match(/@/g) || []).length;
  if (atCount === 0) {
    return "Email must contain an '@' symbol.";
  }
  if (atCount > 1) {
    return "Email must contain exactly one '@' symbol (no consecutive or duplicate '@').";
  }

  const [username, domain] = clean.split('@');

  // Username rules
  if (!username) {
    return 'Email username (before @) cannot be empty.';
  }
  if (username.length > 64) {
    return 'Email username cannot exceed 64 characters.';
  }
  if (username.startsWith('.')) {
    return 'Email username cannot start with a dot.';
  }
  if (username.endsWith('.')) {
    return 'Email username cannot end with a dot.';
  }
  if (/\.\./.test(username)) {
    return "Email cannot contain consecutive dots ('..').";
  }
  if (!/^[a-zA-Z0-9._%+-]+$/.test(username)) {
    return 'Email username contains invalid characters.';
  }

  // Domain rules
  if (!domain) {
    return 'Email domain (after @) cannot be empty.';
  }
  if (domain.startsWith('.')) {
    return 'Email domain cannot start with a dot.';
  }
  if (domain.endsWith('.')) {
    return 'Email domain cannot end with a dot.';
  }
  if (/\.\./.test(domain)) {
    return "Email domain cannot contain consecutive dots ('..').";
  }

  const domainParts = domain.split('.');
  if (domainParts.length < 2) {
    return 'Email domain must include a domain extension (e.g. .com, .in, .org).';
  }
  const ext = domainParts[domainParts.length - 1];
  if (!ext || ext.length < 2 || !/^[a-zA-Z]+$/.test(ext)) {
    return 'Email domain extension must be valid letters (e.g. .com, .in, .org).';
  }
  for (const part of domainParts) {
    if (!part) {
      return 'Email domain cannot contain empty segments.';
    }
    if (!/^[a-zA-Z0-9-]+$/.test(part)) {
      return 'Email domain can only contain letters, numbers, hyphens, and dots.';
    }
    if (part.startsWith('-') || part.endsWith('-')) {
      return 'Email domain parts cannot start or end with a hyphen.';
    }
  }

  return null;
}
