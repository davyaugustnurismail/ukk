"use client";

import { useState, useEffect, useRef } from "react";
import { updateUser } from "@/lib/fetch-user-peserta-management";
import axios from "@/lib/axios";
import { isValidEmail, getEmailErrorMessage } from "@/lib/email-validation";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type Props = {
  onClose: () => void;
  user: any;
  onUserUpdated: () => void;
};

export default function EditPesertaModal({ onClose, user, onUserUpdated }: Props) {
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");
  const [noHp, setNoHp] = useState(user.no_hp?.startsWith("62") ? user.no_hp.slice(2) : user.no_hp || "");
  const [asalInstitusi, setAsalInstitusi] = useState(user.asal_institusi || "");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<number[]>(
    // preselect activities if provided on user object
    (user?.activities || user?.data?.activities || []).map((a: any) => a?.id).filter(Boolean) || [],
  );
  // capture initial activity IDs so we can allow keeping existing associations even if the activity is generated
  const initialActivityIds = new Set<number>((user?.activities || user?.data?.activities || []).map((a: any) => a?.id).filter(Boolean));
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activityQuery, setActivityQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Tipe Anggota state - get from user.role_name or map from role_id
  const getRoleFromUser = (user: any): string => {
    if (user?.role_name) {
      const normalized = user.role_name.toLowerCase();
      if (['peserta', 'panitia', 'narasumber'].includes(normalized)) return normalized;
    }
    const roleMap: Record<number, string> = { 3: 'peserta', 4: 'panitia', 5: 'narasumber' };
    return roleMap[user?.role_id] || 'peserta';
  };
  const [selectedType, setSelectedType] = useState<string>(getRoleFromUser(user));
  const [initialType] = useState<string>(getRoleFromUser(user));
  const [hasGeneratedActivities, setHasGeneratedActivities] = useState<boolean>(false);
  const [generatedActivityNames, setGeneratedActivityNames] = useState<string[]>([]);
  
  // track which activity IDs we've shown the "already generated" toast for
  const [shownGeneratedToasts, setShownGeneratedToasts] = useState<Set<number>>(new Set());

  // per-activity toast with TTL similar to create modal
  const TOAST_TTL = 4000; // ms
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

  // transient toast dedupe: allow same message to reappear after a short TTL
  const [shownToasts, setShownToasts] = useState<Set<string>>(new Set());
  const showTransientToast = (msg: string) => {
    setShownToasts((prev) => {
      if (prev.has(msg)) return prev;
      const next = new Set(prev);
      next.add(msg);
      return next;
    });
    toast.error(msg);
    setTimeout(() => {
      setShownToasts((prev) => {
        if (!prev.has(msg)) return prev;
        const next = new Set(prev);
        next.delete(msg);
        return next;
      });
    }, TOAST_TTL);
  };

  useEffect(() => {
    setShowAnimation(true);
  }, []);

  useEffect(() => {
    // fetch activities for selection
    const fetchActivities = async () => {
      setActivitiesLoading(true);
      setShownGeneratedToasts(new Set());
      let annotated: any[] = [];
      try {
        const res = await axios.get(`/data-activities`);
        const data = res.data;
        const list = Array.isArray(data) ? data : data?.data || [];
        annotated = (list || []).map((a: any) => {
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
        
        // Check if user has any generated activities
        const userActivities = user?.activities || user?.data?.activities || [];
        const userActivityIds = new Set(userActivities.map((a: any) => a?.id).filter(Boolean));
        const generatedUserActivities = annotated.filter((a: any) => 
          a.generated && userActivityIds.has(a.id)
        );

        if (generatedUserActivities.length > 0) {
          setHasGeneratedActivities(true);
          setGeneratedActivityNames(
            generatedUserActivities.map((a: any) => a.activity_name || a.name || `ID ${a.id}`)
          );
        }
      } catch (err) {
        setActivities([]);
      } finally {
        setActivitiesLoading(false);
      }
    };
    fetchActivities();
  }, [user?.activities, user?.data?.activities]);

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
      showTransientToast(getEmailErrorMessage(email));
      return;
    }
    
    // Validate type change if user has generated activities
    if (hasGeneratedActivities && selectedType !== initialType) {
      const activityList = generatedActivityNames.length > 0 
        ? generatedActivityNames.slice(0, 3).join(', ') + (generatedActivityNames.length > 3 ? `, dan ${generatedActivityNames.length - 3} lainnya` : '')
        : 'beberapa kegiatan';
      showTransientToast(
        `Tidak dapat mengubah tipe anggota. User sudah terdaftar sebagai "${initialType}" di ${activityList} yang telah digenerate sertifikatnya.`
      );
      return;
    }
    if (password && password.length < 8) {
      showTransientToast("Password harus minimal 8 karakter!");
      return;
    }
    if (password && password !== passwordConfirmation) {
      showTransientToast("Konfirmasi password tidak cocok.");
      return;
    }
    setLoading(true);
    // validate selected activities are not generated
    if (selectedActivities && selectedActivities.length > 0) {
      try {
        const checks = await Promise.allSettled(selectedActivities.map((id) => axios.get(`/data-activities/${id}`)));
        for (let i = 0; i < checks.length; i++) {
          const res = checks[i];
          if (res.status !== 'fulfilled') continue;
          const data = (res as any).value?.data?.data ?? (res as any).value?.data ?? null;
          const activityName = data?.activity_name || data?.name || `ID ${selectedActivities[i]}`;
          // If activity is already generated, allow it only if the user WAS already linked to it.
          const actId = selectedActivities[i];
          if (data && (data.certificates_generated === true || data.has_generated_certificates === true)) {
            if (!initialActivityIds.has(actId)) {
              showGeneratedToastFor(actId, `Tidak dapat menambahkan ke kegiatan "${activityName}": nomor sertifikat sudah digenerate.`);
              setLoading(false);
              return;
            }
            // else: user already linked to this generated activity -> allow keeping it
          }
          const participants = data?.participants || data?.peserta || data?.users || data?.data?.participants || [];
          if (Array.isArray(participants) && participants.length > 0) {
            const allHave = participants.every((p: any) => Boolean(p.certificate_number) || Boolean(p.nomor_sertifikat) || Boolean(p.certificate_no) || Boolean(p.pivot?.certificate_number));
            if (allHave) {
              if (!initialActivityIds.has(actId)) {
                showGeneratedToastFor(actId, `Tidak dapat menambahkan ke kegiatan "${activityName}": nomor sertifikat sudah digenerate.`);
                setLoading(false);
                return;
              }
              // else allow because user was already linked
            }
          }
        }
      } catch (err) {
        console.warn('Failed to validate activities before update', err);
      }
    }

    // Prevent removing existing associations to activities that have already been generated.
    // If the user was already linked to a generated activity (initialActivityIds) we disallow removing it here.
    const removedGenerated = Array.from(initialActivityIds).filter((id) => {
      const act = activities.find((a: any) => a?.id === id);
      return act?.generated && !selectedActivities.includes(id);
    });
    if (removedGenerated.length > 0) {
      const first = removedGenerated[0];
      const act = activities.find((a: any) => a?.id === first);
      showGeneratedToastFor(first, `Tidak dapat menghapus keterkaitan dari kegiatan "${act?.activity_name || act?.name || first}": nomor sertifikat sudah digenerate.`);
      setLoading(false);
      return;
    }
    try {
      // send phone exactly as entered in the field (do not auto-prefix with 62)
      const fullPhoneNumber = noHp || "";
      const merchantId = Number(localStorage.getItem("merchant_id") || "0");

      const payload: any = {
        name,
        email,
        no_hp: fullPhoneNumber,
        asal_institusi: asalInstitusi,
        merchant_id: merchantId,
      };

      // include selected activities if any
      if (selectedActivities && selectedActivities.length > 0) {
        payload.activities = selectedActivities;
      }

      // include selected member type
      if (selectedType) {
        payload.type_members = [selectedType];
        payload.type_member = selectedType;
      }

      // include password if provided
      if (password) {
        payload.password = password;
        payload.password_confirmation = passwordConfirmation;
      }

      await updateUser(user.id, payload);
      onUserUpdated();
      handleClose();
    } catch (err: any) {
      const data = err?.response?.data || err?.data || null;
      // If backend returned a structured error with message and generated_detach_ids, surface them
      if (data) {
        const hasGeneratedIds = Array.isArray(data.generated_detach_ids) && data.generated_detach_ids.length > 0;
        // If backend returned specific generated IDs, prefer showing per-activity toasts only
        if (hasGeneratedIds) {
          data.generated_detach_ids.forEach((id: number) => {
            const act = activities.find((a: any) => a?.id === id);
            showGeneratedToastFor(id, `Tidak dapat menghapus kegiatan "${act?.activity_name || act?.name || id}": nomor sertifikat sudah digenerate.`);
          });
        } else if (data.message) {
          // No per-activity IDs, show the generic message
          showTransientToast(data.message);
        } else {
          showTransientToast("Gagal mengupdate Users.");
        }
      } else {
        showTransientToast("Gagal mengupdate Users.");
      }
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
          Edit Users
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
                Password (Opsional)
              </label>
              <input
                type="password"
                placeholder="Kosongkan jika tidak ingin mengubah"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Konfirmasi Password
              </label>
              <input
                type="password"
                placeholder="Ulangi password baru"
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
            {hasGeneratedActivities && (
              <div className="mb-2 rounded-md bg-yellow-50 border border-yellow-200 p-2 text-xs text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200">
                <strong>Perhatian:</strong> Tipe anggota tidak dapat diubah karena user sudah terdaftar di kegiatan yang telah digenerate sertifikatnya.
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3">
              {['peserta', 'panitia', 'narasumber'].map((t) => (
                <label 
                  key={t} 
                  className={`inline-flex items-center gap-2 text-sm ${hasGeneratedActivities ? 'opacity-50 cursor-not-allowed' : ''} text-gray-700 dark:text-gray-200`}
                >
                  <input
                    type="radio"
                    name="tipe_anggota"
                    checked={selectedType === t}
                    disabled={hasGeneratedActivities}
                    onChange={() => {
                      if (!hasGeneratedActivities) {
                        setSelectedType(t);
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
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
              {loading ? "Menyimpan..." : "Update Users"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}