"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Power, Trash2 } from "lucide-react";
import { BU_LABEL, BU_COLOR } from "@/lib/brand";
import { ALL_BUS, type BU } from "@/lib/products";

type Seller = {
  id: string;
  name: string;
  bu: BU;
  bus?: BU[];
  active: boolean;
  avatar_color: string;
};

function busOf(s: Seller): BU[] {
  const arr = Array.isArray(s.bus)
    ? s.bus.filter((x) => x === "cppem" || x === "unicive" || x === "colegio_cppem")
    : [];
  return arr.length > 0 ? Array.from(new Set(arr)) : [s.bu];
}

export default function SellersClient({ initial }: { initial: Seller[] }) {
  const router = useRouter();
  const [list, setList] = useState(initial);
  const [name, setName] = useState("");
  const [bus, setBus] = useState<BU[]>(["cppem"]);
  const [busy, setBusy] = useState(false);

  function toggleBu(b: BU) {
    setBus((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]));
  }

  async function add() {
    if (!name.trim() || bus.length === 0) return;
    setBusy(true);
    const r = await fetch("/api/sellers", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: name.trim(), bus, bu: bus[0] }),
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

  async function changeBUs(s: Seller, newBus: BU[]) {
    if (newBus.length === 0) return;
    await fetch(`/api/sellers/${s.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ bus: newBus }),
    });
    setList((l) => l.map((x) => (x.id === s.id ? { ...x, bus: newBus, bu: newBus[0] } : x)));
    router.refresh();
  }

  async function remove(s: Seller) {
    if (!confirm(`Remover ${s.name}? Vendas e metas serao apagadas.`)) return;
    await fetch(`/api/sellers/${s.id}`, { method: "DELETE" });
    setList((l) => l.filter((x) => x.id !== s.id));
    router.refresh();
  }

  // Agrupa por BU primaria (s.bu)
  const grouped = useMemo(() => {
    const out: Record<BU, Seller[]> = {
      cppem: [],
      unicive: [],
      colegio_cppem: [],
    };
    for (const s of list) {
      const arr = out[s.bu] || (out[s.bu] = []);
      arr.push(s);
    }
    for (const k of Object.keys(out) as BU[]) {
      out[k].sort((a, b) => a.name.localeCompare(b.name));
    }
    return out;
  }, [list]);

  return (
    <div className="space-y-5">
      {/* Form de adicionar */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 items-end">
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
            <label className="label">BU(s)</label>
            <div className="flex gap-2 flex-wrap">
              {ALL_BUS.map((b) => {
                const active = bus.includes(b);
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => toggleBu(b)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
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
          <button
            className="btn-primary"
            onClick={add}
            disabled={busy || !name.trim() || bus.length === 0}
          >
            <Plus className="w-4 h-4" /> Adicionar
          </button>
        </div>
      </div>

      {/* Tabelas agrupadas por BU */}
      {ALL_BUS.map((bu) => {
        const rows = grouped[bu];
        const color = BU_COLOR[bu];
        return (
          <section key={bu} className="space-y-2">
            <div className="flex items-center gap-3">
              <div
                className="px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: color + "22", color }}
              >
                {BU_LABEL[bu]}
              </div>
              <div className="flex-1 h-px" style={{ background: color + "33" }} />
              <div className="text-[11px] text-white/40">
                {rows.length} vendedor{rows.length === 1 ? "" : "es"}
              </div>
            </div>

            <div className="card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="text-[10px] uppercase tracking-wider text-white/40 bg-panel2/60">
                  <tr className="text-left">
                    <th className="p-3">Nome</th>
                    <th className="p-3">Atua em</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 w-28"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-white/40 text-xs">
                        Nenhum vendedor nesta BU.
                      </td>
                    </tr>
                  )}
                  {rows.map((s) => {
                    const sBus = busOf(s);
                    return (
                      <tr key={s.id} className="border-t border-border">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-accent/20 text-accent grid place-items-center text-xs font-semibold">
                              {s.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                            </div>
                            <input
                              defaultValue={s.name}
                              onBlur={(e) =>
                                e.target.value.trim() &&
                                e.target.value !== s.name &&
                                rename(s, e.target.value.trim())
                              }
                              className="bg-transparent border-b border-transparent hover:border-border focus:border-accent focus:outline-none"
                            />
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1.5 flex-wrap">
                            {ALL_BUS.map((b) => {
                              const active = sBus.includes(b);
                              return (
                                <button
                                  key={b}
                                  onClick={() => {
                                    const next = active
                                      ? sBus.filter((x) => x !== b)
                                      : [...sBus, b];
                                    if (next.length === 0) return;
                                    changeBUs(s, next);
                                  }}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition ${
                                    active
                                      ? b === "cppem"
                                        ? "bg-cppem/20 text-cppem border-cppem/40"
                                        : b === "unicive"
                                        ? "bg-unicive/20 text-unicive border-unicive/40"
                                        : "bg-colegio/20 text-colegio border-colegio/40"
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
                          <span
                            className={`chip ${
                              s.active
                                ? "bg-success/15 text-success"
                                : "bg-white/10 text-white/50"
                            }`}
                          >
                            {s.active ? "Ativo" : "Inativo"}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            className="btn-ghost h-8 px-2 mr-2"
                            onClick={() => toggle(s)}
                            title={s.active ? "Inativar" : "Ativar"}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                          <button
                            className="btn-danger h-8 px-2"
                            onClick={() => remove(s)}
                            title="Remover"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}
