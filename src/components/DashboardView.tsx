import type { DashboardSnapshot } from "@/lib/data";
import { BRL, fmtInt, fmtPct } from "@/lib/calc";
import { BU_COLOR, BU_LABEL, BU_THEME, COLOR, tonePctMeta } from "@/lib/brand";
import { isQtdPrimary } from "@/lib/products";
import BULogo from "@/components/BULogo";
import BigStatCard from "@/components/BigStatCard";
import ProgressBar from "@/components/ProgressBar";
import DailySalesChart from "@/components/charts/DailySalesChart";
import CumulativeGoalChart from "@/components/charts/CumulativeGoalChart";
import ProductRevenueBreakdown from "@/components/ProductRevenueBreakdown";
import ColegioTurmasBreakdown from "@/components/ColegioTurmasBreakdown";
import TurmasBreakdown from "@/components/TurmasBreakdown";
import UniciveCategoriasBreakdown from "@/components/UniciveCategoriasBreakdown";
import {
  Flame,
  Target,
  TrendingUp,
  Wallet,
  Zap,
  Users,
  Trophy,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

const CPPEM_TURMA_IDS = ["turma_pmal", "turma_pmpe", "turma_carreiras"];
const UNICIVE_CATEGORY_IDS = ["matriculas", "bolsas_unicive"];

export default function DashboardView({
  snap,
  day,
  totalDays,
  daysLeft,
  monthName,
}: {
  snap: DashboardSnapshot;
  day: number;
  totalDays: number;
  daysLeft: number;
  monthName: string;
}) {
  const { bu, series, sellers, leadsTotal, taxaConversao, breakdown } = snap;
  const isQtd = isQtdPrimary(bu);
  const color = BU_COLOR[bu];
  const theme = BU_THEME[bu];
  const t = series.totals;

  const realizado = t.realizado;
  const pct = t.meta > 0 ? (realizado / t.meta) * 100 : 0;
  const falta = Math.max(0, t.meta - realizado);
  const fmtMeta = (n: number) => (isQtd ? fmtInt.format(Math.round(n)) : BRL.format(n));
  const pctTone = tonePctMeta(pct, t.gap);
  const pctFat = t.metaValor > 0 ? (t.valor / t.metaValor) * 100 : 0;
  const faltaFat = Math.max(0, t.metaValor - t.valor);

  // Meta do dia (pace dinamico): quanto precisa fazer HOJE pra fechar
  // a meta nos dias restantes incluindo hoje. Ja embute o atraso.
  // Vencendo se realizado_hoje >= meta_dia; perdendo caso contrario.
  const metaDia = t.metaDia;
  const realHoje = t.realizadoHoje;
  const diff = realHoje - metaDia;
  const vencendo = realHoje >= metaDia && metaDia > 0;
  const empate = Math.abs(diff) < (isQtd ? 0.5 : 0.01);
  const semMeta = metaDia <= 0 || t.meta === 0;
  const placarColor = semMeta
    ? COLOR.mute
    : empate
    ? COLOR.warning
    : vencendo
    ? COLOR.ok
    : COLOR.danger;
  const placarLabel = semMeta
    ? "Sem meta definida"
    : pct >= 100
    ? "Meta do mes batida"
    : empate
    ? "No ritmo do dia"
    : vencendo
    ? "Vencendo o dia"
    : "Atras no dia";

  const statusBar =
    pct >= 100
      ? "Meta atingida! Missao cumprida."
      : t.gap > 0
      ? `Atrasado em ${fmtMeta(t.gap)} no ritmo ideal.`
      : "No ritmo ou adiantado, segue forte!";

  return (
    <div
      className="space-y-4 rounded-2xl p-4 -m-1 relative overflow-hidden"
      style={{ backgroundImage: theme.bg }}
    >
      {/* Header personalizado da BU */}
      <div
        className="rounded-2xl p-4 flex items-center justify-between gap-4 border border-white/5"
        style={{ backgroundImage: theme.headerBg }}
      >
        <div className="flex items-center gap-3">
          <BULogo bu={bu} size={56} />
          <div>
            <div className="text-[11px] uppercase tracking-wider text-white/60">
              {monthName} - dia {day}/{totalDays} - faltam {daysLeft} dia{daysLeft > 1 ? "s" : ""}
            </div>
            <h2 className="text-2xl xl:text-3xl font-bold mt-0.5">Dashboard {BU_LABEL[bu]}</h2>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <div
            className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{ background: theme.accent2 + "22", color: theme.accent2 }}
          >
            {BU_LABEL[bu]} · {monthName}
          </div>
        </div>
      </div>

      {/* 4 KPIs grandes */}
      <section className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {isQtd ? (
          <>
            <BigStatCard
              label="Matriculas (Real / Meta)"
              value={`${fmtInt.format(t.qtd)} / ${fmtInt.format(t.meta)}`}
              hint={pct >= 100 ? "Meta batida" : `Faltam ${fmtInt.format(falta)}`}
              icon={<TrendingUp />}
              accent={COLOR.ok}
              valueColor={COLOR.neutral}
            />
            <BigStatCard
              label="Faturamento (Real / Meta)"
              value={`${BRL.format(t.valor)} / ${BRL.format(t.metaValor)}`}
              hint={pctFat >= 100 ? "Meta de R$ batida" : `Faltam ${BRL.format(faltaFat)}`}
              icon={<Wallet />}
              accent={COLOR.warning}
              valueColor={COLOR.neutral}
            />
            <BigStatCard
              label="% da Meta (matriculas)"
              value={fmtPct(pct)}
              hint={`${fmtPct(pctFat)} no faturamento`}
              icon={<TrendingUp />}
              accent={pctTone}
              valueColor={pctTone}
            />
            <MetaDoDiaCard
              metaDia={fmtMeta(metaDia)}
              realHoje={fmtMeta(realHoje)}
              diff={fmtMeta(Math.abs(diff))}
              placarLabel={placarLabel}
              placarColor={placarColor}
              vencendo={vencendo}
              empate={empate}
              semMeta={semMeta}
            />
          </>
        ) : (
          <>
            <BigStatCard
              label="Total Vendido"
              value={BRL.format(t.valor)}
              hint="Acumulado do mes"
              icon={<Wallet />}
              accent={COLOR.ok}
              valueColor={COLOR.neutral}
            />
            <BigStatCard
              label="Meta do Mes"
              value={BRL.format(t.meta)}
              hint={pct >= 100 ? "Meta batida" : `Faltam ${BRL.format(falta)}`}
              icon={<Target />}
              accent={COLOR.warning}
              valueColor={COLOR.neutral}
            />
            <BigStatCard
              label="% da Meta"
              value={fmtPct(pct)}
              hint={pct >= 100 ? "Meta batida" : t.gap > 0 ? "Atrasado" : "No ritmo"}
              icon={<TrendingUp />}
              accent={pctTone}
              valueColor={pctTone}
            />
            <MetaDoDiaCard
              metaDia={fmtMeta(metaDia)}
              realHoje={fmtMeta(realHoje)}
              diff={fmtMeta(Math.abs(diff))}
              placarLabel={placarLabel}
              placarColor={placarColor}
              vencendo={vencendo}
              empate={empate}
              semMeta={semMeta}
            />
          </>
        )}
      </section>

      {/* Mini stats (Ticket / Conversao / Leads / Realizado hoje) */}
      <section className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <MiniStat
          label="Ticket Medio"
          value={BRL.format(t.ticketReal)}
          hint={t.ticketMeta > 0 ? `Meta ${BRL.format(t.ticketMeta)}` : "Sem meta"}
          icon={<Wallet className="w-4 h-4" />}
          accent={COLOR.info}
        />
        <MiniStat
          label="Conversao"
          value={fmtPct(taxaConversao)}
          hint={`${sellers.reduce((a, b) => a + b.vendasCount, 0)} vendas`}
          icon={<Target className="w-4 h-4" />}
          accent={COLOR.info}
        />
        <MiniStat
          label="Leads no Mes"
          value={fmtInt.format(leadsTotal)}
          hint="Admin atualiza diariamente"
          icon={<Users className="w-4 h-4" />}
          accent={COLOR.neutral}
        />
        <MiniStat
          label="Realizado Hoje"
          value={fmtMeta(t.realizadoHoje)}
          hint={`Dia ${day}/${totalDays}`}
          icon={<Trophy className="w-4 h-4" />}
          accent={t.realizadoHoje > 0 ? COLOR.ok : COLOR.mute}
        />
      </section>

      {/* Meta em Andamento — barra + status */}
      <section className="card-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Target className="w-4 h-4" style={{ color: COLOR.ok }} /> Meta em Andamento
          </div>
          <div
            className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold"
            style={{ background: pctTone + "22", color: pctTone }}
          >
            <Zap className="w-3.5 h-3.5" /> {fmtPct(pct)}
          </div>
        </div>
        <ProgressBar value={pct} color={pctTone} height={14} />
        <div className="text-center text-white/60 text-xs mt-2">{statusBar}</div>
      </section>

      {/* Grid customizado por BU: receita + card lateral */}
      {bu === "cppem" && (
        <section className="grid grid-cols-1 xl:grid-cols-5 gap-3">
          <div className="xl:col-span-3">
            <ProductRevenueBreakdown rows={breakdown} color={color} excludeIds={CPPEM_TURMA_IDS} />
          </div>
          <div className="xl:col-span-2">
            <TurmasBreakdown rows={breakdown} variant="stack" />
          </div>
        </section>
      )}

      {bu === "unicive" && (
        <section className="grid grid-cols-1 xl:grid-cols-5 gap-3">
          <div className="xl:col-span-3">
            <ProductRevenueBreakdown rows={breakdown} color={color} excludeIds={UNICIVE_CATEGORY_IDS} />
          </div>
          <div className="xl:col-span-2">
            <UniciveCategoriasBreakdown rows={breakdown} />
          </div>
        </section>
      )}

      {bu === "colegio_cppem" && (
        <>
          <ProductRevenueBreakdown rows={breakdown} color={color} />
          <ColegioTurmasBreakdown rows={breakdown} />
        </>
      )}

      {/* Charts no fim */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <div className="card-lg">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-sm font-semibold">Evolucao Diaria</div>
              <div className="text-xs text-white/50">
                {isQtd ? "Matriculas por dia" : "Faturamento por dia"}
              </div>
            </div>
            <div className="text-xs px-3 py-1 rounded-full bg-panel2 text-white/70">{monthName}</div>
          </div>
          <DailySalesChart
            data={series.daily}
            color={color}
            field={isQtd ? "qtd" : "valor"}
            unit={isQtd ? "int" : "currency"}
          />
        </div>
        <div className="card-lg">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-sm font-semibold">% da Meta Acumulada</div>
              <div className="text-xs text-white/50">Linha tracejada = ritmo ideal</div>
            </div>
            <div className="text-xs px-3 py-1 rounded-full bg-panel2 text-white/70">
              dia {day}/{totalDays}
            </div>
          </div>
          <CumulativeGoalChart data={series.cumulative} color={pctTone} />
        </div>
      </section>
    </div>
  );
}

function MetaDoDiaCard({
  metaDia,
  realHoje,
  diff,
  placarLabel,
  placarColor,
  vencendo,
  empate,
  semMeta,
}: {
  metaDia: string;
  realHoje: string;
  diff: string;
  placarLabel: string;
  placarColor: string;
  vencendo: boolean;
  empate: boolean;
  semMeta: boolean;
}) {
  const Arrow = vencendo ? ArrowUpRight : ArrowDownRight;
  return (
    <div className="card-lg card-hover relative overflow-hidden">
      <div
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-25 blur-3xl pointer-events-none"
        style={{ background: placarColor }}
      />
      <div className="relative flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div className="kpi-label">Meta do Dia</div>
          <div
            className="w-9 h-9 rounded-lg grid place-items-center text-base"
            style={{ background: placarColor + "22", color: placarColor }}
          >
            <Flame className="w-4 h-4" />
          </div>
        </div>
        <div className="big-num text-warning">{metaDia}</div>
        <div className="text-[11px] text-white/60 leading-snug">
          Quanto precisa fechar hoje pra entrar no pace
        </div>
        {/* Placar Hoje vs Meta do dia */}
        <div className="mt-2 rounded-lg bg-panel2 p-2 flex items-center justify-between gap-2">
          <div className="text-[11px] text-white/60">
            Hoje: <span className="font-semibold text-white">{realHoje}</span>
          </div>
          {!semMeta && !empate && (
            <div
              className="chip"
              style={{ background: placarColor + "22", color: placarColor }}
            >
              <Arrow className="w-3 h-3" /> {vencendo ? `+${diff}` : `-${diff}`}
            </div>
          )}
          {empate && !semMeta && (
            <div className="chip" style={{ background: placarColor + "22", color: placarColor }}>
              No pace
            </div>
          )}
        </div>
        <div className="text-[11px] mt-1 font-semibold" style={{ color: placarColor }}>
          {placarLabel}
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  hint,
  icon,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="card card-hover">
      <div className="flex items-center justify-between">
        <div className="kpi-label">{label}</div>
        <div
          className="w-7 h-7 rounded-lg grid place-items-center"
          style={{ background: accent + "22", color: accent }}
        >
          {icon}
        </div>
      </div>
      <div className="text-xl font-bold mt-0.5" style={{ color: accent }}>
        {value}
      </div>
      {hint && <div className="text-[11px] text-white/50 mt-0.5">{hint}</div>}
    </div>
  );
}
