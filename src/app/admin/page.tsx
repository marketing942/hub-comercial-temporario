import Link from "next/link";
import { statsForAll, ligacaoBreakdown } from "@/lib/data";
import { BRL, fmtInt, fmtPct, periodNow, daysRemainingIncludingToday } from "@/lib/calc";
import { BU_COLOR, BU_LABEL } from "@/lib/brand";
import ProgressBar from "@/components/ProgressBar";
import BigStatCard from "@/components/BigStatCard";
import LigacaoBreakdown from "@/components/LigacaoBreakdown";
import { Users, Target, TrendingUp, Crown, Wallet, ArrowRight, Flame } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [stats, ligacao] = await Promise.all([statsForAll(), ligacaoBreakdown()]);
  const { year, month } = periodNow();
  const daysLeft = daysRemainingIncludingToday(year, month);

  const cppem = stats.filter((s) => s.bu === "cppem");
  const unicive = stats.filter((s) => s.bu === "unicive");

  const sumStat = (rows: typeof stats, fields: (keyof (typeof stats)[number])[]) =>
    fields.reduce(
      (acc, f) => ({ ...acc, [f]: rows.reduce((a, b) => a + Number(b[f] || 0), 0) }),
      {} as Record<string, number>
    );

  const cAgg = sumStat(cppem, ["metaTotal", "realizado", "leads", "vendasCount", "valorHoje", "qtdHoje"]);
  const uAgg = sumStat(unicive, ["metaTotal", "realizado", "leads", "vendasCount", "valorHoje", "qtdHoje"]);
  const cPct = cAgg.metaTotal > 0 ? (cAgg.realizado / cAgg.metaTotal) * 100 : 0;
  const uPct = uAgg.metaTotal > 0 ? (uAgg.realizado / uAgg.metaTotal) * 100 : 0;

  const rankAbsolute = [...stats].sort((a, b) =>
    b.bu === a.bu ? b.realizado - a.realizado : a.bu.localeCompare(b.bu)
  );
  const rankPct = [...stats].sort((a, b) => b.pctSucesso - a.pctSucesso);
  const rankTicket = [...stats].sort((a, b) => b.ticketReal - a.ticketReal);
  const rankConversao = [...stats].sort((a, b) => b.conversaoReal - a.conversaoReal);

  const monthName = new Date(year, month - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Visao geral - {monthName}</h1>
          <p className="text-sm text-white/50">
            Faltam {daysLeft} dia{daysLeft > 1 ? "s" : ""} para o fim do mes. {stats.length} vendedor
            {stats.length === 1 ? "" : "es"} ativo{stats.length === 1 ? "" : "s"}.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/goals" className="btn-primary text-sm">
            <Target className="w-4 h-4" /> Definir metas
          </Link>
          <Link href="/dashboard" className="btn-ghost text-sm">
            Dashboard TV <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Resumo BU x BU */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BUResume
          bu="cppem"
          meta={cAgg.metaTotal}
          real={cAgg.realizado}
          pct={cPct}
          hoje={cAgg.valorHoje}
          vendas={cAgg.vendasCount}
          leads={cAgg.leads}
          sellersCount={cppem.length}
          isCurrency
        />
        <BUResume
          bu="unicive"
          meta={uAgg.metaTotal}
          real={uAgg.realizado}
          pct={uPct}
          hoje={uAgg.qtdHoje}
          vendas={uAgg.vendasCount}
          leads={uAgg.leads}
          sellersCount={unicive.length}
          isCurrency={false}
        />
      </section>

      {/* Retorno do Onvox */}
      <LigacaoBreakdown rows={ligacao} />

      {/* 4 podios comparativos */}
      <section className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        <Podium title="Maior % da meta" icon={<Crown className="w-4 h-4" />} accent="#facc15" rows={rankPct.slice(0, 5).map((r) => ({
          name: r.sellerName,
          bu: r.bu,
          value: fmtPct(r.pctSucesso),
          sub: r.bu === "unicive" ? fmtInt.format(r.realizado) : BRL.format(r.realizado),
        }))} />
        <Podium title="Mais vendido (R$ / qtd)" icon={<TrendingUp className="w-4 h-4" />} accent="#22c55e" rows={rankAbsolute.slice(0, 5).map((r) => ({
          name: r.sellerName,
          bu: r.bu,
          value: r.bu === "unicive" ? fmtInt.format(r.realizado) : BRL.format(r.realizado),
          sub: fmtPct(r.pctSucesso),
        }))} />
        <Podium title="Ticket medio" icon={<Wallet className="w-4 h-4" />} accent="#06b6d4" rows={rankTicket.filter((r) => r.ticketReal > 0).slice(0, 5).map((r) => ({
          name: r.sellerName,
          bu: r.bu,
          value: BRL.format(r.ticketReal),
          sub: `meta ${BRL.format(r.ticketMeta)}`,
        }))} />
        <Podium title="Conversao" icon={<Target className="w-4 h-4" />} accent="#a3e635" rows={rankConversao.filter((r) => r.leads > 0).slice(0, 5).map((r) => ({
          name: r.sellerName,
          bu: r.bu,
          value: fmtPct(r.conversaoReal),
          sub: `${r.vendasCount} vendas / ${r.leads} leads`,
        }))} />
      </section>

      {/* Tabela comparativa */}
      <div className="card-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-accent" /> Comparativo de vendedores
          </div>
          <div className="text-xs text-white/40">
            Ordenado por % da meta (clique numa coluna nao funciona ainda)
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-white/40">
              <tr className="text-left">
                <th className="py-2 pl-2">Vendedor</th>
                <th>BU</th>
                <th className="text-right">Meta</th>
                <th className="text-right">Realizado</th>
                <th className="text-right">Falta</th>
                <th className="text-right">Ticket</th>
                <th className="text-right">Conversao</th>
                <th className="text-right">Leads</th>
                <th className="text-right">Hoje</th>
                <th className="w-44">% Meta</th>
              </tr>
            </thead>
            <tbody>
              {rankPct.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-6 text-center text-white/50">
                    Cadastre vendedores em <Link href="/admin/sellers" className="text-accent">Vendedores</Link>.
                  </td>
                </tr>
              )}
              {rankPct.map((s) => {
                const isUni = s.bu === "unicive";
                const fmt = (n: number) => (isUni ? fmtInt.format(Math.round(n)) : BRL.format(n));
                return (
                  <tr key={s.sellerId} className="border-t border-border hover:bg-panel2/40">
                    <td className="py-2 pl-2 font-medium">{s.sellerName}</td>
                    <td>
                      <span className={isUni ? "chip-unicive" : "chip-cppem"}>
                        {BU_LABEL[s.bu]}
                      </span>
                    </td>
                    <td className="text-right">{fmt(s.metaTotal)}</td>
                    <td className="text-right font-semibold">{fmt(s.realizado)}</td>
                    <td className="text-right text-white/60">{fmt(s.falta)}</td>
                    <td className="text-right text-xs">
                      <div>{BRL.format(s.ticketReal)}</div>
                      <div className="text-white/40">meta {BRL.format(s.ticketMeta)}</div>
                    </td>
                    <td className="text-right text-xs">
                      <div>{fmtPct(s.conversaoReal)}</div>
                      <div className="text-white/40">meta {fmtPct(s.conversaoMeta)}</div>
                    </td>
                    <td className="text-right">{fmtInt.format(s.leads)}</td>
                    <td className="text-right text-xs">
                      <div className="font-semibold">{fmt(s.realizadoHoje)}</div>
                      <div className="text-white/40">{s.vendasCount} vendas</div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <ProgressBar value={s.pctSucesso} color={BU_COLOR[s.bu]} />
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

function BUResume({
  bu,
  meta,
  real,
  pct,
  hoje,
  vendas,
  leads,
  sellersCount,
  isCurrency,
}: {
  bu: "cppem" | "unicive";
  meta: number;
  real: number;
  pct: number;
  hoje: number;
  vendas: number;
  leads: number;
  sellersCount: number;
  isCurrency: boolean;
}) {
  const color = BU_COLOR[bu];
  const fmt = (n: number) =>
    isCurrency ? BRL.format(n) : fmtInt.format(Math.round(n));
  return (
    <div className="card-lg">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xs uppercase tracking-wider" style={{ color }}>
            {BU_LABEL[bu]}
          </div>
          <div className="text-xl font-semibold">Meta x Realizado</div>
          <div className="text-xs text-white/50">
            {sellersCount} vendedor{sellersCount === 1 ? "" : "es"}
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold" style={{ color }}>
            {fmtPct(pct)}
          </div>
          <div className="text-xs text-white/50">% da meta</div>
        </div>
      </div>
      <ProgressBar value={pct} color={color} height={12} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
        <Cell label="Meta" value={fmt(meta)} />
        <Cell label="Realizado" value={fmt(real)} accent={color} />
        <Cell label="Vendas" value={fmtInt.format(vendas)} />
        <Cell label="Leads" value={fmtInt.format(leads)} />
      </div>
      <div className="mt-2 text-xs text-white/50 flex items-center gap-2">
        <Flame className="w-3.5 h-3.5 text-warning" /> Hoje:{" "}
        <span className="text-white font-semibold">{fmt(hoje)}</span>
      </div>
    </div>
  );
}

function Cell({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl bg-panel2 p-3">
      <div className="text-[10px] uppercase tracking-wider text-white/50">{label}</div>
      <div className="text-base font-semibold" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
    </div>
  );
}

function Podium({
  title,
  icon,
  accent,
  rows,
}: {
  title: string;
  icon: React.ReactNode;
  accent: string;
  rows: { name: string; bu: "cppem" | "unicive"; value: string; sub: string }[];
}) {
  return (
    <div className="card-lg">
      <div className="flex items-center gap-2 text-sm font-semibold mb-3" style={{ color: accent }}>
        {icon} {title}
      </div>
      {rows.length === 0 ? (
        <div className="text-xs text-white/50">Sem dados ainda.</div>
      ) : (
        <ol className="space-y-2">
          {rows.map((r, i) => (
            <li
              key={r.name + i}
              className="flex items-center gap-3 p-2 rounded-xl bg-panel2/60"
            >
              <div
                className="w-7 h-7 grid place-items-center rounded-lg text-xs font-bold"
                style={{
                  background: i === 0 ? `${accent}22` : "#1f3a2a",
                  color: i === 0 ? accent : "#fff",
                }}
              >
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{r.name}</div>
                <div className="text-[11px] text-white/40 flex items-center gap-1">
                  <span className={r.bu === "cppem" ? "chip-cppem" : "chip-unicive"}>
                    {BU_LABEL[r.bu]}
                  </span>
                  <span>{r.sub}</span>
                </div>
              </div>
              <div className="text-sm font-bold text-right" style={{ color: accent }}>
                {r.value}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
