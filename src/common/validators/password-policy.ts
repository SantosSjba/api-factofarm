const MIN_LENGTH = 8;
const HAS_UPPER = /[A-Z]/;
const HAS_LOWER = /[a-z]/;
const HAS_DIGIT = /\d/;
const HAS_SPECIAL = /[^A-Za-z0-9]/;

export type PasswordValidationResult = {
  valid: boolean;
  errors: string[];
};

/** Política de contraseñas FactoFarm (Fase 0). */
export function validatePasswordPolicy(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < MIN_LENGTH) {
    errors.push(`Mínimo ${MIN_LENGTH} caracteres`);
  }
  if (!HAS_UPPER.test(password)) {
    errors.push('Debe incluir al menos una mayúscula');
  }
  if (!HAS_LOWER.test(password)) {
    errors.push('Debe incluir al menos una minúscula');
  }
  if (!HAS_DIGIT.test(password)) {
    errors.push('Debe incluir al menos un número');
  }
  if (!HAS_SPECIAL.test(password)) {
    errors.push('Debe incluir al menos un carácter especial');
  }

  return { valid: errors.length === 0, errors };
}
