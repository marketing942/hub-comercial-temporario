import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { hashPassword, sanitizePassword, verifyPassword } from "@/lib/password";

// POST /api/seller/password { currentPassword?, newPassword }
// Vendedor logado altera a propria senha. Se ja tiver password_hash
// setado, precisa confirmar a senha atual. Se nao tiver (admin ainda
// nao definiu), permite setar sem confirmar.
//
// A chave fica em sellers.password_hash — mesma coluna que o admin ve
// na aba de Vendedores em Configuracoes.
export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "seller" || !s.sellerId) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const newPlain = sanitizePassword(body?.newPassword);
  if (!newPlain) {
    return NextResponse.json(
      { error: "Senha invalida (minimo 4 caracteres)." },
      { status: 400 }
    );
  }

  const { data: cur } = await supabaseAdmin
    .from("sellers")
    .select("password_hash")
    .eq("id", s.sellerId)
    .maybeSingle();

  if (cur?.password_hash) {
    const currentPlain = typeof body?.currentPassword === "string" ? body.currentPassword : "";
    const ok = await verifyPassword(currentPlain, cur.password_hash);
    if (!ok) {
      return NextResponse.json({ error: "Senha atual incorreta." }, { status: 401 });
    }
  }

  const newHash = await hashPassword(newPlain);
  const { error } = await supabaseAdmin
    .from("sellers")
    .update({ password_hash: newHash })
    .eq("id", s.sellerId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
