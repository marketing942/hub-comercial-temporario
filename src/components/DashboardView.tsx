import type { DashboardSnapshot } from "@/lib/data";
import { BRL, fmtInt, fmtPct } from "@/lib/calc";
import { BU_COLOR, BU_LABEL, COLOR, tonePctMeta } from "@/lib/brand";
import { isQtdPrimary } from "@/lib/products";
import BULogo from "@/components/BULogo";
import BigStatCard from "@/components/BigStatCard";
import ProgressBar from "@/components/ProgressBar";
import DailySalesChart from "@/components/charts/DailySalesChart";
import CumulativeGoalChart from "@/components/charts/CumulativeGoalChart";
import ProductRevenueBreakdown from "@/components/ProductRevenueBreakdown";
import ColegioTurmasBreakdown from "@/components/ColegioTurmasBreakdown";
import TurmasBreakdown from "@/components/TurmasBreakdown";
import {
  Flame,
  Target,
  TrendingUp,
  Wallet,
  Zap,
  Users,
  Trophy,
} from "lucide-react";

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
  const t = series.totals;

  const realizado = t.realizado;
  const pct = t.meta > 0 ? (realizado / t.meta) * 100 : 0;
  const falta = Math.max(0, t.meta - realizado);
  const fmtMeta = (n: number) => (isQtd ? fmtInt.format(Math.round(n)) : BRL.format(n));
  const pctTone = tonePctMeta(pct, t.gap);

  // Faturamento (Unicive e Colegio cuidam disso com importancia)
  const pctFat = t.metaValor > 0 ? (t.valor / t.metaValor) * 100 : 0;
  const faltaFat = Math.max(0, t.metaValor - t.valor);
  const pctFatTone = tonePctMeta(pctFat, 0);

  const statusBar =
    pct >= 100
      ? "Meta atingida! Missao cumprida."
      : t.gap > 0
      ? `Atrasado em ${fmtMeta(t.gap)} no ritmo ideal.`
      : "No ritmo ou adiantado, segue forte!";

  const metaDiaSub =
    pct >= 100
      ? "Meta batida — o que vier hoje e bonus."
      : t.gap > 0
      ? `Pra voltar ao ritmo, feche esse valor hoje.`
      : t.gap < -0.0001
      ? `Adiantado em ${fmtMeta(-t.gap)}.`
      : "No ritmo ideal.";

  // Categoria de turmas relevante por BU
  const showTurmasCppem = bu === "cppem";
  const showTurmasColegio = bu === "colegio_cppem";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BULogo bu={bu} size={48} />
        <div>
          <div className="text-[11px] uppercase tracking-wider text-white/50">
            {monthName} - dia {day}/{totalDays} - faltam {daysLeft} dia{daysLeft > 1 ? "s" : ""}
          </div>
          <h2 className="text-2xl xl:text-3xl font-bold mt-0.5">Dashboard {BU_LABEL[bu]}</h2>
        </div>
      </div>

      {/* 4 KPIs grandes (cores ESTRATEGICAS, nao da BU) */}
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
            <BigStatCard
              label="Meta do Dia"
              value={fmtInt.format(Math.round(t.metaDia))}
              hint={metaDiaSub}
              icon={<Flame />}
              accent={COLOR.warning}
              valueColor={COLOR.warning}
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
              hint={pct >= 100 ? "Meta batida!" : t.gap > 0 ? "Atrasado" : "No ritmo"}
              icon={<TrendingUp />}
              accent={pctTone}
              valueColor={pctTone}
            />
            <BigStatCard
              label="Meta do Dia"
              value={BRL.format(t.metaDia)}
              hint={metaDiaSub}
              icon={<Flame />}
              accent={COLOR.warning}
              valueColor={COLOR.warning}
            />
          </>
        )}
      </section>

      {/* Linha intermediaria de indicadores (sem repetir o de cima) */}
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

      {/* Meta em Andamento — barra + status (numeros ja estao acima) */}
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

      {/* Receita por categoria */}
      <ProductRevenueBreakdown rows={breakdown} color={color} />

      {/* Card de turmas — varia por BU */}
      {showTurmasCppem && <TurmasBreakdown rows={breakdown} />}
      {showTurmasColegio && <ColegioTurmasBreakdown rows={breakdown} />}

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
