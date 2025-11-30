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

interface Activity {
  id: number;
  activity_name: string;
  date: string;
  activity_type_id: number;
  activity_type_name?: string;
  description: string;
  instruktur_id?: number;
  instruktur_name?: string;
}

export default function EditActivity({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  // Next.js App Router: unwrap params with React.use()
  const actualParams = React.use(params);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [instrukturs, setInstrukturs] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    activity_name: "",
    date: "",
    time_start: "",
    time_end: "",
    activity_type_id: undefined as number | undefined,
    instruktur_id: undefined as number | undefined,
    description: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch activity data
        const response = await axios.get(`/data-activities/${actualParams.id}`);
        const activityData = response.data.data || response.data;
        setForm({
          activity_name: activityData.activity_name,
          date: activityData.date?.split("T")[0] || "",
          time_start: activityData.time_start || activityData.jam_mulai || "",
          time_end: activityData.time_end || activityData.jam_selesai || "",
          activity_type_id: activityData.activity_type_id,
          instruktur_id: activityData.instruktur_id,
          description: activityData.description,
        });

        // Fetch activity types
        const typesRes = await axios.get("/data-activity-types");
        if (Array.isArray(typesRes.data)) {
          setActivityTypes(typesRes.data);
        } else if (typesRes.data && Array.isArray(typesRes.data.data)) {
          setActivityTypes(typesRes.data.data);
        }

        // Fetch instructors
        const instructorsRes = await getUsers();
        setInstrukturs(instructorsRes);
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
    >,
  ) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]:
        name === "instruktur_id" || name === "activity_type_id"
          ? Number(value)
          : value,
    });
  };

  // Untuk DatePickerField agar konsisten DD/MM/YYYY dan '/' otomatis
  const handleDatePickerChange = (val: string) => {
    // Hanya izinkan angka dan '/'
    let raw = val.replace(/[^\d]/g, "");
    let formatted = raw;
    if (raw.length > 2 && raw.length <= 4) {
      formatted = raw.slice(0, 2) + "/" + raw.slice(2);
    } else if (raw.length > 4) {
      formatted =
        raw.slice(0, 2) + "/" + raw.slice(2, 4) + "/" + raw.slice(4, 8);
    }
    // Batasi maksimal 10 karakter (DD/MM/YYYY)
    if (formatted.length > 10) {
      formatted = formatted.slice(0, 10);
    }
    setForm({ ...form, date: formatted });
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
    if (!form.activity_name || !form.date || !form.description) {
      toast.error("Semua field wajib diisi!");
      return;
    }

    let submitForm = { ...form };
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
      toast.success("Aktivitas berhasil diperbarui!", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      // Delay sebelum redirect
      await new Promise((resolve) => setTimeout(resolve, 1500));
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
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]"></div>
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
                onFocus={(e) => e.target.showPicker && e.target.showPicker()}
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
                onFocus={(e) => e.target.showPicker && e.target.showPicker()}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tipe Aktivitas <span className="text-red-500">*</span>
              </label>
              <select
                name="activity_type_id"
                value={form.activity_type_id}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-[#122031] dark:text-white"
                required
              >
                <option value="">Pilih Tipe Aktivitas</option>
                {activityTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.type_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Instruktur <span className="text-red-500">*</span>
              </label>
              <select
                name="instruktur_id"
                value={form.instruktur_id}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-[#122031] dark:text-white"
                required
              >
                <option value="">Pilih Instruktur</option>
                {instrukturs.map((ins) => (
                  <option key={ins.id} value={ins.id}>
                    {ins.name || "Nama tidak tersedia"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Deskripsi
            </label>
            <DynamicTiptapEditor
              content={form.description}
              onChange={(newContent: string) => {
                setForm((prev) => ({ ...prev, description: newContent }));
              }}
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
