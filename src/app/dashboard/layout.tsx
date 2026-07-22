import { getSession } from "@/lib/auth";
import { getSeller } from "@/lib/data";
import AppShell from "@/components/AppShell";
import type { SidebarItem } from "@/components/Sidebar";
import { redirect } from "next/navigation";

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s) redirect("/login");
  const isAdmin = s.role === "admin";
  const seller = !isAdmin && s.sellerId ? await getSeller(s.sellerId) : null;

  const items: SidebarItem[] = isAdmin
    ? [
        { href: "/admin", label: "Visao Geral", icon: "dashboard" },
        { href: "/admin/sellers", label: "Vendedores", icon: "users" },
        { href: "/admin/goals", label: "Metas", icon: "target" },
        { href: "/admin/vendas", label: "Todas as Vendas", icon: "receipt" },
        { href: "/admin/leads", label: "Leads", icon: "leads" },
        { href: "/admin/direto", label: "Canal Direto", icon: "cart" },
        { href: "/dashboard", label: "Dashboard TV", icon: "trophy" },
      ]
    : [
        { href: "/dashboard", label: "Dashboard TV", icon: "trophy" },
        { href: "/seller", label: "Meu Painel", icon: "dashboard" },
        { href: "/seller/sales", label: "Minhas Vendas", icon: "cart" },
      ];

  return (
    <AppShell role={s.role} sellerName={seller?.name} items={items}>
      {children}
    </AppShell>
  );
}
