import { useState, useRef, useCallback, useEffect } from 'react';

export const useQRScanner = (onScanSuccess: (code: string) => void) => {
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [flashVisible, setFlashVisible] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playBeep = useCallback((duration = 120, frequency = 880, type: OscillatorType = 'sine') => {
    // ... (logic yang sama)
  }, []);

  const triggerFlashBlink = useCallback(async (blinkMs = 250) => {
    // ... (logic yang sama)
  }, []);

  const startCamera = async () => {
    // ... (logic yang sama)
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowQRScanner(false);
    setScanning(false);
  }, [stream]);

  const startQRScan = () => {
    if (confirm('Aplikasi akan mengakses kamera untuk scan QR code.')) {
      setShowQRScanner(true);
      startCamera();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // QR Detection loop
  useEffect(() => {
    if (showQRScanner && videoRef.current && scanning) {
      const detect = async () => {
        // ... (logic deteksi QR)
        // Jika berhasil: onScanSuccess(decodedCode)
      };
      const interval = setInterval(detect, 500);
      return () => clearInterval(interval);
    }
  }, [showQRScanner, scanning, onScanSuccess]);

  return {
    showQRScanner,
    scanning,
    videoRef,
    canvasRef,
    flashVisible,
    startQRScan,
    stopCamera,
  };
};