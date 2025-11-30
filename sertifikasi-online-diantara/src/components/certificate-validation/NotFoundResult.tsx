import { X } from 'lucide-react';

type NotFoundResultProps = {
  onReset: () => void;
};

export const NotFoundResult = ({ onReset }: NotFoundResultProps) => {
  return (
    <div className="text-center">
      <div className="mb-6 inline-block p-4 bg-red-50 rounded-full">
        <X className="h-10 w-10 text-red-500" />
      </div>
      
      <h2 className="text-xl lg:text-2xl font-bold text-red-700 mb-3">
        Sertifikat Tidak Ditemukan
      </h2>
      
      <p className="text-red-600 mb-4">
        Nomor sertifikat tidak terdaftar dalam sistem.
      </p>
      
      {/* Helpful tips */}
      <div className="bg-red-50 rounded-xl p-4 mb-6 text-left">
        <p className="text-sm font-semibold text-red-800 mb-2">Pastikan:</p>
        <ul className="text-sm text-red-700 space-y-1">
          <li>✓ Nomor sertifikat diketik dengan benar</li>
          <li>✓ Tidak ada spasi atau karakter tambahan</li>
          <li>✓ Format sesuai contoh: CERT/XX/YYYY/MM/001</li>
        </ul>
      </div>
      
      <button
        onClick={onReset}
        className="w-full rounded-xl border-2 border-green-200 bg-white py-3 font-semibold text-green-700 transition-all duration-300 hover:bg-green-50 hover:border-green-300"
      >
        Coba Nomor Lain
      </button>
    </div>
  );
};