import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/items/new", "/items/", "/admin"];

function isProtected(pathname: string): boolean {
  if (pathname.startsWith("/items/new")) return true;
  if (/^\/items\/[^/]+\/edit$/.test(pathname)) return true;
  if (pathname.startsWith("/admin")) return true;
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtected(pathname)) {
    return NextResponse.next();
  }

  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ??
    request.cookies.get("__Secure-authjs.session-token")?.value;

  if (!sessionToken) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/items/new", "/items/:id/edit", "/admin/:path*"],
};
