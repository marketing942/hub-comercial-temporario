import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabaseAdmin.from("sellers").select("*").order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "admin") return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  const body = await req.json();
  const { name, bu, avatar_color } = body || {};
  if (!name || !["cppem", "unicive"].includes(bu)) {
    return NextResponse.json({ error: "Dados invalidos." }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin
    .from("sellers")
    .insert({ name, bu, avatar_color: avatar_color || "#7c5cff" })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
