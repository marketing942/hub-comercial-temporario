import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { CPPEM_PRODUCT_IDS } from "@/lib/products";

const CPPEM_IDS = CPPEM_PRODUCT_IDS as unknown as string[];

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (s?.role !== "admin") return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  const b = await req.json();
  const patch: Record<string, any> = { updated_at: new Date().toISOString() };
  if (typeof b.sale_date === "string") patch.sale_date = b.sale_date;
  if (typeof b.product_line === "string") {
    if (!CPPEM_IDS.includes(b.product_line)) {
      return NextResponse.json({ error: "Categoria invalida." }, { status: 400 });
    }
    patch.product_line = b.product_line;
  }
  if (b.valor !== undefined) patch.valor = Number(b.valor);
  if (b.quantidade !== undefined) patch.quantidade = Number(b.quantidade);
  if (b.observacao !== undefined) patch.observacao = b.observacao;
  const { error } = await supabaseAdmin.from("direct_sales").update(patch).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (s?.role !== "admin") return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  const { error } = await supabaseAdmin.from("direct_sales").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
