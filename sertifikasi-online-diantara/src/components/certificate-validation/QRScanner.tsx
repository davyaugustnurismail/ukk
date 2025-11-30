import { X } from 'lucide-react';
import { RefObject } from 'react';

// Accept nullable refs because useRef<HTMLVideoElement>(null) returns a ref
// whose current can be HTMLVideoElement | null
type QRScannerProps = {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  onCancel: () => void;
};

export const QRScanner = ({ videoRef, canvasRef, onCancel }: QRScannerProps) => {
  return (
    <div className="text-center space-y-6">
      <div className="relative mx-auto w-full max-w-sm aspect-square bg-black rounded-2xl overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />
        
        {/* Scanning overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="w-48 h-48 border-4 border-green-400 rounded-xl relative">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-xl"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-xl"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-xl"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-xl"></div>
              <div className="absolute top-0 left-0 right-0 h-1 bg-green-400 animate-pulse shadow-lg shadow-green-400/50"></div>
            </div>
          </div>
        </div>
        
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/50 rounded-full px-3 py-1">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-white text-xs">LIVE</span>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
      
      <div>
        <h3 className="text-lg font-bold text-green-900 mb-2">Scanning QR Code...</h3>
        <p className="text-green-700 text-sm mb-4">Arahkan kamera ke QR code pada sertifikat Anda</p>
        
        <div className="bg-green-50 rounded-xl p-3 mb-4 text-left">
          <p className="text-xs text-green-700 font-medium mb-1">Tips Scanning:</p>
          <ul className="text-xs text-green-600 space-y-1">
            <li>• Pastikan QR code berada dalam frame hijau</li>
            <li>• Jaga jarak 10-30 cm dari kamera</li>
            <li>• Pastikan pencahayaan cukup terang</li>
          </ul>
        </div>
      </div>
      
      <button
        onClick={onCancel}
        className="w-full rounded-xl border-2 border-red-200 bg-white py-3 font-semibold text-red-600 transition-all duration-300 hover:bg-red-50 hover:border-red-300"
      >
        <span className="flex items-center justify-center gap-2">
          <X className="h-4 w-4" />
          Batalkan Scan
        </span>
      </button>
    </div>
  );
};