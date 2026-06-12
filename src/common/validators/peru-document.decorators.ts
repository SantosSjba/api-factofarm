import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { isValidDni, isValidRuc } from './peru-documents';

export function IsValidRuc(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isValidRuc',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (value == null || value === '') return true;
          return typeof value === 'string' && isValidRuc(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} no es un RUC válido`;
        },
      },
    });
  };
}

export function IsValidDni(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isValidDni',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (value == null || value === '') return true;
          return typeof value === 'string' && isValidDni(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} no es un DNI válido`;
        },
      },
    });
  };
}
