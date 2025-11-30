import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [conflictRole, setConflictRole] = useState<string | null>(null);
  const router = useRouter();

  const detectStoredRole = (): string => {
    // ... (logic yang sama dari page.tsx)
    return 'unknown';
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = detectStoredRole();
      setIsLoggedIn(role === 'peserta');
      setConflictRole(role === 'admin' || role === 'instruktur' ? role : null);
    }
  }, []);

  const handleLogin = () => {
    const role = detectStoredRole();
    if (role === 'peserta') {
      router.push('/peserta/dashboard');
      return;
    }
    if (role === 'admin' || role === 'instruktur') {
      alert('Anda masih masuk sebagai ' + role.toUpperCase());
      return;
    }
    router.push('/auth/peserta/signin');
  };

  return { isLoggedIn, conflictRole, handleLogin, setConflictRole };
};