"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Award,
  Shield,
  Lock,
  FileCheck,
  Eye,
  EyeOff,
  Unlock,
  KeyRound,
  Smartphone as SmartphoneIcon,
} from "lucide-react";
import api from "@/lib/axios";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useSearchParams();

  // token & phone dari URL (?token=...&no_hp=...)
  const token = params.get("token") || "";
  const phone = params.get("no_hp") || params.get("phone") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass1, setShowPass1] = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  // validasi sederhana
  const canSubmit = useMemo(() => {
    const min = password.length >= 8;
    const same = password === confirm;
    const hasPhone = !!phone;
    return hasPhone && min && same && !loading;
  }, [phone, password, confirm, loading]);

  useEffect(() => {
    if (!phone) setErr("Tautan reset tidak valid atau sudah kedaluwarsa.");
    else setErr(null);
  }, [phone]);

  // If this page opened with a token, mark a pending reset so other pages (dashboard) can't be opened
  useEffect(() => {
    if (token) {
      try {
        localStorage.setItem("pending_reset", JSON.stringify({ token, no_hp: phone }));
        // also set a cookie so middleware (server) can detect pending reset
        try {
          document.cookie = `pending_reset=1; path=/`;
          if (phone) document.cookie = `pending_reset_nohp=${encodeURIComponent(phone)}; path=/`;
        } catch (e) {}
      } catch (e) {}
    }
    // do not remove pending_reset on unmount; only remove after successful reset
  }, [token, phone]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setOk(null);

    if (!phone) {
      setErr("Tautan reset tidak valid atau sudah kedaluwarsa.");
      return;
    }
    if (!password || password.length < 8) {
      setErr("Password minimal 8 karakter.");
      return;
    }
    if (password !== confirm) {
      setErr("Konfirmasi password tidak sama.");
      return;
    }

    setLoading(true);
    try {
      let res;
      if (token) {
        // FLOW: reset via TOKEN (belum login)
        res = await api.put("/users/reset-password", {
          token,
          no_hp: phone,
          password,
          password_confirmation: confirm,
        });
      } else {
        // FLOW: force change (sudah login) – perlu Bearer token dari login
        res = await api.post("/me/password", {
          password,
          password_confirmation: confirm,
          // current_password: ... // kalau kamu wajibkan untuk user non-default
        });
        // opsional: setelah sukses force-change, hapus token lokal agar login ulang
        localStorage.removeItem("token");
        delete api.defaults.headers.common["Authorization"];
      }

        // Jika backend mengembalikan token baru, simpan dan set header
        const returnedToken = res?.data?.token || res?.data?.access_token;
        if (returnedToken) {
          try {
            localStorage.setItem("token", returnedToken);
            api.defaults.headers.common["Authorization"] = `Bearer ${returnedToken}`;
          } catch (err) {
            // ignore localStorage errors
          }
        }

        setOk(res?.data?.message || "Password berhasil direset. Anda akan diarahkan ke dashboard.");
        // clear pending reset marker so dashboard can be used again
        try { localStorage.removeItem("pending_reset"); } catch (e) {}
        try {
          document.cookie = "pending_reset=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          document.cookie = "pending_reset_nohp=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        } catch (e) {}
        // Redirect ke dashboard peserta jika token tersedia, else ke login
        setTimeout(() => {
          if (returnedToken) router.replace("/peserta/dashboard");
          else router.replace("/auth/peserta/signin");
        }, 1200);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.errors?.current_password?.[0] ||
        e?.response?.data?.errors?.password?.[0] ||
        e?.response?.data?.error ||
        "Gagal mereset password. Tautan mungkin sudah kedaluwarsa.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  const maskedPhone = useMemo(() => {
    if (!phone) return "";
    const clean = String(phone).replace(/[^0-9]/g, "");
    if (clean.length <= 4) return clean.replace(/.(?=.{1})/g, "*");
    const head = clean.slice(0, 3);
    const tail = clean.slice(-2);
    return `${head}${"*".repeat(Math.max(1, clean.length - 5))}${tail}`;
  }, [phone]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 relative overflow-auto">
      {/* Background bubbles */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-20 left-10 w-32 h-32 bg-green-200 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-emerald-200 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-teal-200 rounded-full blur-2xl animate-pulse" style={{ animationDelay: "2s" }}></div>
      </div>

      {/* Header */}
      <header className="relative z-10 p-4 lg:p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Award className="h-8 w-8 text-green-600" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
            </div>
            <span className="text-xl font-bold text-green-900">PT. DiAntara Intermedia</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm text-green-700">
            <Shield className="h-4 w-4" />
            <span>Secure & Trusted</span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 px-4 pb-20">
        <div className="max-w-md mx-auto pt-8 lg:pt-16">
          {/* Hero */}
          <div className="text-center mb-8">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
              <KeyRound className="relative mx-auto h-14 w-14 lg:h-16 lg:w-16 text-green-600" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-green-800 to-emerald-700 bg-clip-text text-transparent mb-3">
              Atur Ulang Password
            </h1>
            <p className="text-green-700">
              {phone ? (
                <span className="inline-flex items-center gap-2">
                  <SmartphoneIcon className="h-4 w-4" />
                  {token ? <>Tautan untuk nomor <b>{maskedPhone}</b></> : <>Atur kata sandi baru untuk nomor <b>{maskedPhone}</b></>}
                </span>
              ) : (
                "Gunakan tautan dari SMS untuk mereset password."
              )}
            </p>
          </div>

          {/* Card */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-300 to-emerald-300 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
            <div className="relative rounded-2xl bg-white/95 backdrop-blur-lg border border-green-100 shadow-lg p-6 lg:p-8">
              {err && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{err}</div>}
              {ok && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">{ok}</div>}

              <form onSubmit={onSubmit} className="space-y-5">
                <div>
                  <label className="block mb-2 text-sm font-semibold text-green-900">Nomor HP</label>
                  <div className="relative">
                    <input type="tel" value={phone} readOnly className="w-full rounded-xl border-2 px-4 py-3 bg-green-50 text-green-900 border-green-200 focus:outline-none" />
                    <SmartphoneIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-400" />
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-semibold text-green-900">Password Baru</label>
                  <div className="relative">
                    <input
                      type={showPass1 ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimal 8 karakter"
                      className="w-full rounded-xl border-2 px-4 py-3 bg-green-50 text-green-900 placeholder-green-400 border-green-200 focus:outline-none focus:border-green-400 focus:bg-white transition-all"
                    />
                    <button type="button" onClick={() => setShowPass1((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" aria-label={showPass1 ? "Sembunyikan password" : "Tampilkan password"}>
                      {showPass1 ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-green-600">Gunakan kombinasi huruf besar, kecil, angka, dan simbol untuk keamanan lebih baik.</p>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-semibold text-green-900">Konfirmasi Password</label>
                  <div className="relative">
                    <input
                      type={showPass2 ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Ulangi password baru"
                      className="w-full rounded-xl border-2 px-4 py-3 bg-green-50 text-green-900 placeholder-green-400 border-green-200 focus:outline-none focus:border-green-400 focus:bg-white transition-all"
                    />
                    <button type="button" onClick={() => setShowPass2((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" aria-label={showPass2 ? "Sembunyikan password" : "Tampilkan password"}>
                      {showPass2 ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {confirm && password !== confirm && <p className="mt-2 text-xs text-red-600">Konfirmasi tidak sama.</p>}
                </div>

                <button type="submit" disabled={!canSubmit} className="w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 py-3 font-semibold text-white transition-all duration-300 hover:from-green-600 hover:to-emerald-600 hover:shadow-lg disabled:opacity-50">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                      Memproses...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Unlock className="h-5 w-5" />
                      Simpan Password
                    </span>
                  )}
                </button>

                <div className="flex items-center justify-between text-sm">
                  <button type="button" onClick={() => { try { document.cookie = "pending_reset=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"; } catch(e){}; router.push("/login"); }} className="text-green-700 hover:text-green-900 underline underline-offset-4">
                    Kembali ke Login
                  </button>
                  <div className="flex items-center gap-1 text-green-600">
                    <Lock className="h-3 w-3" />
                    <span>Encrypted</span>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Footer trust */}
          <div className="text-center space-y-4 mt-8">
            <div className="flex items-center justify-center gap-4 text-xs text-green-600">
              <div className="flex items-center gap-1"><Shield className="h-3 w-3" /><span>Secure</span></div>
              <div className="flex items-center gap-1"><Lock className="h-3 w-3" /><span>Encrypted</span></div>
              <div className="flex items-center gap-1"><FileCheck className="h-3 w-3" /><span>Verified</span></div>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-green-100 text-xs text-green-700">
              <Lock className="h-3 w-3" />
              <span>&copy; 2025 PT DiAntara Intermedia</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
