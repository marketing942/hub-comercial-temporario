import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { hashPassword, sanitizePassword } from "@/lib/password";

// POST /api/sellers/[id]/password { password } (admin)
// Redefine (ou define pela primeira vez) a senha de um vendedor.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (s?.role !== "admin") return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  const body = await req.json().catch(() => null);
  const clean = sanitizePassword(body?.password);
  if (!clean) {
    return NextResponse.json(
      { error: "Senha invalida (minimo 4 caracteres)." },
      { status: 400 }
    );
  }
  const hash = await hashPassword(clean);
  const { error } = await supabaseAdmin
    .from("sellers")
    .update({ password_hash: hash })
    .eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath("/admin/sellers");
  return NextResponse.json({ ok: true });
}

// DELETE /api/sellers/[id]/password (admin) — remove a senha (vendedor
// nao consegue mais logar ate o admin definir outra).
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (s?.role !== "admin") return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  const { error } = await supabaseAdmin
    .from("sellers")
    .update({ password_hash: null })
    .eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath("/admin/sellers");
  return NextResponse.json({ ok: true });
}
