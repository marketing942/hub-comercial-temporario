import Image from "next/image";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getSeller, statsForSeller, buSeries } from "@/lib/data";
import { BRL, fmtInt, fmtPct, periodNow } from "@/lib/calc";
import { getDailyQuote } from "@/lib/quotes";
import { BU_COLOR, BU_LABEL, LOGO_CPPEM, LOGO_UNICIVE } from "@/lib/brand";
import BigStatCard from "@/components/BigStatCard";
import ProgressBar from "@/components/ProgressBar";
import DailySalesChart from "@/components/charts/DailySalesChart";
import CumulativeGoalChart from "@/components/charts/CumulativeGoalChart";
import {
  Flame,
  Target,
  TrendingUp,
  Wallet,
  Users,
  Trophy,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MyPanel() {
  const s = await getSession();
  const seller = (await getSeller(s!.sellerId!))!;
  const stats = (await statsForSeller(seller.id))!;
  const quote = await getDailyQuote();

  const isUni = seller.bu === "unicive";
  const color = BU_COLOR[seller.bu];
  const logo = seller.bu === "cppem" ? LOGO_CPPEM : LOGO_UNICIVE;
  const fmtMeta = (n: number) => (isUni ? fmtInt.format(Math.round(n)) : BRL.format(n));

  // serie pessoal: buSeries filtra por BU; usamos pra dar contexto visual.
  // Vou montar serie do proprio vendedor inline a partir dos dados existentes.
  const { year, month } = periodNow();
  const buSeriesData = await buSeries(seller.bu, { year, month });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-lg flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl grid place-items-center font-bold text-2xl"
            style={{ background: seller.avatar_color }}
          >
            {seller.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Image src={logo} alt={BU_LABEL[seller.bu]} width={20} height={20} className="object-contain" />
              <span className="text-xs uppercase tracking-wider text-white/50">
                {BU_LABEL[seller.bu]}
              </span>
            </div>
            <div className="text-2xl xl:text-3xl font-bold mt-1">
              Ola, {seller.name.split(" ")[0]}!
            </div>
            <div className="text-sm text-white/60 mt-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" /> {quote.text}
            </div>
          </div>
        </div>
        <Link href="/seller/sales" className="btn-primary text-sm">
          <TrendingUp className="w-4 h-4" /> Lancar nova venda
        </Link>
      </div>

      {/* KPIs grandes */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <BigStatCard
          label={isUni ? "Minhas Matriculas" : "Total Vendido"}
          value={fmtMeta(stats.realizado)}
          hint="Resultado acumulado do mes"
          icon={<Wallet />}
          accent={color}
          valueColor={color}
        />
        <BigStatCard
          label="Minha Meta"
          value={fmtMeta(stats.metaTotal)}
          hint={isUni ? "Quantidade de matriculas" : "Faturamento alvo do mes"}
          icon={<Target />}
          accent="#facc15"
          valueColor="#facc15"
        />
        <BigStatCard
          label="% da Meta"
          value={fmtPct(stats.pctSucesso)}
          hint={stats.pctSucesso >= 100 ? "Voce bateu meta!" : `Faltam ${fmtMeta(stats.falta)}`}
          icon={<TrendingUp />}
          accent={stats.pctSucesso >= 100 ? "#22c55e" : color}
          valueColor={stats.pctSucesso >= 100 ? "#22c55e" : "#a3e635"}
        />
        <BigStatCard
          label="Ticket Medio"
          value={BRL.format(stats.ticketReal)}
          hint={`Meta: ${BRL.format(stats.ticketMeta)}`}
          icon={<Wallet />}
          accent="#06b6d4"
          valueColor="#7dd3fc"
        />
      </section>

      {/* Progresso */}
      <section className="card-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Target className="w-4 h-4 text-accent" /> Quanto falta pra minha meta
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 text-accent text-xs font-semibold">
            {fmtPct(stats.pctSucesso)}
          </div>
        </div>
        <ProgressBar value={stats.pctSucesso} color={color} height={16} />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-3 gap-2 text-sm">
          <div>
            <div className="kpi-label">Realizado</div>
            <div className="text-2xl font-bold">{fmtMeta(stats.realizado)}</div>
          </div>
          <div className="text-center text-white/60 text-xs flex-1">
            {stats.pctSucesso >= 100 ? "Meta atingida! Continue!" : `Hoje precisa fazer ${fmtMeta(stats.metaDia)} pra manter o ritmo.`}
          </div>
          <div className="text-right">
            <div className="kpi-label">Meta</div>
            <div className="text-2xl font-bold text-warning">{fmtMeta(stats.metaTotal)}</div>
          </div>
        </div>
      </section>

      {/* Demais KPIs */}
      <section className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <BigStatCard
          label="Meta do Dia"
          value={fmtMeta(stats.metaDia)}
          hint="Pra manter o ritmo da meta"
          icon={<Flame />}
          accent="#facc15"
          valueColor="#facc15"
        />
        <BigStatCard
          label="Realizado Hoje"
          value={fmtMeta(stats.realizadoHoje)}
          hint={`${stats.vendasCount} venda${stats.vendasCount === 1 ? "" : "s"} no mes`}
          icon={<Trophy />}
          accent="#22c55e"
          valueColor="#22c55e"
        />
        <BigStatCard
          label="Conversao - Real"
          value={fmtPct(stats.conversaoReal)}
          hint={`Meta: ${fmtPct(stats.conversaoMeta)}`}
          icon={<Target />}
          accent="#06b6d4"
          valueColor="#7dd3fc"
        />
        <BigStatCard
          label="Leads Recebidos"
          value={fmtInt.format(stats.leads)}
          hint="No mes (atualiza o admin)"
          icon={<Users />}
          accent="#a3e635"
          valueColor="#a3e635"
        />
      </section>

      {/* Charts da BU pra contextualizar */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="card-lg">
          <div className="text-sm font-semibold mb-1">
            Evolucao diaria - {BU_LABEL[seller.bu]}
          </div>
          <div className="text-xs text-white/50 mb-3">Como a sua BU esta performando no mes</div>
          <DailySalesChart
            data={buSeriesData.daily}
            color={color}
            field={isUni ? "qtd" : "valor"}
            unit={isUni ? "int" : "currency"}
          />
        </div>
        <div className="card-lg">
          <div className="text-sm font-semibold mb-1">% da meta acumulada - {BU_LABEL[seller.bu]}</div>
          <div className="text-xs text-white/50 mb-3">Linha tracejada = ritmo ideal</div>
          <CumulativeGoalChart data={buSeriesData.cumulative} color={color} />
        </div>
      </section>
    </div>
  );
}
