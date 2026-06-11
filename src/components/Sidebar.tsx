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
};

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
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

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
            onClick={() => setOpen(true)}
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

      {/* Overlay mobile */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen w-64 bg-panel border-r border-border
          flex flex-col transition-transform duration-200
          ${open ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:sticky
        `}
      >
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 grid place-items-center">
              <Trophy className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="font-semibold text-sm">Hub Comercial</div>
              <div className="text-[10px] uppercase tracking-wider text-white/40">
                CPPEM x Unicive
              </div>
            </div>
          </div>
          <button
            className="lg:hidden w-8 h-8 grid place-items-center rounded-lg hover:bg-panel2"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
          >
            <X className="w-4 h-4" />
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
