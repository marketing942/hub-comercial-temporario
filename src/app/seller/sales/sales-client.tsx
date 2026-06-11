"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { productLabel, productLinesFor, TURMAS, type BU } from "@/lib/products";
import { BRL, fmtInt } from "@/lib/calc";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import NumberField from "@/components/NumberField";

type Sale = {
  id: string;
  sale_date: string;
  product_line: string;
  valor: number;
  quantidade: number;
  observacao?: string | null;
};

type Seller = { id: string; name: string; bu: BU };

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function SalesClient({ seller, initial }: { seller: Seller; initial: Sale[] }) {
  const router = useRouter();
  const [list, setList] = useState<Sale[]>(initial);

  // form state
  const [date, setDate] = useState(todayISO());
  const isCppem = seller.bu === "cppem";
  const baseLines = productLinesFor(seller.bu);
  // Para CPPEM, em vez de listar as 3 turmas, usamos "Turma Presencial" e um sub-select
  const selectLines = isCppem
    ? [
        { id: "mentorias", label: "Mentorias" },
        { id: "cursos_digitais", label: "Cursos e Materiais Digitais" },
        { id: "fisicos", label: "Produtos Fisicos" },
        { id: "turma_presencial", label: "Turma Presencial" },
      ]
    : baseLines;

  const [line, setLine] = useState<string>(selectLines[0].id);
  const [turma, setTurma] = useState<string>(TURMAS[0].id);
  const [valor, setValor] = useState<number>(0);
  const [qtd, setQtd] = useState<number>(1);
  const [obs, setObs] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const totalValor = useMemo(() => list.reduce((a, b) => a + Number(b.valor || 0), 0), [list]);
  const totalQtd = useMemo(() => list.reduce((a, b) => a + Number(b.quantidade || 0), 0), [list]);

  async function add() {
    setSaving(true);
    const product_line = isCppem && line === "turma_presencial" ? turma : line;
    const r = await fetch("/api/sales", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sale_date: date,
        product_line,
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
      alert("Erro ao salvar venda.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="text-sm font-semibold mb-3">Lancar nova venda</div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
          <div>
            <label className="label">Data</label>
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className={isCppem && line === "turma_presencial" ? "md:col-span-1" : "md:col-span-2"}>
            <label className="label">Linha de produto</label>
            <select className="input" value={line} onChange={(e) => setLine(e.target.value)}>
              {selectLines.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          {isCppem && line === "turma_presencial" && (
            <div>
              <label className="label">Turma</label>
              <select className="input" value={turma} onChange={(e) => setTurma(e.target.value)}>
                {TURMAS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="label">Valor (R$)</label>
            <NumberField step="0.01" className="input" value={valor} onChange={setValor} />
          </div>
          <div>
            <label className="label">Quantidade</label>
            <NumberField min={1} className="input" value={qtd} onChange={setQtd} />
          </div>
          <button className="btn-primary" disabled={saving || !valor} onClick={add}>
            <Plus className="w-4 h-4" /> Lancar
          </button>
        </div>
        <div className="mt-3">
          <label className="label">Observacao (opcional)</label>
          <input
            className="input"
            placeholder="Ex: aluno do PMAL turma 2026"
            value={obs}
            onChange={(e) => setObs(e.target.value)}
          />
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="text-sm font-semibold">Vendas do mes</div>
          <div className="text-xs text-white/60">
            {list.length} venda{list.length === 1 ? "" : "s"} - {BRL.format(totalValor)} - {fmtInt.format(totalQtd)}{" "}
            unidade{totalQtd === 1 ? "" : "s"}
          </div>
        </div>
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-white/40 bg-panel2">
            <tr className="text-left">
              <th className="p-3">Data</th>
              <th className="p-3">Produto</th>
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
                  Nenhuma venda este mes. Lance a primeira acima.
                </td>
              </tr>
            )}
            {list.map((s) => (
              <Row
                key={s.id}
                sale={s}
                isCppem={isCppem}
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
  isCppem,
  onChange,
  onDelete,
  onAfter,
}: {
  sale: Sale;
  isCppem: boolean;
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

  const cppemLines = [
    { id: "mentorias", label: "Mentorias" },
    { id: "cursos_digitais", label: "Cursos e Materiais Digitais" },
    { id: "fisicos", label: "Produtos Fisicos" },
    { id: "turma_pmal", label: "Turma PMAL" },
    { id: "turma_pmpe", label: "Turma PMPE" },
    { id: "turma_carreiras", label: "Turma Carreiras Policiais" },
  ];
  const uniLines = [{ id: "matriculas", label: "Matriculas" }];
  const lines = isCppem ? cppemLines : uniLines;

  async function save() {
    const r = await fetch(`/api/sales/${sale.id}`, {
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
    if (!confirm("Remover essa venda?")) return;
    const r = await fetch(`/api/sales/${sale.id}`, { method: "DELETE" });
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
          {lines.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
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
