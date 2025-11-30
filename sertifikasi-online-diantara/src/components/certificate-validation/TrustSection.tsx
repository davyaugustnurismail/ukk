import { Shield, Lock, FileCheck } from 'lucide-react';

export const TrustSection = () => {
  return (
    <div className="text-center space-y-4">
      {/* Trust Badges */}
      <div className="flex items-center justify-center gap-4 text-xs text-green-600">
        <TrustBadge icon={Shield} label="Secure" />
        <TrustBadge icon={Lock} label="Encrypted" />
        <TrustBadge icon={FileCheck} label="Verified" />
      </div>
      
      {/* Copyright */}
      <div className="inline-flex items-center gap-2 px-3 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-green-100 text-xs text-green-700">
        <Lock className="h-3 w-3" />
        <span>&copy; 2025 PT DiAntara Intermedia</span>
      </div>
    </div>
  );
};

// Helper component untuk trust badge
const TrustBadge = ({ 
  icon: Icon, 
  label 
}: { 
  icon: React.ElementType; 
  label: string;
}) => (
  <div className="flex items-center gap-1">
    <Icon className="h-3 w-3" />
    <span>{label}</span>
  </div>
);