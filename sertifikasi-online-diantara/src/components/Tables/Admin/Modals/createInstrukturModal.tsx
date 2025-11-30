"use client";

import { useState, useEffect } from "react";
import { createUser } from "@/lib/fetch-user-instruktur-management";
import { isValidEmail, getEmailErrorMessage } from "@/lib/email-validation";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Image from "next/image";
type Props = {
  onClose: () => void;
  onUserCreated: () => void;
};

export default function CreateUserModal({ onClose, onUserCreated }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [asalInstitusi, setAsalInstitusi] = useState("");
  const [jenisKelamin, setJenisKelamin] = useState<string>("");
  const [jabatan, setJabatan] = useState("");
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    setShowAnimation(true);
  }, []);

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
    
    if (password.length < 6) {
      toast.error("Password harus minimal 6 karakter!");
      return;
    }

    if (phoneNumber && !phoneNumber.startsWith("08") && !phoneNumber.startsWith("+62")) {
      toast.error("Nomor telepon harus dimulai dengan '08' atau '+62'!");
      return;
    }

    setLoading(true);

    // Send dummy merchant_id as it's required by type but will be overridden by backend
    const merchant_id = Number(localStorage.getItem("merchant_id")) || 1; // Default to 1 if not found

    try {
      // If a signature file is present, create FormData and include file
      if (signatureFile) {
        const fd = new FormData();
        fd.append("name", name);
        fd.append("email", email);
        fd.append("password", password);
        fd.append("role_id", String(2));
        fd.append("merchant_id", String(merchant_id));
        fd.append("phone_number", phoneNumber);
        fd.append("asal_institusi", asalInstitusi);
        fd.append("jabatan", jabatan);
        if (jenisKelamin) fd.append("jenis_kelamin", jenisKelamin);
        fd.append("signature", signatureFile);

        await createUser(fd as any);
      } else {
        const payload: any = {
          name,
          email,
          password,
          role_id: 2,
          merchant_id,
          phone_number: phoneNumber,
          asal_institusi: asalInstitusi,
          jabatan: jabatan,
          ...(jenisKelamin && { jenis_kelamin: jenisKelamin }),
        };
        await createUser(payload);
      }

      onUserCreated();
      toast.success("Instruktur berhasil dibuat!");
      handleClose();
    } catch (err: any) {
      console.error(err);
      const errorMsg = err?.response?.data?.message || err?.message || "Gagal membuat instruktur";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSignatureFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setSignaturePreview(url);
    } else {
      setSignaturePreview(null);
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
        className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg bg-white p-8 shadow-xl transition-all duration-300 ease-in-out dark:bg-[#122031] ${
          showAnimation ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-white">
          Tambah Instruktur
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Grid 2 kolom untuk form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Nama <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Masukkan nama instruktur"
                required
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setName(e.target.value)
                }
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEmail(e.target.value)
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                placeholder="Masukkan password (Minimal 6 karakter)"
                required
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPassword(e.target.value)
                }
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const value = e.target.value;
                  // Izinkan angka, +, spasi, tanda hubung, dan kurung
                  if (value === '' || /^[\+]?[0-9\s\-\(\)]*$/.test(value)) {
                    setPhoneNumber(value);
                  }
                }}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Nomor telepon harus dimulai dengan &quot;08&quot; atau &quot;+62&quot;.
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAsalInstitusi(e.target.value)}
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setJabatan(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Jenis Kelamin
              </label>
              <select
                value={jenisKelamin}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setJenisKelamin(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="">-- Pilih (Opsional) --</option>
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
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer"
            />
            {signaturePreview && (
              <div className="mt-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">Preview:</p>
                <Image
                  src={signaturePreview}
                  alt="preview"
                  className="object-contain rounded-lg"
                  width={400}
                  height={120}
                  unoptimized
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="rounded-lg bg-gray-200 px-6 py-2.5 text-sm font-medium hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Menambahkan..." : "Tambah Instruktur"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}