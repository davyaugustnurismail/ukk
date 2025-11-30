import { X } from 'lucide-react';

type ConflictBannerProps = {
  conflictRole: string;
  onDismiss: () => void;
};

export const ConflictBanner = ({ conflictRole, onDismiss }: ConflictBannerProps) => {
  return (
    <div className="max-w-4xl mx-auto mt-4 px-4">
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-4 shadow-md">
        <div className="flex-shrink-0 mt-1">
          <svg className="h-6 w-6 text-amber-500" viewBox="0 0 24 24" fill="none">
            <path d="M12 9v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M12 17h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-amber-800">
                Sesi {conflictRole === 'admin' ? 'Admin' : 'Instruktur'} Aktif
              </h3>
              <p className="text-xs text-amber-700 mt-1">
                Kami mendeteksi Anda masih masuk sebagai <span className="font-medium">{conflictRole}</span>. 
                Untuk mengakses Dashboard Peserta, harap logout dari sesi {conflictRole} terlebih dahulu.
              </p>
            </div>
            <button
              onClick={onDismiss}
              className="h-8 w-8 rounded-full bg-white border border-amber-200 text-amber-600 hover:bg-amber-50"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4 mx-auto" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};