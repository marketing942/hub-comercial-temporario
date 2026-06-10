"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Power, Trash2 } from "lucide-react";

type Seller = {
  id: string;
  name: string;
  bu: "cppem" | "unicive";
  active: boolean;
  avatar_color: string;
};

const COLORS = ["#7c5cff", "#22d3ee", "#22c55e", "#f59e0b", "#ef4444", "#f472b6", "#a78bfa"];

export default function SellersClient({ initial }: { initial: Seller[] }) {
  const router = useRouter();
  const [list, setList] = useState(initial);
  const [name, setName] = useState("");
  const [bu, setBu] = useState<"cppem" | "unicive">("cppem");
  const [color, setColor] = useState(COLORS[0]);
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!name.trim()) return;
    setBusy(true);
    const r = await fetch("/api/sellers", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: name.trim(), bu, avatar_color: color }),
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

  async function changeBU(s: Seller, newBu: "cppem" | "unicive") {
    await fetch(`/api/sellers/${s.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ bu: newBu }),
    });
    setList((l) => l.map((x) => (x.id === s.id ? { ...x, bu: newBu } : x)));
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
        <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_auto_auto] gap-3 items-end">
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
            <label className="label">BU</label>
            <select className="input" value={bu} onChange={(e) => setBu(e.target.value as any)}>
              <option value="cppem">CPPEM</option>
              <option value="unicive">UNICIVE</option>
            </select>
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
          <button className="btn-primary" onClick={add} disabled={busy || !name.trim()}>
            <Plus className="w-4 h-4" /> Adicionar
          </button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-white/40 bg-panel2">
            <tr className="text-left">
              <th className="p-3">Nome</th>
              <th className="p-3">BU</th>
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
            {list.map((s) => (
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
                  <select
                    value={s.bu}
                    onChange={(e) => changeBU(s, e.target.value as any)}
                    className="input h-8 w-32"
                  >
                    <option value="cppem">CPPEM</option>
                    <option value="unicive">UNICIVE</option>
                  </select>
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
