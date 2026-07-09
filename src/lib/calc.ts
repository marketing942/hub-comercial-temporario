export const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 2,
});

export const fmtInt = new Intl.NumberFormat("pt-BR");
export const fmtPct = (v: number) =>
  `${(Number.isFinite(v) ? v : 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

// =====================================================
// Fuso horario: tudo no horario de Recife (BRT, UTC-3).
// O servidor roda em UTC, entao precisamos converter
// pra calcular "agora", "hoje", "este mes" etc.
// =====================================================
export const TIME_ZONE = "America/Recife";

export function nowRecife(): Date {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value || 0);
  const hour = get("hour");
  return new Date(
    get("year"),
    get("month") - 1,
    get("day"),
    hour === 24 ? 0 : hour,
    get("minute"),
    get("second")
  );
}

// Data ISO (YYYY-MM-DD) considerando o fuso de Recife
export function todayISORecife(): string {
  const n = nowRecife();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

export function periodNow() {
  const now = nowRecife();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export function todayDayOfMonth(year: number, month: number) {
  const now = nowRecife();
  if (now.getFullYear() !== year || now.getMonth() + 1 !== month) {
    return daysInMonth(year, month);
  }
  return now.getDate();
}

export function daysRemainingIncludingToday(year: number, month: number) {
  const total = daysInMonth(year, month);
  const today = todayDayOfMonth(year, month);
  return Math.max(1, total - today + 1);
}

// =====================================================
// Dias uteis (segunda a sexta) — usado na Meta do Dia
// Nao considera feriados (implementacao simples).
// =====================================================
export function isBusinessDay(year: number, month: number, day: number): boolean {
  const d = new Date(Date.UTC(year, month - 1, day));
  const dow = d.getUTCDay(); // 0=dom, 6=sab
  return dow >= 1 && dow <= 5;
}

export function businessDaysInMonth(year: number, month: number): number {
  const total = daysInMonth(year, month);
  let count = 0;
  for (let d = 1; d <= total; d++) {
    if (isBusinessDay(year, month, d)) count++;
  }
  return count;
}

// Dias uteis do primeiro dia do mes ate hoje (incluindo hoje).
// Se hoje for sabado/domingo, conta so os uteis ate a ultima sexta.
export function businessDaysElapsed(year: number, month: number): number {
  const today = todayDayOfMonth(year, month);
  let count = 0;
  for (let d = 1; d <= today; d++) {
    if (isBusinessDay(year, month, d)) count++;
  }
  return count;
}

// Dias uteis restantes ate o fim do mes (incluindo hoje se hoje for util).
// Minimo 1 pra nao dividir por zero.
export function businessDaysRemainingIncludingToday(year: number, month: number): number {
  const total = daysInMonth(year, month);
  const today = todayDayOfMonth(year, month);
  let count = 0;
  for (let d = today; d <= total; d++) {
    if (isBusinessDay(year, month, d)) count++;
  }
  return Math.max(1, count);
}

export type SaleRow = {
  id: string;
  seller_id: string;
  sale_date: string;
  product_line: string;
  valor: number;
  quantidade: number;
};

export type SellerStats = {
  sellerId: string;
  sellerName: string;
  bu: "cppem" | "unicive" | "colegio_cppem";
  avatarUrl?: string | null;
  avatarColor?: string;
  metaTotal: number;
  realizado: number;
  falta: number;
  pctSucesso: number;
  ticketMeta: number;
  ticketReal: number;
  conversaoMeta: number;
  conversaoReal: number;
  leads: number;
  leadsMeta: number;
  vendasCount: number;
  qtdRealizada: number;
  qtdMeta: number;
  // Total de vendas do vendedor no mes em TODAS as BUs (nao so a do contexto).
  // Usado no calculo de conversao real pois leads nao distinguem por BU.
  vendasCountTotal: number;
  // Ritmo
  metaRitmoInicial: number;   // meta / total_dias_mes (o quanto era pra fazer/dia desde o inicio)
  metaIdealAteHoje: number;   // ritmo_inicial * dia_atual (era pra ter ate agora)
  gap: number;                // metaIdealAteHoje - realizado (positivo = atrasado)
  metaDia: number;            // (meta - realizado) / dias_restantes_incluindo_hoje
  realizadoHoje: number;
  qtdHoje: number;
  valorHoje: number;
};

export function computeSellerStats(args: {
  seller: {
    id: string;
    name: string;
    bu: "cppem" | "unicive" | "colegio_cppem";
    avatar_url?: string | null;
    avatar_color?: string;
  };
  productGoals: { product_line: string; valor_meta: number; quantidade_meta: number }[];
  monthly: {
    ticket_medio_meta: number;
    taxa_conversao_meta: number;
    valor_meta?: number;
    quantidade_meta?: number;
    leads_meta?: number;
  } | null;
  sales: SaleRow[];
  // Total de vendas do vendedor no mes em TODAS as BUs (sem filtro por
  // product_line). Quando nao passado, fallback para sales.length.
  vendasCountTotal?: number;
  leadsMonth: number;
  year: number;
  month: number;
}): SellerStats {
  const { seller, productGoals, monthly, sales, leadsMonth, year, month } = args;
  const isUni = seller.bu === "unicive" || seller.bu === "colegio_cppem";

  // Fonte preferencial: monthly_goals.valor_meta/quantidade_meta (fluxo novo).
  // Fallback: soma de product_goals (compat com dados antigos).
  const sumProdValor = productGoals.reduce((s, g) => s + Number(g.valor_meta || 0), 0);
  const sumProdQtd = productGoals.reduce((s, g) => s + Number(g.quantidade_meta || 0), 0);
  const monthlyValor = Number(monthly?.valor_meta || 0);
  const monthlyQtd = Number(monthly?.quantidade_meta || 0);
  const valorMetaTotal = monthlyValor > 0 ? monthlyValor : sumProdValor;
  const qtdMetaTotal = monthlyQtd > 0 ? monthlyQtd : sumProdQtd;

  const realizadoValor = sales.reduce((s, r) => s + Number(r.valor || 0), 0);
  const realizadoQtd = sales.reduce((s, r) => s + Number(r.quantidade || 0), 0);
  const vendasCount = sales.length;

  const todayStr = todayISORecife();
  const nowR = nowRecife();
  const isCurrentMonth =
    nowR.getFullYear() === year && nowR.getMonth() + 1 === month;
  const todaySales = isCurrentMonth ? sales.filter((s) => s.sale_date === todayStr) : [];
  const valorHoje = todaySales.reduce((a, b) => a + Number(b.valor || 0), 0);
  const qtdHoje = todaySales.reduce((a, b) => a + Number(b.quantidade || 0), 0);
  const realizadoHoje = isUni ? qtdHoje : valorHoje;

  const metaTotal = isUni ? qtdMetaTotal : valorMetaTotal;
  const realizado = isUni ? realizadoQtd : realizadoValor;
  const falta = Math.max(0, metaTotal - realizado);
  const pctSucesso = metaTotal > 0 ? (realizado / metaTotal) * 100 : 0;

  // Dias UTEIS (seg a sex) — vendemos so em dias uteis, entao a meta
  // e distribuida por eles.
  const bDaysTotal = businessDaysInMonth(year, month);
  const bDaysElapsed = businessDaysElapsed(year, month);
  const bDaysLeft = businessDaysRemainingIncludingToday(year, month);

  const metaRitmoInicial = bDaysTotal > 0 ? metaTotal / bDaysTotal : 0;
  const metaIdealAteHoje = metaRitmoInicial * bDaysElapsed;
  const gap = metaIdealAteHoje - realizado;

  // Meta do dia: quanto precisa fazer HOJE pra voltar ao ritmo necessario.
  // Se ja bateu meta, metaDia = 0. Caso contrario, divide o que falta
  // pelos dias restantes incluindo hoje — ja embute o gap automaticamente.
  const metaDia = falta > 0 ? falta / bDaysLeft : 0;

  const ticketReal = realizadoQtd > 0 ? realizadoValor / realizadoQtd : 0;
  const ticketMeta = Number(monthly?.ticket_medio_meta || 0);
  // Conversao usa o TOTAL de vendas do vendedor no mes (todas as BUs),
  // porque leads nao distinguem BU. Se o caller nao passou,
  // fallback pro vendasCount filtrado por BU.
  const vendasCountTotalV = Number(args.vendasCountTotal ?? vendasCount);
  const conversaoReal = leadsMonth > 0 ? (vendasCountTotalV / leadsMonth) * 100 : 0;
  const conversaoMeta = Number(monthly?.taxa_conversao_meta || 0);
  const leadsMetaV = Number(monthly?.leads_meta || 0);

  return {
    sellerId: seller.id,
    sellerName: seller.name,
    bu: seller.bu,
    avatarUrl: seller.avatar_url ?? null,
    avatarColor: seller.avatar_color,
    metaTotal,
    realizado,
    falta,
    pctSucesso,
    ticketMeta,
    ticketReal,
    conversaoMeta,
    conversaoReal,
    leads: leadsMonth,
    leadsMeta: leadsMetaV,
    vendasCount,
    qtdRealizada: realizadoQtd,
    qtdMeta: qtdMetaTotal,
    vendasCountTotal: vendasCountTotalV,
    metaRitmoInicial,
    metaIdealAteHoje,
    gap,
    metaDia,
    realizadoHoje,
    qtdHoje,
    valorHoje,
  };
}
