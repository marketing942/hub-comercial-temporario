"use client";
import { useState } from "react";
import { Download, RotateCw } from "lucide-react";

export default function BackupButton({
  year,
  month,
  monthLabel,
}: {
  year: number;
  month: number;
  monthLabel: string;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function download() {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch(`/api/admin/backup?year=${year}&month=${month}`);
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || `Falha ao gerar (HTTP ${r.status})`);
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hub-comercial-backup-${year}-${String(month).padStart(2, "0")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setErr(e?.message || "Erro ao baixar backup.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={download}
        disabled={busy}
        title={`Baixar todos os dados de ${monthLabel} em XLSX`}
        className="btn-primary h-9 px-3 text-sm inline-flex items-center gap-2"
      >
        {busy ? <RotateCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        {busy ? "Gerando..." : "Backup do mes"}
      </button>
      {err && <div className="text-[11px] text-danger">{err}</div>}
    </div>
  );
}
