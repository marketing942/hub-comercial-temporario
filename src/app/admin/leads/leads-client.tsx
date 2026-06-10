"use client";
import { useEffect, useState } from "react";
import { Save } from "lucide-react";

type Seller = { id: string; name: string; bu: "cppem" | "unicive" };

const MONTHS = [
  "Janeiro","Fevereiro","Marco","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function LeadsClient({
  sellers,
  defaultYear,
  defaultMonth,
}: {
  sellers: Seller[];
  defaultYear: number;
  defaultMonth: number;
}) {
  const [date, setDate] = useState(todayISO());
  const [year, setYear] = useState(defaultYear);
  const [month, setMonth] = useState(defaultMonth);
  const [values, setValues] = useState<Record<string, number>>({});
  const [monthly, setMonthly] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    Promise.all(
      sellers.map((s) =>
        fetch(`/api/leads?seller_id=${s.id}&year=${year}&month=${month}`).then((r) => r.json())
      )
    ).then((all) => {
      const sum: Record<string, number> = {};
      const day: Record<string, number> = {};
      all.forEach((j: any, idx) => {
        const sellerId = sellers[idx].id;
        sum[sellerId] = (j.data || []).reduce((a: number, b: any) => a + Number(b.qty || 0), 0);
        day[sellerId] = (j.data || []).find((x: any) => x.date === date)?.qty || 0;
      });
      setMonthly(sum);
      setValues(day);
    });
  }, [date, year, month, sellers]);

  async function save() {
    setSaving(true);
    setSaved(null);
    const results = await Promise.all(
      sellers.map((s) =>
        fetch("/api/leads", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ seller_id: s.id, date, qty: Number(values[s.id] || 0) }),
        })
      )
    );
    setSaving(false);
    if (results.every((r) => r.ok)) {
      setSaved("Leads do dia salvos!");
      setTimeout(() => setSaved(null), 2000);
      const refreshed = await Promise.all(
        sellers.map((s) =>
          fetch(`/api/leads?seller_id=${s.id}&year=${year}&month=${month}`).then((r) => r.json())
        )
      );
      const sum: Record<string, number> = {};
      refreshed.forEach((j: any, idx) => {
        sum[sellers[idx].id] = (j.data || []).reduce(
          (a: number, b: any) => a + Number(b.qty || 0),
          0
        );
      });
      setMonthly(sum);
    } else {
      setSaved("Houve algum erro ao salvar.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="card grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div>
          <label className="label">Data</label>
          <input
            type="date"
            className="input"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              const d = new Date(e.target.value);
              setYear(d.getFullYear());
              setMonth(d.getMonth() + 1);
            }}
          />
        </div>
        <div>
          <label className="label">Mes de referencia</label>
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
            type="number"
            className="input"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
        </div>
        <button className="btn-primary" disabled={saving} onClick={save}>
          <Save className="w-4 h-4" /> {saving ? "Salvando..." : "Salvar leads do dia"}
        </button>
        {saved && <div className="md:col-span-4 text-xs text-success">{saved}</div>}
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-white/40 bg-panel2">
            <tr className="text-left">
              <th className="p-3">Vendedor</th>
              <th className="p-3">BU</th>
              <th className="p-3 w-44">Leads no dia</th>
              <th className="p-3 w-32">Total no mes</th>
            </tr>
          </thead>
          <tbody>
            {sellers.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-white/50">
                  Cadastre vendedores primeiro.
                </td>
              </tr>
            )}
            {sellers.map((s) => (
              <tr key={s.id} className="border-t border-border">
                <td className="p-3 font-medium">{s.name}</td>
                <td className="p-3">
                  <span className={s.bu === "cppem" ? "chip-cppem" : "chip-unicive"}>
                    {s.bu.toUpperCase()}
                  </span>
                </td>
                <td className="p-3">
                  <input
                    className="input h-9"
                    type="number"
                    min={0}
                    value={values[s.id] ?? 0}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [s.id]: Number(e.target.value) }))
                    }
                  />
                </td>
                <td className="p-3 font-semibold">{monthly[s.id] ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
