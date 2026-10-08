"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp } from "lucide-react";
import {
  PRODUCT_LINES_CPPEM,
  PRODUCT_LINES_COLEGIO,
  type BU,
} from "@/lib/products";
import { todayISORecife } from "@/lib/calc";
import NewSaleModal from "./NewSaleModal";

export default function NewSaleButton({
  sellerBus,
  variant = "primary",
}: {
  sellerBus: BU[];
  variant?: "primary" | "ghost";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const selectLines = useMemo(() => {
    const arr: { id: string; label: string; group?: string }[] = [];
    if (sellerBus.includes("cppem")) {
      PRODUCT_LINES_CPPEM.forEach((l) =>
        arr.push({ id: l.id, label: l.label, group: "CPPEM" })
      );
    }
    if (sellerBus.includes("unicive")) {
      arr.push({ id: "matriculas", label: "Matriculas Unicive", group: "UNICIVE" });
    }
    if (sellerBus.includes("colegio_cppem")) {
      PRODUCT_LINES_COLEGIO.forEach((l) =>
        arr.push({ id: l.id, label: l.label, group: "Colegio CPPEM" })
      );
    }
    return arr;
  }, [sellerBus]);

  return (
    <>
      <button
        className={variant === "primary" ? "btn-primary text-sm" : "btn-ghost text-sm"}
        onClick={() => setOpen(true)}
      >
        <TrendingUp className="w-4 h-4" /> Lancar nova venda
      </button>
      <NewSaleModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={() => {
          // Nao precisamos manipular a lista aqui — refresh basta pro painel
          // re-renderizar com stats atualizadas.
          router.refresh();
        }}
        todayISO={todayISORecife()}
        sellerBus={sellerBus}
        selectLines={selectLines}
      />
    </>
  );
}
