import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import TopBar from "@/components/TopBar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s) redirect("/login");
  if (s.role !== "admin") redirect("/dashboard");

  const items = [
    { href: "/admin", label: "Visao Geral" },
    { href: "/admin/sellers", label: "Vendedores" },
    { href: "/admin/goals", label: "Metas" },
    { href: "/admin/leads", label: "Leads" },
    { href: "/dashboard", label: "Dashboard publico" },
  ];

  return (
    <>
      <TopBar role="admin" items={items} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">{children}</main>
    </>
  );
}
