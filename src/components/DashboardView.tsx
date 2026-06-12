import Image from "next/image";
import type { DashboardSnapshot } from "@/lib/data";
import { BRL, fmtInt, fmtPct } from "@/lib/calc";
import { BU_COLOR, BU_LABEL, LOGO_CPPEM, LOGO_UNICIVE } from "@/lib/brand";
import BigStatCard from "@/components/BigStatCard";
import ProgressBar from "@/components/ProgressBar";
import DailySalesChart from "@/components/charts/DailySalesChart";
import CumulativeGoalChart from "@/components/charts/CumulativeGoalChart";
import ProductRevenueBreakdown from "@/components/ProductRevenueBreakdown";
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
  const isUni = bu === "unicive";
  const color = BU_COLOR[bu];
  const logo = bu === "cppem" ? LOGO_CPPEM : LOGO_UNICIVE;
  const t = series.totals;

  const realizado = t.realizado;
  const pct = t.meta > 0 ? (realizado / t.meta) * 100 : 0;
  const falta = Math.max(0, t.meta - realizado);
  const fmtMeta = (n: number) => (isUni ? fmtInt.format(Math.round(n)) : BRL.format(n));

  // Faturamento (Unicive cuida disso com importancia)
  const pctFat = t.metaValor > 0 ? (t.valor / t.metaValor) * 100 : 0;
  const faltaFat = Math.max(0, t.metaValor - t.valor);

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
      ? `Atrasado em ${fmtMeta(t.gap)}. Pra voltar ao ritmo, feche esse valor hoje.`
      : t.gap < -0.0001
      ? `Adiantado em ${fmtMeta(-t.gap)}.`
      : "No ritmo ideal — bote pra dentro!";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-14 h-14 rounded-2xl bg-panel2 grid place-items-center p-1.5"
          style={{ boxShadow: `0 0 0 2px ${color}33 inset` }}
        >
          <Image src={logo} alt={BU_LABEL[bu]} width={48} height={48} className="object-contain" />
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-white/50">
            {monthName} - dia {day}/{totalDays} - faltam {daysLeft} dia{daysLeft > 1 ? "s" : ""}
          </div>
          <h2 className="text-2xl xl:text-3xl font-bold mt-0.5">Dashboard {BU_LABEL[bu]}</h2>
        </div>
      </div>

      {/* 4 KPIs grandes — Unicive mostra Matriculas + Faturamento com importancia igual */}
      <section className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {isUni ? (
          <>
            <BigStatCard
              label="Matriculas (Real / Meta)"
              value={`${fmtInt.format(t.qtd)} / ${fmtInt.format(t.meta)}`}
              hint={pct >= 100 ? "Meta batida!" : `Faltam ${fmtInt.format(falta)} - ${fmtPct(pct)} da meta`}
              icon={<TrendingUp />}
              accent={color}
              valueColor={color}
            />
            <BigStatCard
              label="Faturamento (Real / Meta)"
              value={`${BRL.format(t.valor)} / ${BRL.format(t.metaValor)}`}
              hint={pctFat >= 100 ? "Meta de R$ batida!" : `Faltam ${BRL.format(faltaFat)} - ${fmtPct(pctFat)} da meta`}
              icon={<Wallet />}
              accent="#facc15"
              valueColor="#facc15"
            />
            <BigStatCard
              label="Meta do Dia (matriculas)"
              value={fmtInt.format(Math.round(t.metaDia))}
              hint={metaDiaSub}
              icon={<Flame />}
              accent="#f97316"
              valueColor="#fb923c"
            />
            <BigStatCard
              label="Ticket Medio"
              value={BRL.format(t.ticketReal)}
              hint={t.ticketMeta > 0 ? `Meta ${BRL.format(t.ticketMeta)}` : "Sem meta de ticket"}
              icon={<Wallet />}
              accent="#06b6d4"
              valueColor="#7dd3fc"
            />
          </>
        ) : (
          <>
            <BigStatCard
              label="Total Vendido"
              value={BRL.format(t.valor)}
              hint="Resultado acumulado"
              icon={<Wallet />}
              accent={color}
              valueColor={color}
            />
            <BigStatCard
              label="Meta do Mes"
              value={fmtMeta(t.meta)}
              hint={pct >= 100 ? "Meta batida!" : `Faltam ${fmtMeta(falta)}`}
              icon={<Target />}
              accent="#facc15"
              valueColor="#facc15"
            />
            <BigStatCard
              label="% da Meta"
              value={fmtPct(pct)}
              hint={`${fmtPct(t.gap > 0 ? -100 + pct : pct)} - Ritmo`}
              icon={<TrendingUp />}
              accent={pct >= 100 ? "#22c55e" : color}
              valueColor={pct >= 100 ? "#22c55e" : "#a3e635"}
            />
            <BigStatCard
              label="Meta do Dia"
              value={fmtMeta(t.metaDia)}
              hint={metaDiaSub}
              icon={<Flame />}
              accent="#f97316"
              valueColor="#fb923c"
            />
          </>
        )}
      </section>

      {/* 4 mini stats (sem repetir o que ja esta nos KPIs grandes) */}
      <section className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {isUni ? (
          <MiniStat
            label="% da Meta (matriculas)"
            value={fmtPct(pct)}
            hint={pct >= 100 ? "Batido!" : `Faltam ${fmtInt.format(falta)}`}
            icon={<TrendingUp className="w-4 h-4" />}
            accent={pct >= 100 ? "#22c55e" : "#a3e635"}
          />
        ) : (
          <MiniStat
            label="Ticket Medio"
            value={BRL.format(t.ticketReal)}
            hint={t.ticketMeta > 0 ? `Meta ${BRL.format(t.ticketMeta)}` : "Sem meta"}
            icon={<Wallet className="w-4 h-4" />}
            accent="#06b6d4"
          />
        )}
        <MiniStat
          label="Conversao"
          value={fmtPct(taxaConversao)}
          hint={`${sellers.reduce((a, b) => a + b.vendasCount, 0)} vendas`}
          icon={<Target className="w-4 h-4" />}
          accent="#a3e635"
        />
        <MiniStat
          label="Leads no Mes"
          value={fmtInt.format(leadsTotal)}
          hint="Atualizados pelo admin"
          icon={<Users className="w-4 h-4" />}
          accent="#facc15"
        />
        <MiniStat
          label="Realizado Hoje"
          value={fmtMeta(t.realizadoHoje)}
          hint={`Dia ${day}/${totalDays}`}
          icon={<Trophy className="w-4 h-4" />}
          accent={color}
        />
      </section>

      {/* Meta em Andamento — somente barra + status (numeros ja estao acima) */}
      <section className="card-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Target className="w-4 h-4 text-accent" /> Meta em Andamento
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 text-accent text-xs font-semibold">
            <Zap className="w-3.5 h-3.5" /> {fmtPct(pct)}
          </div>
        </div>
        <ProgressBar value={pct} color={color} height={14} />
        <div className="text-center text-white/60 text-xs mt-2">{statusBar}</div>
      </section>

      {/* Receita por categoria */}
      <ProductRevenueBreakdown rows={breakdown} color={color} isUnicive={isUni} />

      {/* Alunos por turma presencial / eventos — CPPEM apenas */}
      {!isUni && <TurmasBreakdown rows={breakdown} />}

      {/* Charts no fim */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <div className="card-lg">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-sm font-semibold">Evolucao Diaria de Vendas</div>
              <div className="text-xs text-white/50">
                {isUni ? "Matriculas por dia" : "Faturamento por dia"}
              </div>
            </div>
            <div className="text-xs px-3 py-1 rounded-full bg-panel2 text-white/70">{monthName}</div>
          </div>
          <DailySalesChart
            data={series.daily}
            color={color}
            field={isUni ? "qtd" : "valor"}
            unit={isUni ? "int" : "currency"}
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
          <CumulativeGoalChart data={series.cumulative} color={color} />
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
