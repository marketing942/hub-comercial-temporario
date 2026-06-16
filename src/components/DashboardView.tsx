import type { DashboardSnapshot } from "@/lib/data";
import { BRL, fmtInt, fmtPct } from "@/lib/calc";
import { BU_COLOR, BU_LABEL, BU_THEME, COLOR, tonePctMeta } from "@/lib/brand";
import { isQtdPrimary } from "@/lib/products";
import BULogo from "@/components/BULogo";
import BigStatCard from "@/components/BigStatCard";
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
  Users,
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

  // Faturamento (Unicive / Colegio importam tambem)
  const pctFat = t.metaValor > 0 ? (t.valor / t.metaValor) * 100 : 0;
  const faltaFat = Math.max(0, t.metaValor - t.valor);
  const pctFatTone = tonePctMeta(pctFat, 0);

  // Meta do dia
  const metaDia = t.metaDia;
  const realHoje = t.realizadoHoje;
  const faltaHoje = Math.max(0, metaDia - realHoje);
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

  const totalVendas = sellers.reduce((a, b) => a + b.vendasCount, 0);
  const leadsMeta = t.leadsMeta;
  const leadsPct = leadsMeta > 0 ? (leadsTotal / leadsMeta) * 100 : 0;
  const leadsTone = leadsMeta > 0 ? (leadsTotal >= leadsMeta ? COLOR.ok : COLOR.danger) : COLOR.neutral;

  // Cores semanticas para Ticket e Conversao (X real / Y meta)
  const ticketTone =
    t.ticketMeta > 0
      ? t.ticketReal >= t.ticketMeta
        ? COLOR.ok
        : COLOR.danger
      : COLOR.neutral;
  const convMetaBU = t.taxaConversaoMeta;
  const convTone =
    convMetaBU > 0
      ? taxaConversao >= convMetaBU
        ? COLOR.ok
        : COLOR.danger
      : COLOR.neutral;

  return (
    <div
      className="space-y-4 rounded-2xl p-4 -m-1 relative overflow-hidden"
      style={{ backgroundImage: theme.bg }}
    >
      {/* Header da BU */}
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

      {/* 4 KPIs grandes (sem legenda em baixo). Total Vendido / Matriculas
          / Faturamento (Unicive) tem BARRA de progresso embutida. */}
      <section className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {isQtd ? (
          <>
            <BigStatCard
              label="Matriculas"
              value={`${fmtInt.format(t.qtd)} / ${fmtInt.format(t.meta)}`}
              icon={<TrendingUp />}
              accent={COLOR.info}
              valueColor={COLOR.neutral}
              progressPct={pct}
              progressColor={pctTone}
              progressFooter={
                <span>
                  <span style={{ color: pctTone }}>{fmtPct(pct)}</span>
                  <span className="text-white/40"> · {pct >= 100 ? "Meta batida" : `Faltam ${fmtInt.format(falta)}`}</span>
                </span>
              }
            />
            <BigStatCard
              label="Faturamento"
              value={`${BRL.format(t.valor)} / ${BRL.format(t.metaValor)}`}
              icon={<Wallet />}
              accent={COLOR.info}
              valueColor={COLOR.neutral}
              progressPct={pctFat}
              progressColor={pctFatTone}
              progressFooter={
                <span>
                  <span style={{ color: pctFatTone }}>{fmtPct(pctFat)}</span>
                  <span className="text-white/40"> · {pctFat >= 100 ? "Meta de R$ batida" : `Faltam ${BRL.format(faltaFat)}`}</span>
                </span>
              }
            />
            <BigStatCard
              label="% da Meta"
              value={fmtPct(pct)}
              icon={<TrendingUp />}
              accent={pctTone}
              valueColor={pctTone}
            />
            <MetaDoDiaCard
              isQtd={isQtd}
              metaDia={fmtMeta(metaDia)}
              realHoje={fmtMeta(realHoje)}
              falta={fmtMeta(faltaHoje)}
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
              icon={<Wallet />}
              accent={COLOR.info}
              valueColor={COLOR.neutral}
              progressPct={pct}
              progressColor={pctTone}
              progressFooter={
                <span>
                  <span style={{ color: pctTone }}>{fmtPct(pct)}</span>
                  <span className="text-white/40"> · {pct >= 100 ? "Meta batida" : `Faltam ${BRL.format(falta)}`}</span>
                </span>
              }
            />
            <BigStatCard
              label="Meta do Mes"
              value={BRL.format(t.meta)}
              icon={<Target />}
              accent={COLOR.info}
              valueColor={COLOR.neutral}
            />
            <BigStatCard
              label="% da Meta"
              value={fmtPct(pct)}
              icon={<TrendingUp />}
              accent={pctTone}
              valueColor={pctTone}
            />
            <MetaDoDiaCard
              isQtd={isQtd}
              metaDia={fmtMeta(metaDia)}
              realHoje={fmtMeta(realHoje)}
              falta={fmtMeta(faltaHoje)}
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

      {/* Linha 2: Ticket, Conversao, Leads, Meta da Semana */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <CompareStatCard
          label="Ticket Medio"
          icon={<Wallet className="w-4 h-4" />}
          real={BRL.format(t.ticketReal)}
          meta={t.ticketMeta > 0 ? BRL.format(t.ticketMeta) : "—"}
          tone={ticketTone}
        />
        <CompareStatCard
          label="Conversao"
          icon={<Target className="w-4 h-4" />}
          real={fmtPct(taxaConversao)}
          meta={convMetaBU > 0 ? fmtPct(convMetaBU) : "—"}
          subtitle={`${totalVendas} vendas / ${fmtInt.format(leadsTotal)} leads`}
          tone={convTone}
        />
        <CompareStatCard
          label="Leads no Mes"
          icon={<Users className="w-4 h-4" />}
          real={fmtInt.format(leadsTotal)}
          meta={leadsMeta > 0 ? fmtInt.format(leadsMeta) : "—"}
          tone={leadsTone}
          subtitle={leadsMeta > 0 ? fmtPct(leadsPct) + " da meta" : undefined}
        />
        <MetaDaSemanaCard
          isQtd={isQtd}
          fmtMeta={fmtMeta}
          weekActive={t.weekActive}
          weekStartDay={t.weekStartDay}
          weekEndDay={t.weekEndDay}
          weekTarget={t.weekTarget}
          weekReal={t.weekReal}
          weekRemaining={t.weekRemaining}
        />
      </section>

      {/* Receita por categoria + card lateral por BU */}
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

      {/* Charts no fim: 3 charts em grid */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        <div className="card-lg">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-sm font-semibold">Evolucao Diaria - Vendas</div>
              <div className="text-xs text-white/50">
                {isQtd ? "Matriculas por dia" : "Faturamento por dia"}
              </div>
            </div>
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
              <div className="text-sm font-semibold">Evolucao Diaria - Leads</div>
              <div className="text-xs text-white/50">Leads recebidos por dia</div>
            </div>
          </div>
          <DailySalesChart data={series.daily} color={COLOR.info} field="leads" unit="int" />
        </div>
        <div className="card-lg">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-sm font-semibold">% da Meta Acumulada</div>
              <div className="text-xs text-white/50">Linha tracejada = ritmo ideal</div>
            </div>
          </div>
          <CumulativeGoalChart data={series.cumulative} color={pctTone} />
        </div>
      </section>
    </div>
  );
}

function CompareStatCard({
  label,
  icon,
  real,
  meta,
  tone,
  subtitle,
}: {
  label: string;
  icon?: React.ReactNode;
  real: string;
  meta: string;
  tone: string;
  subtitle?: string;
}) {
  return (
    <div className="card-lg">
      <div className="flex items-center justify-between">
        <div className="kpi-label">{label}</div>
        <div
          className="w-9 h-9 rounded-lg grid place-items-center"
          style={{ background: tone + "22", color: tone }}
        >
          {icon}
        </div>
      </div>
      <div className="mt-2 flex items-baseline gap-2 flex-wrap">
        <span className="big-num" style={{ color: tone }}>
          {real}
        </span>
        <span className="text-white/30 text-2xl xl:text-3xl font-bold">/</span>
        <span className="text-2xl xl:text-3xl font-bold text-white/40">{meta}</span>
      </div>
      <div className="text-[11px] text-white/40 mt-1 uppercase tracking-wider">
        real / meta{subtitle ? ` · ${subtitle}` : ""}
      </div>
    </div>
  );
}

function MetaDoDiaCard({
  isQtd,
  metaDia,
  realHoje,
  falta,
  diff,
  placarLabel,
  placarColor,
  vencendo,
  empate,
  semMeta,
}: {
  isQtd: boolean;
  metaDia: string;
  realHoje: string;
  falta: string;
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
      <div className="relative flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="kpi-label">Meta do Dia</div>
          <div
            className="w-9 h-9 rounded-lg grid place-items-center"
            style={{ background: placarColor + "22", color: placarColor }}
          >
            <Flame className="w-4 h-4" />
          </div>
        </div>
        <div className="big-num" style={{ color: COLOR.warning }}>
          {metaDia}
        </div>
        {/* 3 quadrinhos internos: Meta, Hoje, Falta */}
        <div className="grid grid-cols-3 gap-1.5 mt-1">
          <Mini label="Meta" value={metaDia} tone={COLOR.warning} />
          <Mini label="Hoje" value={realHoje} tone={vencendo ? COLOR.ok : COLOR.neutral} />
          <Mini
            label="Falta"
            value={vencendo || empate || semMeta ? (isQtd ? "0" : "R$ 0,00") : falta}
            tone={vencendo || empate || semMeta ? COLOR.ok : COLOR.danger}
          />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[11px] font-semibold" style={{ color: placarColor }}>
            {placarLabel}
          </span>
          {!semMeta && !empate && (
            <span
              className="chip"
              style={{ background: placarColor + "22", color: placarColor }}
            >
              <Arrow className="w-3 h-3" />
              {vencendo ? `+${diff}` : `-${diff}`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function Mini({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-lg bg-panel2 p-2 text-center">
      <div className="text-[9px] uppercase tracking-wider text-white/40">{label}</div>
      <div className="text-base font-bold leading-tight mt-0.5" style={{ color: tone }}>
        {value}
      </div>
    </div>
  );
}

function MetaDaSemanaCard({
  isQtd,
  fmtMeta,
  weekActive,
  weekStartDay,
  weekEndDay,
  weekTarget,
  weekReal,
  weekRemaining,
}: {
  isQtd: boolean;
  fmtMeta: (n: number) => string;
  weekActive: boolean;
  weekStartDay: number;
  weekEndDay: number;
  weekTarget: number;
  weekReal: number;
  weekRemaining: number;
}) {
  if (!weekActive || weekTarget <= 0) {
    return (
      <div className="card-lg">
        <div className="flex items-center justify-between">
          <div className="kpi-label">Meta da Semana</div>
          <div
            className="w-9 h-9 rounded-lg grid place-items-center"
            style={{ background: COLOR.mute + "22", color: COLOR.mute }}
          >
            <Flame className="w-4 h-4" />
          </div>
        </div>
        <div className="big-num text-white/40">—</div>
        <div className="text-[11px] text-white/40 mt-1 uppercase tracking-wider">
          {!weekActive ? "Disponivel no mes atual" : "Sem meta definida"}
        </div>
      </div>
    );
  }

  const pct = weekTarget > 0 ? (weekReal / weekTarget) * 100 : 0;
  const batida = weekReal >= weekTarget;
  const tone = batida ? COLOR.ok : COLOR.warning;
  const label = batida
    ? "Semana fechada"
    : `Fechar ate domingo (${String(weekEndDay).padStart(2, "0")})`;

  return (
    <div className="card-lg relative overflow-hidden">
      <div
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-25 blur-3xl pointer-events-none"
        style={{ background: tone }}
      />
      <div className="relative flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="kpi-label">Meta da Semana</div>
          <div
            className="w-9 h-9 rounded-lg grid place-items-center"
            style={{ background: tone + "22", color: tone }}
          >
            <Flame className="w-4 h-4" />
          </div>
        </div>
        <div className="big-num" style={{ color: tone }}>
          {fmtMeta(weekRemaining)}
        </div>
        <div className="text-[10px] text-white/40 -mt-1 uppercase tracking-wider">
          Falta na semana ({String(weekStartDay).padStart(2, "0")} a{" "}
          {String(weekEndDay).padStart(2, "0")})
        </div>
        <div className="grid grid-cols-3 gap-1.5 mt-1">
          <Mini label="Semana" value={fmtMeta(weekTarget)} tone={COLOR.warning} />
          <Mini label="Feito" value={fmtMeta(weekReal)} tone={batida ? COLOR.ok : COLOR.neutral} />
          <Mini
            label="Falta"
            value={batida ? (isQtd ? "0" : "R$ 0,00") : fmtMeta(weekRemaining)}
            tone={batida ? COLOR.ok : COLOR.danger}
          />
        </div>
        <div className="text-[11px] font-semibold mt-1" style={{ color: tone }}>
          {label}
        </div>
      </div>
    </div>
  );
}
