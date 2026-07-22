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
// Feriados nacionais do Brasil (fixos + moveis por ano)
// Retorna Set de "MM-DD" pra lookup rapido.
// Cache por ano pra nao recalcular em cada chamada.
// =====================================================
const _holidayCache = new Map<number, Set<string>>();

// Domingo de Pascoa (algoritmo de Meeus/Jones/Butcher)
function easterSunday(year: number): { month: number; day: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const L = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * L) / 451);
  const month = Math.floor((h + L - 7 * m + 114) / 31);
  const day = ((h + L - 7 * m + 114) % 31) + 1;
  return { month, day };
}

function addDays(year: number, month: number, day: number, delta: number) {
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() + delta);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}
function mmdd(month: number, day: number) {
  return `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function getBrazilianHolidays(year: number): Set<string> {
  const cached = _holidayCache.get(year);
  if (cached) return cached;

  const set = new Set<string>();
  // ---- Fixos ----
  set.add("01-01"); // Confraternizacao Universal
  set.add("04-21"); // Tiradentes
  set.add("05-01"); // Dia do Trabalho
  set.add("09-07"); // Independencia
  set.add("10-12"); // N. Sra. Aparecida
  set.add("11-02"); // Finados
  set.add("11-15"); // Proclamacao da Republica
  set.add("11-20"); // Consciencia Negra (feriado nacional desde 2024)
  set.add("12-25"); // Natal

  // ---- Moveis (baseados na Pascoa) ----
  const easter = easterSunday(year);
  // Sexta-feira Santa = Pascoa - 2
  const goodFriday = addDays(year, easter.month, easter.day, -2);
  set.add(mmdd(goodFriday.month, goodFriday.day));
  // Carnaval segunda (-48) e terca (-47) — nao sao feriado nacional
  // oficial mas o comercial nao trabalha; consideramos como nao-util.
  const carnavalTue = addDays(year, easter.month, easter.day, -47);
  const carnavalMon = addDays(year, easter.month, easter.day, -48);
  set.add(mmdd(carnavalTue.month, carnavalTue.day));
  set.add(mmdd(carnavalMon.month, carnavalMon.day));
  // Corpus Christi = Pascoa + 60
  const corpus = addDays(year, easter.month, easter.day, 60);
  set.add(mmdd(corpus.month, corpus.day));

  _holidayCache.set(year, set);
  return set;
}

export function isBrazilianHoliday(year: number, month: number, day: number): boolean {
  return getBrazilianHolidays(year).has(mmdd(month, day));
}

// =====================================================
// Dias uteis (segunda a sexta, EXCLUINDO feriados nacionais)
// =====================================================
export function isBusinessDay(year: number, month: number, day: number): boolean {
  const d = new Date(Date.UTC(year, month - 1, day));
  const dow = d.getUTCDay(); // 0=dom, 6=sab
  if (dow < 1 || dow > 5) return false;
  if (isBrazilianHoliday(year, month, day)) return false;
  return true;
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

// =====================================================
// Pace + Projecao (helpers pra cards do dashboard)
//   pace     = realizado - esperado_ate_agora  (>0 = acima do ritmo)
//   projecao = realizado extrapolado ate o fim do mes (dias uteis)
// =====================================================
export type PaceProjection = {
  expectedByNow: number;
  paceDelta: number;      // real - esperado (positivo = acima)
  paceIsAhead: boolean;   // true se paceDelta >= 0 (com meta > 0)
  hasMeta: boolean;
  projecao: number;
  pctProjecao: number;    // projecao / meta * 100
};

export function paceProjection(
  realizado: number,
  meta: number,
  bDaysElapsed: number,
  bDaysTotal: number
): PaceProjection {
  const hasMeta = meta > 0 && bDaysTotal > 0;
  const expectedByNow = hasMeta && bDaysTotal > 0 ? meta * (bDaysElapsed / bDaysTotal) : 0;
  const paceDelta = realizado - expectedByNow;
  const projecao = bDaysElapsed > 0 ? realizado * (bDaysTotal / bDaysElapsed) : 0;
  const pctProjecao = meta > 0 ? (projecao / meta) * 100 : 0;
  return {
    expectedByNow,
    paceDelta,
    paceIsAhead: hasMeta && paceDelta >= 0,
    hasMeta,
    projecao,
    pctProjecao,
  };
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
  // Sempre em R$ (independente de qual e a metrica primaria da BU)
  // Uteis para calculo de comissao, que roda sempre sobre receita.
  valorRealizado: number;
  valorMeta: number;
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
  // Meta primaria = quantidade so pro Colegio CPPEM. Unicive agora foca
  // em faturamento (matriculas viram metrica secundaria).
  const isUni = seller.bu === "colegio_cppem";

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
    valorRealizado: realizadoValor,
    valorMeta: valorMetaTotal,
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
