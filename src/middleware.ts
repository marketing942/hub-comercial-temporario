import { NextResponse, type NextRequest } from "next/server";
import { decodeSession } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
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
  matcher: ["/admin/:path*", "/seller/:path*", "/dashboard/:path*", "/escolher-vendedor"],
};
