import type { SellerStats } from "@/lib/calc";
import { BRL, fmtInt, fmtPct } from "@/lib/calc";
import { BU_COLOR, BU_LABEL, COLOR, PANICO_BADGE } from "@/lib/brand";
import { isQtdPrimary, ALL_BUS, type BU } from "@/lib/products";
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
  batido: { label: "BATEU A META", color: COLOR.ok, bg: "rgba(34,197,94,0.18)", icon: <Trophy className="w-3.5 h-3.5" /> },
  quase: { label: "Quase la!", color: COLOR.warning, bg: "rgba(250,204,21,0.18)", icon: <Flame className="w-3.5 h-3.5" /> },
  andamento: { label: "Em andamento", color: COLOR.info, bg: "rgba(125,211,252,0.18)", icon: <Rocket className="w-3.5 h-3.5" /> },
  atrasado: { label: "Recuperar ritmo", color: COLOR.danger, bg: "rgba(239,68,68,0.18)", icon: <Clock className="w-3.5 h-3.5" /> },
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
  const sortByReal = (a: SellerStats, b: SellerStats) => b.realizado - a.realizado;

  const ranks: Record<BU, SellerStats[]> = {
    cppem: stats.filter((s) => s.bu === "cppem").sort(sortByReal),
    unicive: stats.filter((s) => s.bu === "unicive").sort(sortByReal),
    colegio_cppem: stats.filter((s) => s.bu === "colegio_cppem").sort(sortByReal),
  };

  // Podio so faz sentido se ha 2+ vendedores na BU
  const busWithPodium = ALL_BUS.filter((bu) => ranks[bu].length >= 2);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl grid place-items-center" style={{ background: COLOR.ok + "22", color: COLOR.ok }}>
          <Trophy className="w-6 h-6" />
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-white/50">
            {monthName} - dia {day}/{totalDays} - faltam {daysLeft} dia{daysLeft > 1 ? "s" : ""}
          </div>
          <h2 className="text-2xl xl:text-3xl font-bold mt-0.5">Quadro dos Vendedores</h2>
        </div>
      </div>

      {/* Podios apenas pra BUs com >= 2 vendedores */}
      {busWithPodium.length > 0 && (
        <section
          className={`grid grid-cols-1 gap-4 ${
            busWithPodium.length === 1
              ? ""
              : busWithPodium.length === 2
              ? "xl:grid-cols-2"
              : "xl:grid-cols-3"
          }`}
        >
          {busWithPodium.map((bu) => (
            <BUPodium
              key={bu}
              title={`Top 3 ${BU_LABEL[bu]}`}
              ranking={ranks[bu]}
              accent={BU_COLOR[bu]}
            />
          ))}
        </section>
      )}

      {/* Cards por BU agrupados */}
      {ALL_BUS.map((bu) => (
        <BUGroup key={bu} bu={bu} sellers={ranks[bu]} accent={BU_COLOR[bu]} />
      ))}
    </div>
  );
}

function BUGroup({
  bu,
  sellers,
  accent,
}: {
  bu: BU;
  sellers: SellerStats[];
  accent: string;
}) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-3">
        <div className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: accent + "22", color: accent }}>
          {BU_LABEL[bu]}
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
            <SellerCard key={`${s.sellerId}_${s.bu}`} s={s} pos={i + 1} buColor={accent} />
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
  const isQtd = isQtdPrimary(s.bu);
  const fmtPrincipal = (n: number) =>
    isQtd ? fmtInt.format(Math.round(n)) : BRL.format(n);
  const st = statusFor(s.pctSucesso, s.gap);
  const meta = STATUS_META[st];

  // Cores semanticas: verde se bateu, vermelho se nao bateu (e tem meta),
  // branco se nao ha meta definida.
  const ticketTone =
    s.ticketMeta > 0
      ? s.ticketReal >= s.ticketMeta
        ? COLOR.ok
        : COLOR.danger
      : COLOR.neutral;
  const convTone =
    s.conversaoMeta > 0
      ? s.conversaoReal >= s.conversaoMeta
        ? COLOR.ok
        : COLOR.danger
      : COLOR.neutral;

  return (
    <div
      className="card card-hover relative overflow-hidden"
      style={{
        boxShadow: st === "batido"
          ? "0 0 0 1px rgba(34,197,94,0.4), 0 12px 40px -12px rgba(34,197,94,0.4)"
          : undefined,
      }}
    >
      {st === "batido" && (
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-success/30 blur-3xl pointer-events-none" />
      )}
      <div className="relative">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <Avatar
              name={s.sellerName}
              url={s.avatarUrl}
              color={s.avatarColor || buColor}
              size={44}
            />
            {st === "atrasado" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={PANICO_BADGE}
                alt="Bata a meta ou sera abatido"
                title="Bata a meta ou sera abatido"
                className="absolute -top-5 -right-6 w-12 h-12 object-contain rotate-[14deg] pointer-events-none select-none"
                style={{ filter: "drop-shadow(0 2px 6px rgba(239,68,68,0.6))" }}
              />
            )}
          </div>
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

        <div className="flex items-end justify-between gap-2 mt-3">
          <div>
            <div className="text-2xl xl:text-3xl font-bold leading-none" style={{ color: meta.color }}>
              {fmtPct(s.pctSucesso)}
            </div>
            <div className="text-[11px] text-white/50 mt-0.5">da meta</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-white/40">
              {isQtd ? "Matriculas" : "Faturamento"}
            </div>
            <div className="text-base font-semibold text-white">
              {fmtPrincipal(s.realizado)}
              <span className="text-xs text-white/40 font-normal">
                {" / "}{fmtPrincipal(s.metaTotal)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-2">
          <ProgressBar value={s.pctSucesso} color={meta.color} height={7} />
        </div>

        {/* 3 mini stats com REAL / META lado a lado */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <CompareStat
            label="Ticket"
            icon={<Wallet className="w-3 h-3" />}
            real={BRL.format(s.ticketReal)}
            meta={s.ticketMeta > 0 ? BRL.format(s.ticketMeta) : "—"}
            tone={ticketTone}
          />
          <CompareStat
            label="Conversao"
            icon={<Target className="w-3 h-3" />}
            real={fmtPct(s.conversaoReal)}
            meta={s.conversaoMeta > 0 ? fmtPct(s.conversaoMeta) : "—"}
            tone={convTone}
          />
          <SoloStat
            label="Leads"
            icon={<Users className="w-3 h-3" />}
            value={fmtInt.format(s.leads)}
          />
        </div>
      </div>
    </div>
  );
}

function CompareStat({
  label,
  icon,
  real,
  meta,
  tone,
}: {
  label: string;
  icon?: React.ReactNode;
  real: string;
  meta: string;
  tone: string;
}) {
  return (
    <div className="rounded-lg bg-panel2 p-2 leading-tight">
      <div className="text-[10px] uppercase tracking-wider text-white/50 flex items-center gap-1">
        {icon} {label}
      </div>
      <div className="text-sm font-semibold mt-0.5 whitespace-nowrap">
        <span style={{ color: tone }}>{real}</span>
        <span className="text-white/30 mx-1">/</span>
        <span className="text-white/40 font-normal text-xs">{meta}</span>
      </div>
    </div>
  );
}

function SoloStat({
  label,
  icon,
  value,
}: {
  label: string;
  icon?: React.ReactNode;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-panel2 p-2 leading-tight">
      <div className="text-[10px] uppercase tracking-wider text-white/50 flex items-center gap-1">
        {icon} {label}
      </div>
      <div className="text-sm font-semibold mt-0.5 text-white">{value}</div>
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
            const isQtd = isQtdPrimary(s.bu);
            const valueStr = isQtd ? fmtInt.format(s.realizado) : BRL.format(s.realizado);
            const label = isQtd ? "matriculas" : "faturado";
            const avatarSize = isFirst ? 84 : 64;

            return (
              <div
                key={`${s.sellerId}_${s.bu}`}
                className={`rounded-2xl text-center p-3 ${
                  isFirst
                    ? "bg-warning/15 border border-warning/40 shadow-glow"
                    : "bg-panel2/60"
                }`}
                style={{ minHeight: isFirst ? 280 : 220 }}
              >
                <div className="flex items-center justify-center gap-1 text-[11px] font-bold mb-2">
                  <Crown
                    className={isFirst ? "w-4 h-4" : "w-3.5 h-3.5"}
                    style={{ color: isFirst ? "#facc15" : pos === 2 ? "#cbd5e1" : "#fb923c" }}
                  />
                  {pos}o LUGAR
                </div>
                <div className="relative flex justify-center mb-2">
                  {isFirst && (
                    <Crown
                      className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7"
                      style={{
                        color: "#facc15",
                        filter: "drop-shadow(0 2px 6px rgba(250,204,21,0.55))",
                        transform: "translateX(-50%) rotate(-8deg)",
                      }}
                    />
                  )}
                  <Avatar
                    name={s.sellerName}
                    url={s.avatarUrl}
                    color={s.avatarColor || accent}
                    size={avatarSize}
                  />
                </div>
                <div
                  className={`font-bold truncate ${isFirst ? "text-xl xl:text-2xl" : "text-base xl:text-lg"}`}
                  style={isFirst ? { color: "#facc15" } : undefined}
                >
                  {s.sellerName}
                </div>
                <div className="text-xl xl:text-2xl font-bold mt-1 text-white">
                  {valueStr}
                </div>
                <div className="text-[11px] text-white/50">{label}</div>
                <div
                  className="text-[11px] mt-0.5"
                  style={{ color: s.pctSucesso >= 100 ? COLOR.ok : COLOR.neutral }}
                >
                  {fmtPct(s.pctSucesso)} da meta
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
