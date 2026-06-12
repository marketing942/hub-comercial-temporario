import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabaseAdmin.from("sellers").select("*").order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

function sanitizeBus(input: any, fallbackBu: string): string[] {
  const raw = Array.isArray(input) ? input : [];
  const clean = raw.filter((x) => x === "cppem" || x === "unicive");
  if (clean.length > 0) return Array.from(new Set(clean));
  if (fallbackBu === "cppem" || fallbackBu === "unicive") return [fallbackBu];
  return [];
}

export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "admin") return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  const body = await req.json();
  const { name, bu, bus, avatar_color } = body || {};
  const cleanBus = sanitizeBus(bus, bu);
  if (!name || cleanBus.length === 0) {
    return NextResponse.json({ error: "Dados invalidos. Informe ao menos uma BU." }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin
    .from("sellers")
    .insert({ name, bu: cleanBus[0], bus: cleanBus, avatar_color: avatar_color || "#22c55e" })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
