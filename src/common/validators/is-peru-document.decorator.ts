import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { isValidCe, isValidDni, isValidRuc } from './peru-documents';

type DocHolder = { tipoDocumento?: string };

@ValidatorConstraint({ name: 'isPeruDocument', async: false })
export class IsPeruDocumentConstraint implements ValidatorConstraintInterface {
  validate(numero: string, args: ValidationArguments): boolean {
    const value = numero?.trim();
    if (!value) return true;

    const tipo = (args.object as DocHolder).tipoDocumento;
    if (tipo === 'RUC') return isValidRuc(value);
    if (tipo === 'DNI') return isValidDni(value);
    if (tipo === 'CE') return isValidCe(value);
    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    const tipo = (args.object as DocHolder).tipoDocumento ?? 'documento';
    return `Número de documento inválido para tipo ${tipo}`;
  }
}

export function IsPeruDocument(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPeruDocumentConstraint,
    });
  };
}
