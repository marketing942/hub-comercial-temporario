import type { SellerStats } from "@/lib/calc";
import { BRL, fmtInt, fmtPct } from "@/lib/calc";
import { BU_COLOR, BU_LABEL } from "@/lib/brand";
import ProgressBar from "@/components/ProgressBar";
import Avatar from "@/components/Avatar";
import {
  Crown,
  Flame,
  Rocket,
  Trophy,
  Clock,
  Users,
  Wallet,
  Target,
} from "lucide-react";

type Status = "batido" | "quase" | "andamento" | "atrasado";

function statusFor(pct: number, gap: number): Status {
  if (pct >= 100) return "batido";
  if (pct >= 80) return "quase";
  if (gap > 0) return "atrasado";
  return "andamento";
}

const STATUS_META: Record<
  Status,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  batido: {
    label: "BATEU A META",
    color: "#22c55e",
    bg: "rgba(34,197,94,0.18)",
    icon: <Trophy className="w-3.5 h-3.5" />,
  },
  quase: {
    label: "Quase la!",
    color: "#facc15",
    bg: "rgba(250,204,21,0.18)",
    icon: <Flame className="w-3.5 h-3.5" />,
  },
  andamento: {
    label: "Em andamento",
    color: "#06b6d4",
    bg: "rgba(6,182,212,0.18)",
    icon: <Rocket className="w-3.5 h-3.5" />,
  },
  atrasado: {
    label: "Recuperar ritmo",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.18)",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
};

export default function SellersGameView({
  stats,
  monthName,
  day,
  totalDays,
  daysLeft,
}: {
  stats: SellerStats[];
  monthName: string;
  day: number;
  totalDays: number;
  daysLeft: number;
}) {
  // Ranking pela METRICA PRIMARIA da BU:
  // CPPEM = faturamento (valor); UNICIVE = quantidade de matriculas.
  // Ja temos isso em `realizado`.
  const sortByReal = (a: SellerStats, b: SellerStats) => b.realizado - a.realizado;
  const cppemRanking = stats.filter((s) => s.bu === "cppem").sort(sortByReal);
  const uniRanking = stats.filter((s) => s.bu === "unicive").sort(sortByReal);

  const totalSellers = stats.length;
  const batidos = stats.filter((s) => s.pctSucesso >= 100);
  const pctBatidos = totalSellers > 0 ? (batidos.length / totalSellers) * 100 : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-accent/15 grid place-items-center text-accent">
          <Trophy className="w-6 h-6" />
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-white/50">
            {monthName} - dia {day}/{totalDays} - faltam {daysLeft} dia{daysLeft > 1 ? "s" : ""}
          </div>
          <h2 className="text-2xl xl:text-3xl font-bold mt-0.5">Quadro dos Vendedores</h2>
        </div>
      </div>

      {/* Hall da fama */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-lg col-span-1 sm:col-span-2 relative overflow-hidden">
          <div className="absolute inset-0 shimmer opacity-30 pointer-events-none" />
          <div className="relative flex items-center justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-accent">Hall da fama do mes</div>
              <div className="text-xl xl:text-2xl font-bold mt-1">
                {batidos.length} de {totalSellers} ja bateram a meta
              </div>
              <div className="text-xs text-white/60 mt-1">
                {batidos.length === 0
                  ? "Ninguem bateu ainda. Quem sera o primeiro?"
                  : batidos.map((b) => b.sellerName.split(" ")[0]).join(", ") + " — parabens!"}
              </div>
            </div>
            <div className="text-right">
              <div className="big-num" style={{ color: "#22c55e" }}>
                {fmtPct(pctBatidos)}
              </div>
              <div className="text-[11px] text-white/50">do time bateu</div>
            </div>
          </div>
        </div>

        <div className="card-lg">
          <div className="text-[11px] uppercase tracking-wider text-white/50 flex items-center gap-2">
            <Users className="w-3.5 h-3.5" /> Total no time
          </div>
          <div className="big-num" style={{ color: "#a3e635" }}>{totalSellers}</div>
          <div className="text-[11px] text-white/50 mt-1">
            CPPEM: {cppemRanking.length} - Unicive: {uniRanking.length}
          </div>
        </div>
      </section>

      {/* Dois podios lado a lado (ordenados por realizado) */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <BUPodium title="Top 3 CPPEM" ranking={cppemRanking} accent={BU_COLOR.cppem} />
        <BUPodium title="Top 3 UNICIVE" ranking={uniRanking} accent={BU_COLOR.unicive} />
      </section>

      <BUGroup title="CPPEM" sellers={cppemRanking} accent={BU_COLOR.cppem} />
      <BUGroup title="UNICIVE" sellers={uniRanking} accent={BU_COLOR.unicive} />
    </div>
  );
}

function BUGroup({
  title,
  sellers,
  accent,
}: {
  title: string;
  sellers: SellerStats[];
  accent: string;
}) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-3">
        <div
          className="px-3 py-1 rounded-full text-xs font-bold"
          style={{ background: accent + "22", color: accent }}
        >
          {title}
        </div>
        <div className="flex-1 h-px" style={{ background: accent + "33" }} />
        <div className="text-[11px] text-white/40">
          {sellers.length} vendedor{sellers.length === 1 ? "" : "es"}
        </div>
      </div>
      {sellers.length === 0 ? (
        <div className="card text-sm text-white/60">Nenhum vendedor ativo nesta BU.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {sellers.map((s, i) => (
            <SellerCard key={s.sellerId} s={s} pos={i + 1} buColor={accent} />
          ))}
        </div>
      )}
    </section>
  );
}

function SellerCard({
  s,
  pos,
  buColor,
}: {
  s: SellerStats;
  pos: number;
  buColor: string;
}) {
  const isUni = s.bu === "unicive";
  const fmtPrincipal = (n: number) =>
    isUni ? fmtInt.format(Math.round(n)) : BRL.format(n);
  const st = statusFor(s.pctSucesso, s.gap);
  const meta = STATUS_META[st];
  return (
    <div
      className="card card-hover relative overflow-hidden"
      style={{
        boxShadow:
          st === "batido"
            ? "0 0 0 1px rgba(34,197,94,0.4), 0 12px 40px -12px rgba(34,197,94,0.4)"
            : undefined,
      }}
    >
      {st === "batido" && (
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-success/30 blur-3xl pointer-events-none" />
      )}
      <div className="relative">
        <div className="flex items-center gap-3">
          <Avatar
            name={s.sellerName}
            url={s.avatarUrl}
            color={s.avatarColor || buColor}
            size={44}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-md font-bold"
                style={{ background: buColor + "22", color: buColor }}
              >
                #{pos}
              </span>
              <div className="text-sm font-semibold truncate">{s.sellerName}</div>
            </div>
            <div className="mt-1">
              <span className="chip" style={{ background: meta.bg, color: meta.color }}>
                {meta.icon} {meta.label}
              </span>
            </div>
          </div>
        </div>

        {/* % grande + total realizado */}
        <div className="flex items-end justify-between gap-2 mt-3">
          <div>
            <div className="text-3xl xl:text-4xl font-bold leading-none" style={{ color: meta.color }}>
              {fmtPct(s.pctSucesso)}
            </div>
            <div className="text-[11px] text-white/50 mt-0.5">da meta</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-white/40">
              {isUni ? "Matriculas" : "Faturamento"}
            </div>
            <div className="text-base font-semibold" style={{ color: buColor }}>
              {fmtPrincipal(s.realizado)}
            </div>
          </div>
        </div>

        <div className="mt-2">
          <ProgressBar value={s.pctSucesso} color={meta.color} height={7} />
        </div>

        {/* 3 mini stats: Ticket, Conversao, Leads */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <MiniStat
            label="Ticket"
            icon={<Wallet className="w-3 h-3" />}
            value={BRL.format(s.ticketReal)}
            sub={s.ticketMeta > 0 ? `meta ${BRL.format(s.ticketMeta)}` : "sem meta"}
          />
          <MiniStat
            label="Conversao"
            icon={<Target className="w-3 h-3" />}
            value={fmtPct(s.conversaoReal)}
            sub={s.conversaoMeta > 0 ? `meta ${fmtPct(s.conversaoMeta)}` : `${s.vendasCount} vendas`}
          />
          <MiniStat
            label="Leads"
            icon={<Users className="w-3 h-3" />}
            value={fmtInt.format(s.leads)}
            sub="no mes"
          />
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  icon,
  value,
  sub,
}: {
  label: string;
  icon?: React.ReactNode;
  value: React.ReactNode;
  sub?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-panel2 p-2">
      <div className="text-[10px] uppercase tracking-wider text-white/50 flex items-center gap-1">
        {icon} {label}
      </div>
      <div className="text-sm font-semibold mt-0.5">{value}</div>
      {sub && <div className="text-[10px] text-white/40 leading-tight">{sub}</div>}
    </div>
  );
}

function BUPodium({
  title,
  ranking,
  accent,
}: {
  title: string;
  ranking: SellerStats[];
  accent: string;
}) {
  const top3 = ranking.slice(0, 3);
  const order = [top3[1], top3[0], top3[2]].filter(Boolean);

  return (
    <div className="card-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold flex items-center gap-2" style={{ color: accent }}>
          <Crown className="w-4 h-4" /> {title}
        </div>
        <div className="text-[11px] text-white/40">{ranking.length} no time</div>
      </div>
      {order.length === 0 ? (
        <div className="text-sm text-white/50 py-6 text-center">Sem vendedores nesta BU ainda.</div>
      ) : (
        <div className="grid grid-cols-3 gap-3 items-end">
          {order.map((s) => {
            const pos = ranking.indexOf(s) + 1;
            const isFirst = pos === 1;
            const isUni = s.bu === "unicive";
            const label = isUni ? "matriculas" : "faturado";
            const valueStr = isUni ? fmtInt.format(s.realizado) : BRL.format(s.realizado);
            return (
              <div
                key={s.sellerId}
                className={`rounded-2xl text-center p-3 ${
                  isFirst ? "bg-warning/15 border border-warning/30" : "bg-panel2/60"
                }`}
                style={{ minHeight: isFirst ? 190 : 160 }}
              >
                <div className="flex items-center justify-center gap-1 text-[11px] font-bold mb-2">
                  <Crown
                    className="w-3.5 h-3.5"
                    style={{ color: isFirst ? "#facc15" : "#94a3b8" }}
                  />
                  {pos}o LUGAR
                </div>
                <div className="flex justify-center mb-2">
                  <Avatar
                    name={s.sellerName}
                    url={s.avatarUrl}
                    color={s.avatarColor || accent}
                    size={isFirst ? 56 : 44}
                  />
                </div>
                <div className="text-sm font-semibold truncate">{s.sellerName}</div>
                <div className="text-xl xl:text-2xl font-bold mt-1" style={{ color: accent }}>
                  {valueStr}
                </div>
                <div className="text-[11px] text-white/50">{label}</div>
                <div className="text-[11px] text-white/40 mt-0.5">{fmtPct(s.pctSucesso)} da meta</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
