import { unstable_cache } from "next/cache";
import {
  dashboardSnapshot,
  directSnapshot,
  daysInMonth,
  daysRemainingIncludingToday,
  ligacaoBreakdown,
  indicacaoBreakdown,
  periodNow,
  statsForAll,
  todayDayOfMonth,
} from "@/lib/data";
import { DASHBOARD_TAG } from "@/lib/supabase";
import DashboardCarousel from "@/components/DashboardCarousel";
import DashboardView from "@/components/DashboardView";
import DirectDashboardView from "@/components/DirectDashboardView";
import SellersGameView from "@/components/SellersGameView";
import PeriodNav from "@/components/PeriodNav";
import { ALL_BUS } from "@/lib/products";
import { BU_LABEL } from "@/lib/brand";

export const dynamic = "force-dynamic";

// Os dados do painel ficam em cache no servidor e sao compartilhados por todas
// as abas/TVs abertas. O cache cai sozinho a cada escrita no banco (ver
// lib/supabase.ts); o revalidate cobre a virada do dia e alteracoes feitas
// direto no Supabase.
const DASHBOARD_CACHE_SECONDS = 120;

const loadDashboardData = unstable_cache(
  async (year: number, month: number) => {
    const stats = await statsForAll({ year, month });
    const [snaps, direct, ligacaoAll, indicacaoAll] = await Promise.all([
      Promise.all(ALL_BUS.map((bu) => dashboardSnapshot(bu, { year, month }, stats))),
      directSnapshot({ year, month }),
      // Agregado de todas as BUs — reaproveitado da aba "Visao Geral"
      // (removida) e exibido como ultima secao do slide Direto / IA.
      ligacaoBreakdown({ year, month }),
      indicacaoBreakdown({ year, month }),
    ]);
    return { snaps, direct, ligacaoAll, indicacaoAll };
  },
  ["dashboard-data"],
  { revalidate: DASHBOARD_CACHE_SECONDS, tags: [DASHBOARD_TAG] }
);

function parseYearMonth(searchParams: { year?: string; month?: string }) {
  const now = periodNow();
  const y = Number(searchParams.year);
  const m = Number(searchParams.month);
  const year = y >= 2024 && y <= 2100 ? y : now.year;
  const month = m >= 1 && m <= 12 ? m : now.month;
  return { year, month };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { year?: string; month?: string };
}) {
  const { year, month } = parseYearMonth(searchParams);
  const totalDays = daysInMonth(year, month);
  const day = todayDayOfMonth(year, month);
  const daysLeft = daysRemainingIncludingToday(year, month);
  const monthName = new Date(year, month - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const { snaps, direct, ligacaoAll, indicacaoAll } = await loadDashboardData(year, month);
  const allSellers = snaps.flatMap((s) => s.sellers);

  const slides = [
    ...snaps.map((snap) => ({
      key: snap.bu,
      label: BU_LABEL[snap.bu],
      node: (
        <DashboardView
          snap={snap}
          day={day}
          totalDays={totalDays}
          daysLeft={daysLeft}
          monthName={monthName}
        />
      ),
    })),
    {
      key: "direto",
      label: "Direto / IA",
      node: (
        <DirectDashboardView
          snap={direct}
          day={day}
          totalDays={totalDays}
          daysLeft={daysLeft}
          monthName={monthName}
          ligacao={ligacaoAll}
          indicacao={indicacaoAll}
        />
      ),
    },
    {
      key: "sellers",
      label: "Vendedores",
      node: (
        <SellersGameView
          stats={allSellers}
          monthName={monthName}
          day={day}
          totalDays={totalDays}
          daysLeft={daysLeft}
        />
      ),
    },
  ];

  return (
    <DashboardCarousel
      slides={slides}
      intervalSec={25}
      refreshMs={60000}
      periodNav={<PeriodNav year={year} month={month} />}
    />
  );
}
