import type { BU } from "./products";

export const LOGO_CPPEM =
  "https://raw.githubusercontent.com/marketing942/fotos-dos-bots/main/LOGO%20CPPEM.png";

export const LOGO_UNICIVE =
  "https://raw.githubusercontent.com/marketing942/fotos-dos-bots/main/Polo%20Caruaru-%20PE%20(1).png";

export const LOGO_COLEGIO: string | null =
  "https://raw.githubusercontent.com/marketing942/fotos-dos-bots/main/LOGO%20COLE%CC%81GIO.png";

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

// ====== Tema visual por BU (brand books oficiais) ======
// `bg` aplica um gradient overlay na area do dashboard daquela BU.
// `accent2` e a cor secundaria oficial (dourado, etc) — usar com moderacao.
// `headerBg` define o fundo do header da BU dentro do dashboard.
export const BU_THEME: Record<
  BU,
  {
    accent: string;
    accent2: string;
    bg: string;        // gradient css completo
    headerBg: string;  // gradient compact do header
    surface: string;   // cor de fundo de cards-lg dentro daquela BU
  }
> = {
  cppem: {
    accent: "#00E63C",
    accent2: "#C9A84C",
    bg: "radial-gradient(900px 320px at 15% 0%, rgba(0,230,60,0.16), transparent 60%), radial-gradient(700px 280px at 90% 8%, rgba(201,168,76,0.10), transparent 60%)",
    headerBg: "linear-gradient(120deg, rgba(0,230,60,0.18), rgba(26,61,43,0.55))",
    surface: "rgba(13,34,25,0.6)",
  },
  unicive: {
    accent: "#F5C518",
    accent2: "#1E7A2F",
    bg: "radial-gradient(900px 320px at 15% 0%, rgba(245,197,24,0.16), transparent 60%), radial-gradient(700px 280px at 90% 8%, rgba(30,122,47,0.20), transparent 60%)",
    headerBg: "linear-gradient(120deg, rgba(245,197,24,0.20), rgba(10,31,13,0.7))",
    surface: "rgba(17,38,20,0.6)",
  },
  colegio_cppem: {
    accent: "#C9A227",
    accent2: "#5B8FE0",
    bg: "radial-gradient(900px 320px at 15% 0%, rgba(91,143,224,0.18), transparent 60%), radial-gradient(700px 280px at 90% 8%, rgba(201,162,39,0.14), transparent 60%)",
    headerBg: "linear-gradient(120deg, rgba(91,143,224,0.22), rgba(13,27,62,0.78))",
    surface: "rgba(22,34,71,0.55)",
  },
};
