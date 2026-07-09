import type { ReactNode } from "react";
import ProgressBar from "@/components/ProgressBar";

export default function BigStatCard({
  label,
  value,
  hint,
  icon,
  accent = "#22c55e",
  valueColor,
  progressPct,
  progressColor,
  progressFooter,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  accent?: string;
  valueColor?: string;
  // Quando passados, desenha barra de progresso dentro do card
  progressPct?: number;
  progressColor?: string;
  progressFooter?: ReactNode;
}) {
  return (
    <div className="card-lg card-hover relative overflow-hidden">
      <div
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: accent }}
      />
      <div className="relative flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="kpi-label">{label}</div>
          {icon && (
            <div
              className="w-7 h-7 rounded-lg grid place-items-center text-sm"
              style={{ background: accent + "22", color: accent }}
            >
              {icon}
            </div>
          )}
        </div>
        <div className="big-num" style={valueColor ? { color: valueColor } : undefined}>
          {value}
        </div>
        {hint && <div className="text-[11px] text-white/50 leading-snug">{hint}</div>}
        {typeof progressPct === "number" && (
          <div className="mt-1">
            <ProgressBar value={progressPct} color={progressColor || accent} height={8} />
            {progressFooter && (
              <div className="text-[11px] text-white/55 mt-1.5 leading-snug">{progressFooter}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
