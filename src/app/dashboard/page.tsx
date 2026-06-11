import Image from "next/image";
import Link from "next/link";
import { dashboardSnapshot, daysInMonth, daysRemainingIncludingToday, periodNow, todayDayOfMonth } from "@/lib/data";
import { BRL, fmtInt, fmtPct } from "@/lib/calc";
import { getDailyQuote } from "@/lib/quotes";
import { BU_COLOR, BU_LABEL, LOGO_CPPEM, LOGO_UNICIVE } from "@/lib/brand";
import BigStatCard from "@/components/BigStatCard";
import ProgressBar from "@/components/ProgressBar";
import DashboardControls from "@/components/DashboardControls";
import DailySalesChart from "@/components/charts/DailySalesChart";
import CumulativeGoalChart from "@/components/charts/CumulativeGoalChart";
import {
  Crown,
  Flame,
  Target,
  TrendingUp,
  Wallet,
  Zap,
  Sparkles,
  Calendar,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Dashboard({
  searchParams,
}: {
  searchParams: { bu?: string };
}) {
  const bu = searchParams.bu === "unicive" ? "unicive" : "cppem";
  const snap = await dashboardSnapshot(bu);
  const quote = await getDailyQuote();
  const { year, month } = periodNow();
  const totalDays = daysInMonth(year, month);
  const day = todayDayOfMonth(year, month);
  const daysLeft = daysRemainingIncludingToday(year, month);

  const isUni = bu === "unicive";
  const color = BU_COLOR[bu];
  const logo = bu === "cppem" ? LOGO_CPPEM : LOGO_UNICIVE;

  const { totals, daily, cumulative } = snap.series;
  const pct = totals.meta > 0 ? ((isUni ? totals.qtd : totals.valor) / totals.meta) * 100 : 0;
  const realizado = isUni ? totals.qtd : totals.valor;
  const falta = Math.max(0, totals.meta - realizado);
  const fmtMeta = (n: number) => (isUni ? fmtInt.format(Math.round(n)) : BRL.format(n));

  const todayLabel = `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}`;
  const hojeBucket = daily.find((d) => d.day === todayLabel);
  const realizadoHoje = isUni ? hojeBucket?.qtd || 0 : hojeBucket?.valor || 0;

  const ranking = [...snap.sellers].sort((a, b) => b.pctSucesso - a.pctSucesso);
  const monthName = new Date(year, month - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const metaDia = falta / daysLeft;
  const status = pct >= 100 ? "Meta atingida! Missao cumprida." : pct >= 80 ? "Quase la, foco e fechamento!" : "Bora ritmar o jogo.";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl bg-panel2 grid place-items-center p-2"
            style={{ boxShadow: `0 0 0 2px ${color}33 inset` }}
          >
            <Image src={logo} alt={BU_LABEL[bu]} width={56} height={56} className="object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/50">
              <Calendar className="w-3.5 h-3.5" /> {monthName} - dia {day}/{totalDays} - faltam {daysLeft} dia{daysLeft > 1 ? "s" : ""}
            </div>
            <h1 className="text-3xl xl:text-4xl font-bold mt-1">
              Dashboard {BU_LABEL[bu]}
            </h1>
            <div className="text-sm text-white/60 mt-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" /> "{quote.text}"
              {quote.author && <span className="text-white/40">- {quote.author}</span>}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <BUTabs current={bu} />
          <DashboardControls />
        </div>
      </div>

      {/* KPIs grandes */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <BigStatCard
          label={isUni ? "Matriculas (Real)" : "Total Vendido"}
          value={isUni ? fmtInt.format(totals.qtd) : BRL.format(totals.valor)}
          hint="Resultado acumulado"
          icon={isUni ? <TrendingUp /> : <Wallet />}
          accent={color}
          valueColor={color}
        />
        <BigStatCard
          label={isUni ? "Meta de Matriculas" : "Meta do Mes"}
          value={fmtMeta(totals.meta)}
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
          label="Ticket Medio"
          value={BRL.format(totals.ticketReal)}
          hint={`Meta: ${BRL.format(totals.ticketMeta)} - ${snap.sellers.reduce((a, b) => a + b.vendasCount, 0)} vendas`}
          icon={<Wallet />}
          accent="#06b6d4"
          valueColor="#7dd3fc"
        />
      </section>

      {/* Progresso da meta */}
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
          <div className="text-center text-white/60 text-xs flex-1">{status}</div>
          <div className="text-right">
            <div className="kpi-label">Meta</div>
            <div className="text-2xl font-bold text-warning">{fmtMeta(totals.meta)}</div>
          </div>
        </div>
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="card-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-semibold">Evolucao Diaria de Vendas</div>
              <div className="text-xs text-white/50">Faturamento (ou matriculas) por dia</div>
            </div>
            <div className="text-xs px-3 py-1 rounded-full bg-panel2 text-white/70">
              {monthName}
            </div>
          </div>
          <DailySalesChart
            data={daily}
            color={color}
            field={isUni ? "qtd" : "valor"}
            unit={isUni ? "int" : "currency"}
          />
        </div>
        <div className="card-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-semibold">% da Meta Acumulada</div>
              <div className="text-xs text-white/50">Linha pontilhada = ritmo ideal</div>
            </div>
            <div className="text-xs px-3 py-1 rounded-full bg-panel2 text-white/70">
              dia {day}/{totalDays}
            </div>
          </div>
          <CumulativeGoalChart data={cumulative} color={color} />
        </div>
      </section>

      {/* Linha de baixo: Meta do dia + Ranking + Conversao */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card-lg">
          <div className="flex items-center gap-2 text-sm font-semibold mb-3">
            <Flame className="w-4 h-4 text-warning" /> Meta do Dia
          </div>
          <div className="big-num" style={{ color }}>
            {fmtMeta(metaDia)}
          </div>
          <div className="text-xs text-white/50 mt-2">
            Para bater a meta no ritmo, hoje precisa fechar pelo menos {fmtMeta(metaDia)}.
          </div>
          <div className="mt-4 p-3 rounded-xl bg-panel2 flex items-center justify-between">
            <span className="text-xs text-white/60">Realizado hoje</span>
            <span className="text-base font-semibold">{fmtMeta(realizadoHoje)}</span>
          </div>
        </div>

        <div className="card-lg xl:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold flex items-center gap-2">
              <Crown className="w-4 h-4" style={{ color }} /> Ranking {BU_LABEL[bu]}
            </div>
            <div className="text-xs text-white/40">
              Leads: {fmtInt.format(snap.leadsTotal)} - Conversao: {fmtPct(snap.taxaConversao)}
            </div>
          </div>
          {ranking.length === 0 ? (
            <div className="text-sm text-white/50">Nenhum vendedor nesta BU ainda.</div>
          ) : (
            <ol className="space-y-2">
              {ranking.map((r, i) => (
                <li
                  key={r.sellerId}
                  className="flex items-center gap-3 p-3 rounded-xl bg-panel2/60 hover:bg-panel2 transition"
                >
                  <div
                    className="w-9 h-9 grid place-items-center rounded-xl text-sm font-bold"
                    style={{
                      background: i === 0 ? "#facc1522" : "#1f3a2a",
                      color: i === 0 ? "#facc15" : "#fff",
                    }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{r.sellerName}</div>
                    <ProgressBar value={r.pctSucesso} color={color} height={6} />
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold">{fmtPct(r.pctSucesso)}</div>
                    <div className="text-[11px] text-white/50">
                      {isUni ? fmtInt.format(r.realizado) : BRL.format(r.realizado)}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      <div className="text-center text-[11px] text-white/30">
        O dashboard atualiza sozinho a cada 1 minuto. Aperte tela cheia para projetar na TV.
      </div>
    </div>
  );
}

function BUTabs({ current }: { current: "cppem" | "unicive" }) {
  const tabs: { id: "cppem" | "unicive"; label: string }[] = [
    { id: "cppem", label: "CPPEM" },
    { id: "unicive", label: "UNICIVE" },
  ];
  return (
    <div className="inline-flex p-1 rounded-xl bg-panel border border-border">
      {tabs.map((t) => (
        <Link
          key={t.id}
          href={`/dashboard?bu=${t.id}`}
          scroll={false}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
            current === t.id
              ? "bg-accent text-black"
              : "text-white/60 hover:text-white"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
