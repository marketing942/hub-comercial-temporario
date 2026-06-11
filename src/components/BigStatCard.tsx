import type { ReactNode } from "react";

export default function BigStatCard({
  label,
  value,
  hint,
  icon,
  accent = "#22c55e",
  valueColor,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  accent?: string;
  valueColor?: string;
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
              className="w-9 h-9 rounded-lg grid place-items-center text-base"
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
      </div>
    </div>
  );
}
