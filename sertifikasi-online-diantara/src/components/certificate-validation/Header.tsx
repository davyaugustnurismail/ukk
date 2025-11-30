import { Award, Shield, LogIn } from 'lucide-react';

type HeaderProps = {
  isLoggedIn: boolean;
  onLogin: () => void;
};

export const Header = ({ isLoggedIn, onLogin }: HeaderProps) => {
  return (
    <header className="relative z-10 p-4 lg:p-6">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Award className="h-8 w-8 text-green-600" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
          </div>
          <span className="text-xl font-bold text-green-900">PT. DiAntara Intermedia</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-sm text-green-700">
            <Shield className="h-4 w-4" />
            <span>Secure & Trusted</span>
          </div>
          
          <button
            onClick={onLogin}
            className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg shadow-md hover:from-green-600 hover:to-emerald-600 hover:shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            <LogIn className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            <span className="hidden sm:inline">
              {isLoggedIn ? 'Kembali ke Dashboard' : 'Login'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};