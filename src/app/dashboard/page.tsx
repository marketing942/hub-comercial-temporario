import { dashboardSnapshot, daysInMonth, daysRemainingIncludingToday, periodNow, todayDayOfMonth } from "@/lib/data";
import { getDailyQuote } from "@/lib/quotes";
import DashboardCarousel from "@/components/DashboardCarousel";
import DashboardView from "@/components/DashboardView";
import SellersGameView from "@/components/SellersGameView";
import { Sparkles } from "lucide-react";

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

  const [cppem, unicive, quote] = await Promise.all([
    dashboardSnapshot("cppem", { year, month }),
    dashboardSnapshot("unicive", { year, month }),
    getDailyQuote(),
  ]);

  const allSellers = [...cppem.sellers, ...unicive.sellers];

  const slides = [
    {
      key: "cppem",
      label: "CPPEM",
      node: (
        <DashboardView
          snap={cppem}
          day={day}
          totalDays={totalDays}
          daysLeft={daysLeft}
          monthName={monthName}
        />
      ),
    },
    {
      key: "unicive",
      label: "UNICIVE",
      node: (
        <DashboardView
          snap={unicive}
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
    <div className="space-y-4">
      <div className="card flex items-center gap-2 text-sm text-white/70">
        <Sparkles className="w-4 h-4 text-accent shrink-0" />
        <span className="truncate">
          <em>"{quote.text}"</em>
          {quote.author && <span className="text-white/40"> - {quote.author}</span>}
        </span>
      </div>
      <DashboardCarousel slides={slides} intervalSec={20} refreshMs={60000} />
    </div>
  );
}
