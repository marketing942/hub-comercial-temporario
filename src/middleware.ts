import { NextResponse, type NextRequest } from "next/server";
import { decodeSession } from "@/lib/auth";

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // --- Protecao CSRF (same-origin) nas rotas /api mutantes ---
  // Navegadores sempre enviam Origin em requisicoes cross-origin que mudam
  // estado. Se houver Origin e ela nao bater com o host, bloqueia.
  if (pathname.startsWith("/api") && MUTATING.has(req.method)) {
    const origin = req.headers.get("origin");
    if (origin && origin !== req.nextUrl.origin) {
      return NextResponse.json({ error: "Origem invalida." }, { status: 403 });
    }
  }
  // O middleware nao aplica redirecionamento de pagina para rotas de API.
  if (pathname.startsWith("/api")) return NextResponse.next();

  const token = req.cookies.get("hub_session")?.value;
  const session = await decodeSession(token);

  const isAdminArea = pathname.startsWith("/admin");
  const isSellerArea = pathname.startsWith("/seller");
  const isDashboard = pathname.startsWith("/dashboard");
  const isPickSeller = pathname.startsWith("/escolher-vendedor");

  if (!session && (isAdminArea || isSellerArea || isDashboard || isPickSeller)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (session?.role === "seller" && isAdminArea) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  if (session?.role === "admin" && isSellerArea) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }
  if (session?.role === "seller" && !session.sellerId && (isSellerArea || isDashboard)) {
    return NextResponse.redirect(new URL("/escolher-vendedor", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/seller/:path*",
    "/dashboard/:path*",
    "/escolher-vendedor",
    "/api/:path*",
  ],
};
