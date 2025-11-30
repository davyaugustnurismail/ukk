import { CheckCircle } from 'lucide-react';
import React from 'react';

type ValidationResultData = {
  activity_name: string;
  date: string;
  certificate_number: string;
  recipient_name: string;
  instruktur_name?: string;
  member_type?: string;
  location?: string;
};

type ValidationResultProps = {
  result: ValidationResultData;
  onReset: () => void;
};

export const ValidationResult = ({ result, onReset }: ValidationResultProps) => {
  return (
    <div className="text-center">
      <div className="mb-6 inline-block p-4 bg-green-50 rounded-full">
        <CheckCircle className="h-10 w-10 text-green-500" />
      </div>
      
      <h2 className="text-xl lg:text-2xl font-bold text-green-900 mb-3">
        Sertifikat Valid ✓
      </h2>
      <p className="text-green-700 mb-6">
        Sertifikat telah terverifikasi dan sah
      </p>
      
      {/* Certificate Details */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 lg:p-6 mb-6 text-left space-y-3">
        <DetailRow label="Nama Penerima" value={result.recipient_name} />
        
        {result.member_type && (
          <DetailRow label="Tipe Anggota" value={result.member_type} />
        )}
        
        <DetailRow label="Kegiatan" value={result.activity_name} />
        
        {result.location && (
          <DetailRow 
            label="Lokasi" 
            value={
              result.location.toLowerCase().startsWith('http') || 
              result.location.toLowerCase().includes('zoom.us') ? (
                <a
                  href={result.location.startsWith('http') ? 
                    result.location : 
                    `https://${result.location}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 hover:underline"
                >
                  {result.location}
                </a>
              ) : result.location
            }
          />
        )}
        
        <DetailRow label="Tanggal" value={result.date} />
        
        <div className="flex justify-between items-center py-2 border-b border-green-200/50">
          <span className="font-medium text-green-800 text-sm">Nomor</span>
          <span className="text-green-900 font-mono font-bold bg-green-100 px-2 py-1 rounded text-xs">
            {result.certificate_number}
          </span>
        </div>
        
        {result.instruktur_name && (
          <DetailRow label="Instruktur" value={result.instruktur_name} isLast />
        )}
      </div>
      
      <button
        onClick={onReset}
        className="w-full rounded-xl border-2 border-green-200 bg-white py-3 font-semibold text-green-700 transition-all duration-300 hover:bg-green-50 hover:border-green-300"
      >
        Validasi Sertifikat Lain
      </button>
    </div>
  );
};

// Helper component untuk detail row
const DetailRow = ({ 
  label, 
  value, 
  isLast = false 
}: { 
  label: string; 
  value: string | React.ReactNode; 
  isLast?: boolean;
}) => (
  <div className={`flex justify-between items-start py-2 ${!isLast ? 'border-b border-green-200/50' : ''}`}>
    <span className="font-medium text-green-800 text-sm shrink-0">{label}</span>
    <span className="text-green-900 font-semibold text-sm text-right break-words break-all pl-4" style={{ maxWidth: 'calc(100% - 120px)' }}>
      {value}
    </span>
  </div>
);