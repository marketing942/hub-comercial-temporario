import Link from "next/link";
import type { SellerStats } from "@/lib/calc";
import { statsForAll, ligacaoBreakdown, type LigacaoRow } from "@/lib/data";
import { BRL, fmtInt, fmtPct, periodNow, daysRemainingIncludingToday } from "@/lib/calc";
import { BU_COLOR, BU_LABEL } from "@/lib/brand";
import ProgressBar from "@/components/ProgressBar";
import LigacaoBreakdown from "@/components/LigacaoBreakdown";
import {
  Users,
  Target,
  TrendingUp,
  Crown,
  Wallet,
  ArrowRight,
  Flame,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [stats, ligacaoCppem, ligacaoUni] = await Promise.all([
    statsForAll(),
    ligacaoBreakdown({ bu: "cppem" }),
    ligacaoBreakdown({ bu: "unicive" }),
  ]);
  const { year, month } = periodNow();
  const daysLeft = daysRemainingIncludingToday(year, month);

  const cppem = stats.filter((s) => s.bu === "cppem");
  const unicive = stats.filter((s) => s.bu === "unicive");

  const cAgg = aggregate(cppem);
  const uAgg = aggregate(unicive);
  const cPct = cAgg.meta > 0 ? (cAgg.real / cAgg.meta) * 100 : 0;
  const uPct = uAgg.meta > 0 ? (uAgg.real / uAgg.meta) * 100 : 0;

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

      {/* Cards comparativos por BU (mantidos) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BUResume
          bu="cppem"
          meta={cAgg.meta}
          real={cAgg.real}
          pct={cPct}
          hoje={cAgg.valorHoje}
          vendas={cAgg.vendas}
          leads={cAgg.leads}
          sellersCount={cppem.length}
          isCurrency
        />
        <BUResume
          bu="unicive"
          meta={uAgg.meta}
          real={uAgg.real}
          pct={uPct}
          hoje={uAgg.qtdHoje}
          vendas={uAgg.vendas}
          leads={uAgg.leads}
          sellersCount={unicive.length}
          isCurrency={false}
        />
      </section>

      {/* Secao CPPEM */}
      <BUSection
        bu="cppem"
        sellers={cppem}
        ligacao={ligacaoCppem}
      />

      {/* Secao UNICIVE */}
      <BUSection
        bu="unicive"
        sellers={unicive}
        ligacao={ligacaoUni}
      />
    </div>
  );
}

function aggregate(rows: SellerStats[]) {
  return rows.reduce(
    (acc, r) => ({
      meta: acc.meta + Number(r.metaTotal || 0),
      real: acc.real + Number(r.realizado || 0),
      leads: acc.leads + Number(r.leads || 0),
      vendas: acc.vendas + Number(r.vendasCount || 0),
      valorHoje: acc.valorHoje + Number(r.valorHoje || 0),
      qtdHoje: acc.qtdHoje + Number(r.qtdHoje || 0),
    }),
    { meta: 0, real: 0, leads: 0, vendas: 0, valorHoje: 0, qtdHoje: 0 }
  );
}

function BUSection({
  bu,
  sellers,
  ligacao,
}: {
  bu: "cppem" | "unicive";
  sellers: SellerStats[];
  ligacao: LigacaoRow[];
}) {
  const color = BU_COLOR[bu];
  const isUni = bu === "unicive";
  const sortReal = (a: SellerStats, b: SellerStats) => b.realizado - a.realizado;
  const sortTicket = (a: SellerStats, b: SellerStats) => b.ticketReal - a.ticketReal;
  const sortConv = (a: SellerStats, b: SellerStats) => b.conversaoReal - a.conversaoReal;
  const sortPct = (a: SellerStats, b: SellerStats) => b.pctSucesso - a.pctSucesso;

  const rankReal = [...sellers].sort(sortReal);
  const rankPct = [...sellers].sort(sortPct);
  const rankTicket = [...sellers].sort(sortTicket).filter((r) => r.ticketReal > 0);
  const rankConv = [...sellers].sort(sortConv).filter((r) => r.leads > 0);

  const fmt = (n: number) => (isUni ? fmtInt.format(Math.round(n)) : BRL.format(n));

  return (
    <section className="space-y-4">
      {/* Separator */}
      <div className="flex items-center gap-3">
        <div
          className="px-3 py-1 rounded-full text-xs font-bold"
          style={{ background: color + "22", color }}
        >
          {BU_LABEL[bu]}
        </div>
        <div className="flex-1 h-px" style={{ background: color + "33" }} />
        <div className="text-[11px] text-white/40">
          {sellers.length} vendedor{sellers.length === 1 ? "" : "es"}
        </div>
      </div>

      {/* Onvox por BU */}
      <LigacaoBreakdown
        rows={ligacao}
        title={`Retorno do Onvox - ${BU_LABEL[bu]}`}
        hint="Origem das vendas dessa BU no mes"
      />

      {/* 4 podios da BU */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        <Podium
          title={isUni ? "Mais matriculas" : "Maior faturamento"}
          icon={<TrendingUp className="w-4 h-4" />}
          accent={color}
          rows={rankReal.slice(0, 5).map((r) => ({
            name: r.sellerName,
            value: fmt(r.realizado),
            sub: fmtPct(r.pctSucesso) + " da meta",
          }))}
        />
        <Podium
          title="Maior % da meta"
          icon={<Crown className="w-4 h-4" />}
          accent="#facc15"
          rows={rankPct.slice(0, 5).map((r) => ({
            name: r.sellerName,
            value: fmtPct(r.pctSucesso),
            sub: fmt(r.realizado),
          }))}
        />
        <Podium
          title="Ticket medio"
          icon={<Wallet className="w-4 h-4" />}
          accent="#06b6d4"
          rows={rankTicket.slice(0, 5).map((r) => ({
            name: r.sellerName,
            value: BRL.format(r.ticketReal),
            sub: r.ticketMeta > 0 ? `meta ${BRL.format(r.ticketMeta)}` : "sem meta",
          }))}
        />
        <Podium
          title="Conversao"
          icon={<Target className="w-4 h-4" />}
          accent="#a3e635"
          rows={rankConv.slice(0, 5).map((r) => ({
            name: r.sellerName,
            value: fmtPct(r.conversaoReal),
            sub: `${r.vendasCount} vendas / ${r.leads} leads`,
          }))}
        />
      </div>

      {/* Tabela completa da BU */}
      <div className="card-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold flex items-center gap-2">
            <Users className="w-4 h-4" style={{ color }} /> Comparativo {BU_LABEL[bu]}
          </div>
          <div className="text-xs text-white/40">
            ordenado por {isUni ? "matriculas" : "faturamento"}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-white/40">
              <tr className="text-left">
                <th className="py-2 pl-2">Vendedor</th>
                <th className="text-right">Meta</th>
                <th className="text-right">Realizado</th>
                <th className="text-right">Falta</th>
                <th className="text-right">Ticket</th>
                <th className="text-right">Conversao</th>
                <th className="text-right">Leads</th>
                <th className="text-right">Hoje</th>
                <th className="w-40">% Meta</th>
              </tr>
            </thead>
            <tbody>
              {rankReal.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-white/50">
                    Nenhum vendedor ativo nesta BU.
                  </td>
                </tr>
              ) : (
                rankReal.map((s) => (
                  <tr key={s.sellerId} className="border-t border-border hover:bg-panel2/40">
                    <td className="py-2 pl-2 font-medium">{s.sellerName}</td>
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
                        <ProgressBar value={s.pctSucesso} color={color} />
                        <span className="text-xs w-12 text-right">{fmtPct(s.pctSucesso)}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
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
  rows: { name: string; value: string; sub: string }[];
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
                <div className="text-[11px] text-white/40">{r.sub}</div>
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
