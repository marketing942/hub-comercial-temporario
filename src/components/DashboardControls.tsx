"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Maximize2, Minimize2, RefreshCw } from "lucide-react";

export default function DashboardControls({ refreshMs = 60000 }: { refreshMs?: number }) {
  const router = useRouter();
  const [full, setFull] = useState(false);
  const [now, setNow] = useState<string>("--:--");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const tick = () => {
      setNow(
        new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    };
    tick();
    const clock = setInterval(tick, 30_000);
    timer.current = setInterval(() => router.refresh(), refreshMs);
    return () => {
      clearInterval(clock);
      if (timer.current) clearInterval(timer.current);
    };
  }, [router, refreshMs]);

  useEffect(() => {
    const onFs = () => setFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  async function toggleFull() {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen?.();
      document.documentElement.classList.add("tv-mode");
    } else {
      await document.exitFullscreen?.();
      document.documentElement.classList.remove("tv-mode");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-panel border border-border text-xs">
        <span className="w-2 h-2 rounded-full bg-accent pulse-dot" />
        <span className="text-white/60">Atualizado em</span>
        <span className="font-semibold text-accent">{now}</span>
      </div>
      <button
        className="btn-ghost h-9 px-3 text-xs"
        onClick={() => router.refresh()}
        title="Atualizar agora"
      >
        <RefreshCw className="w-3.5 h-3.5" /> Atualizar
      </button>
      <button
        className="btn-ghost h-9 px-3 text-xs"
        onClick={toggleFull}
        title={full ? "Sair de tela cheia" : "Tela cheia (TV)"}
      >
        {full ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        {full ? "Sair tela cheia" : "Tela cheia"}
      </button>
    </div>
  );
}
