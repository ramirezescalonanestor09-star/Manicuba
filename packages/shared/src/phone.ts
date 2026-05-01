const E164_REGEX = /^\+?[1-9]\d{6,14}$/;

export function normalizePhone(input: string): string {
  const trimmed = input.trim().replace(/\s+|-/g, '');
  if (trimmed.startsWith('+')) return trimmed;
  if (trimmed.startsWith('00')) return `+${trimmed.slice(2)}`;
  if (/^5\d{7}$/.test(trimmed)) return `+53${trimmed}`;
  return trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
}

export function isValidPhone(input: string): boolean {
  return E164_REGEX.test(normalizePhone(input));
}

export function phoneDigitsOnly(input: string): string {
  return normalizePhone(input).replace(/\D/g, '');
}
