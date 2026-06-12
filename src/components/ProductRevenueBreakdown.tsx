import type { ProductBreakdownRow } from "@/lib/data";
import { BRL, fmtInt, fmtPct } from "@/lib/calc";
import { COLOR } from "@/lib/brand";
import ProgressBar from "@/components/ProgressBar";
import { Layers } from "lucide-react";

export default function ProductRevenueBreakdown({
  rows,
  color,
  excludeIds = [],
}: {
  rows: ProductBreakdownRow[];
  color: string;
  excludeIds?: readonly string[];
}) {
  const filtered = rows.filter((r) => !excludeIds.includes(r.product_line));
  const visible = filtered.filter(
    (r) => r.valor_meta > 0 || r.valor > 0 || r.quantidade_meta > 0 || r.qtd > 0
  );
  const data = visible.length > 0 ? visible : filtered;

  return (
    <div className="card-lg h-full">
      <div className="mb-3">
        <div className="text-sm font-semibold flex items-center gap-2">
          <Layers className="w-4 h-4" style={{ color }} /> Receita por categoria
        </div>
        <div className="text-xs text-white/50">Faturado x Meta de cada categoria de produto</div>
      </div>

      {data.length === 0 ? (
        <div className="text-sm text-white/50">Nenhuma linha de produto com meta ou venda neste mes.</div>
      ) : (
        <div className="space-y-3">
          {data.map((r) => {
            const pctValor = r.valor_meta > 0 ? (r.valor / r.valor_meta) * 100 : 0;
            const pctQtd = r.quantidade_meta > 0 ? (r.qtd / r.quantidade_meta) * 100 : 0;
            const pct = r.valor_meta > 0 ? pctValor : pctQtd;
            const hasMeta = r.valor_meta > 0 || r.quantidade_meta > 0;
            const tone = !hasMeta ? COLOR.neutral : pct >= 100 ? COLOR.ok : COLOR.neutral;
            const barTone = !hasMeta ? COLOR.neutral : pct >= 100 ? COLOR.ok : COLOR.info;
            return (
              <div key={r.product_line} className="rounded-xl bg-panel2/60 p-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
                  <div className="text-sm font-semibold">{r.label}</div>
                  <div className="text-xs text-white/60 text-right">
                    <span className="font-semibold" style={{ color: tone }}>
                      {BRL.format(r.valor)}
                    </span>
                    <span className="text-white/40"> / {BRL.format(r.valor_meta)}</span>
                    {r.quantidade_meta > 0 && (
                      <span className="text-white/40 block sm:inline">
                        {" "} - {fmtInt.format(r.qtd)}/{fmtInt.format(r.quantidade_meta)} un.
                      </span>
                    )}
                  </div>
                </div>
                <ProgressBar value={pct} color={barTone} height={7} />
                <div className="flex items-center justify-between mt-1 text-[11px] text-white/50">
                  <span>
                    {pct >= 100
                      ? "Categoria batida"
                      : r.valor_meta > 0
                      ? `Faltam ${BRL.format(Math.max(0, r.valor_meta - r.valor))}`
                      : "Sem meta"}
                  </span>
                  <span style={{ color: tone }}>{fmtPct(pct)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
