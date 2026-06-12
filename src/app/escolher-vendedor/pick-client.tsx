"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Avatar from "@/components/Avatar";
import { BU_LABEL } from "@/lib/brand";

type Seller = {
  id: string;
  name: string;
  bu: "cppem" | "unicive" | "colegio_cppem";
  bus?: ("cppem" | "unicive" | "colegio_cppem")[];
  avatar_color: string;
  avatar_url?: string | null;
};

function busOf(s: Seller): ("cppem" | "unicive" | "colegio_cppem")[] {
  const arr = Array.isArray(s.bus) ? s.bus.filter((x) => x === "cppem" || x === "unicive") : [];
  return arr.length > 0 ? Array.from(new Set(arr)) : [s.bu];
}

export default function PickSellerClient({ sellers }: { sellers: Seller[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function pick(id: string) {
    setLoading(id);
    const res = await fetch("/api/auth/seller", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sellerId: id }),
    });
    setLoading(null);
    if (res.ok) router.push("/dashboard");
  }

  if (sellers.length === 0) {
    return (
      <div className="card">
        <p className="text-sm text-white/60">
          Nenhum vendedor cadastrado ainda. Peca para o administrador cadastrar.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {sellers.map((s) => {
        const sBus = busOf(s);
        return (
          <button
            key={s.id}
            onClick={() => pick(s.id)}
            disabled={loading !== null}
            className="card card-hover text-left disabled:opacity-50"
          >
            <Avatar
              name={s.name}
              url={s.avatar_url}
              color={s.avatar_color}
              size={48}
              className="mb-3"
            />
            <div className="font-medium">{s.name}</div>
            <div className="flex gap-1 mt-2">
              {sBus.map((b) => (
                <span
                  key={b}
                  className={
                    b === "cppem"
                      ? "chip-cppem"
                      : b === "unicive"
                      ? "chip-unicive"
                      : "chip-colegio"
                  }
                >
                  {BU_LABEL[b]}
                </span>
              ))}
            </div>
            {loading === s.id && <div className="text-xs text-white/40 mt-2">Entrando...</div>}
          </button>
        );
      })}
    </div>
  );
}
