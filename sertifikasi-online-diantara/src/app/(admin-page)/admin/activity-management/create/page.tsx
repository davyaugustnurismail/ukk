"use client";

import { toast } from "react-toastify";

interface ActivityType {
  id: number;
  type_name: string;
}
import { UserType, getUsers } from "@/lib/fetch-user-instruktur-management";
import axios from "@/lib/axios";
import { useEffect, useState } from "react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import DatePickerField from "@/components/DatePickerField";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DynamicTiptapEditor from "@/components/DynamicTiptapEditorWrapper";

const formatDateForInput = (dateStr: string) => {
  if (!dateStr) return "";
  // Handle DD/MM/YYYY format
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return dateStr;
};

const formatDateForDisplay = (dateStr: string) => {
  if (!dateStr) return "";
  // Handle YYYY-MM-DD format
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function CreateActivity() {
  const router = useRouter();
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [instrukturs, setInstrukturs] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    activity_name: "",
    date: "",
    time_start: "",
    time_end: "",
    activity_type_id: undefined as number | undefined,
    instruktur_id: undefined as number | undefined,
    description: "",
    merchant_id: undefined as number | undefined,
    location: "", // can be physical location or zoom link
  });

  useEffect(() => {
    fetchActivityTypes();
    fetchInstrukturs();
  }, []);

  const fetchInstrukturs = async () => {
    try {
      const res = await getUsers();
      setInstrukturs(res);
    } catch {
      setInstrukturs([]);
    }
  };

  const fetchActivityTypes = async () => {
    try {
      const res = await axios.get("/data-activity-types");
      if (Array.isArray(res.data)) {
        setActivityTypes(res.data);
      } else if (res.data && Array.isArray(res.data.data)) {
        setActivityTypes(res.data.data);
      } else {
        setActivityTypes([]);
      }
    } catch (error) {
      setActivityTypes([]);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;

    // Jika yang berubah adalah time_start, reset time_end jika jam selesai sudah tidak valid
    if (name === "time_start" && value && form.time_end) {
      if (value >= form.time_end) {
        setForm({
          ...form,
          time_start: value,
          time_end: "", // Reset jam selesai
        });
        toast.warning(
          "Jam selesai direset karena harus lebih besar dari jam mulai",
        );
        return;
      }
    }

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

    if (
      !form.activity_name ||
      !form.date ||
      !form.time_start ||
      !form.time_end ||
      !form.description ||
      !form.location
    ) {
      toast.error("Semua field wajib diisi!");
      return;
    }

    // Validasi final sebelum submit
    if (form.time_end <= form.time_start) {
      toast.error("Jam selesai harus lebih besar dari jam mulai!");
      return;
    }

    let submitForm = { ...form };
    const ddmmyyyyRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (ddmmyyyyRegex.test(form.date)) {
      const [day, month, year] = form.date.split("/");
      submitForm.date = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    
    // Get merchant_id from localStorage (same as createPesertaModal) or default to 1
    const merchant_id = Number(localStorage.getItem("merchant_id") || "0") || 1;

    // Update submit form with merchant_id
    submitForm = {
      ...submitForm,
      merchant_id: merchant_id,
    };

    // pastikan field time ikut dikirim
    setLoading(true);
    try {
      const response = await axios.post("/data-activities", submitForm);
      if (response.status === 201 || response.status === 200) {
        toast.success("Aktivitas berhasil ditambahkan!");
        await new Promise((resolve) => setTimeout(resolve, 1500));
        router.push("/admin/activity-management");
        router.refresh();
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        toast.error("Gagal menyimpan: " + error.response.data.message);
      } else {
        toast.error("Gagal menyimpan aktivitas. Cek data yang diinput.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getMinTimeForEnd = () => {
    if (!form.time_start) return "";
    return form.time_start;
  };

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
          Tambah Aktivitas Baru
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
                min={getMinTimeForEnd()}
                className="w-full max-w-md cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-[#122031] dark:text-white"
                required
                disabled={!form.time_start}
                onFocus={(e) => e.target.showPicker && e.target.showPicker()}
              />
              {!form.time_start && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Pilih jam mulai terlebih dahulu
                </p>
              )}
            </div>

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
                className="w-full max-w-md cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-[#122031] dark:text-white"
                required
              >
                <option value="">Pilih Instruktur</option>
                {[...instrukturs].sort((a, b) => 
                  (a.name || "").localeCompare(b.name || "", "id")
                ).map((ins) => (
                  <option key={ins.id} value={ins.id}>
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
              disabled={loading}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
