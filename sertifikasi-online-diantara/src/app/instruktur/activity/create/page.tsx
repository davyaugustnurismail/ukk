"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getActivityTypes, ActivityType } from "@/lib/fetch-activity-types";
import { createActivity } from "@/lib/fetch-activity-management";
import DatePickerField from "@/components/DatePickerField";
import DynamicTiptapEditor from "@/components/DynamicTiptapEditorWrapper";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function CreateInstrukturActivity() {
  const router = useRouter();
  const [form, setForm] = useState({
    activity_name: "",
    date: "",
    time_start: "",
    time_end: "",
    activity_type_id: "",
    description: "",
  });
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getActivityTypes().then(setActivityTypes);
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleDatePickerChange = (val: string) => {
    let raw = val.replace(/[^\d]/g, "");
    let formatted = raw;
    if (raw.length > 2 && raw.length <= 4) {
      formatted = raw.slice(0, 2) + "/" + raw.slice(2);
    } else if (raw.length > 4) {
      formatted =
        raw.slice(0, 2) + "/" + raw.slice(2, 4) + "/" + raw.slice(4, 8);
    }
    if (formatted.length > 10) {
      formatted = formatted.slice(0, 10);
    }
    setForm({ ...form, date: formatted });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !form.activity_name ||
      !form.date ||
      !form.activity_type_id ||
      !form.description
    ) {
      setError("Semua field wajib diisi!");
      return;
    }
    let submitForm: any = { ...form };
    const ddmmyyyyRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (ddmmyyyyRegex.test(form.date)) {
      const [day, month, year] = form.date.split("/");
      submitForm.date = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
    // Pastikan activity_type_id number
    if (typeof submitForm.activity_type_id === "string") {
      submitForm.activity_type_id = Number(submitForm.activity_type_id);
    }
    setSaving(true);
    setError(null);
    try {
      // Get user data first
      const userData = localStorage.getItem("user");
      if (!userData) {
        console.error("No user data found in localStorage");
        router.push("/auth/instruktur/signin");
        return;
      }

      const user = JSON.parse(userData);
      if (!user.id || !user.name) {
        console.error("Invalid user data:", user);
        localStorage.removeItem("user"); // Clear invalid data
        localStorage.removeItem("token");
        router.push("/auth/instruktur/signin");
        return;
      }

      // Format tanggal dari DD/MM/YYYY ke YYYY-MM-DD
      if (!form.date.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        setError("Format tanggal harus DD/MM/YYYY");
        return;
      }

      const [day, month, year] = form.date.split("/");
      const formattedDate = `${year}-${month}-${day}`;

      // Validasi data
      if (!form.activity_name.trim()) {
        setError("Nama aktivitas tidak boleh kosong");
        return;
      }
      if (!form.activity_type_id) {
        setError("Tipe aktivitas harus dipilih");
        return;
      }
      if (!form.description.trim()) {
        setError("Deskripsi tidak boleh kosong");
        return;
      }

      const activityData = {
        activity_name: form.activity_name.trim(),
        date: formattedDate,
        time_start: form.time_start || null,
        time_end: form.time_end || null,
        activity_type_id: Number(form.activity_type_id),
        description: form.description.trim(),
        instruktur_id: Number(user.id),
        instruktur_name: user.name,
        merchant_id: user.merchant_id || 1,
      };

      console.log("Form data:", form);
      console.log("Formatted data:", activityData);

      await createActivity(activityData);
      router.push("/instruktur/dashboard");
    } catch (err: any) {
      console.error("Error creating activity:", err);
      setError(
        err.response?.data?.message ||
          "Gagal menambah aktivitas. Cek data dan coba lagi.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/instruktur/dashboard"
          className="inline-flex items-center text-gray-600 hover:text-primary"
        >
          <ArrowLeftIcon className="mr-2 h-5 w-5" />
          Kembali ke Daftar Aktivitas
        </Link>
      </div>
      <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-[#122031]">
        <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
          Tambah Aktivitas Instruktur
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
                onFocus={(e) => e.target.showPicker && e.target.showPicker()}
                className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-[#122031] dark:text-white"
                required
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
                onFocus={(e) => e.target.showPicker && e.target.showPicker()}
                className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-[#122031] dark:text-white"
                required
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
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end space-x-4">
            <Link
              href="/instruktur/activity/dashboard"
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
