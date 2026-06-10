import type { ReactNode } from "react";

export default function StatCard({
  label,
  value,
  hint,
  icon,
  accent = "#7c5cff",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  accent?: string;
}) {
  return (
    <div className="card card-hover">
      <div className="flex items-start justify-between">
        <div className="kpi-label">{label}</div>
        {icon && (
          <div
            className="w-8 h-8 rounded-lg grid place-items-center"
            style={{ background: accent + "22", color: accent }}
          >
            {icon}
          </div>
        )}
      </div>
      <div className="kpi-num mt-1">{value}</div>
      {hint && <div className="text-xs text-white/50 mt-1">{hint}</div>}
    </div>
  );
}
