import {
  dashboardSnapshot,
  directSnapshot,
  daysInMonth,
  daysRemainingIncludingToday,
  periodNow,
  todayDayOfMonth,
} from "@/lib/data";
import DashboardCarousel from "@/components/DashboardCarousel";
import DashboardView from "@/components/DashboardView";
import DirectDashboardView from "@/components/DirectDashboardView";
import SellersGameView from "@/components/SellersGameView";
import PeriodNav from "@/components/PeriodNav";
import { ALL_BUS } from "@/lib/products";
import { BU_LABEL } from "@/lib/brand";

export const dynamic = "force-dynamic";

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

  const [snaps, direct] = await Promise.all([
    Promise.all(ALL_BUS.map((bu) => dashboardSnapshot(bu, { year, month }))),
    directSnapshot({ year, month }),
  ]);
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
      label: "Direto",
      node: (
        <DirectDashboardView
          snap={direct}
          day={day}
          totalDays={totalDays}
          daysLeft={daysLeft}
          monthName={monthName}
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
