import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  const b = await req.json();
  const patch: Record<string, any> = { updated_at: new Date().toISOString() };
  if (typeof b.sale_date === "string") patch.sale_date = b.sale_date;
  if (typeof b.product_line === "string") patch.product_line = b.product_line;
  if (b.valor !== undefined) patch.valor = Number(b.valor);
  if (b.quantidade !== undefined) patch.quantidade = Number(b.quantidade);
  if (b.cliente_nome !== undefined) {
    const c = typeof b.cliente_nome === "string" ? b.cliente_nome.trim().slice(0, 200) : "";
    patch.cliente_nome = c || null;
  }
  if (b.observacao !== undefined) patch.observacao = b.observacao;
  if (typeof b.ligacao_status === "string") {
    const valid = ["consegui_direto", "consegui_indireto", "sem_ligacao"];
    if (valid.includes(b.ligacao_status)) patch.ligacao_status = b.ligacao_status;
  }
  if (typeof b.indicacao_status === "string") {
    const valid = ["feita_por_indicacao", "sem_indicacao"];
    if (valid.includes(b.indicacao_status)) patch.indicacao_status = b.indicacao_status;
  }

  let q = supabaseAdmin.from("sales").update(patch).eq("id", params.id);
  if (s.role === "seller") q = q.eq("seller_id", s.sellerId!);
  const { error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  let q = supabaseAdmin.from("sales").delete().eq("id", params.id);
  if (s.role === "seller") q = q.eq("seller_id", s.sellerId!);
  const { error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
