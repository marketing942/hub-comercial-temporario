import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import type { SidebarItem } from "@/components/Sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s) redirect("/login");
  if (s.role !== "admin") redirect("/dashboard");

  const items: SidebarItem[] = [
    { href: "/admin", label: "Visao Geral", icon: "dashboard" },
    { href: "/admin/sellers", label: "Vendedores", icon: "users" },
    { href: "/admin/goals", label: "Metas", icon: "target" },
    { href: "/admin/vendas", label: "Todas as Vendas", icon: "receipt" },
    { href: "/admin/leads", label: "Leads", icon: "leads" },
    { href: "/admin/direto", label: "Canal Direto", icon: "cart" },
    { href: "/dashboard", label: "Dashboard TV", icon: "trophy" },
  ];

  return (
    <AppShell role="admin" items={items}>
      {children}
    </AppShell>
  );
}
