"use client";
import { BRL, fmtPct } from "@/lib/calc";
import type { CommissionRules, CommissionTier } from "@/lib/commission";
import { Rocket, Zap } from "lucide-react";

export default function CommissionProgress({
  color,
  rules,
  realizado,
  meta,
  pctMeta,
  nextTier,
  toNextTier,
}: {
  color: string;
  rules: CommissionRules;
  realizado: number;
  meta: number;
  pctMeta: number;
  nextTier: CommissionTier | null;
  toNextTier: number;
}) {
  // Escala vai de 0 ate o maior tier (ou 100 se so tiver tiers pequenos).
  const maxTier = rules.tiers.reduce((a, t) => Math.max(a, t.meta_pct), 100);
  const scale = Math.max(maxTier, pctMeta, 100);
  const barPct = Math.min(100, (pctMeta / scale) * 100);

  return (
    <div className="card-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold flex items-center gap-2">
          <Rocket className="w-4 h-4" style={{ color }} /> Progresso ate o proximo checkpoint
        </div>
        <div className="text-xs font-semibold" style={{ color }}>
          {fmtPct(pctMeta)}
        </div>
      </div>

      <div className="relative pt-6 pb-8">
        {/* trilha */}
        <div className="w-full h-3 rounded-full bg-border/60 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${barPct}%`,
              background: `linear-gradient(90deg, ${color}, ${color}cc)`,
              boxShadow: `0 0 12px ${color}55`,
              transition: "width 700ms cubic-bezier(.4,1.6,.5,1)",
            }}
          />
        </div>

        {/* checkpoints */}
        <div className="absolute inset-x-0 top-0 bottom-0 pointer-events-none">
          {rules.tiers.map((t) => {
            const pos = Math.min(100, (t.meta_pct / scale) * 100);
            const reached = pctMeta >= t.meta_pct;
            return (
              <div
                key={t.meta_pct}
                className="absolute"
                style={{ left: `${pos}%`, transform: "translateX(-50%)", top: 0, bottom: 0 }}
              >
                {/* etiqueta em cima */}
                <div className="text-center text-[10px] font-semibold whitespace-nowrap -translate-y-0.5">
                  <div style={{ color: reached ? color : "#94a3b8" }}>
                    {t.meta_pct}%
                  </div>
                  <div className="text-[9px] text-white/40">
                    +{t.commission_pct.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%
                  </div>
                </div>
                {/* bolinha no meio da barra */}
                <div
                  className="absolute left-1/2 top-[38px] -translate-x-1/2 rounded-full border-2 grid place-items-center"
                  style={{
                    width: 18,
                    height: 18,
                    background: reached ? color : "#0b1220",
                    borderColor: reached ? color : "#334155",
                    boxShadow: reached ? `0 0 10px ${color}` : undefined,
                  }}
                >
                  {reached && <Zap className="w-2.5 h-2.5 text-black" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
        <div className="rounded-xl bg-panel2 p-3">
          <div className="text-[10px] uppercase tracking-wider text-white/50">Realizado</div>
          <div className="text-lg font-bold">{BRL.format(realizado)}</div>
        </div>
        <div className="rounded-xl bg-panel2 p-3">
          <div className="text-[10px] uppercase tracking-wider text-white/50">Meta</div>
          <div className="text-lg font-bold">{BRL.format(meta)}</div>
        </div>
        <div className="rounded-xl bg-panel2 p-3 col-span-2 md:col-span-1">
          <div className="text-[10px] uppercase tracking-wider text-white/50">
            {nextTier ? `Faltam pro tier de ${nextTier.meta_pct}%` : "Tier maximo atingido"}
          </div>
          <div className="text-lg font-bold" style={{ color: nextTier ? color : "#22c55e" }}>
            {nextTier ? BRL.format(toNextTier) : "🏆"}
          </div>
        </div>
      </div>
    </div>
  );
}
