"use client";

import { useState, useEffect } from "react";
import { createUser } from "@/lib/fetch-admin-management";
import { isValidEmail, getEmailErrorMessage } from "@/lib/email-validation";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type Props = {
  onClose: () => void;
  onUserCreated: () => void;
};

export default function CreateUserModal({ onClose, onUserCreated }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
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
    
    if (password.length < 8) {
      toast.error("Password harus minimal 8 karakter!");
      return;
    }
    setLoading(true);

    const merchantId = localStorage.getItem("merchant_id");
    const payload: {
      name: string;
      email: string;
      password: string;
      merchant_id: string;
    } = {
      name,
      email,
      password,
      merchant_id: merchantId || "0", // Provide a default value if merchantId is null
    };

    try {
      await createUser(payload);
      onUserCreated();
      handleClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Gagal membuat admin");
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
        className={`w-full max-w-md rounded-lg bg-white p-6 shadow-xl transition-all duration-300 ease-in-out dark:bg-[#122031] ${
          showAnimation ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-center text-xl font-bold text-gray-900 dark:text-white">
          Tambah Admin
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Nama <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Masukkan nama admin"
              required
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setName(e.target.value)
              }
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              placeholder="Masukkan email admin"
              required
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              placeholder="Masukkan password (Minimal 8 karakter)"
              required
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)
              }
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="rounded bg-gray-200 px-4 py-2 text-sm hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Menambahkan..." : "Tambah Admin"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
