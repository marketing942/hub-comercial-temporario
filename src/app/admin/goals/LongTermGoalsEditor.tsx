"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2, RotateCw, GraduationCap, PowerOff, Power } from "lucide-react";
import NumberField from "@/components/NumberField";
import { ALL_BUS, type BU } from "@/lib/products";
import { BU_LABEL, BU_COLOR } from "@/lib/brand";
import type { LongTermGoal } from "@/lib/longTerm";

const MONTHS = [
  "Janeiro","Fevereiro","Marco","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

type Draft = {
  id?: string;
  bu: BU;
  label: string;
  base_count: number;
  target: number;
  start_year: number;
  start_month: number;
  end_year: number;
  end_month: number;
  active: boolean;
};

function draftFrom(g: LongTermGoal): Draft {
  return {
    id: g.id,
    bu: g.bu,
    label: g.label,
    base_count: g.base_count,
    target: g.target,
    start_year: g.start_year,
    start_month: g.start_month,
    end_year: g.end_year,
    end_month: g.end_month,
    active: g.active,
  };
}

function newDraft(): Draft {
  const now = new Date();
  return {
    bu: "colegio_cppem",
    label: "Meta de longo prazo",
    base_count: 0,
    target: 0,
    start_year: now.getFullYear(),
    start_month: now.getMonth() + 1,
    end_year: now.getFullYear() + 1,
    end_month: now.getMonth() + 1,
    active: true,
  };
}

export default function LongTermGoalsEditor({ initial }: { initial: LongTermGoal[] }) {
  const router = useRouter();
  const [goals, setGoals] = useState<Draft[]>(initial.map(draftFrom));
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(newDraft());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const years = useMemo(() => {
    const cur = new Date().getFullYear();
    const arr: number[] = [];
    for (let y = cur - 1; y <= cur + 3; y++) arr.push(y);
    return arr;
  }, []);

  async function save(g: Draft, tag = "save") {
    setBusyId(g.id || tag);
    setMsg(null);
    const r = await fetch("/api/long-term-goals", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(g),
    });
    setBusyId(null);
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      setMsg({ kind: "err", text: j.error || "Erro ao salvar." });
      return;
    }
    setMsg({ kind: "ok", text: "Meta salva. Dashboard TV ja reflete." });
    router.refresh();
    // Recarrega lista via fetch pra pegar a versao fresca com ids/timestamps
    const rl = await fetch("/api/long-term-goals").then((x) => x.json()).catch(() => null);
    if (rl?.data) setGoals(rl.data.map(draftFrom));
    if (creating) {
      setCreating(false);
      setDraft(newDraft());
    }
  }

  async function remove(g: Draft) {
    if (!g.id) return;
    if (!confirm(`Remover a meta "${g.label}"?`)) return;
    setBusyId(g.id);
    const r = await fetch(`/api/long-term-goals?id=${encodeURIComponent(g.id)}`, {
      method: "DELETE",
    });
    setBusyId(null);
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      setMsg({ kind: "err", text: j.error || "Erro ao remover." });
      return;
    }
    setGoals((prev) => prev.filter((x) => x.id !== g.id));
    setMsg({ kind: "ok", text: "Meta removida." });
    router.refresh();
  }

  function updateExisting(id: string, patch: Partial<Draft>) {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  }

  return (
    <section className="card-lg">
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <GraduationCap className="w-4 h-4 text-accent" />
            Metas de longo prazo (multi-mes)
          </div>
          <div className="text-xs text-white/50">
            Metas que atravessam varios meses (ex.: matriculas do Colegio pra
            2027). O dashboard TV soma automaticamente as matriculas novas do
            periodo em cima da base atual.
          </div>
        </div>
        {!creating && (
          <button className="btn-primary h-9 text-sm" onClick={() => setCreating(true)}>
            <Plus className="w-4 h-4" /> Nova meta
          </button>
        )}
      </div>

      {msg && (
        <div className={`text-xs mb-3 ${msg.kind === "ok" ? "text-success" : "text-danger"}`}>
          {msg.text}
        </div>
      )}

      {/* Metas existentes */}
      {goals.length === 0 && !creating && (
        <div className="text-sm text-white/50 py-4">
          Nenhuma meta de longo prazo cadastrada. Clique em "Nova meta" pra criar.
        </div>
      )}

      <div className="space-y-3">
        {goals.map((g) => (
          <GoalRow
            key={g.id}
            g={g}
            years={years}
            busy={busyId === g.id}
            onChange={(patch) => g.id && updateExisting(g.id, patch)}
            onSave={() => save(g)}
            onRemove={() => remove(g)}
          />
        ))}
      </div>

      {creating && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="text-xs uppercase tracking-wider text-white/50 mb-2">Nova meta</div>
          <GoalRow
            g={draft}
            years={years}
            busy={busyId === "save"}
            onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
            onSave={() => save(draft, "save")}
            onCancel={() => {
              setCreating(false);
              setDraft(newDraft());
            }}
          />
        </div>
      )}
    </section>
  );
}

function GoalRow({
  g,
  years,
  busy,
  onChange,
  onSave,
  onRemove,
  onCancel,
}: {
  g: Draft;
  years: number[];
  busy: boolean;
  onChange: (patch: Partial<Draft>) => void;
  onSave: () => void;
  onRemove?: () => void;
  onCancel?: () => void;
}) {
  const color = BU_COLOR[g.bu];
  return (
    <div
      className={`rounded-xl border p-3 space-y-3 ${g.active ? "bg-panel2/40" : "bg-panel2/20 opacity-70"}`}
      style={{ borderColor: g.active ? color + "44" : undefined }}
    >
      <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-3">
        <div>
          <label className="label">Nome</label>
          <input
            className="input"
            value={g.label}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder="Ex: Meta de Matriculas 2027"
            maxLength={200}
          />
        </div>
        <div>
          <label className="label">BU</label>
          <select
            className="input h-9"
            value={g.bu}
            onChange={(e) => onChange({ bu: e.target.value as BU })}
          >
            {ALL_BUS.map((b) => (
              <option key={b} value={b}>{BU_LABEL[b]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="label">Base atual (alunos ja matriculados)</label>
          <NumberField className="input" value={g.base_count} onChange={(v) => onChange({ base_count: v })} />
        </div>
        <div>
          <label className="label">Meta total (base + novas)</label>
          <NumberField className="input" value={g.target} onChange={(v) => onChange({ target: v })} />
        </div>
        <div>
          <label className="label">Mes/ano inicio</label>
          <div className="flex gap-1.5">
            <select
              className="input h-9 flex-1"
              value={g.start_month}
              onChange={(e) => onChange({ start_month: Number(e.target.value) })}
            >
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
            <select
              className="input h-9 w-24"
              value={g.start_year}
              onChange={(e) => onChange({ start_year: Number(e.target.value) })}
            >
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Mes/ano fim</label>
          <div className="flex gap-1.5">
            <select
              className="input h-9 flex-1"
              value={g.end_month}
              onChange={(e) => onChange({ end_month: Number(e.target.value) })}
            >
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
            <select
              className="input h-9 w-24"
              value={g.end_year}
              onChange={(e) => onChange({ end_year: Number(e.target.value) })}
            >
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-xs text-white/60">
          Progresso: <b className="text-white/90">{g.base_count} / {g.target}</b>{" "}
          <span className="text-white/40">
            ({g.target > 0 ? ((g.base_count / g.target) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) : "0"}%)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-xs cursor-pointer select-none">
            <input
              type="checkbox"
              checked={g.active}
              onChange={(e) => onChange({ active: e.target.checked })}
            />
            {g.active ? <Power className="w-3 h-3 text-success" /> : <PowerOff className="w-3 h-3 text-white/40" />}
            Ativa (aparece no dashboard TV)
          </label>
          {onCancel && (
            <button className="btn-ghost h-9 text-xs" onClick={onCancel} disabled={busy}>
              Cancelar
            </button>
          )}
          {onRemove && g.id && (
            <button className="btn-danger h-9 text-xs" onClick={onRemove} disabled={busy}>
              <Trash2 className="w-3 h-3" /> Remover
            </button>
          )}
          <button className="btn-primary h-9 text-xs" onClick={onSave} disabled={busy}>
            {busy ? <RotateCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            {busy ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
