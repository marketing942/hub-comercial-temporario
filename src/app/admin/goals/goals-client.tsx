"use client";
import { useEffect, useMemo, useState } from "react";
import { Save, RotateCw, SplitSquareHorizontal, Sparkles, Copy, AlertTriangle, CheckCircle2 } from "lucide-react";
import { BU_COLOR, BU_LABEL } from "@/lib/brand";
import NumberField from "@/components/NumberField";

type Seller = {
  id: string;
  name: string;
  bu: "cppem" | "unicive";
  active?: boolean;
};

type SellerGoal = {
  seller_id: string;
  valor_meta: number;
  quantidade_meta: number;
  ticket_medio_meta: number;
  taxa_conversao_meta: number;
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
const UNICIVE_LINES = [{ id: "matriculas", label: "Matriculas" }];

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
  const [bu, setBu] = useState<"cppem" | "unicive">("cppem");
  const [year, setYear] = useState(defaultYear);
  const [month, setMonth] = useState(defaultMonth);

  // Meta geral da BU (input direto)
  const [metaGeralFat, setMetaGeralFat] = useState(0);
  const [metaGeralQtd, setMetaGeralQtd] = useState(0);

  // Meta por linha de produto (da BU como um todo)
  const [lines, setLines] = useState<LineGoal[]>([]);

  // Meta por vendedor (livre)
  const [goals, setGoals] = useState<Record<string, SellerGoal>>({});

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  const buSellers = useMemo(() => sellers.filter((s) => s.bu === bu), [sellers, bu]);
  const isUni = bu === "unicive";
  const color = BU_COLOR[bu];
  const linesDef = isUni ? UNICIVE_LINES : CPPEM_LINES;

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bu, year, month]);

  async function load() {
    setLoading(true);
    const j = await fetch(`/api/goals/period?bu=${bu}&year=${year}&month=${month}`).then((r) => r.json());

    // Linhas
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

    // Vendedores
    const nextGoals: Record<string, SellerGoal> = {};
    buSellers.forEach((s) => {
      const m = (j.monthly || []).find((x: any) => x.seller_id === s.id);
      nextGoals[s.id] = {
        seller_id: s.id,
        valor_meta: Number(m?.valor_meta || 0),
        quantidade_meta: Number(m?.quantidade_meta || 0),
        ticket_medio_meta: Number(m?.ticket_medio_meta || 0),
        taxa_conversao_meta: Number(m?.taxa_conversao_meta || 0),
      };
    });
    setGoals(nextGoals);

    // Meta geral comeca = soma das linhas (se existir).
    const totalLineFat = nextLines.reduce((a, b) => a + b.valor_meta, 0);
    const totalLineQtd = nextLines.reduce((a, b) => a + b.quantidade_meta, 0);
    setMetaGeralFat(totalLineFat);
    setMetaGeralQtd(totalLineQtd);

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
      };
    });
    setGoals(nextGoals);
    setMetaGeralFat(nextLines.reduce((a, b) => a + b.valor_meta, 0));
    setMetaGeralQtd(nextLines.reduce((a, b) => a + b.quantidade_meta, 0));
    setLoading(false);
    setFeedback({ kind: "ok", msg: "Metas copiadas do mes anterior. Ajuste e salve." });
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
        }),
        ...patch,
      },
    }));
  }

  const totalsLine = useMemo(
    () => ({
      fat: lines.reduce((a, b) => a + b.valor_meta, 0),
      qtd: lines.reduce((a, b) => a + b.quantidade_meta, 0),
    }),
    [lines]
  );
  const totalsSellers = useMemo(
    () => ({
      fat: Object.values(goals).reduce((a, b) => a + b.valor_meta, 0),
      qtd: Object.values(goals).reduce((a, b) => a + b.quantidade_meta, 0),
    }),
    [goals]
  );

  const metaGeralPrincipal = isUni ? metaGeralQtd : metaGeralFat;
  const totalsSellersPrincipal = isUni ? totalsSellers.qtd : totalsSellers.fat;
  const totalsLinesPrincipal = isUni ? totalsLine.qtd : totalsLine.fat;
  const diffSellers = totalsSellersPrincipal - metaGeralPrincipal;
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
      setFeedback({
        kind: "ok",
        msg: "Metas salvas! Os vendedores e o dashboard ja veem os novos numeros.",
      });
    } else {
      const j = await res.json().catch(() => ({}));
      setFeedback({ kind: "err", msg: "Erro ao salvar: " + (j.error || "tente novamente") });
    }
  }

  return (
    <div className="space-y-5">
      {/* Step 1 - Seletor */}
      <div className="card grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div>
          <label className="label">1 - BU</label>
          <div className="inline-flex p-1 rounded-xl bg-panel2 w-full">
            {(["cppem", "unicive"] as const).map((b) => (
              <button
                key={b}
                onClick={() => setBu(b)}
                className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  bu === b ? "bg-accent text-black" : "text-white/60 hover:text-white"
                }`}
              >
                {BU_LABEL[b]}
              </button>
            ))}
          </div>
        </div>
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
        <button className="btn-ghost" onClick={copyFromPreviousMonth} disabled={loading}>
          <Copy className="w-4 h-4" /> Copiar do mes anterior
        </button>
      </div>

      {/* Step 2 - Meta geral da BU */}
      <div className="card-lg">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-xs uppercase tracking-wider" style={{ color }}>
              2 - Meta geral {BU_LABEL[bu]}
            </div>
            <div className="text-lg font-semibold">
              {isUni
                ? "Quantas matriculas a Unicive precisa fechar no mes?"
                : "Quanto a CPPEM precisa faturar no mes?"}
            </div>
          </div>
          <button
            className="btn-primary text-sm"
            disabled={metaGeralPrincipal === 0 || buSellers.length === 0}
            onClick={distributeSellersEqually}
            title="Distribuir igualmente entre vendedores ativos"
          >
            <SplitSquareHorizontal className="w-4 h-4" /> Distribuir igualmente nos vendedores
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          <div className="rounded-xl bg-panel2 p-4">
            <div className="kpi-label">Meta de Faturamento</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-white/40 text-sm">R$</span>
              <NumberField
                className="input text-2xl font-bold"
                step="0.01"
                value={metaGeralFat}
                onChange={setMetaGeralFat}
              />
            </div>
          </div>
          <div className="rounded-xl bg-panel2 p-4">
            <div className="kpi-label">
              {isUni ? "Meta de Matriculas (qtd)" : "Meta de Quantidade total"}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <NumberField
                className="input text-2xl font-bold"
                value={metaGeralQtd}
                onChange={setMetaGeralQtd}
              />
              <span className="text-white/40 text-sm">un.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Step 3 - Meta por linha de produto (da BU) */}
      <div className="card-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs uppercase tracking-wider" style={{ color }}>
              3 - Meta por linha de produto - {BU_LABEL[bu]}
            </div>
            <div className="text-sm font-semibold">
              Metas totais por categoria (nao por vendedor)
            </div>
          </div>
          <div className="text-xs text-white/40">
            Soma das linhas: <b className="text-white">{BRL(totalsLine.fat)}</b> /{" "}
            <b className="text-white">{INT(totalsLine.qtd)} un.</b>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-white/40">
              <tr className="text-left">
                <th className="py-2">Linha de produto</th>
                <th className="text-right">Meta faturamento</th>
                <th className="text-right">Meta quantidade</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={l.product_line} className="border-t border-border">
                  <td className="py-2">{l.label}</td>
                  <td className="text-right">
                    <NumberField
                      step="0.01"
                      className="input h-9 text-right"
                      value={l.valor_meta}
                      onChange={(v) => updateLine(i, { valor_meta: v })}
                    />
                  </td>
                  <td className="text-right">
                    <NumberField
                      className="input h-9 text-right"
                      value={l.quantidade_meta}
                      onChange={(v) => updateLine(i, { quantidade_meta: v })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {metaGeralPrincipal > 0 && Math.abs(diffLines) > (isUni ? 0.5 : 0.5) && (
          <div className="mt-3 text-xs flex items-center gap-2 text-warning">
            <AlertTriangle className="w-4 h-4" />
            Soma das linhas {diffLines > 0 ? "esta acima" : "esta abaixo"} da meta geral em{" "}
            {isUni ? INT(Math.abs(diffLines)) + " un." : BRL(Math.abs(diffLines))} (aviso, nao bloqueia).
          </div>
        )}
        {metaGeralPrincipal > 0 && Math.abs(diffLines) <= (isUni ? 0.5 : 0.5) && totalsLinesPrincipal > 0 && (
          <div className="mt-3 text-xs flex items-center gap-2 text-success">
            <CheckCircle2 className="w-4 h-4" /> Soma das linhas bate com a meta geral.
          </div>
        )}
      </div>

      {/* Step 4 - Meta por vendedor */}
      <div className="card-lg">
        <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
          <div>
            <div className="text-xs uppercase tracking-wider" style={{ color }}>
              4 - Meta por vendedor
            </div>
            <div className="text-sm font-semibold">
              Edite livremente — voce pode desafiar um vendedor sem alterar a meta geral
            </div>
          </div>
          <div className="text-xs text-white/40">
            Soma dos vendedores: <b className="text-white">{BRL(totalsSellers.fat)}</b> /{" "}
            <b className="text-white">{INT(totalsSellers.qtd)} un.</b>
          </div>
        </div>

        {buSellers.length === 0 ? (
          <div className="text-sm text-white/60">
            Cadastre vendedores em <a href="/admin/sellers" className="text-accent">Vendedores</a>.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-white/40">
                <tr className="text-left">
                  <th className="py-2">Vendedor</th>
                  <th className="text-right">Faturamento</th>
                  <th className="text-right">Quantidade</th>
                  <th className="text-right">Ticket meta (R$)</th>
                  <th className="text-right">Conversao meta (%)</th>
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
                  };
                  const principal = isUni ? g.quantidade_meta : g.valor_meta;
                  const pctOfBu =
                    metaGeralPrincipal > 0 ? (principal / metaGeralPrincipal) * 100 : 0;
                  return (
                    <tr key={s.id} className="border-t border-border">
                      <td className="py-2 font-medium">{s.name}</td>
                      <td className="text-right">
                        <NumberField
                          step="0.01"
                          className="input h-9 text-right"
                          value={g.valor_meta}
                          onChange={(v) => updateSeller(s.id, { valor_meta: v })}
                        />
                      </td>
                      <td className="text-right">
                        <NumberField
                          className="input h-9 text-right"
                          value={g.quantidade_meta}
                          onChange={(v) => updateSeller(s.id, { quantidade_meta: v })}
                        />
                      </td>
                      <td className="text-right">
                        <NumberField
                          step="0.01"
                          className="input h-9 text-right"
                          value={g.ticket_medio_meta}
                          onChange={(v) => updateSeller(s.id, { ticket_medio_meta: v })}
                        />
                      </td>
                      <td className="text-right">
                        <NumberField
                          step="0.1"
                          className="input h-9 text-right"
                          value={g.taxa_conversao_meta}
                          onChange={(v) => updateSeller(s.id, { taxa_conversao_meta: v })}
                        />
                      </td>
                      <td className="text-right text-sm font-semibold" style={{ color }}>
                        {pctOfBu.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-t border-border">
                  <td className="py-2 text-xs uppercase tracking-wider text-white/40">TOTAL</td>
                  <td className="text-right font-semibold">{BRL(totalsSellers.fat)}</td>
                  <td className="text-right font-semibold">{INT(totalsSellers.qtd)}</td>
                  <td colSpan={2}></td>
                  <td className="text-right text-xs text-white/40">
                    {metaGeralPrincipal > 0
                      ? ((totalsSellersPrincipal / metaGeralPrincipal) * 100).toFixed(1) + "%"
                      : "-"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {metaGeralPrincipal > 0 && Math.abs(diffSellers) > (isUni ? 0.5 : 0.5) && (
          <div className="mt-3 text-xs flex items-center gap-2 text-warning">
            <AlertTriangle className="w-4 h-4" />
            Aviso: soma das metas dos vendedores{" "}
            {diffSellers > 0 ? "esta " + (isUni ? INT(diffSellers) + " un." : BRL(diffSellers)) + " acima" : "esta " + (isUni ? INT(-diffSellers) + " un." : BRL(-diffSellers)) + " abaixo"}{" "}
            da meta geral. Nao bloqueia o salvamento.
          </div>
        )}
      </div>

      {/* Step 5 - Salvar */}
      <div className="sticky bottom-3">
        <div className="card flex items-center justify-between gap-3 flex-wrap">
          <div className="text-xs text-white/60 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            {loading
              ? "Carregando..."
              : "Salva metas por linha (BU), metas individuais e ticket/conversao."}
          </div>
          {feedback && (
            <div className={`text-xs ${feedback.kind === "ok" ? "text-success" : "text-danger"}`}>
              {feedback.msg}
            </div>
          )}
          <button className="btn-primary" onClick={saveAll} disabled={saving || loading}>
            {saving ? <RotateCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Salvando..." : "5 - Salvar metas do mes"}
          </button>
        </div>
      </div>
    </div>
  );
}
