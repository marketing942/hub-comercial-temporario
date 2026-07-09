"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Pencil, Trash2, Check, X } from "lucide-react";
import NumberField from "@/components/NumberField";
import { BRL, fmtInt } from "@/lib/calc";
import { PRODUCT_LINES_CPPEM, productLabel } from "@/lib/products";

type Sale = {
  id: string;
  sale_date: string;
  product_line: string;
  valor: number;
  quantidade: number;
  observacao?: string | null;
};

const MONTHS = [
  "Janeiro","Fevereiro","Marco","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function DiretoClient({
  defaultYear,
  defaultMonth,
}: {
  defaultYear: number;
  defaultMonth: number;
}) {
  const router = useRouter();
  const [year, setYear] = useState(defaultYear);
  const [month, setMonth] = useState(defaultMonth);

  const [list, setList] = useState<Sale[]>([]);
  const [visits, setVisits] = useState<Record<string, number>>({}); // date -> qty

  // form de nova venda
  const [date, setDate] = useState(todayISO());
  const [line, setLine] = useState<string>(PRODUCT_LINES_CPPEM[0].id);
  const [valor, setValor] = useState<number>(0);
  const [qtd, setQtd] = useState<number>(1);
  const [obs, setObs] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // form de visita
  const [visitDate, setVisitDate] = useState(todayISO());
  const [visitQty, setVisitQty] = useState<number>(0);
  const [visitSaving, setVisitSaving] = useState(false);
  const [visitFeedback, setVisitFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadSales();
    loadVisits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  async function loadSales() {
    const r = await fetch(`/api/direct/sales?year=${year}&month=${month}`);
    const j = await r.json();
    setList(j.data || []);
  }
  async function loadVisits() {
    const r = await fetch(`/api/direct/visits?year=${year}&month=${month}`);
    const j = await r.json();
    const map: Record<string, number> = {};
    for (const v of j.data || []) map[v.date] = Number(v.qty || 0);
    setVisits(map);
    // preenche o input com o valor do dia escolhido
    setVisitQty(map[visitDate] || 0);
  }

  useEffect(() => {
    setVisitQty(visits[visitDate] || 0);
  }, [visitDate, visits]);

  const totalValor = useMemo(() => list.reduce((a, b) => a + Number(b.valor || 0), 0), [list]);
  const totalQtd = useMemo(() => list.reduce((a, b) => a + Number(b.quantidade || 0), 0), [list]);
  const totalVisits = useMemo(() => Object.values(visits).reduce((a, b) => a + b, 0), [visits]);

  async function addSale() {
    if (!valor) return;
    setSaving(true);
    const r = await fetch("/api/direct/sales", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sale_date: date,
        product_line: line,
        valor,
        quantidade: qtd,
        observacao: obs || null,
      }),
    });
    setSaving(false);
    if (r.ok) {
      const { data } = await r.json();
      setList((l) => [data, ...l]);
      setValor(0);
      setQtd(1);
      setObs("");
      router.refresh();
    } else {
      alert("Erro ao lancar venda do direto.");
    }
  }

  async function saveVisit() {
    setVisitSaving(true);
    setVisitFeedback(null);
    const r = await fetch("/api/direct/visits", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ date: visitDate, qty: visitQty }),
    });
    setVisitSaving(false);
    if (r.ok) {
      setVisits((v) => ({ ...v, [visitDate]: visitQty }));
      setVisitFeedback("Visitas do dia salvas.");
      setTimeout(() => setVisitFeedback(null), 2000);
      router.refresh();
    } else {
      setVisitFeedback("Erro ao salvar.");
    }
  }

  return (
    <div className="space-y-4">
      {/* Seletor de periodo */}
      <div className="card grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <div>
          <label className="label">Mes</label>
          <select className="input" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Ano</label>
          <NumberField className="input" value={year} onChange={setYear} />
        </div>
        <div className="text-xs text-white/60 leading-tight">
          <div>
            <b className="text-white">{list.length}</b> vendas -{" "}
            <b className="text-white">{BRL.format(totalValor)}</b> -{" "}
            <b className="text-white">{fmtInt.format(totalQtd)}</b> un.
          </div>
          <div>
            <b className="text-white">{fmtInt.format(totalVisits)}</b> visitas no mes
          </div>
        </div>
      </div>

      {/* Form nova venda */}
      <div className="card">
        <div className="text-sm font-semibold mb-3">Lancar nova venda do direto</div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
          <div>
            <label className="label">Data</label>
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Categoria (CPPEM)</label>
            <select className="input" value={line} onChange={(e) => setLine(e.target.value)}>
              {PRODUCT_LINES_CPPEM.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Valor (R$)</label>
            <NumberField step="0.01" className="input" value={valor} onChange={setValor} />
          </div>
          <div>
            <label className="label">Quantidade</label>
            <NumberField min={1} className="input" value={qtd} onChange={setQtd} />
          </div>
          <button className="btn-primary" disabled={saving || !valor} onClick={addSale}>
            <Plus className="w-4 h-4" /> Lancar
          </button>
        </div>
        <div className="mt-3">
          <label className="label">Observacao (opcional)</label>
          <input
            className="input"
            placeholder="Ex: campanha X, cupom Y..."
            value={obs}
            onChange={(e) => setObs(e.target.value)}
          />
        </div>
      </div>

      {/* Form visitas diarias */}
      <div className="card">
        <div className="text-sm font-semibold mb-3">Visitas diarias do site</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="label">Data</label>
            <input type="date" className="input" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Visitas no dia</label>
            <NumberField min={0} className="input" value={visitQty} onChange={setVisitQty} />
          </div>
          <button className="btn-primary" onClick={saveVisit} disabled={visitSaving}>
            <Save className="w-4 h-4" /> {visitSaving ? "Salvando..." : "Salvar visitas"}
          </button>
          {visitFeedback && <div className="text-xs text-success">{visitFeedback}</div>}
        </div>
        <div className="text-[11px] text-white/40 mt-2">
          Total no mes: <b className="text-white">{fmtInt.format(totalVisits)}</b> visitas.
          Usado no calculo de conversao do direto (qtd vendida / visitas).
        </div>
      </div>

      {/* Tabela de vendas do direto */}
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="text-sm font-semibold">Vendas do direto no mes</div>
          <div className="text-xs text-white/60">
            {list.length} venda{list.length === 1 ? "" : "s"} - {BRL.format(totalValor)}
          </div>
        </div>
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-white/40 bg-panel2">
            <tr className="text-left">
              <th className="p-3">Data</th>
              <th className="p-3">Categoria</th>
              <th className="p-3">Valor</th>
              <th className="p-3">Qtd</th>
              <th className="p-3">Obs</th>
              <th className="p-3 w-32"></th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-white/50">
                  Nenhuma venda do direto este mes.
                </td>
              </tr>
            )}
            {list.map((s) => (
              <Row
                key={s.id}
                sale={s}
                onChange={(p) => setList((l) => l.map((x) => (x.id === s.id ? { ...x, ...p } : x)))}
                onDelete={() => setList((l) => l.filter((x) => x.id !== s.id))}
                onAfter={() => router.refresh()}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({
  sale,
  onChange,
  onDelete,
  onAfter,
}: {
  sale: Sale;
  onChange: (p: Partial<Sale>) => void;
  onDelete: () => void;
  onAfter: () => void;
}) {
  const [edit, setEdit] = useState(false);
  const [date, setDate] = useState(sale.sale_date);
  const [line, setLine] = useState(sale.product_line);
  const [valor, setValor] = useState(Number(sale.valor));
  const [qtd, setQtd] = useState(Number(sale.quantidade));
  const [obs, setObs] = useState(sale.observacao || "");

  async function save() {
    const r = await fetch(`/api/direct/sales/${sale.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sale_date: date, product_line: line, valor, quantidade: qtd, observacao: obs }),
    });
    if (r.ok) {
      onChange({ sale_date: date, product_line: line, valor, quantidade: qtd, observacao: obs });
      setEdit(false);
      onAfter();
    }
  }
  async function remove() {
    if (!confirm("Remover essa venda do direto?")) return;
    const r = await fetch(`/api/direct/sales/${sale.id}`, { method: "DELETE" });
    if (r.ok) {
      onDelete();
      onAfter();
    }
  }

  if (!edit) {
    return (
      <tr className="border-t border-border">
        <td className="p-3">{new Date(sale.sale_date + "T00:00").toLocaleDateString("pt-BR")}</td>
        <td className="p-3">{productLabel(sale.product_line)}</td>
        <td className="p-3 font-semibold">{BRL.format(Number(sale.valor))}</td>
        <td className="p-3">{sale.quantidade}</td>
        <td className="p-3 text-white/60">{sale.observacao || "-"}</td>
        <td className="p-3 text-right">
          <button className="btn-ghost h-8 px-2 mr-1" onClick={() => setEdit(true)}>
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button className="btn-danger h-8 px-2" onClick={remove}>
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-border bg-panel2/40">
      <td className="p-2">
        <input type="date" className="input h-9" value={date} onChange={(e) => setDate(e.target.value)} />
      </td>
      <td className="p-2">
        <select className="input h-9" value={line} onChange={(e) => setLine(e.target.value)}>
          {PRODUCT_LINES_CPPEM.map((l) => (
            <option key={l.id} value={l.id}>{l.label}</option>
          ))}
        </select>
      </td>
      <td className="p-2">
        <NumberField step="0.01" className="input h-9" value={valor} onChange={setValor} />
      </td>
      <td className="p-2">
        <NumberField className="input h-9" value={qtd} onChange={setQtd} />
      </td>
      <td className="p-2">
        <input className="input h-9" value={obs} onChange={(e) => setObs(e.target.value)} />
      </td>
      <td className="p-2 text-right">
        <button className="btn-primary h-8 px-2 mr-1" onClick={save}>
          <Check className="w-3.5 h-3.5" />
        </button>
        <button className="btn-ghost h-8 px-2" onClick={() => setEdit(false)}>
          <X className="w-3.5 h-3.5" />
        </button>
      </td>
    </tr>
  );
}
