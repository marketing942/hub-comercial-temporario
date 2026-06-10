import { getSession } from "@/lib/auth";
import { getSeller } from "@/lib/data";
import TopBar from "@/components/TopBar";
import { redirect } from "next/navigation";

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s) redirect("/login");
  const isAdmin = s.role === "admin";
  const seller = !isAdmin && s.sellerId ? await getSeller(s.sellerId) : null;

  const items = isAdmin
    ? [
        { href: "/admin", label: "Visao Geral" },
        { href: "/admin/sellers", label: "Vendedores" },
        { href: "/admin/goals", label: "Metas" },
        { href: "/admin/leads", label: "Leads" },
        { href: "/dashboard", label: "Dashboard publico" },
      ]
    : [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/seller", label: "Meu Painel" },
        { href: "/seller/sales", label: "Minhas Vendas" },
      ];

  return (
    <>
      <TopBar role={s.role} sellerName={seller?.name} items={items} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">{children}</main>
    </>
  );
}
