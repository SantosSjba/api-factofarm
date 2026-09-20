import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import {
  identityDocumentNumberMessage,
  isValidIdentityDocumentNumber,
} from './peru-documents';

type DocHolder = { tipoDocumento?: string };

@ValidatorConstraint({ name: 'isPeruDocument', async: false })
export class IsPeruDocumentConstraint implements ValidatorConstraintInterface {
  validate(numero: string, args: ValidationArguments): boolean {
    const tipo = (args.object as DocHolder).tipoDocumento;
    return isValidIdentityDocumentNumber(tipo, numero);
  }

  defaultMessage(args: ValidationArguments): string {
    const tipo = (args.object as DocHolder).tipoDocumento ?? null;
    return identityDocumentNumberMessage(tipo);
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
