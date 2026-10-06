"use client";
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type UnifiedChartSeries = {
  key: string;              // nome do campo em `data`
  label: string;            // texto na legenda
  color: string;            // cor da linha
  axis: "left" | "right";   // qual eixo Y usa
  unit: "currency" | "int" | "percent";
  dashed?: boolean;         // linha pontilhada (ex: ideal)
  strokeWidth?: number;
  hidden?: boolean;         // nao renderiza mas mantem no tooltip
};

export type UnifiedChartRow = {
  day: string;
  [k: string]: string | number | undefined;
};

const fmtBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);
const fmtInt = (v: number) => new Intl.NumberFormat("pt-BR").format(v);
const fmtPct = (v: number) => `${Number(v).toFixed(1)}%`;

function formatValue(unit: UnifiedChartSeries["unit"], v: number) {
  if (unit === "currency") return fmtBRL(v);
  if (unit === "percent") return fmtPct(v);
  return fmtInt(v);
}

function tickCompact(unit: UnifiedChartSeries["unit"]) {
  return (v: number) => {
    if (unit === "percent") return `${v}%`;
    const compact = Intl.NumberFormat("pt-BR", { notation: "compact" }).format(v);
    return unit === "currency" ? `R$ ${compact}` : compact;
  };
}

export default function UnifiedDailyChart({
  data,
  series,
  leftUnit = "currency",
  rightUnit = "percent",
  rightDomain,
  showIdealReference = false,
  height = 380,
}: {
  data: UnifiedChartRow[];
  series: UnifiedChartSeries[];
  leftUnit?: UnifiedChartSeries["unit"];
  rightUnit?: UnifiedChartSeries["unit"];
  rightDomain?: [number | string, number | string];
  showIdealReference?: boolean;
  height?: number;
}) {
  const hasRight = series.some((s) => s.axis === "right" && !s.hidden);
  return (
    <div style={{ height }}>
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 12, left: 0, right: hasRight ? 8 : 0, bottom: 4 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`glow_${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.5} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke="#1f3a2a" strokeDasharray="3 4" vertical={false} />
          <XAxis
            dataKey="day"
            stroke="#7d8a83"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={18}
          />
          <YAxis
            yAxisId="left"
            stroke="#7d8a83"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={tickCompact(leftUnit)}
            width={56}
          />
          {hasRight && (
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#7d8a83"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={tickCompact(rightUnit)}
              width={44}
              domain={rightDomain as any}
            />
          )}
          <Tooltip
            cursor={{ stroke: "#22c55e", strokeOpacity: 0.25, strokeWidth: 1 }}
            contentStyle={{
              background: "#0c1b13",
              border: "1px solid #1f3a2a",
              borderRadius: 12,
              color: "#e8efe9",
              fontSize: 12,
            }}
            labelStyle={{ color: "#9ca3af", fontSize: 11 }}
            formatter={(val: any, name: any) => {
              const s = series.find((x) => x.label === name) || series.find((x) => x.key === name);
              if (!s) return [val, name];
              return [formatValue(s.unit, Number(val)), s.label];
            }}
            labelFormatter={(l) => `Dia ${l}`}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
            iconType="plainline"
          />
          {showIdealReference && hasRight && (
            <ReferenceLine
              y={100}
              yAxisId="right"
              stroke="#facc15"
              strokeDasharray="3 4"
              strokeOpacity={0.6}
            />
          )}
          {series.filter((s) => !s.hidden).map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={s.strokeWidth ?? (s.dashed ? 1.5 : 2.5)}
              strokeDasharray={s.dashed ? "4 4" : undefined}
              dot={false}
              activeDot={{ r: 4, stroke: "#06120a", strokeWidth: 2, fill: s.color }}
              yAxisId={s.axis}
              connectNulls
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
