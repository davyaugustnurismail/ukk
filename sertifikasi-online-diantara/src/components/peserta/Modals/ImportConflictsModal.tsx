// src/components/peserta/Modals/ImportConflictsModal.tsx
interface ImportConflictsModalProps {
  conflicts: any[] | null;
  onClose: () => void;
}

export default function ImportConflictsModal({ conflicts, onClose }: ImportConflictsModalProps) {
  if (!conflicts || conflicts.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-3xl rounded-lg bg-white p-6 shadow-xl dark:bg-[#122031]">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Konflik Data Import
        </h2>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
          Terdapat baris pada file import yang menyebabkan konflik data. Aturan: jika email sudah ada di
          sistem maka nomor telepon (no_hp) harus cocok dengan yang tersimpan; jika salah satu berbeda,
          baris tersebut ditandai konflik.
        </p>

        <div className="max-h-64 overflow-auto rounded border bg-gray-50 p-2 dark:bg-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-600">
                <th className="px-2 py-1">#</th>
                <th className="px-2 py-1">Email</th>
                <th className="px-2 py-1">No. HP</th>
                <th className="px-2 py-1">Pesan</th>
              </tr>
            </thead>
            <tbody>
              {conflicts.map((c, i) => (
                <tr key={i} className="border-t">
                  <td className="px-2 py-2 align-top text-xs text-gray-700 dark:text-gray-200">
                    {i + 1}
                  </td>
                  <td className="px-2 py-2 align-top text-xs text-gray-700 dark:text-gray-200">
                    {c.email || '-'}
                  </td>
                  <td className="px-2 py-2 align-top text-xs text-gray-700 dark:text-gray-200">
                    {c.no_hp || '-'}
                  </td>
                  <td className="px-2 py-2 align-top text-xs text-red-600 dark:text-red-400">
                    {c.message || 'Conflict detected'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}