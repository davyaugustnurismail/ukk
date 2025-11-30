"use client";

import { toast } from "react-toastify";
import { UserType, getUsers } from "@/lib/fetch-user-instruktur-management";
import axios from "@/lib/axios";
import { useEffect, useState } from "react";
import React from "react";
import DatePickerField from "@/components/DatePickerField";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DynamicTiptapEditor from "@/components/DynamicTiptapEditorWrapper";

interface ActivityType {
  id: number;
  type_name: string;
}

export default function EditActivity({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const actualParams = React.use(params);

  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [instrukturs, setInstrukturs] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // NOTE: simpan ID select sebagai STRING agar cocok dengan <option value="...">
  const [form, setForm] = useState({
    activity_name: "",
    date: "",
    time_start: "",
    time_end: "",
    activity_type_id: "" as string, // <-- string
    instruktur_id: "" as string,     // <-- string
    description: "",
    location: "", // for physical location or zoom link
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1) Fetch semua data paralel terlebih dahulu
        const [activityResponse, typesRes, instructorsRes] = await Promise.all([
          axios.get(`/data-activities/${actualParams.id}`),
          axios.get("/data-activity-types"),
          getUsers(),
        ]);

        // 2) Set activity types dan instructors terlebih dahulu
        if (Array.isArray(typesRes.data)) {
          setActivityTypes(typesRes.data);
        } else if (typesRes.data && Array.isArray(typesRes.data.data)) {
          setActivityTypes(typesRes.data.data);
        }

        setInstrukturs(instructorsRes);

        // 3) Kemudian set form data setelah options tersedia
        const activityData = activityResponse.data.data || activityResponse.data;

        setForm({
          activity_name: activityData.activity_name ?? "",
          date: activityData.date?.split("T")[0] || "",
          time_start: activityData.time_start || activityData.jam_mulai || "",
          time_end: activityData.time_end || activityData.jam_selesai || "",
          // PENTING: jadikan string supaya match dengan <option value="...">
          activity_type_id:
            activityData.activity_type_id !== undefined &&
            activityData.activity_type_id !== null
              ? String(activityData.activity_type_id)
              : "",
          instruktur_id:
            activityData.instruktur_id !== undefined &&
            activityData.instruktur_id !== null
              ? String(activityData.instruktur_id)
              : "",
          description: activityData.description ?? "",
          location: activityData.location ?? "",
        });

      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Gagal mengambil data aktivitas");
        await new Promise((resolve) => setTimeout(resolve, 1500));
        router.push("/admin/activity-management");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [actualParams.id, router]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value, // simpan apa adanya (string)
    }));
  };

  // DatePicker -> DD/MM/YYYY dengan auto-slash
  const handleDatePickerChange = (val: string) => {
    let raw = val.replace(/[^\d]/g, "");
    let formatted = raw;
    if (raw.length > 2 && raw.length <= 4) {
      formatted = raw.slice(0, 2) + "/" + raw.slice(2);
    } else if (raw.length > 4) {
      formatted = raw.slice(0, 2) + "/" + raw.slice(2, 4) + "/" + raw.slice(4, 8);
    }
    if (formatted.length > 10) formatted = formatted.slice(0, 10);
    setForm((prev) => ({ ...prev, date: formatted }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.instruktur_id) {
      toast.error("Pilih instruktur terlebih dahulu!");
      return;
    }
    if (!form.activity_type_id) {
      toast.error("Pilih tipe aktivitas terlebih dahulu!");
      return;
    }
    if (!form.activity_name || !form.date || !form.description || !form.location) {
      toast.error("Semua field wajib diisi!");
      return;
    }

    // Siapkan payload: konversi ID select (string) -> number
    let submitForm: any = {
      ...form,
      activity_type_id: Number(form.activity_type_id),
      instruktur_id: Number(form.instruktur_id),
    };

    const ddmmyyyyRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (ddmmyyyyRegex.test(form.date)) {
      const [day, month, year] = form.date.split("/");
      submitForm.date = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    const formatTime = (t: string) => {
      if (!t) return "";
      if (/^\d{2}:\d{2}$/.test(t)) return t;
      const match = t.match(/^(\d{2}:\d{2})/);
      return match ? match[1] : t;
    };
    submitForm.time_start = formatTime(form.time_start);
    submitForm.time_end = formatTime(form.time_end);

    setSaving(true);
    try {
      await axios.put(`/data-activities/${actualParams.id}`, submitForm);
      toast.success("Aktivitas berhasil diperbarui!", { autoClose: 2000 });
      await new Promise((r) => setTimeout(r, 1500));
      router.push("/admin/activity-management");
      router.refresh();
    } catch (error: any) {
      if (error.response?.data?.message) {
        toast.error("Gagal menyimpan: " + error.response.data.message);
      } else {
        toast.error("Gagal menyimpan aktivitas. Cek data yang diinput.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
          <div className="mt-4">Loading...</div>
        </div>
      </div>
    );
  }

  return (
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

      <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-[#122031]">
        <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
          Edit Aktivitas
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nama Aktivitas <span className="text-red-500">*</span>
              </label>
              <input
                placeholder="Masukkan nama aktivitas"
                type="text"
                name="activity_name"
                value={form.activity_name}
                onChange={handleChange}
                className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-[#122031] dark:text-white"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tanggal <span className="text-red-500">*</span>
              </label>
              <DatePickerField
                value={form.date}
                onChange={handleDatePickerChange}
                className="max-w-md"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Jam Mulai <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                name="time_start"
                value={form.time_start}
                onChange={handleChange}
                className="w-full max-w-md cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-[#122031] dark:text-white"
                required
                onFocus={(e) => (e.target as HTMLInputElement).showPicker?.()}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Jam Selesai <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                name="time_end"
                value={form.time_end}
                onChange={handleChange}
                className="w-full max-w-md cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-[#122031] dark:text-white"
                required
                onFocus={(e) => (e.target as HTMLInputElement).showPicker?.()}
              />
            </div>

            {/* Tipe Aktivitas */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tipe Aktivitas <span className="text-red-500">*</span>
              </label>
              <select
                name="activity_type_id"
                value={form.activity_type_id}
                onChange={handleChange}
                className="w-full max-w-md cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-[#122031] dark:text-white"
                required
              >
                <option value="">Pilih Tipe Aktivitas</option>
                {activityTypes.map((type) => (
                  <option key={type.id} value={String(type.id)}>
                    {type.type_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Instruktur */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Instruktur <span className="text-red-500">*</span>
              </label>
              <select
                name="instruktur_id"
                value={form.instruktur_id}
                onChange={handleChange}
                className="w-full max-w-md cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-[#122031] dark:text-white"
                required
              >
                <option value="">Pilih Instruktur</option>
                {instrukturs.map((ins) => (
                  <option key={ins.id} value={String(ins.id)}>
                    {ins.name || "Nama tidak tersedia"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Lokasi / Link Zoom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="Masukkan lokasi fisik atau link Zoom"
                className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-[#122031] dark:text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Deskripsi
            </label>
            <DynamicTiptapEditor
              content={form.description}
              onChange={(newContent: string) =>
                setForm((prev) => ({ ...prev, description: newContent }))
              }
            />
          </div>

          <div className="flex justify-end space-x-4">
            <Link
              href="/admin/activity-management"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}