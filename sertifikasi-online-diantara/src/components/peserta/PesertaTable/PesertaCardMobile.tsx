// src/components/peserta/PesertaTable/PesertaCardMobile.tsx
import { Peserta } from '../type';
import { ArrowPathIcon, EyeIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

interface PesertaCardMobileProps {
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

export default function PesertaCardMobile({
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
}: PesertaCardMobileProps) {
  const rid = peserta.id ?? peserta.email ?? JSON.stringify(peserta);
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
    <div className="flex flex-col justify-between gap-3 rounded-lg border bg-white p-4 shadow-sm dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-start justify-between">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
        </label>
        <div className="text-xs text-gray-500 dark:text-gray-300">#{index}</div>
      </div>
      <div>
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-900 dark:text-white">{peserta.name}</div>
          <div className="text-xs text-gray-500 dark:text-gray-300">#{index}</div>
        </div>
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-300">{peserta.email}</div>
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-300">
          {peserta.no_hp} • {peserta.asal_institusi}
        </div>
        <div className="mt-2 text-xs font-mono text-gray-700 dark:text-gray-200">
          No: {getCertificateNumber(peserta) || '-'}
        </div>
        <div className="mt-2 flex items-center gap-2">
          {peserta.email_status === 'terkirim' ? (
            <div className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
              Terkirim
            </div>
          ) : (
            <div className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-200">
              Pending
            </div>
          )}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={onSendEmail}
            className={`inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs ${
              isSending ? 'opacity-80 cursor-wait' : 'hover:shadow-sm'
            }`}
            title={isSending ? 'Mengirim...' : peserta.email_status === 'terkirim' ? 'Kirim ulang email' : 'Kirim email'}
          >
            {isSending ? (
              <svg className="h-4 w-4 animate-spin text-gray-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
              </svg>
            ) : (
              <ArrowPathIcon className="h-4 w-4" />
            )}
            <span>{peserta.email_status === 'terkirim' ? 'Kirim ulang' : 'Kirim'}</span>
          </button>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
        <button
          onClick={onPreview}
          className={`inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs ${
            getCertificateNumber(peserta)
              ? 'text-blue-600 border-blue-200'
              : 'text-gray-400 border-gray-200 cursor-not-allowed'
          }`}
          disabled={!getCertificateNumber(peserta)}
          title={getCertificateNumber(peserta) ? 'Preview' : 'Generate nomor sertifikat terlebih dahulu'}
        >
          <EyeIcon className="h-4 w-4" />
          <span>Preview</span>
        </button>
        <button
          onClick={onEdit}
          className={`inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs ${
            peserta.email_status === 'terkirim' || peserta.certificate_sent
              ? 'text-gray-400 border-gray-200 cursor-not-allowed'
              : 'text-emerald-600 border-emerald-200'
          }`}
          disabled={peserta.email_status === 'terkirim' || peserta.certificate_sent}
          title={
            peserta.email_status === 'terkirim' || peserta.certificate_sent
              ? 'Tidak dapat mengedit peserta yang sudah terkirim sertifikat'
              : 'Edit'
          }
        >
          <PencilSquareIcon className="h-4 w-4" />
          <span>Edit</span>
        </button>
        <button
          onClick={onDelete}
          className={`inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs ${
            certificatesGenerated ? 'text-gray-400 border-gray-200 cursor-not-allowed' : 'text-red-600 border-red-200'
          }`}
          disabled={certificatesGenerated}
          title={
            certificatesGenerated
              ? 'Tidak dapat menghapus setelah nomor sertifikat digenerate'
              : 'Hapus'
          }
        >
          <TrashIcon className="h-4 w-4" />
          <span>Hapus</span>
        </button>
      </div>
    </div>
  );
}