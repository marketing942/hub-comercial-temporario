import { supabaseAdmin } from "./supabase";
import {
  computeSellerStats,
  daysInMonth,
  daysRemainingIncludingToday,
  periodNow,
  todayDayOfMonth,
  type SellerStats,
} from "./calc";
import { productLabel, productIdsFor, buFromProductLine } from "./products";

export type Seller = {
  id: string;
  name: string;
  bu: "cppem" | "unicive" | "colegio_cppem";          // BU principal (compat)
  bus: ("cppem" | "unicive" | "colegio_cppem")[];      // todas as BUs em que o vendedor atua
  active: boolean;
  avatar_color: string;
  avatar_url?: string | null;
};

function sanitizeBus(raw: any, fallbackBu: "cppem" | "unicive" | "colegio_cppem"): ("cppem" | "unicive" | "colegio_cppem")[] {
  const arr = Array.isArray(raw) ? raw : [];
  const clean = arr.filter(
    (x) => x === "cppem" || x === "unicive" || x === "colegio_cppem"
  ) as ("cppem" | "unicive" | "colegio_cppem")[];
  return clean.length > 0 ? Array.from(new Set(clean)) : [fallbackBu];
}

function normalizeSeller(row: any): Seller {
  return {
    id: row.id,
    name: row.name,
    bu: row.bu,
    bus: sanitizeBus(row.bus, row.bu),
    active: row.active,
    avatar_color: row.avatar_color,
    avatar_url: row.avatar_url,
  };
}

export function buListOf(s: Pick<Seller, "bu" | "bus">): ("cppem" | "unicive" | "colegio_cppem")[] {
  return sanitizeBus(s.bus, s.bu);
}

export async function listSellers(opts?: { onlyActive?: boolean }): Promise<Seller[]> {
  let q = supabaseAdmin.from("sellers").select("*").order("name");
  if (opts?.onlyActive) q = q.eq("active", true);
  const { data } = await q;
  return ((data as any[]) || []).map(normalizeSeller);
}

export async function getSeller(id: string): Promise<Seller | null> {
  const { data } = await supabaseAdmin.from("sellers").select("*").eq("id", id).maybeSingle();
  return data ? normalizeSeller(data) : null;
}

export async function listSellersOfBu(bu: "cppem" | "unicive" | "colegio_cppem", opts?: { onlyActive?: boolean }): Promise<Seller[]> {
  const all = await listSellers(opts);
  return all.filter((s) => buListOf(s).includes(bu));
}

// =====================================================
// Stats por vendedor — agora SEMPRE atrelado a uma BU.
// Pra vendedor multi-BU, statsForAll devolve 1 entrada por (seller, bu).
// =====================================================
export async function statsForSellerInBu(
  seller: Seller,
  bu: "cppem" | "unicive" | "colegio_cppem",
  opts?: { year?: number; month?: number }
): Promise<SellerStats> {
  const { year, month } = { ...periodNow(), ...opts };
  const firstDay = `${year}-${String(month).padStart(2, "0")}-01`;
  const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
  const lastDay = `${next.y}-${String(next.m).padStart(2, "0")}-01`;

  const productIds = productIdsFor(bu) as unknown as string[];

  const [{ data: pg }, { data: mg }, { data: sl }, { data: lds }] = await Promise.all([
    supabaseAdmin
      .from("product_goals")
      .select("product_line, valor_meta, quantidade_meta")
      .eq("seller_id", seller.id)
      .eq("year", year)
      .eq("month", month)
      .in("product_line", productIds),
    supabaseAdmin
      .from("monthly_goals")
      .select("ticket_medio_meta, taxa_conversao_meta, valor_meta, quantidade_meta, leads_meta")
      .eq("seller_id", seller.id)
      .eq("bu", bu)
      .eq("year", year)
      .eq("month", month)
      .maybeSingle(),
    supabaseAdmin
      .from("sales")
      .select("*")
      .eq("seller_id", seller.id)
      .in("product_line", productIds)
      .gte("sale_date", firstDay)
      .lt("sale_date", lastDay),
    supabaseAdmin
      .from("daily_leads")
      .select("qty")
      .eq("seller_id", seller.id)
      .gte("date", firstDay)
      .lt("date", lastDay),
  ]);

  const leadsMonth = (lds || []).reduce((s: number, r: any) => s + Number(r.qty || 0), 0);

  return computeSellerStats({
    seller: {
      id: seller.id,
      name: seller.name,
      bu,
      avatar_url: seller.avatar_url,
      avatar_color: seller.avatar_color,
    },
    productGoals: (pg as any) || [],
    monthly: (mg as any) || null,
    sales: (sl as any) || [],
    leadsMonth,
    year,
    month,
  });
}

// Compat: 1 stats por vendedor — agora retorna array (1+) pra suportar multi-BU.
export async function statsForSeller(
  sellerId: string,
  opts?: { year?: number; month?: number }
): Promise<SellerStats[]> {
  const seller = await getSeller(sellerId);
  if (!seller) return [];
  const tasks = buListOf(seller).map((bu) => statsForSellerInBu(seller, bu, opts));
  return Promise.all(tasks);
}

export async function statsForAll(opts?: { year?: number; month?: number }): Promise<SellerStats[]> {
  const sellers = await listSellers({ onlyActive: true });
  const tasks: Promise<SellerStats>[] = [];
  for (const s of sellers) {
    for (const bu of buListOf(s)) {
      tasks.push(statsForSellerInBu(s, bu, opts));
    }
  }
  return Promise.all(tasks);
}

// =====================================================
// Series por BU para o dashboard
// =====================================================

export type DailySeriesRow = { day: string; valor: number; qtd: number; leads: number };
export type CumulativeRow = { day: string; pct: number; idealPct: number };

export type BUSeries = {
  daily: DailySeriesRow[];
  cumulative: CumulativeRow[];
  totals: {
    valor: number;
    qtd: number;
    meta: number;
    metaValor: number;     // meta de FATURAMENTO da BU (uteis pra Unicive tambem)
    ticketReal: number;
    ticketMeta: number;
    metaIdealAteHoje: number;
    metaRitmoInicial: number;
    gap: number;
    metaDia: number;
    realizado: number;
    valorHoje: number;
    qtdHoje: number;
    realizadoHoje: number;
    leadsMeta: number;
  };
};

export async function buSeries(
  bu: "cppem" | "unicive" | "colegio_cppem",
  opts?: { year?: number; month?: number }
): Promise<BUSeries> {
  const { year, month } = { ...periodNow(), ...opts };
  const firstDay = `${year}-${String(month).padStart(2, "0")}-01`;
  const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
  const lastDay = `${next.y}-${String(next.m).padStart(2, "0")}-01`;
  const total = daysInMonth(year, month);

  const sellers = await listSellers({ onlyActive: true });
  const buSellers = sellers.filter((s) => buListOf(s).includes(bu));
  const ids = buSellers.map((s) => s.id);
  const productIds = productIdsFor(bu) as unknown as string[];

  if (ids.length === 0) {
    const empty: DailySeriesRow[] = Array.from({ length: total }, (_, i) => ({
      day: String(i + 1).padStart(2, "0") + "/" + String(month).padStart(2, "0"),
      valor: 0,
      qtd: 0,
      leads: 0,
    }));
    return {
      daily: empty,
      cumulative: empty.map((d, i) => ({ day: d.day, pct: 0, idealPct: ((i + 1) / total) * 100 })),
      totals: {
        valor: 0, qtd: 0, meta: 0, metaValor: 0, ticketReal: 0, ticketMeta: 0,
        metaIdealAteHoje: 0, metaRitmoInicial: 0, gap: 0, metaDia: 0,
        realizado: 0, valorHoje: 0, qtdHoje: 0, realizadoHoje: 0,
        leadsMeta: 0,
      },
    };
  }

  const [{ data: sales }, { data: pgoals }, { data: mgoals }, { data: bm }, { data: leadsRows }] = await Promise.all([
    supabaseAdmin
      .from("sales")
      .select("seller_id, sale_date, valor, quantidade, product_line")
      .in("seller_id", ids)
      .in("product_line", productIds)
      .gte("sale_date", firstDay)
      .lt("sale_date", lastDay),
    supabaseAdmin
      .from("product_goals")
      .select("seller_id, valor_meta, quantidade_meta, product_line")
      .in("seller_id", ids)
      .in("product_line", productIds)
      .eq("year", year)
      .eq("month", month),
    supabaseAdmin
      .from("monthly_goals")
      .select("seller_id, ticket_medio_meta, valor_meta, quantidade_meta")
      .in("seller_id", ids)
      .eq("bu", bu)
      .eq("year", year)
      .eq("month", month),
    supabaseAdmin
      .from("bu_meta")
      .select("leads_meta")
      .eq("bu", bu)
      .eq("year", year)
      .eq("month", month)
      .maybeSingle(),
    supabaseAdmin
      .from("daily_leads")
      .select("date, qty")
      .in("seller_id", ids)
      .gte("date", firstDay)
      .lt("date", lastDay),
  ]);
  const leadsMeta = Number((bm as any)?.leads_meta || 0);

  // Meta total: prioridade pra monthly_goals (fluxo novo); fallback pra soma de product_goals
  const mgValor = (mgoals || []).reduce((a: number, b: any) => a + Number(b.valor_meta || 0), 0);
  const mgQtd = (mgoals || []).reduce((a: number, b: any) => a + Number(b.quantidade_meta || 0), 0);
  const pgValor = (pgoals || []).reduce((a: number, b: any) => a + Number(b.valor_meta || 0), 0);
  const pgQtd = (pgoals || []).reduce((a: number, b: any) => a + Number(b.quantidade_meta || 0), 0);
  const metaValor = mgValor > 0 ? mgValor : pgValor;
  const qtdMeta = mgQtd > 0 ? mgQtd : pgQtd;

  const ticketMetaAvg = (mgoals || []).length > 0
    ? (mgoals || []).reduce((a: number, b: any) => a + Number(b.ticket_medio_meta || 0), 0) / (mgoals || []).length
    : 0;

  const buckets: Record<string, { valor: number; qtd: number; leads: number }> = {};
  for (let d = 1; d <= total; d++) {
    const k = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    buckets[k] = { valor: 0, qtd: 0, leads: 0 };
  }
  for (const r of (sales as any[]) || []) {
    const k = String(r.sale_date).slice(0, 10);
    if (!buckets[k]) buckets[k] = { valor: 0, qtd: 0, leads: 0 };
    buckets[k].valor += Number(r.valor || 0);
    buckets[k].qtd += Number(r.quantidade || 0);
  }
  for (const r of (leadsRows as any[]) || []) {
    const k = String(r.date).slice(0, 10);
    if (!buckets[k]) buckets[k] = { valor: 0, qtd: 0, leads: 0 };
    buckets[k].leads += Number(r.qty || 0);
  }

  const isQtd = bu === "unicive" || bu === "colegio_cppem";
  const meta = isQtd ? qtdMeta : metaValor;

  const daily: DailySeriesRow[] = [];
  const cumulative: CumulativeRow[] = [];
  let runValor = 0;
  let runQtd = 0;
  for (let d = 1; d <= total; d++) {
    const k = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const b = buckets[k];
    runValor += b.valor;
    runQtd += b.qtd;
    const label = `${String(d).padStart(2, "0")}/${String(month).padStart(2, "0")}`;
    daily.push({ day: label, valor: b.valor, qtd: b.qtd, leads: b.leads });
    const real = isQtd ? runQtd : runValor;
    const pct = meta > 0 ? (real / meta) * 100 : 0;
    cumulative.push({ day: label, pct, idealPct: (d / total) * 100 });
  }

  const totalValor = Object.values(buckets).reduce((a, b) => a + b.valor, 0);
  const totalQtd = Object.values(buckets).reduce((a, b) => a + b.qtd, 0);
  const ticketReal = totalQtd > 0 ? totalValor / totalQtd : 0;

  const today = todayDayOfMonth(year, month);
  const daysLeft = daysRemainingIncludingToday(year, month);
  const realizado = isQtd ? totalQtd : totalValor;
  const falta = Math.max(0, meta - realizado);
  const metaRitmoInicial = meta / total;
  const metaIdealAteHoje = metaRitmoInicial * today;
  const gap = metaIdealAteHoje - realizado;
  const metaDia = falta > 0 ? falta / daysLeft : 0;

  const todayLabel = `${String(today).padStart(2, "0")}/${String(month).padStart(2, "0")}`;
  const hojeBucket = daily.find((d) => d.day === todayLabel) || { valor: 0, qtd: 0 };
  const realizadoHoje = isQtd ? hojeBucket.qtd : hojeBucket.valor;

  return {
    daily,
    cumulative,
    totals: {
      valor: totalValor,
      qtd: totalQtd,
      meta,
      metaValor,
      ticketReal,
      ticketMeta: ticketMetaAvg,
      metaIdealAteHoje,
      metaRitmoInicial,
      gap,
      metaDia,
      realizado,
      valorHoje: hojeBucket.valor,
      qtdHoje: hojeBucket.qtd,
      realizadoHoje,
      leadsMeta,
    },
  };
}

// =====================================================
// Breakdown por linha de produto (mantem fluxo de bu_product_goals)
// =====================================================
export type ProductBreakdownRow = {
  product_line: string;
  label: string;
  valor: number;
  qtd: number;
  valor_meta: number;
  quantidade_meta: number;
};

export async function productBreakdown(
  bu: "cppem" | "unicive" | "colegio_cppem",
  opts?: { year?: number; month?: number }
): Promise<ProductBreakdownRow[]> {
  const { year, month } = { ...periodNow(), ...opts };
  const firstDay = `${year}-${String(month).padStart(2, "0")}-01`;
  const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
  const lastDay = `${next.y}-${String(next.m).padStart(2, "0")}-01`;

  const sellers = await listSellers({ onlyActive: true });
  const buSellers = sellers.filter((s) => buListOf(s).includes(bu));
  const ids = buSellers.map((s) => s.id);
  const productIds = productIdsFor(bu) as unknown as string[];

  const map: Record<string, ProductBreakdownRow> = {};
  productIds.forEach((id) => {
    map[id] = {
      product_line: id,
      label: productLabel(id),
      valor: 0,
      qtd: 0,
      valor_meta: 0,
      quantidade_meta: 0,
    };
  });

  const [{ data: sales }, { data: buGoals }, { data: legacyGoals }] = await Promise.all([
    ids.length === 0
      ? Promise.resolve({ data: [] })
      : supabaseAdmin
          .from("sales")
          .select("product_line, valor, quantidade")
          .in("seller_id", ids)
          .in("product_line", productIds)
          .gte("sale_date", firstDay)
          .lt("sale_date", lastDay),
    supabaseAdmin
      .from("bu_product_goals")
      .select("product_line, valor_meta, quantidade_meta")
      .eq("bu", bu)
      .eq("year", year)
      .eq("month", month),
    ids.length === 0
      ? Promise.resolve({ data: [] })
      : supabaseAdmin
          .from("product_goals")
          .select("product_line, valor_meta, quantidade_meta")
          .in("seller_id", ids)
          .in("product_line", productIds)
          .eq("year", year)
          .eq("month", month),
  ]);

  for (const s of (sales as any[]) || []) {
    if (map[s.product_line]) {
      map[s.product_line].valor += Number(s.valor || 0);
      map[s.product_line].qtd += Number(s.quantidade || 0);
    }
  }
  const hasBuGoals = (buGoals as any[])?.length > 0;
  if (hasBuGoals) {
    for (const g of (buGoals as any[]) || []) {
      if (map[g.product_line]) {
        map[g.product_line].valor_meta = Number(g.valor_meta || 0);
        map[g.product_line].quantidade_meta = Number(g.quantidade_meta || 0);
      }
    }
  } else {
    for (const g of (legacyGoals as any[]) || []) {
      if (map[g.product_line]) {
        map[g.product_line].valor_meta += Number(g.valor_meta || 0);
        map[g.product_line].quantidade_meta += Number(g.quantidade_meta || 0);
      }
    }
  }
  return Object.values(map);
}

// =====================================================
// Ligacoes Onvox
// =====================================================
export type LigacaoRow = { status: string; count: number; valor: number };

export async function ligacaoBreakdown(opts?: {
  bu?: "cppem" | "unicive" | "colegio_cppem";
  year?: number;
  month?: number;
}): Promise<LigacaoRow[]> {
  const { year, month } = { ...periodNow(), ...opts };
  const firstDay = `${year}-${String(month).padStart(2, "0")}-01`;
  const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
  const lastDay = `${next.y}-${String(next.m).padStart(2, "0")}-01`;

  const seed = (): LigacaoRow[] => [
    { status: "consegui_direto", count: 0, valor: 0 },
    { status: "consegui_indireto", count: 0, valor: 0 },
    { status: "sem_ligacao", count: 0, valor: 0 },
  ];

  let q = supabaseAdmin
    .from("sales")
    .select("ligacao_status, valor, product_line")
    .gte("sale_date", firstDay)
    .lt("sale_date", lastDay);

  if (opts?.bu) {
    const productIds = productIdsFor(opts.bu) as unknown as string[];
    q = q.in("product_line", productIds);
  }

  const { data } = await q;
  const acc: Record<string, LigacaoRow> = {
    consegui_direto: { status: "consegui_direto", count: 0, valor: 0 },
    consegui_indireto: { status: "consegui_indireto", count: 0, valor: 0 },
    sem_ligacao: { status: "sem_ligacao", count: 0, valor: 0 },
  };
  for (const r of (data as any[]) || []) {
    const k = r.ligacao_status || "sem_ligacao";
    if (!acc[k]) acc[k] = { status: k, count: 0, valor: 0 };
    acc[k].count += 1;
    acc[k].valor += Number(r.valor || 0);
  }
  return Object.values(acc);
}

// =====================================================
// Snapshot do dashboard
// =====================================================
export type DashboardSnapshot = {
  bu: "cppem" | "unicive" | "colegio_cppem";
  series: BUSeries;
  sellers: SellerStats[];
  taxaConversao: number;
  leadsTotal: number;
  breakdown: ProductBreakdownRow[];
  ligacao: LigacaoRow[];
};

export async function dashboardSnapshot(
  bu: "cppem" | "unicive" | "colegio_cppem",
  opts?: { year?: number; month?: number }
): Promise<DashboardSnapshot> {
  const [series, all, breakdown, ligacao] = await Promise.all([
    buSeries(bu, opts),
    statsForAll(opts),
    productBreakdown(bu, opts),
    ligacaoBreakdown({ bu, ...opts }),
  ]);
  const sellers = all.filter((s) => s.bu === bu);
  const leadsTotal = sellers.reduce((a, b) => a + b.leads, 0);
  const vendas = sellers.reduce((a, b) => a + b.vendasCount, 0);
  const taxaConversao = leadsTotal > 0 ? (vendas / leadsTotal) * 100 : 0;
  return { bu, series, sellers, leadsTotal, taxaConversao, breakdown, ligacao };
}

export { daysInMonth, daysRemainingIncludingToday, todayDayOfMonth, periodNow };
