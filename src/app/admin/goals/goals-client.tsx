"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Save,
  RotateCw,
  Copy,
  AlertTriangle,
  CheckCircle2,
  SplitSquareHorizontal,
} from "lucide-react";
import { BU_COLOR, BU_LABEL } from "@/lib/brand";
import { ALL_BUS, PRODUCT_LINES_COLEGIO, type BU } from "@/lib/products";
import NumberField from "@/components/NumberField";

type Seller = {
  id: string;
  name: string;
  bu: BU;
  bus?: BU[];
  active?: boolean;
};

type SellerGoal = {
  seller_id: string;
  valor_meta: number;
  quantidade_meta: number;
  ticket_medio_meta: number;
  taxa_conversao_meta: number;
  leads_meta: number;
};

type LineGoal = {
  product_line: string;
  label: string;
  valor_meta: number;
  quantidade_meta: number;
};

const MONTHS = [
  "Janeiro","Fevereiro","Marco","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

const CPPEM_LINES = [
  { id: "mentorias", label: "Mentorias" },
  { id: "cursos_digitais", label: "Cursos / Materiais Digitais" },
  { id: "fisicos", label: "Produtos Fisicos" },
  { id: "turma_pmal", label: "Turma PMAL" },
  { id: "turma_pmpe", label: "Turma PMPE" },
  { id: "turma_carreiras", label: "Turma Carreiras Policiais" },
];
const UNICIVE_LINES = [
  { id: "matriculas", label: "Matriculas" },
  { id: "bolsas_unicive", label: "Bolsas" },
];
const COLEGIO_LINES = PRODUCT_LINES_COLEGIO.map((p) => ({ id: p.id, label: p.label }));

const BRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 }).format(n);
const INT = (n: number) => new Intl.NumberFormat("pt-BR").format(Math.round(n));

export default function GoalsClient({
  sellers,
  defaultYear,
  defaultMonth,
}: {
  sellers: Seller[];
  defaultYear: number;
  defaultMonth: number;
}) {
  const [bu, setBu] = useState<BU>("cppem");
  const [year, setYear] = useState(defaultYear);
  const [month, setMonth] = useState(defaultMonth);

  const [metaGeralFat, setMetaGeralFat] = useState(0);
  const [metaGeralQtd, setMetaGeralQtd] = useState(0);

  const [lines, setLines] = useState<LineGoal[]>([]);
  const [goals, setGoals] = useState<Record<string, SellerGoal>>({});

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  const buSellers = useMemo(
    () =>
      sellers.filter((s) => {
        const arr = Array.isArray(s.bus) && s.bus.length > 0 ? s.bus : [s.bu];
        return arr.includes(bu);
      }),
    [sellers, bu]
  );
  const isQtd = bu === "unicive" || bu === "colegio_cppem";
  const color = BU_COLOR[bu];
  const linesDef =
    bu === "cppem" ? CPPEM_LINES : bu === "unicive" ? UNICIVE_LINES : COLEGIO_LINES;

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bu, year, month]);

  async function load() {
    setLoading(true);
    const j = await fetch(`/api/goals/period?bu=${bu}&year=${year}&month=${month}`).then((r) => r.json());

    const nextLines = linesDef.map((l) => {
      const f = (j.bu_product_goals || []).find((p: any) => p.product_line === l.id);
      return {
        product_line: l.id,
        label: l.label,
        valor_meta: Number(f?.valor_meta || 0),
        quantidade_meta: Number(f?.quantidade_meta || 0),
      };
    });
    setLines(nextLines);

    const nextGoals: Record<string, SellerGoal> = {};
    buSellers.forEach((s) => {
      const m = (j.monthly || []).find((x: any) => x.seller_id === s.id);
      nextGoals[s.id] = {
        seller_id: s.id,
        valor_meta: Number(m?.valor_meta || 0),
        quantidade_meta: Number(m?.quantidade_meta || 0),
        ticket_medio_meta: Number(m?.ticket_medio_meta || 0),
        taxa_conversao_meta: Number(m?.taxa_conversao_meta || 0),
        leads_meta: Number(m?.leads_meta || 0),
      };
    });
    setGoals(nextGoals);

    setMetaGeralFat(nextLines.reduce((a, b) => a + b.valor_meta, 0));
    setMetaGeralQtd(nextLines.reduce((a, b) => a + b.quantidade_meta, 0));

    setLoading(false);
  }

  async function copyFromPreviousMonth() {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    setLoading(true);
    const j = await fetch(`/api/goals/period?bu=${bu}&year=${prevYear}&month=${prevMonth}`).then((r) => r.json());
    const nextLines = linesDef.map((l) => {
      const f = (j.bu_product_goals || []).find((p: any) => p.product_line === l.id);
      return {
        product_line: l.id,
        label: l.label,
        valor_meta: Number(f?.valor_meta || 0),
        quantidade_meta: Number(f?.quantidade_meta || 0),
      };
    });
    setLines(nextLines);
    const nextGoals: Record<string, SellerGoal> = {};
    buSellers.forEach((s) => {
      const m = (j.monthly || []).find((x: any) => x.seller_id === s.id);
      nextGoals[s.id] = {
        seller_id: s.id,
        valor_meta: Number(m?.valor_meta || 0),
        quantidade_meta: Number(m?.quantidade_meta || 0),
        ticket_medio_meta: Number(m?.ticket_medio_meta || 0),
        taxa_conversao_meta: Number(m?.taxa_conversao_meta || 0),
        leads_meta: Number(m?.leads_meta || 0),
      };
    });
    setGoals(nextGoals);
    setMetaGeralFat(nextLines.reduce((a, b) => a + b.valor_meta, 0));
    setMetaGeralQtd(nextLines.reduce((a, b) => a + b.quantidade_meta, 0));
    setLoading(false);
    setFeedback({ kind: "ok", msg: "Metas copiadas do mes anterior." });
  }

  function distributeSellersEqually() {
    if (buSellers.length === 0) return;
    const perFat = metaGeralFat / buSellers.length;
    const perQtd = metaGeralQtd / buSellers.length;
    setGoals((prev) => {
      const next = { ...prev };
      buSellers.forEach((s) => {
        next[s.id] = {
          ...(next[s.id] || {
            seller_id: s.id,
            ticket_medio_meta: 0,
            taxa_conversao_meta: 0,
            valor_meta: 0,
            quantidade_meta: 0,
            leads_meta: 0,
          }),
          valor_meta: Math.round(perFat * 100) / 100,
          quantidade_meta: Math.round(perQtd),
        };
      });
      return next;
    });
  }

  function updateLine(idx: number, patch: Partial<LineGoal>) {
    setLines((p) => p.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  function updateSeller(id: string, patch: Partial<SellerGoal>) {
    setGoals((p) => ({
      ...p,
      [id]: {
        ...(p[id] || {
          seller_id: id,
          valor_meta: 0,
          quantidade_meta: 0,
          ticket_medio_meta: 0,
          taxa_conversao_meta: 0,
          leads_meta: 0,
        }),
        ...patch,
      },
    }));
  }

  const totalsSellers = useMemo(
    () => ({
      fat: Object.values(goals).reduce((a, b) => a + b.valor_meta, 0),
      qtd: Object.values(goals).reduce((a, b) => a + b.quantidade_meta, 0),
      leads: Object.values(goals).reduce((a, b) => a + b.leads_meta, 0),
    }),
    [goals]
  );

  const metaGeralPrincipal = isQtd ? metaGeralQtd : metaGeralFat;
  const totalsSellersPrincipal = isQtd ? totalsSellers.qtd : totalsSellers.fat;
  const diff = totalsSellersPrincipal - metaGeralPrincipal;
  const totalsLine = useMemo(
    () => ({
      fat: lines.reduce((a, b) => a + b.valor_meta, 0),
      qtd: lines.reduce((a, b) => a + b.quantidade_meta, 0),
    }),
    [lines]
  );
  const totalsLinesPrincipal = isQtd ? totalsLine.qtd : totalsLine.fat;
  const diffLines = totalsLinesPrincipal - metaGeralPrincipal;

  async function saveAll() {
    setSaving(true);
    setFeedback(null);
    const res = await fetch("/api/goals/period", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        bu,
        year,
        month,
        bu_product_goals: lines.map((l) => ({
          product_line: l.product_line,
          valor_meta: l.valor_meta,
          quantidade_meta: l.quantidade_meta,
        })),
        sellers: Object.values(goals),
      }),
    });
    setSaving(false);
    if (res.ok) {
      setFeedback({ kind: "ok", msg: "Metas salvas." });
    } else {
      const j = await res.json().catch(() => ({}));
      setFeedback({ kind: "err", msg: "Erro: " + (j.error || "tente novamente") });
    }
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Toolbar unica — BU + mes + atalhos + Salvar */}
      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-bg/85 backdrop-blur border-b border-border">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex p-1 rounded-xl bg-panel border border-border">
            {ALL_BUS.map((b) => (
              <button
                key={b}
                onClick={() => setBu(b)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  bu === b
                    ? "bg-accent text-black"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {BU_LABEL[b]}
              </button>
            ))}
          </div>

          <select
            className="input w-36 h-9 text-sm"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
          <NumberField
            className="input w-24 h-9 text-sm"
            value={year}
            onChange={setYear}
          />

          <button
            className="btn-ghost h-9 px-3 text-xs"
            onClick={copyFromPreviousMonth}
            disabled={loading}
            title="Copia metas do mes anterior"
          >
            <Copy className="w-3.5 h-3.5" /> Copiar mes anterior
          </button>

          <div className="flex-1" />

          {feedback && (
            <div className={`text-xs ${feedback.kind === "ok" ? "text-success" : "text-danger"}`}>
              {feedback.msg}
            </div>
          )}

          <button
            className="btn-primary h-9 px-4 text-sm"
            onClick={saveAll}
            disabled={saving || loading}
          >
            {saving ? <RotateCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>

      {/* Meta total da BU + linhas em duas colunas */}
      <section className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-3">
        <div className="card-lg">
          <div className="text-xs uppercase tracking-wider mb-3" style={{ color }}>
            Meta total {BU_LABEL[bu]}
          </div>
          <div className="space-y-3">
            <div>
              <div className="label">Faturamento (R$)</div>
              <NumberField
                className="input text-xl font-bold"
                step="0.01"
                value={metaGeralFat}
                onChange={setMetaGeralFat}
              />
            </div>
            <div>
              <div className="label">
                {isQtd ? "Matriculas (qtd)" : "Quantidade total"}
              </div>
              <NumberField
                className="input text-xl font-bold"
                value={metaGeralQtd}
                onChange={setMetaGeralQtd}
              />
            </div>
            <button
              className="btn-ghost w-full text-xs"
              onClick={distributeSellersEqually}
              disabled={metaGeralPrincipal === 0 || buSellers.length === 0}
            >
              <SplitSquareHorizontal className="w-3.5 h-3.5" />
              Distribuir igualmente nos vendedores
            </button>
          </div>
        </div>

        <div className="card-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs uppercase tracking-wider" style={{ color }}>
                Por linha de produto
              </div>
              <div className="text-xs text-white/50">
                Soma:{" "}
                <b className="text-white">{BRL(totalsLine.fat)}</b> /{" "}
                <b className="text-white">{INT(totalsLine.qtd)} un.</b>
              </div>
            </div>
            {metaGeralPrincipal > 0 && (
              <StatusBadge ok={Math.abs(diffLines) <= 0.5} diff={diffLines} isQtd={isQtd} />
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase tracking-wider text-white/40">
                <tr className="text-left">
                  <th className="py-2">Linha</th>
                  <th className="text-right">Faturamento</th>
                  <th className="text-right">Quantidade</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => (
                  <tr key={l.product_line} className="border-t border-border">
                    <td className="py-1.5">{l.label}</td>
                    <td className="text-right">
                      <NumberField
                        step="0.01"
                        className="input h-8 text-right text-xs"
                        value={l.valor_meta}
                        onChange={(v) => updateLine(i, { valor_meta: v })}
                      />
                    </td>
                    <td className="text-right">
                      <NumberField
                        className="input h-8 text-right text-xs"
                        value={l.quantidade_meta}
                        onChange={(v) => updateLine(i, { quantidade_meta: v })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Metas por vendedor */}
      <section className="card-lg">
        <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
          <div>
            <div className="text-xs uppercase tracking-wider" style={{ color }}>
              Por vendedor
            </div>
            <div className="text-xs text-white/50">
              Soma:{" "}
              <b className="text-white">{BRL(totalsSellers.fat)}</b> /{" "}
              <b className="text-white">{INT(totalsSellers.qtd)} un.</b>
              {" · "}
              <b className="text-white">{INT(totalsSellers.leads)}</b> leads
            </div>
          </div>
          {metaGeralPrincipal > 0 && (
            <StatusBadge ok={Math.abs(diff) <= 0.5} diff={diff} isQtd={isQtd} />
          )}
        </div>

        {buSellers.length === 0 ? (
          <div className="text-sm text-white/60 py-2">
            Cadastre vendedores em{" "}
            <a href="/admin/sellers" className="text-accent">Vendedores</a>{" "}
            e marque a BU {BU_LABEL[bu]} pra eles aparecerem aqui.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase tracking-wider text-white/40">
                <tr className="text-left">
                  <th className="py-2">Vendedor</th>
                  <th className="text-right">Faturamento</th>
                  {isQtd && <th className="text-right">Matriculas (qtd)</th>}
                  <th className="text-right">Ticket meta (R$)</th>
                  <th className="text-right">Conversao meta (%)</th>
                  <th className="text-right">Leads meta</th>
                  <th className="text-right">% da BU</th>
                </tr>
              </thead>
              <tbody>
                {buSellers.map((s) => {
                  const g = goals[s.id] || {
                    seller_id: s.id,
                    valor_meta: 0,
                    quantidade_meta: 0,
                    ticket_medio_meta: 0,
                    taxa_conversao_meta: 0,
                    leads_meta: 0,
                  };
                  const principal = isQtd ? g.quantidade_meta : g.valor_meta;
                  const pctOfBu =
                    metaGeralPrincipal > 0 ? (principal / metaGeralPrincipal) * 100 : 0;
                  return (
                    <tr key={s.id} className="border-t border-border">
                      <td className="py-1.5 font-medium">{s.name}</td>
                      <td className="text-right">
                        <NumberField
                          step="0.01"
                          className="input h-8 text-right text-xs"
                          value={g.valor_meta}
                          onChange={(v) => updateSeller(s.id, { valor_meta: v })}
                        />
                      </td>
                      {isQtd && (
                        <td className="text-right">
                          <NumberField
                            className="input h-8 text-right text-xs"
                            value={g.quantidade_meta}
                            onChange={(v) => updateSeller(s.id, { quantidade_meta: v })}
                          />
                        </td>
                      )}
                      <td className="text-right">
                        <NumberField
                          step="0.01"
                          className="input h-8 text-right text-xs"
                          value={g.ticket_medio_meta}
                          onChange={(v) => updateSeller(s.id, { ticket_medio_meta: v })}
                        />
                      </td>
                      <td className="text-right">
                        <NumberField
                          step="0.1"
                          className="input h-8 text-right text-xs"
                          value={g.taxa_conversao_meta}
                          onChange={(v) => updateSeller(s.id, { taxa_conversao_meta: v })}
                        />
                      </td>
                      <td className="text-right">
                        <NumberField
                          className="input h-8 text-right text-xs"
                          value={g.leads_meta}
                          onChange={(v) => updateSeller(s.id, { leads_meta: v })}
                        />
                      </td>
                      <td className="text-right text-xs font-semibold" style={{ color }}>
                        {pctOfBu.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatusBadge({
  ok,
  diff,
  isQtd,
}: {
  ok: boolean;
  diff: number;
  isQtd: boolean;
}) {
  if (ok) {
    return (
      <div className="text-[11px] flex items-center gap-1 text-success">
        <CheckCircle2 className="w-3.5 h-3.5" /> bate com a meta da BU
      </div>
    );
  }
  const acima = diff > 0;
  return (
    <div className="text-[11px] flex items-center gap-1 text-warning">
      <AlertTriangle className="w-3.5 h-3.5" />
      {acima ? "acima" : "abaixo"} da meta em{" "}
      {isQtd ? INT(Math.abs(diff)) + " un." : BRL(Math.abs(diff))}
    </div>
  );
}
