import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/goals/period?bu=cppem&year=2026&month=6
export async function GET(req: Request) {
  const u = new URL(req.url);
  const bu = u.searchParams.get("bu");
  const year = Number(u.searchParams.get("year"));
  const month = Number(u.searchParams.get("month"));
  if (!bu || !year || !month) {
    return NextResponse.json({ error: "Parametros invalidos." }, { status: 400 });
  }

  const { data: sellers } = await supabaseAdmin
    .from("sellers")
    .select("id, name, bu, active, avatar_url, avatar_color")
    .eq("bu", bu)
    .eq("active", true)
    .order("name");

  const ids = (sellers || []).map((s: any) => s.id);

  const [{ data: buGoals }, { data: monthly }] = await Promise.all([
    supabaseAdmin
      .from("bu_product_goals")
      .select("product_line, valor_meta, quantidade_meta")
      .eq("bu", bu)
      .eq("year", year)
      .eq("month", month),
    ids.length === 0
      ? Promise.resolve({ data: [] })
      : supabaseAdmin
          .from("monthly_goals")
          .select("seller_id, ticket_medio_meta, taxa_conversao_meta, valor_meta, quantidade_meta")
          .in("seller_id", ids)
          .eq("year", year)
          .eq("month", month),
  ]);

  return NextResponse.json({
    sellers: sellers || [],
    bu_product_goals: buGoals || [],
    monthly: monthly || [],
  });
}

// POST /api/goals/period { bu, year, month, bu_product_goals[], sellers[] }
export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "admin") return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  const body = await req.json();
  const { bu, year, month, bu_product_goals = [], sellers = [] } = body || {};
  if (!bu || !year || !month) {
    return NextResponse.json({ error: "Faltam bu/year/month." }, { status: 400 });
  }

  // Meta por linha de produto da BU
  if (Array.isArray(bu_product_goals) && bu_product_goals.length > 0) {
    const rows = bu_product_goals
      .filter((p: any) => p && p.product_line)
      .map((p: any) => ({
        bu,
        year,
        month,
        product_line: p.product_line,
        valor_meta: Number(p.valor_meta || 0),
        quantidade_meta: Number(p.quantidade_meta || 0),
      }));
    if (rows.length > 0) {
      const { error } = await supabaseAdmin
        .from("bu_product_goals")
        .upsert(rows, { onConflict: "bu,year,month,product_line" });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // Meta de cada vendedor
  if (Array.isArray(sellers) && sellers.length > 0) {
    const rows = sellers
      .filter((s: any) => s && s.seller_id)
      .map((s: any) => ({
        seller_id: s.seller_id,
        year,
        month,
        ticket_medio_meta: Number(s.ticket_medio_meta || 0),
        taxa_conversao_meta: Number(s.taxa_conversao_meta || 0),
        valor_meta: Number(s.valor_meta || 0),
        quantidade_meta: Number(s.quantidade_meta || 0),
        updated_at: new Date().toISOString(),
      }));
    const { error } = await supabaseAdmin
      .from("monthly_goals")
      .upsert(rows, { onConflict: "seller_id,month,year" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
