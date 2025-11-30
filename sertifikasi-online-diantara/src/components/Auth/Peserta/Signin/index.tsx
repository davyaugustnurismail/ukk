"use client";
import React, { useState, useEffect } from "react";
import { Award, Shield, Lock, FileCheck, Eye, EyeOff, LogIn, Unlock, Smartphone } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();

  const [no_hp, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Optional: redirect jika sudah login
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) router.replace("/peserta/dashboard");
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  setErr(null);

    // If already logged in (token present), redirect to dashboard immediately
    try {
      const existing = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (existing) {
        toast.info("Anda sudah masuk. Mengarahkan ke dashboard...");
        router.replace("/peserta/dashboard");
        return;
      }
    } catch (err) {
      // ignore
    }

    if (!no_hp.trim() || !password.trim()) {
      setErr("Nomor HP dan password wajib diisi.");
      toast.error("Nomor HP dan password wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/users/login", { no_hp, password });

      const token = res.data?.token || res.data?.access_token;
      if (token) {
        localStorage.setItem("token", token);
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }
      // Verify role: prefer user object from response, fallback to /auth/me
      let roleId: number | null = null;
      if (res.data?.user && typeof res.data.user.role_id !== 'undefined') {
        roleId = Number(res.data.user.role_id);
      } else {
        try {
          const me = await api.get('/auth/me');
          roleId = me?.data?.role_id ?? me?.data?.user?.role_id ?? null;
        } catch (err) {
          // ignore; roleId remains null
        }
      }

      const isDefault = !!res.data?.is_default_password; // ← datang dari backend
      const redirectPhone = no_hp;

      // Allow peserta (3), panitia (4), and narasumber (5)
      if (roleId && ![3, 4, 5].includes(roleId)) {
        // cleanup token and header
        try { localStorage.removeItem('token'); } catch (e) {}
        try { delete api.defaults.headers.common['Authorization']; } catch (e) {}
        toast.error('Akses hanya untuk peserta, panitia, dan narasumber.');
        // redirect to public peserta page
        setTimeout(() => router.replace('/peserta'), 900);
        return;
      }

      if (isDefault) {
        toast.success("Masuk berhasil. Silakan ubah password.");
        const query = new URLSearchParams({ no_hp: redirectPhone }).toString();
        setTimeout(() => router.replace(`/auth/peserta/reset-password?${query}`), 900);
      } else {
        toast.success("Masuk berhasil. Mengarahkan ke dashboard...");
        setTimeout(() => router.replace("/peserta/dashboard"), 900);
      }
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        "Nomor HP atau password salah.";
      setErr(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push('/peserta')}
              className="ml-3 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/90 border border-green-100 text-green-700 hover:bg-green-50 transition"
              aria-label="Kembali ke halaman peserta"
            >
              ← Kembali
            </button>
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
              <Unlock className="relative mx-auto h-14 w-14 lg:h-16 lg:w-16 text-green-600" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-green-800 to-emerald-700 bg-clip-text text-transparent mb-3">
              Masuk Akun
            </h1>
            <p className="text-green-700">Untuk Peserta, Panitia, dan Narasumber</p>
          </div>

          {/* Card */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-300 to-emerald-300 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
            <div className="relative rounded-2xl bg-white/95 backdrop-blur-lg border border-green-100 shadow-lg p-6 lg:p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                {err && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                    {err}
                  </div>
                )}

                {/* Phone */}
                <div>
                  <label className="block mb-2 text-sm font-semibold text-green-900">
                    Nomor HP
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      inputMode="tel"
                      value={no_hp}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="08xxxxxxxxxx"
                      className="w-full rounded-xl border-2 px-4 py-3 bg-green-50 text-green-900 placeholder-green-400 border-green-200 focus:outline-none focus:border-green-400 focus:bg-white transition-all"
                    />
                    <Smartphone className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-400" />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block mb-2 text-sm font-semibold text-green-900">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan password"
                      className="w-full rounded-xl border-2 px-4 py-3 bg-green-50 text-green-900 placeholder-green-400 border-green-200 focus:outline-none focus:border-green-400 focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500"
                      aria-label={showPass ? "Sembunyikan password" : "Tampilkan password"}
                    >
                      {showPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-green-600">
                    Akun baru dari admin menggunakan password default: <b>password</b>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 py-3 font-semibold text-white transition-all duration-300 hover:from-green-600 hover:to-emerald-600 hover:shadow-lg disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                      Memproses...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <LogIn className="h-5 w-5" />
                      Masuk
                    </span>
                  )}
                </button>

                {/* <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => router.push("/auth/lupa-password")}
                    className="text-green-700 hover:text-green-900 underline underline-offset-4"
                  >
                    Lupa password?
                  </button>
                  
                </div> */}
              </form>
            </div>
          </div>

          {/* Footer trust */}
          <div className="text-center space-y-4 mt-8">
            <div className="flex items-center justify-center gap-4 text-xs text-green-600">
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                <span>Secure</span>
              </div>
              <div className="flex items-center gap-1">
                <Lock className="h-3 w-3" />
                <span>Encrypted</span>
              </div>
              <div className="flex items-center gap-1">
                <FileCheck className="h-3 w-3" />
                <span>Verified</span>
              </div>
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
