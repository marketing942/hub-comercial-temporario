"use client";
import { useRouter } from "next/navigation";
import { Calendar, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";

const MONTHS = [
  "Janeiro","Fevereiro","Marco","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

export default function MonthFilter({
  year,
  month,
  currentYear,
  currentMonth,
}: {
  year: number;
  month: number;
  currentYear: number;
  currentMonth: number;
}) {
  const router = useRouter();
  const isCurrent = year === currentYear && month === currentMonth;

  function goTo(y: number, m: number) {
    if (y === currentYear && m === currentMonth) {
      router.push("/admin");
    } else {
      router.push(`/admin?year=${y}&month=${m}`);
    }
  }

  function shift(delta: number) {
    // delta = -1 (mes anterior) ou +1 (proximo)
    const total = year * 12 + (month - 1) + delta;
    const y = Math.floor(total / 12);
    const m = (total % 12) + 1;
    goTo(y, m);
  }

  // Opcoes de ano: do ano atual - 2 ate o ano atual + 1
  const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  return (
    <div className="inline-flex items-center gap-1 rounded-xl bg-panel border border-border p-1">
      <button
        onClick={() => shift(-1)}
        title="Mes anterior"
        className="w-8 h-8 grid place-items-center rounded-lg hover:bg-panel2 text-white/60 hover:text-white"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-1 px-1">
        <Calendar className="w-3.5 h-3.5 text-white/40" />
        <select
          className="bg-transparent text-sm font-semibold focus:outline-none cursor-pointer pr-1"
          value={month}
          onChange={(e) => goTo(year, Number(e.target.value))}
        >
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1} className="bg-panel">{m}</option>
          ))}
        </select>
        <select
          className="bg-transparent text-sm font-semibold focus:outline-none cursor-pointer"
          value={year}
          onChange={(e) => goTo(Number(e.target.value), month)}
        >
          {years.map((y) => (
            <option key={y} value={y} className="bg-panel">{y}</option>
          ))}
        </select>
      </div>

      <button
        onClick={() => shift(1)}
        title="Proximo mes"
        className="w-8 h-8 grid place-items-center rounded-lg hover:bg-panel2 text-white/60 hover:text-white"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {!isCurrent && (
        <button
          onClick={() => goTo(currentYear, currentMonth)}
          title="Voltar pro mes atual"
          className="ml-1 h-8 px-2 rounded-lg text-xs font-semibold bg-accent/15 text-accent border border-accent/20 hover:bg-accent/25 inline-flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" /> Atual
        </button>
      )}
    </div>
  );
}
