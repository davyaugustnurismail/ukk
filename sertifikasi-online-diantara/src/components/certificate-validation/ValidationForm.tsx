import { Search, Zap, ArrowRight, QrCode, Camera, Smartphone } from 'lucide-react';

type ValidationFormProps = {
  certificateNumber: string;
  setCertificateNumber: (value: string) => void;
  isValidating: boolean;
  onValidate: () => void;
  onStartQRScan?: () => void;
  isMobile?: boolean;
};

export const ValidationForm = ({
  certificateNumber,
  setCertificateNumber,
  isValidating,
  onValidate,
  onStartQRScan,
  isMobile
}: ValidationFormProps) => {
  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="certificateNumber" className="block mb-3 text-sm font-semibold text-green-900">
          Nomor Sertifikat
        </label>
        <div className="relative">
          <input
            id="certificateNumber"
            type="text"
            value={certificateNumber}
            onChange={(e) => setCertificateNumber(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && certificateNumber.trim()) {
                onValidate();
              }
            }}
            placeholder="CERT/XX/YYYY/MM/001"
            className="w-full rounded-xl border-2 px-4 py-3 lg:py-4 text-green-900 placeholder-green-400 transition-all duration-300 bg-green-50 focus:outline-none focus:border-green-400 focus:shadow-lg focus:shadow-green-200/30 focus:bg-white border-green-200 hover:border-green-300"
            disabled={isValidating}
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-300" />
        </div>
      </div>
      
      <button
        onClick={onValidate}
        disabled={isValidating || !certificateNumber.trim()}
        className="w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 py-3 lg:py-4 font-semibold text-white transition-all duration-300 hover:from-green-600 hover:to-emerald-600 hover:shadow-lg hover:shadow-green-200/50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isValidating ? (
          <span className="flex items-center justify-center gap-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
            Memvalidasi...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Zap className="h-5 w-5" />
            Validasi Sekarang
            <ArrowRight className="h-4 w-4" />
          </span>
        )}
      </button>

      {isMobile && onStartQRScan && (
        <>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-green-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-3 text-green-600">atau</span>
            </div>
          </div>
          
          <button
            onClick={onStartQRScan}
            disabled={isValidating}
            className="w-full rounded-xl border-2 border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 py-3 lg:py-4 font-semibold text-green-700 transition-all duration-300 hover:from-green-100 hover:to-emerald-100 hover:border-green-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="flex items-center justify-center gap-2">
              <QrCode className="h-5 w-5" />
              <Camera className="h-4 w-4" />
              Scan QR Code
            </span>
          </button>
          
          <p className="text-xs text-green-600 text-center mt-2 flex items-center justify-center gap-1">
            <Smartphone className="h-3 w-3" />
            Browser akan meminta izin akses kamera
          </p>
        </>
      )}
    </div>
  );
};