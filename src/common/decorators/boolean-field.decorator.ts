import { Transform } from 'class-transformer';

/** Convierte solo booleanos válidos; los demás valores llegan a IsBoolean y fallan. */
export function BooleanField(): PropertyDecorator {
  return Transform(({ value, obj, key }) => {
    const original: unknown =
      (obj as Record<string, unknown>)?.[key] ?? (value as unknown);
    if (original === true || original === 'true') return true;
    if (original === false || original === 'false') return false;
    return original;
  });
}
