import { getSession } from "@/lib/auth";
import { getSeller, statsForSeller } from "@/lib/data";
import { BRL, fmtInt, fmtPct } from "@/lib/calc";
import { getDailyQuote } from "@/lib/quotes";
import ProgressRing from "@/components/ProgressRing";
import StatCard from "@/components/StatCard";
import ProgressBar from "@/components/ProgressBar";
import { Trophy, Target, Flame, TrendingUp, Sparkles, Wallet, Users } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MyPanel() {
  const s = await getSession();
  const seller = await getSeller(s!.sellerId!);
  const stats = await statsForSeller(seller!.id);
  const quote = await getDailyQuote();

  const isUni = seller!.bu === "unicive";
  const fmtMeta = (n: number) => (isUni ? fmtInt.format(Math.round(n)) : BRL.format(n));

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl grid place-items-center font-bold text-lg"
              style={{ background: seller!.avatar_color }}
            >
              {seller!.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
            </div>
            <div>
              <div className="text-xs text-white/50 uppercase tracking-wider">
                {isUni ? "UNICIVE" : "CPPEM"}
              </div>
              <div className="text-xl font-bold">Ola, {seller!.name.split(" ")[0]}!</div>
              <div className="text-xs text-white/60 mt-1 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-accent" /> {quote.text}
              </div>
            </div>
          </div>
          <Link href="/seller/sales" className="btn-primary">
            <TrendingUp className="w-4 h-4" /> Lancar nova venda
          </Link>
        </div>
      </div>

      <div className="card grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 items-center">
        <ProgressRing
          value={stats!.pctSucesso}
          size={180}
          color={isUni ? "#22d3ee" : "#7c5cff"}
          label="da minha meta"
        />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
          <Cell label="Meta" value={fmtMeta(stats!.metaTotal)} />
          <Cell
            label="Realizado"
            value={fmtMeta(stats!.realizado)}
            accent={isUni ? "#22d3ee" : "#7c5cff"}
          />
          <Cell label="Falta" value={fmtMeta(stats!.falta)} />
          <Cell
            label="Meta do dia"
            value={fmtMeta(stats!.metaDia)}
            accent="#f59e0b"
            icon={<Flame className="w-3.5 h-3.5" />}
          />
        </div>
      </div>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Ticket medio - real"
          value={BRL.format(stats!.ticketReal)}
          hint={`Meta: ${BRL.format(stats!.ticketMeta)}`}
          icon={<Wallet className="w-4 h-4" />}
          accent="#a78bfa"
        />
        <StatCard
          label="Conversao - real"
          value={fmtPct(stats!.conversaoReal)}
          hint={`Meta: ${fmtPct(stats!.conversaoMeta)}`}
          icon={<Target className="w-4 h-4" />}
          accent="#22d3ee"
        />
        <StatCard
          label="Leads recebidos"
          value={fmtInt.format(stats!.leads)}
          hint={`${stats!.vendasCount} venda${stats!.vendasCount === 1 ? "" : "s"} no mes`}
          icon={<Users className="w-4 h-4" />}
          accent="#f59e0b"
        />
        <StatCard
          label="Realizado hoje"
          value={BRL.format(stats!.realizadoHoje)}
          icon={<Trophy className="w-4 h-4" />}
          accent="#22c55e"
        />
      </section>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold">Quanto falta pra meta</div>
          <div className="text-xs text-white/50">
            {fmtPct(stats!.pctSucesso)} concluido
          </div>
        </div>
        <ProgressBar value={stats!.pctSucesso} color={isUni ? "#22d3ee" : "#7c5cff"} height={14} />
        <div className="text-xs text-white/60 mt-2">
          Hoje voce precisa fazer <b>{fmtMeta(stats!.metaDia)}</b> pra manter o ritmo.
          {isUni ? " (matriculas)" : " (faturamento)"}
        </div>
      </div>
    </div>
  );
}

function Cell({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: string;
  accent?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-panel2 p-3">
      <div className="text-[10px] uppercase tracking-wider text-white/50 flex items-center gap-1">
        {icon} {label}
      </div>
      <div className="text-lg font-semibold mt-0.5" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
    </div>
  );
}
