import { dashboardSnapshot, daysInMonth, daysRemainingIncludingToday, periodNow, todayDayOfMonth } from "@/lib/data";
import DashboardCarousel from "@/components/DashboardCarousel";
import DashboardView from "@/components/DashboardView";
import SellersGameView from "@/components/SellersGameView";
import { ALL_BUS } from "@/lib/products";
import { BU_LABEL } from "@/lib/brand";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { year, month } = periodNow();
  const totalDays = daysInMonth(year, month);
  const day = todayDayOfMonth(year, month);
  const daysLeft = daysRemainingIncludingToday(year, month);
  const monthName = new Date(year, month - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const snaps = await Promise.all(ALL_BUS.map((bu) => dashboardSnapshot(bu, { year, month })));
  const [cppem, unicive, colegio] = snaps;

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

  return <DashboardCarousel slides={slides} intervalSec={25} refreshMs={60000} />;
}
