import { validatePasswordPolicy } from './password-policy';
describe('Política de contraseñas y límite del algoritmo', () => {
  it('acepta 72 bytes completos y rechaza el byte adicional', () => {
    expect(validatePasswordPolicy('A1!' + 'a'.repeat(69)).valid).toBe(true);
    expect(validatePasswordPolicy('A1!' + 'a'.repeat(70)).valid).toBe(false);
  });
  it('cuenta bytes de Unicode y no solo caracteres', () => {
    expect(validatePasswordPolicy('A1!' + '😀'.repeat(18)).valid).toBe(false);
  });
});
