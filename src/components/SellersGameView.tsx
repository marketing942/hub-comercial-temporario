import type { SellerStats } from "@/lib/calc";
import { BRL, fmtInt, fmtPct } from "@/lib/calc";
import { BU_COLOR, BU_LABEL } from "@/lib/brand";
import ProgressBar from "@/components/ProgressBar";
import {
  Crown,
  Flame,
  Rocket,
  Sparkles,
  Trophy,
  CheckCircle2,
  Clock,
  Users,
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
  const ranking = [...stats].sort((a, b) => b.pctSucesso - a.pctSucesso);
  const totalSellers = ranking.length;
  const batidos = ranking.filter((s) => s.pctSucesso >= 100);
  const pctBatidos = totalSellers > 0 ? (batidos.length / totalSellers) * 100 : 0;
  const top3 = ranking.slice(0, 3);
  const podioOrder = [top3[1], top3[0], top3[2]].filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-accent/15 grid place-items-center text-accent">
          <Trophy className="w-8 h-8" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-white/50">
            {monthName} - dia {day}/{totalDays} - faltam {daysLeft} dia{daysLeft > 1 ? "s" : ""}
          </div>
          <h2 className="text-3xl xl:text-4xl font-bold mt-1">
            Quadro dos Vendedores
          </h2>
          <div className="text-sm text-white/60 mt-1">
            Quem ja bateu, quem ta voando e quem precisa correr ate o fim do mes.
          </div>
        </div>
      </div>

      {/* Banner Hall da Fama */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-lg col-span-1 sm:col-span-2 relative overflow-hidden">
          <div className="absolute inset-0 shimmer opacity-30 pointer-events-none" />
          <div className="relative flex items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-accent">Hall da fama do mes</div>
              <div className="text-2xl xl:text-3xl font-bold mt-1">
                {batidos.length} de {totalSellers} ja bateram a meta
              </div>
              <div className="text-sm text-white/60 mt-1">
                {batidos.length === 0
                  ? "Ninguem bateu ainda. Quem sera o primeiro?"
                  : batidos.map((b) => b.sellerName.split(" ")[0]).join(", ") + " — parabens!"}
              </div>
            </div>
            <div className="text-right">
              <div className="big-num" style={{ color: "#22c55e" }}>
                {fmtPct(pctBatidos)}
              </div>
              <div className="text-xs text-white/50">do time bateu</div>
            </div>
          </div>
        </div>

        <div className="card-lg">
          <div className="text-xs uppercase tracking-wider text-white/50 flex items-center gap-2">
            <Users className="w-3.5 h-3.5" /> Total no time
          </div>
          <div className="big-num" style={{ color: "#a3e635" }}>{totalSellers}</div>
          <div className="text-xs text-white/50 mt-1">
            CPPEM: {ranking.filter((r) => r.bu === "cppem").length} - Unicive:{" "}
            {ranking.filter((r) => r.bu === "unicive").length}
          </div>
        </div>
      </section>

      {/* Podio */}
      {podioOrder.length > 0 && (
        <section className="card-lg">
          <div className="text-sm font-semibold flex items-center gap-2 mb-4">
            <Crown className="w-4 h-4 text-warning" /> Top 3 do mes
          </div>
          <div className="grid grid-cols-3 gap-3 items-end">
            {podioOrder.map((s) => {
              const pos = ranking.indexOf(s) + 1;
              const isFirst = pos === 1;
              const isUni = s.bu === "unicive";
              return (
                <div
                  key={s.sellerId}
                  className={`rounded-2xl text-center p-4 ${
                    isFirst ? "bg-warning/15 border border-warning/30" : "bg-panel2/60"
                  }`}
                  style={{
                    minHeight: isFirst ? 220 : 170,
                  }}
                >
                  <div className="flex items-center justify-center gap-1 text-xs font-bold mb-2">
                    <Crown
                      className="w-3.5 h-3.5"
                      style={{ color: isFirst ? "#facc15" : "#94a3b8" }}
                    />
                    {pos}o LUGAR
                  </div>
                  <div className="text-sm font-semibold truncate">{s.sellerName}</div>
                  <div className="mt-1">
                    <span className={isUni ? "chip-unicive" : "chip-cppem"}>{BU_LABEL[s.bu]}</span>
                  </div>
                  <div className="text-3xl xl:text-4xl font-bold mt-3" style={{ color: BU_COLOR[s.bu] }}>
                    {fmtPct(s.pctSucesso)}
                  </div>
                  <div className="text-[11px] text-white/50">
                    {isUni ? fmtInt.format(s.realizado) : BRL.format(s.realizado)}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Cards de vendedores — visualizacao TV */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {ranking.length === 0 && (
          <div className="card text-sm text-white/60 col-span-full">
            Nenhum vendedor ativo cadastrado.
          </div>
        )}
        {ranking.map((s, i) => {
          const isUni = s.bu === "unicive";
          const fmt = (n: number) => (isUni ? fmtInt.format(Math.round(n)) : BRL.format(n));
          const st = statusFor(s.pctSucesso, s.gap);
          const meta = STATUS_META[st];
          return (
            <div
              key={s.sellerId}
              className="card-lg card-hover relative overflow-hidden"
              style={{
                boxShadow:
                  st === "batido"
                    ? "0 0 0 1px rgba(34,197,94,0.4), 0 12px 40px -12px rgba(34,197,94,0.4)"
                    : undefined,
              }}
            >
              {st === "batido" && (
                <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-success/30 blur-3xl pointer-events-none" />
              )}
              <div className="relative">
                <div className="flex items-start gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl grid place-items-center text-base font-bold shrink-0"
                    style={{ background: BU_COLOR[s.bu] + "33", color: BU_COLOR[s.bu] }}
                  >
                    #{i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-semibold truncate">{s.sellerName}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={isUni ? "chip-unicive" : "chip-cppem"}>{BU_LABEL[s.bu]}</span>
                      <span
                        className="chip"
                        style={{ background: meta.bg, color: meta.color }}
                      >
                        {meta.icon} {meta.label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-baseline gap-2 mt-4">
                  <span className="big-num" style={{ color: meta.color }}>
                    {fmtPct(s.pctSucesso)}
                  </span>
                  <span className="text-xs text-white/50">da meta</span>
                </div>

                <ProgressBar value={s.pctSucesso} color={meta.color} height={10} />

                <div className="grid grid-cols-2 gap-2 mt-3">
                  <Stat label="Realizado" value={fmt(s.realizado)} accent={BU_COLOR[s.bu]} />
                  <Stat label="Meta" value={fmt(s.metaTotal)} />
                  <Stat
                    label="Falta"
                    value={s.pctSucesso >= 100 ? "0" : fmt(s.falta)}
                    accent={s.pctSucesso >= 100 ? "#22c55e" : "#facc15"}
                  />
                  <Stat label="Hoje" value={fmt(s.realizadoHoje)} />
                </div>

                {st === "batido" && (
                  <div className="mt-3 text-xs text-success flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Missao cumprida no mes!
                  </div>
                )}
                {st === "quase" && (
                  <div className="mt-3 text-xs text-warning flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Falta pouco — bora fechar!
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl bg-panel2 p-2">
      <div className="text-[10px] uppercase tracking-wider text-white/50">{label}</div>
      <div className="text-sm font-semibold" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
    </div>
  );
}
