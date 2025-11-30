import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get("token")?.value || "";
  const role = request.cookies.get("role")?.value || "";

  // Jika sudah login sebagai role tertentu, blokir akses ke halaman signin role lain
  if (token && role) {
    if (path.startsWith("/auth/admin/signin") && role !== "admin") {
      // Sudah login sebagai instruktur/peserta, redirect ke dashboard sesuai role
      if (role === "instruktur") {
        return NextResponse.redirect(
          new URL("/instruktur/dashboard", request.url),
        );
      }
      if (role === "peserta") {
        return NextResponse.redirect(
          new URL("/peserta/dashboard", request.url),
        );
      }
    }
    if (path.startsWith("/auth/instruktur/signin") && role !== "instruktur") {
      if (role === "admin") {
        return NextResponse.redirect(
          new URL("/admin", request.url),
        );
      }
      if (role === "peserta") {
        return NextResponse.redirect(
          new URL("/peserta/dashboard", request.url),
        );
      }
    }
    if (path.startsWith("/auth/peserta/signin") && role !== "peserta") {
      if (role === "admin") {
        return NextResponse.redirect(
          new URL("/admin", request.url),
        );
      }
      if (role === "instruktur") {
        return NextResponse.redirect(
          new URL("/instruktur/dashboard", request.url),
        );
      }
    }
    // Sudah login dan akses signin sesuai role
    if (path.startsWith("/auth/admin/signin") && role === "admin") {
      const url = new URL("/admin", request.url);
      url.searchParams.set("alreadyLoggedIn", "true");
      return NextResponse.redirect(url);
    }
    if (path.startsWith("/auth/instruktur/signin") && role === "instruktur") {
      const url = new URL("/instruktur/dashboard", request.url);
      url.searchParams.set("alreadyLoggedIn", "true");
      return NextResponse.redirect(url);
    }
    if (path.startsWith("/auth/peserta/signin") && role === "peserta") {
      const url = new URL("/peserta/dashboard", request.url);
      url.searchParams.set("alreadyLoggedIn", "true");
      return NextResponse.redirect(url);
    }
  }
  // Allow access to auth pages if not logged in
  if (path.startsWith("/auth/")) {
    return NextResponse.next();
  }

  // ADMIN
  if (path.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/auth/admin/signin", request.url));
    }
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/auth/admin/signin", request.url));
    }
  }
  // INSTRUKTUR
  if (path.startsWith("/instruktur")) {
    if (!token) {
      return NextResponse.redirect(
        new URL("/auth/instruktur/signin", request.url),
      );
    }
    if (role !== "instruktur") {
      return NextResponse.redirect(
        new URL("/auth/instruktur/signin", request.url),
      );
    }

    // Additional ownership check for activity pages:
    // If the route is /instruktur/activity/:id (or deeper), verify the logged-in
    // instruktur actually is the instruktur_id for that activity. If not,
    // redirect to instruktur dashboard (no access).
    try {
      const match = path.match(/^\/instruktur\/activity\/(\d+)(?:\/|$)/);
      if (match) {
        const activityId = match[1];

        // Determine backend base URL (use env var if provided, fallback to origin)
        const backendBase = (process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE_URL) || `${new URL(request.url).origin}`;

        // Fetch current user info using token
        let meId: number | null = null;
        if (token) {
          try {
            const meRes = await fetch(`${backendBase.replace(/\/$/, '')}/auth/me`, {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
              },
            });
            if (meRes.ok) {
              const meJson = await meRes.json();
              // Try common shapes: { id } or { data: { id } } or { user: { id } }
              meId = meJson.id ?? meJson.data?.id ?? meJson.user?.id ?? null;
            }
          } catch (e) {
            // ignore and treat as not authed
            meId = null;
          }
        }

        // If we couldn't obtain current user id, force re-login
        if (!meId) {
          return NextResponse.redirect(
            new URL('/auth/instruktur/signin', request.url)
          );
        }

        // Fetch activity details
        try {
          const actRes = await fetch(`${backendBase.replace(/\/$/, '')}/data-activities/${activityId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
          });
          if (actRes.ok) {
            const actJson = await actRes.json();
            const instrukturId = actJson.data?.instruktur_id ?? actJson.instruktur_id ?? null;
            if (!instrukturId || Number(instrukturId) !== Number(meId)) {
              // Not the owner — block access with notification
              const response = NextResponse.redirect(new URL('/instruktur/dashboard', request.url));
              response.cookies.set('access_denied_message', 'Anda tidak memiliki akses ke activity ini', {
                maxAge: 5, // expire after 5 seconds
                path: '/',
                httpOnly: false, // allow JS to read (for toast notification)
              });
              return response;
            }
          } else if (actRes.status === 404) {
            // Activity not found — redirect away with notification
            const response = NextResponse.redirect(new URL('/instruktur/dashboard', request.url));
            response.cookies.set('access_denied_message', 'Activity tidak ditemukan', {
              maxAge: 5,
              path: '/',
              httpOnly: false,
            });
            return response;
          } else {
            // On other fetch failures, be permissive and allow (or choose to block).
            // We'll allow to avoid accidental lockouts due to transient errors.
          }
        } catch (e) {
          // Network/error — allow through (avoid blocking on transient failures)
        }
      }
    } catch (e) {
      // swallow errors to avoid breaking middleware
    }
  }

  // PESERTA - No authentication required
  if (path.startsWith("/peserta")) {
    // If there's a pending reset cookie, redirect back to reset password page
    const pending = request.cookies.get("pending_reset")?.value;
    if (pending) {
      // try to send phone if available
      const phone = request.cookies.get("pending_reset_nohp")?.value || "";
      const url = new URL(`/auth/peserta/reset-password${phone ? `?no_hp=${encodeURIComponent(phone)}` : ""}`, request.url);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Jika sudah login, tidak bisa akses halaman signin sesuai role
  if (path.startsWith("/auth/admin/signin") && token && role === "admin") {
    const url = new URL("/admin", request.url);
    url.searchParams.set("alreadyLoggedIn", "true");
    return NextResponse.redirect(url);
  }
  if (
    path.startsWith("/auth/instruktur/signin") &&
    token &&
    role === "instruktur"
  ) {
    const url = new URL("/instruktur", request.url);
    url.searchParams.set("alreadyLoggedIn", "true");
    return NextResponse.redirect(url);
  }
  if (path.startsWith("/auth/peserta/signin") && token && role === "peserta") {
    const url = new URL("/peserta", request.url);
    url.searchParams.set("alreadyLoggedIn", "true");
    return NextResponse.redirect(url);
  }
}

// Configure which paths should be handled by the middleware
export const config = {
  matcher: [
    "/admin/:path*",
    "/instruktur/:path*",
    "/peserta/:path*",
    "/auth/:path*",
  ],
};
