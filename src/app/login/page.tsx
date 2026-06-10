"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy, ShieldCheck, Users } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<"seller" | "admin">("seller");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error || "Senha invalida.");
      return;
    }
    if (role === "admin") router.push("/admin");
    else router.push("/escolher-vendedor");
  }

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-accent/20 grid place-items-center">
            <Trophy className="w-5 h-5 text-accent" />
          </div>
          <div>
            <div className="text-lg font-semibold">Hub Comercial</div>
            <div className="text-xs text-white/50">CPPEM x Unicive</div>
          </div>
        </div>

        <div className="card">
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => setRole("seller")}
              className={`btn ${role === "seller" ? "btn-primary" : "btn-ghost"}`}
            >
              <Users className="w-4 h-4" /> Vendedor
            </button>
            <button
              onClick={() => setRole("admin")}
              className={`btn ${role === "admin" ? "btn-primary" : "btn-ghost"}`}
            >
              <ShieldCheck className="w-4 h-4" /> Administrador
            </button>
          </div>

          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="label">
                {role === "admin" ? "Senha do administrador" : "Senha do vendedor"}
              </label>
              <input
                className="input"
                type="password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite a chave de acesso"
              />
            </div>
            {err && <div className="text-sm text-danger">{err}</div>}
            <button className="btn-primary w-full" disabled={loading || !password}>
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p className="text-xs text-white/40 mt-4">
            Esqueceu a senha? Fale com o administrador do hub.
          </p>
        </div>
      </div>
    </div>
  );
}
