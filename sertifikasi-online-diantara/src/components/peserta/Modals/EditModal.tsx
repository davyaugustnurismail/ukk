// src/components/peserta/Modals/EditModal.tsx
import { useState, useEffect } from 'react';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  peserta: any | null;
  // onSubmit accepts either a FormEvent (legacy) or the edited data object
  onSubmit: (eOrData: React.FormEvent | any) => void;
  error: string | null;
}

export default function EditModal({ isOpen, onClose, peserta, onSubmit, error }: EditModalProps) {
  const [editData, setEditData] = useState({
    name: '',
    email: '',
    no_hp: '',
    asal_institusi: '',
  });

  useEffect(() => {
    if (isOpen && peserta) {
      setEditData({
        name: peserta.name || '',
        email: peserta.email || '',
        no_hp: peserta.no_hp || '',
        asal_institusi: peserta.asal_institusi || '',
      });
    }
  }, [isOpen, peserta]);

  if (!isOpen || !peserta) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-[#122031]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-center text-xl font-bold text-gray-900 dark:text-white">Edit Users</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            // send edited data object to parent handler
            onSubmit(editData);
          }}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Nama <span className="text-red-500">*</span>
            </label>
            <input
              required
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="Nama"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="email"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="Email"
              value={editData.email}
              onChange={(e) => setEditData({ ...editData, email: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Telepon <span className="text-red-500">*</span>
            </label>
            <input
              required
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="Telepon"
              value={editData.no_hp}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D+/g, '');
                setEditData({ ...editData, no_hp: digits });
              }}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Asal Institusi <span className="text-red-500">*</span>
            </label>
            <input
              required
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="Asal Institusi"
              value={editData.asal_institusi}
              onChange={(e) => setEditData({ ...editData, asal_institusi: e.target.value })}
            />
          </div>
          {error && <div className="text-center text-sm text-red-600">{error}</div>}
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded bg-gray-200 px-4 py-2 text-sm dark:bg-gray-700 dark:text-white"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded bg-primary px-4 py-2 text-sm text-white"
              disabled={!editData.name || !editData.email || !editData.no_hp || !editData.asal_institusi}
            >
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}