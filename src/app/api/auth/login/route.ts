import { NextResponse } from "next/server";
import { sessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const role = body?.role as "admin" | "seller" | undefined;
  const password = body?.password as string | undefined;

  if (!role || !password) {
    return NextResponse.json({ error: "Dados invalidos." }, { status: 400 });
  }

  const admin = process.env.ADMIN_PASSWORD;
  const seller = process.env.SELLER_PASSWORD;
  if (!admin || !seller) {
    return NextResponse.json(
      { error: "Servidor sem ADMIN_PASSWORD / SELLER_PASSWORD configurado." },
      { status: 500 }
    );
  }

  if (role === "admin" && password !== admin) {
    return NextResponse.json({ error: "Senha de administrador incorreta." }, { status: 401 });
  }
  if (role === "seller" && password !== seller) {
    return NextResponse.json({ error: "Senha de vendedor incorreta." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  const c = await sessionCookie({ role });
  res.cookies.set(c);
  return res;
}
