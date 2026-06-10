import { NextResponse } from "next/server";
import { getSession, sessionCookie } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "seller") {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }
  const { sellerId } = await req.json().catch(() => ({}));
  if (!sellerId) return NextResponse.json({ error: "Vendedor invalido." }, { status: 400 });
  const { data } = await supabaseAdmin
    .from("sellers")
    .select("id, active")
    .eq("id", sellerId)
    .maybeSingle();
  if (!data || !data.active) {
    return NextResponse.json({ error: "Vendedor nao encontrado ou inativo." }, { status: 400 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(await sessionCookie({ role: "seller", sellerId }));
  return res;
}
