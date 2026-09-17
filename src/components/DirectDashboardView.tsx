import type { DirectSnapshot } from "@/lib/data";
import { BRL, fmtInt, fmtPct } from "@/lib/calc";
import { COLOR } from "@/lib/brand";
import BigStatCard from "@/components/BigStatCard";
import DailySalesChart from "@/components/charts/DailySalesChart";
import ProductRevenueBreakdown from "@/components/ProductRevenueBreakdown";
import { Wallet, Target, MousePointerClick, Globe, Bot } from "lucide-react";

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
  const hasUnicive = (t.valorUnicive || 0) > 0 || (snap.breakdownUnicive || []).some((r) => r.valor > 0);

  return (
    <div
      className="space-y-4 rounded-2xl p-4 -m-1 relative overflow-hidden"
      style={{
        backgroundImage:
          "radial-gradient(900px 320px at 15% 0%, rgba(6,182,212,0.16), transparent 60%), radial-gradient(700px 280px at 90% 8%, rgba(167,139,250,0.14), transparent 60%)",
      }}
    >
      {/* Header */}
      <div
        className="rounded-2xl p-4 flex items-center justify-between gap-4 border border-white/5"
        style={{
          backgroundImage:
            "linear-gradient(120deg, rgba(6,182,212,0.20), rgba(167,139,250,0.16), rgba(10,25,32,0.55))",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <div
              className="w-12 h-12 rounded-2xl grid place-items-center border-2 border-black"
              style={{ background: "rgba(6,182,212,0.20)", color: "#7dd3fc" }}
            >
              <Globe className="w-6 h-6" />
            </div>
            <div
              className="w-12 h-12 rounded-2xl grid place-items-center border-2 border-black"
              style={{ background: "rgba(167,139,250,0.20)", color: "#c4b5fd" }}
            >
              <Bot className="w-6 h-6" />
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-white/60">
              {monthName} - dia {day}/{totalDays} - faltam {daysLeft} dia{daysLeft > 1 ? "s" : ""}
            </div>
            <h2 className="text-2xl xl:text-3xl font-bold mt-0.5">
              Dashboard Direto / IA
            </h2>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <span className="chip" style={{ background: "#7dd3fc22", color: "#7dd3fc" }}>
            <Globe className="w-3 h-3" /> Site
          </span>
          <span className="chip" style={{ background: "#a78bfa22", color: "#a78bfa" }}>
            <Bot className="w-3 h-3" /> IA de atendimento
          </span>
        </div>
      </div>

      {/* KPIs grandes — combinado Direto + IA */}
      <section className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <BigStatCard
          label="Total Vendido (Direto + IA)"
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
          label="% Conversao (site)"
          value={fmtPct(t.conversao)}
          icon={<Target />}
          accent={COLOR.info}
          valueColor={COLOR.neutral}
        />
        <BigStatCard
          label="Visitas no Mes (site)"
          value={fmtInt.format(t.visits)}
          icon={<MousePointerClick />}
          accent={COLOR.info}
          valueColor={COLOR.neutral}
        />
      </section>

      {/* Split por canal e BU */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <div className="card-lg">
          <div className="kpi-label mb-2">Split por canal</div>
          <div className="grid grid-cols-2 gap-2">
            <SplitTile
              icon={<Globe className="w-4 h-4" />}
              label="Direto (site)"
              valor={t.valorDireto}
              qtd={t.qtdDireto}
              color="#7dd3fc"
            />
            <SplitTile
              icon={<Bot className="w-4 h-4" />}
              label="IA (atendimento)"
              valor={t.valorIA}
              qtd={t.qtdIA}
              color="#a78bfa"
            />
          </div>
        </div>
        <div className="card-lg">
          <div className="kpi-label mb-2">Split por BU</div>
          <div className="grid grid-cols-2 gap-2">
            <SplitTile
              label="CPPEM"
              valor={t.valorCppem}
              qtd={t.qtdCppem}
              color="#22c55e"
            />
            <SplitTile
              label="UNICIVE"
              valor={t.valorUnicive}
              qtd={t.qtdUnicive}
              color="#f59e0b"
            />
          </div>
        </div>
      </section>

      {/* Breakdown CPPEM (direto + IA CPPEM) */}
      <ProductRevenueBreakdown
        rows={snap.breakdown}
        color="#7dd3fc"
        excludeIds={CPPEM_TURMA_IDS}
      />

      {/* Breakdown UNICIVE — so aparece se ha venda IA em UNICIVE */}
      {hasUnicive && (
        <ProductRevenueBreakdown
          rows={snap.breakdownUnicive}
          color="#c4b5fd"
        />
      )}

      {/* Charts: vendas por dia + visitas por dia */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <div className="card-lg">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-sm font-semibold">Evolucao Diaria - Vendas</div>
              <div className="text-xs text-white/50">Faturamento total (direto + IA) por dia</div>
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

function SplitTile({
  icon,
  label,
  valor,
  qtd,
  color,
}: {
  icon?: React.ReactNode;
  label: string;
  valor: number;
  qtd: number;
  color: string;
}) {
  return (
    <div className="rounded-xl bg-panel2 p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/50">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-xl xl:text-2xl font-extrabold mt-0.5" style={{ color }}>
        {BRL.format(valor)}
      </div>
      <div className="text-[10px] text-white/40 mt-0.5">
        {fmtInt.format(qtd)} un.
      </div>
    </div>
  );
}

