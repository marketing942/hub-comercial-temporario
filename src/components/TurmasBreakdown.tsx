import type { ProductBreakdownRow } from "@/lib/data";
import { fmtInt, fmtPct } from "@/lib/calc";
import { COLOR } from "@/lib/brand";
import ProgressBar from "@/components/ProgressBar";
import { GraduationCap, Users } from "lucide-react";

const TURMAS = [
  { id: "turma_pmal", label: "PMAL" },
  { id: "turma_pmpe", label: "PMPE" },
  { id: "turma_carreiras", label: "Carreiras Policiais" },
];

export default function TurmasBreakdown({
  rows,
  variant = "grid",
}: {
  rows: ProductBreakdownRow[];
  variant?: "grid" | "stack";
}) {
  const map = new Map(rows.map((r) => [r.product_line, r]));
  const totalReal = TURMAS.reduce((a, t) => a + (map.get(t.id)?.qtd || 0), 0);
  const totalMeta = TURMAS.reduce((a, t) => a + (map.get(t.id)?.quantidade_meta || 0), 0);
  const totalPct = totalMeta > 0 ? (totalReal / totalMeta) * 100 : 0;

  return (
    <div className="card-lg h-full flex flex-col">
      <div className="flex items-center justify-between mb-3 gap-2">
        <div>
          <div className="text-sm font-semibold flex items-center gap-2">
            <GraduationCap className="w-4 h-4" style={{ color: COLOR.info }} /> Alunos por turmas presenciais e eventos
          </div>
          <div className="text-xs text-white/50">Meta x Realizado em quantidade de alunos</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-white/50">Total</div>
          <div className="text-base font-bold">
            {fmtInt.format(totalReal)} / {fmtInt.format(totalMeta)}
          </div>
          <div className="text-[11px]" style={{ color: totalPct >= 100 ? COLOR.ok : COLOR.neutral }}>
            {fmtPct(totalPct)}
          </div>
        </div>
      </div>

      <div className={variant === "stack" ? "space-y-3 flex-1" : "grid grid-cols-1 sm:grid-cols-3 gap-3"}>
        {TURMAS.map((t) => {
          const r = map.get(t.id);
          const qtd = r?.qtd || 0;
          const meta = r?.quantidade_meta || 0;
          const pct = meta > 0 ? (qtd / meta) * 100 : 0;
          const falta = Math.max(0, meta - qtd);
          const tone = pct >= 100 ? COLOR.ok : COLOR.neutral;

          if (variant === "stack") {
            return (
              <div key={t.id} className="rounded-xl bg-panel2/60 p-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="text-sm font-semibold">Turma {t.label}</div>
                  <Users className="w-3.5 h-3.5 text-white/40" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold" style={{ color: tone }}>
                    {fmtInt.format(qtd)}
                  </span>
                  <span className="text-xs text-white/40">/ {fmtInt.format(meta)} alunos</span>
                </div>
                <ProgressBar value={pct} color={tone} height={6} />
                <div className="flex items-center justify-between mt-1 text-[11px]">
                  <span className="text-white/50">
                    {pct >= 100 ? "Bateu" : `Faltam ${fmtInt.format(falta)}`}
                  </span>
                  <span style={{ color: tone }}>{fmtPct(pct)}</span>
                </div>
              </div>
            );
          }

          return (
            <div key={t.id} className="rounded-xl bg-panel2 p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm font-semibold">Turma {t.label}</div>
                <Users className="w-3.5 h-3.5 text-white/40" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold" style={{ color: tone }}>
                  {fmtInt.format(qtd)}
                </span>
                <span className="text-sm text-white/40">/ {fmtInt.format(meta)}</span>
              </div>
              <div className="mt-2">
                <ProgressBar value={pct} color={tone} height={6} />
              </div>
              <div className="flex items-center justify-between mt-1 text-[11px]">
                <span className="text-white/50">
                  {pct >= 100 ? "Bateu" : `Faltam ${fmtInt.format(falta)}`}
                </span>
                <span style={{ color: tone }}>{fmtPct(pct)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
