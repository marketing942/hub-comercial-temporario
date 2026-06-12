import type { BU } from "./products";

export const LOGO_CPPEM =
  "https://raw.githubusercontent.com/marketing942/fotos-dos-bots/main/LOGO%20CPPEM.png";

export const LOGO_UNICIVE =
  "https://raw.githubusercontent.com/marketing942/fotos-dos-bots/main/Polo%20Caruaru-%20PE%20(1).png";

// TODO: substituir pela logo oficial do Colegio CPPEM quando enviada
export const LOGO_COLEGIO: string | null = null;

export const BU_LOGO: Record<BU, string | null> = {
  cppem: LOGO_CPPEM,
  unicive: LOGO_UNICIVE,
  colegio_cppem: LOGO_COLEGIO,
};

// Cores oficiais dos brand books (cada BU tem uma cor identificavel
// distinta usada nos chips, logos e elementos de identidade — NUNCA
// nos numeros, que seguem a paleta semantica COLOR.*)
export const BU_COLOR: Record<BU, string> = {
  cppem: "#00E63C",         // verde neon CPPEM
  unicive: "#F5C518",       // dourado Unicive
  colegio_cppem: "#5B8FE0", // azul Colegio (derivado do #1E2F5E)
};

export const BU_LABEL: Record<BU, string> = {
  cppem: "CPPEM",
  unicive: "UNICIVE",
  colegio_cppem: "Colegio CPPEM",
};

export const BU_CHIP_CLASS: Record<BU, string> = {
  cppem: "chip-cppem",
  unicive: "chip-unicive",
  colegio_cppem: "chip-colegio",
};

// ====== Padronizacao de cores dos numeros ======
// Use SEMPRE estas cores semanticas pra valores numericos,
// nao as cores das BUs (que servem so pra identificacao).
export const COLOR = {
  ok: "#22c55e",       // bateu / sucesso
  warning: "#facc15",  // meta / urgencia
  danger: "#ef4444",   // atrasado
  info: "#7dd3fc",     // ticket / conversao / informativo
  neutral: "#e8efe9",  // texto principal (branco esverdeado)
  mute: "#94a3b8",     // texto secundario
};

// Cor estrategica do numero baseada em estado (sucesso / atencao / atraso)
export function tonePctMeta(pct: number, gap: number): string {
  if (pct >= 100) return COLOR.ok;
  if (gap > 0) return COLOR.danger;
  return COLOR.neutral;
}
