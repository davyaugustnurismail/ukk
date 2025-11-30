// src/components/peserta/PesertaTable/index.tsx
import { Peserta } from '../type';
import PesertaRow from './PesertaRow';
import PesertaCardMobile from './PesertaCardMobile';

interface PesertaTableProps {
  loading: boolean;
  peserta: Peserta[];
  filteredPeserta: Peserta[];
  visiblePeserta: Peserta[];
  currentPage: number;
  itemsPerPage: number;
  isSelected: (id: string | number) => boolean;
  toggleSelect: (id: string | number) => void;
  toggleSelectAll: () => void;
  sendingIds: (string | number)[];
  certificatesGenerated: boolean;
  userId: number | null;
  instruktur: string | null;
  activityId: string;
  onSendEmail: (p: Peserta) => void;
  onEdit: (p: Peserta) => void;
  onDelete: (p: Peserta) => void;
}

export default function PesertaTable({
  loading,
  peserta,
  filteredPeserta,
  visiblePeserta,
  currentPage,
  itemsPerPage,
  isSelected,
  toggleSelect,
  toggleSelectAll,
  sendingIds,
  certificatesGenerated,
  userId,
  instruktur,
  activityId,
  onSendEmail,
  onEdit,
  onDelete,
}: PesertaTableProps) {
  const getRowId = (p: Peserta) => p.id ?? p.email ?? JSON.stringify(p);

  return (
    <>
      {/* Mobile */}
      <div className="md:hidden grid gap-4 px-2">
        {loading ? (
          <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-300">Memuat data...</div>
        ) : peserta.length === 0 ? (
          <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-300">Tidak ada users.</div>
        ) : visiblePeserta.length === 0 ? (
          <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-300">Tidak ada users sesuai filter.</div>
        ) : (
          visiblePeserta.map((p, idx) => {
            const rid = getRowId(p);
            const index = (currentPage - 1) * (itemsPerPage === -1 ? filteredPeserta.length : itemsPerPage) + idx + 1;
            return (
              <PesertaCardMobile
                key={rid}
                peserta={p}
                index={index}
                isSelected={isSelected(rid)}
                onToggleSelect={() => toggleSelect(rid)}
                onSendEmail={() => onSendEmail(p)}
                onPreview={() => {
                  if (!userId) return;
                  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/sertifikat-templates/preview-by-user/${p.id}?data_activity_id=${activityId}`;
                  window.open(url, '_blank', 'noopener,noreferrer');
                }}
                onEdit={() => onEdit(p)}
                onDelete={() => onDelete(p)}
                isSending={sendingIds.includes(rid)}
                certificatesGenerated={certificatesGenerated}
                hasTemplate={!!userId}
              />
            );
          })
        )}
      </div>

      {/* Desktop */}
      <div className="hidden md:block overflow-x-auto px-2">
        <table className="min-w-full divide-y divide-gray-200 whitespace-nowrap dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900/30">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={peserta.length > 0 && peserta.map(getRowId).every((id) => isSelected(id))}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">
                No
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">
                Nama
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">
                Telepon
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">
                Asal Institusi
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">
                Email
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">
                No. Sertifikat
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">
                Status
              </th>
              <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800/50">
            {loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-gray-500 dark:text-gray-300">
                  Memuat data...
                </td>
              </tr>
            ) : peserta.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-gray-500 dark:text-gray-300">
                  Tidak ada users.
                </td>
              </tr>
            ) : visiblePeserta.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-gray-500 dark:text-gray-300">
                  Tidak ada users sesuai filter.
                </td>
              </tr>
            ) : (
              visiblePeserta.map((p, idx) => {
                const rid = getRowId(p);
                const index = (currentPage - 1) * (itemsPerPage === -1 ? filteredPeserta.length : itemsPerPage) + idx + 1;
                return (
                  <PesertaRow
                    key={rid}
                    peserta={p}
                    index={index}
                    isSelected={isSelected(rid)}
                    onToggleSelect={() => toggleSelect(rid)}
                    onSendEmail={() => onSendEmail(p)}
                    onPreview={() => {
                      if (!userId) return;
                      const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/sertifikat-templates/preview-by-user/${p.id}?data_activity_id=${activityId}`;
                      window.open(url, '_blank', 'noopener,noreferrer');
                    }}
                    onEdit={() => onEdit(p)}
                    onDelete={() => onDelete(p)}
                    isSending={sendingIds.includes(rid)}
                    certificatesGenerated={certificatesGenerated}
                    hasTemplate={!!userId}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}