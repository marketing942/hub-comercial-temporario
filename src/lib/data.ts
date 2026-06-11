import { supabaseAdmin } from "./supabase";
import {
  computeSellerStats,
  daysInMonth,
  daysRemainingIncludingToday,
  periodNow,
  todayDayOfMonth,
  type SellerStats,
} from "./calc";
import { productLabel } from "./products";

export type Seller = {
  id: string;
  name: string;
  bu: "cppem" | "unicive";
  active: boolean;
  avatar_color: string;
  avatar_url?: string | null;
};

export async function listSellers(opts?: { onlyActive?: boolean }): Promise<Seller[]> {
  let q = supabaseAdmin.from("sellers").select("*").order("name");
  if (opts?.onlyActive) q = q.eq("active", true);
  const { data } = await q;
  return (data as Seller[]) || [];
}

export async function getSeller(id: string): Promise<Seller | null> {
  const { data } = await supabaseAdmin.from("sellers").select("*").eq("id", id).maybeSingle();
  return (data as Seller) || null;
}

export async function statsForSeller(sellerId: string, opts?: { year?: number; month?: number }) {
  const seller = await getSeller(sellerId);
  if (!seller) return null;
  return statsForSellerWith(seller, opts);
}

export async function statsForSellerWith(
  seller: Seller,
  opts?: { year?: number; month?: number }
): Promise<SellerStats> {
  const { year, month } = { ...periodNow(), ...opts };
  const firstDay = `${year}-${String(month).padStart(2, "0")}-01`;
  const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  const lastDay = `${nextMonth.year}-${String(nextMonth.month).padStart(2, "0")}-01`;

  const [{ data: pg }, { data: mg }, { data: sl }, { data: lds }] = await Promise.all([
    supabaseAdmin
      .from("product_goals")
      .select("*")
      .eq("seller_id", seller.id)
      .eq("year", year)
      .eq("month", month),
    supabaseAdmin
      .from("monthly_goals")
      .select("*")
      .eq("seller_id", seller.id)
      .eq("year", year)
      .eq("month", month)
      .maybeSingle(),
    supabaseAdmin
      .from("sales")
      .select("*")
      .eq("seller_id", seller.id)
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
      bu: seller.bu,
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

export async function statsForAll(opts?: { year?: number; month?: number }): Promise<SellerStats[]> {
  const sellers = await listSellers({ onlyActive: true });
  return Promise.all(sellers.map((s) => statsForSellerWith(s, opts)));
}

// ----------- Series para os gráficos -----------

export type DailySeriesRow = { day: string; valor: number; qtd: number };
export type CumulativeRow = { day: string; pct: number; idealPct: number };

export type BUSeries = {
  daily: DailySeriesRow[];
  cumulative: CumulativeRow[];
  totals: {
    valor: number;
    qtd: number;
    meta: number;
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
  };
};

export async function buSeries(
  bu: "cppem" | "unicive",
  opts?: { year?: number; month?: number }
): Promise<BUSeries> {
  const { year, month } = { ...periodNow(), ...opts };
  const firstDay = `${year}-${String(month).padStart(2, "0")}-01`;
  const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
  const lastDay = `${next.y}-${String(next.m).padStart(2, "0")}-01`;
  const total = daysInMonth(year, month);

  const sellers = await listSellers({ onlyActive: true });
  const buSellers = sellers.filter((s) => s.bu === bu);
  const ids = buSellers.map((s) => s.id);

  if (ids.length === 0) {
    const empty: DailySeriesRow[] = Array.from({ length: total }, (_, i) => ({
      day: String(i + 1).padStart(2, "0") + "/" + String(month).padStart(2, "0"),
      valor: 0,
      qtd: 0,
    }));
    return {
      daily: empty,
      cumulative: empty.map((d, i) => ({
        day: d.day,
        pct: 0,
        idealPct: ((i + 1) / total) * 100,
      })),
      totals: {
        valor: 0,
        qtd: 0,
        meta: 0,
        ticketReal: 0,
        ticketMeta: 0,
        metaIdealAteHoje: 0,
        metaRitmoInicial: 0,
        gap: 0,
        metaDia: 0,
        realizado: 0,
        valorHoje: 0,
        qtdHoje: 0,
        realizadoHoje: 0,
      },
    };
  }

  const [{ data: sales }, { data: pgoals }, { data: mgoals }] = await Promise.all([
    supabaseAdmin
      .from("sales")
      .select("seller_id, sale_date, valor, quantidade")
      .in("seller_id", ids)
      .gte("sale_date", firstDay)
      .lt("sale_date", lastDay),
    supabaseAdmin
      .from("product_goals")
      .select("seller_id, valor_meta, quantidade_meta")
      .in("seller_id", ids)
      .eq("year", year)
      .eq("month", month),
    supabaseAdmin
      .from("monthly_goals")
      .select("seller_id, ticket_medio_meta")
      .in("seller_id", ids)
      .eq("year", year)
      .eq("month", month),
  ]);

  const valorMeta = (pgoals || []).reduce((a: number, b: any) => a + Number(b.valor_meta || 0), 0);
  const qtdMeta = (pgoals || []).reduce(
    (a: number, b: any) => a + Number(b.quantidade_meta || 0),
    0
  );
  const ticketMetaAvg =
    (mgoals || []).length > 0
      ? (mgoals || []).reduce((a: number, b: any) => a + Number(b.ticket_medio_meta || 0), 0) /
        (mgoals || []).length
      : 0;

  // bucket por dia
  const buckets: Record<string, { valor: number; qtd: number }> = {};
  for (let d = 1; d <= total; d++) {
    const k = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    buckets[k] = { valor: 0, qtd: 0 };
  }
  for (const r of (sales as any[]) || []) {
    const k = String(r.sale_date).slice(0, 10);
    if (!buckets[k]) buckets[k] = { valor: 0, qtd: 0 };
    buckets[k].valor += Number(r.valor || 0);
    buckets[k].qtd += Number(r.quantidade || 0);
  }

  const isUni = bu === "unicive";
  const meta = isUni ? qtdMeta : valorMeta;

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
    daily.push({ day: label, valor: b.valor, qtd: b.qtd });
    const real = isUni ? runQtd : runValor;
    const pct = meta > 0 ? (real / meta) * 100 : 0;
    cumulative.push({
      day: label,
      pct,
      idealPct: (d / total) * 100,
    });
  }

  const totalValor = Object.values(buckets).reduce((a, b) => a + b.valor, 0);
  const totalQtd = Object.values(buckets).reduce((a, b) => a + b.qtd, 0);
  const ticketReal = totalQtd > 0 ? totalValor / totalQtd : 0;

  const today = todayDayOfMonth(year, month);
  const daysLeft = daysRemainingIncludingToday(year, month);
  const realizado = isUni ? totalQtd : totalValor;
  const falta = Math.max(0, meta - realizado);
  const metaRitmoInicial = meta / total;
  const metaIdealAteHoje = metaRitmoInicial * today;
  const gap = metaIdealAteHoje - realizado;
  const metaDia = falta > 0 ? falta / daysLeft : 0;

  const todayLabel = `${String(today).padStart(2, "0")}/${String(month).padStart(2, "0")}`;
  const hojeBucket = daily.find((d) => d.day === todayLabel) || { valor: 0, qtd: 0 };
  const realizadoHoje = isUni ? hojeBucket.qtd : hojeBucket.valor;

  return {
    daily,
    cumulative,
    totals: {
      valor: totalValor,
      qtd: totalQtd,
      meta,
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
    },
  };
}

export type ProductBreakdownRow = {
  product_line: string;
  label: string;
  valor: number;
  qtd: number;
  valor_meta: number;
  quantidade_meta: number;
};

export async function productBreakdown(
  bu: "cppem" | "unicive",
  opts?: { year?: number; month?: number }
): Promise<ProductBreakdownRow[]> {
  const { year, month } = { ...periodNow(), ...opts };
  const firstDay = `${year}-${String(month).padStart(2, "0")}-01`;
  const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
  const lastDay = `${next.y}-${String(next.m).padStart(2, "0")}-01`;

  const sellers = await listSellers({ onlyActive: true });
  const buSellers = sellers.filter((s) => s.bu === bu);
  const ids = buSellers.map((s) => s.id);

  const lines =
    bu === "cppem"
      ? ["mentorias", "cursos_digitais", "fisicos", "turma_pmal", "turma_pmpe", "turma_carreiras"]
      : ["matriculas"];

  const map: Record<string, ProductBreakdownRow> = {};
  lines.forEach((id) => {
    map[id] = {
      product_line: id,
      label: productLabel(id),
      valor: 0,
      qtd: 0,
      valor_meta: 0,
      quantidade_meta: 0,
    };
  });

  if (ids.length === 0) return Object.values(map);

  const [{ data: sales }, { data: goals }] = await Promise.all([
    supabaseAdmin
      .from("sales")
      .select("product_line, valor, quantidade")
      .in("seller_id", ids)
      .gte("sale_date", firstDay)
      .lt("sale_date", lastDay),
    supabaseAdmin
      .from("product_goals")
      .select("product_line, valor_meta, quantidade_meta")
      .in("seller_id", ids)
      .eq("year", year)
      .eq("month", month),
  ]);

  for (const s of (sales as any[]) || []) {
    if (map[s.product_line]) {
      map[s.product_line].valor += Number(s.valor || 0);
      map[s.product_line].qtd += Number(s.quantidade || 0);
    }
  }
  for (const g of (goals as any[]) || []) {
    if (map[g.product_line]) {
      map[g.product_line].valor_meta += Number(g.valor_meta || 0);
      map[g.product_line].quantidade_meta += Number(g.quantidade_meta || 0);
    }
  }
  return Object.values(map);
}

export type DashboardSnapshot = {
  bu: "cppem" | "unicive";
  series: BUSeries;
  sellers: SellerStats[];
  taxaConversao: number;
  leadsTotal: number;
  breakdown: ProductBreakdownRow[];
};

export async function dashboardSnapshot(
  bu: "cppem" | "unicive",
  opts?: { year?: number; month?: number }
): Promise<DashboardSnapshot> {
  const [series, all, breakdown] = await Promise.all([
    buSeries(bu, opts),
    statsForAll(opts),
    productBreakdown(bu, opts),
  ]);
  const sellers = all.filter((s) => s.bu === bu);
  const leadsTotal = sellers.reduce((a, b) => a + b.leads, 0);
  const vendas = sellers.reduce((a, b) => a + b.vendasCount, 0);
  const taxaConversao = leadsTotal > 0 ? (vendas / leadsTotal) * 100 : 0;
  return { bu, series, sellers, leadsTotal, taxaConversao, breakdown };
}

export { daysInMonth, daysRemainingIncludingToday, todayDayOfMonth, periodNow };
