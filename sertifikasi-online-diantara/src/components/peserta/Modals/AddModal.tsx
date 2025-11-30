// src/components/peserta/Modals/AddModal.tsx
import { useState, useEffect } from 'react';

interface AddModalProps {
  isOpen: boolean;
  onClose: () => void;
  // onSubmit may be called as form submit (event) or with the new data object
  onSubmit: (eOrData: React.FormEvent | any) => void;
  isAdding: boolean;
  error: string | null;
  certificatesGenerated: boolean;
  memberLabel?: string; // optional label to show in title/button (Peserta/Panitia/Narasumber)
}

export default function AddModal({ isOpen, onClose, onSubmit, isAdding, error, certificatesGenerated, memberLabel = 'Peserta' }: AddModalProps) {
  const [newPeserta, setNewPeserta] = useState({
    name: '',
    email: '',
    no_hp: '',
    asal_institusi: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // call parent with data object (older code expected event; parent now accepts both)
    onSubmit(newPeserta);
  };

  useEffect(() => {
    if (isOpen) {
      setNewPeserta({ name: '', email: '', no_hp: '', asal_institusi: '' });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl rounded-lg bg-white shadow-xl dark:bg-[#122031] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-6 pb-3 pt-5 dark:border-gray-700 dark:bg-[#122031]">
          <h2 className="text-center text-xl font-semibold text-gray-900 dark:text-white">Tambah {memberLabel}</h2>
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nama <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="Nama"
              value={newPeserta.name}
              onChange={(e) => setNewPeserta({ ...newPeserta, name: e.target.value })}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="Email"
              value={newPeserta.email}
              onChange={(e) => setNewPeserta({ ...newPeserta, email: e.target.value })}
              required
            />
          </div>
          <div className="sm:col-span-1">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Telepon <span className="text-red-500">*</span>
            </label>
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="Telepon"
              value={newPeserta.no_hp}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D+/g, '');
                setNewPeserta({ ...newPeserta, no_hp: digits });
              }}
              required
            />
          </div>
          <div className="sm:col-span-1">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Asal Institusi <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="Asal Institusi"
              value={newPeserta.asal_institusi}
              onChange={(e) => setNewPeserta({ ...newPeserta, asal_institusi: e.target.value })}
              required
            />
          </div>
          {error && <div className="text-center text-sm text-red-600 sm:col-span-2">{error}</div>}
          <div className="flex justify-end gap-3 pt-2 sm:col-span-2">
            <button type="button" onClick={onClose} className="rounded bg-gray-200 px-4 py-2 text-sm hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600">
              Batal
            </button>
            <button
              type="submit"
              className="rounded bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90"
              disabled={isAdding || certificatesGenerated}
            >
              {isAdding ? `Menambah ${memberLabel}...` : `Tambah ${memberLabel}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}