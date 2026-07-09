import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

// POST /api/direct/visits { date, qty }
export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "admin") return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  const { date, qty } = await req.json();
  if (!date) return NextResponse.json({ error: "Faltam a data." }, { status: 400 });
  const { error } = await supabaseAdmin
    .from("direct_visits")
    .upsert(
      { date, qty: Math.max(0, Number(qty || 0)), updated_at: new Date().toISOString() },
      { onConflict: "date" }
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// GET /api/direct/visits?year=&month=
export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  const u = new URL(req.url);
  const year = Number(u.searchParams.get("year"));
  const month = Number(u.searchParams.get("month"));
  if (!year || !month) {
    return NextResponse.json({ error: "Parametros invalidos." }, { status: 400 });
  }
  const firstDay = `${year}-${String(month).padStart(2, "0")}-01`;
  const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
  const lastDay = `${next.y}-${String(next.m).padStart(2, "0")}-01`;
  const { data, error } = await supabaseAdmin
    .from("direct_visits")
    .select("*")
    .gte("date", firstDay)
    .lt("date", lastDay)
    .order("date");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
