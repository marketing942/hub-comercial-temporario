import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

// POST /api/leads { seller_id, date, qty }
export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "admin") return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  const { seller_id, date, qty } = await req.json();
  if (!seller_id || !date) {
    return NextResponse.json({ error: "Faltam seller_id / date." }, { status: 400 });
  }
  const { error } = await supabaseAdmin
    .from("daily_leads")
    .upsert({ seller_id, date, qty: Number(qty || 0) }, { onConflict: "seller_id,date" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// GET /api/leads?seller_id=&year=&month=
export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  const u = new URL(req.url);
  const seller_id = u.searchParams.get("seller_id");
  const year = Number(u.searchParams.get("year"));
  const month = Number(u.searchParams.get("month"));
  if (!seller_id || !year || !month) {
    return NextResponse.json({ error: "Parametros invalidos." }, { status: 400 });
  }
  const firstDay = `${year}-${String(month).padStart(2, "0")}-01`;
  const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
  const lastDay = `${next.y}-${String(next.m).padStart(2, "0")}-01`;
  const { data, error } = await supabaseAdmin
    .from("daily_leads")
    .select("*")
    .eq("seller_id", seller_id)
    .gte("date", firstDay)
    .lt("date", lastDay)
    .order("date");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
