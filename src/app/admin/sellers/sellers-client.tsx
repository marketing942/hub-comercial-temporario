"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Power, Trash2 } from "lucide-react";
import { BU_LABEL } from "@/lib/brand";

type Seller = {
  id: string;
  name: string;
  bu: "cppem" | "unicive";
  bus?: ("cppem" | "unicive")[];
  active: boolean;
  avatar_color: string;
};

const COLORS = ["#22c55e", "#06b6d4", "#a3e635", "#facc15", "#ef4444", "#f472b6", "#7c5cff"];

function busOf(s: Seller): ("cppem" | "unicive")[] {
  const arr = Array.isArray(s.bus) ? s.bus.filter((x) => x === "cppem" || x === "unicive") : [];
  return arr.length > 0 ? Array.from(new Set(arr)) : [s.bu];
}

export default function SellersClient({ initial }: { initial: Seller[] }) {
  const router = useRouter();
  const [list, setList] = useState(initial);
  const [name, setName] = useState("");
  const [bus, setBus] = useState<("cppem" | "unicive")[]>(["cppem"]);
  const [color, setColor] = useState(COLORS[0]);
  const [busy, setBusy] = useState(false);

  function toggleBu(b: "cppem" | "unicive") {
    setBus((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]
    );
  }

  async function add() {
    if (!name.trim() || bus.length === 0) return;
    setBusy(true);
    const r = await fetch("/api/sellers", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: name.trim(), bus, bu: bus[0], avatar_color: color }),
    });
    setBusy(false);
    if (r.ok) {
      const { data } = await r.json();
      setList((l) => [...l, data].sort((a, b) => a.name.localeCompare(b.name)));
      setName("");
      router.refresh();
    }
  }

  async function toggle(s: Seller) {
    await fetch(`/api/sellers/${s.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ active: !s.active }),
    });
    setList((l) => l.map((x) => (x.id === s.id ? { ...x, active: !x.active } : x)));
    router.refresh();
  }

  async function rename(s: Seller, newName: string) {
    await fetch(`/api/sellers/${s.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    setList((l) => l.map((x) => (x.id === s.id ? { ...x, name: newName } : x)));
    router.refresh();
  }

  async function changeBUs(s: Seller, newBus: ("cppem" | "unicive")[]) {
    if (newBus.length === 0) return;
    await fetch(`/api/sellers/${s.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ bus: newBus }),
    });
    setList((l) =>
      l.map((x) => (x.id === s.id ? { ...x, bus: newBus, bu: newBus[0] } : x))
    );
    router.refresh();
  }

  async function remove(s: Seller) {
    if (!confirm(`Remover ${s.name}? Vendas e metas serao apagadas.`)) return;
    await fetch(`/api/sellers/${s.id}`, { method: "DELETE" });
    setList((l) => l.filter((x) => x.id !== s.id));
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_220px_auto_auto] gap-3 items-end">
          <div>
            <label className="label">Nome do vendedor</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Joana Silva"
            />
          </div>
          <div>
            <label className="label">BU(s) — pode marcar as duas</label>
            <div className="flex gap-2">
              {(["cppem", "unicive"] as const).map((b) => {
                const active = bus.includes(b);
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => toggleBu(b)}
                    className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                      active
                        ? "bg-accent text-black border-accent"
                        : "bg-panel2 text-white/60 border-border hover:text-white"
                    }`}
                  >
                    {BU_LABEL[b]}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="label">Cor</label>
            <div className="flex gap-1">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-lg border-2"
                  style={{ background: c, borderColor: color === c ? "#fff" : "transparent" }}
                />
              ))}
            </div>
          </div>
          <button
            className="btn-primary"
            onClick={add}
            disabled={busy || !name.trim() || bus.length === 0}
          >
            <Plus className="w-4 h-4" /> Adicionar
          </button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-white/40 bg-panel2">
            <tr className="text-left">
              <th className="p-3">Nome</th>
              <th className="p-3">BUs</th>
              <th className="p-3">Status</th>
              <th className="p-3 w-32"></th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-white/50">
                  Nenhum vendedor cadastrado.
                </td>
              </tr>
            )}
            {list.map((s) => {
              const sellerBus = busOf(s);
              return (
                <tr key={s.id} className="border-t border-border">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg grid place-items-center text-xs font-semibold"
                        style={{ background: s.avatar_color }}
                      >
                        {s.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                      </div>
                      <input
                        defaultValue={s.name}
                        onBlur={(e) =>
                          e.target.value.trim() && e.target.value !== s.name && rename(s, e.target.value.trim())
                        }
                        className="bg-transparent border-b border-transparent hover:border-border focus:border-accent focus:outline-none"
                      />
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1.5">
                      {(["cppem", "unicive"] as const).map((b) => {
                        const active = sellerBus.includes(b);
                        return (
                          <button
                            key={b}
                            onClick={() => {
                              const next = active
                                ? sellerBus.filter((x) => x !== b)
                                : [...sellerBus, b];
                              if (next.length === 0) return;
                              changeBUs(s, next);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition ${
                              active
                                ? b === "cppem"
                                  ? "bg-cppem/20 text-cppem border-cppem/40"
                                  : "bg-unicive/20 text-unicive border-unicive/40"
                                : "bg-panel2 text-white/40 border-border"
                            }`}
                          >
                            {BU_LABEL[b]}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`chip ${s.active ? "bg-success/15 text-success" : "bg-white/10 text-white/50"}`}>
                      {s.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button className="btn-ghost h-8 px-2 mr-2" onClick={() => toggle(s)}>
                      <Power className="w-3.5 h-3.5" />
                    </button>
                    <button className="btn-danger h-8 px-2" onClick={() => remove(s)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
