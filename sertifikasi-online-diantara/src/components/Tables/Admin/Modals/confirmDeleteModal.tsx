import Modal from "@/components/ui/modal";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function ConfirmDeleteModal({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal title="Konfirmasi Hapus" onClose={onCancel}>
      <div className="space-y-6 p-2">
        <div className="text-center">
          <div className="mx-auto mb-4 w-fit rounded-full bg-red-100 p-3">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
          </div>
          <p className="text-base font-semibold text-gray-900 dark:text-white">
            Apakah Anda yakin ingin menghapus data ini?
          </p>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Tindakan ini tidak dapat dibatalkan.
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
          >
            Hapus
          </button>
        </div>
      </div>
    </Modal>
  );
}
