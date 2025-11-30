// src/components/peserta/PesertaTable/PesertaRow.tsx
import { Peserta } from '../type';
import { ArrowPathIcon, EyeIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

interface PesertaRowProps {
  peserta: Peserta;
  index: number;
  isSelected: boolean;
  onToggleSelect: () => void;
  onSendEmail: () => void;
  onPreview: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isSending: boolean;
  certificatesGenerated: boolean;
  hasTemplate: boolean;
}

export default function PesertaRow({
  peserta,
  index,
  isSelected,
  onToggleSelect,
  onSendEmail,
  onPreview,
  onEdit,
  onDelete,
  isSending,
  certificatesGenerated,
  hasTemplate,
}: PesertaRowProps) {
  const getCertificateNumber = (p: any) => {
    return (
      p.certificate_number ||
      p.nomor_sertifikat ||
      p.cert_no ||
      p.nomorSertifikat ||
      p.nomor ||
      ''
    );
  };
  return (
    <tr>
      <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
      </td>
      <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">{index}</td>
      <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">{peserta.name}</td>
      <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">{peserta.no_hp}</td>
      <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">{peserta.asal_institusi}</td>
      <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">{peserta.email}</td>
      <td className="px-4 py-2 text-sm font-mono text-gray-700 dark:text-gray-200">
        {getCertificateNumber(peserta) || '-'}
      </td>
      <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
        {peserta.email_status === 'terkirim' ? (
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
          onClick={onPreview}
          className={getCertificateNumber(peserta) ? 'rounded-md p-2 text-gray-500 hover:text-blue-600' : 'cursor-not-allowed rounded-md p-2 text-gray-400'}
          title={getCertificateNumber(peserta) ? 'Preview' : 'Generate nomor sertifikat terlebih dahulu'}
          disabled={!getCertificateNumber(peserta)}
        >
          <EyeIcon className="h-5 w-5" />
        </button>
        <button
          onClick={onSendEmail}
          className={`rounded-md p-2 ${isSending ? 'opacity-80 cursor-wait' : 'text-indigo-600 hover:text-indigo-800'}`}
          title={isSending ? 'Mengirim...' : peserta.email_status === 'terkirim' ? 'Kirim ulang email' : 'Kirim email'}
        >
          {isSending ? (
            <svg className="h-5 w-5 animate-spin text-gray-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
            </svg>
          ) : (
            <ArrowPathIcon className="h-5 w-5" />
          )}
        </button>
        <button
          onClick={onEdit}
          className={`rounded-md p-2 ${
            peserta.email_status === 'terkirim' || peserta.certificate_sent
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-emerald-600 hover:text-emerald-800'
          }`}
          disabled={peserta.email_status === 'terkirim' || peserta.certificate_sent}
          title={
            peserta.email_status === 'terkirim' || peserta.certificate_sent
              ? 'Tidak dapat mengedit peserta yang sudah terkirim sertifikat'
              : 'Edit'
          }
        >
          <PencilSquareIcon className="h-5 w-5" />
        </button>
        <button
          onClick={onDelete}
          className={
            certificatesGenerated
              ? 'cursor-not-allowed rounded-md p-2 text-gray-300'
              : 'rounded-md p-2 text-gray-500 hover:text-red-600'
          }
          title={
            certificatesGenerated
              ? 'Tidak dapat menghapus setelah nomor sertifikat digenerate'
              : 'Hapus'
          }
          disabled={certificatesGenerated}
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </td>
    </tr>
  );
}