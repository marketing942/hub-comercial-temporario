import Link from "next/link";
import { statsForAll } from "@/lib/data";
import { BRL, fmtInt, fmtPct, periodNow, daysRemainingIncludingToday } from "@/lib/calc";
import ProgressBar from "@/components/ProgressBar";
import StatCard from "@/components/StatCard";
import { Users, Target, Zap, TrendingUp, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const stats = await statsForAll();
  const { year, month } = periodNow();
  const daysLeft = daysRemainingIncludingToday(year, month);

  const cppem = stats.filter((s) => s.bu === "cppem");
  const unicive = stats.filter((s) => s.bu === "unicive");
  const cppemMeta = cppem.reduce((a, b) => a + b.metaTotal, 0);
  const cppemReal = cppem.reduce((a, b) => a + b.realizado, 0);
  const uniMeta = unicive.reduce((a, b) => a + b.metaTotal, 0);
  const uniReal = unicive.reduce((a, b) => a + b.realizado, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Visao geral</h1>
          <p className="text-sm text-white/50">
            Faltam {daysLeft} dia{daysLeft > 1 ? "s" : ""} para o fim do mes.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/sellers" className="btn-ghost">
            <Users className="w-4 h-4" /> Vendedores
          </Link>
          <Link href="/admin/goals" className="btn-primary">
            <Target className="w-4 h-4" /> Metas
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Realizado CPPEM"
          value={BRL.format(cppemReal)}
          hint={`Meta: ${BRL.format(cppemMeta)}`}
          icon={<TrendingUp className="w-4 h-4" />}
          accent="#7c5cff"
        />
        <StatCard
          label="Matriculas UNICIVE"
          value={fmtInt.format(uniReal)}
          hint={`Meta: ${fmtInt.format(uniMeta)}`}
          icon={<TrendingUp className="w-4 h-4" />}
          accent="#22d3ee"
        />
        <StatCard
          label="Vendedores ativos"
          value={fmtInt.format(stats.length)}
          icon={<Users className="w-4 h-4" />}
          accent="#22c55e"
        />
        <StatCard
          label="Leads no mes"
          value={fmtInt.format(stats.reduce((a, b) => a + b.leads, 0))}
          icon={<Zap className="w-4 h-4" />}
          accent="#f59e0b"
        />
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold">Performance por vendedor</div>
          <Link href="/dashboard" className="text-xs text-white/60 hover:text-white inline-flex items-center gap-1">
            Ver dashboard publico <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-white/40">
              <tr className="text-left">
                <th className="py-2">Vendedor</th>
                <th>BU</th>
                <th>Meta</th>
                <th>Realizado</th>
                <th>Falta</th>
                <th>Ticket</th>
                <th>Conversao</th>
                <th>Leads</th>
                <th className="w-40">% Meta</th>
              </tr>
            </thead>
            <tbody>
              {stats.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-white/50">
                    Cadastre vendedores em <Link href="/admin/sellers" className="text-accent">Vendedores</Link>.
                  </td>
                </tr>
              )}
              {stats.map((s) => {
                const isUni = s.bu === "unicive";
                const fmt = (n: number) => (isUni ? fmtInt.format(Math.round(n)) : BRL.format(n));
                return (
                  <tr key={s.sellerId} className="border-t border-border">
                    <td className="py-2 font-medium">{s.sellerName}</td>
                    <td>
                      <span className={isUni ? "chip-unicive" : "chip-cppem"}>
                        {s.bu.toUpperCase()}
                      </span>
                    </td>
                    <td>{fmt(s.metaTotal)}</td>
                    <td className="font-semibold">{fmt(s.realizado)}</td>
                    <td className="text-white/60">{fmt(s.falta)}</td>
                    <td className="text-xs">
                      <div>{BRL.format(s.ticketReal)}</div>
                      <div className="text-white/40">meta {BRL.format(s.ticketMeta)}</div>
                    </td>
                    <td className="text-xs">
                      <div>{fmtPct(s.conversaoReal)}</div>
                      <div className="text-white/40">meta {fmtPct(s.conversaoMeta)}</div>
                    </td>
                    <td>{fmtInt.format(s.leads)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <ProgressBar value={s.pctSucesso} color={isUni ? "#22d3ee" : "#7c5cff"} />
                        <span className="text-xs w-12 text-right">{fmtPct(s.pctSucesso)}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
