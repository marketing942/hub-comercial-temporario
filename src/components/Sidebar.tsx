"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Users,
  Target,
  Zap,
  Trophy,
  User,
  ShoppingCart,
  Receipt,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";

export type SidebarItem = {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
};

const ICONS = {
  dashboard: LayoutDashboard,
  users: Users,
  target: Target,
  leads: Zap,
  trophy: Trophy,
  user: User,
  cart: ShoppingCart,
  receipt: Receipt,
};

const STORAGE_KEY = "hub_sidebar_collapsed";

export default function Sidebar({
  role,
  sellerName,
  items,
}: {
  role: "admin" | "seller";
  sellerName?: string;
  items: SidebarItem[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [openMobile, setOpenMobile] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "1") setCollapsed(true);
  }, []);

  useEffect(() => setOpenMobile(false), [pathname]);

  function toggleCollapse() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <>
      {/* Topbar mobile com hamburguer */}
      <header className="lg:hidden sticky top-0 z-40 bg-bg/85 backdrop-blur border-b border-border">
        <div className="h-14 flex items-center px-4 gap-3">
          <button
            onClick={() => setOpenMobile(true)}
            className="w-10 h-10 grid place-items-center rounded-xl bg-panel2 hover:bg-border"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/20 grid place-items-center">
              <Trophy className="w-4 h-4 text-accent" />
            </div>
            <div className="font-semibold text-sm">Hub Comercial</div>
          </div>
        </div>
      </header>

      {/* Botao flutuante pra reabrir no desktop quando colapsada */}
      {collapsed && (
        <button
          onClick={toggleCollapse}
          className="hidden lg:flex fixed top-3 left-3 z-40 w-10 h-10 items-center justify-center rounded-xl bg-panel border border-border hover:border-accent/40 shadow-glowSoft"
          title="Mostrar menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Overlay mobile */}
      {openMobile && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setOpenMobile(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        data-collapsed={collapsed}
        className={`
          fixed top-0 left-0 z-50 h-screen w-64 bg-panel border-r border-border
          flex flex-col transition-transform duration-200
          ${openMobile ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:sticky
          ${collapsed ? "lg:hidden" : "lg:flex"}
        `}
      >
        <div className="p-4 border-b border-border flex items-center justify-between gap-2">
          <Link
            href={role === "admin" ? "/admin" : "/dashboard"}
            className="flex items-center gap-3 min-w-0"
          >
            <div className="w-10 h-10 rounded-xl bg-accent/20 grid place-items-center shrink-0">
              <Trophy className="w-5 h-5 text-accent" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-sm truncate">Hub Comercial</div>
              <div className="text-[10px] uppercase tracking-wider text-white/40">
                CPPEM x Unicive
              </div>
            </div>
          </Link>
          <button
            className="lg:hidden w-8 h-8 grid place-items-center rounded-lg hover:bg-panel2"
            onClick={() => setOpenMobile(false)}
            aria-label="Fechar menu"
          >
            <X className="w-4 h-4" />
          </button>
          <button
            className="hidden lg:grid w-8 h-8 place-items-center rounded-lg hover:bg-panel2 text-white/60 hover:text-white"
            onClick={toggleCollapse}
            title="Recolher menu"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {items.map((it) => {
            const Icon = ICONS[it.icon];
            const active =
              pathname === it.href ||
              (it.href !== "/" && pathname.startsWith(it.href + "/"));
            return (
              <Link
                key={it.href}
                href={it.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition ${
                  active
                    ? "bg-accent/15 text-accent border border-accent/20"
                    : "text-white/70 hover:bg-panel2 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{it.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border space-y-2">
          <div className="px-3 py-2 rounded-xl bg-panel2 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/20 grid place-items-center text-accent">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-white/40">
                {role === "admin" ? "Administrador" : "Vendedor"}
              </div>
              <div className="text-sm font-medium truncate">
                {sellerName || (role === "admin" ? "Admin" : "Vendedor")}
              </div>
            </div>
          </div>
          <button onClick={logout} className="btn-ghost w-full text-sm">
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </aside>
    </>
  );
}
