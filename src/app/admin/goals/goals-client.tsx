"use client";
import { useEffect, useMemo, useState } from "react";
import { PRODUCT_LINES_CPPEM, PRODUCT_LINES_UNICIVE } from "@/lib/products";
import { Save, RotateCw } from "lucide-react";

type Seller = { id: string; name: string; bu: "cppem" | "unicive"; active: boolean };

type ProductGoal = { product_line: string; valor_meta: number; quantidade_meta: number };

const MONTHS = [
  "Janeiro","Fevereiro","Marco","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

export default function GoalsClient({
  sellers,
  defaultYear,
  defaultMonth,
}: {
  sellers: Seller[];
  defaultYear: number;
  defaultMonth: number;
}) {
  const [sellerId, setSellerId] = useState(sellers[0]?.id || "");
  const [year, setYear] = useState(defaultYear);
  const [month, setMonth] = useState(defaultMonth);
  const [ticket, setTicket] = useState(0);
  const [conv, setConv] = useState(0);
  const [products, setProducts] = useState<ProductGoal[]>([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  const seller = sellers.find((s) => s.id === sellerId) || null;
  const lines = useMemo(
    () => (seller?.bu === "unicive" ? PRODUCT_LINES_UNICIVE : PRODUCT_LINES_CPPEM),
    [seller?.bu]
  );

  useEffect(() => {
    if (!sellerId) return;
    setLoading(true);
    fetch(`/api/goals?seller_id=${sellerId}&year=${year}&month=${month}`)
      .then((r) => r.json())
      .then((j) => {
        setTicket(Number(j?.monthly?.ticket_medio_meta || 0));
        setConv(Number(j?.monthly?.taxa_conversao_meta || 0));
        const merged = (lines as readonly { id: string }[]).map((l) => {
          const found = (j?.products || []).find((p: any) => p.product_line === l.id);
          return {
            product_line: l.id,
            valor_meta: Number(found?.valor_meta || 0),
            quantidade_meta: Number(found?.quantidade_meta || 0),
          } as ProductGoal;
        });
        setProducts(merged);
      })
      .finally(() => setLoading(false));
  }, [sellerId, year, month, lines]);

  function updateProduct(idx: number, patch: Partial<ProductGoal>) {
    setProducts((p) => p.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  }

  async function save() {
    setLoading(true);
    setSaved(null);
    const r = await fetch("/api/goals", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        seller_id: sellerId,
        year,
        month,
        ticket_medio_meta: ticket,
        taxa_conversao_meta: conv,
        product_goals: products,
      }),
    });
    setLoading(false);
    if (r.ok) {
      setSaved("Salvo!");
      setTimeout(() => setSaved(null), 2000);
    } else {
      const j = await r.json().catch(() => ({}));
      setSaved("Erro: " + (j.error || "tente novamente"));
    }
  }

  if (sellers.length === 0) {
    return (
      <div className="card text-sm text-white/60">
        Cadastre vendedores primeiro em <a href="/admin/sellers" className="text-accent">Vendedores</a>.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="label">Vendedor</label>
          <select className="input" value={sellerId} onChange={(e) => setSellerId(e.target.value)}>
            {sellers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.bu.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Mes</label>
          <select className="input" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Ano</label>
          <input
            className="input"
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
        </div>
        <div className="flex items-end">
          <button className="btn-primary w-full" disabled={loading} onClick={save}>
            {loading ? <RotateCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {loading ? "Salvando..." : "Salvar metas"}
          </button>
        </div>
        {saved && <div className="md:col-span-4 text-xs text-success">{saved}</div>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <div className="text-sm font-semibold mb-1">Ticket medio (meta)</div>
          <div className="text-xs text-white/50 mb-3">Quanto, em media, cada venda deve valer.</div>
          <div className="flex items-center gap-2">
            <span className="text-white/40 text-sm">R$</span>
            <input
              className="input"
              type="number"
              step="0.01"
              value={ticket}
              onChange={(e) => setTicket(Number(e.target.value))}
            />
          </div>
        </div>
        <div className="card">
          <div className="text-sm font-semibold mb-1">Taxa de conversao (meta)</div>
          <div className="text-xs text-white/50 mb-3">% de leads recebidos que viram venda.</div>
          <div className="flex items-center gap-2">
            <input
              className="input"
              type="number"
              step="0.1"
              value={conv}
              onChange={(e) => setConv(Number(e.target.value))}
            />
            <span className="text-white/40 text-sm">%</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="text-sm font-semibold mb-3">
          Metas por linha de produto - {seller?.bu === "unicive" ? "UNICIVE" : "CPPEM"}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-white/40">
              <tr className="text-left">
                <th className="py-2">Linha</th>
                <th>Meta faturamento</th>
                <th>Meta quantidade</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => {
                const label = (lines as readonly { id: string; label: string }[]).find(
                  (l) => l.id === p.product_line
                )?.label;
                return (
                  <tr key={p.product_line} className="border-t border-border">
                    <td className="py-2">{label}</td>
                    <td>
                      <input
                        className="input"
                        type="number"
                        step="0.01"
                        value={p.valor_meta}
                        onChange={(e) =>
                          updateProduct(i, { valor_meta: Number(e.target.value) })
                        }
                      />
                    </td>
                    <td>
                      <input
                        className="input"
                        type="number"
                        value={p.quantidade_meta}
                        onChange={(e) =>
                          updateProduct(i, { quantidade_meta: Number(e.target.value) })
                        }
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {seller?.bu === "unicive" && (
          <div className="text-xs text-white/50 mt-3">
            Lembrete: para Unicive, a meta principal e a <b>quantidade de matriculas</b>.
          </div>
        )}
      </div>
    </div>
  );
}
