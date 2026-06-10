import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSeller } from "@/lib/data";
import TopBar from "@/components/TopBar";

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s) redirect("/login");
  if (s.role !== "seller") redirect("/admin");
  if (!s.sellerId) redirect("/escolher-vendedor");
  const seller = await getSeller(s.sellerId);
  if (!seller) redirect("/escolher-vendedor");

  const items = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/seller", label: "Meu Painel" },
    { href: "/seller/sales", label: "Minhas Vendas" },
  ];

  return (
    <>
      <TopBar role="seller" sellerName={seller.name} items={items} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">{children}</main>
    </>
  );
}
