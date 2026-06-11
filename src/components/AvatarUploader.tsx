"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Trash2, Loader2 } from "lucide-react";
import Avatar from "./Avatar";

export default function AvatarUploader({
  name,
  initialUrl,
  color,
}: {
  name: string;
  initialUrl?: string | null;
  color: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(initialUrl || null);
  const [busy, setBusy] = useState<"upload" | "remove" | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function pick() {
    inputRef.current?.click();
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy("upload");
    setErr(null);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/seller/avatar", { method: "POST", body: form });
    setBusy(null);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error || "Erro ao enviar foto.");
      return;
    }
    const j = await res.json();
    setUrl(j.url);
    router.refresh();
  }

  async function remove() {
    if (!url) return;
    setBusy("remove");
    setErr(null);
    const res = await fetch("/api/seller/avatar", { method: "DELETE" });
    setBusy(null);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error || "Erro ao remover foto.");
      return;
    }
    setUrl(null);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <Avatar name={name} url={url} color={color} size={56} />
        <button
          onClick={pick}
          disabled={busy !== null}
          className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-accent text-black grid place-items-center shadow-lg hover:opacity-90 disabled:opacity-50"
          title="Trocar foto"
        >
          {busy === "upload" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Camera className="w-3.5 h-3.5" />
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={onFile}
        />
      </div>
      <div className="text-xs text-white/60">
        <div className="text-white text-sm font-medium">Sua foto</div>
        <div className="leading-snug">JPG, PNG ou WEBP, ate 3MB.</div>
        {url && (
          <button
            onClick={remove}
            disabled={busy !== null}
            className="mt-1 text-danger hover:underline inline-flex items-center gap-1"
          >
            {busy === "remove" ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Trash2 className="w-3 h-3" />
            )}
            Remover foto
          </button>
        )}
        {err && <div className="text-danger mt-1">{err}</div>}
      </div>
    </div>
  );
}
