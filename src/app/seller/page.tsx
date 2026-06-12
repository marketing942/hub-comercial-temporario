import Image from "next/image";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getSeller, statsForSellerInBu, buSeries, buListOf } from "@/lib/data";
import { BRL, fmtInt, fmtPct, periodNow } from "@/lib/calc";
import { getDailyQuote } from "@/lib/quotes";
import { BU_COLOR, BU_LABEL, LOGO_CPPEM, LOGO_UNICIVE } from "@/lib/brand";
import StatCard from "@/components/StatCard";
import ProgressBar from "@/components/ProgressBar";
import DailySalesChart from "@/components/charts/DailySalesChart";
import AvatarUploader from "@/components/AvatarUploader";
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

export default async function MyPanel({
  searchParams,
}: {
  searchParams: { bu?: string };
}) {
  const s = await getSession();
  const seller = (await getSeller(s!.sellerId!))!;
  const quote = await getDailyQuote();

  const bus = buListOf(seller);
  const requested = searchParams.bu === "unicive" || searchParams.bu === "cppem" ? (searchParams.bu as "cppem" | "unicive") : null;
  const bu = requested && bus.includes(requested) ? requested : bus[0];

  const { year, month } = periodNow();
  const [stats, series] = await Promise.all([
    statsForSellerInBu(seller, bu, { year, month }),
    buSeries(bu, { year, month }),
  ]);
  const isUni = bu === "unicive";
  const color = BU_COLOR[bu];
  const logo = bu === "cppem" ? LOGO_CPPEM : LOGO_UNICIVE;
  const fmtMeta = (n: number) => (isUni ? fmtInt.format(Math.round(n)) : BRL.format(n));

  // Pra Unicive, faturamento tambem importa
  const pctFat = isUni && series.totals.metaValor > 0
    ? (series.totals.valor / series.totals.metaValor) * 100
    : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="card-lg flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <AvatarUploader name={seller.name} initialUrl={seller.avatar_url} color={color} />
          <div>
            <div className="flex items-center gap-2">
              <Image src={logo} alt={BU_LABEL[bu]} width={18} height={18} className="object-contain" />
              <span className="text-xs uppercase tracking-wider text-white/50">{BU_LABEL[bu]}</span>
            </div>
            <div className="text-xl xl:text-2xl font-bold mt-1">
              Ola, {seller.name.split(" ")[0]}!
            </div>
            <div className="text-xs text-white/60 mt-1 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-accent" /> {quote.text}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {bus.length > 1 && (
            <div className="inline-flex p-1 rounded-xl bg-panel border border-border">
              {bus.map((b) => (
                <Link
                  key={b}
                  href={`/seller?bu=${b}`}
                  scroll={false}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    b === bu
                      ? "bg-accent text-black"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {BU_LABEL[b]}
                </Link>
              ))}
            </div>
          )}
          <Link href="/seller/sales" className="btn-primary text-sm">
            <TrendingUp className="w-4 h-4" /> Lancar nova venda
          </Link>
        </div>
      </div>

      {/* 4 KPIs principais (StatCards menores que o BigStatCard do TV) */}
      <section className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {isUni ? (
          <>
            <StatCard
              label="Matriculas (Real / Meta)"
              value={`${fmtInt.format(stats.realizado)} / ${fmtInt.format(stats.metaTotal)}`}
              hint={`${fmtPct(stats.pctSucesso)} da meta`}
              icon={<TrendingUp className="w-4 h-4" />}
              accent={color}
            />
            <StatCard
              label="Faturamento (Real / Meta)"
              value={`${BRL.format(series.totals.valor)} / ${BRL.format(series.totals.metaValor)}`}
              hint={series.totals.metaValor > 0 ? `${fmtPct(pctFat)} da meta` : "Sem meta de faturamento"}
              icon={<Wallet className="w-4 h-4" />}
              accent="#facc15"
            />
            <StatCard
              label="Meta do Dia (matriculas)"
              value={fmtInt.format(Math.round(stats.metaDia))}
              hint={stats.gap > 0 ? `Atrasado em ${fmtInt.format(Math.round(stats.gap))}` : "No ritmo"}
              icon={<Flame className="w-4 h-4" />}
              accent="#f97316"
            />
            <StatCard
              label="Ticket Medio"
              value={BRL.format(stats.ticketReal)}
              hint={stats.ticketMeta > 0 ? `Meta ${BRL.format(stats.ticketMeta)}` : "Sem meta"}
              icon={<Wallet className="w-4 h-4" />}
              accent="#06b6d4"
            />
          </>
        ) : (
          <>
            <StatCard
              label="Total Vendido (Real / Meta)"
              value={`${BRL.format(stats.realizado)} / ${BRL.format(stats.metaTotal)}`}
              hint={`${fmtPct(stats.pctSucesso)} da meta`}
              icon={<Wallet className="w-4 h-4" />}
              accent={color}
            />
            <StatCard
              label="Meta do Dia"
              value={BRL.format(stats.metaDia)}
              hint={stats.gap > 0 ? `Atrasado em ${BRL.format(stats.gap)}` : "No ritmo"}
              icon={<Flame className="w-4 h-4" />}
              accent="#f97316"
            />
            <StatCard
              label="Ticket Medio"
              value={BRL.format(stats.ticketReal)}
              hint={stats.ticketMeta > 0 ? `Meta ${BRL.format(stats.ticketMeta)}` : "Sem meta"}
              icon={<Wallet className="w-4 h-4" />}
              accent="#06b6d4"
            />
            <StatCard
              label="Conversao"
              value={fmtPct(stats.conversaoReal)}
              hint={stats.conversaoMeta > 0 ? `Meta ${fmtPct(stats.conversaoMeta)}` : `${stats.vendasCount} vendas`}
              icon={<Target className="w-4 h-4" />}
              accent="#a3e635"
            />
          </>
        )}
      </section>

      {/* Barra de progresso (sem repetir numeros — eles ja estao nos cards) */}
      <section className="card">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold flex items-center gap-2">
            <Target className="w-4 h-4 text-accent" /> Quanto falta pra minha meta
          </div>
          <div className="text-xs font-semibold" style={{ color }}>
            {fmtPct(stats.pctSucesso)}
          </div>
        </div>
        <ProgressBar value={stats.pctSucesso} color={color} height={12} />
        <div className="text-center text-xs text-white/60 mt-2">
          {stats.pctSucesso >= 100
            ? "Meta atingida! Continue!"
            : `Hoje precisa fazer ${fmtMeta(stats.metaDia)} pra manter o ritmo.`}
        </div>
      </section>

      {/* Demais indicadores (sem repetir os que ja apareceram) */}
      <section className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard
          label="Realizado Hoje"
          value={fmtMeta(stats.realizadoHoje)}
          hint={`${stats.vendasCount} venda${stats.vendasCount === 1 ? "" : "s"} no mes`}
          icon={<Trophy className="w-4 h-4" />}
          accent="#22c55e"
        />
        {isUni ? (
          <StatCard
            label="Conversao"
            value={fmtPct(stats.conversaoReal)}
            hint={stats.conversaoMeta > 0 ? `Meta ${fmtPct(stats.conversaoMeta)}` : `${stats.vendasCount} vendas`}
            icon={<Target className="w-4 h-4" />}
            accent="#a3e635"
          />
        ) : (
          <StatCard
            label="% da Meta"
            value={fmtPct(stats.pctSucesso)}
            hint={stats.pctSucesso >= 100 ? "Batido!" : `Faltam ${BRL.format(stats.falta)}`}
            icon={<TrendingUp className="w-4 h-4" />}
            accent={stats.pctSucesso >= 100 ? "#22c55e" : "#a3e635"}
          />
        )}
        <StatCard
          label="Leads Recebidos"
          value={fmtInt.format(stats.leads)}
          hint="No mes (admin atualiza)"
          icon={<Users className="w-4 h-4" />}
          accent="#facc15"
        />
        {isUni && (
          <StatCard
            label="% da Faturamento"
            value={fmtPct(pctFat)}
            hint={series.totals.metaValor > 0 ? `Meta ${BRL.format(series.totals.metaValor)}` : "Sem meta"}
            icon={<Wallet className="w-4 h-4" />}
            accent="#facc15"
          />
        )}
      </section>

      {/* Contexto da BU - apenas o grafico mais util pro vendedor */}
      <div className="card">
        <div className="text-sm font-semibold mb-1">
          Evolucao diaria - {BU_LABEL[bu]}
        </div>
        <div className="text-xs text-white/50 mb-2">Como a sua BU esta performando no mes</div>
        <DailySalesChart
          data={series.daily}
          color={color}
          field={isUni ? "qtd" : "valor"}
          unit={isUni ? "int" : "currency"}
        />
      </div>
    </div>
  );
}
