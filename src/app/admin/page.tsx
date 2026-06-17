import type { SellerStats } from "@/lib/calc";
import { statsForAll, ligacaoBreakdown, indicacaoBreakdown, type LigacaoRow, type IndicacaoRow } from "@/lib/data";
import { BRL, fmtInt, fmtPct, periodNow, daysRemainingIncludingToday } from "@/lib/calc";
import { BU_COLOR, BU_LABEL, COLOR, tonePctMeta } from "@/lib/brand";
import { ALL_BUS, isQtdPrimary, type BU } from "@/lib/products";
import ProgressBar from "@/components/ProgressBar";
import OriginDonut from "@/components/OriginDonut";
import { LIGACAO_STATUSES, INDICACAO_STATUSES } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [stats, ligC, ligU, ligCol, indC, indU, indCol] = await Promise.all<any>([
    statsForAll(),
    ligacaoBreakdown({ bu: "cppem" }),
    ligacaoBreakdown({ bu: "unicive" }),
    ligacaoBreakdown({ bu: "colegio_cppem" }),
    indicacaoBreakdown({ bu: "cppem" }),
    indicacaoBreakdown({ bu: "unicive" }),
    indicacaoBreakdown({ bu: "colegio_cppem" }),
  ]);
  const ligacaoMap: Record<BU, LigacaoRow[]> = {
    cppem: ligC, unicive: ligU, colegio_cppem: ligCol,
  };
  const indicacaoMap: Record<BU, IndicacaoRow[]> = {
    cppem: indC, unicive: indU, colegio_cppem: indCol,
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
      <div>
        <h1 className="text-2xl font-bold">Visao geral - {monthName}</h1>
        <p className="text-sm text-white/50">
          Faltam {daysLeft} dia{daysLeft > 1 ? "s" : ""} para o fim do mes.
        </p>
      </div>

      {/* 3 cards comparativos por BU (sem 'hoje', com ticket e conversao) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {ALL_BUS.map((bu) => (
          <BUResume key={bu} bu={bu} sellers={buSellers[bu]} />
        ))}
      </section>

      {/* Secoes por BU: tabela comparativa + donuts de origem */}
      {ALL_BUS.map((bu) => (
        <BUSection
          key={bu}
          bu={bu}
          sellers={buSellers[bu]}
          ligacao={ligacaoMap[bu]}
          indicacao={indicacaoMap[bu]}
        />
      ))}
    </div>
  );
}

function aggregate(rows: SellerStats[]) {
  // Para ticket meta, calcula media simples entre quem tem meta
  const ticketMetas = rows.filter((r) => r.ticketMeta > 0).map((r) => r.ticketMeta);
  const convMetas = rows.filter((r) => r.conversaoMeta > 0).map((r) => r.conversaoMeta);
  return {
    meta: rows.reduce((a, r) => a + Number(r.metaTotal || 0), 0),
    real: rows.reduce((a, r) => a + Number(r.realizado || 0), 0),
    leads: rows.reduce((a, r) => a + Number(r.leads || 0), 0),
    vendas: rows.reduce((a, r) => a + Number(r.vendasCount || 0), 0),
    valorTotal: rows.reduce((a, r) => a + Number(r.realizado || 0) * 0, 0), // placeholder
    ticketMetaAvg: ticketMetas.length > 0 ? ticketMetas.reduce((a, b) => a + b, 0) / ticketMetas.length : 0,
    convMetaAvg: convMetas.length > 0 ? convMetas.reduce((a, b) => a + b, 0) / convMetas.length : 0,
  };
}

function BUResume({ bu, sellers }: { bu: BU; sellers: SellerStats[] }) {
  const color = BU_COLOR[bu];
  const isQtd = isQtdPrimary(bu);
  const agg = aggregate(sellers);
  const pct = agg.meta > 0 ? (agg.real / agg.meta) * 100 : 0;
  const tone = tonePctMeta(pct, agg.meta - agg.real);
  const fmt = (n: number) => (isQtd ? fmtInt.format(Math.round(n)) : BRL.format(n));

  // ticket medio real consolidado = soma valor / soma qtd
  const sumValor = sellers.reduce((a, r) => a + r.valorHoje + 0, 0); // nao funciona pra mes — usar valor mensal
  // Como SellerStats nao tem totalValor explicito, deduzo: pra cppem realizado=valor; pra unicive realizado=qtd.
  // Vou somar via ticketReal * qtd quando disponivel.
  const sumValorReal = sellers.reduce((a, r) => a + (isQtd ? r.ticketReal * r.realizado : r.realizado), 0);
  const sumQtdReal = sellers.reduce((a, r) => a + (isQtd ? r.realizado : r.qtdRealizada), 0);
  const ticketRealConsol = sumQtdReal > 0 ? sumValorReal / sumQtdReal : 0;

  const conversaoReal = agg.leads > 0 ? (agg.vendas / agg.leads) * 100 : 0;

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

      <div className="grid grid-cols-2 gap-2 mt-3">
        <CompareCell
          label={isQtd ? "Matriculas" : "Faturamento"}
          meta={fmt(agg.meta)}
          real={fmt(agg.real)}
          tone={
            agg.meta > 0 ? (pct >= 100 ? COLOR.ok : COLOR.danger) : COLOR.neutral
          }
        />
        <CompareCell
          label="Ticket medio"
          meta={agg.ticketMetaAvg > 0 ? BRL.format(agg.ticketMetaAvg) : "—"}
          real={BRL.format(ticketRealConsol)}
          tone={
            agg.ticketMetaAvg > 0
              ? ticketRealConsol >= agg.ticketMetaAvg
                ? COLOR.ok
                : COLOR.danger
              : COLOR.neutral
          }
        />
        <CompareCell
          label="Conversao"
          meta={agg.convMetaAvg > 0 ? fmtPct(agg.convMetaAvg) : "—"}
          real={fmtPct(conversaoReal)}
          tone={
            agg.convMetaAvg > 0
              ? conversaoReal >= agg.convMetaAvg
                ? COLOR.ok
                : COLOR.danger
              : COLOR.neutral
          }
        />
        <CompareCell label="Leads" meta="—" real={fmtInt.format(agg.leads)} />
      </div>
    </div>
  );
}

function CompareCell({
  label,
  meta,
  real,
  tone,
}: {
  label: string;
  meta: string;
  real: string;
  tone?: string;
}) {
  return (
    <div className="rounded-xl bg-panel2 p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-white/50">{label}</div>
      <div className="text-sm font-semibold leading-tight">
        <span className="text-white/40">{meta}</span>
        <span className="text-white/30 mx-1">/</span>
        <span style={tone ? { color: tone } : undefined}>{real}</span>
      </div>
      <div className="text-[10px] text-white/30 mt-0.5">meta / real</div>
    </div>
  );
}

function BUSection({
  bu,
  sellers,
  ligacao,
  indicacao,
}: {
  bu: BU;
  sellers: SellerStats[];
  ligacao: LigacaoRow[];
  indicacao: IndicacaoRow[];
}) {
  const color = BU_COLOR[bu];
  const isQtd = isQtdPrimary(bu);
  const rankReal = [...sellers].sort((a, b) => b.realizado - a.realizado);
  const fmt = (n: number) => (isQtd ? fmtInt.format(Math.round(n)) : BRL.format(n));

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: color + "22", color }}>
          {BU_LABEL[bu]}
        </div>
        <div className="flex-1 h-px" style={{ background: color + "33" }} />
        <div className="text-[11px] text-white/40">
          {sellers.length} vendedor{sellers.length === 1 ? "" : "es"}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3">
        {/* Tabela comparativa minimalista */}
        <div className="card-lg p-0 overflow-hidden">
          <div className="px-4 pt-4 pb-2 text-sm font-semibold flex items-center justify-between">
            <span>Comparativo {BU_LABEL[bu]}</span>
            <span className="text-[11px] text-white/40">
              ordenado por {isQtd ? "matriculas" : "faturamento"}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase tracking-wider text-white/40 bg-panel2/60">
                <tr className="text-left">
                  <th className="py-2 pl-4">Vendedor</th>
                  <th className="text-right">{isQtd ? "Matriculas (meta/real)" : "Faturamento (meta/real)"}</th>
                  <th className="text-right">Ticket (meta/real)</th>
                  <th className="text-right">Conversao (meta/real)</th>
                  <th className="text-right">Leads</th>
                  <th className="text-right pr-4 w-32">% Meta</th>
                </tr>
              </thead>
              <tbody>
                {rankReal.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-white/50">
                      Nenhum vendedor ativo nesta BU.
                    </td>
                  </tr>
                ) : (
                  rankReal.map((s) => {
                    const tone = tonePctMeta(s.pctSucesso, s.gap);
                    return (
                      <tr
                        key={`${s.sellerId}_${s.bu}`}
                        className="border-t border-border hover:bg-panel2/30"
                      >
                        <td className="py-2 pl-4 font-medium">{s.sellerName}</td>
                        <td className="text-right text-xs whitespace-nowrap">
                          <span className="text-white/40">{fmt(s.metaTotal)}</span>
                          <span className="text-white/30 mx-1">/</span>
                          <span className="font-semibold" style={{ color: tone }}>
                            {fmt(s.realizado)}
                          </span>
                        </td>
                        <td className="text-right text-xs whitespace-nowrap">
                          <span className="text-white/40">
                            {s.ticketMeta > 0 ? BRL.format(s.ticketMeta) : "—"}
                          </span>
                          <span className="text-white/30 mx-1">/</span>
                          <span
                            className="font-semibold"
                            style={{
                              color:
                                s.ticketMeta > 0 && s.ticketReal >= s.ticketMeta
                                  ? COLOR.ok
                                  : COLOR.neutral,
                            }}
                          >
                            {BRL.format(s.ticketReal)}
                          </span>
                        </td>
                        <td className="text-right text-xs whitespace-nowrap">
                          <span className="text-white/40">
                            {s.conversaoMeta > 0 ? fmtPct(s.conversaoMeta) : "—"}
                          </span>
                          <span className="text-white/30 mx-1">/</span>
                          <span
                            className="font-semibold"
                            style={{
                              color:
                                s.conversaoMeta > 0 && s.conversaoReal >= s.conversaoMeta
                                  ? COLOR.ok
                                  : COLOR.neutral,
                            }}
                          >
                            {fmtPct(s.conversaoReal)}
                          </span>
                        </td>
                        <td className="text-right">{fmtInt.format(s.leads)}</td>
                        <td className="text-right pr-4">
                          <div className="flex items-center gap-2 justify-end">
                            <div className="w-16">
                              <ProgressBar value={s.pctSucesso} color={tone} height={6} />
                            </div>
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

        {/* Donut do Onvox */}
        <div className="space-y-3">
          <OriginDonut
            rows={ligacao}
            statuses={LIGACAO_STATUSES}
            title={`Origem por Onvox - ${BU_LABEL[bu]}`}
            subtitle="A ligacao Onvox influenciou a venda?"
          />
          <OriginDonut
            rows={indicacao}
            statuses={INDICACAO_STATUSES}
            title={`Origem por Indicacao - ${BU_LABEL[bu]}`}
            subtitle="A venda veio de indicacao?"
          />
        </div>
      </div>
    </section>
  );
}
