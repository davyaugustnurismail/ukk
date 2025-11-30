"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  Shield,
  Lock,
  FileCheck,
  ChevronDown,
  LogOut,
  Download,
  QrCode,
  Share2,
  Search,
  Calendar,
  CheckCircle,
  Clock,
  Hash,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Key,
  Hourglass,
  Eye,
  ExternalLink,
  MapPin,        // NEW - untuk lokasi
  GraduationCap, // NEW - untuk instruktur
  Tag,           // NEW - untuk tipe anggota
  Building2,     // NEW - untuk organizer
} from "lucide-react";
import api from "@/lib/axios";
import { toast } from "react-toastify";

type CertStatus = "valid" | "expired" | "pending";

interface Certificate {
  id: number;
  certificate_number: string;
  activity_id?: number | string;
  activity_name: string;
  filename?: string;
  organizer: string;
  issued_at: string;
  status: CertStatus;
  instruktur_name?: string;
  member_type?: string;
  location?: string;
  color: string;
  data_activity_id?: number; // NEW: For preview functionality
}

interface Notification {
  id: number;
  type: "info" | "success" | "warning";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export default function DashboardPage() {
  const router = useRouter();

  // UI state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // User
  const [userId, setUserId] = useState<number | string>("");
  const [userName, setUserName] = useState("Peserta");
  const [userEmail, setUserEmail] = useState("");
  const [totalCertificatesCount, setTotalCertificatesCount] = useState<number | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Data sertifikat
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  // Search/filter/sort
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | CertStatus>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "az" | "za">("newest");

  // Stats
  const stats = useMemo(() => {
    const totalCertificates = totalCertificatesCount ?? certificates.length;
    const totalActivities = new Set(
      certificates.map((c) => c.activity_id ?? c.activity_name ?? "")
    ).size;
    return { totalCertificates, totalActivities };
  }, [certificates, totalCertificatesCount]);


  // Load data
  useEffect(() => {
    const load = async () => {
      try {
        // Prevent accessing dashboard if there's a pending password reset in progress
        try {
          const pending = localStorage.getItem("pending_reset");
          if (pending) {
            // redirect to reset page (preserve phone if available)
            const parsed = JSON.parse(pending || "{}");
            const phone = parsed?.no_hp || "";
            const qs = phone ? `?no_hp=${encodeURIComponent(phone)}` : "";
            setLoading(false);
            router.replace(`/auth/peserta/reset-password${qs}`);
            return;
          }
        } catch (e) {
          // ignore localStorage errors
        }
        // Ensure we have a token before calling protected endpoints
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) {
          // No token: redirect to signin
          setLoading(false);
          router.replace("/auth/peserta/signin");
          return;
        }

        // Ensure axios sends Authorization on full page refresh
        try {
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        } catch (err) {
          // ignore
        }

        // 0) profile (optional)
        try {
          const me = await api.get("/auth/me");
          const id = me?.data?.id ?? me?.data?.user?.id;
          const name = me?.data?.name ?? me?.data?.user?.name ?? "Peserta";
          const email = me?.data?.email ?? me?.data?.user?.email ?? "";
          if (id) setUserId(id);
          if (name) setUserName(name);
          if (email) setUserEmail(email);
        } catch (err) {
          // ignore profile error
        }

        // 1) dashboard summary
        const dash = await api.get("/users/dashboard");
        const total = dash?.data?.data?.total_certificates ?? null;
        setTotalCertificatesCount(total);

        // 2) certificates list (paginated) - request a reasonably large page to show all
        const res = await api.get(`/users/myCertificates?per_page=1000`);
        const arr = Array.isArray(res?.data?.data) ? res.data.data : [];
        const mapped: Certificate[] = arr.map((raw: any, idx: number) => {
          // Normalize commonly-used fields from different API shapes / languages
          const instrukturName = raw?.instruktur_name ?? raw?.instructor ?? raw?.nama_instruktur ?? raw?.trainer ?? raw?.tutor ?? "";
          const memberTypeRaw = raw?.member_type ?? raw?.type_member ?? raw?.type ?? raw?.role ?? "";
          const memberType = memberTypeRaw === "users" ? "peserta" : memberTypeRaw;
          const location = raw?.location ?? raw?.lokasi ?? raw?.venue ?? raw?.tempat ?? raw?.place ?? raw?.data_activity?.location ?? raw?.activity?.location ?? raw?.event?.location ?? "";
          // Support controller.myCertificates shape: { id, certificate_number, filename, assigned_at, download_url }
          if (raw && (raw.certificate_number || raw.filename)) {
              return {
                id: raw.id ?? idx,
                certificate_number: raw.certificate_number ?? raw.number ?? "-",
                activity_id: raw.data_activity_id ?? raw.activity_id ?? raw.activity?.id ?? raw.id,
                // Prefer activity_name/title provided by API. Fallback to filename only if no title present.
                activity_name: raw.activity_name ?? raw.title ?? raw.filename ?? "Sertifikat",
                // Persist filename separately when available
                filename: raw.filename ?? undefined,
                organizer: raw.organizer ?? raw.organization ?? "",
                issued_at: raw.assigned_at ?? raw.issued_at ?? raw.date ?? raw.created_at ?? "-",
                status: (raw.status as CertStatus) ?? "valid",
                instruktur_name: instrukturName,
                member_type: memberType,
                location,
                color: gradient(idx),
                data_activity_id: raw.data_activity_id // NEW: Store data_activity_id separately
              };
            }

          // Fallback to previous flexible mapping for older API shapes
          const activity = raw.activity ?? raw.event ?? null;
          const activityId = raw.data_activity_id ?? raw.activity_id ?? activity?.id ?? raw.id;
          const activityName =
            raw.activity_name ?? activity?.name ?? activity?.title ?? activity?.judul ?? raw.title ?? raw.name ?? (typeof raw.activity === "string" ? raw.activity : null) ?? "-";
          const organizer = raw.organizer ?? raw.organization ?? activity?.organizer ?? activity?.organizer_name ?? "Unknown";
          const issuedAt = raw.issued_at ?? raw.date ?? activity?.date ?? activity?.start_date ?? activity?.start_at ?? raw.created_at ?? "-";
          const instruktur = instrukturName || raw.instruktur_name || raw.instructor || raw.trainer || activity?.instructor || activity?.instruktur || activity?.speaker || "";


          return {
            id: raw.id ?? idx,
            certificate_number: raw.certificate_number ?? raw.number ?? "-",
            activity_id: activityId,
            activity_name: activityName,
            organizer,
            issued_at: issuedAt,
            status: (raw.status as CertStatus) ?? "valid",
            instruktur_name: instruktur || instrukturName,
            member_type: memberType,
            location: location || (raw.location || raw.lokasi || raw.venue || raw.tempat || raw.place || raw.data_activity?.location || raw.activity?.location || raw.event?.location || ""),
            color: gradient(idx),
          };
        });
          // default newest
          mapped.sort(
            (a, b) =>
              (new Date(b.issued_at as any).getTime() || 0) -
              (new Date(a.issued_at as any).getTime() || 0)
          );
          setCertificates(mapped);
      } catch (e: any) {
        console.error("Failed loading dashboard:", e);
        // If unauthorized, clear stored token and redirect to signin
        if (e?.response?.status === 401) {
          try {
            localStorage.removeItem("token");
          } catch (err) {}
          delete api.defaults.headers.common["Authorization"];
          router.replace("/auth/peserta/signin");
          return;
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  // Helpers
  const gradient = (i: number) => {
    const g = [
      "from-green-500 to-emerald-500",
      "from-blue-500 to-indigo-500",
      "from-purple-500 to-pink-500",
      "from-orange-400 to-yellow-400",
      "from-red-500 to-rose-500",
      "from-teal-500 to-cyan-500",
    ];
    return g[i % g.length];
  };

  const markNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  // (removed dropdown outside-click handler — dropdowns were removed)

  const handleLogout = async () => {
    setShowLogoutModal(false); // Close modal first
    
    try {
      await api.post("/users/logout");
      toast.success("Anda telah keluar.");
    } catch (err: any) {
      // still proceed to clear client state
      toast.error("Logout gagal ke server, melanjutkan pembersihan lokal.");
    }

    try {
      localStorage.removeItem("token");
    } catch (e) {}

    // remove Authorization header from axios defaults
    try {
      delete api.defaults.headers.common["Authorization"];
    } catch (err) {}

    try {
      sessionStorage.clear();
    } catch (e) {}

    // small delay so toast is visible before redirect
    setTimeout(() => router.replace("/auth/peserta/signin"), 400);
  };

  const handleDownloadCertificate = async (certId: number) => {
    try {
      const response = await api.get(`/certificates/${certId}/download`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = url;
      a.setAttribute("download", `certificate-${certId}.pdf`);
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.error(e);
      alert("Gagal mengunduh sertifikat.");
    }
  };

  // Preview-by-user (PDF) — buka tab baru
  const handlePreview = (cert: Certificate) => {
    if (!userId) {
      alert("User tidak ditemukan.");
      return;
    }
    if (!cert.activity_id) {
      alert("Data activity ID tidak ditemukan.");
      return;
    }
    
    // Build the query parameters using data_activity_id as required by backend
    // Debug info
    console.log('Preview Certificate:', {
      userId,
      certificateId: cert.id,
      activityId: cert.activity_id,
      rawData: cert
    });
    
    const params = new URLSearchParams({
      data_activity_id: String(cert.activity_id) // Use the actual data_activity_id
    }).toString();
    
    const base = (api.defaults.baseURL || "").replace(/\/+$/, "");
    const url = `${base}/sertifikat-templates/preview-by-user/${userId}?${params}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Filter + Sort
  const filtered = useMemo(() => {
    let list = certificates.filter((c) => {
      const q = (searchQuery || "").toLowerCase();
      const matchQ =
        c.activity_name.toLowerCase().includes(q) ||
        c.certificate_number.toLowerCase().includes(q) ||
        (c.instruktur_name || "").toLowerCase().includes(q);
      const matchS = filterStatus === "all" ? true : c.status === filterStatus;
      return matchQ && matchS;
    });

    switch (sortBy) {
      case "oldest":
        list = list.sort(
          (a, b) =>
            (new Date(a.issued_at as any).getTime() || 0) -
            (new Date(b.issued_at as any).getTime() || 0)
        );
        break;
      case "az":
        list = list.sort((a, b) => a.activity_name.localeCompare(b.activity_name));
        break;
      case "za":
        list = list.sort((a, b) => b.activity_name.localeCompare(a.activity_name));
        break;
      default:
        list = list.sort(
          (a, b) =>
            (new Date(b.issued_at as any).getTime() || 0) -
            (new Date(a.issued_at as any).getTime() || 0)
        );
    }

    return list;
  }, [certificates, searchQuery, filterStatus, sortBy]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 relative overflow-auto">
      {/* Background bubbles */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-20 left-10 w-32 h-32 bg-green-200 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-emerald-200 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-teal-200 rounded-full blur-2xl animate-pulse" style={{ animationDelay: "2s" }}></div>
      </div>

      {/* Header */}
      <header className="relative z-10 p-4 lg:p-6 bg-white/80 backdrop-blur-sm border-b border-green-100">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Award className="h-8 w-8 text-green-600" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
            </div>
            <span className="text-xl font-bold text-green-900">PT. DiAntara Intermedia</span>
          </div>

          <div className="flex items-center gap-4">
            {/* preview removed */}

            {/* User (show name only) and Logout to its right */}
            <div className="user-menu-and-logout flex items-center gap-2">
              <div className="user-menu-container flex items-center gap-2">
                <span className="px-3 py-2 bg-green-100 hover:bg-green-200 rounded-lg transition-colors text-sm font-semibold text-green-900">
                  {userName}
                </span>
                {userEmail && (
                  <span className="px-3 py-2 bg-green-100 hover:bg-green-200 rounded-lg transition-colors text-sm font-semibold text-green-900">
                    {userEmail}
                  </span>
                )}
              </div>

              <button
                onClick={() => setShowLogoutModal(true)}
                aria-label="Keluar"
                title="Keluar"
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center gap-2"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-sm font-medium text-red-600">Keluar</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <LogOut className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <h3 className="text-lg font-semibold leading-6 text-gray-900">
                      Konfirmasi Keluar
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Apakah Anda yakin ingin keluar dari akun Anda? 
                        Anda perlu login kembali untuk mengakses sertifikat Anda.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex w-full justify-center rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                >
                  Ya, Keluar
                </button>
                <button
                  type="button"
                  onClick={() => setShowLogoutModal(false)}
                  className="mt-3 inline-flex w-full justify-center rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      

      {/* Main */}
      <main className="relative z-10 px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome */}
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-green-900 mb-2">
              Selamat Datang, {userName}! 👋
            </h1>
            <p className="text-green-700">Kelola dan lihat semua sertifikat Anda di satu tempat</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <div className="bg-white/95 backdrop-blur-lg rounded-xl border border-green-100 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <FileCheck className="h-6 w-6 text-green-600" />
                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">Total</span>
              </div>
              <p className="text-3xl font-bold text-green-900">{stats.totalCertificates}</p>
              <p className="text-sm text-green-700 mt-1">Sertifikat Dimiliki</p>
            </div>

            <div className="bg-white/95 backdrop-blur-lg rounded-xl border border-green-100 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="h-6 w-6 text-blue-600" />
                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">Kegiatan</span>
              </div>
              <p className="text-3xl font-bold text-green-900">{stats.totalActivities}</p>
              <p className="text-sm text-green-700 mt-1">Kegiatan Diikuti</p>
            </div>

            {/* <div className="bg-white/95 backdrop-blur-lg rounded-xl border border-green-100 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <Eye className="h-6 w-6 text-emerald-600" />
                <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">Preview</span>
              </div>
              <button
                onClick={() => handlePreview()}
                className="mt-1 inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-900 font-semibold underline underline-offset-4"
              >
                Preview Sertifikat Saya
                <ExternalLink className="h-4 w-4" />
              </button>
              <p className="text-xs text-green-600 mt-2">Akan membuka tab baru (PDF)</p>
            </div> */}
          </div>

          {/* Search / Filter / Sort */}
          <div className="bg-white/95 backdrop-blur-lg rounded-xl border border-green-100 p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari sertifikat berdasarkan nama, nomor, atau instruktur..."
                    className="w-full rounded-lg border-2 border-green-200 px-4 py-2 pl-10 bg-green-50 focus:bg-white focus:border-green-400 focus:outline-none transition-all"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-400" />
                </div>
              </div>
              <div className="flex gap-2">
                {/* <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="rounded-lg border-2 border-green-200 px-4 py-2 bg-green-50 focus:bg-white focus:border-green-400 focus:outline-none transition-all"
                >
                  <option value="all">Semua Status</option>
                  <option value="valid">Valid</option>
                  <option value="expired">Expired</option>
                  <option value="pending">Pending</option>
                </select> */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="rounded-lg border-2 border-green-200 px-4 py-2 bg-green-50 focus:bg-white focus:border-green-400 focus:outline-none transition-all"
                >
                  <option value="newest">Terbaru</option>
                  <option value="oldest">Terlama</option>
                  <option value="az">A-Z</option>
                  <option value="za">Z-A</option>
                </select>
              </div>
            </div>
          </div>

          {/* Riwayat Sertifikat */}
          {loading ? (
            <div className="text-center text-green-700">Memuat data…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-green-700">Belum ada sertifikat.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map((cert) => (
                <div
                  key={cert.id}
                  className={`bg-white/95 backdrop-blur-lg rounded-2xl border overflow-hidden hover:shadow-xl transition-all duration-300 group ${
                    cert.status === "pending" ? "border-orange-200 opacity-75" : "border-green-100"
                  }`}
                >
                  <div className={`h-2 bg-gradient-to-r ${cert.color}`}></div>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-green-900 text-lg mb-1">{cert.activity_name}</h3>
                        <p className="text-sm text-green-600">{cert.organizer}</p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          cert.status === "valid"
                            ? "bg-green-100 text-green-700"
                            : cert.status === "expired"
                            ? "bg-red-100 text-red-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {cert.status === "valid" ? "Valid" : cert.status === "expired" ? "Expired" : "Pending"}
                      </span>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-green-700">
                        <Hash className="h-4 w-4 text-green-500" />
                        <span className="font-mono text-xs">{cert.certificate_number}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-green-700">
                        <Calendar className="h-4 w-4 text-green-500" />
                        <span>{cert.issued_at}</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-green-700">
                        <Award className="h-4 w-4 text-green-500 mt-1" />
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-green-800 font-medium">Judul Kegiatan</span>
                          <span className="font-semibold text-sm text-green-900">{cert.activity_name ?? "-"}</span>
                          {cert.status !== "pending" && (
                            <div className="flex flex-col gap-1 mt-1">
                              {cert.member_type && (
                                <span className="text-xs text-green-700">
                                  Sebagai: <span className="font-bold capitalize">{cert.member_type}</span>
                                </span>
                              )}
                              {cert.instruktur_name && (
                                <span className="text-xs text-green-700">
                                  Instruktur: <span className="font-bold">{cert.instruktur_name}</span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-green-700">
                        <span className="mt-1 text-xs text-green-800 font-medium min-w-[60px]">Nama File</span>
                        <span className="font-semibold text-sm text-green-900">{cert.filename ?? cert.activity_name}</span>
                      </div>
                      {cert.status === "pending" && (
                        <div className="flex items-center gap-2 text-sm text-orange-700">
                          <Hourglass className="h-4 w-4 text-orange-500" />
                          <span>Estimasi: 2–3 hari kerja</span>
                        </div>
                      )}
                    </div>

                      {cert.status === "pending" ? (
                      <button
                        disabled
                        className="w-full py-2 bg-gray-300 text-gray-500 font-semibold rounded-lg cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <Clock className="h-4 w-4" />
                        Menunggu
                      </button>
                    ) : (
                      <div>
                        <button
                          onClick={() => handlePreview(cert)}
                          className="w-full py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all flex items-center justify-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Preview
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* (Opsional) Pagination dummy */}
          {/* <div className="flex justify-center mt-8">
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-white border-2 border-green-200 text-green-700 rounded-lg hover:bg-green-50 transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg">
                1
              </button>
              <button className="px-4 py-2 bg-white border-2 border-green-200 text-green-700 rounded-lg hover:bg-green-50 transition-colors">
                2
              </button>
              <button className="px-4 py-2 bg-white border-2 border-green-200 text-green-700 rounded-lg hover:bg-green-50 transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div> */}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-16 py-8 border-t border-green-100 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-xs text-green-600">
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
            <div className="flex items-center gap-2 text-xs text-green-700">
              <Lock className="h-3 w-3" />
              <span>&copy; 2025 PT DiAntara Intermedia</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
