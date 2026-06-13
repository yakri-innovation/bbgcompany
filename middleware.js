import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const pathname = req.nextUrl.pathname;
    const role = req.nextauth.token?.role;

    if (pathname.startsWith("/admin") && !["ADMIN", "SUPER_ADMIN"].includes(role)) {
      if (role === "MANAGER") {
        return NextResponse.redirect(new URL("/manager", req.url));
      }

      return NextResponse.redirect(new URL("/espace-client", req.url));
    }

    if (pathname.startsWith("/manager") && !["MANAGER", "ADMIN", "SUPER_ADMIN"].includes(role)) {
      if (["ADMIN", "SUPER_ADMIN"].includes(role)) {
        return NextResponse.redirect(new URL("/admin", req.url));
      }

      return NextResponse.redirect(new URL("/espace-client", req.url));
    }

    return NextResponse.next();
  },
  {
    pages: {
      signIn: "/connexion"
    },
    callbacks: {
      authorized: ({ token }) => Boolean(token)
    }
  }
);

export const config = {
  matcher: ["/espace-client/:path*", "/admin/:path*", "/manager/:path*"]
};
