import { supabaseAdmin } from "./supabase";
import { computeSellerStats, periodNow, type SellerStats } from "./calc";

export type Seller = {
  id: string;
  name: string;
  bu: "cppem" | "unicive";
  active: boolean;
  avatar_color: string;
};

export async function listSellers(opts?: { onlyActive?: boolean }): Promise<Seller[]> {
  let q = supabaseAdmin.from("sellers").select("*").order("name");
  if (opts?.onlyActive) q = q.eq("active", true);
  const { data } = await q;
  return (data as Seller[]) || [];
}

export async function getSeller(id: string): Promise<Seller | null> {
  const { data } = await supabaseAdmin.from("sellers").select("*").eq("id", id).maybeSingle();
  return (data as Seller) || null;
}

export async function statsForSeller(sellerId: string, opts?: { year?: number; month?: number }) {
  const seller = await getSeller(sellerId);
  if (!seller) return null;
  return statsForSellerWith(seller, opts);
}

export async function statsForSellerWith(
  seller: Seller,
  opts?: { year?: number; month?: number }
): Promise<SellerStats> {
  const { year, month } = { ...periodNow(), ...opts };
  const firstDay = `${year}-${String(month).padStart(2, "0")}-01`;
  const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  const lastDay = `${nextMonth.year}-${String(nextMonth.month).padStart(2, "0")}-01`;

  const [{ data: pg }, { data: mg }, { data: sl }, { data: lds }] = await Promise.all([
    supabaseAdmin
      .from("product_goals")
      .select("*")
      .eq("seller_id", seller.id)
      .eq("year", year)
      .eq("month", month),
    supabaseAdmin
      .from("monthly_goals")
      .select("*")
      .eq("seller_id", seller.id)
      .eq("year", year)
      .eq("month", month)
      .maybeSingle(),
    supabaseAdmin
      .from("sales")
      .select("*")
      .eq("seller_id", seller.id)
      .gte("sale_date", firstDay)
      .lt("sale_date", lastDay),
    supabaseAdmin
      .from("daily_leads")
      .select("qty")
      .eq("seller_id", seller.id)
      .gte("date", firstDay)
      .lt("date", lastDay),
  ]);

  const leadsMonth = (lds || []).reduce((s: number, r: any) => s + Number(r.qty || 0), 0);

  return computeSellerStats({
    seller: { id: seller.id, name: seller.name, bu: seller.bu },
    productGoals: (pg as any) || [],
    monthly: (mg as any) || null,
    sales: (sl as any) || [],
    leadsMonth,
    year,
    month,
  });
}

export async function statsForAll(opts?: { year?: number; month?: number }): Promise<SellerStats[]> {
  const sellers = await listSellers({ onlyActive: true });
  return Promise.all(sellers.map((s) => statsForSellerWith(s, opts)));
}
