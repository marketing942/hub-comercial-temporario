"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

const MONTHS = [
  "Janeiro","Fevereiro","Marco","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

function periodNow() {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export default function PeriodNav({ year, month }: { year: number; month: number }) {
  const router = useRouter();
  const params = useSearchParams();

  function go(y: number, m: number) {
    const sp = new URLSearchParams(params?.toString() || "");
    const now = periodNow();
    if (y === now.year && m === now.month) {
      sp.delete("year");
      sp.delete("month");
    } else {
      sp.set("year", String(y));
      sp.set("month", String(m));
    }
    const q = sp.toString();
    router.push(`/dashboard${q ? `?${q}` : ""}`);
  }

  function prev() {
    const m = month === 1 ? 12 : month - 1;
    const y = month === 1 ? year - 1 : year;
    go(y, m);
  }
  function next() {
    const m = month === 12 ? 1 : month + 1;
    const y = month === 12 ? year + 1 : year;
    go(y, m);
  }
  function today() {
    const n = periodNow();
    go(n.year, n.month);
  }

  const now = periodNow();
  const isCurrent = year === now.year && month === now.month;
  const label = `${MONTHS[month - 1]} ${year}`;

  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-panel border border-border text-xs">
      <button
        onClick={prev}
        className="w-7 h-7 grid place-items-center rounded-lg hover:bg-panel2 text-white/60 hover:text-white"
        title="Mes anterior"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <div className="px-2 flex items-center gap-1.5">
        <CalendarDays className="w-3.5 h-3.5 text-white/40" />
        <span className="font-semibold">{label}</span>
        {!isCurrent && (
          <button
            onClick={today}
            className="ml-1 px-2 py-0.5 rounded-md bg-accent text-black text-[10px] font-bold"
          >
            Hoje
          </button>
        )}
      </div>
      <button
        onClick={next}
        className="w-7 h-7 grid place-items-center rounded-lg hover:bg-panel2 text-white/60 hover:text-white"
        title="Mes seguinte"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
