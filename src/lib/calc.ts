export const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 2,
});

export const fmtInt = new Intl.NumberFormat("pt-BR");
export const fmtPct = (v: number) =>
  `${(Number.isFinite(v) ? v : 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

export function periodNow() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export function todayDayOfMonth(year: number, month: number) {
  const now = new Date();
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
  bu: "cppem" | "unicive";
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
  vendasCount: number;
  qtdRealizada: number;
  qtdMeta: number;
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
    bu: "cppem" | "unicive";
    avatar_url?: string | null;
    avatar_color?: string;
  };
  productGoals: { product_line: string; valor_meta: number; quantidade_meta: number }[];
  monthly: {
    ticket_medio_meta: number;
    taxa_conversao_meta: number;
    valor_meta?: number;
    quantidade_meta?: number;
  } | null;
  sales: SaleRow[];
  leadsMonth: number;
  year: number;
  month: number;
}): SellerStats {
  const { seller, productGoals, monthly, sales, leadsMonth, year, month } = args;
  const isUni = seller.bu === "unicive";

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

  const todayStr = new Date().toISOString().slice(0, 10);
  const isCurrentMonth =
    new Date().getFullYear() === year && new Date().getMonth() + 1 === month;
  const todaySales = isCurrentMonth ? sales.filter((s) => s.sale_date === todayStr) : [];
  const valorHoje = todaySales.reduce((a, b) => a + Number(b.valor || 0), 0);
  const qtdHoje = todaySales.reduce((a, b) => a + Number(b.quantidade || 0), 0);
  const realizadoHoje = isUni ? qtdHoje : valorHoje;

  const metaTotal = isUni ? qtdMetaTotal : valorMetaTotal;
  const realizado = isUni ? realizadoQtd : realizadoValor;
  const falta = Math.max(0, metaTotal - realizado);
  const pctSucesso = metaTotal > 0 ? (realizado / metaTotal) * 100 : 0;

  const totalDays = daysInMonth(year, month);
  const today = todayDayOfMonth(year, month);
  const daysLeft = daysRemainingIncludingToday(year, month);

  const metaRitmoInicial = metaTotal / totalDays;
  const metaIdealAteHoje = metaRitmoInicial * today;
  const gap = metaIdealAteHoje - realizado;

  // Meta do dia: quanto precisa fazer HOJE pra voltar ao ritmo necessario.
  // Se ja bateu meta, metaDia = 0. Caso contrario, divide o que falta
  // pelos dias restantes incluindo hoje — ja embute o gap automaticamente.
  const metaDia = falta > 0 ? falta / daysLeft : 0;

  const ticketReal = realizadoQtd > 0 ? realizadoValor / realizadoQtd : 0;
  const ticketMeta = Number(monthly?.ticket_medio_meta || 0);
  const conversaoReal = leadsMonth > 0 ? (vendasCount / leadsMonth) * 100 : 0;
  const conversaoMeta = Number(monthly?.taxa_conversao_meta || 0);

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
    vendasCount,
    qtdRealizada: realizadoQtd,
    qtdMeta: qtdMetaTotal,
    metaRitmoInicial,
    metaIdealAteHoje,
    gap,
    metaDia,
    realizadoHoje,
    qtdHoje,
    valorHoje,
  };
}
