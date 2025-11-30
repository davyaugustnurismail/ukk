"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { toast } from "react-toastify";
import { PencilSquareIcon, CheckCircleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { getUser, updateUser } from "@/lib/fetch-user-instruktur-management";

type InstrukturType = {
  id: number;
  name: string;
  email: string;
  signature?: string | null; // url base64 atau path
};

// Spinner mini (kaya di tabel)
const Spinner = () => (
  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-500 border-t-transparent"></div>
);

function classNames(...cls: (string | false | null | undefined)[]) {
  return cls.filter(Boolean).join(" ");
}

/** =========================
 *  Modal Isi Signature (Dummy)
 *  ========================= */
function SignatureModal({ open, onClose, onSaved, defaultSignature, }: { open: boolean; onClose: () => void; onSaved: (file: File) => Promise<void> | void; defaultSignature?: string | null; }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // show existing signature if present and no selected file
    if (!file) setPreview(defaultSignature ?? null);
  }, [defaultSignature, file, open]);

  useEffect(() => {
    // create object URL for selected file preview
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!open) return null;

  const handleFile = (f?: File) => {
    if (!f) {
      setFile(null);
      setPreview(defaultSignature ?? null);
      return;
    }
    setFile(f);
  };

  const handleSave = async () => {
    if (!file) return toast.error("Pilih file signature terlebih dahulu.");
    setSaving(true);
    try {
      await onSaved(file);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Gagal menyimpan signature.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-lg dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Isi Signature
          </h3>
          <button
            onClick={onClose}
            className="rounded-md p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="p-4">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Upload Gambar Signature (PNG/JPG)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFile(e.target.files?.[0])}
              className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100 dark:text-gray-300 dark:file:bg-indigo-900/30 dark:file:text-indigo-200"
            />
            <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center dark:border-gray-700">
              <p className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Preview
              </p>
              {preview ? (
                <div className="relative mt-2 flex items-center justify-center overflow-hidden">
                  <div className="relative aspect-[3/1] w-full max-w-[560px]">
                    <Image
                      src={preview}
                      alt="Signature Preview"
                      className="h-full w-full rounded object-contain"
                      width={560}
                      height={187}
                      unoptimized
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">Belum ada file dipilih.</div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-200 p-4 dark:border-gray-800">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Spinner /> : <CheckCircleIcon className="h-4 w-4" />}
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

/** =========================
 *  Halaman Profil Instruktur
 *  ========================= */
export default function InstrukturProfilePage() {
  const [loading, setLoading] = useState(true);
  const [instruktur, setInstruktur] = useState<InstrukturType | null>(null);
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Dummy fetch profil
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        // Try to read current user id from localStorage (app stores user JSON on login)
        let userId: number | null = null;
        try {
          const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
          if (raw) {
            const parsed = JSON.parse(raw);
            if (typeof parsed.id === "number") userId = parsed.id;
          }
        } catch (e) {}

        const buildSignatureUrl = (sig?: string | null) => {
          if (!sig) return null;
          // already a data url or absolute url or absolute path
          if (sig.startsWith('data:') || sig.startsWith('http') || sig.startsWith('/')) return sig;
          const base = (process.env.NEXT_PUBLIC_BACKEND_URL || '').replace(/\/$/, '');
          return base ? `${base}/storage/${sig}` : `/storage/${sig}`;
        };

        if (userId) {
          const data = await getUser(userId);
          if (data) {
            // normalize signature to a loadable URL
            const normalized = { ...(data as InstrukturType), signature: buildSignatureUrl((data as any).signature ?? null) };
            setInstruktur(normalized as InstrukturType);
            return;
          }
        }

        // Fallback dummy profile when no user id or fetch failed
    setInstruktur({ id: 17, name: "Instruktur", email: "instruktur@example.com", signature: null });
      } catch (e: any) {
        toast.error("Gagal memuat profil instruktur.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const initials = useMemo(() => {
    if (!instruktur?.name) return "IN";
    return instruktur.name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [instruktur?.name]);

  const handleSaveSignature = async (file: File) => {
    if (!instruktur) return;
    try {
      setSavingProfile(true);
      const fd = new FormData();
      fd.append("_method", "PUT");
      fd.append("signature", file);
      const res = await updateUser(instruktur.id, fd as any);
      // normalize returned signature path/url to a browser-loadable URL
      const returned = res?.data?.signature || res?.signature || null;
      const buildSignatureUrl = (sig?: string | null) => {
        if (!sig) return null;
        if (sig.startsWith('data:') || sig.startsWith('http') || sig.startsWith('/')) return sig;
        const base = (process.env.NEXT_PUBLIC_BACKEND_URL || '').replace(/\/$/, '');
        return base ? `${base}/storage/${sig}` : `/storage/${sig}`;
      };
      const sigUrl = returned ? buildSignatureUrl(returned) : URL.createObjectURL(file);
      setInstruktur({ ...instruktur, signature: sigUrl });
      toast.success("Signature berhasil diunggah.");
    } catch (e: any) {
      console.error(e);
      toast.error("Gagal menyimpan signature.");
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="rounded-lg bg-white p-4 shadow-md dark:bg-gray-900">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
          Profil Instruktur
        </h2>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 w-full sm:w-auto transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <ArrowPathIcon className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {loading || !instruktur ? (
        <div className="flex items-center justify-center py-16 text-gray-500 dark:text-gray-400">
          <Spinner />
          <span className="ml-2">Memuat profil…</span>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Kartu profil ringkas */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 sm:col-span-1">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 flex h-12 w-12 sm:h-14 sm:w-14 min-w-[48px] min-h-[48px] sm:min-w-[56px] sm:min-h-[56px] items-center justify-center rounded-full bg-indigo-600 text-lg font-bold text-white shadow">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate" title={instruktur.name}>
                  {instruktur.name}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300 truncate" title={instruktur.email}>
                  {instruktur.email}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/60">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-0 truncate">
                  Status Signature
                </span>
                {instruktur.signature ? (
                  <span className="flex-shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    <CheckCircleIcon className="h-4 w-4" />
                    Signed
                  </span>
                ) : (
                  <span className="flex-shrink-0 inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    Belum ada
                  </span>
                )}
              </div>

              <div className="mt-3">
                {instruktur.signature ? (
                  <div className="rounded-lg border border-dashed border-gray-300 p-3 text-center dark:border-gray-700">
                    <div className="relative mt-2 flex items-center justify-center overflow-hidden">
                      <div className="relative aspect-[3/1] w-full max-w-[420px]">
                        <Image
                          src={instruktur.signature as string}
                          alt="Signature"
                          className="h-full w-full rounded object-contain"
                          width={420}
                          height={140}
                          unoptimized
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Belum mengunggah/menulis signature.
                  </p>
                )}
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setSignatureModalOpen(true)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
                >
                  <PencilSquareIcon className="h-4 w-4" />
                  {instruktur.signature ? "Ubah Signature" : "Isi Signature"}
                </button>
              </div>
            </div>
          </div>

          {/* Detail informasi (minimal) */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 sm:col-span-2">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              Informasi Dasar
            </h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/60">
                <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Nama
                </div>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
                  {instruktur.name}
                </div>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/60">
                <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Email
                </div>
                <div className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                  {instruktur.email}
                </div>
              </div>
              {/* Tambah field lain sesuai kebutuhanmu */}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                disabled={savingProfile}
                onClick={() => toast.info("Tidak ada perubahan disimpan (dummy).")}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 w-full sm:w-auto transition hover:bg-gray-100 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {savingProfile ? <Spinner /> : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>
      )}

      <SignatureModal
        open={signatureModalOpen}
        onClose={() => setSignatureModalOpen(false)}
        onSaved={handleSaveSignature}
        defaultSignature={instruktur?.signature}
      />
    </div>
  );
}
