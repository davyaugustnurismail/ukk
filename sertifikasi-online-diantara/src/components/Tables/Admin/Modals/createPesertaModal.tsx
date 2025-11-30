"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import axios from "@/lib/axios";
import { createUser } from "@/lib/fetch-user-peserta-management";
import { isValidEmail, getEmailErrorMessage } from "@/lib/email-validation";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type Props = {
  onClose: () => void;
  onUserCreated: () => void;
  onError?: (error: any) => void;
};

export default function CreatePesertaModal({
  onClose,
  onUserCreated,
  onError,
}: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [noHp, setNoHp] = useState("");
  const [asalInstitusi, setAsalInstitusi] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<number[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('peserta');
  const [activityQuery, setActivityQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [shownGeneratedToasts, setShownGeneratedToasts] = useState<Set<number>>(new Set());
  const [shownDuplicateToasts, setShownDuplicateToasts] = useState<Set<string>>(new Set());
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  const TOAST_TTL = 4000;
  const showGeneratedToastFor = (actId: number, message: string) => {
    setShownGeneratedToasts((prev) => {
      if (prev.has(actId)) return prev;
      const next = new Set(prev);
      next.add(actId);
      return next;
    });
    toast.error(message);
    setTimeout(() => {
      setShownGeneratedToasts((prev) => {
        if (!prev.has(actId)) return prev;
        const next = new Set(prev);
        next.delete(actId);
        return next;
      });
    }, TOAST_TTL);
  };

  const DUP_TOAST_TTL = 4000;
  const showDuplicateToast = (key: string, message: string) => {
    setShownDuplicateToasts((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    toast.error(message);
    setTimeout(() => {
      setShownDuplicateToasts((prev) => {
        if (!prev.has(key)) return prev;
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }, DUP_TOAST_TTL);
  };

  useEffect(() => {
    setShowAnimation(true);
  }, []);

  useEffect(() => {
    const fetchActivities = async () => {
      setActivitiesLoading(true);
      setShownGeneratedToasts(new Set());
      try {
        const res = await axios.get(`/data-activities`);
        const data = res.data;
        const list = Array.isArray(data) ? data : data?.data || [];
        const annotated = (list || []).map((a: any) => {
          let generated = false;
          if (a && (a.certificates_generated === true || a.has_generated_certificates === true || a.generated === true)) generated = true;
          const participants = a?.participants || a?.peserta || a?.users || a?.data?.participants || [];
          if (Array.isArray(participants) && participants.length > 0) {
            const allHave = participants.every((p: any) => Boolean(p.certificate_number) || Boolean(p.nomor_sertifikat) || Boolean(p.certificate_no) || Boolean(p.pivot?.certificate_number));
            if (allHave) generated = true;
          }
          return { ...a, generated };
        });
        setActivities(annotated);
      } catch (err) {
        setActivities([]);
      } finally {
        setActivitiesLoading(false);
      }
    };

    fetchActivities();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleClose = () => {
    if (loading) return;
    setShowAnimation(false);
    setTimeout(onClose, 300);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const numericValue = value.replace(/[^0-9]/g, "");
    setNoHp(numericValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidEmail(email)) {
      toast.error(getEmailErrorMessage(email));
      return;
    }
    
    if (password.length < 8) {
      toast.error("Password harus minimal 8 karakter!");
      return;
    }
    if (password !== passwordConfirmation) {
      toast.error("Konfirmasi password tidak cocok.");
      return;
    }

    setLoading(true);

    if (selectedActivities && selectedActivities.length > 0) {
      try {
        const checks = await Promise.allSettled(
          selectedActivities.map((actId) => axios.get(`/data-activities/${actId}`)),
        );

        for (let i = 0; i < checks.length; i++) {
          const res = checks[i];
          if (res.status !== "fulfilled") continue;
          const data = (res as any).value?.data?.data ?? (res as any).value?.data ?? null;
          const activityName = data?.activity_name || data?.name || `ID ${selectedActivities[i]}`;

          if (data && (data.certificates_generated === true || data.has_generated_certificates === true)) {
            const actId = selectedActivities[i];
            showGeneratedToastFor(actId, `Tidak dapat menambahkan ke kegiatan "${activityName}": nomor sertifikat sudah digenerate.`);
            setLoading(false);
            return;
          }

          const participants = data?.participants || data?.peserta || data?.users || data?.data?.participants || [];
          if (Array.isArray(participants) && participants.length > 0) {
            const allHave = participants.every((p: any) => Boolean(p.certificate_number) || Boolean(p.nomor_sertifikat) || Boolean(p.certificate_no) || Boolean(p.pivot?.certificate_number));
            if (allHave) {
              const actId = selectedActivities[i];
              showGeneratedToastFor(actId, `Tidak dapat menambahkan ke kegiatan "${activityName}": nomor sertifikat sudah digenerate.`);
              setLoading(false);
              return;
            }
          }
        }
      } catch (err) {
        console.warn("Failed to validate activities before create:", err);
      }
    }

    const payload: {
      name: string;
      email: string;
      no_hp: string;
      asal_institusi: string;
      password: string;
      password_confirmation: string;
      [key: string]: any;
    } = {
      name,
      email,
      no_hp: noHp,
      asal_institusi: asalInstitusi,
      password,
      password_confirmation: passwordConfirmation,
    };

    if (selectedActivities && selectedActivities.length > 0) {
      (payload as any).activities = selectedActivities;
    }

    if (selectedType) {
      (payload as any).type_members = [selectedType];
      (payload as any).type_member = selectedType;
    }

    try {
      await createUser(payload as any);
      onUserCreated();
      toast.success("Users berhasil dibuat!");
      handleClose();
    } catch (err: any) {
      const errors = err?.response?.data?.errors || {};
      let handled = false;
      if (errors?.no_hp && Array.isArray(errors.no_hp)) {
        const key = `no_hp:${(noHp || '').trim()}`;
        showDuplicateToast(key, errors.no_hp.join(' '));
        handled = true;
      }
      if (!handled && errors?.email && Array.isArray(errors.email)) {
        const isTaken = errors.email.some((msg: string) => msg.toLowerCase().includes('sudah terdaftar') || msg.toLowerCase().includes('already'));
        const key = `email:${(email || '').trim().toLowerCase()}`;
        showDuplicateToast(key, isTaken ? 'Email sudah digunakan oleh akun lain.' : errors.email.join(' '));
        handled = true;
      }
      if (!handled) {
        const msg = err?.response?.data?.message || err?.message || 'Gagal membuat peserta.';
        toast.error(msg);
      }
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 transition-opacity duration-300 ease-in-out ${
        showAnimation ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
    >
      <div
        className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-xl transition-all duration-300 ease-in-out dark:bg-gray-900 ${
          showAnimation ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-6 text-center text-xl font-bold text-gray-900 dark:text-white">
          Tambah Users Baru
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Nama <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Masukkan nama users"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                placeholder="Masukkan email users"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                No. Handphone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                placeholder="081234567890"
                required
                value={noHp}
                onChange={handlePhoneChange}
                className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Asal Institusi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Masukkan asal institusi"
                required
                value={asalInstitusi}
                onChange={(e) => setAsalInstitusi(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                placeholder="Buat password (Minimal 8 karakter)"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Konfirmasi Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                placeholder="Ulangi password"
                required
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          {/* Tipe Anggota */}
          <div className="mt-2">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Tipe Anggota
            </label>
            <div className="flex flex-wrap items-center gap-3">
              {['peserta', 'panitia', 'narasumber'].map((t) => (
                <label key={t} className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                  <input
                    type="radio"
                    name="tipe_anggota"
                    checked={selectedType === t}
                    onChange={() => setSelectedType(t)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="capitalize">{t.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Kegiatan Diikuti */}
          <div className="mt-2" ref={dropdownRef}>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Kegiatan Diikuti (opsional)
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen((v) => !v)}
                className="flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                {selectedActivities.length > 0
                  ? `${selectedActivities.length} kegiatan dipilih`
                  : "Pilih kegiatan..."}
                {dropdownOpen ? (
                  <ChevronUpIcon className="ml-2 h-4 w-4" />
                ) : (
                  <ChevronDownIcon className="ml-2 h-4 w-4" />
                )}
              </button>
              {dropdownOpen && (
                <div className="absolute left-0 z-40 mt-1 max-h-60 w-full overflow-auto rounded border bg-white shadow-lg dark:bg-gray-800">
                  <div className="p-2">
                    <input
                      type="text"
                      placeholder="Cari kegiatan..."
                      value={activityQuery}
                      onChange={(e) => setActivityQuery(e.target.value)}
                      className="mb-2 w-full rounded border border-gray-300 px-2 py-1 text-sm text-gray-800 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  {activitiesLoading ? (
                    <div className="p-2 text-sm text-gray-500">Memuat kegiatan...</div>
                  ) : activities.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">Tidak ada kegiatan tersedia.</div>
                  ) : (
                    activities
                      .filter((a) => {
                        if (!activityQuery) return true;
                        const q = activityQuery.toLowerCase();
                        return (
                          (a.activity_name || a.name || "").toLowerCase().includes(q) ||
                          String(a.id).includes(q)
                        );
                      })
                      .map((act) => {
                        let dateStr = "";
                        const raw = act.date || act.start_date;
                        if (raw) {
                          try {
                            const d = new Date(raw);
                            dateStr = d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
                          } catch {}
                        }
                        return (
                          <label
                            key={act.id}
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <input
                              type="checkbox"
                              checked={selectedActivities.includes(act.id)}
                              disabled={Boolean(act.generated)}
                              onChange={() => {
                                if (act.generated) {
                                  showGeneratedToastFor(
                                    act.id,
                                    `Kegiatan \"${act.activity_name || act.name || act.id}\" sudah digenerate. Tidak dapat menambahkan peserta.`,
                                  );
                                  return;
                                }
                                setSelectedActivities((prev) =>
                                  prev.includes(act.id) ? prev.filter((x) => x !== act.id) : [...prev, act.id],
                                );
                              }}
                              className="h-4 w-4"
                            />
                            <div className="truncate text-sm">
                              <div className={`font-medium ${act.generated ? 'text-gray-400' : 'text-gray-700'} dark:${act.generated ? 'text-gray-500' : 'text-gray-200'}`}>{act.activity_name || act.name}</div>
                              {dateStr && (
                                <div className={`text-xs ${act.generated ? 'text-gray-400' : 'text-gray-500'} dark:${act.generated ? 'text-gray-500' : 'text-gray-400'}`}>{dateStr}</div>
                              )}
                              {act.generated && (
                                <div className="mt-1 text-xs font-medium text-red-600">Sudah digenerate</div>
                              )}
                            </div>
                          </label>
                        );
                      })
                  )}
                </div>
              )}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Pilih kegiatan agar peserta otomatis terkait dengan aktivitas tersebut.
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-3 pt-2">
            <div className="mr-auto text-sm text-gray-600 dark:text-gray-400">
              Fields marked with <span className="text-red-500">*</span> wajib diisi
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-opacity-70"
            >
              {loading ? "Menyimpan..." : "Tambah Users"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}