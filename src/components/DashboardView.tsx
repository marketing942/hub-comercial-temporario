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

  const statusBar =
    pct >= 100
      ? "Meta atingida! Missao cumprida."
      : t.gap > 0
      ? `Atraso de ${fmtMeta(t.gap)} no ritmo ideal.`
      : "No ritmo ou adiantado, segue forte!";

  const metaDiaSub =
    pct >= 100
      ? "Meta batida — o que vier hoje e bonus."
      : t.gap > 0
      ? `Atrasado em ${fmtMeta(t.gap)}. Pra voltar ao ritmo, feche pelo menos esse valor hoje.`
      : t.gap < -0.0001
      ? `Adiantado em ${fmtMeta(-t.gap)}. Mantenha o ritmo.`
      : "No ritmo ideal — bote pra dentro!";

  return (
    <div className="space-y-6">
      {/* Header da BU */}
      <div className="flex items-center gap-4">
        <div
          className="w-16 h-16 rounded-2xl bg-panel2 grid place-items-center p-2"
          style={{ boxShadow: `0 0 0 2px ${color}33 inset` }}
        >
          <Image src={logo} alt={BU_LABEL[bu]} width={56} height={56} className="object-contain" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-white/50">
            {monthName} - dia {day}/{totalDays} - faltam {daysLeft} dia{daysLeft > 1 ? "s" : ""}
          </div>
          <h2 className="text-3xl xl:text-4xl font-bold mt-1">Dashboard {BU_LABEL[bu]}</h2>
        </div>
      </div>

      {/* 4 KPIs grandes */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <BigStatCard
          label={isUni ? "Matriculas (Real)" : "Total Vendido"}
          value={isUni ? fmtInt.format(t.qtd) : BRL.format(t.valor)}
          hint="Resultado acumulado"
          icon={isUni ? <TrendingUp /> : <Wallet />}
          accent={color}
          valueColor={color}
        />
        <BigStatCard
          label={isUni ? "Meta de Matriculas" : "Meta do Mes"}
          value={fmtMeta(t.meta)}
          hint={`Missao de ${monthName}`}
          icon={<Target />}
          accent="#facc15"
          valueColor="#facc15"
        />
        <BigStatCard
          label="% da Meta"
          value={fmtPct(pct)}
          hint={pct >= 100 ? "Meta batida!" : `Faltam ${fmtMeta(falta)}`}
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
      </section>

      {/* Barra de progresso */}
      <section className="card-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Target className="w-4 h-4 text-accent" /> Meta em Andamento
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 text-accent text-xs font-semibold">
            <Zap className="w-3.5 h-3.5" /> {fmtPct(pct)}
          </div>
        </div>
        <ProgressBar value={pct} color={color} height={16} />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-3 gap-2 text-sm">
          <div>
            <div className="kpi-label">Realizado</div>
            <div className="text-2xl font-bold">{fmtMeta(realizado)}</div>
          </div>
          <div className="text-center text-white/60 text-xs flex-1 px-2">{statusBar}</div>
          <div className="text-right">
            <div className="kpi-label">Meta</div>
            <div className="text-2xl font-bold text-warning">{fmtMeta(t.meta)}</div>
          </div>
        </div>
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="card-lg">
          <div className="flex items-center justify-between mb-3">
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
          <div className="flex items-center justify-between mb-3">
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

      {/* Receita por categoria + mini KPIs */}
      <section className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <div className="xl:col-span-2 grid grid-cols-2 gap-3 content-start">
          <MiniStat
            label="Ticket Medio"
            value={BRL.format(t.ticketReal)}
            hint={`Meta ${BRL.format(t.ticketMeta)}`}
            icon={<Wallet className="w-4 h-4" />}
            accent="#06b6d4"
          />
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
        </div>

        <div className="xl:col-span-3">
          <ProductRevenueBreakdown rows={breakdown} color={color} isUnicive={isUni} />
        </div>
      </section>

      {/* Turmas presenciais — apenas CPPEM */}
      {!isUni && <TurmasBreakdown rows={breakdown} />}
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
      <div className="text-2xl font-bold mt-1" style={{ color: accent }}>
        {value}
      </div>
      {hint && <div className="text-[11px] text-white/50 mt-0.5">{hint}</div>}
    </div>
  );
}
