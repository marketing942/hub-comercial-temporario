import { statsForAll } from "@/lib/data";
import { periodNow } from "@/lib/calc";
import { loadCommissionRules, calcCommission, rankBUBonus } from "@/lib/commission";
import { ALL_BUS, type BU } from "@/lib/products";
import ComissoesClient from "./comissoes-client";

export const dynamic = "force-dynamic";

export default async function ComissoesPage() {
  const { year, month } = periodNow();
  const [rulesMap, stats] = await Promise.all([
    loadCommissionRules(),
    statsForAll({ year, month }),
  ]);

  // Pre-calcula board de cada BU no server pra evitar recalculo desnecessario
  // e devolve tudo pro client pra ele renderizar + editar as regras.
  const boards: Record<BU, {
    rows: {
      sellerId: string;
      sellerName: string;
      realizado: number;
      meta: number;
      pctMeta: number;
      tierPct: number | null;
      commissionPct: number;
      commissionValue: number;
      podium: number | null;
      bonus: number;
      total: number;
    }[];
    bu: BU;
    sumMeta: number;
    sumRealizado: number;
    pctColetivo: number;
    unlocked: boolean;
    unlockedAt: number;
    totalComissao: number;
    totalBonus: number;
    totalPayout: number;
  }> = {} as any;

  for (const bu of ALL_BUS) {
    const rules = rulesMap[bu];
    const buSellers = stats.filter((r) => r.bu === bu);
    const bonusInfo = rankBUBonus(
      buSellers.map((r) => ({ sellerId: r.sellerId, realizado: r.valorRealizado, meta: r.valorMeta })),
      rules
    );
    const podiumMap = new Map(bonusInfo.ranking.map((r) => [r.sellerId, r]));
    const rows = buSellers
      .map((r) => {
        const c = calcCommission(r.valorRealizado, r.valorMeta, rules);
        const p = podiumMap.get(r.sellerId) || null;
        const bonus = p?.bonus || 0;
        return {
          sellerId: r.sellerId,
          sellerName: r.sellerName,
          realizado: r.valorRealizado,
          meta: r.valorMeta,
          pctMeta: c.pctMeta,
          tierPct: c.tier?.meta_pct ?? null,
          commissionPct: c.commissionPct,
          commissionValue: c.commissionValue,
          podium: p?.position ?? null,
          bonus,
          total: c.commissionValue + bonus,
        };
      })
      .sort((a, b) => b.commissionValue - a.commissionValue);
    boards[bu] = {
      rows,
      bu,
      sumMeta: bonusInfo.sumMeta,
      sumRealizado: bonusInfo.sumRealizado,
      pctColetivo: bonusInfo.pctColetivo,
      unlocked: bonusInfo.unlocked,
      unlockedAt: bonusInfo.unlockedAt,
      totalComissao: rows.reduce((a, r) => a + r.commissionValue, 0),
      totalBonus: rows.reduce((a, r) => a + r.bonus, 0),
      totalPayout: rows.reduce((a, r) => a + r.total, 0),
    };
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Comissoes ao vivo</h1>
        <p className="text-sm text-white/50">
          Ajuste tiers, minimos e bonus de podio por BU. Tudo que muda aqui reflete na
          hora nos paineis dos vendedores.
        </p>
      </div>
      <ComissoesClient rules={rulesMap} boards={boards} />
    </div>
  );
}
