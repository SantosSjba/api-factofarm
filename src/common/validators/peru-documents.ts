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

/** Valida pasaporte (6–12 alfanumérico). */
export function isValidPasaporte(value: string): boolean {
  return /^[A-Za-z0-9]{6,12}$/.test(value.trim());
}

/** Valida documento OTRO (1–20 alfanumérico / guiones). */
export function isValidOtroDocumento(value: string): boolean {
  return /^[A-Za-z0-9-]{1,20}$/.test(value.trim());
}

/** Celular: opcional `+` + 7–15 dígitos. */
export function isValidCelular(value: string): boolean {
  return /^\+?\d{7,15}$/.test(value.trim());
}

/**
 * Valida número según tipo de documento de identidad.
 * Vacío es válido (campo opcional); el caller decide si tipo+número son obligatorios juntos.
 */
export function isValidIdentityDocumentNumber(
  tipo: string | undefined | null,
  numero: string | undefined | null,
): boolean {
  const value = numero?.trim() ?? '';
  if (!value) return true;
  if (tipo === 'DNI') return isValidDni(value);
  if (tipo === 'CE') return isValidCe(value);
  if (tipo === 'PASAPORTE') return isValidPasaporte(value);
  if (tipo === 'OTRO') return isValidOtroDocumento(value);
  if (tipo === 'RUC') return isValidRuc(value);
  // Sin tipo: no validar formato aquí (el caller exige tipo).
  return true;
}

export function identityDocumentNumberMessage(
  tipo: string | undefined | null,
): string {
  if (tipo === 'DNI') return 'DNI debe tener 8 dígitos.';
  if (tipo === 'CE') return 'CE debe tener 9 a 12 caracteres alfanuméricos.';
  if (tipo === 'PASAPORTE')
    return 'Pasaporte debe tener 6 a 12 caracteres alfanuméricos.';
  if (tipo === 'OTRO')
    return 'Número de documento no válido (alfanumérico / guiones, máx. 20).';
  if (tipo === 'RUC') return 'RUC no válido.';
  return 'Número de documento no válido para el tipo seleccionado.';
}
