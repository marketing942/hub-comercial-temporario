import { periodNow } from "@/lib/calc";
import DiretoClient from "./direto-client";

export const dynamic = "force-dynamic";

export default function DiretoAdminPage() {
  const { year, month } = periodNow();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Canal Direto (Site)</h1>
        <p className="text-sm text-white/50">
          Lance as vendas atribuidas ao site/direct response e atualize as
          visitas diarias. Elas contam no faturamento e categoria do CPPEM.
        </p>
      </div>
      <DiretoClient defaultYear={year} defaultMonth={month} />
    </div>
  );
}
