// src/components/peserta/Controls/PesertaFilters.tsx
interface PesertaFiltersProps {
  pesertaSearch: string;
  onSearchChange: (value: string) => void;
  itemsPerPage: number;
  onItemsPerPageChange: (value: number) => void;
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export default function PesertaFilters({
  pesertaSearch,
  onSearchChange,
  itemsPerPage,
  onItemsPerPageChange,
  totalPages,
  currentPage,
  onPageChange,
}: PesertaFiltersProps) {
  return (
    <div className="px-2">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1">
            <input
              type="search"
              value={pesertaSearch}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari users, email, telepon, institusi, sertifikat..."
              className="w-full rounded-md border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
            {pesertaSearch && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={itemsPerPage}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              onItemsPerPageChange(value);
            }}
            className="h-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all dark:bg-gray-800 dark:border-gray-700"
          >
            <option value={10}>10 per halaman</option>
            <option value={25}>25 per halaman</option>
            <option value={50}>50 per halaman</option>
            <option value={100}>100 per halaman</option>
            <option value={-1}>Semua</option>
          </select>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`rounded-md px-3 py-2 text-sm font-medium border transition-all ${
                  currentPage === 1
                    ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                }`}
              >
                ←
              </button>
              <div className="flex items-center gap-1 px-2">
                <span className="text-sm font-medium text-gray-700">{currentPage}</span>
                <span className="text-gray-400">/</span>
                <span className="text-sm text-gray-600">{totalPages}</span>
              </div>
              <button
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`rounded-md px-3 py-2 text-sm font-medium border transition-all ${
                  currentPage === totalPages
                    ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                }`}
              >
                →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}