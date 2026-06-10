import { listSellers } from "@/lib/data";
import { periodNow } from "@/lib/calc";
import LeadsClient from "./leads-client";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const sellers = await listSellers({ onlyActive: true });
  const { year, month } = periodNow();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Leads recebidos</h1>
        <p className="text-sm text-white/50">
          Atualize diariamente quantos leads cada vendedor recebeu. Eles entram no calculo de taxa de conversao.
        </p>
      </div>
      <LeadsClient sellers={sellers} defaultYear={year} defaultMonth={month} />
    </div>
  );
}
