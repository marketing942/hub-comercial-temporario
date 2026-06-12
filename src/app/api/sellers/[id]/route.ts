import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (s?.role !== "admin") return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  const body = await req.json();
  const patch: Record<string, any> = {};
  if (typeof body.name === "string") patch.name = body.name;
  if (typeof body.bu === "string") patch.bu = body.bu;
  if (Array.isArray(body.bus)) {
    const clean = body.bus.filter((x: any) => x === "cppem" || x === "unicive");
    if (clean.length > 0) {
      patch.bus = Array.from(new Set(clean));
      patch.bu = patch.bus[0];
    }
  }
  if (typeof body.active === "boolean") patch.active = body.active;
  if (typeof body.avatar_color === "string") patch.avatar_color = body.avatar_color;
  const { error } = await supabaseAdmin.from("sellers").update(patch).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (s?.role !== "admin") return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  const { error } = await supabaseAdmin.from("sellers").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
