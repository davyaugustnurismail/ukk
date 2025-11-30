import React from "react";
import { PencilSquareIcon, TrashIcon, EyeIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

interface PesertaTableProps {
  loading: boolean;
  peserta: any[];
  filteredPeserta: any[];
  visiblePeserta: any[];
  currentPage: number;
  itemsPerPage: number;
  isSelected: (id: string | number) => boolean;
  toggleSelect: (id: string | number) => void;
  toggleSelectAll: () => void;
  sendingIds: Array<string | number>;
  certificatesGenerated: boolean;
  userId: number | null;
  instruktur: string | null;
  activityId: string;
  onSendEmail: (peserta: any) => void;
  onEdit: (peserta: any) => void;
  onDelete: (peserta: any) => void;
  memberRole?: 'peserta' | 'panitia' | 'narasumber';
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
  memberRole = 'peserta',
}: PesertaTableProps) {
  const getRowId = (p: any) => p.id ?? p.email ?? JSON.stringify(p);

  const handlePreview = (p: any) => {
    if (!userId) {
      alert('Template belum dipilih.');
      return;
    }
    const certNum = p.certificate_number || '';
    const date = p.tanggal_sertifikat || new Date().toISOString().slice(0, 10);
    const params = new URLSearchParams({
      recipient_name: p.name || '',
      instruktur_name: instruktur || '',
      instruktur: instruktur || '',
      instructure: instruktur || '',
      certificate_number: certNum,
      date,
      data_activity_id: String(activityId),
    }).toString();
    const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/sertifikat-templates/preview-by-user/${p.id}?${params}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      {/* Mobile View */}
      <div className="md:hidden grid gap-4 px-2">
        {loading ? (
          <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-300">Memuat data...</div>
        ) : peserta.length === 0 ? (
          <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-300">Tidak ada {memberRole}.</div>
        ) : (
          <>
            {visiblePeserta.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-300">Tidak ada {memberRole} sesuai filter.</div>
            ) : (
              visiblePeserta.map((p, idx) => {
                const rid = getRowId(p);
                return (
                  <div key={rid} className="flex flex-col justify-between gap-3 rounded-lg border bg-white p-4 shadow-sm dark:bg-gray-800 dark:border-gray-700">
                    <div className="flex items-start justify-between">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected(rid)}
                          onChange={() => toggleSelect(rid)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </label>
                      <div className="text-xs text-gray-500 dark:text-gray-300">#{(currentPage - 1) * (itemsPerPage === -1 ? filteredPeserta.length : itemsPerPage) + idx + 1}</div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{p.name}</div>
                      </div>
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-300">{p.email}</div>
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-300">{p.no_hp} • {p.asal_institusi}</div>
                      <div className="mt-2 text-xs font-mono text-gray-700 dark:text-gray-200">No: {p.certificate_number || '-'}</div>
                      <div className="mt-2 flex items-center gap-2">
                        {p.email_status === 'terkirim' ? (
                          <div className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">Terkirim</div>
                        ) : (
                          <div className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-200">Pending</div>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          onClick={() => onSendEmail(p)}
                          className={`inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs ${sendingIds.includes(getRowId(p)) ? 'opacity-80 cursor-wait' : 'hover:shadow-sm'}`}
                          title={sendingIds.includes(getRowId(p)) ? 'Mengirim...' : (p.email_status === 'terkirim' ? 'Kirim ulang email' : 'Kirim email ke peserta ini')}
                        >
                          {sendingIds.includes(getRowId(p)) ? (
                            <svg className="h-4 w-4 animate-spin text-gray-600" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"></path></svg>
                          ) : (
                            <ArrowPathIcon className="h-4 w-4" />
                          )}
                          <span>{p.email_status === 'terkirim' ? 'Kirim ulang' : 'Kirim'}</span>
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
                      <button
                        onClick={() => handlePreview(p)}
                        className={`inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs ${p.certificate_number ? 'text-blue-600 border-blue-200' : 'text-gray-400 border-gray-200 cursor-not-allowed'}`}
                        disabled={!p.certificate_number}
                        title={p.certificate_number ? 'Preview' : 'Generate nomor sertifikat terlebih dahulu'}
                      >
                        <EyeIcon className="h-4 w-4" />
                        <span>Preview</span>
                      </button>
                      <button
                        onClick={() => onEdit(p)}
                        className={`inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs ${p.email_status === 'terkirim' || p.certificate_sent ? 'text-gray-400 border-gray-200 cursor-not-allowed' : 'text-emerald-600 border-emerald-200'}`}
                        disabled={p.email_status === 'terkirim' || p.certificate_sent}
                        title={p.email_status === 'terkirim' || p.certificate_sent ? 'Tidak dapat mengedit peserta yang sudah terkirim sertifikat' : 'Edit'}
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => onDelete(p)}
                        className={`inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs ${certificatesGenerated ? 'text-gray-400 border-gray-200 cursor-not-allowed' : 'text-red-600 border-red-200'}`}
                        disabled={certificatesGenerated}
                        title={certificatesGenerated ? 'Tidak dapat menghapus setelah nomor sertifikat digenerate' : 'Hapus'}
                      >
                        <TrashIcon className="h-4 w-4" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto px-2">
        <table className="min-w-full divide-y divide-gray-200 whitespace-nowrap dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900/30">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={peserta.length > 0 && peserta.every((p) => isSelected(getRowId(p)))}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">No</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">Nama</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">Telepon</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">Asal Institusi</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">Email</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">No. Sertifikat</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">Status</th>
              <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800/50">
            {loading ? (
              <tr><td colSpan={9} className="px-4 py-6 text-center text-gray-500 dark:text-gray-300">Memuat data...</td></tr>
            ) : peserta.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-6 text-center text-gray-500 dark:text-gray-300">Tidak ada {memberRole}.</td></tr>
            ) : (
              <>
                {visiblePeserta.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-6 text-center text-gray-500 dark:text-gray-300">Tidak ada {memberRole} sesuai filter.</td></tr>
                ) : (
                  visiblePeserta.map((p, idx) => {
                    const rid = getRowId(p);
                    return (
                      <tr key={rid}>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                          <input 
                            type="checkbox" 
                            checked={isSelected(rid)} 
                            onChange={() => toggleSelect(rid)} 
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" 
                          />
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                          {(currentPage - 1) * (itemsPerPage === -1 ? filteredPeserta.length : itemsPerPage) + idx + 1}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">{p.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">{p.no_hp}</td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">{p.asal_institusi}</td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">{p.email}</td>
                        <td className="px-4 py-2 text-sm font-mono text-gray-700 dark:text-gray-200">{p.certificate_number || "-"}</td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                          {p.email_status === 'terkirim' ? (
                            <div className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                              Terkirim
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-200">
                              Pending
                            </div>
                          )}
                        </td>
                        <td className="space-x-2 px-4 py-2 text-center text-sm">
                          <button
                            onClick={() => handlePreview(p)}
                            className={p.certificate_number ? "rounded-md p-2 text-gray-500 hover:text-blue-600" : "cursor-not-allowed rounded-md p-2 text-gray-400"}
                            title={p.certificate_number ? "Preview" : "Generate nomor sertifikat terlebih dahulu"}
                            disabled={!p.certificate_number}
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => onSendEmail(p)}
                            className={`rounded-md p-2 ${sendingIds.includes(getRowId(p)) ? 'opacity-80 cursor-wait' : 'text-indigo-600 hover:text-indigo-800'}`}
                            title={sendingIds.includes(getRowId(p)) ? 'Mengirim...' : (p.email_status === 'terkirim' ? 'Kirim ulang email' : 'Kirim email ke peserta ini')}
                          >
                            {sendingIds.includes(getRowId(p)) ? (
                              <svg className="h-5 w-5 animate-spin text-gray-600" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"></path>
                              </svg>
                            ) : (
                              <ArrowPathIcon className="h-5 w-5" />
                            )}
                          </button>
                          <button
                            onClick={() => onEdit(p)}
                            className={`rounded-md p-2 ${p.email_status === 'terkirim' || p.certificate_sent ? 'text-gray-300 cursor-not-allowed' : 'text-emerald-600 hover:text-emerald-800'}`}
                            disabled={p.email_status === 'terkirim' || p.certificate_sent}
                            title={p.email_status === 'terkirim' || p.certificate_sent ? 'Tidak dapat mengedit peserta yang sudah terkirim sertifikat' : 'Edit'}
                          >
                            <PencilSquareIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => onDelete(p)}
                            className={certificatesGenerated ? 'cursor-not-allowed rounded-md p-2 text-gray-300' : 'rounded-md p-2 text-gray-500 hover:text-red-600'}
                            title={certificatesGenerated ? 'Tidak dapat menghapus setelah nomor sertifikat digenerate' : 'Hapus'}
                            disabled={certificatesGenerated}
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}