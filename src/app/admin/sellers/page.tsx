import { listSellers } from "@/lib/data";
import SellersClient from "./sellers-client";

export const dynamic = "force-dynamic";

export default async function SellersPage() {
  const sellers = await listSellers();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Vendedores</h1>
        <p className="text-sm text-white/50">
          Cadastre os vendedores e atribua a BU (CPPEM ou Unicive).
        </p>
      </div>
      <SellersClient initial={sellers} />
    </div>
  );
}
