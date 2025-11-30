import { useEffect } from 'react';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';

/**
 * Hook untuk menampilkan notif akses ditolak dari middleware
 * Membaca cookie 'access_denied_message' dan menampilkan toast
 */
export function useAccessDeniedNotif() {
  useEffect(() => {
    const message = Cookies.get('access_denied_message');
    if (message) {
      toast.error(message, {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      // Remove cookie after showing
      Cookies.remove('access_denied_message');
    }
  }, []);
}
