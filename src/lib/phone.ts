export function normalizePhoneNumber(value: string) {
  if (!value) return '';

  const digitsOnly = value.replace(/\D/g, '');

  if (digitsOnly.length > 11 && digitsOnly.startsWith('86')) {
    return digitsOnly.slice(2);
  }

  return digitsOnly;
}
