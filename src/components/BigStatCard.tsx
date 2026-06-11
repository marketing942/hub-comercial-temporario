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
        className="absolute -top-12 -right-12 w-44 h-44 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: accent }}
      />
      <div className="relative flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="kpi-label">{label}</div>
          {icon && (
            <div
              className="w-12 h-12 rounded-xl grid place-items-center text-xl"
              style={{ background: accent + "22", color: accent }}
            >
              {icon}
            </div>
          )}
        </div>
        <div className="big-num" style={valueColor ? { color: valueColor } : undefined}>
          {value}
        </div>
        {hint && <div className="text-xs text-white/50">{hint}</div>}
      </div>
    </div>
  );
}
