// src/components/peserta/Controls/PesertaHeader.tsx
import { StatusFilter } from '../type';

interface PesertaHeaderProps {
  totalPeserta: number;
  totalAllRoles?: number;
  currentRole?: 'Peserta' | 'Panitia' | 'Narasumber';
  hasPesertaSelected?: boolean;
  loading: boolean;
  certificatesGenerated: boolean;
  selectedIds: (string | number)[];
  onAddImportClick: () => void;
  onBulkDeleteClick: () => void;
  onBulkEmailClick: () => void;
  onGenerateClick: () => void;
  isGenerating: boolean;
  statusFilter: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;
  // Select all across all roles (peserta + panitia + narasumber)
  onSelectAllEverything?: () => void;
}

export default function PesertaHeader({
  totalPeserta,
  totalAllRoles,
  currentRole = 'Peserta',
  hasPesertaSelected = false,
  loading,
  certificatesGenerated,
  selectedIds,
  onAddImportClick,
  onBulkDeleteClick,
  onBulkEmailClick,
  onGenerateClick,
  isGenerating,
  statusFilter,
  onStatusChange,
  onSelectAllEverything,
}: PesertaHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 border-b border-gray-200 pb-6 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col md:flex-row md:items-center md:gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Daftar Users</h1>
        <span className="mt-1 text-base font-medium text-gray-600 dark:text-gray-300 md:mt-0 md:ml-4">
          Total: {loading ? '-' : totalPeserta}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-4 justify-end">
        <div className="flex items-center gap-3">
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:bg-gray-700 dark:text-white focus:ring-1 focus:ring-primary"
            >
              <option value="all">Semua</option>
              <option value="pending">Pending</option>
              <option value="terkirim">Terkirim</option>
            </select>
          </div>
          {selectedIds.length > 0 && (
            <div className="rounded-md bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">
              {currentRole === 'Peserta' 
                ? `${selectedIds.length} dipilih dari ${totalPeserta} Peserta`
                : `${selectedIds.length} dipilih dari ${totalAllRoles || totalPeserta} total`
              }
            </div>
          )}
        </div>
        <button
          type="button"
          className={`inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all ${
            certificatesGenerated ? 'opacity-60 hover:opacity-60' : 'hover:bg-primary-dark active:translate-y-[1px]'
          }`}
          onClick={onAddImportClick}
          // Intentionally not using the `disabled` attribute so the handler can show a notification
          title={
            certificatesGenerated
              ? 'Tidak dapat menambah atau mengimport setelah nomor sertifikat digenerate'
              : 'Tambah / Import Users'
          }
          aria-disabled={certificatesGenerated}
        >
          Tambah / Import Users
        </button>
        <button
            type="button"
            onClick={() => onSelectAllEverything && onSelectAllEverything()}
            className="inline-flex items-center rounded border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            title="Pilih semua peserta termasuk Panitia & Narasumber"
          >
            Pilih Semua
          </button>
        <button
          type="button"
          onClick={onBulkDeleteClick}
          disabled={selectedIds.length === 0 || certificatesGenerated}
          className={`inline-flex items-center rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow ${
            selectedIds.length === 0 || certificatesGenerated ? 'opacity-60 cursor-not-allowed' : 'hover:bg-red-700'
          }`}
        >
          Hapus Terpilih
        </button>
        <button
          type="button"
          onClick={onBulkEmailClick}
          disabled={selectedIds.length === 0}
          className={`inline-flex items-center rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow ${
            selectedIds.length === 0 ? 'opacity-60 cursor-not-allowed' : 'hover:bg-blue-700'
          }`}
          title={
            selectedIds.length === 0 
              ? "Pilih penerima email terlebih dahulu"
              : `Kirim email ke ${currentRole === 'Peserta' ? 'Peserta' : currentRole === 'Panitia' ? 'Panitia' : 'Narasumber'} terpilih`
          }
        >
          Kirim Email
        </button>
        <button
          type="button"
          onClick={onGenerateClick}
          disabled={isGenerating || certificatesGenerated}
          className={`inline-flex items-center rounded px-4 py-2 text-sm font-semibold text-white shadow ${
            certificatesGenerated ? 'cursor-not-allowed bg-gray-400' : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {isGenerating
            ? 'Menggenerate...'
            : certificatesGenerated
            ? 'Nomor Sertifikat Sudah Digenerate'
            : 'Generate Nomor Sertifikat'}
        </button>
      </div>
    </div>
  );
}