/** Valida RUC peruano (11 dígitos + dígito verificador módulo 11). */
export function isValidRuc(ruc: string): boolean {
  const digits = ruc.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (!/^(10|15|16|17|20)/.test(digits)) return false;

  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += Number(digits[i]) * weights[i];
  }
  const remainder = sum % 11;
  const check = remainder === 0 ? 0 : remainder === 1 ? 1 : 11 - remainder;
  return check === Number(digits[10]);
}

/** Valida DNI peruano (8 dígitos numéricos). */
export function isValidDni(dni: string): boolean {
  return /^\d{8}$/.test(dni.replace(/\D/g, ''));
}

/** Valida CE peruano (9–12 caracteres alfanuméricos). */
export function isValidCe(ce: string): boolean {
  return /^[A-Za-z0-9]{9,12}$/.test(ce.trim());
}
