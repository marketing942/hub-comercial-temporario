import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { CPPEM_PRODUCT_IDS } from "@/lib/products";

const CPPEM_IDS = CPPEM_PRODUCT_IDS as unknown as string[];

// POST /api/direct/sales { sale_date, product_line, valor, quantidade, observacao? }
export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "admin") {
    return NextResponse.json({ error: "Apenas admin lanca venda do direto." }, { status: 401 });
  }
  const b = await req.json();
  const { sale_date, product_line, valor, quantidade, observacao } = b || {};
  if (!sale_date || !product_line) {
    return NextResponse.json({ error: "Faltam sale_date / product_line." }, { status: 400 });
  }
  if (!CPPEM_IDS.includes(product_line)) {
    return NextResponse.json({ error: "Categoria invalida (so CPPEM no direto)." }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin
    .from("direct_sales")
    .insert({
      sale_date,
      product_line,
      valor: Number(valor || 0),
      quantidade: Number(quantidade || 1),
      observacao: observacao || null,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// GET /api/direct/sales?year=&month=
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
    .from("direct_sales")
    .select("*")
    .gte("sale_date", firstDay)
    .lt("sale_date", lastDay)
    .order("sale_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
