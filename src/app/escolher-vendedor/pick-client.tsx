"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Seller = { id: string; name: string; bu: "cppem" | "unicive"; avatar_color: string };

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
      {sellers.map((s) => (
        <button
          key={s.id}
          onClick={() => pick(s.id)}
          disabled={loading !== null}
          className="card card-hover text-left disabled:opacity-50"
        >
          <div
            className="w-10 h-10 rounded-xl grid place-items-center text-white font-semibold mb-3"
            style={{ background: s.avatar_color }}
          >
            {s.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <div className="font-medium">{s.name}</div>
          <div className={s.bu === "cppem" ? "chip-cppem mt-2" : "chip-unicive mt-2"}>
            {s.bu.toUpperCase()}
          </div>
          {loading === s.id && <div className="text-xs text-white/40 mt-2">Entrando...</div>}
        </button>
      ))}
    </div>
  );
}
