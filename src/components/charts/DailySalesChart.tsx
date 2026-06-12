"use client";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Row = { day: string; valor: number; qtd: number; leads?: number };

export default function DailySalesChart({
  data,
  color = "#22c55e",
  field = "valor",
  unit = "currency",
}: {
  data: Row[];
  color?: string;
  field?: "valor" | "qtd" | "leads";
  unit?: "currency" | "int";
}) {
  const gradId = `barGrad_${field}_${color.replace("#", "")}`;
  return (
    <div className="h-60 sm:h-64">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 16, left: -8, right: 8, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.95} />
              <stop offset="100%" stopColor={color} stopOpacity={0.45} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1f3a2a" strokeDasharray="3 4" vertical={false} />
          <XAxis dataKey="day" stroke="#7d8a83" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis
            stroke="#7d8a83"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) =>
              unit === "currency"
                ? "R$ " + Intl.NumberFormat("pt-BR", { notation: "compact" }).format(v)
                : Intl.NumberFormat("pt-BR", { notation: "compact" }).format(v)
            }
          />
          <Tooltip
            cursor={{ fill: "rgba(34,197,94,0.08)" }}
            contentStyle={{
              background: "#0c1b13",
              border: "1px solid #1f3a2a",
              borderRadius: 12,
              color: "#e8efe9",
            }}
            formatter={(val: any) =>
              unit === "currency"
                ? new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(Number(val))
                : Intl.NumberFormat("pt-BR").format(Number(val))
            }
            labelFormatter={(l) => `Dia ${l}`}
          />
          <Bar dataKey={field} fill={`url(#${gradId})`} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
