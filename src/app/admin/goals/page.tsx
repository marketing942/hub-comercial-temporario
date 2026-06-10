import { listSellers } from "@/lib/data";
import { periodNow } from "@/lib/calc";
import GoalsClient from "./goals-client";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const sellers = await listSellers();
  const { year, month } = periodNow();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Metas do mes</h1>
        <p className="text-sm text-white/50">
          Defina as metas de cada vendedor por linha de produto, ticket medio e taxa de conversao.
        </p>
      </div>
      <GoalsClient sellers={sellers} defaultYear={year} defaultMonth={month} />
    </div>
  );
}
