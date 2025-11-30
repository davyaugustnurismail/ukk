// src/components/peserta/PesertaSection.tsx
"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import axios from "@/lib/axios";
import { formatToYYYYMMDD } from "@/lib/format-date";
import { isValidEmail, getEmailErrorMessage } from "@/lib/email-validation";
import { Peserta, StatusFilter, Notification } from "./type";
import { sortPesertaByCertificate } from "./utils/certificateUtils";
import { normalizeEmailKey } from "./utils/emailUtils";

import PesertaHeader from "./Controls/PesertaHeader";
import PesertaFilters from "./Controls/PesertaFilters";
import PesertaTable from "./PesertaTable";
import PanitiaTab from "./Tabs/PanitiaTab";
import NarasumberTab from "./Tabs/NarasumberTab";
import AddModal from "./Modals/AddModal";
import EditModal from "./Modals/EditModal";
import ImportModal from "./Modals/ImportModal";
import DeleteConfirmationModal from "./Modals/DeleteConfirmationModal";
import BulkActionModals from "./Modals/BulkActionModals";
import GenerateFormatModal from "./Modals/GenerateFormatModal";
import ImportConflictsModal from "./Modals/ImportConflictsModal";
import AddImportChooserModal from "./Modals/AddImportChooserModal";

export default function PesertaSection({ activityId }: { activityId: string }) {
  // === SEMUA STATE & LOGIKA DARI FILE ASLI DI SINI ===
  // (Tidak saya salin ulang karena sudah ada di file asli)
  // Pastikan Anda pindahkan SEMUA useState, useEffect, handler, dll dari file asli ke sini



  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // --- STATE MANAGEMENT ---
  const [peserta, setPeserta] = useState<any[]>([]);
  const pesertaRef = useRef<any[]>(peserta);
  const [instruktur, setInstruktur] = useState<string | null>(null);
  const [certificateNumberFormat, setCertificateNumberFormat] = useState<string>("");
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [certificatesGenerated, setCertificatesGenerated] = useState(false);
  const [merchantId, setMerchantId] = useState<number | null>(null);

  // Selection state for checkboxes (holds row identifiers)
  const [selectedIds, setSelectedIds] = useState<Array<string | number>>([]);
  // per-row sending state to allow repeated sends and avoid global blocking
  const [sendingIds, setSendingIds] = useState<Array<string | number>>([]);
  // Filter for email status: all | pending | terkirim
  const [statusFilter, setStatusFilter] = useState<'all'|'pending'|'terkirim'>('all');
  // Search input for peserta
  const [pesertaSearch, setPesertaSearch] = useState<string>('');
  // Pagination state
  const [itemsPerPage, setItemsPerPage] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  const getRowId = (p: any) => (p.id ?? p.email ?? JSON.stringify(p));
  const isSelected = (id: string | number) => selectedIds.includes(id);
  const toggleSelect = (id: string | number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  // Modified to work with filtered data instead of just visible data
  const toggleSelectAll = () => {
    if (filteredPeserta.length === 0) return;
    const allIds = filteredPeserta.map(getRowId);
    const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.includes(id));
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(allIds);
  };

  const startSending = (id: string | number) => setSendingIds((s) => Array.from(new Set([...s, id])));
  const stopSending = (id: string | number) => setSendingIds((s) => s.filter((x) => x !== id));

  // State untuk generate bulk sertifikat
  const [isGenerating, setIsGenerating] = useState(false);
  const [taskToken, setTaskToken] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [generatePercent, setGeneratePercent] = useState<number | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const progressPollerRef = useRef<number | null>(null);
  const taskPollRef = useRef<number | null>(null);
  // elapsed timer for long-running generate process
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const elapsedTimerRef = useRef<number | null>(null);

  // States for Modals
  const [addModal, setAddModal] = useState(false);
  const [showAddModalAnimation, setShowAddModalAnimation] = useState(false);
  const [addImportChooserModal, setAddImportChooserModal] = useState(false);
  const [showAddImportChooserAnimation, setShowAddImportChooserAnimation] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [showEditModalAnimation, setShowEditModalAnimation] = useState(false);
  const [importModal, setImportModal] = useState(false);
  const [showImportModalAnimation, setShowImportModalAnimation] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<any | null>(null);

  // --- MODAL STATE FOR GENERATE ---
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateFormatInput, setGenerateFormatInput] = useState("");

  const handleGenerateModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generateFormatInput.includes("XXX")) {
      alert("Format nomor sertifikat harus mengandung 'XXX'.");
      return;
    }
    setShowGenerateModal(false);
    await handleUpdateAndGenerate(generateFormatInput);
  };

  // States for Form Data and Actions
  const [editPeserta, setEditPeserta] = useState<any | null>(null);
  const [newPeserta, setNewPeserta] = useState({
    name: "",
    email: "",
    no_hp: "",
    asal_institusi: "",
  });

  // States for Action Status
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImporting, setImporting] = useState(false);
  const [importConflicts, setImportConflicts] = useState<any[] | null>(null);

  // UI action states
  const [isRefreshing, setIsRefreshing] = useState(false);
  // UI tab: peserta | panitia | narasumber
  const [activeTab, setActiveTab] = useState<'peserta' | 'panitia' | 'narasumber'>('peserta');

  // --- Role-specific lists (panitia / narasumber) ---
  const [panitia, setPanitia] = useState<any[]>([]);
  const [panitiaLoading, setPanitiaLoading] = useState<boolean>(true);
  const [panitiaSearch, setPanitiaSearch] = useState<string>('');
  const [panitiaItemsPerPage, setPanitiaItemsPerPage] = useState<number>(25);
  const [panitiaCurrentPage, setPanitiaCurrentPage] = useState<number>(1);
  // selection & sending state for panitia
  const [panitiaSelectedIds, setPanitiaSelectedIds] = useState<Array<string | number>>([]);
  const [panitiaSendingIds, setPanitiaSendingIds] = useState<Array<string | number>>([]);

  const [narasumber, setNarasumber] = useState<any[]>([]);
  const [narasumberLoading, setNarasumberLoading] = useState<boolean>(true);
  const [narasumberSearch, setNarasumberSearch] = useState<string>('');
  const [narasumberItemsPerPage, setNarasumberItemsPerPage] = useState<number>(25);
  const [narasumberCurrentPage, setNarasumberCurrentPage] = useState<number>(1);
  // selection & sending state for narasumber
  const [narasumberSelectedIds, setNarasumberSelectedIds] = useState<Array<string | number>>([]);
  const [narasumberSendingIds, setNarasumberSendingIds] = useState<Array<string | number>>([]);

  // Ref for File Input
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Import modal tab: 'excel' | 'users'
  const [importTab, setImportTab] = useState<'excel'|'users'>('excel');
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  // cache of the full fetched users (after excluding already-attached peserta)
  const [allAvailableUsers, setAllAvailableUsers] = useState<any[]>([]);
  const allAvailableUsersRef = useRef<any[]>(allAvailableUsers);
  const updateAllAvailableUsers = (v: any[]) => {
    setAllAvailableUsers(v);
    allAvailableUsersRef.current = v;
  };
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersPage, setUsersPage] = useState(1);
  // set default pagination to 25 as requested
  const [usersPerPage, setUsersPerPage] = useState(25);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserIdsToImport, setSelectedUserIdsToImport] = useState<number[]>([]);
  const [isImportingUsers, setIsImportingUsers] = useState(false);
  const [selectAllUsers, setSelectAllUsers] = useState(false);

  // ...existing code...

  // --- DATA FETCHING ---
  const localCertKey = `cert_numbers_activity_${activityId}`;

  const readLocalCertMap = useCallback(() => {
    try {
      const raw = localStorage.getItem(localCertKey);
      if (!raw) return {} as Record<string, string>;
      return JSON.parse(raw) as Record<string, string>;
    } catch (e) {
      return {} as Record<string, string>;
    }
  }, [localCertKey]);

  const saveLocalCertMap = useCallback((map: Record<string, string>) => {
    try {
      localStorage.setItem(localCertKey, JSON.stringify(map));
    } catch (e) {
      // ignore localStorage errors
    }
  }, [localCertKey]);

  // ✅ persistMapEntries tidak lagi depend ke fungsi yang berubah-ubah
  const persistMapEntries = useCallback((
    map: Record<string, string>,
    entries: Array<{ id?: any; email?: string; certificate_number?: string }>
  ) => {
    let changed = false;
    entries.forEach((it) => {
      const cert = it.certificate_number;
      if (!cert) return;
      if (it.id) {
        const key = `id:${String(it.id)}`;
        if (map[key] !== cert) {
          map[key] = cert;
          changed = true;
        }
      }
      if (it.email) {
        const ekey = `e:${normalizeEmailKey(it.email)}`; // gunakan util global yang stabil
        if (map[ekey] !== cert) {
          map[ekey] = cert;
          changed = true;
        }
      }
    });
    return changed;
  }, []); // <— kosong, aman

  const fetchPeserta = useCallback(async () => {
    setLoading(true);
    // Invalidate cached available-users so any subsequent open of the Import -> Users
    // tab will re-fetch the authoritative users list and exclude newly-attached peserta.
    setAllAvailableUsers([]);
    try {
      const res = await axios.get(`/data-activities/${activityId}`);
      const pesertaData = res.data.data.peserta || [];
      const panitiaData = res.data.data.panitia || [];
      const narasumberData = res.data.data.narasumber || [];

      // Try to find certificate download/send records either at activity level or per participant
      const activityDownloads: any[] = Array.isArray(res.data.data?.certificate_downloads)
        ? res.data.data.certificate_downloads
        : [];

      // Build a lookup from activity-level downloads by user id or email (prefer latest sent_at)
      const downloadsLookupFrom = (arr: any[] = []) => {
        const lookup: Record<string, any> = {};
        const push = (d: any) => {
          if (!d) return;
          if (d.user_id) {
            const key = `id:${String(d.user_id)}`;
            const existing = lookup[key];
            if (!existing || (d.sent_at && (!existing.sent_at || new Date(d.sent_at) > new Date(existing.sent_at)))) lookup[key] = d;
          }
          if (d.email) {
            const key = `e:${normalizeEmailKey(d.email)}`;
            const existing = lookup[key];
            if (!existing || (d.sent_at && (!existing.sent_at || new Date(d.sent_at) > new Date(existing.sent_at)))) lookup[key] = d;
          }
          if (d.recipient_name) {
            const key = `n:${String(d.recipient_name)}`;
            const existing = lookup[key];
            if (!existing || (d.sent_at && (!existing.sent_at || new Date(d.sent_at) > new Date(existing.sent_at)))) lookup[key] = d;
          }
        };
        (arr || []).forEach(push);
        return lookup;
      };

      const downloadsLookup = downloadsLookupFrom(activityDownloads);

      // Helper to normalize certificate fields and email status for any list
      const normalizeList = (list: any[], downloadsLookupLocal: Record<string, any>) => {
        return (list || []).map((p: any) => {
          const certificate_number =
            p.certificate_number ??
            p.nomor_sertifikat ??
            p.certificate_no ??
            p.cert_no ??
            p.sertifikat?.certificate_number ??
            p.pivot?.certificate_number ??
            null;
          const rawTanggal = p.tanggal_sertifikat ?? p.date ?? p.certificate_date ?? p.pivot?.tanggal_sertifikat ?? null;
          const tanggal_sertifikat = formatToYYYYMMDD(rawTanggal) ?? null;
          const merchant_id = p.merchant_id ?? p.pivot?.merchant_id ?? null;

          let sentAt: any = null;
          if (p.certificate_sent !== undefined) {
            sentAt = p.sent_at ?? p.sentAt ?? null;
            if (!sentAt && p.certificate_sent) sentAt = new Date().toISOString();
          }
          if (!sentAt) sentAt = p.sent_at ?? p.sentAt ?? p._sent_at ?? p.email_sent_at ?? p.pivot?.sent_at ?? null;

          if ((!sentAt || sentAt === null) && Array.isArray(p.certificate_downloads)) {
            const latest = p.certificate_downloads.reduce((acc: any, cur: any) => {
              if (!cur) return acc;
              if (!acc) return cur;
              const a = acc.sent_at ?? acc.sentAt ?? null;
              const b = cur.sent_at ?? cur.sentAt ?? null;
              if (!b) return acc;
              if (!a) return cur;
              return (new Date(b) > new Date(a)) ? cur : acc;
            }, null as any);
            if (latest) sentAt = latest.sent_at ?? latest.sentAt ?? null;
          }
          if ((!sentAt || sentAt === null) && Array.isArray(p.downloads)) {
            const latest = p.downloads.reduce((acc: any, cur: any) => {
              if (!cur) return acc;
              if (!acc) return cur;
              const a = acc.sent_at ?? acc.sentAt ?? null;
              const b = cur.sent_at ?? cur.sentAt ?? null;
              if (!b) return acc;
              if (!a) return cur;
              return (new Date(b) > new Date(a)) ? cur : acc;
            }, null as any);
            if (latest) sentAt = latest.sent_at ?? latest.sentAt ?? null;
          }

          // fallback activity-level lookup
          if (!sentAt) {
            const byId = p.id ? downloadsLookupLocal[`id:${String(p.id)}`] : null;
            const byEmail = p.email ? downloadsLookupLocal[`e:${normalizeEmailKey(p.email)}`] : null;
            const byName = p.name ? downloadsLookupLocal[`n:${String(p.name)}`] : null;
            const pick = byId || byEmail || byName || null;
            if (pick) sentAt = pick.sent_at ?? pick.sentAt ?? pick.delivered_at ?? null;
          }

          const email_status = sentAt ? 'terkirim' : 'pending';

          return {
            ...p,
            certificate_number,
            tanggal_sertifikat,
            merchant_id,
            email_status,
            email_sent_at: sentAt ?? null,
          };
        });
      };

      // Normalize lists using the downloadsLookup we built
      const normalized = normalizeList(pesertaData, downloadsLookup);
      const normalizedPanitia = normalizeList(panitiaData, downloadsLookup);
      const normalizedNarasumber = normalizeList(narasumberData, downloadsLookup);

      // Persist nomor sertifikat dari server ke localStorage (from all lists)
      try {
        const map = readLocalCertMap();
        const entries = [
          ...normalized,
          ...normalizedPanitia,
          ...normalizedNarasumber,
        ].map((p: any) => ({ id: p.id, email: p.email, certificate_number: p.certificate_number }));
        const didChange = persistMapEntries(map, entries);
        if (didChange) saveLocalCertMap(map);
      } catch {}

  // Merge lokal jika server belum punya (apply to peserta only for now)
      // NOTE: if the server returned ZERO certificate numbers for all participants,
      // it's likely the database was reset (e.g. migrate:fresh). In that case we
      // should NOT re-apply stale certificate numbers from localStorage, because
      // those values no longer exist on the server and would appear out-of-sync.
      let localMap = readLocalCertMap();
      const anyServerHasCert = normalized.some((p: any) => Boolean(p.certificate_number));
      if (!anyServerHasCert && localMap && Object.keys(localMap).length > 0) {
        // Clear stale local cache to avoid resurrecting certificate numbers
        try { saveLocalCertMap({}); } catch (e) {}
        localMap = {};
      }
      // Merge local map into all normalized lists where server hasn't provided certificate_number
      const mergeWithLocal = (list: any[]) => {
        return (list || []).map((p: any) => {
          if (!p.certificate_number) {
            const byId = p.id ? localMap[`id:${String(p.id)}`] : null;
            const byEmail = p.email ? localMap[`e:${normalizeEmailKey(p.email)}`] : null;
            if (byId) p.certificate_number = byId;
            else if (byEmail) p.certificate_number = byEmail;
          }
          return p;
        });
      };

      const mergedPeserta = mergeWithLocal(normalized);
      const mergedPanitia = mergeWithLocal(normalizedPanitia);
      const mergedNarasumber = mergeWithLocal(normalizedNarasumber);

      setPeserta(sortPesertaByCertificate(mergedPeserta));
      setPanitia(sortPesertaByCertificate(mergedPanitia));
      setNarasumber(sortPesertaByCertificate(mergedNarasumber));
      setInstruktur(res.data.data.instruktur_name ?? res.data.data.instructor_name ?? "");

      // Ambil id template sertifikat
      setUserId(res.data.data.sertifikat_id ?? res.data.data.sertifikat_template_id ?? res.data.data.template_id ?? null);
      setCertificateNumberFormat(res.data.data.certificate_number_format ?? res.data.data.certificate_format ?? "");
      setMerchantId(res.data.data.merchant_id ?? null);

      const allListsForGeneratedCheck = [
        ...mergedPeserta,
        ...mergedPanitia,
        ...mergedNarasumber,
      ];
      const hasGeneratedCertificates = allListsForGeneratedCheck.length > 0 && allListsForGeneratedCheck.every((p: any) => Boolean(p.certificate_number));
      setCertificatesGenerated(hasGeneratedCertificates);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Gagal memuat data peserta");
    } finally {
      setLoading(false);
    }
  }, [activityId, readLocalCertMap, persistMapEntries, saveLocalCertMap]);

  useEffect(() => {
    fetchPeserta();
  }, [fetchPeserta]);

  // Fetch role-specific lists. role_id: 4 = panitia, 5 = narasumber
  const fetchPanitia = useCallback(async () => {
    setPanitiaLoading(true);
    try {
      const res = await axios.get(`/data-activities/${activityId}`);
      const list = res?.data?.data?.panitia ?? res?.data?.panitia ?? [];
      const normalized = (Array.isArray(list) ? list : []).map((p: any) => {
        const certificate_number = p.certificate_number ?? p.nomor_sertifikat ?? p.certificate_no ?? p.cert_no ?? p.sertifikat?.certificate_number ?? p.pivot?.certificate_number ?? null;
        const tanggal_sertifikat = formatToYYYYMMDD(p.tanggal_sertifikat ?? p.date ?? p.pivot?.tanggal_sertifikat ?? null) ?? null;
        const merchant_id = p.merchant_id ?? p.pivot?.merchant_id ?? null;
        // derive email status similarly (lightweight)
        const sentAt = p.sent_at ?? p.sentAt ?? p._sent_at ?? p.email_sent_at ?? p.pivot?.sent_at ?? null;
        const email_status = sentAt ? 'terkirim' : 'pending';
        return { ...p, certificate_number, tanggal_sertifikat, merchant_id, email_status, email_sent_at: sentAt ?? null };
      });
      setPanitia(sortPesertaByCertificate(normalized));
    } catch (e) {
      setPanitia([]);
    } finally {
      setPanitiaLoading(false);
    }
  }, [activityId]);

  const fetchNarasumber = useCallback(async () => {
    setNarasumberLoading(true);
    try {
      const res = await axios.get(`/data-activities/${activityId}`);
      const list = res?.data?.data?.narasumber ?? res?.data?.narasumber ?? [];
      const normalized = (Array.isArray(list) ? list : []).map((p: any) => {
        const certificate_number = p.certificate_number ?? p.nomor_sertifikat ?? p.certificate_no ?? p.cert_no ?? p.sertifikat?.certificate_number ?? p.pivot?.certificate_number ?? null;
        const tanggal_sertifikat = formatToYYYYMMDD(p.tanggal_sertifikat ?? p.date ?? p.pivot?.tanggal_sertifikat ?? null) ?? null;
        const merchant_id = p.merchant_id ?? p.pivot?.merchant_id ?? null;
        const sentAt = p.sent_at ?? p.sentAt ?? p._sent_at ?? p.email_sent_at ?? p.pivot?.sent_at ?? null;
        const email_status = sentAt ? 'terkirim' : 'pending';
        return { ...p, certificate_number, tanggal_sertifikat, merchant_id, email_status, email_sent_at: sentAt ?? null };
      });
      setNarasumber(sortPesertaByCertificate(normalized));
    } catch (e) {
      setNarasumber([]);
    } finally {
      setNarasumberLoading(false);
    }
  }, [activityId]);

  useEffect(() => {
    // fetch role lists when their tab becomes active
    if (activeTab === 'panitia') fetchPanitia();
    if (activeTab === 'narasumber') fetchNarasumber();
  }, [activeTab, fetchPanitia, fetchNarasumber]);

  const handleRefreshPeserta = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await fetchPeserta();
    } catch (e) {
      // ignore - fetchPeserta already sets error state
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchPeserta]);

  // Send email to a single participant (uses same backend as bulk send but single recipient)
  const sendEmailSingle = async (p: any) => {
    if (!certificatesGenerated) {
      setNotification({ message: 'Sertifikat belum digenerate. Tidak dapat mengirim email.', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    if (!p) return;
    const rid = getRowId(p);
    startSending(rid);
    try {
      let merchant_id = p.merchant_id ?? null;
      if (!merchant_id) {
        // try to get merchant_id from activity
        try {
          const actRes = await axios.get(`/data-activities/${activityId}`);
          merchant_id = actRes.data?.data?.merchant_id ?? null;
        } catch (err) {
          // ignore here, validation below will catch missing merchant_id
        }
      }

      const recipient = {
        user_id: p.id ?? null,
        recipient_name: p.name || '',
        email: p.email || '',
        certificate_number: p.certificate_number || null,
        date: p.tanggal_sertifikat || p.date || new Date().toISOString().slice(0, 10),
        instruktur: instruktur || '',
        merchant_id: merchant_id,
        send: true,
      };

      if (!recipient.email && !recipient.recipient_name) {
        throw new Error('Peserta tidak memiliki email atau nama penerima yang valid');
      }
      if (!merchant_id) {
        throw new Error('Merchant ID tidak ditemukan untuk mengirim email');
      }

  const res = await axios.post(`/sertifikat-templates/send-selected`, { recipients: [recipient], data_activity_id: Number(activityId) });
      // backend might return structured response
      if (res?.data && (res.data.status === 'error' || res.data?.message?.toLowerCase?.().includes('gagal'))) {
        throw new Error(res.data.message || 'Gagal mengirim email peserta');
      }
      setNotification({ message: `Email dikirim ke ${p.name || p.email}`, type: 'success' });
      try { await fetchPeserta(); } catch (e) {}
      setTimeout(() => setNotification(null), 3000);
    } catch (e: any) {
      // try to show server error message if available
      const serverMsg = e?.response?.data?.message ?? e?.message;
      console.error('sendEmailSingle error', e, 'serverMsg=', serverMsg);
      setNotification({ message: serverMsg || `Gagal mengirim email ke ${p.name || p.email}`, type: 'error' });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      stopSending(rid);
    }
  };

  // Timer for generate operation: start when isGenerating true
  useEffect(() => {
    if (isGenerating) {
      setElapsedSeconds(0);
      if (elapsedTimerRef.current) {
        window.clearInterval(elapsedTimerRef.current);
        elapsedTimerRef.current = null;
      }
      elapsedTimerRef.current = window.setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (elapsedTimerRef.current) {
        window.clearInterval(elapsedTimerRef.current);
        elapsedTimerRef.current = null;
      }
    }
    return () => {
      if (elapsedTimerRef.current) {
        window.clearInterval(elapsedTimerRef.current);
        elapsedTimerRef.current = null;
      }
    };
  }, [isGenerating]);

  const formatElapsed = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
    return `${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  };

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => peserta.some((p) => getRowId(p) === id)));
  }, [peserta]);

  // keep a mutable ref pointing to latest peserta to avoid stale closures in async callbacks
  useEffect(() => {
    pesertaRef.current = peserta;
  }, [peserta]);

  // total across all roles (used by header when on non-peserta tabs)
  const totalAllRoles = peserta.length + panitia.length + narasumber.length;
  // Determine whether the current combined selection contains any peserta entries
  const combinedSelectedSet = new Set(Array.from(new Set([...(selectedIds || []), ...(panitiaSelectedIds || []), ...(narasumberSelectedIds || [])])).map((s) => String(s)));
  const hasPesertaSelected = peserta.some((p) => combinedSelectedSet.has(String(getRowId(p))));

  // keep refs for panitia & narasumber as well so generate/merge can update them
  const panitiaRef = useRef<any[]>(panitia);
  useEffect(() => {
    panitiaRef.current = panitia;
  }, [panitia]);

  const narasumberRef = useRef<any[]>(narasumber);
  useEffect(() => {
    narasumberRef.current = narasumber;
  }, [narasumber]);

  useEffect(() => {
    const allLists: any[] = [...peserta, ...panitia, ...narasumber];
    const anyPresent = allLists.length > 0;
    const allGenerated = anyPresent && allLists.every((p: any) => Boolean(p.certificate_number));
    setCertificatesGenerated(allGenerated);
  }, [peserta, panitia, narasumber]);

  // Derived list after applying status filter + search (compute once per render)
  // First, filter by status and search
  const filteredPeserta = peserta.filter((p) => {
    const status = (p.email_status || (p.certificate_sent ? 'terkirim' : 'pending')) as string;
    if (statusFilter !== 'all' && status !== statusFilter) return false;

    const q = String(pesertaSearch || '').trim().toLowerCase();
    if (!q) return true;

    // fields to search: name, email, phone, institution, certificate number
    const name = String(p.name ?? '').toLowerCase();
    const email = String(p.email ?? '').toLowerCase();
    const phone = String(p.no_hp ?? p.phone ?? '').toLowerCase();
    const inst = String(p.asal_institusi ?? p.institution ?? '').toLowerCase();
    const cert = String(p.certificate_number ?? p.nomor_sertifikat ?? '').toLowerCase();

    return (
      name.includes(q) ||
      email.includes(q) ||
      phone.includes(q) ||
      inst.includes(q) ||
      cert.includes(q)
    );
  });

  // Then paginate the filtered results
  const totalItems = filteredPeserta.length;
  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(totalItems / itemsPerPage);
  const visiblePeserta = itemsPerPage === -1 
    ? filteredPeserta 
    : filteredPeserta.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // --- Derived lists + helpers for panitia ---
  const filteredPanitia = panitia.filter((p) => {
    // status handling (mirror peserta logic)
    const status = (p.email_status || (p.certificate_sent ? 'terkirim' : 'pending')) as string;
    if (statusFilter !== 'all' && status !== statusFilter) return false;

    const q = String(panitiaSearch || '').trim().toLowerCase();
    if (!q) return true;
    const name = String(p.name ?? '').toLowerCase();
    const email = String(p.email ?? '').toLowerCase();
    const phone = String(p.no_hp ?? p.phone ?? '').toLowerCase();
    const inst = String(p.asal_institusi ?? p.institution ?? '').toLowerCase();
    return name.includes(q) || email.includes(q) || phone.includes(q) || inst.includes(q);
  });
  const panitiaTotal = filteredPanitia.length;
  const panitiaTotalPages = panitiaItemsPerPage === -1 ? 1 : Math.max(1, Math.ceil(panitiaTotal / panitiaItemsPerPage));
  const visiblePanitia = panitiaItemsPerPage === -1 ? filteredPanitia : filteredPanitia.slice((panitiaCurrentPage - 1) * panitiaItemsPerPage, panitiaCurrentPage * panitiaItemsPerPage);
  const panitiaGetRowId = (p: any) => p.id ?? p.email ?? JSON.stringify(p);
  const panitiaIsSelected = (id: string | number) => panitiaSelectedIds.includes(id);
  const panitiaToggleSelect = (id: string | number) => setPanitiaSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const panitiaToggleSelectAll = () => {
    if (filteredPanitia.length === 0) return;
    const allIds = filteredPanitia.map(panitiaGetRowId);
    const allSelected = allIds.length > 0 && allIds.every((id) => panitiaSelectedIds.includes(id));
    if (allSelected) setPanitiaSelectedIds([]);
    else setPanitiaSelectedIds(allIds);
  };

  // Select all participants across peserta, panitia, narasumber
  const handleSelectAllEverything = () => {
    // Use the same getRowId helpers to produce stable keys for each list
    const pesertaKeys = peserta.map((p) => getRowId(p)).filter(Boolean) as Array<string | number>;
    const panitiaKeys = panitia.map((p) => panitiaGetRowId(p)).filter(Boolean) as Array<string | number>;
    const narasumberKeys = narasumber.map((p) => narasumberGetRowId(p)).filter(Boolean) as Array<string | number>;

    const allKeys = Array.from(new Set([...pesertaKeys, ...panitiaKeys, ...narasumberKeys]));

    // Determine if everything is already selected (normalize to strings)
    const currentlySelectedSet = new Set((selectedIds || []).map((s) => String(s)));
    const allSelected = allKeys.length > 0 && allKeys.every((k) => currentlySelectedSet.has(String(k)));

    if (allSelected) {
      // clear selections across everything
      setSelectedIds([]);
      setPanitiaSelectedIds([]);
      setNarasumberSelectedIds([]);
      setSelectAllUsers(false);
    } else {
      setSelectedIds(allKeys);
      setPanitiaSelectedIds(panitiaKeys);
      setNarasumberSelectedIds(narasumberKeys);
      setSelectAllUsers(true);
    }
  };

  // --- Derived lists + helpers for narasumber ---
  const filteredNarasumber = narasumber.filter((p) => {
    // status handling (mirror peserta logic)
    const status = (p.email_status || (p.certificate_sent ? 'terkirim' : 'pending')) as string;
    if (statusFilter !== 'all' && status !== statusFilter) return false;

    const q = String(narasumberSearch || '').trim().toLowerCase();
    if (!q) return true;
    const name = String(p.name ?? '').toLowerCase();
    const email = String(p.email ?? '').toLowerCase();
    const phone = String(p.no_hp ?? p.phone ?? '').toLowerCase();
    const inst = String(p.asal_institusi ?? p.institution ?? '').toLowerCase();
    return name.includes(q) || email.includes(q) || phone.includes(q) || inst.includes(q);
  });
  const narasumberTotal = filteredNarasumber.length;
  const narasumberTotalPages = narasumberItemsPerPage === -1 ? 1 : Math.max(1, Math.ceil(narasumberTotal / narasumberItemsPerPage));
  const visibleNarasumber = narasumberItemsPerPage === -1 ? filteredNarasumber : filteredNarasumber.slice((narasumberCurrentPage - 1) * narasumberItemsPerPage, narasumberCurrentPage * narasumberItemsPerPage);
  const narasumberGetRowId = (p: any) => p.id ?? p.email ?? JSON.stringify(p);
  const narasumberIsSelected = (id: string | number) => narasumberSelectedIds.includes(id);
  const narasumberToggleSelect = (id: string | number) => setNarasumberSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const narasumberToggleSelectAll = () => {
    if (filteredNarasumber.length === 0) return;
    const allIds = filteredNarasumber.map(narasumberGetRowId);
    const allSelected = allIds.length > 0 && allIds.every((id) => narasumberSelectedIds.includes(id));
    if (allSelected) setNarasumberSelectedIds([]);
    else setNarasumberSelectedIds(allIds);
  };

  const generateDefaultCertificateFormat = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const defaultFormat = `CERT/XX/${y}/${m}/{SEQ}`;
    setCertificateNumberFormat(defaultFormat);
  };

  // --- MODAL ANIMATION LOGIC ---
  const openAddModal = () => {
    if (certificatesGenerated) {
    setNotification({ message: 'Tidak dapat menambah users setelah nomor sertifikat digenerate.', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    setAddModal(true);
    const timer = setTimeout(() => setShowAddModalAnimation(true), 10);
    return () => clearTimeout(timer);
  };
  const closeAddModal = () => {
    setShowAddModalAnimation(false);
    const timer = setTimeout(() => {
      setAddModal(false);
      setNewPeserta({ name: "", email: "", no_hp: "", asal_institusi: "" });
      setError(null);
    }, 300);
    return () => clearTimeout(timer);
  };
  const openAddImportChooser = () => {
    if (certificatesGenerated) {
    setNotification({ message: 'Tidak dapat menambah atau mengimport users setelah nomor sertifikat digenerate.', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    setAddImportChooserModal(true);
    const timer = setTimeout(() => setShowAddImportChooserAnimation(true), 10);
    return () => clearTimeout(timer);
  };
  const closeAddImportChooser = () => {
    setShowAddImportChooserAnimation(false);
    const timer = setTimeout(() => {
      setAddImportChooserModal(false);
    }, 300);
    return () => clearTimeout(timer);
  };
  // When user selects an option in the chooser, close the chooser first then open target modal
  const handleChooserAddClick = () => {
    // begin closing animation
    closeAddImportChooser();
    // open add modal after chooser closed; allow slight buffer beyond animation
    setTimeout(() => openAddModal(), 360);
  };
  const handleChooserImportClick = () => {
    closeAddImportChooser();
    setTimeout(() => openImportModal(), 360);
  };
  const openEditModal = (peserta: any) => {
    // Prevent editing if the participant has already been sent the certificate
    if (peserta?.email_status === 'terkirim' || peserta?.certificate_sent) {
  setNotification({ message: 'Users yang sudah terkirim sertifikat tidak dapat diedit.', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    setEditPeserta(peserta);
    setEditModal(true);
    const timer = setTimeout(() => setShowEditModalAnimation(true), 10);
    return () => clearTimeout(timer);
  };
  const closeEditModal = () => {
    setShowEditModalAnimation(false);
    const timer = setTimeout(() => {
      setEditModal(false);
      setEditPeserta(null);
      setError(null);
    }, 300);
    return () => clearTimeout(timer);
  };
  const openImportModal = () => {
    if (certificatesGenerated) {
    setNotification({ message: 'Tidak dapat mengimport users setelah nomor sertifikat digenerate.', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    setImportModal(true);
    const timer = setTimeout(() => setShowImportModalAnimation(true), 10);
    return () => clearTimeout(timer);
  };
  const closeImportModal = () => {
    setShowImportModalAnimation(false);
    const timer = setTimeout(() => {
      setImportModal(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setError(null);
    }, 300);
    return () => clearTimeout(timer);
  };

  // --- CRUD AND OTHER ACTIONS ---
  const handleAddSubmit = async (eOrData: React.FormEvent<HTMLFormElement> | any) => {
    // Support being called either as form submit event (from upstream) or with data (from AddModal internal state)
    if (eOrData && typeof eOrData.preventDefault === 'function') {
      eOrData.preventDefault();
    }
    if (certificatesGenerated) {
  setNotification({ message: 'Tidak dapat menambah users setelah nomor sertifikat digenerate.', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    setIsAdding(true);
    setError(null);
    
    // determine source data: prefer passed data, otherwise use parent `newPeserta` state
    const formDataObj = (eOrData && !(eOrData && typeof eOrData.preventDefault === 'function')) ? eOrData : newPeserta;
    
    // Validate email format FIRST
    if (!isValidEmail(formDataObj.email)) {
      setError(getEmailErrorMessage(formDataObj.email));
      setIsAdding(false);
      return;
    }
    
    const phoneRaw = (formDataObj.no_hp || '').toString().trim();
    
    // Validate phone number format FIRST before checking duplicates
    if (phoneRaw) {
      // Check if contains only digits
      if (!/^[0-9]+$/.test(phoneRaw)) {
        setError('Nomor telepon harus bertulis angka!');
        setIsAdding(false);
        return;
      }
      
      // Check if starts with valid prefix
      if (!phoneRaw.startsWith('08') && !phoneRaw.startsWith('628')) {
        setError('Nomor telepon harus diawali dengan "08" atau "628"');
        setIsAdding(false);
        return;
      }
    }
    
    try {
      // Validate if email already exists with a different phone number
      const emailToCheck = (newPeserta.email || '').toString().trim().toLowerCase();
      const phoneToCheck = (newPeserta.no_hp || '').toString().trim();
      if (emailToCheck) {
        try {
          const resUsers = await axios.get('/users', { params: { q: emailToCheck, search: emailToCheck } });
          let usersList: any[] = [];
          if (Array.isArray(resUsers?.data)) usersList = resUsers.data;
          else if (resUsers?.data?.data && Array.isArray(resUsers.data.data)) usersList = resUsers.data.data;
          
          const matched = usersList.find((u: any) => (u.email || '').toString().trim().toLowerCase() === emailToCheck);
          if (matched && (matched.no_hp || matched.phone)) {
            const existingPhone = (matched.no_hp || matched.phone || '').toString().trim();
            if (existingPhone && phoneToCheck && existingPhone !== phoneToCheck) {
              setIsAdding(false);
              setNotification({ message: 'Email sudah terdaftar dengan nomor telepon berbeda.', type: 'error' });
              setTimeout(() => setNotification(null), 3000);
              return;
            }
          }
        } catch (e) {
          // ignore remote lookup errors and let backend handle uniqueness
        }
      }

      let mid = merchantId;
      if(!mid) {
        const act = await axios.get(`/data-activities/${activityId}`);
        mid = act?.data?.data?.merchant_id ?? null;
        setMerchantId(mid ?? null);
      }
      if (!mid) throw new Error('Merchant Id tidak ditemukan pada activity');

      // determine type_member based on active tab
      const type_member = activeTab === 'panitia' ? 'panitia' : activeTab === 'narasumber' ? 'narasumber' : 'peserta';
      await axios.post(`/data-activities/${activityId}/users`, {
        name: formDataObj.name,
        email: formDataObj.email,
        no_hp: formDataObj.no_hp,
        asal_institusi: formDataObj.asal_institusi,
        password: "password",
        type_member,
      });
      
      await fetchPeserta();
  // refresh role-specific list if applicable
  if (activeTab === 'panitia') await fetchPanitia();
  if (activeTab === 'narasumber') await fetchNarasumber();
  closeAddModal();
  setNotification({ message: `${activeTab === 'panitia' ? 'Panitia' : activeTab === 'narasumber' ? 'Narasumber' : 'Users'} berhasil ditambahkan!`, type: 'success' });
      setTimeout(() => setNotification(null), 3000);
      
    } catch (e: any) {
      const status = e?.response?.status;
      const data = e?.response?.data;
      
      // Handle 422 validation errors
      if (status === 422 && data) {
        const errors = data.errors || {};
        
        // Check for email conflict
        if (errors.email) {
          setNotification({ message: 'Email sudah terdaftar, gunakan email lain', type: 'error' });
          setTimeout(() => setNotification(null), 3000);
          setIsAdding(false);
          return;
        }
        
        // Check for phone conflict
        if (errors.no_hp || errors.phone || errors.telepon) {
          setNotification({ message: 'Nomor telepon sudah terdaftar', type: 'error' });
          setTimeout(() => setNotification(null), 3000);
          setIsAdding(false);
          return;
        }
        
        // Check message for conflicts
        if (typeof data.message === 'string') {
          const msg = data.message.toLowerCase();
          
          // Check both email and phone mentioned together
          if ((msg.includes('email') || msg.includes('e-mail')) && 
              (msg.includes('phone') || msg.includes('telepon') || msg.includes('no_hp') || msg.includes('hp'))) {
            setNotification({ message: 'Email dan nomor telepon sudah terdaftar', type: 'error' });
            setTimeout(() => setNotification(null), 3000);
            setIsAdding(false);
            return;
          }
          
          // Check for email conflict in message
          if ((msg.includes('email') || msg.includes('e-mail')) && 
              (msg.includes('already') || msg.includes('taken') || msg.includes('duplicate') || 
              msg.includes('sudah') || msg.includes('terdaftar'))) {
            setNotification({ message: 'Email sudah terdaftar, gunakan email lain', type: 'error' });
            setTimeout(() => setNotification(null), 3000);
            setIsAdding(false);
            return;
          }
          
          // Check for phone conflict in message
          if ((msg.includes('phone') || msg.includes('no_hp') || msg.includes('telepon') || msg.includes('hp')) && 
              (msg.includes('already') || msg.includes('taken') || msg.includes('duplicate') || 
              msg.includes('sudah') || msg.includes('terdaftar'))) {
            setNotification({ message: 'Nomor telepon sudah terdaftar', type: 'error' });
            setTimeout(() => setNotification(null), 3000);
            setIsAdding(false);
            return;
          }
          
          // If message exists but no specific field identified, show the message
          setNotification({ message: data.message, type: 'error' });
          setTimeout(() => setNotification(null), 3000);
          setIsAdding(false);
          return;
        }
        
        // Generic validation error
        setNotification({ message: 'Validasi gagal, periksa data yang diinput', type: 'error' });
        setTimeout(() => setNotification(null), 3000);
        setIsAdding(false);
        return;
      }
      
      // Handle other status codes with message
      if (data && typeof data.message === 'string') {
        const msg = data.message.toLowerCase();
        
        // Check for both conflicts
        if ((msg.includes('email') || msg.includes('e-mail')) && 
            (msg.includes('phone') || msg.includes('telepon') || msg.includes('no_hp') || msg.includes('hp'))) {
          setNotification({ message: 'Email dan nomor telepon sudah terdaftar', type: 'error' });
          setTimeout(() => setNotification(null), 3000);
          setIsAdding(false);
          return;
        }
        
        // Check for email conflict
        if ((msg.includes('email') || msg.includes('e-mail')) && 
            (msg.includes('already') || msg.includes('taken') || msg.includes('duplicate') || 
            msg.includes('sudah') || msg.includes('terdaftar'))) {
          setNotification({ message: 'Email sudah terdaftar, gunakan email lain', type: 'error' });
          setTimeout(() => setNotification(null), 3000);
          setIsAdding(false);
          return;
        }
        
        // Check for phone conflict
        if ((msg.includes('phone') || msg.includes('no_hp') || msg.includes('telepon') || msg.includes('hp')) && 
            (msg.includes('already') || msg.includes('taken') || msg.includes('duplicate') || 
            msg.includes('sudah') || msg.includes('terdaftar'))) {
          setNotification({ message: 'Nomor telepon sudah terdaftar', type: 'error' });
          setTimeout(() => setNotification(null), 3000);
          setIsAdding(false);
          return;
        }
        
        // Show original message if no specific pattern matched
        setNotification({ message: data.message, type: 'error' });
        setTimeout(() => setNotification(null), 3000);
        setIsAdding(false);
        return;
      }
      
      // Fallback error
  setNotification({ message: 'Gagal menambah users', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditSubmit = async (eOrData: React.FormEvent | any) => {
    // Support being called either as form submit event (legacy) or with edited data object
    let payload: any = null;
    if (eOrData && typeof eOrData.preventDefault === 'function') {
      eOrData.preventDefault();
      // fallback to current editPeserta state
      if (!editPeserta) return;
      payload = {
        id: editPeserta.id,
        name: editPeserta.name,
        no_hp: editPeserta.no_hp,
        asal_institusi: editPeserta.asal_institusi,
        email: editPeserta.email,
      };
    } else if (eOrData && typeof eOrData === 'object') {
      // called with data from EditModal
      payload = {
        id: editPeserta?.id,
        name: eOrData.name,
        no_hp: eOrData.no_hp,
        asal_institusi: eOrData.asal_institusi,
        email: eOrData.email,
      };
    } else {
      return;
    }

    try {
      if (!payload || !payload.id) return;
      
      // Validate email format
      if (!isValidEmail(payload.email)) {
        setError(getEmailErrorMessage(payload.email));
        return;
      }
      
      await axios.put(`/users/${payload.id}`, {
        name: payload.name,
        no_hp: payload.no_hp,
        asal_institusi: payload.asal_institusi,
        email: payload.email,
      });
      setEditModal(false);
      await fetchPeserta();
  setNotification({ message: 'Data users berhasil diubah!', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (e: any) {
      const status = e?.response?.status;
      const data = e?.response?.data;
      if (status === 422 && data) {
        const errors = data.errors || {};
        if (errors.email) {
          const msg = 'Email sudah terdaftar, gunakan email lain';
          setNotification({ message: msg, type: 'error' });
          setTimeout(() => setNotification(null), 3000);
        } else if (errors.no_hp || errors.phone || errors.telepon) {
          const msg = 'Nomor telefon sudah terdaftar';
          setNotification({ message: msg, type: 'error' });
          setTimeout(() => setNotification(null), 3000);
        } else if (typeof data.message === 'string') {
          const msg = data.message.toLowerCase();
          if (msg.includes('email') && (msg.includes('already') || msg.includes('taken') || msg.includes('unique'))) {
            const em = 'Email sudah terdaftar, gunakan email lain';
            setNotification({ message: em, type: 'error' });
            setTimeout(() => setNotification(null), 3000);
          } else if (msg.includes('phone') || msg.includes('no_hp') || msg.includes('telepon')) {
            const ph = 'Nomor telefon sudah terdaftar';
            setNotification({ message: ph, type: 'error' });
            setTimeout(() => setNotification(null), 3000);
          } else {
            setError(data.message || 'Gagal memperbarui data peserta');
          }
        } else {
          setError('Gagal memperbarui data peserta');
        }
      } else if (data && typeof data.message === 'string') {
        const msg = data.message.toLowerCase();
        if (msg.includes('email') && (msg.includes('already') || msg.includes('taken') || msg.includes('duplicate'))) {
          const em = 'Email sudah terdaftar, gunakan email lain';
          setNotification({ message: em, type: 'error' });
          setTimeout(() => setNotification(null), 3000);
        } else if (msg.includes('phone') || msg.includes('no_hp') || msg.includes('telepon')) {
          const ph = 'Nomor telefon sudah terdaftar';
          setNotification({ message: ph, type: 'error' });
          setTimeout(() => setNotification(null), 3000);
        } else {
          setError(data.message || 'Gagal memperbarui data peserta');
        }
      } else {
        setError(e?.response?.data?.message || "Gagal memperbarui data peserta");
      }
    }
  };

  const handleImport = async () => {
    if (certificatesGenerated) {
  setNotification({ message: 'Tidak dapat mengimport users setelah nomor sertifikat digenerate.', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Pilih file terlebih dahulu");
      return;
    }
    setImporting(true);
    setError(null);
    const formData = new FormData();
    formData.append("file_excel", file);
    formData.append("activity_id", activityId);
    try {
      // attach type_member according to activeTab so backend knows which role to assign
      formData.append('type_member', activeTab === 'panitia' ? 'panitia' : activeTab === 'narasumber' ? 'narasumber' : 'peserta');
      const res = await axios.post(`/data-activities/${activityId}/import`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Backend may return a report of conflicts/duplicates in various shapes.
      const data = res?.data ?? {};
      const conflicts = data?.conflicts || data?.duplicates || data?.errors || null;
      if (Array.isArray(conflicts) && conflicts.length > 0) {
        // Keep import modal open and show conflicts for user to fix the file
        setImportConflicts(conflicts.map((c: any) => {
          // normalize common fields
          return {
            email: c.email ?? c.email_address ?? c.emails ?? null,
            no_hp: c.no_hp ?? c.phone ?? c.telepon ?? c.phone_number ?? null,
            message: c.message ?? c.reason ?? JSON.stringify(c),
            raw: c,
          };
        }));
        setError('Terdapat konflik pada data import. Periksa daftar dan perbaiki file sebelum mengulangi import.');
        return;
      }

      // No conflicts — proceed normally
      closeImportModal();
  await fetchPeserta();
  if (activeTab === 'panitia') await fetchPanitia();
  if (activeTab === 'narasumber') await fetchNarasumber();
  // ensure cached users list is refreshed after import
  setAllAvailableUsers([]);
  setNotification({ message: 'Import users berhasil!', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (e: any) {
      // If backend responded with structured conflicts in error payload, surface them
      const resp = e?.response?.data ?? null;
      const conflicts = resp?.conflicts || resp?.duplicates || resp?.errors || null;
      if (Array.isArray(conflicts) && conflicts.length > 0) {
        setImportConflicts(conflicts.map((c: any) => ({
          email: c.email ?? c.email_address ?? null,
          no_hp: c.no_hp ?? c.phone ?? c.telepon ?? c.phone_number ?? null,
          message: c.message ?? c.reason ?? JSON.stringify(c),
          raw: c,
        })));
        setError('Terdapat konflik pada data import. Periksa daftar dan perbaiki file sebelum mengulangi import.');
      } else {
        setError(e?.response?.data?.message || "Gagal import data");
      }
    } finally {
      setImporting(false);
    }
  };

    // --- Import from existing users (in system) ---
  const buildUserQueryParams = (page: number, perPage: number, q: string) => {
    // Kirim beberapa alias param agar cocok dengan berbagai backend (search | q | keyword)
    const params: any = { page, perPage };
    if (q && q.trim()) {
      params.search = q.trim();
      params.q = q.trim();
      params.keyword = q.trim();
    }
    return params;
  };

  const fetchAvailableUsers = useCallback(async (page = 1, q = '') => {
    setUsersLoading(true);
    try {
      // Try to ask backend for filtered users by role if supported. We include both
      // type_member (string) and role_id (numeric mapping) as query params to match
      // different backend conventions. If backend ignores these params it will
      // return full list and the client-side fallback will filter it.
      let rawList: any[] = [];
      const params: any = {};

      // If we have no cached full list, fetch from backend (we no longer request by role)
      if ((allAvailableUsersRef.current || []).length === 0) {
        const res = await axios.get('/users', { params });
        const data = res?.data ?? {};
        if (Array.isArray(data)) rawList = data;
        else if (data?.data && Array.isArray(data.data)) rawList = data.data;
        else rawList = [];
      } else {
        // reuse cached full list from ref
        rawList = allAvailableUsersRef.current;
      }

      // Daftar peserta yang sudah ikut (hindari duplikat)
      const existingIds = new Set<number | string>(
        (pesertaRef.current || []).map((p: any) => p.id).filter(Boolean)
      );
      const existingEmails = new Set<string>(
        (pesertaRef.current || [])
          .map((p: any) => normalizeEmailKey(p.email))
          .filter(Boolean) as string[]
      );

      const normalizeAndFilter = (list: any[]) => {
        const filtered = (list || []).filter((u: any) => {
          if (u?.id && existingIds.has(u.id)) return false;
          const em = normalizeEmailKey(u?.email);
          if (em && existingEmails.has(em)) return false;
          return true;
        });
        // ensure selected ids remain valid within the overall filtered set
        setSelectedUserIdsToImport((prev) => prev.filter((id) => filtered.some((fu) => fu.id === id)));
        if (filtered.length === 0) setSelectAllUsers(false);
        return filtered;
      };

  const normalizedFull = normalizeAndFilter(rawList);
  // update cache (keep ref in sync)
  updateAllAvailableUsers(normalizedFull);

      // client-side search
      const qNorm = (q || '').trim().toLowerCase();
      const searched = qNorm
        ? normalizedFull.filter((u: any) => {
            const name = (u.name || '').toString().toLowerCase();
            const email = (u.email || '').toString().toLowerCase();
            const phone = (u.no_hp || u.phone || '').toString().toLowerCase();
            return name.includes(qNorm) || email.includes(qNorm) || phone.includes(qNorm);
          })
        : normalizedFull;

      const total = searched.length;
      const lp = Math.max(1, Math.ceil(total / usersPerPage));
      setUsersTotalPages(lp);

      // slice for current page
      const start = (Math.max(1, page) - 1) * usersPerPage;
      const pageItems = searched.slice(start, start + usersPerPage);
      setAvailableUsers(pageItems);
    } catch (e: any) {
      setAvailableUsers([]);
      setUsersTotalPages(1);
    } finally {
      setUsersLoading(false);
    }
  }, [usersPerPage]);


    useEffect(() => {
    if (importModal && importTab === 'users') {
      // Ensure we don't reuse a previously cached, role-filtered users list
      // Clear the cache so fetchAvailableUsers will call the backend and
      // return a full, role-agnostic users list (includes panitia/narasumber).
      updateAllAvailableUsers([]);
      fetchAvailableUsers(usersPage, userSearch);
    }
      }, [importModal, importTab, usersPage, userSearch, fetchAvailableUsers, activeTab]);

    const toggleSelectUser = (id: number) => {
      setSelectedUserIdsToImport((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const handleSelectAllUsersOnPage = () => {
      if (selectAllUsers) {
        setSelectedUserIdsToImport([]);
        setSelectAllUsers(false);
        return;
      }
      const ids = availableUsers.map((u) => u.id).filter(Boolean) as number[];
      setSelectedUserIdsToImport(ids);
      setSelectAllUsers(true);
    };

    const handleImportUsers = async () => {
      if (certificatesGenerated) {
  setNotification({ message: 'Tidak dapat mengimport users setelah nomor sertifikat digenerate.', type: 'error' });
        setTimeout(() => setNotification(null), 3000);
        return;
      }
      if (selectedUserIdsToImport.length === 0) {
        setError('Pilih minimal satu pengguna untuk diimpor.');
        return;
      }
      setIsImportingUsers(true);
      setError(null);
      try {
        // Use the same import endpoint as Excel import so backend can run the same validation and conflict detection.
  // include type_member so imported users become panitia/narasumber if needed
  const payload: any = { user_ids: selectedUserIdsToImport };
  if (activeTab === 'panitia') payload.type_member = 'panitia';
  else if (activeTab === 'narasumber') payload.type_member = 'narasumber';
  const res = await axios.post(`/data-activities/${activityId}/import`, payload);

        const data = res?.data ?? {};
        const conflicts = data?.conflicts || data?.duplicates || data?.errors || null;
        if (Array.isArray(conflicts) && conflicts.length > 0) {
          setImportConflicts(conflicts.map((c: any) => ({
            email: c.email ?? c.email_address ?? null,
            no_hp: c.no_hp ?? c.phone ?? c.telepon ?? c.phone_number ?? null,
            message: c.message ?? c.reason ?? JSON.stringify(c),
            raw: c,
          })));
          setError('Terdapat konflik pada data import. Periksa daftar dan coba lagi.');
          return;
        }

        // No conflicts — proceed normally
  await fetchPeserta();
  // ensure cached users list is refreshed after import
  setAllAvailableUsers([]);
  setNotification({ message: `Berhasil mengimpor ${selectedUserIdsToImport.length} users.`, type: 'success' });
        setTimeout(() => setNotification(null), 3000);
        setSelectedUserIdsToImport([]);
        setSelectAllUsers(false);
        closeImportModal();
      } catch (e: any) {
        const resp = e?.response?.data ?? null;
        const conflicts = resp?.conflicts || resp?.duplicates || resp?.errors || null;
        if (Array.isArray(conflicts) && conflicts.length > 0) {
          setImportConflicts(conflicts.map((c: any) => ({
            email: c.email ?? c.email_address ?? null,
            no_hp: c.no_hp ?? c.phone ?? c.telepon ?? c.phone_number ?? null,
            message: c.message ?? c.reason ?? JSON.stringify(c),
            raw: c,
          })));
          setError('Terdapat konflik pada data import. Periksa daftar dan coba lagi.');
        } else {
          setError(e?.response?.data?.message || 'Gagal mengimpor peserta');
        }
      } finally {
        setIsImportingUsers(false);
      }
    };

  const handleDeletePeserta = async () => {
    if (!deleteConfirmation) return;
    if (certificatesGenerated) {
  setNotification({ message: 'Tidak dapat menghapus users setelah nomor sertifikat digenerate.', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      setDeleteConfirmation(null);
      return;
    }
    setIsDeleting(true);
    try {
      // prefer backend route that removes participant from activity without deleting user
      try {
        await axios.delete(`/data-activities/${activityId}/users/${deleteConfirmation.id}`);
      } catch (err: any) {
        // fallback to legacy endpoint if participants route not available
        if (err?.response?.status === 404) {
          await axios.delete(`data-activities/${activityId}/users/${deleteConfirmation.id}`);
        } else throw err;
      }
      setDeleteConfirmation(null);
      await fetchPeserta();
  setNotification({ message: 'Users berhasil dihapus!', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Gagal menghapus peserta");
    } finally {
      setIsDeleting(false);
    }
  };

  // Bulk delete selected participants
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);
  const [bulkEmailModal, setBulkEmailModal] = useState(false);
  const handleDeleteSelected = async () => {
    const combinedSelectedKeys = new Set<string>([
      ...((selectedIds || []).map((s) => String(s))),
      ...((panitiaSelectedIds || []).map((s) => String(s))),
      ...((narasumberSelectedIds || []).map((s) => String(s))),
    ]);

    if (combinedSelectedKeys.size === 0) return;

    if (certificatesGenerated) {
      setNotification({ message: 'Tidak dapat menghapus setelah nomor sertifikat digenerate.', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      setBulkDeleteModal(false);
      return;
    }
    setIsDeleting(true);
    try {
      const allUsers = [
        ...peserta.map(p => ({ ...p, __id: getRowId(p) })),
        ...panitia.map(p => ({ ...p, __id: panitiaGetRowId(p) })),
        ...narasumber.map(p => ({ ...p, __id: narasumberGetRowId(p) }))
      ];
      
      const uniqueUsers = Array.from(new Map(allUsers.map(p => [p.id || p.email, p])).values());

      const idsToDelete = uniqueUsers
        .filter(p => combinedSelectedKeys.has(String(p.__id)) && p.id != null)
        .map(p => p.id);

      if (idsToDelete.length === 0) {
        setNotification({ message: 'Tidak ada item dengan ID yang dapat dihapus.', type: 'error' });
        setTimeout(() => setNotification(null), 3000);
        setIsDeleting(false);
        setBulkDeleteModal(false);
        return;
      }
      
      // Menggunakan endpoint baru untuk bulk delete
      await axios.post('/data-activities/remove-participants', { 
        data_activity_id: activityId,
        user_ids: idsToDelete 
      });
      
      // Refresh all data and clear all selections
      await fetchPeserta();
      await fetchPanitia();
      await fetchNarasumber();
      
      setSelectedIds([]);
      setPanitiaSelectedIds([]);
      setNarasumberSelectedIds([]);
      setSelectAllUsers(false);

      setNotification({ message: `Berhasil menghapus ${idsToDelete.length} users.`, type: 'success' });
      setTimeout(() => setNotification(null), 3000);
      setBulkDeleteModal(false);
    } catch (e: any) {
      setNotification({ message: e?.response?.data?.message || 'Gagal menghapus beberapa item', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsDeleting(false);
    }
  };

  // Send emails to selected participants (requires certificatesGenerated)
  const handleSendEmailSelected = async () => {
    if (!certificatesGenerated) {
      setNotification({ message: 'Sertifikat belum digenerate. Tidak dapat mengirim email.', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      setBulkEmailModal(false);
      return;
    }
    // Combine selections from all tabs and normalize keys to strings so comparisons
    // against participant row ids are stable (prevents number/string mismatch).
    const combinedSelectedKeys = new Set<string>([
      ...((selectedIds || []).map((s) => String(s))),
      ...((panitiaSelectedIds || []).map((s) => String(s))),
      ...((narasumberSelectedIds || []).map((s) => String(s))),
    ]);
    if (combinedSelectedKeys.size === 0) return;
    setIsGenerating(true);
    try {
  // Build recipients from combined selections across peserta, panitia, and narasumber
  const pesertaRecipients = peserta
    .filter((p) => combinedSelectedKeys.has(String(getRowId(p))))
    .map((p) => ({
      user_id: p.id ?? null,
      recipient_name: p.name || '',
      email: p.email || '',
      certificate_number: p.certificate_number || null,
      date: p.tanggal_sertifikat || p.date || new Date().toISOString().slice(0, 10),
      instruktur: instruktur || '',
      merchant_id: p.merchant_id ?? null,
      send: true,
    }));

  const panitiaRecipients = panitia
    .filter((p) => combinedSelectedKeys.has(String(panitiaGetRowId(p))))
    .map((p) => ({
      user_id: p.id ?? null,
      recipient_name: p.name || '',
      email: p.email || '',
      certificate_number: p.certificate_number || null,
      date: p.tanggal_sertifikat || p.date || new Date().toISOString().slice(0, 10),
      instruktur: instruktur || p.instruktur || '',
      merchant_id: p.merchant_id ?? null,
      send: true,
    }));

  const narasumberRecipients = narasumber
    .filter((p) => combinedSelectedKeys.has(String(narasumberGetRowId(p))))
    .map((p) => ({
      user_id: p.id ?? null,
      recipient_name: p.name || '',
      email: p.email || '',
      certificate_number: p.certificate_number || null,
      date: p.tanggal_sertifikat || p.date || new Date().toISOString().slice(0, 10),
      instruktur: instruktur || p.instruktur || '',
      merchant_id: p.merchant_id ?? null,
      send: true,
    }));

  // combine and dedupe recipients (prefer numeric user_id, then normalized email, then name)
  const combined = [...pesertaRecipients, ...panitiaRecipients, ...narasumberRecipients].filter((r) => r.email || r.recipient_name);
  const seen = new Set<string>();
  const recipients: typeof combined = [];
  combined.forEach((r) => {
    const key = r.user_id ? `id:${String(r.user_id)}` : r.email ? `e:${normalizeEmailKey(r.email)}` : `n:${r.recipient_name}`;
    if (!seen.has(key)) {
      seen.add(key);
      recipients.push(r);
    }
  });

  if (recipients.length === 0) {
    setNotification({ message: 'Tidak ada item valid untuk dikirim email.', type: 'error' });
    setTimeout(() => setNotification(null), 3000);
    setIsGenerating(false);
    setBulkEmailModal(false);
    return;
  }

      await axios.post(`/sertifikat-templates/send-selected`, {
        recipients,
        data_activity_id: Number(activityId),
      });
 setNotification({ message: `Email dikirim ke ${recipients.length} item.`, type: 'success' });
      // refresh lists
      try { await fetchPeserta(); } catch (e) { /* ignore refresh errors */ }
      if (activeTab === 'panitia') await fetchPanitia();
      if (activeTab === 'narasumber') await fetchNarasumber();
      setTimeout(() => setNotification(null), 3000);
      setBulkEmailModal(false);
    } catch (e: any) {
      setNotification({ message: e?.response?.data?.message || 'Gagal mengirim email ke beberapa item', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsGenerating(false);
    }
  };

  // === Perbaikan utama di sini ===
  const handleUpdateAndGenerate = async (formatOverride?: string) => {
    setIsGenerating(true);
    setGeneratePercent(0);

    if (progressIntervalRef.current) window.clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = window.setInterval(() => {
      setGeneratePercent((p) => {
        if (p === null) return 0;
        const next = Math.min(85, p + Math.floor(Math.random() * 6) + 3);
        return next;
      });
    }, 800);

    setError(null);
    try {
      if (certificatesGenerated) {
        setNotification({ message: 'Nomor sertifikat sudah digenerate sebelumnya.', type: 'error' });
        setTimeout(() => setNotification(null), 3000);
        setIsGenerating(false);
        return;
      }
      if (!activityId || isNaN(parseInt(activityId, 10))) throw new Error('Activity ID tidak valid');
  const combinedLists = [ ...(peserta || []), ...(panitia || []), ...(narasumber || []) ];
  if (!combinedLists || combinedLists.length === 0) throw new Error('Tidak ada peserta/panitia/narasumber untuk digenerate sertifikat');
      if (!userId) throw new Error('Template sertifikat belum dipasang. Silakan pilih template terlebih dahulu.');
      if (!instruktur) throw new Error('Instruktur tidak ditemukan');

      const formatToUse =
        typeof formatOverride === 'string' && formatOverride.trim() !== ''
          ? formatOverride.trim()
          : (certificateNumberFormat || '').trim();
      if (!formatToUse) throw new Error('Format nomor sertifikat tidak boleh kosong');

      // Opsional: update format di template
      await axios.put(`/sertifikat-templates/${userId}`, { certificate_number_format: formatToUse });

      // Build recipients from peserta + panitia + narasumber so all members get generated
      const toRecipients = (list: any[]) => list.map((p) => ({
        user_id: p.id ?? null,
        recipient_name: p.name || '',
        date: p.tanggal_sertifikat || new Date().toISOString().slice(0, 10),
        email: p.email || '',
      }));
      const recipients = [
        ...toRecipients(peserta),
        ...toRecipients(panitia),
        ...toRecipients(narasumber),
      ];

      const data_activity_id = parseInt(activityId, 10);
      let merchant_id = peserta[0]?.merchant_id ?? null;
      if (!merchant_id) {
        const activityRes = await axios.get(`/data-activities/${activityId}`);
        merchant_id = activityRes.data?.data?.merchant_id ?? null;
      }
      if (!merchant_id) throw new Error('Merchant ID tidak ditemukan');

      const payload: any = {
        recipients,
        merchant_id,
        data_activity_id,
        instruktur, // wajib sesuai validasi backend
        certificate_number_format: formatToUse,
      };

      const mergeTaskPayloadIntoState = (taskPayload: any[] | Record<string, any>) => {
        try {
          const items = Array.isArray(taskPayload) ? taskPayload : (taskPayload?.recipients ?? taskPayload?.data ?? []);
          if (!Array.isArray(items)) return;

          // We'll try to merge received certificate data into peserta, panitia, and narasumber lists.
          const mergeIntoList = (listRef: React.MutableRefObject<any[]>, setter: (v: any[]) => void) => {
            const currentList = listRef.current ?? [];
            const updatedList = currentList.map((pItem) => {
              const match = items.find((g: any) => {
                if (!g) return false;
                if (g.id && pItem.id && Number(g.id) === Number(pItem.id)) return true;
                if (g.user_id && pItem.id && Number(g.user_id) === Number(pItem.id)) return true;
                if (g.participant_id && pItem.id && Number(g.participant_id) === Number(pItem.id)) return true;
                if (g.email && pItem.email && String(g.email).toLowerCase() === String(pItem.email).toLowerCase()) return true;
                if (g.recipient_name && pItem.name && String(g.recipient_name) === String(pItem.name)) return true;
                if (g.token && pItem._certificate_token && String(g.token) === String(pItem._certificate_token)) return true;
                return false;
              });
              if (match) {
                return {
                  ...pItem,
                  certificate_number: match.certificate_number ?? pItem.certificate_number,
                  _certificate_token: match.token ?? match.download_token ?? pItem._certificate_token,
                  _certificate_filename: match.filename ?? match.file_name ?? pItem._certificate_filename,
                };
              }
              return pItem;
            });
            const sorted = sortPesertaByCertificate(updatedList);
            setter(sorted);
            listRef.current = sorted;
          };

          mergeIntoList(pesertaRef, setPeserta);
          mergeIntoList(panitiaRef, setPanitia);
          mergeIntoList(narasumberRef, setNarasumber);

          const map = readLocalCertMap();
          items.forEach((g: any) => {
            if (!g || !g.certificate_number) return;
            if (g.id) map[`id:${String(g.id)}`] = g.certificate_number;
            else if (g.user_id) map[`id:${String(g.user_id)}`] = g.certificate_number;
            else if (g.email) map[`e:${normalizeEmailKey(g.email)}`] = g.certificate_number;
            else if (g.recipient_name) map[`n:${String(g.recipient_name)}`] = g.certificate_number;
          });
          saveLocalCertMap(map);

          // Update certificatesGenerated based on all lists
          const allLists = [
            ...(pesertaRef.current ?? []),
            ...(panitiaRef.current ?? []),
            ...(narasumberRef.current ?? []),
          ];
          const anyPresent = allLists.length > 0;
          const allGeneratedNow = anyPresent && allLists.every((p) => Boolean(p.certificate_number));
          setCertificatesGenerated(allGeneratedNow);
        } catch (e) {
          // ignore merge errors
        }
      };

      // Attempt to create/update number-generation task
      let createResp: any = null;
      try {
        createResp = await axios.post(`/sertifikat-templates/${userId}/generate-bulk-number`, payload);
      } catch (genErr: any) {
        if (genErr?.response?.status === 404) {
          // fallback: try older endpoint
          try {
            createResp = await axios.post(`/sertifikat-templates/${userId}/generate-bulk-pdf`, payload);
          } catch (fallbackErr) {
            throw fallbackErr;
          }
        } else {
          throw genErr;
        }
      }

      const createdData = createResp?.data ?? createResp;
      if (createdData?.data && (Array.isArray(createdData.data) || createdData.data.recipients)) {
        mergeTaskPayloadIntoState(createdData.data);
      }

      const returnedToken = createdData?.data?.task_token || createdData?.task_token || createdData?.data?.token || createdData?.token || null;
      if (returnedToken) setTaskToken(String(returnedToken));

      const resumeUrl = (tok: string) => `/sertifikat-templates/resume/${tok}`;
      const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

      const resumeLoop = async (tok: string) => {
        let keepGoing = true;
        const maxCycles = 200; // safe guard
        let cycles = 0;
        while (keepGoing && cycles < maxCycles) {
          cycles += 1;
          try {
            const r = await axios.post(resumeUrl(tok));
            const statusCode = r?.status ?? 200;
            const body = r?.data ?? r;
            if (body?.payload) mergeTaskPayloadIntoState(body.payload);
            if (body?.data && (Array.isArray(body.data) || body.data.recipients || body.data.payload)) mergeTaskPayloadIntoState(body.data);

            const processed = Number(body?.processed ?? body?.next_index ?? body?.data?.processed ?? 0);
            const total = Number(body?.total ?? body?.data?.total ?? combinedLists.length ?? 0);
            if (total > 0 && !Number.isNaN(processed)) {
              const pct = Math.min(100, Math.round((processed / total) * 100));
              setGeneratePercent(pct);
            }

            const statusText = String(body?.status || body?.state || '').toLowerCase();
            if (statusCode === 200 && (statusText === 'completed' || statusText === 'done' || (total > 0 && Number(processed) >= Number(total)))) {
              if (body?.payload) mergeTaskPayloadIntoState(body.payload);
              setGeneratePercent(100);
              setCertificatesGenerated(true);
              await fetchPeserta();
              setNotification({ message: 'Proses generate selesai.', type: 'success' });
              setTimeout(() => setNotification(null), 3000);
              keepGoing = false;
              break;
            }

            if (statusCode === 202 || statusText === 'processing' || body?.next_index) {
              await sleep(800);
              continue;
            }

            if (statusText === 'failed' || statusText === 'error' || statusCode >= 400) {
              setNotification({ message: body?.message || 'Proses generate sertifikat gagal.', type: 'error' });
              setTimeout(() => setNotification(null), 3000);
              keepGoing = false;
              break;
            }

            keepGoing = false;
          } catch (e) {
            await sleep(1200);
          }
        }
      };

      if (returnedToken) {
        if (progressIntervalRef.current) { window.clearInterval(progressIntervalRef.current); progressIntervalRef.current = null; }
        resumeLoop(String(returnedToken)).catch(() => {});
      } else {
        if (!createdData?.data || !(Array.isArray(createdData.data) || createdData.data.recipients)) {
          await fetchPeserta();
        }
      }

  setNotification({ message: 'Nomor sertifikat users berhasil digenerate!', type: 'success' });
      setTimeout(() => setNotification(null), 3000);

    } catch (e: any) {
      console.error('Error generating certificates:', e);
      const errorMessage = e?.message || "Gagal generate sertifikat";
      setNotification({ message: errorMessage, type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      setError(errorMessage);
    } finally {
      setGeneratePercent(100);
      if (progressIntervalRef.current) { window.clearInterval(progressIntervalRef.current); progressIntervalRef.current = null; }
      if (progressPollerRef.current) { window.clearInterval(progressPollerRef.current); progressPollerRef.current = null; }
      setTimeout(() => {
        setGeneratePercent(null);
        setIsGenerating(false);
      }, 700);
    }
  };

  const handleDownload = async (recipientName: string, recipientEmail: string, certificateNumber: string) => {
    if (!userId || !instruktur) {
      setNotification({ message: "Template atau instruktur belum diatur.", type: "error" });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setIsDownloading(recipientEmail);

    try {
      const currentPeserta = peserta.find(p => p.email === recipientEmail) || peserta.find(p => p.id === recipientEmail);
      const date = formatToYYYYMMDD(currentPeserta?.tanggal_sertifikat || currentPeserta?.date) || new Date().toISOString().slice(0, 10);
      const currentMerchantId = currentPeserta?.merchant_id ?? null;
      const certNumber = certificateNumber || currentPeserta?.certificate_number || currentPeserta?.nomor_sertifikat || currentPeserta?.cert_no || null;
      const data_activity_id = parseInt(activityId, 10);

      const payload = {
        recipient_name: recipientName,
        instruktur_name: instruktur,
        instruktur: instruktur,
        certificate_number: certNumber,
        date: date,
        data_activity_id: data_activity_id,
        merchant_id: currentMerchantId ? Number(currentMerchantId) : null,
      };

      const response = await axios.get(`/sertifikat-templates/download-by-user/${currentPeserta?.id}`, { params: payload, responseType: "blob" });

      const contentType = response.headers["content-type"];
      if (contentType && contentType.includes("application/pdf")) {
        const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `sertifikat-${recipientName.replace(/\s+/g, "-")}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
        setNotification({ message: "PDF berhasil diunduh!", type: "success" });
        setTimeout(() => setNotification(null), 3000);
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errorData = JSON.parse(reader.result as string);
            setNotification({ message: `Gagal membuat PDF: ${errorData.message || "Terjadi kesalahan"}`, type: "error" });
          } catch (e) {
            setNotification({ message: "Gagal memproses respons dari server.", type: "error" });
          }
          setTimeout(() => setNotification(null), 3000);
        };
        reader.readAsText(response.data);
      }
    } catch (err: any) {
      console.error("Error generating PDF:", err);
      if (err.response && err.response.data) {
        const errorBlob = err.response.data;
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errorData = JSON.parse(reader.result as string);
            setNotification({ message: `Gagal membuat PDF: ${errorData.message || "Terjadi kesalahan"}`, type: "error" });
          } catch (e) {
            setNotification({ message: "Gagal memproses respons error dari server.", type: "error" });
          }
          setTimeout(() => setNotification(null), 3000);
        };
        reader.readAsText(errorBlob);
      } else {
        setNotification({ message: `Gagal membuat PDF: ${err.message}`, type: "error" });
        setTimeout(() => setNotification(null), 3000);
      }
    } finally {
      setIsDownloading(null);
    }
  };
  
  // Use separate components for Panitia and Narasumber tabs
  
  return (
    <div className="mt-6 rounded-lg bg-white p-4 md:p-8 shadow-lg dark:bg-[#122031]">
      {/* Tabs: Peserta | Panitia | Narasumber */}
      <div className="mb-4 flex items-center justify-start space-x-2">
        <button
          onClick={() => setActiveTab('peserta')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'peserta' ? 'bg-sky-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
        >
          Peserta
        </button>
        <button
          onClick={() => setActiveTab('panitia')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'panitia' ? 'bg-sky-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
        >
          Panitia
        </button>
        <button
          onClick={() => setActiveTab('narasumber')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'narasumber' ? 'bg-sky-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
        >
          Narasumber
        </button>
      </div>

      {/* Content per tab */}
      {activeTab === 'peserta' && (
        <>
          <PesertaHeader
            totalPeserta={peserta.length}
            loading={loading}
            certificatesGenerated={certificatesGenerated}
            selectedIds={selectedIds}
            onAddImportClick={openAddImportChooser}
            onBulkDeleteClick={() => setBulkDeleteModal(true)}
            onBulkEmailClick={() => setBulkEmailModal(true)}
            onGenerateClick={() => !certificatesGenerated && setShowGenerateModal(true)}
            isGenerating={isGenerating}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            onSelectAllEverything={handleSelectAllEverything}
          />

          <PesertaFilters
            pesertaSearch={pesertaSearch}
            onSearchChange={setPesertaSearch}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(v) => { setItemsPerPage(v); setCurrentPage(1); }}
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />

          <PesertaTable
            loading={loading}
            peserta={peserta}
            filteredPeserta={filteredPeserta}
            visiblePeserta={visiblePeserta}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            isSelected={isSelected}
            toggleSelect={toggleSelect}
            toggleSelectAll={toggleSelectAll}
            sendingIds={sendingIds}
            certificatesGenerated={certificatesGenerated}
            userId={userId}
            instruktur={instruktur}
            activityId={activityId}
            onSendEmail={sendEmailSingle}
            onEdit={openEditModal}
            onDelete={setDeleteConfirmation}
          />
        </>
      )}

      {activeTab === 'panitia' && (
        <PanitiaTab
          activityId={activityId}
          panitia={panitia}
          panitiaLoading={panitiaLoading}
          certificatesGenerated={certificatesGenerated}
          panitiaSelectedIds={panitiaSelectedIds}
          onSelectAllEverything={handleSelectAllEverything}
          totalAllRoles={totalAllRoles}
          currentRole={'Panitia'}
          globalSelectedIds={selectedIds}
          selectAllUsers={selectAllUsers}
          hasPesertaSelected={hasPesertaSelected}
          openAddImportChooser={openAddImportChooser}
          onBulkDeleteClick={() => setBulkDeleteModal(true)}
          onBulkEmailClick={() => setBulkEmailModal(true)}
          onGenerateClick={() => !certificatesGenerated && setShowGenerateModal(true)}
          isGenerating={isGenerating}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          panitiaSearch={panitiaSearch}
          setPanitiaSearch={setPanitiaSearch}
          panitiaItemsPerPage={panitiaItemsPerPage}
          setPanitiaItemsPerPage={setPanitiaItemsPerPage}
          panitiaTotalPages={panitiaTotalPages}
          panitiaCurrentPage={panitiaCurrentPage}
          setPanitiaCurrentPage={setPanitiaCurrentPage}
          filteredPanitia={filteredPanitia}
          visiblePanitia={visiblePanitia}
          panitiaIsSelected={panitiaIsSelected}
          panitiaToggleSelect={panitiaToggleSelect}
          panitiaToggleSelectAll={panitiaToggleSelectAll}
          panitiaSendingIds={panitiaSendingIds}
          userId={userId}
          instruktur={instruktur}
          sendEmailSingle={sendEmailSingle}
          openEditModal={openEditModal}
          setDeleteConfirmation={setDeleteConfirmation}
        />
      )}

      {activeTab === 'narasumber' && (
        <NarasumberTab
          activityId={activityId}
          narasumber={narasumber}
          narasumberLoading={narasumberLoading}
          certificatesGenerated={certificatesGenerated}
          narasumberSelectedIds={narasumberSelectedIds}
          onSelectAllEverything={handleSelectAllEverything}
          totalAllRoles={totalAllRoles}
          currentRole={'Narasumber'}
          globalSelectedIds={selectedIds}
          selectAllUsers={selectAllUsers}
          hasPesertaSelected={hasPesertaSelected}
          openAddImportChooser={openAddImportChooser}
          onBulkDeleteClick={() => setBulkDeleteModal(true)}
          onBulkEmailClick={() => setBulkEmailModal(true)}
          onGenerateClick={() => !certificatesGenerated && setShowGenerateModal(true)}
          isGenerating={isGenerating}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          narasumberSearch={narasumberSearch}
          setNarasumberSearch={setNarasumberSearch}
          narasumberItemsPerPage={narasumberItemsPerPage}
          setNarasumberItemsPerPage={setNarasumberItemsPerPage}
          narasumberTotalPages={narasumberTotalPages}
          narasumberCurrentPage={narasumberCurrentPage}
          setNarasumberCurrentPage={setNarasumberCurrentPage}
          filteredNarasumber={filteredNarasumber}
          visibleNarasumber={visibleNarasumber}
          narasumberIsSelected={narasumberIsSelected}
          narasumberToggleSelect={narasumberToggleSelect}
          narasumberToggleSelectAll={narasumberToggleSelectAll}
          narasumberSendingIds={narasumberSendingIds}
          userId={userId}
          instruktur={instruktur}
          sendEmailSingle={sendEmailSingle}
          openEditModal={openEditModal}
          setDeleteConfirmation={setDeleteConfirmation}
        />
      )}

      {/* Modals */}
      <AddModal
        isOpen={addModal}
        onClose={closeAddModal}
        onSubmit={handleAddSubmit}
        isAdding={isAdding}
        error={error}
        certificatesGenerated={certificatesGenerated}
        memberLabel={activeTab === 'panitia' ? 'Panitia' : activeTab === 'narasumber' ? 'Narasumber' : 'Peserta'}
      />
      
      <EditModal
        isOpen={editModal}
        onClose={closeEditModal}
        peserta={editPeserta}
        onSubmit={handleEditSubmit}
        error={error}
      />

      <ImportModal
        isOpen={importModal}
        onClose={closeImportModal}
        onImport={handleImport}
        onImportUsers={handleImportUsers}
        isImporting={isImporting}
        isImportingUsers={isImportingUsers}
        error={error}
        certificatesGenerated={certificatesGenerated}
        importTab={importTab}
        onTabChange={setImportTab}
        fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
        availableUsers={availableUsers}
        usersLoading={usersLoading}
        userSearch={userSearch}
        onUserSearchChange={setUserSearch}
        usersPage={usersPage}
        usersTotalPages={usersTotalPages}
        onUsersPageChange={setUsersPage}
        selectedUserIdsToImport={selectedUserIdsToImport}
        onSelectUser={toggleSelectUser}
        onSelectAllUsersOnPage={handleSelectAllUsersOnPage}
        selectAllUsers={selectAllUsers}
        memberRole={activeTab}
      />

      <DeleteConfirmationModal
        peserta={deleteConfirmation}
        isOpen={!!deleteConfirmation}
        onClose={() => setDeleteConfirmation(null)}
        onConfirm={handleDeletePeserta}
        isDeleting={isDeleting}
      />

      {addImportChooserModal && (
        <AddImportChooserModal 
          isOpen={addImportChooserModal}
          showAnimation={showAddImportChooserAnimation}
          onClose={closeAddImportChooser}
          onAddClick={handleChooserAddClick}
          onImportClick={handleChooserImportClick}
        />
      )}

      {(bulkDeleteModal || bulkEmailModal) && (
        (() => {
          const combinedSelectedKeys = new Set<string>([
            ...((selectedIds || []).map((s) => String(s))),
            ...((panitiaSelectedIds || []).map((s) => String(s))),
            ...((narasumberSelectedIds || []).map((s) => String(s))),
          ]);

          // Combine all user types for accurate counting
          const allUsersForCount = [
            ...peserta.map(p => ({ ...p, __id: getRowId(p) })),
            ...panitia.map(p => ({ ...p, __id: panitiaGetRowId(p) })),
            ...narasumber.map(p => ({ ...p, __id: narasumberGetRowId(p) }))
          ];

          const selectedUsers = allUsersForCount.filter(p => combinedSelectedKeys.has(String(p.__id)));
          
          // Deduplicate before counting to handle users appearing in multiple lists
          const uniqueSelectedUsers = Array.from(new Map(selectedUsers.map(p => [p.id || p.email, p])).values());
          
          const recipientsCount = uniqueSelectedUsers.filter(p => p.email || p.name).length;

          return (
            <BulkActionModals
              bulkDeleteModal={bulkDeleteModal}
              bulkEmailModal={bulkEmailModal}
              selectedIds={Array.from(combinedSelectedKeys)}
              currentRole={activeTab}
              recipientsCount={recipientsCount}
              onCloseDelete={() => setBulkDeleteModal(false)}
              onCloseEmail={() => setBulkEmailModal(false)}
              onConfirmDelete={handleDeleteSelected}
              onConfirmEmail={handleSendEmailSelected}
              isDeleting={isDeleting}
              isGenerating={isGenerating}
            />
          );
        })()
      )}

      <GenerateFormatModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onSubmit={handleGenerateModalSubmit}
        formatInput={generateFormatInput}
        onFormatChange={setGenerateFormatInput}
        isGenerating={isGenerating}
      />

      <ImportConflictsModal
        conflicts={importConflicts}
        onClose={() => setImportConflicts(null)}
      />

      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 rounded-lg px-4 py-3 shadow-lg transition-all ${
            notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
          }`}
        >
          {notification.message}
        </div>
      )}
    </div>
  );
}