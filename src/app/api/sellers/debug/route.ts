import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

// Endpoint de diagnostico. Retorna tres visoes da tabela sellers pra
// isolar por que um vendedor recem criado nao aparece em /escolher-vendedor.
// Apenas admin acessa.
export async function GET() {
  const s = await getSession();
  if (s?.role !== "admin") return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });

  const [allRes, activeTrueRes, activeNotFalseRes] = await Promise.all([
    supabaseAdmin
      .from("sellers")
      .select("id, name, bu, bus, active, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    supabaseAdmin
      .from("sellers")
      .select("id, name, active")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(20),
    supabaseAdmin
      .from("sellers")
      .select("id, name, active")
      .not("active", "is", false)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return NextResponse.json({
    all_last_20: allRes.data,
    active_eq_true_last_20: activeTrueRes.data,
    active_not_false_last_20: activeNotFalseRes.data,
    errors: {
      all: allRes.error?.message ?? null,
      eq_true: activeTrueRes.error?.message ?? null,
      not_false: activeNotFalseRes.error?.message ?? null,
    },
  });
}
