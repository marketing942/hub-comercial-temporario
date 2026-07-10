import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB (margem; cliente comprime antes)
// Mapa MIME -> extensao. A extensao vem SEMPRE daqui, nunca do nome do
// arquivo enviado pelo cliente (evita subir .svg/.html com XSS armazenado).
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const ALLOWED = Object.keys(EXT_BY_MIME);

export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "seller" || !s.sellerId) {
    return NextResponse.json({ error: "Apenas vendedor logado." }, { status: 401 });
  }
  const form = await req.formData().catch(() => null);
  const file = form?.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Arquivo nao enviado." }, { status: 400 });
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Formato invalido. Use JPG, PNG, WEBP ou GIF." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Arquivo maior que 10MB depois da compressao." }, { status: 400 });
  }

  const ext = EXT_BY_MIME[file.type];
  const path = `${s.sellerId}/avatar-${Date.now()}.${ext}`;

  const buf = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await supabaseAdmin.storage
    .from("avatars")
    .upload(path, buf, { contentType: file.type, upsert: true });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const { data: pub } = supabaseAdmin.storage.from("avatars").getPublicUrl(path);
  const url = pub.publicUrl;

  const { error: updErr } = await supabaseAdmin
    .from("sellers")
    .update({ avatar_url: url })
    .eq("id", s.sellerId);
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  return NextResponse.json({ url });
}

export async function DELETE() {
  const s = await getSession();
  if (s?.role !== "seller" || !s.sellerId) {
    return NextResponse.json({ error: "Apenas vendedor logado." }, { status: 401 });
  }
  const { error } = await supabaseAdmin
    .from("sellers")
    .update({ avatar_url: null })
    .eq("id", s.sellerId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
