// src/components/peserta/Modals/BulkActionModals.tsx
interface BulkActionModalsProps {
  bulkDeleteModal: boolean;
  bulkEmailModal: boolean;
  selectedIds: (string | number)[];
  recipientsCount?: number;
  currentRole?: 'peserta' | 'panitia' | 'narasumber';
  onCloseDelete: () => void;
  onCloseEmail: () => void;
  onConfirmDelete: () => void;
  onConfirmEmail: () => void;
  isDeleting: boolean;
  isGenerating: boolean;
}

export default function BulkActionModals({
  bulkDeleteModal,
  bulkEmailModal,
  selectedIds,
  recipientsCount = 0,
  currentRole = 'peserta',
  onCloseDelete,
  onCloseEmail,
  onConfirmDelete,
  onConfirmEmail,
  isDeleting,
  isGenerating,
}: BulkActionModalsProps) {
  return (
    <>
      {bulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow dark:bg-[#122031]">
            <div className="text-center">
              <svg
                className="mx-auto mb-4 h-12 w-12 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                Apakah Anda yakin ingin menghapus {selectedIds.length} {currentRole ?? 'peserta'} terpilih?
              </h3>
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={onCloseDelete}
                  className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:border-gray-500 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  disabled={isDeleting}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={onConfirmDelete}
                  className="rounded-lg bg-red-600 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-red-700"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {bulkEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow dark:bg-[#122031]">
            <div className="text-center">
              <svg
                className="mx-auto mb-4 h-12 w-12 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 12h2a2 2 0 012 2v6H4v-6a2 2 0 012-2h2m4-8v8"
                />
              </svg>
              <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                Kirim email sertifikat ke {recipientsCount} peserta yang valid?
              </h3>
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={onCloseEmail}
                  className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:border-gray-500 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  disabled={isGenerating}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={onConfirmEmail}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-700"
                  disabled={isGenerating || recipientsCount === 0}
                >
                  {isGenerating ? 'Mengirim...' : 'Ya, Kirim'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}