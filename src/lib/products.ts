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

// ===== Status da ligacao Onvox no momento da venda =====
export const LIGACAO_STATUSES = [
  {
    id: "consegui_direto",
    label: "Consegui diretamente pela ligacao",
    short: "Direto pela ligacao",
    color: "#22c55e",
  },
  {
    id: "consegui_indireto",
    label: "Consegui indiretamente com ligacao",
    short: "Indireto com ligacao",
    color: "#06b6d4",
  },
  {
    id: "sem_ligacao",
    label: "Nao houve nenhuma ligacao",
    short: "Sem ligacao",
    color: "#94a3b8",
  },
] as const;

export type LigacaoStatusId = (typeof LIGACAO_STATUSES)[number]["id"];

export function ligacaoLabel(id: string) {
  return LIGACAO_STATUSES.find((s) => s.id === id)?.label || id;
}
export function ligacaoShort(id: string) {
  return LIGACAO_STATUSES.find((s) => s.id === id)?.short || id;
}
export function ligacaoColor(id: string) {
  return LIGACAO_STATUSES.find((s) => s.id === id)?.color || "#94a3b8";
}
