"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Trophy } from "lucide-react";

type Item = { href: string; label: string };

export default function TopBar({
  role,
  sellerName,
  items,
}: {
  role: "admin" | "seller";
  sellerName?: string;
  items: Item[];
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-6">
        <Link href={role === "admin" ? "/admin" : "/dashboard"} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent/20 grid place-items-center">
            <Trophy className="w-4 h-4 text-accent" />
          </div>
          <div className="font-semibold text-sm">Hub Comercial</div>
        </Link>

        <nav className="hidden md:flex items-center gap-1 ml-2">
          {items.map((it) => {
            const active = pathname === it.href || pathname.startsWith(it.href + "/");
            return (
              <Link
                key={it.href}
                href={it.href}
                className={`px-3 py-1.5 rounded-lg text-sm transition ${
                  active ? "bg-panel2 text-white" : "text-white/60 hover:text-white"
                }`}
              >
                {it.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {sellerName && (
            <span className="hidden sm:block text-xs text-white/60">
              {role === "admin" ? "Admin" : sellerName}
            </span>
          )}
          <button onClick={logout} className="btn-ghost h-8 px-2 text-xs">
            <LogOut className="w-3.5 h-3.5" /> Sair
          </button>
        </div>
      </div>

      <nav className="md:hidden flex overflow-x-auto px-2 pb-2 gap-1 border-t border-border">
        {items.map((it) => {
          const active = pathname === it.href || pathname.startsWith(it.href + "/");
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap ${
                active ? "bg-panel2" : "text-white/60"
              }`}
            >
              {it.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
