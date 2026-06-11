import type { ProductBreakdownRow } from "@/lib/data";
import { BRL, fmtInt, fmtPct } from "@/lib/calc";
import ProgressBar from "@/components/ProgressBar";
import { Layers } from "lucide-react";

export default function ProductRevenueBreakdown({
  rows,
  color,
  isUnicive = false,
}: {
  rows: ProductBreakdownRow[];
  color: string;
  isUnicive?: boolean;
}) {
  // Mostra todas as linhas que tem meta OU venda no mes
  const visible = rows.filter(
    (r) => r.valor_meta > 0 || r.valor > 0 || r.quantidade_meta > 0 || r.qtd > 0
  );
  const data = visible.length > 0 ? visible : rows;

  const totalReal = data.reduce((a, b) => a + b.valor, 0);
  const totalMeta = data.reduce((a, b) => a + b.valor_meta, 0);
  const totalPct = totalMeta > 0 ? (totalReal / totalMeta) * 100 : 0;

  return (
    <div className="card-lg h-full">
      <div className="flex items-center justify-between mb-3 gap-2">
        <div>
          <div className="text-sm font-semibold flex items-center gap-2">
            <Layers className="w-4 h-4" style={{ color }} /> Receita por categoria
          </div>
          <div className="text-xs text-white/50">
            Faturado / Meta da categoria
          </div>
        </div>
        <div className="text-right text-xs text-white/60">
          <div>
            <span className="text-white font-semibold">{BRL.format(totalReal)}</span>
            <span className="text-white/40"> / {BRL.format(totalMeta)}</span>
          </div>
          <div className="text-[11px]" style={{ color }}>
            {fmtPct(totalPct)} da meta de receita
          </div>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="text-sm text-white/50">
          Nenhuma linha de produto com meta ou venda neste mes.
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((r) => {
            const pctValor = r.valor_meta > 0 ? (r.valor / r.valor_meta) * 100 : 0;
            const pctQtd = r.quantidade_meta > 0 ? (r.qtd / r.quantidade_meta) * 100 : 0;
            const pct = r.valor_meta > 0 ? pctValor : pctQtd;
            const hitColor = pct >= 100 ? "#22c55e" : color;
            return (
              <div key={r.product_line} className="rounded-xl bg-panel2/60 p-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                  <div className="text-sm font-semibold">{r.label}</div>
                  <div className="text-xs text-white/60 text-right">
                    <span className="text-white font-semibold">{BRL.format(r.valor)}</span>
                    <span className="text-white/40">
                      {" "}
                      / meta {BRL.format(r.valor_meta)}
                    </span>
                    {r.quantidade_meta > 0 && (
                      <span className="text-white/40 block sm:inline">
                        {" "} - {fmtInt.format(r.qtd)}/{fmtInt.format(r.quantidade_meta)} un.
                      </span>
                    )}
                  </div>
                </div>
                <ProgressBar value={pct} color={hitColor} height={8} />
                <div className="flex items-center justify-between mt-1 text-[11px] text-white/50">
                  <span>
                    {pct >= 100
                      ? "Meta da categoria batida!"
                      : r.valor_meta > 0
                      ? `Faltam ${BRL.format(Math.max(0, r.valor_meta - r.valor))}`
                      : "Sem meta definida"}
                  </span>
                  <span style={{ color: hitColor }}>{fmtPct(pct)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
