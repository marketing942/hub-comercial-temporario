import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const bu = u.searchParams.get("bu");
  const year = Number(u.searchParams.get("year"));
  const month = Number(u.searchParams.get("month"));
  if (!bu || !year || !month) {
    return NextResponse.json({ error: "Parametros invalidos." }, { status: 400 });
  }

  const { data: sellersRaw } = await supabaseAdmin
    .from("sellers")
    .select("id, name, bu, bus, active, avatar_url, avatar_color")
    .eq("active", true)
    .order("name");

  const sellers = (sellersRaw || []).filter((s: any) => {
    const arr: string[] = Array.isArray(s.bus) && s.bus.length > 0 ? s.bus : [s.bu];
    return arr.includes(bu);
  });

  const ids = sellers.map((s: any) => s.id);

  const [{ data: buGoals }, { data: monthly }, { data: buMetaRow }] = await Promise.all([
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
  ]);

  return NextResponse.json({
    sellers,
    bu_product_goals: buGoals || [],
    monthly: monthly || [],
    bu_leads_meta: Number((buMetaRow as any)?.leads_meta || 0),
  });
}

export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "admin") return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  const body = await req.json();
  const { bu, year, month, bu_product_goals = [], sellers = [], bu_leads_meta } = body || {};
  if (!bu || !year || !month) {
    return NextResponse.json({ error: "Faltam bu/year/month." }, { status: 400 });
  }

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

  if (Array.isArray(sellers) && sellers.length > 0) {
    const rows = sellers
      .filter((s: any) => s && s.seller_id)
      .map((s: any) => ({
        seller_id: s.seller_id,
        bu,
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
      .upsert(rows, { onConflict: "seller_id,bu,month,year" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (typeof bu_leads_meta === "number" || (typeof bu_leads_meta === "string" && bu_leads_meta !== "")) {
    const { error } = await supabaseAdmin
      .from("bu_meta")
      .upsert(
        {
          bu,
          year,
          month,
          leads_meta: Math.max(0, Number(bu_leads_meta || 0)),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "bu,year,month" }
      );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
