"use client";
import { useEffect, useState } from "react";
import {
  Phone,
  UserPlus,
  User,
  X,
  Check,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Calendar,
  Package,
  Wallet,
} from "lucide-react";
import NumberField from "@/components/NumberField";
import {
  LIGACAO_STATUSES,
  INDICACAO_STATUSES,
  type BU,
} from "@/lib/products";

type SelectLine = { id: string; label: string; group?: string };

export type NewSaleData = {
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

const STEP_LABELS = ["Produto", "Valor", "Origem"];

export default function NewSaleModal({
  open,
  onClose,
  onCreated,
  todayISO,
  sellerBus,
  selectLines,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (sale: NewSaleData) => void;
  todayISO: string;
  sellerBus: BU[];
  selectLines: SelectLine[];
}) {
  const [step, setStep] = useState(0);
  const [date, setDate] = useState(todayISO);
  const [line, setLine] = useState<string>(selectLines[0]?.id || "");
  const [cliente, setCliente] = useState("");
  const [valor, setValor] = useState(0);
  const [qtd, setQtd] = useState(1);
  const [ligacao, setLigacao] = useState("");
  const [indicacao, setIndicacao] = useState("");
  const [obs, setObs] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // reset ao reabrir
  useEffect(() => {
    if (open) {
      setStep(0);
      setDate(todayISO);
      setLine(selectLines[0]?.id || "");
      setCliente("");
      setValor(0);
      setQtd(1);
      setLigacao("");
      setIndicacao("");
      setObs("");
      setErr(null);
      setSaving(false);
    }
  }, [open, todayISO, selectLines]);

  // Fechar com ESC
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, saving, onClose]);

  if (!open) return null;

  const canStep0 = !!date && !!line;
  const canStep1 = valor > 0 && qtd >= 1;
  const canStep2 = !!ligacao && !!indicacao;
  const canSubmit = canStep0 && canStep1 && canStep2;

  async function submit() {
    if (!canSubmit) return;
    setSaving(true);
    setErr(null);
    const r = await fetch("/api/sales", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sale_date: date,
        product_line: line,
        valor,
        quantidade: qtd,
        cliente_nome: cliente,
        observacao: obs || null,
        ligacao_status: ligacao,
        indicacao_status: indicacao,
      }),
    });
    setSaving(false);
    if (r.ok) {
      const { data } = await r.json();
      onCreated(data as NewSaleData);
      onClose();
    } else {
      const j = await r.json().catch(() => ({}));
      setErr(j.error || "Erro ao salvar venda.");
    }
  }

  function next() {
    if (step === 0 && !canStep0) return;
    if (step === 1 && !canStep1) return;
    setStep((s) => Math.min(2, s + 1));
  }
  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center p-3 sm:p-6"
      onClick={() => !saving && onClose()}
    >
      <div
        className="bg-panel border border-border rounded-2xl shadow-glow w-full max-w-xl max-h-[92vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <div className="text-sm font-semibold">Nova venda</div>
            <div className="text-[11px] text-white/50">
              Passo {step + 1} de 3 · {STEP_LABELS[step]}
            </div>
          </div>
          <button
            className="w-8 h-8 grid place-items-center rounded-lg hover:bg-panel2 text-white/60 hover:text-white"
            onClick={onClose}
            disabled={saving}
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stepper visual */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center gap-1">
            {STEP_LABELS.map((lbl, i) => {
              const done = i < step;
              const current = i === step;
              return (
                <div key={lbl} className="flex items-center gap-1 flex-1">
                  <div
                    className={`w-6 h-6 rounded-full grid place-items-center text-[10px] font-bold shrink-0 ${
                      done
                        ? "bg-success text-black"
                        : current
                        ? "bg-accent text-black"
                        : "bg-panel2 text-white/40"
                    }`}
                  >
                    {done ? <Check className="w-3 h-3" /> : i + 1}
                  </div>
                  <div
                    className={`text-[10px] font-semibold truncate ${
                      current ? "text-white" : done ? "text-white/70" : "text-white/40"
                    }`}
                  >
                    {lbl}
                  </div>
                  {i < STEP_LABELS.length - 1 && (
                    <div
                      className={`h-px flex-1 ${
                        done ? "bg-success" : "bg-border"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Body (scroll) */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {step === 0 && (
            <>
              <div>
                <label className="label flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Data da venda
                </label>
                <input
                  type="date"
                  className="input"
                  value={date}
                  max={todayISO}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div>
                <label className="label flex items-center gap-1">
                  <Package className="w-3 h-3" /> Linha de produto
                </label>
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
              <div>
                <label className="label flex items-center gap-1">
                  <User className="w-3 h-3" /> Nome do cliente{" "}
                  <span className="text-white/40 normal-case">(opcional)</span>
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
            </>
          )}

          {step === 1 && (
            <>
              <div>
                <label className="label flex items-center gap-1">
                  <Wallet className="w-3 h-3" /> Valor da venda (R$)
                </label>
                <NumberField
                  step="0.01"
                  className="input text-xl font-bold"
                  value={valor}
                  onChange={setValor}
                />
              </div>
              <div>
                <label className="label">Quantidade</label>
                <NumberField
                  min={1}
                  className="input text-xl font-bold"
                  value={qtd}
                  onChange={setQtd}
                />
              </div>
              <div>
                <label className="label">
                  Observacao <span className="text-white/40 normal-case">(opcional)</span>
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ex: campanha X, cupom Y, forma de pagamento..."
                  value={obs}
                  onChange={(e) => setObs(e.target.value)}
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="label flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Origem por ligacao
                  <span className="text-danger normal-case">*</span>
                </label>
                <div className="grid grid-cols-1 gap-2">
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
              </div>
              <div>
                <label className="label flex items-center gap-1">
                  <UserPlus className="w-3 h-3" /> Foi por indicacao?
                  <span className="text-danger normal-case">*</span>
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
              </div>
            </>
          )}

          {err && <div className="text-xs text-danger">{err}</div>}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border flex items-center justify-between gap-2 bg-panel/80">
          <button
            className="btn-ghost h-9 text-sm"
            onClick={back}
            disabled={step === 0 || saving}
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          {step < 2 ? (
            <button
              className="btn-primary h-9 text-sm"
              onClick={next}
              disabled={(step === 0 && !canStep0) || (step === 1 && !canStep1)}
            >
              Avancar <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              className="btn-primary h-9 text-sm"
              onClick={submit}
              disabled={!canSubmit || saving}
            >
              {saving ? <RotateCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? "Salvando..." : "Lancar venda"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
