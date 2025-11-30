// src/components/peserta/Modals/GenerateFormatModal.tsx
interface GenerateFormatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formatInput: string;
  onFormatChange: (value: string) => void;
  isGenerating: boolean;
}

export default function GenerateFormatModal({
  isOpen,
  onClose,
  onSubmit,
  formatInput,
  onFormatChange,
  isGenerating,
}: GenerateFormatModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-[#122031]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-center text-xl font-bold text-gray-900 dark:text-white">
          Generate Certificate Number
        </h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Format Nomor Sertifikat <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Format Nomor Sertifikat (e.g., CERT/XXX)"
              value={formatInput}
              onChange={(e) => onFormatChange(e.target.value)}
              required
              disabled={isGenerating}
            />
          </div>
          <div className="text-yellow-700 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-200 rounded px-3 py-2 text-xs">
            Setelah nomor sertifikat digenerate, format tidak dapat diubah lagi.
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200"
              onClick={onClose}
              disabled={isGenerating}
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700"
              disabled={isGenerating || !formatInput}
            >
              Generate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}