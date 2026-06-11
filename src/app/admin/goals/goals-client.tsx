"use client";
import { Fragment, useEffect, useMemo, useState } from "react";
import { Save, RotateCw, SplitSquareHorizontal, Sparkles, ChevronDown, ChevronRight, Copy, AlertTriangle, CheckCircle2 } from "lucide-react";
import { BU_COLOR, BU_LABEL } from "@/lib/brand";

type Seller = { id: string; name: string; bu: "cppem" | "unicive" };

type SellerGoal = {
  seller_id: string;
  // Para CPPEM: valor_total e a soma da meta de faturamento. Detalhe por linha:
  // mentorias, cursos_digitais, fisicos, turma_pmal, turma_pmpe, turma_carreiras
  // Cada com {valor_meta, quantidade_meta}.
  // Para UNICIVE: matriculas {valor_meta, quantidade_meta}.
  products: Record<string, { valor_meta: number; quantidade_meta: number }>;
  ticket_medio_meta: number;
  taxa_conversao_meta: number;
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

function emptyGoal(seller_id: string, bu: "cppem" | "unicive"): SellerGoal {
  const lines = bu === "cppem" ? CPPEM_LINES : UNICIVE_LINES;
  const products: SellerGoal["products"] = {};
  lines.forEach((l) => (products[l.id] = { valor_meta: 0, quantidade_meta: 0 }));
  return { seller_id, products, ticket_medio_meta: 0, taxa_conversao_meta: 0 };
}

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

  // meta GERAL da BU (input direto)
  const [metaGeralFat, setMetaGeralFat] = useState(0);
  const [metaGeralQtd, setMetaGeralQtd] = useState(0);

  // metas por vendedor
  const [goals, setGoals] = useState<Record<string, SellerGoal>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  const buSellers = useMemo(() => sellers.filter((s) => s.bu === bu), [sellers, bu]);
  const isUni = bu === "unicive";

  // Carrega metas atuais quando muda BU / mes / ano
  useEffect(() => {
    if (buSellers.length === 0) return;
    setLoading(true);
    Promise.all(
      buSellers.map((s) =>
        fetch(`/api/goals?seller_id=${s.id}&year=${year}&month=${month}`).then((r) => r.json())
      )
    )
      .then((results: any[]) => {
        const lines = bu === "cppem" ? CPPEM_LINES : UNICIVE_LINES;
        const next: Record<string, SellerGoal> = {};
        buSellers.forEach((s, i) => {
          const g = emptyGoal(s.id, bu);
          const j = results[i] || {};
          (j.products || []).forEach((p: any) => {
            if (g.products[p.product_line]) {
              g.products[p.product_line] = {
                valor_meta: Number(p.valor_meta || 0),
                quantidade_meta: Number(p.quantidade_meta || 0),
              };
            }
          });
          g.ticket_medio_meta = Number(j?.monthly?.ticket_medio_meta || 0);
          g.taxa_conversao_meta = Number(j?.monthly?.taxa_conversao_meta || 0);
          next[s.id] = g;
        });
        setGoals(next);
        // Meta geral comeca = soma das existentes (assim quando voce abre o mes
        // ja tem o resumo do que ja foi distribuido).
        const totalFat = Object.values(next).reduce(
          (a, g) => a + Object.values(g.products).reduce((aa, p) => aa + p.valor_meta, 0),
          0
        );
        const totalQtd = Object.values(next).reduce(
          (a, g) => a + Object.values(g.products).reduce((aa, p) => aa + p.quantidade_meta, 0),
          0
        );
        setMetaGeralFat(totalFat);
        setMetaGeralQtd(totalQtd);
      })
      .finally(() => setLoading(false));
  }, [bu, year, month, buSellers]);

  function sellerTotal(g: SellerGoal) {
    let fat = 0,
      qtd = 0;
    Object.values(g.products).forEach((p) => {
      fat += Number(p.valor_meta || 0);
      qtd += Number(p.quantidade_meta || 0);
    });
    return { fat, qtd };
  }

  const totals = useMemo(() => {
    let fat = 0,
      qtd = 0;
    Object.values(goals).forEach((g) => {
      const t = sellerTotal(g);
      fat += t.fat;
      qtd += t.qtd;
    });
    return { fat, qtd };
  }, [goals]);

  function updateSellerTotal(
    sellerId: string,
    patch: { fat?: number; qtd?: number }
  ) {
    // Quando o admin altera o total do vendedor, jogamos em uma linha "principal":
    // para CPPEM, na primeira linha que tem valor > 0; senao, na linha 'mentorias'.
    // (Detalhamento por linha continua disponivel no collapse).
    setGoals((prev) => {
      const g = prev[sellerId];
      if (!g) return prev;
      const lines = bu === "cppem" ? CPPEM_LINES : UNICIVE_LINES;
      // Se ja tem distribuicao detalhada, redistribuimos proporcionalmente.
      const currTotalFat = Object.values(g.products).reduce((a, p) => a + p.valor_meta, 0);
      const currTotalQtd = Object.values(g.products).reduce((a, p) => a + p.quantidade_meta, 0);
      const products = { ...g.products };
      if (patch.fat !== undefined) {
        const newFat = Math.max(0, patch.fat);
        if (currTotalFat > 0) {
          const factor = newFat / currTotalFat;
          lines.forEach((l) => {
            products[l.id] = {
              ...products[l.id],
              valor_meta: Math.round(products[l.id].valor_meta * factor * 100) / 100,
            };
          });
        } else {
          const first = lines[0].id;
          products[first] = { ...products[first], valor_meta: newFat };
        }
      }
      if (patch.qtd !== undefined) {
        const newQtd = Math.max(0, patch.qtd);
        if (currTotalQtd > 0) {
          const factor = newQtd / currTotalQtd;
          lines.forEach((l) => {
            products[l.id] = {
              ...products[l.id],
              quantidade_meta: Math.round(products[l.id].quantidade_meta * factor),
            };
          });
        } else {
          const first = lines[0].id;
          products[first] = { ...products[first], quantidade_meta: newQtd };
        }
      }
      return { ...prev, [sellerId]: { ...g, products } };
    });
  }

  function updateLine(
    sellerId: string,
    line: string,
    patch: { valor_meta?: number; quantidade_meta?: number }
  ) {
    setGoals((prev) => {
      const g = prev[sellerId];
      if (!g) return prev;
      const cur = g.products[line] || { valor_meta: 0, quantidade_meta: 0 };
      return {
        ...prev,
        [sellerId]: {
          ...g,
          products: { ...g.products, [line]: { ...cur, ...patch } },
        },
      };
    });
  }

  function updateMonthly(sellerId: string, patch: Partial<SellerGoal>) {
    setGoals((prev) => ({ ...prev, [sellerId]: { ...prev[sellerId], ...patch } }));
  }

  function distributeEqually() {
    if (buSellers.length === 0) return;
    const perFat = metaGeralFat / buSellers.length;
    const perQtd = metaGeralQtd / buSellers.length;
    setGoals((prev) => {
      const next = { ...prev };
      buSellers.forEach((s) => {
        next[s.id] = next[s.id] || emptyGoal(s.id, bu);
      });
      // Aplica via updateSellerTotal logic, mas inline aqui
      buSellers.forEach((s) => {
        const g = next[s.id];
        const lines = bu === "cppem" ? CPPEM_LINES : UNICIVE_LINES;
        const currTotalFat = Object.values(g.products).reduce((a, p) => a + p.valor_meta, 0);
        const currTotalQtd = Object.values(g.products).reduce((a, p) => a + p.quantidade_meta, 0);
        const products = { ...g.products };
        if (currTotalFat > 0) {
          const f = perFat / currTotalFat;
          lines.forEach((l) => (products[l.id] = { ...products[l.id], valor_meta: Math.round(products[l.id].valor_meta * f * 100) / 100 }));
        } else {
          products[lines[0].id] = { ...products[lines[0].id], valor_meta: Math.round(perFat * 100) / 100 };
        }
        if (currTotalQtd > 0) {
          const f = perQtd / currTotalQtd;
          lines.forEach((l) => (products[l.id] = { ...products[l.id], quantidade_meta: Math.round(products[l.id].quantidade_meta * f) }));
        } else {
          products[lines[0].id] = { ...products[lines[0].id], quantidade_meta: Math.round(perQtd) };
        }
        next[s.id] = { ...g, products };
      });
      return next;
    });
  }

  async function copyFromPreviousMonth() {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    setLoading(true);
    try {
      const results = await Promise.all(
        buSellers.map((s) =>
          fetch(`/api/goals?seller_id=${s.id}&year=${prevYear}&month=${prevMonth}`).then((r) => r.json())
        )
      );
      const next: Record<string, SellerGoal> = {};
      buSellers.forEach((s, i) => {
        const g = emptyGoal(s.id, bu);
        const j = results[i] || {};
        (j.products || []).forEach((p: any) => {
          if (g.products[p.product_line]) {
            g.products[p.product_line] = {
              valor_meta: Number(p.valor_meta || 0),
              quantidade_meta: Number(p.quantidade_meta || 0),
            };
          }
        });
        g.ticket_medio_meta = Number(j?.monthly?.ticket_medio_meta || 0);
        g.taxa_conversao_meta = Number(j?.monthly?.taxa_conversao_meta || 0);
        next[s.id] = g;
      });
      setGoals(next);
      const totalFat = Object.values(next).reduce(
        (a, g) => a + Object.values(g.products).reduce((aa, p) => aa + p.valor_meta, 0),
        0
      );
      const totalQtd = Object.values(next).reduce(
        (a, g) => a + Object.values(g.products).reduce((aa, p) => aa + p.quantidade_meta, 0),
        0
      );
      setMetaGeralFat(totalFat);
      setMetaGeralQtd(totalQtd);
      setFeedback({ kind: "ok", msg: "Metas copiadas do mes anterior. Ajuste e salve." });
    } finally {
      setLoading(false);
    }
  }

  async function saveAll() {
    setSaving(true);
    setFeedback(null);
    const results = await Promise.all(
      Object.values(goals).map((g) =>
        fetch("/api/goals", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            seller_id: g.seller_id,
            year,
            month,
            ticket_medio_meta: g.ticket_medio_meta,
            taxa_conversao_meta: g.taxa_conversao_meta,
            product_goals: Object.entries(g.products).map(([product_line, p]) => ({
              product_line,
              valor_meta: p.valor_meta,
              quantidade_meta: p.quantidade_meta,
            })),
          }),
        })
      )
    );
    setSaving(false);
    if (results.every((r) => r.ok)) {
      setFeedback({ kind: "ok", msg: "Metas salvas! O dashboard e os vendedores ja veem os novos numeros." });
    } else {
      setFeedback({ kind: "err", msg: "Algumas metas nao salvaram. Tente novamente." });
    }
  }

  const lines = bu === "cppem" ? CPPEM_LINES : UNICIVE_LINES;
  const color = BU_COLOR[bu];

  const principalKind = isUni ? "qtd" : "fat";
  const principalLabel = isUni ? "matriculas" : "faturamento";
  const metaGeralPrincipal = isUni ? metaGeralQtd : metaGeralFat;
  const totalsPrincipal = isUni ? totals.qtd : totals.fat;
  const diff = totalsPrincipal - metaGeralPrincipal;
  const status =
    metaGeralPrincipal === 0
      ? null
      : Math.abs(diff) < (isUni ? 1 : 0.5)
      ? "match"
      : diff > 0
      ? "over"
      : "under";

  const BRL = (n: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 }).format(n);
  const INT = (n: number) => new Intl.NumberFormat("pt-BR").format(Math.round(n));

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
          <input className="input" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
        </div>
        <button className="btn-ghost" onClick={copyFromPreviousMonth} disabled={loading || buSellers.length === 0}>
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
              {isUni ? "Quantas matriculas a Unicive precisa fechar?" : "Quanto a CPPEM precisa faturar no mes?"}
            </div>
          </div>
          <button
            className="btn-primary text-sm"
            disabled={metaGeralPrincipal === 0 || buSellers.length === 0}
            onClick={distributeEqually}
            title="Distribuir igualmente entre vendedores ativos"
          >
            <SplitSquareHorizontal className="w-4 h-4" /> Distribuir igualmente
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          <div className="rounded-xl bg-panel2 p-4">
            <div className="kpi-label">Meta de Faturamento</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-white/40 text-sm">R$</span>
              <input
                className="input text-2xl font-bold"
                type="number"
                step="0.01"
                value={metaGeralFat}
                onChange={(e) => setMetaGeralFat(Number(e.target.value))}
              />
            </div>
            <div className="text-xs text-white/50 mt-1">Soma das metas dos vendedores: {BRL(totals.fat)}</div>
          </div>
          <div className="rounded-xl bg-panel2 p-4">
            <div className="kpi-label">{isUni ? "Meta de Matriculas (qtd)" : "Meta de Quantidade total"}</div>
            <div className="flex items-center gap-2 mt-1">
              <input
                className="input text-2xl font-bold"
                type="number"
                value={metaGeralQtd}
                onChange={(e) => setMetaGeralQtd(Number(e.target.value))}
              />
              <span className="text-white/40 text-sm">un.</span>
            </div>
            <div className="text-xs text-white/50 mt-1">Soma das metas dos vendedores: {INT(totals.qtd)}</div>
          </div>
        </div>

        {status && (
          <div
            className={`mt-3 text-xs flex items-center gap-2 ${
              status === "match"
                ? "text-success"
                : status === "over"
                ? "text-warning"
                : "text-danger"
            }`}
          >
            {status === "match" ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
            {status === "match" && "Distribuicao bate com a meta geral."}
            {status === "over" &&
              `Distribuicao esta ${isUni ? INT(Math.abs(diff)) + " matriculas" : BRL(Math.abs(diff))} ACIMA da meta geral.`}
            {status === "under" &&
              `Faltam ${isUni ? INT(Math.abs(diff)) + " matriculas" : BRL(Math.abs(diff))} para fechar a meta geral.`}
          </div>
        )}
      </div>

      {/* Step 3 - Distribuicao por vendedor */}
      <div className="card-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs uppercase tracking-wider" style={{ color }}>
              3 - Por vendedor
            </div>
            <div className="text-lg font-semibold">Ajuste por pessoa e salve</div>
          </div>
          <div className="text-xs text-white/40">
            Edite a meta principal de cada um direto na tabela. Pra detalhar por linha de produto, expanda a linha.
          </div>
        </div>

        {buSellers.length === 0 ? (
          <div className="text-sm text-white/60">
            Cadastre vendedores em <a className="text-accent" href="/admin/sellers">Vendedores</a> e depois volte aqui.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-white/40">
                <tr className="text-left">
                  <th className="py-2"></th>
                  <th>Vendedor</th>
                  <th className="text-right">{isUni ? "Faturamento" : "Faturamento (meta)"}</th>
                  <th className="text-right">{isUni ? "Matriculas (meta)" : "Quantidade"}</th>
                  <th className="text-right">Ticket meta (R$)</th>
                  <th className="text-right">Conversao meta (%)</th>
                  <th className="text-right">% da BU</th>
                </tr>
              </thead>
              <tbody>
                {buSellers.map((s) => {
                  const g = goals[s.id] || emptyGoal(s.id, bu);
                  const tot = sellerTotal(g);
                  const isExp = !!expanded[s.id];
                  const pctOfBu =
                    metaGeralPrincipal > 0
                      ? ((isUni ? tot.qtd : tot.fat) / metaGeralPrincipal) * 100
                      : 0;
                  return (
                    <Fragment key={s.id}>
                      <tr className="border-t border-border">
                        <td className="py-2">
                          {bu === "cppem" && (
                            <button
                              onClick={() => setExpanded((p) => ({ ...p, [s.id]: !p[s.id] }))}
                              className="w-7 h-7 grid place-items-center rounded-lg hover:bg-panel2 text-white/60"
                              title="Detalhar por linha de produto"
                            >
                              {isExp ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                          )}
                        </td>
                        <td className="py-2 font-medium">{s.name}</td>
                        <td className="text-right">
                          <input
                            type="number"
                            step="0.01"
                            className="input h-9 text-right"
                            value={tot.fat}
                            onChange={(e) => updateSellerTotal(s.id, { fat: Number(e.target.value) })}
                          />
                        </td>
                        <td className="text-right">
                          <input
                            type="number"
                            className="input h-9 text-right"
                            value={tot.qtd}
                            onChange={(e) => updateSellerTotal(s.id, { qtd: Number(e.target.value) })}
                          />
                        </td>
                        <td className="text-right">
                          <input
                            type="number"
                            step="0.01"
                            className="input h-9 text-right"
                            value={g.ticket_medio_meta}
                            onChange={(e) =>
                              updateMonthly(s.id, { ticket_medio_meta: Number(e.target.value) })
                            }
                          />
                        </td>
                        <td className="text-right">
                          <input
                            type="number"
                            step="0.1"
                            className="input h-9 text-right"
                            value={g.taxa_conversao_meta}
                            onChange={(e) =>
                              updateMonthly(s.id, { taxa_conversao_meta: Number(e.target.value) })
                            }
                          />
                        </td>
                        <td className="text-right text-sm font-semibold" style={{ color }}>
                          {pctOfBu.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
                        </td>
                      </tr>
                      {bu === "cppem" && isExp && (
                        <tr className="bg-panel2/40 border-t border-border">
                          <td></td>
                          <td colSpan={6} className="py-3 pr-3">
                            <div className="text-xs uppercase tracking-wider text-white/40 mb-2">
                              Detalhe por linha de produto
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {lines.map((l) => {
                                const p = g.products[l.id] || { valor_meta: 0, quantidade_meta: 0 };
                                return (
                                  <div key={l.id} className="grid grid-cols-[1fr_120px_100px] gap-2 items-center">
                                    <div className="text-xs text-white/70">{l.label}</div>
                                    <input
                                      type="number"
                                      step="0.01"
                                      className="input h-8 text-right text-xs"
                                      placeholder="R$"
                                      value={p.valor_meta}
                                      onChange={(e) =>
                                        updateLine(s.id, l.id, { valor_meta: Number(e.target.value) })
                                      }
                                    />
                                    <input
                                      type="number"
                                      className="input h-8 text-right text-xs"
                                      placeholder="qtd"
                                      value={p.quantidade_meta}
                                      onChange={(e) =>
                                        updateLine(s.id, l.id, { quantidade_meta: Number(e.target.value) })
                                      }
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
                <tr className="border-t border-border">
                  <td></td>
                  <td className="py-2 text-xs uppercase tracking-wider text-white/40">TOTAL</td>
                  <td className="text-right font-semibold">{BRL(totals.fat)}</td>
                  <td className="text-right font-semibold">{INT(totals.qtd)}</td>
                  <td colSpan={2}></td>
                  <td className="text-right text-xs text-white/40">
                    {metaGeralPrincipal > 0 ? ((totalsPrincipal / metaGeralPrincipal) * 100).toFixed(1) + "%" : "-"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Step 4 - Salvar */}
      <div className="sticky bottom-3">
        <div className="card flex items-center justify-between gap-3 flex-wrap">
          <div className="text-xs text-white/60 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            {loading
              ? "Carregando..."
              : "Salva ticket medio, taxa de conversao e a distribuicao das metas dos vendedores."}
          </div>
          {feedback && (
            <div className={`text-xs ${feedback.kind === "ok" ? "text-success" : "text-danger"}`}>
              {feedback.msg}
            </div>
          )}
          <button
            className="btn-primary"
            onClick={saveAll}
            disabled={saving || loading || buSellers.length === 0}
          >
            {saving ? <RotateCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Salvando..." : "4 - Salvar metas do mes"}
          </button>
        </div>
      </div>
    </div>
  );
}
