import Link from "next/link";
import type { SellerStats } from "@/lib/calc";
import { statsForAll, ligacaoBreakdown, type LigacaoRow } from "@/lib/data";
import { BRL, fmtInt, fmtPct, periodNow, daysRemainingIncludingToday } from "@/lib/calc";
import { BU_COLOR, BU_LABEL, COLOR, tonePctMeta } from "@/lib/brand";
import { ALL_BUS, isQtdPrimary, type BU } from "@/lib/products";
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
  const [stats, ...ligs] = await Promise.all<any>([
    statsForAll(),
    ...ALL_BUS.map((bu) => ligacaoBreakdown({ bu })),
  ]);
  const ligacaoMap: Record<BU, LigacaoRow[]> = {
    cppem: ligs[0],
    unicive: ligs[1],
    colegio_cppem: ligs[2],
  };

  const { year, month } = periodNow();
  const daysLeft = daysRemainingIncludingToday(year, month);

  const buSellers: Record<BU, SellerStats[]> = {
    cppem: (stats as SellerStats[]).filter((s) => s.bu === "cppem"),
    unicive: (stats as SellerStats[]).filter((s) => s.bu === "unicive"),
    colegio_cppem: (stats as SellerStats[]).filter((s) => s.bu === "colegio_cppem"),
  };

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
            Faltam {daysLeft} dia{daysLeft > 1 ? "s" : ""} para o fim do mes.
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

      {/* 3 cards comparativos por BU */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {ALL_BUS.map((bu) => (
          <BUResume key={bu} bu={bu} sellers={buSellers[bu]} />
        ))}
      </section>

      {/* Secoes por BU */}
      {ALL_BUS.map((bu) => (
        <BUSection
          key={bu}
          bu={bu}
          sellers={buSellers[bu]}
          ligacao={ligacaoMap[bu]}
        />
      ))}
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

function BUResume({ bu, sellers }: { bu: BU; sellers: SellerStats[] }) {
  const color = BU_COLOR[bu];
  const isQtd = isQtdPrimary(bu);
  const agg = aggregate(sellers);
  const pct = agg.meta > 0 ? (agg.real / agg.meta) * 100 : 0;
  const tone = tonePctMeta(pct, agg.meta - agg.real - (agg.real * 0));
  const fmt = (n: number) => (isQtd ? fmtInt.format(Math.round(n)) : BRL.format(n));
  const hoje = isQtd ? agg.qtdHoje : agg.valorHoje;

  return (
    <div className="card-lg">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xs uppercase tracking-wider" style={{ color }}>
            {BU_LABEL[bu]}
          </div>
          <div className="text-lg font-semibold">Meta x Realizado</div>
          <div className="text-xs text-white/50">
            {sellers.length} vendedor{sellers.length === 1 ? "" : "es"}
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold" style={{ color: tone }}>
            {fmtPct(pct)}
          </div>
          <div className="text-xs text-white/50">% da meta</div>
        </div>
      </div>
      <ProgressBar value={pct} color={tone} height={10} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
        <Cell label="Meta" value={fmt(agg.meta)} />
        <Cell label="Realizado" value={fmt(agg.real)} tone={pct >= 100 ? COLOR.ok : COLOR.neutral} />
        <Cell label="Vendas" value={fmtInt.format(agg.vendas)} />
        <Cell label="Leads" value={fmtInt.format(agg.leads)} />
      </div>
      <div className="mt-2 text-xs text-white/50 flex items-center gap-2">
        <Flame className="w-3.5 h-3.5" style={{ color: hoje > 0 ? COLOR.ok : COLOR.mute }} /> Hoje:{" "}
        <span className="text-white font-semibold">{fmt(hoje)}</span>
      </div>
    </div>
  );
}

function Cell({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl bg-panel2 p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-white/50">{label}</div>
      <div className="text-sm font-semibold" style={tone ? { color: tone } : undefined}>
        {value}
      </div>
    </div>
  );
}

function BUSection({
  bu,
  sellers,
  ligacao,
}: {
  bu: BU;
  sellers: SellerStats[];
  ligacao: LigacaoRow[];
}) {
  const color = BU_COLOR[bu];
  const isQtd = isQtdPrimary(bu);
  const sortReal = (a: SellerStats, b: SellerStats) => b.realizado - a.realizado;
  const sortTicket = (a: SellerStats, b: SellerStats) => b.ticketReal - a.ticketReal;
  const sortConv = (a: SellerStats, b: SellerStats) => b.conversaoReal - a.conversaoReal;
  const sortPct = (a: SellerStats, b: SellerStats) => b.pctSucesso - a.pctSucesso;

  const rankReal = [...sellers].sort(sortReal);
  const rankPct = [...sellers].sort(sortPct);
  const rankTicket = [...sellers].sort(sortTicket).filter((r) => r.ticketReal > 0);
  const rankConv = [...sellers].sort(sortConv).filter((r) => r.leads > 0);

  const fmt = (n: number) => (isQtd ? fmtInt.format(Math.round(n)) : BRL.format(n));

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: color + "22", color }}>
          {BU_LABEL[bu]}
        </div>
        <div className="flex-1 h-px" style={{ background: color + "33" }} />
        <div className="text-[11px] text-white/40">
          {sellers.length} vendedor{sellers.length === 1 ? "" : "es"}
        </div>
      </div>

      <LigacaoBreakdown
        rows={ligacao}
        title={`Retorno do Onvox - ${BU_LABEL[bu]}`}
        hint="Origem das vendas dessa BU no mes"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        <Podium
          title={isQtd ? "Mais matriculas" : "Maior faturamento"}
          icon={<TrendingUp className="w-4 h-4" />}
          accent={COLOR.ok}
          rows={rankReal.slice(0, 5).map((r) => ({
            name: r.sellerName,
            value: fmt(r.realizado),
            sub: fmtPct(r.pctSucesso) + " da meta",
          }))}
        />
        <Podium
          title="Maior % da meta"
          icon={<Crown className="w-4 h-4" />}
          accent={COLOR.warning}
          rows={rankPct.slice(0, 5).map((r) => ({
            name: r.sellerName,
            value: fmtPct(r.pctSucesso),
            sub: fmt(r.realizado),
          }))}
        />
        <Podium
          title="Ticket medio"
          icon={<Wallet className="w-4 h-4" />}
          accent={COLOR.info}
          rows={rankTicket.slice(0, 5).map((r) => ({
            name: r.sellerName,
            value: BRL.format(r.ticketReal),
            sub: r.ticketMeta > 0 ? `meta ${BRL.format(r.ticketMeta)}` : "sem meta",
          }))}
        />
        <Podium
          title="Conversao"
          icon={<Target className="w-4 h-4" />}
          accent={COLOR.info}
          rows={rankConv.slice(0, 5).map((r) => ({
            name: r.sellerName,
            value: fmtPct(r.conversaoReal),
            sub: `${r.vendasCount} vendas / ${r.leads} leads`,
          }))}
        />
      </div>

      <div className="card-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold flex items-center gap-2">
            <Users className="w-4 h-4" style={{ color }} /> Comparativo {BU_LABEL[bu]}
          </div>
          <div className="text-xs text-white/40">
            ordenado por {isQtd ? "matriculas" : "faturamento"}
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
                rankReal.map((s) => {
                  const tone = tonePctMeta(s.pctSucesso, s.gap);
                  return (
                    <tr key={`${s.sellerId}_${s.bu}`} className="border-t border-border hover:bg-panel2/40">
                      <td className="py-2 pl-2 font-medium">{s.sellerName}</td>
                      <td className="text-right">{fmt(s.metaTotal)}</td>
                      <td className="text-right font-semibold" style={{ color: tone }}>
                        {fmt(s.realizado)}
                      </td>
                      <td className="text-right text-white/60">{fmt(s.falta)}</td>
                      <td className="text-right text-xs">{BRL.format(s.ticketReal)}</td>
                      <td className="text-right text-xs">{fmtPct(s.conversaoReal)}</td>
                      <td className="text-right">{fmtInt.format(s.leads)}</td>
                      <td className="text-right text-xs">{fmt(s.realizadoHoje)}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <ProgressBar value={s.pctSucesso} color={tone} />
                          <span className="text-xs w-12 text-right" style={{ color: tone }}>
                            {fmtPct(s.pctSucesso)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
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
              <div className="text-sm font-bold text-right text-white">{r.value}</div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
