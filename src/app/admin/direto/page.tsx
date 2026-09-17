import { periodNow } from "@/lib/calc";
import DiretoClient from "./direto-client";

export const dynamic = "force-dynamic";

export default function DiretoAdminPage() {
  const { year, month } = periodNow();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Direto / IA</h1>
        <p className="text-sm text-white/50">
          Lance as vendas do site (direto) e as vendas fechadas pelas IAs de
          atendimento (podem ser CPPEM ou UNICIVE). Todas contam nas metas
          coletivas da BU. Atualize tambem as visitas diarias do site.
        </p>
      </div>
      <DiretoClient defaultYear={year} defaultMonth={month} />
    </div>
  );
}
