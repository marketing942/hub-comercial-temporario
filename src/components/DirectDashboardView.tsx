import type { DirectSnapshot } from "@/lib/data";
import { BRL, fmtInt, fmtPct } from "@/lib/calc";
import { COLOR } from "@/lib/brand";
import BigStatCard from "@/components/BigStatCard";
import DailySalesChart from "@/components/charts/DailySalesChart";
import ProductRevenueBreakdown from "@/components/ProductRevenueBreakdown";
import { Wallet, Target, MousePointerClick, Trophy, Globe } from "lucide-react";

const CPPEM_TURMA_IDS = ["turma_pmal", "turma_pmpe", "turma_carreiras"];

export default function DirectDashboardView({
  snap,
  day,
  totalDays,
  daysLeft,
  monthName,
}: {
  snap: DirectSnapshot;
  day: number;
  totalDays: number;
  daysLeft: number;
  monthName: string;
}) {
  const t = snap.totals;

  return (
    <div
      className="space-y-4 rounded-2xl p-4 -m-1 relative overflow-hidden"
      style={{
        backgroundImage:
          "radial-gradient(900px 320px at 15% 0%, rgba(6,182,212,0.16), transparent 60%), radial-gradient(700px 280px at 90% 8%, rgba(125,211,252,0.10), transparent 60%)",
      }}
    >
      {/* Header */}
      <div
        className="rounded-2xl p-4 flex items-center justify-between gap-4 border border-white/5"
        style={{
          backgroundImage:
            "linear-gradient(120deg, rgba(6,182,212,0.20), rgba(10,25,32,0.55))",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-14 h-14 rounded-2xl grid place-items-center"
            style={{ background: "rgba(6,182,212,0.15)", color: "#7dd3fc" }}
          >
            <Globe className="w-7 h-7" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-white/60">
              {monthName} - dia {day}/{totalDays} - faltam {daysLeft} dia{daysLeft > 1 ? "s" : ""}
            </div>
            <h2 className="text-2xl xl:text-3xl font-bold mt-0.5">
              Dashboard Canal Direto
            </h2>
          </div>
        </div>
        <div
          className="hidden md:flex px-3 py-1 rounded-full text-xs font-semibold"
          style={{ background: "#7dd3fc22", color: "#7dd3fc" }}
        >
          Site / Direct Response
        </div>
      </div>

      {/* KPIs grandes — sem meta do direto, apenas resultados */}
      <section className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <BigStatCard
          label="Total Vendido (Direto)"
          value={BRL.format(t.valor)}
          icon={<Wallet />}
          accent={COLOR.info}
          valueColor={COLOR.neutral}
        />
        <BigStatCard
          label="Ticket Medio"
          value={BRL.format(t.ticketReal)}
          icon={<Wallet />}
          accent={COLOR.info}
          valueColor={COLOR.neutral}
        />
        <BigStatCard
          label="% Conversao"
          value={fmtPct(t.conversao)}
          icon={<Target />}
          accent={COLOR.info}
          valueColor={COLOR.neutral}
        />
        <BigStatCard
          label="Visitas no Mes"
          value={fmtInt.format(t.visits)}
          icon={<MousePointerClick />}
          accent={COLOR.info}
          valueColor={COLOR.neutral}
        />
      </section>

      {/* Linha secundaria (contexto do dia + qtd vendida) */}
      <section className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <MiniStat
          label="Qtd Vendida"
          value={fmtInt.format(t.qtd)}
          hint={`${fmtInt.format(t.vendasCount)} venda${t.vendasCount === 1 ? "" : "s"}`}
          icon={<Trophy className="w-4 h-4" />}
          accent={t.qtd > 0 ? COLOR.ok : COLOR.neutral}
        />
        <MiniStat
          label="Faturamento Hoje"
          value={BRL.format(t.valorHoje)}
          hint={`Dia ${day}/${totalDays}`}
          icon={<Wallet className="w-4 h-4" />}
          accent={t.valorHoje > 0 ? COLOR.ok : COLOR.neutral}
        />
        <MiniStat
          label="Visitas Hoje"
          value={fmtInt.format(t.visitsHoje)}
          hint="Preenchido pelo admin"
          icon={<MousePointerClick className="w-4 h-4" />}
          accent={t.visitsHoje > 0 ? COLOR.ok : COLOR.neutral}
        />
        <MiniStat
          label="Qtd Vendida Hoje"
          value={fmtInt.format(t.qtdHoje)}
          hint="Unidades no dia"
          icon={<Trophy className="w-4 h-4" />}
          accent={t.qtdHoje > 0 ? COLOR.ok : COLOR.neutral}
        />
      </section>

      {/* Receita por categoria (CPPEM linhas), excluindo turmas presenciais
          pra manter compacto — vendas de turma no direto sao raras */}
      <ProductRevenueBreakdown
        rows={snap.breakdown}
        color="#7dd3fc"
        excludeIds={CPPEM_TURMA_IDS}
      />

      {/* Charts: vendas por dia + visitas por dia */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <div className="card-lg">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-sm font-semibold">Evolucao Diaria - Vendas</div>
              <div className="text-xs text-white/50">Faturamento do direto por dia</div>
            </div>
          </div>
          <DailySalesChart
            data={snap.daily.map((d) => ({ day: d.day, valor: d.valor, qtd: d.qtd }))}
            color="#22c55e"
            field="valor"
            unit="currency"
          />
        </div>
        <div className="card-lg">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-sm font-semibold">Evolucao Diaria - Visitas</div>
              <div className="text-xs text-white/50">Visitas do site por dia</div>
            </div>
          </div>
          <DailySalesChart
            data={snap.daily.map((d) => ({ day: d.day, valor: 0, qtd: 0, leads: d.visits }))}
            color="#7dd3fc"
            field="leads"
            unit="int"
          />
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
