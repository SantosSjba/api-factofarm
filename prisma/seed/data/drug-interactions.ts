import type { DrugInteractionSeverity } from '../../../src/generated/prisma/client';

export type DrugInteractionSeed = {
  principioA: string;
  principioB: string;
  severidad: DrugInteractionSeverity;
  descripcion: string;
  recomendacion?: string;
};

function pair(a: string, b: string): [string, string] {
  const na = a.trim().toUpperCase();
  const nb = b.trim().toUpperCase();
  return na <= nb ? [na, nb] : [nb, na];
}

function row(
  a: string,
  b: string,
  severidad: DrugInteractionSeverity,
  descripcion: string,
  recomendacion?: string,
): DrugInteractionSeed {
  const [principioA, principioB] = pair(a, b);
  return { principioA, principioB, severidad, descripcion, recomendacion };
}

/** Interacciones de referencia para alertas POS (catálogo ampliable en Fase 6). */
export const drugInteractionsData: DrugInteractionSeed[] = [
  row(
    'WARFARINA',
    'IBUPROFENO',
    'GRAVE',
    'Aumenta riesgo de sangrado por inhibición plaquetaria y efecto anticoagulante.',
    'Evitar combinación o monitorizar INR; consultar al médico.',
  ),
  row(
    'WARFARINA',
    'ACIDO ACETILSALICILICO',
    'GRAVE',
    'Incrementa significativamente el riesgo hemorrágico.',
    'No dispensar sin autorización médica.',
  ),
  row(
    'WARFARINA',
    'PARACETAMOL',
    'MODERADA',
    'Dosis altas o uso prolongado de paracetamol puede potenciar el efecto anticoagulante.',
    'Informar al paciente; vigilar signos de sangrado.',
  ),
  row(
    'SIMVASTATINA',
    'CLARITROMICINA',
    'GRAVE',
    'La claritromicina eleva niveles de estatinas → riesgo de rabdomiólisis.',
    'Suspender estatina durante tratamiento antibiótico o usar alternativa.',
  ),
  row(
    'METFORMINA',
    'CONTRASTE YODADO',
    'MODERADA',
    'Riesgo de acidosis láctica por función renal comprometida post-contraste.',
    'Suspender metformina 48 h antes y después del estudio con contraste.',
  ),
  row(
    'LOSARTAN',
    'POTASIO',
    'MODERADA',
    'Hiperpotasemia por retención de potasio con IECA/ARA-II y suplementos.',
    'Evitar suplementos de potasio sin control médico.',
  ),
  row(
    'OMEPRAZOL',
    'CLARITROMICINA',
    'LEVE',
    'Omeprazol puede alterar absorción de algunos antibióticos.',
    'Separar administración 2 h si es posible.',
  ),
];
