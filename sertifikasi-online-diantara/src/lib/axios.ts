import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL, // menggunakan .env agar mudah ganti URL
  withCredentials: true, // WAJIB untuk Sanctum cookie-based
});

api.interceptors.request.use((config) => {
  // Ambil token dari localStorage (sumber utama)
  if (typeof window !== "undefined") {
    const lsToken = localStorage.getItem("token"); // pastikan memang PAT Sanctum
    if (lsToken) {
      config.headers = config.headers || {};
      (config.headers as any).Authorization = `Bearer ${lsToken}`;
    } else {
      // fallback: coba dari cookie "token"
      const m = document.cookie.match(/(?:^|; )token=([^;]+)/);
      const cookieToken = m ? decodeURIComponent(m[1]) : null;
      if (cookieToken) {
        config.headers = config.headers || {};
        (config.headers as any).Authorization = `Bearer ${cookieToken}`;
      }
    }
  }
  return config;
});

export default api;
