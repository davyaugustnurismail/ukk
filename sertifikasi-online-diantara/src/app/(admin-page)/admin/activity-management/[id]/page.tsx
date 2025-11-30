import { cookies, headers } from "next/headers";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import ClientOnly from "@/components/ClientOnly";
import PesertaSection from "@/components/peserta/PesertaSection";
import TemplateSelector from "@/components/TemplateSelector";
import axios from "@/lib/axios";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { id: string };
}

export default async function ActivityDetailInstruktur({ params }: PageProps) {
  // Next.js may provide params as a promise for dynamic routes — await it before use
  const { id } = (await params) as any;

  // Ambil header & cookies request masuk (SSR)
  const hdrs = await headers();
  const cookieHeader = hdrs.get("cookie") ?? undefined;

  // Ambil token dari cookie "token" (biarkan axios instance kamu apa adanya)
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  // GET /data-activities/:id (endpoint tidak diubah)
  let activityData: any = null;
  try {
    const res = await axios.get(`/data-activities/${id}`, {
      headers: {
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        Accept: "application/json",
      },
    });
    activityData = res.data?.data ?? res.data;
  } catch (err: any) {
    // Log error server-side so you can inspect logs; render a simple error UI on client
    // Note: Next.js SSR will still surface server-side logs in its console
    console.error('Failed to fetch activity data:', err?.response?.data ?? err?.message ?? err);
    return (
      <ClientOnly>
        <div className="p-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-800 dark:border-red-800 dark:bg-red-900/20">
            <h2 className="mb-2 text-lg font-semibold">Gagal memuat data kegiatan</h2>
            <p className="text-sm">Terjadi kesalahan pada server saat mengambil detail kegiatan. Silakan coba lagi nanti.</p>
            <div className="mt-4">
              <Link href="/admin/activity-management" className="inline-flex items-center rounded bg-white px-3 py-1 text-sm text-gray-700 hover:bg-gray-100">Kembali</Link>
            </div>
          </div>
        </div>
      </ClientOnly>
    );
  }

  // Backend kamu SUDAH mengembalikan instruktur_name, activity_type_name, peserta, dll
  // Jadi tidak perlu lagi memanggil endpoint /instruktur/:id di sini.

  // Helper time
  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "-";
    const m = timeStr.match(/^(\d{2}):(\d{2})/);
    return m ? `${m[1]}:${m[2]}` : timeStr;
  };

  const templateId = activityData.sertifikat_id || null;
  const templateName = activityData.sertifikat?.name || null;

  const formattedActivity = {
    ...activityData,
    date: activityData.date ? String(activityData.date).split("T")[0] : null,
    activity_name: activityData.activity_name || "Tidak ada nama",
    activity_type_name:
      activityData.activity_type_name ||
      (activityData.activity_type && activityData.activity_type.type_name) ||
      "Tidak ada tipe",
    instruktur_name: activityData.instruktur_name || "Tidak ada instruktur",
    description: activityData.description || "Tidak ada deskripsi",
    location: activityData.location || "Tidak ada lokasi",
    time_start: formatTime(activityData.time_start),
    time_end: formatTime(activityData.time_end),
    totalParticipants:
      ((Array.isArray(activityData.peserta) ? activityData.peserta.length : 0) +
        (Array.isArray(activityData.panitia) ? activityData.panitia.length : 0) +
        (Array.isArray(activityData.narasumber)
          ? activityData.narasumber.length
          : 0)) || 0,
    sertifikat_template_id: templateId,
    sertifikat_template_name: templateName,
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      const months = [
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember",
      ];
      const days = [
        "Minggu",
        "Senin",
        "Selasa",
        "Rabu",
        "Kamis",
        "Jumat",
        "Sabtu"
      ];
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return "-";
      return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
      return "-";
    }
  };

  return (
    <ClientOnly>
      <div className="p-6">
        <div className="mb-6">
          <Link
            href="/admin/activity-management"
            className="inline-flex items-center text-gray-600 hover:text-primary"
          >
            <ArrowLeftIcon className="mr-2 h-5 w-5" />
            Kembali ke Daftar Aktivitas
          </Link>
        </div>

        <div className="rounded-lg bg-white p-8 shadow-lg dark:bg-[#122031]">
          <div className="mb-4 border-b border-gray-200 pb-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {formattedActivity.activity_name}
            </h1>
          </div>

          <div className="mb-8 grid gap-4 rounded-lg bg-gray-50 p-8 dark:bg-gray-800/50">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800/30">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Tanggal
                </h2>
                <p className="text-xl font-medium text-gray-900 dark:text-white">
                  {formatDate(formattedActivity.date)}
                </p>
              </div>

              <div className="flex gap-6">
                <div className="flex-1 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800/30">
                  <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Jam Mulai
                  </h2>
                  <p className="text-xl font-medium text-gray-900 dark:text-white">
                    {formattedActivity.time_start || "-"}
                  </p>
                </div>
                <div className="flex-1 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800/30">
                  <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Jam Selesai
                  </h2>
                  <p className="text-xl font-medium text-gray-900 dark:text-white">
                    {formattedActivity.time_end || "-"}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800/30">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Tipe Aktivitas
                </h2>
                <p className="inline-flex rounded-full bg-blue-100 px-4 py-2 text-lg font-medium text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                  {formattedActivity.activity_type_name}
                </p>
              </div>

              <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800/30">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Instruktur
                </h2>
                <p className="text-xl font-medium text-gray-900 dark:text-white">
                  {formattedActivity.instruktur_name || "-"}
                </p>
              </div>

              <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800/30">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Total Partisipan
                </h2>
                <div className="flex flex-col gap-1">
                  <p className="text-xl font-medium text-gray-900 dark:text-white">
                    {formattedActivity.totalParticipants} Orang
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    ({Array.isArray(activityData.peserta) ? activityData.peserta.length : 0} Peserta, {Array.isArray(activityData.panitia) ? activityData.panitia.length : 0} Panitia, {Array.isArray(activityData.narasumber) ? activityData.narasumber.length : 0} Narasumber)
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800/30">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Lokasi / Link Zoom
                </h2>
                {formattedActivity.location && (
                  formattedActivity.location.toLowerCase().includes('zoom.us') || 
                  formattedActivity.location.toLowerCase().startsWith('http') ? (
                    <a 
                      href={formattedActivity.location.startsWith('http') ? 
                        formattedActivity.location : 
                        `https://${formattedActivity.location}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xl font-medium text-primary hover:text-primary/80 hover:underline"
                    >
                      {formattedActivity.location}
                    </a>
                  ) : (
                    <p className="text-xl font-medium text-gray-900 dark:text-white">
                      {formattedActivity.location}
                    </p>
                  )
                )}
              </div>

              <div className="md:col-span-full">
                <TemplateSelector
                  activityId={id}
                  initialTemplateId={formattedActivity.sertifikat_template_id}
                  initialTemplateName={
                    formattedActivity.sertifikat_template_name
                  }
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800/30">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Deskripsi
            </h2>
            <div
              className="prose prose-sm max-w-none overflow-auto break-words text-gray-700 dark:prose-invert sm:prose lg:prose-lg dark:text-gray-300"
              style={{ maxHeight: "400px" }}
              dangerouslySetInnerHTML={{ __html: formattedActivity.description }}
            />
          </div>
        </div>

        <PesertaSection activityId={id} />
      </div>
    </ClientOnly>
  );
}
