export type BU = "cppem" | "unicive";

export const PRODUCT_LINES_CPPEM = [
  { id: "mentorias", label: "Mentorias" },
  { id: "cursos_digitais", label: "Cursos e Materiais Digitais" },
  { id: "fisicos", label: "Produtos Fisicos" },
  { id: "turma_pmal", label: "Turma Presencial - PMAL" },
  { id: "turma_pmpe", label: "Turma Presencial - PMPE" },
  { id: "turma_carreiras", label: "Turma Presencial - Carreiras Policiais" },
] as const;

export const PRODUCT_LINES_UNICIVE = [
  { id: "matriculas", label: "Matriculas" },
] as const;

export type ProductLineId =
  | (typeof PRODUCT_LINES_CPPEM)[number]["id"]
  | (typeof PRODUCT_LINES_UNICIVE)[number]["id"];

export function productLinesFor(bu: BU) {
  return bu === "cppem" ? PRODUCT_LINES_CPPEM : PRODUCT_LINES_UNICIVE;
}

export function productLabel(id: string): string {
  const all = [...PRODUCT_LINES_CPPEM, ...PRODUCT_LINES_UNICIVE];
  return all.find((p) => p.id === id)?.label ?? id;
}

export const TURMAS = [
  { id: "turma_pmal", label: "PMAL" },
  { id: "turma_pmpe", label: "PMPE" },
  { id: "turma_carreiras", label: "Carreiras Policiais" },
] as const;
