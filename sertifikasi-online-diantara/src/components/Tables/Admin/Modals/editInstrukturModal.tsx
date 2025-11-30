"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { updateUser } from "@/lib/fetch-user-instruktur-management";
import { isValidEmail, getEmailErrorMessage } from "@/lib/email-validation";
import axios from "@/lib/axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface User {
  id: number;
  name: string;
  email: string;
  signature?: string;
  signature_url?: string;
  phone_number?: string;
  asal_institusi?: string;
  jabatan?: string;
  jenis_kelamin?: string;
}

interface UpdateUserData {
  name: string;
  email: string;
  password?: string;
  signature?: string | null;
  phone_number?: string | null;
  asal_institusi: string;
  jabatan: string;
  jenis_kelamin?: string | null;
}

type Props = {
  onClose: () => void;
  user: User;
  onUserUpdated: () => void;
};

export default function EditUserModal({ onClose, user, onUserUpdated }: Props) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState("");
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const backendBase = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");

  // Build initial signature preview
  const initialSignaturePreview = (() => {
    if (!user) return null;
    const sigUrl = user.signature_url || user.signature || null;
    if (!sigUrl) return null;
    if (/^https?:\/\//i.test(sigUrl)) return sigUrl;
    if (sigUrl.startsWith("/")) return `${backendBase}${sigUrl}`;
    return `${backendBase}/storage/${sigUrl}`;
  })();

  const [signaturePreview, setSignaturePreview] = useState<string | null>(initialSignaturePreview);
  const [showAnimation, setShowAnimation] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<string>(user.phone_number ?? "");
  const [asalInstitusi, setAsalInstitusi] = useState<string>(user.asal_institusi ?? "");
  const [jenisKelamin, setJenisKelamin] = useState<string>(user.jenis_kelamin ?? "");
  const [jabatan, setJabatan] = useState<string>(user.jabatan ?? "");

  useEffect(() => {
    setShowAnimation(true);
  }, []);

  // Update preview when `user` prop changes
  useEffect(() => {
    const sigUrl = user?.signature_url || user?.signature || null;
    if (!sigUrl) {
      setSignaturePreview(null);
      return;
    }
    if (/^https?:\/\//i.test(sigUrl)) setSignaturePreview(sigUrl as string);
    else if ((sigUrl as string).startsWith("/")) setSignaturePreview(`${backendBase}${sigUrl}`);
    else setSignaturePreview(`${backendBase}/storage/${sigUrl}`);
  }, [user, backendBase]);

  const handleClose = () => {
    setShowAnimation(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidEmail(email)) {
      toast.error(getEmailErrorMessage(email));
      return;
    }

    if (phoneNumber && !phoneNumber.startsWith("08") && !phoneNumber.startsWith("+62")) {
      toast.error("Nomor telepon harus dimulai dengan '08' atau '+62'!");
      return;
    }

    try {
      // If a new signature file is selected we need to send multipart/form-data.
      // Many servers (eg. Laravel) don't parse multipart PUT payloads, so send POST with _method=PUT.
      if (signatureFile instanceof File) {
        // helper to build FormData; includeMethod=true will append _method=PUT for POST fallback
        const buildFormData = (includeMethod = false) => {
          const f = new FormData();
          // Always coerce to string to avoid sending undefined/null
          f.append("name", (name ?? "").toString());
          f.append("email", (email ?? "").toString());
          if (password) f.append("password", password.toString());
          else f.append("password", "");
          f.append("phone_number", (phoneNumber ?? "").toString());
          f.append("asal_institusi", (asalInstitusi ?? "").toString());
          f.append("jabatan", (jabatan ?? "").toString());
          f.append("jenis_kelamin", (jenisKelamin ?? "").toString());
          f.append("signature", signatureFile as Blob);
          if (includeMethod) f.append("_method", "PUT");
          return f;
        };

        const fd = buildFormData(false);

        console.log("📦 FormData contents (attempting multipart PUT):");
        for (let [key, value] of fd.entries()) {
          if (value instanceof File) {
            console.log(`  ${key}:`, `File(${value.name}, ${value.type}, ${value.size} bytes)`);
          } else {
            console.log(`  ${key}:`, value);
          }
        }

        // Additional quick-read checks to ensure values match state
        console.log("FormData quick-check:", {
          name: fd.get("name"),
          email: fd.get("email"),
          phone_number: fd.get("phone_number"),
          asal_institusi: fd.get("asal_institusi"),
          jabatan: fd.get("jabatan"),
          jenis_kelamin: fd.get("jenis_kelamin"),
        });

        // Try PUT first (as you requested). If server rejects multipart PUT, retry POST with _method=PUT.
        try {
          await axios.put(`/instruktur/${user.id}`, fd);
        } catch (err: any) {
          const status = err?.response?.status;
          const msg = String(err?.response?.data?.message || err?.message || "");
          const shouldFallback = [415, 405].includes(status) || /multipart|unsupported|not allowed|method/i.test(msg) || status === 422;
          console.warn("PUT multipart failed, fallback check:", { status, msg, shouldFallback });
          if (shouldFallback) {
            const fd2 = buildFormData(true);
            console.log("Retrying as POST with _method=PUT (fallback) - FormData contents:");
            for (let [key, value] of fd2.entries()) {
              if (value instanceof File) {
                console.log(`  ${key}:`, `File(${value.name}, ${value.type}, ${value.size} bytes)`);
              } else {
                console.log(`  ${key}:`, value);
              }
            }
            await axios.post(`/instruktur/${user.id}`, fd2);
          } else {
            throw err; // rethrow if it's not a fallback-eligible error
          }
        }
      } else {
        // No file: send JSON via existing helper which uses axios.put
        const payload: any = {
          name,
          email,
          phone_number: phoneNumber,
          asal_institusi: asalInstitusi,
          jabatan,
          jenis_kelamin: jenisKelamin || null,
        };
        if (password) payload.password = password;

        console.log("📦 JSON payload (no file):", payload);
        await updateUser(user.id, payload);
      }
      
      onUserUpdated();
      toast.success("Instruktur berhasil diupdate!");
      handleClose();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || "Gagal mengupdate instruktur.";
      toast.error(errorMessage);
      console.error("❌ Update error:", err);
      
      // Log response jika ada
      if (err?.response) {
        console.error("Response status:", err.response.status);
        console.error("Response data:", err.response.data);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      // Validasi file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error("Format file tidak valid. Gunakan JPG, PNG, GIF, atau WebP");
        e.target.value = "";
        return;
      }
      
      // Validasi file size (max 2MB)
      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error("Ukuran file terlalu besar. Maksimal 2MB");
        e.target.value = "";
        return;
      }
      
      // Set file dan preview
      setSignatureFile(file);
      
      // Convert file to base64 for preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignaturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      console.log("📁 File selected:", {
        name: file.name,
        type: file.type,
        size: `${(file.size / 1024).toFixed(2)} KB`
      });
    } else {
      // File input di-clear
      setSignatureFile(null);
      
      // Kembalikan ke preview awal jika ada
      const sigUrl = user?.signature_url || user?.signature || null;
      if (!sigUrl) {
        setSignaturePreview(null);
      } else if (/^https?:\/\//i.test(sigUrl)) {
        setSignaturePreview(sigUrl as string);
      } else if ((sigUrl as string).startsWith("/")) {
        setSignaturePreview(`${backendBase}${sigUrl}`);
      } else {
        setSignaturePreview(`${backendBase}/storage/${sigUrl}`);
      }
    }
  };



  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 transition-opacity duration-300 ease-in-out ${
        showAnimation ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
    >
      <div
        className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg bg-white p-4 sm:p-8 shadow-xl transition-all duration-300 ease-in-out dark:bg-[#122031] ${
          showAnimation ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 sm:mb-6 text-xl sm:text-2xl font-bold text-gray-900 dark:text-white text-center">
          Edit Instruktur
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Grid 2 kolom */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div>
              <label className="mb-1.5 sm:mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Nama <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Masukkan nama instruktur"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                placeholder="Masukkan email instruktur"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Password (Opsional)
              </label>
              <input
                type="password"
                placeholder="Kosongkan jika tidak ingin mengubah password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Telepon
              </label>
              <input
                type="text"
                placeholder="Contoh: 08123456789, +6281234567890"
                value={phoneNumber}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "" || /^[\+]?[0-9\s\-\(\)]*$/.test(value)) {
                    setPhoneNumber(value);
                  }
                }}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Nomor telepon harus dimulai dengan &quot;08&quot; atau &quot;+62&quot;. Kosongkan untuk menghapus.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Asal Institusi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Masukkan asal institusi"
                required
                value={asalInstitusi}
                onChange={(e) => setAsalInstitusi(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Jabatan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Masukkan jabatan"
                required
                value={jabatan}
                onChange={(e) => setJabatan(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Jenis Kelamin
              </label>
              <select
                value={jenisKelamin}
                onChange={(e) => setJenisKelamin(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="">-- Pilih / Kosongkan --</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
          </div>

          {/* Signature full width */}
          <div className="pt-2">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Signature (Opsional)
            </label>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleFileChange}
              className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Format: JPG, PNG, GIF, WebP. Maksimal 2MB
            </p>
            
            {signaturePreview && (
              <div className="mt-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  {signatureFile ? "Preview Signature Baru:" : "Signature Saat Ini:"}
                </p>
                <Image
                  src={signaturePreview}
                  alt="preview"
                  className="object-contain rounded-lg bg-gray-50 dark:bg-gray-800"
                  width={400}
                  height={120}
                  unoptimized={true}
                  priority={true}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg bg-gray-200 px-6 py-2.5 text-sm font-medium hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
            >
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}