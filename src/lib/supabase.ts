import { createClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";

export const DASHBOARD_TAG = "dashboard";

// O /dashboard le os dados de um cache no servidor (ver app/dashboard/page.tsx).
// Toda escrita no banco passa por este client, entao derrubamos o cache aqui:
// qualquer venda, lead ou meta lancada aparece na proxima atualizacao da tela.
const fetchWithInvalidation: typeof fetch = async (input, init) => {
  const res = await fetch(input, init);
  const method = (init?.method || "GET").toUpperCase();
  const href =
    typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  if (res.ok && method !== "GET" && method !== "HEAD" && href.includes("/rest/v1/")) {
    try {
      revalidateTag(DASHBOARD_TAG);
    } catch {
      // fora de uma rota/acao (ex.: durante o render) nao ha o que invalidar
    }
  }
  return res;
};

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: fetchWithInvalidation },
});
