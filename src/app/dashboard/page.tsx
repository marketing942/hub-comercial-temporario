import { statsForAll } from "@/lib/data";
import { BRL, fmtInt, fmtPct, periodNow, daysRemainingIncludingToday, daysInMonth, todayDayOfMonth } from "@/lib/calc";
import { getDailyQuote } from "@/lib/quotes";
import ProgressRing from "@/components/ProgressRing";
import StatCard from "@/components/StatCard";
import ProgressBar from "@/components/ProgressBar";
import { Crown, Flame, Target, TrendingUp, Users, Sparkles, Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const stats = await statsForAll();
  const quote = await getDailyQuote();
  const { year, month } = periodNow();
  const totalDays = daysInMonth(year, month);
  const day = todayDayOfMonth(year, month);
  const daysLeft = daysRemainingIncludingToday(year, month);

  const cppem = stats.filter((s) => s.bu === "cppem");
  const unicive = stats.filter((s) => s.bu === "unicive");

  const cppemMeta = cppem.reduce((a, b) => a + b.metaTotal, 0);
  const cppemReal = cppem.reduce((a, b) => a + b.realizado, 0);
  const cppemPct = cppemMeta > 0 ? (cppemReal / cppemMeta) * 100 : 0;

  const uniMeta = unicive.reduce((a, b) => a + b.metaTotal, 0);
  const uniReal = unicive.reduce((a, b) => a + b.realizado, 0);
  const uniPct = uniMeta > 0 ? (uniReal / uniMeta) * 100 : 0;

  const cppemFalta = Math.max(0, cppemMeta - cppemReal);
  const uniFalta = Math.max(0, uniMeta - uniReal);

  const metaDiaCppem = cppemFalta / daysLeft;
  const metaDiaUnicive = uniFalta / daysLeft;

  const rankingCppem = [...cppem].sort((a, b) => b.pctSucesso - a.pctSucesso);
  const rankingUnicive = [...unicive].sort((a, b) => b.pctSucesso - a.pctSucesso);

  const monthName = new Date(year, month - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Header com frase motivacional */}
      <div className="card relative overflow-hidden">
        <div className="absolute inset-0 shimmer pointer-events-none opacity-30" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-white/50 uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5" /> {monthName} - dia {day}/{totalDays} - faltam {daysLeft} dia{daysLeft > 1 ? "s" : ""}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mt-1">Hub Comercial</h1>
            <div className="text-sm text-white/60 mt-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" /> "{quote.text}"
              {quote.author && <span className="text-white/40">- {quote.author}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Visao geral CPPEM x UNICIVE */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BUOverview
          title="CPPEM"
          accent="#7c5cff"
          meta={cppemMeta}
          real={cppemReal}
          pct={cppemPct}
          falta={cppemFalta}
          metaDia={metaDiaCppem}
          isCurrency
          subline={`${cppem.length} vendedor${cppem.length === 1 ? "" : "es"}`}
        />
        <BUOverview
          title="UNICIVE"
          accent="#22d3ee"
          meta={uniMeta}
          real={uniReal}
          pct={uniPct}
          falta={uniFalta}
          metaDia={metaDiaUnicive}
          isCurrency={false}
          subline={`${unicive.length} vendedor${unicive.length === 1 ? "" : "es"} - matriculas`}
        />
      </section>

      {/* KPIs gerais */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Vendas hoje (CPPEM)"
          value={BRL.format(cppem.reduce((a, b) => a + b.valorHoje, 0))}
          hint={`Total faturado em ${day}/${totalDays}`}
          icon={<TrendingUp className="w-4 h-4" />}
          accent="#7c5cff"
        />
        <StatCard
          label="Matriculas hoje"
          value={fmtInt.format(unicive.reduce((a, b) => a + b.qtdHoje, 0))}
          hint="Quantidade vendida hoje (Unicive)"
          icon={<TrendingUp className="w-4 h-4" />}
          accent="#22d3ee"
        />
        <StatCard
          label="Total vendedores ativos"
          value={fmtInt.format(stats.length)}
          icon={<Users className="w-4 h-4" />}
          accent="#22c55e"
        />
        <StatCard
          label="Leads recebidos no mes"
          value={fmtInt.format(stats.reduce((a, b) => a + b.leads, 0))}
          icon={<Target className="w-4 h-4" />}
          accent="#f59e0b"
        />
      </section>

      {/* Rankings */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RankingPanel title="Ranking CPPEM" accent="#7c5cff" rows={rankingCppem} valueAsCurrency />
        <RankingPanel
          title="Ranking UNICIVE"
          accent="#22d3ee"
          rows={rankingUnicive}
          valueAsCurrency={false}
        />
      </section>
    </div>
  );
}

function BUOverview({
  title,
  accent,
  meta,
  real,
  pct,
  falta,
  metaDia,
  isCurrency,
  subline,
}: {
  title: string;
  accent: string;
  meta: number;
  real: number;
  pct: number;
  falta: number;
  metaDia: number;
  isCurrency: boolean;
  subline: string;
}) {
  const fmt = (n: number) => (isCurrency ? BRL.format(n) : fmtInt.format(Math.round(n)));
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider" style={{ color: accent }}>
            {title}
          </div>
          <div className="text-xl font-semibold mt-1">Meta x Realizado do mes</div>
          <div className="text-xs text-white/50">{subline}</div>
        </div>
        <ProgressRing value={pct} color={accent} label="da meta" />
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4">
        <Cell label="Meta" value={fmt(meta)} />
        <Cell label="Realizado" value={fmt(real)} accent={accent} />
        <Cell label="Falta" value={fmt(falta)} />
      </div>

      <div className="mt-4">
        <ProgressBar value={pct} color={accent} />
        <div className="flex items-center justify-between mt-2 text-xs text-white/60">
          <span>0</span>
          <span>{fmtPct(pct)}</span>
          <span>100%</span>
        </div>
      </div>

      <div className="mt-4 p-3 rounded-xl bg-panel2 flex items-center gap-3">
        <Flame className="w-5 h-5" style={{ color: accent }} />
        <div className="flex-1">
          <div className="text-xs text-white/50 uppercase tracking-wider">Meta do dia</div>
          <div className="text-lg font-semibold">{fmt(metaDia)}</div>
        </div>
        <div className="text-xs text-white/50">para bater no ritmo</div>
      </div>
    </div>
  );
}

function Cell({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl bg-panel2 p-3">
      <div className="text-[10px] uppercase tracking-wider text-white/50">{label}</div>
      <div className="text-base font-semibold" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
    </div>
  );
}

function RankingPanel({
  title,
  accent,
  rows,
  valueAsCurrency,
}: {
  title: string;
  accent: string;
  rows: Awaited<ReturnType<typeof statsForAll>>;
  valueAsCurrency: boolean;
}) {
  const fmt = (n: number) => (valueAsCurrency ? BRL.format(n) : fmtInt.format(Math.round(n)));
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-semibold flex items-center gap-2">
          <Crown className="w-4 h-4" style={{ color: accent }} /> {title}
        </div>
        <div className="text-xs text-white/40">por % da meta</div>
      </div>
      {rows.length === 0 ? (
        <div className="text-sm text-white/50">Nenhum vendedor cadastrado nesta BU.</div>
      ) : (
        <ol className="space-y-2">
          {rows.map((r, i) => (
            <li
              key={r.sellerId}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-panel2 transition"
            >
              <div
                className="w-7 h-7 grid place-items-center rounded-lg text-xs font-bold"
                style={{
                  background: i === 0 ? "#facc1522" : "#222638",
                  color: i === 0 ? "#facc15" : "#fff",
                }}
              >
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{r.sellerName}</div>
                <ProgressBar value={r.pctSucesso} color={accent} height={6} />
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">{fmtPct(r.pctSucesso)}</div>
                <div className="text-[11px] text-white/50">{fmt(r.realizado)}</div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
