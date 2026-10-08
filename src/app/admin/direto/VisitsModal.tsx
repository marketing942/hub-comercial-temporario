"use client";
import { useEffect, useState } from "react";
import { X, Check, RotateCw, MousePointerClick } from "lucide-react";
import NumberField from "@/components/NumberField";

export default function VisitsModal({
  open,
  onClose,
  onSaved,
  todayISO,
  initialVisits,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (date: string, qty: number) => void;
  todayISO: string;
  initialVisits: Record<string, number>;
}) {
  const [date, setDate] = useState(todayISO);
  const [qty, setQty] = useState(0);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (open) {
      setDate(todayISO);
      setMsg(null);
    }
  }, [open, todayISO]);

  useEffect(() => {
    setQty(initialVisits[date] || 0);
  }, [date, initialVisits]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, saving, onClose]);

  if (!open) return null;

  async function save() {
    setSaving(true);
    setMsg(null);
    const r = await fetch("/api/direct/visits", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ date, qty }),
    });
    setSaving(false);
    if (r.ok) {
      onSaved(date, qty);
      setMsg({ kind: "ok", text: "Visitas salvas." });
      setTimeout(() => {
        onClose();
        setMsg(null);
      }, 900);
    } else {
      setMsg({ kind: "err", text: "Erro ao salvar." });
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center p-3 sm:p-6"
      onClick={() => !saving && onClose()}
    >
      <div
        className="bg-panel border border-border rounded-2xl shadow-glow w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <div className="text-sm font-semibold flex items-center gap-1.5">
              <MousePointerClick className="w-4 h-4 text-info" />
              Registrar visitas do site
            </div>
            <div className="text-[11px] text-white/50">
              Usado no calculo de conversao (vendas / visitas) do canal direto.
            </div>
          </div>
          <button
            className="w-8 h-8 grid place-items-center rounded-lg hover:bg-panel2 text-white/60 hover:text-white"
            onClick={onClose}
            disabled={saving}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="label">Data</label>
            <input
              type="date"
              className="input"
              value={date}
              max={todayISO}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Visitas no dia</label>
            <NumberField min={0} className="input text-xl font-bold" value={qty} onChange={setQty} />
          </div>
          {msg && (
            <div className={`text-xs ${msg.kind === "ok" ? "text-success" : "text-danger"}`}>
              {msg.text}
            </div>
          )}
        </div>
        <div className="px-4 py-3 border-t border-border flex items-center justify-end gap-2">
          <button className="btn-ghost h-9 text-sm" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button className="btn-primary h-9 text-sm" onClick={save} disabled={saving}>
            {saving ? <RotateCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saving ? "Salvando..." : "Salvar visitas"}
          </button>
        </div>
      </div>
    </div>
  );
}
