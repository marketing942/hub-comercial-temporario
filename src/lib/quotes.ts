import { supabaseAdmin } from "./supabase";

export async function getDailyQuote(): Promise<{ text: string; author: string | null }> {
  const { data } = await supabaseAdmin.from("motivational_quotes").select("*");
  if (!data || data.length === 0) {
    return { text: "Hoje e o melhor dia pra bater meta.", author: null };
  }
  const seed = Number(new Date().toISOString().slice(0, 10).replace(/-/g, ""));
  const q = data[seed % data.length];
  return { text: q.text, author: q.author };
}
