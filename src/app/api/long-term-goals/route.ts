import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import type { BU } from "@/lib/products";

const VALID_BUS: BU[] = ["cppem", "unicive", "colegio_cppem"];

// GET /api/long-term-goals?bu=colegio_cppem — lista ativas por BU (ou todas)
export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  const u = new URL(req.url);
  const buParam = u.searchParams.get("bu") as BU | null;
  let q = supabaseAdmin
    .from("long_term_goals")
    .select("id, bu, label, base_count, target, start_year, start_month, end_year, end_month, active, created_at, updated_at")
    .order("bu")
    .order("created_at", { ascending: false });
  if (buParam && VALID_BUS.includes(buParam)) q = q.eq("bu", buParam);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data || [] });
}

// POST /api/long-term-goals — cria ou atualiza (upsert por id).
// Se novo (sem id) marca as ativas anteriores dessa BU como inativas
// automaticamente, garantindo um unico "ativo" por BU.
export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "admin") return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const bu = b?.bu as BU;
  if (!bu || !VALID_BUS.includes(bu)) {
    return NextResponse.json({ error: "BU invalida." }, { status: 400 });
  }
  const label = typeof b.label === "string" && b.label.trim() ? b.label.trim().slice(0, 200) : "Meta de longo prazo";
  const base_count = Math.max(0, Math.round(Number(b.base_count || 0)));
  const target = Math.max(0, Math.round(Number(b.target || 0)));
  const start_year = Number(b.start_year);
  const start_month = Number(b.start_month);
  const end_year = Number(b.end_year);
  const end_month = Number(b.end_month);
  const active = b.active === undefined ? true : Boolean(b.active);
  if (
    !Number.isFinite(start_year) || !Number.isFinite(end_year) ||
    start_month < 1 || start_month > 12 || end_month < 1 || end_month > 12
  ) {
    return NextResponse.json({ error: "Periodo invalido." }, { status: 400 });
  }
  const startKey = start_year * 12 + start_month;
  const endKey = end_year * 12 + end_month;
  if (endKey < startKey) {
    return NextResponse.json({ error: "Data final deve ser >= data inicial." }, { status: 400 });
  }

  const payload = {
    bu, label, base_count, target,
    start_year, start_month, end_year, end_month, active,
    updated_at: new Date().toISOString(),
  };

  if (typeof b.id === "string" && b.id) {
    const { error } = await supabaseAdmin
      .from("long_term_goals")
      .update(payload)
      .eq("id", b.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    // Novo: primeiro desativa qualquer outra ativa dessa BU
    if (active) {
      await supabaseAdmin
        .from("long_term_goals")
        .update({ active: false, updated_at: new Date().toISOString() })
        .eq("bu", bu)
        .eq("active", true);
    }
    const { error } = await supabaseAdmin
      .from("long_term_goals")
      .insert(payload);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath("/dashboard");
  revalidatePath("/admin/goals");
  return NextResponse.json({ ok: true });
}

// DELETE /api/long-term-goals?id=... — remove
export async function DELETE(req: Request) {
  const s = await getSession();
  if (s?.role !== "admin") return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  const u = new URL(req.url);
  const id = u.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id obrigatorio." }, { status: 400 });
  const { error } = await supabaseAdmin
    .from("long_term_goals")
    .delete()
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath("/dashboard");
  revalidatePath("/admin/goals");
  return NextResponse.json({ ok: true });
}
