import { listSellers } from "@/lib/data";
import PickSellerClient from "./pick-client";

export const dynamic = "force-dynamic";

export default async function PickSellerPage() {
  const sellers = await listSellers({ onlyActive: true });
  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-xl font-semibold mb-1">Quem esta entrando?</h1>
        <p className="text-sm text-white/50 mb-6">
          Escolha seu nome para abrir o seu painel.
        </p>
        <PickSellerClient sellers={sellers} />
      </div>
    </div>
  );
}
