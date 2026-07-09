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
  row(
    'METFORMINA',
    'ENALAPRIL',
    'MODERADA',
    'Riesgo de hipoglucemia o alteración de función renal en combinación.',
    'Monitorizar glucemia y función renal.',
  ),
  row(
    'AMIODARONA',
    'DIGOXINA',
    'GRAVE',
    'Amiodarona incrementa niveles de digoxina → toxicidad digitálica.',
    'Reducir dosis de digoxina y monitorizar.',
  ),
  row(
    'FLUOXETINA',
    'TRAMADOL',
    'GRAVE',
    'Riesgo de síndrome serotoninérgico.',
    'Evitar combinación; consultar al médico.',
  ),
  row(
    'CARBAMAZEPINA',
    'ACIDO VALPROICO',
    'MODERADA',
    'Interacción farmacocinética que puede alterar niveles plasmáticos.',
    'Vigilar signos de toxicidad o ineficacia.',
  ),
  row(
    'ATORVASTATINA',
    'GEMFIBROZILO',
    'GRAVE',
    'Aumenta riesgo de rabdomiólisis por elevación de estatinas.',
    'Evitar combinación o usar dosis mínima de estatina.',
  ),
  row(
    'LITIO',
    'IBUPROFENO',
    'GRAVE',
    'AINEs reducen excreción de litio → toxicidad.',
    'Evitar AINEs; preferir paracetamol con control de litio.',
  ),
  row(
    'CLONIDINA',
    'PROPRANOLOL',
    'GRAVE',
    'Suspensión brusca de clonidina con betabloqueador puede causar crisis hipertensiva rebote.',
    'No suspender clonidina abruptamente.',
  ),
];
