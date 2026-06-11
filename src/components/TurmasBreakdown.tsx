import type { ProductBreakdownRow } from "@/lib/data";
import { fmtInt, fmtPct } from "@/lib/calc";
import ProgressBar from "@/components/ProgressBar";
import { GraduationCap, Users } from "lucide-react";

const TURMAS = [
  { id: "turma_pmal", label: "PMAL", color: "#22c55e" },
  { id: "turma_pmpe", label: "PMPE", color: "#06b6d4" },
  { id: "turma_carreiras", label: "Carreiras Policiais", color: "#facc15" },
];

export default function TurmasBreakdown({ rows }: { rows: ProductBreakdownRow[] }) {
  const map = new Map(rows.map((r) => [r.product_line, r]));
  const totalReal = TURMAS.reduce((a, t) => a + (map.get(t.id)?.qtd || 0), 0);
  const totalMeta = TURMAS.reduce((a, t) => a + (map.get(t.id)?.quantidade_meta || 0), 0);
  const totalPct = totalMeta > 0 ? (totalReal / totalMeta) * 100 : 0;

  return (
    <div className="card-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-semibold flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-accent" /> Alunos por turma presencial
          </div>
          <div className="text-xs text-white/50">Meta x Realizado em quantidade de alunos</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-white/50 uppercase tracking-wider">Total</div>
          <div className="text-lg font-bold">
            {fmtInt.format(totalReal)} / {fmtInt.format(totalMeta)}
          </div>
          <div className="text-xs text-accent">{fmtPct(totalPct)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {TURMAS.map((t) => {
          const r = map.get(t.id);
          const qtd = r?.qtd || 0;
          const meta = r?.quantidade_meta || 0;
          const pct = meta > 0 ? (qtd / meta) * 100 : 0;
          const falta = Math.max(0, meta - qtd);
          return (
            <div key={t.id} className="rounded-xl bg-panel2 p-4 relative overflow-hidden">
              <div
                className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20 blur-2xl"
                style={{ background: t.color }}
              />
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div
                    className="chip"
                    style={{ background: t.color + "22", color: t.color }}
                  >
                    Turma {t.label}
                  </div>
                  <Users className="w-4 h-4" style={{ color: t.color }} />
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-4xl font-bold" style={{ color: t.color }}>
                    {fmtInt.format(qtd)}
                  </span>
                  <span className="text-sm text-white/40">/ {fmtInt.format(meta)} alunos</span>
                </div>
                <div className="mt-3">
                  <ProgressBar value={pct} color={t.color} height={8} />
                </div>
                <div className="flex items-center justify-between mt-2 text-xs">
                  <span className="text-white/50">
                    {pct >= 100 ? "Meta batida!" : `Faltam ${fmtInt.format(falta)} alunos`}
                  </span>
                  <span className="font-semibold" style={{ color: t.color }}>
                    {fmtPct(pct)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
