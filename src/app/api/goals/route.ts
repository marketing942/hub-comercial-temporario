import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { buFromProductLine } from "@/lib/products";

// POST /api/goals (compat) - body:
// { seller_id, year, month, bu?, ticket_medio_meta, taxa_conversao_meta, product_goals }
export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "admin") return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  const b = await req.json();
  const {
    seller_id,
    year,
    month,
    bu: buInput,
    ticket_medio_meta = 0,
    taxa_conversao_meta = 0,
    product_goals = [],
  } = b || {};
  if (!seller_id || !year || !month) {
    return NextResponse.json({ error: "Faltam seller_id/year/month." }, { status: 400 });
  }

  // Resolve a BU: se nao veio, pega a primeira do vendedor.
  let bu = buInput;
  if (!bu) {
    const { data } = await supabaseAdmin
      .from("sellers")
      .select("bu, bus")
      .eq("id", seller_id)
      .maybeSingle();
    const arr = Array.isArray((data as any)?.bus) && (data as any).bus.length > 0 ? (data as any).bus : [(data as any)?.bu];
    bu = arr[0];
  }
  if (!bu) return NextResponse.json({ error: "BU nao encontrada." }, { status: 400 });

  const { error: e1 } = await supabaseAdmin.from("monthly_goals").upsert(
    {
      seller_id,
      bu,
      year,
      month,
      ticket_medio_meta,
      taxa_conversao_meta,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "seller_id,bu,month,year" }
  );
  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });

  if (Array.isArray(product_goals) && product_goals.length > 0) {
    const rows = product_goals
      .filter((p: any) => p && p.product_line)
      .map((p: any) => ({
        seller_id,
        year,
        month,
        product_line: p.product_line,
        valor_meta: Number(p.valor_meta || 0),
        quantidade_meta: Number(p.quantidade_meta || 0),
      }));
    if (rows.length > 0) {
      const { error: e2 } = await supabaseAdmin
        .from("product_goals")
        .upsert(rows, { onConflict: "seller_id,month,year,product_line" });
      if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}

// GET /api/goals?seller_id=&year=&month=&bu=
export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  const u = new URL(req.url);
  const seller_id = u.searchParams.get("seller_id");
  const year = Number(u.searchParams.get("year"));
  const month = Number(u.searchParams.get("month"));
  const bu = u.searchParams.get("bu");
  if (!seller_id || !year || !month) {
    return NextResponse.json({ error: "Parametros invalidos." }, { status: 400 });
  }
  let mg: any;
  if (bu) {
    const r = await supabaseAdmin
      .from("monthly_goals")
      .select("*")
      .eq("seller_id", seller_id)
      .eq("bu", bu)
      .eq("year", year)
      .eq("month", month)
      .maybeSingle();
    mg = r;
  } else {
    const r = await supabaseAdmin
      .from("monthly_goals")
      .select("*")
      .eq("seller_id", seller_id)
      .eq("year", year)
      .eq("month", month)
      .maybeSingle();
    mg = r;
  }
  const pg = await supabaseAdmin
    .from("product_goals")
    .select("*")
    .eq("seller_id", seller_id)
    .eq("year", year)
    .eq("month", month);
  return NextResponse.json({ monthly: mg.data, products: pg.data || [] });
}
