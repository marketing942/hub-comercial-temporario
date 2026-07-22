"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  productLabel,
  productLinesFor,
  TURMAS,
  type BU,
  LIGACAO_STATUSES,
  ligacaoShort,
  ligacaoColor,
  INDICACAO_STATUSES,
  indicacaoShort,
  indicacaoColor,
  PRODUCT_LINES_COLEGIO,
} from "@/lib/products";
import { BRL, fmtInt } from "@/lib/calc";
import { Plus, Pencil, Trash2, Check, X, Phone, UserPlus, User } from "lucide-react";
import NumberField from "@/components/NumberField";

type Sale = {
  id: string;
  sale_date: string;
  product_line: string;
  valor: number;
  quantidade: number;
  cliente_nome?: string | null;
  observacao?: string | null;
  ligacao_status?: string | null;
  indicacao_status?: string | null;
};

type Seller = { id: string; name: string; bu: BU; bus?: BU[] };

function busOf(s: Seller): BU[] {
  const arr = Array.isArray(s.bus) ? s.bus : [];
  return arr.length > 0 ? arr : [s.bu];
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function SalesClient({ seller, initial }: { seller: Seller; initial: Sale[] }) {
  const router = useRouter();
  const [list, setList] = useState<Sale[]>(initial);

  const [date, setDate] = useState(todayISO());
  const sellerBus = busOf(seller);
  const hasCppem = sellerBus.includes("cppem");
  const hasUnicive = sellerBus.includes("unicive");
  const hasColegio = sellerBus.includes("colegio_cppem");
  const selectLines: { id: string; label: string; group?: string }[] = [];
  if (hasCppem) {
    selectLines.push(
      { id: "mentorias", label: "Mentorias", group: "CPPEM" },
      { id: "cursos_digitais", label: "Cursos e Materiais Digitais", group: "CPPEM" },
      { id: "fisicos", label: "Produtos Fisicos", group: "CPPEM" },
      { id: "turmas_eventos", label: "Turmas Presenciais e Eventos", group: "CPPEM" },
    );
  }
  if (hasUnicive) {
    selectLines.push({ id: "matriculas", label: "Matriculas Unicive", group: "UNICIVE" });
  }
  if (hasColegio) {
    PRODUCT_LINES_COLEGIO.forEach((l) =>
      selectLines.push({ id: l.id, label: l.label, group: "Colegio CPPEM" })
    );
  }
  // Para CPPEM com turmas/eventos, mostra um sub-select com a turma
  const isCppemTurma = (id: string) => id === "turmas_eventos";

  const [line, setLine] = useState<string>(selectLines[0]?.id || "");
  const [turma, setTurma] = useState<string>(TURMAS[0].id);
  const [valor, setValor] = useState<number>(0);
  const [qtd, setQtd] = useState<number>(1);
  const [cliente, setCliente] = useState<string>("");
  const [ligacao, setLigacao] = useState<string>("");
  const [indicacao, setIndicacao] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const totalValor = useMemo(() => list.reduce((a, b) => a + Number(b.valor || 0), 0), [list]);
  const totalQtd = useMemo(() => list.reduce((a, b) => a + Number(b.quantidade || 0), 0), [list]);

  async function add() {
    if (!ligacao) {
      alert("Escolha a origem da ligacao antes de lancar.");
      return;
    }
    if (!indicacao) {
      alert("Informe se a venda foi por indicacao antes de lancar.");
      return;
    }
    setSaving(true);
    const product_line = isCppemTurma(line) ? turma : line;
    const r = await fetch("/api/sales", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sale_date: date,
        product_line,
        valor,
        quantidade: qtd,
        cliente_nome: cliente,
        ligacao_status: ligacao,
        indicacao_status: indicacao,
      }),
    });
    setSaving(false);
    if (r.ok) {
      const { data } = await r.json();
      setList((l) => [data, ...l]);
      setValor(0);
      setQtd(1);
      setCliente("");
      setLigacao("");
      setIndicacao("");
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
          <div className={isCppemTurma(line) ? "md:col-span-1" : "md:col-span-2"}>
            <label className="label">Linha de produto</label>
            <select className="input" value={line} onChange={(e) => setLine(e.target.value)}>
              {sellerBus.length > 1
                ? sellerBus.map((b) => {
                    const groupLabel =
                      b === "cppem" ? "CPPEM" : b === "unicive" ? "UNICIVE" : "Colegio CPPEM";
                    return (
                      <optgroup key={b} label={groupLabel}>
                        {selectLines
                          .filter((l) => l.group === groupLabel)
                          .map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.label}
                            </option>
                          ))}
                      </optgroup>
                    );
                  })
                : selectLines.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label}
                    </option>
                  ))}
            </select>
          </div>
          {isCppemTurma(line) && (
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
          <button className="btn-primary" disabled={saving || !valor || !ligacao || !indicacao} onClick={add}>
            <Plus className="w-4 h-4" /> Lancar
          </button>
        </div>

        {/* Cliente (opcional, mas ajuda muito no controle) */}
        <div className="mt-4">
          <label className="label flex items-center gap-1">
            <User className="w-3 h-3" /> Nome do cliente
          </label>
          <input
            type="text"
            className="input"
            placeholder="Ex: Joao da Silva"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            maxLength={200}
          />
        </div>

        {/* Seletor obrigatorio de Ligacao */}
        <div className="mt-4">
          <label className="label flex items-center gap-1">
            <Phone className="w-3 h-3" /> Origem por ligacao (obrigatorio)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {LIGACAO_STATUSES.map((opt) => {
              const active = ligacao === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLigacao(opt.id)}
                  className={`text-left rounded-xl border p-3 transition ${
                    active ? "border-accent bg-accent/10" : "border-border bg-panel2 hover:border-accent/40"
                  }`}
                  style={active ? { boxShadow: `0 0 0 1px ${opt.color}55` } : undefined}
                >
                  <div className="text-sm font-semibold" style={{ color: opt.color }}>
                    {opt.short}
                  </div>
                  <div className="text-[11px] text-white/60 mt-0.5 leading-snug">{opt.label}</div>
                </button>
              );
            })}
          </div>
          {!ligacao && (
            <div className="text-[11px] text-warning mt-2">
              Escolha como essa venda foi originada antes de lancar.
            </div>
          )}
        </div>

        {/* Seletor obrigatorio de Indicacao */}
        <div className="mt-4">
          <label className="label flex items-center gap-1">
            <UserPlus className="w-3 h-3" /> Foi por indicacao? (obrigatorio)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {INDICACAO_STATUSES.map((opt) => {
              const active = indicacao === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setIndicacao(opt.id)}
                  className={`text-left rounded-xl border p-3 transition ${
                    active ? "border-accent bg-accent/10" : "border-border bg-panel2 hover:border-accent/40"
                  }`}
                  style={active ? { boxShadow: `0 0 0 1px ${opt.color}55` } : undefined}
                >
                  <div className="text-sm font-semibold" style={{ color: opt.color }}>
                    {opt.short}
                  </div>
                  <div className="text-[11px] text-white/60 mt-0.5 leading-snug">{opt.label}</div>
                </button>
              );
            })}
          </div>
          {!indicacao && (
            <div className="text-[11px] text-warning mt-2">
              Informe se a venda foi por indicacao antes de lancar.
            </div>
          )}
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
              <th className="p-3">Cliente</th>
              <th className="p-3">Valor</th>
              <th className="p-3">Qtd</th>
              <th className="p-3">Origem</th>
              <th className="p-3">Indicacao</th>
              <th className="p-3 w-32"></th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-white/50">
                  Nenhuma venda este mes. Lance a primeira acima.
                </td>
              </tr>
            )}
            {list.map((s) => (
              <Row
                key={s.id}
                sale={s}
                bus={sellerBus}
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
  bus,
  onChange,
  onDelete,
  onAfter,
}: {
  sale: Sale;
  bus: BU[];
  onChange: (p: Partial<Sale>) => void;
  onDelete: () => void;
  onAfter: () => void;
}) {
  const [edit, setEdit] = useState(false);
  const [date, setDate] = useState(sale.sale_date);
  const [line, setLine] = useState(sale.product_line);
  const [valor, setValor] = useState(Number(sale.valor));
  const [qtd, setQtd] = useState(Number(sale.quantidade));
  const [cliente, setCliente] = useState(sale.cliente_nome || "");
  const [ligacao, setLigacao] = useState(sale.ligacao_status || "sem_ligacao");
  const [indicacao, setIndicacao] = useState(sale.indicacao_status || "sem_indicacao");

  const cppemLines = [
    { id: "mentorias", label: "Mentorias" },
    { id: "cursos_digitais", label: "Cursos e Materiais Digitais" },
    { id: "fisicos", label: "Produtos Fisicos" },
    { id: "turma_pmal", label: "Turma PMAL" },
    { id: "turma_pmpe", label: "Turma PMPE" },
    { id: "turma_carreiras", label: "Turma Carreiras Policiais" },
  ];
  const uniLines = [{ id: "matriculas", label: "Matriculas Unicive" }];
  const colegioLines = PRODUCT_LINES_COLEGIO.map((p) => ({ id: p.id, label: p.label }));
  const lines: { id: string; label: string }[] = [];
  if (bus.includes("cppem")) lines.push(...cppemLines);
  if (bus.includes("unicive")) lines.push(...uniLines);
  if (bus.includes("colegio_cppem")) lines.push(...colegioLines);

  async function save() {
    const r = await fetch(`/api/sales/${sale.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sale_date: date,
        product_line: line,
        valor,
        quantidade: qtd,
        cliente_nome: cliente,
        ligacao_status: ligacao,
        indicacao_status: indicacao,
      }),
    });
    if (r.ok) {
      onChange({
        sale_date: date,
        product_line: line,
        valor,
        quantidade: qtd,
        cliente_nome: cliente || null,
        ligacao_status: ligacao,
        indicacao_status: indicacao,
      });
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
    const lig = sale.ligacao_status || "sem_ligacao";
    const ind = sale.indicacao_status || "sem_indicacao";
    return (
      <tr className="border-t border-border">
        <td className="p-3">{new Date(sale.sale_date + "T00:00").toLocaleDateString("pt-BR")}</td>
        <td className="p-3">{productLabel(sale.product_line)}</td>
        <td className="p-3">
          {sale.cliente_nome
            ? <span className="text-white/90">{sale.cliente_nome}</span>
            : <span className="text-white/30 text-xs">—</span>}
        </td>
        <td className="p-3 font-semibold">{BRL.format(Number(sale.valor))}</td>
        <td className="p-3">{sale.quantidade}</td>
        <td className="p-3">
          <span
            className="chip"
            style={{
              background: ligacaoColor(lig) + "22",
              color: ligacaoColor(lig),
            }}
          >
            <Phone className="w-3 h-3" /> {ligacaoShort(lig)}
          </span>
        </td>
        <td className="p-3">
          <span
            className="chip"
            style={{
              background: indicacaoColor(ind) + "22",
              color: indicacaoColor(ind),
            }}
          >
            <UserPlus className="w-3 h-3" /> {indicacaoShort(ind)}
          </span>
        </td>
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
        <input
          type="text"
          className="input h-9"
          value={cliente}
          onChange={(e) => setCliente(e.target.value)}
          placeholder="Cliente"
          maxLength={200}
        />
      </td>
      <td className="p-2">
        <NumberField step="0.01" className="input h-9" value={valor} onChange={setValor} />
      </td>
      <td className="p-2">
        <NumberField className="input h-9" value={qtd} onChange={setQtd} />
      </td>
      <td className="p-2">
        <select className="input h-9" value={ligacao} onChange={(e) => setLigacao(e.target.value)}>
          {LIGACAO_STATUSES.map((l) => (
            <option key={l.id} value={l.id}>
              {l.short}
            </option>
          ))}
        </select>
      </td>
      <td className="p-2">
        <select className="input h-9" value={indicacao} onChange={(e) => setIndicacao(e.target.value)}>
          {INDICACAO_STATUSES.map((l) => (
            <option key={l.id} value={l.id}>
              {l.short}
            </option>
          ))}
        </select>
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
