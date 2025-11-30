"use client";
import React, { useState, useEffect, CSSProperties, useRef, JSX } from "react";
import api from "@/lib/axios";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  FileDown,
  Loader2,
  X,
  User,
  Hash,
  Calendar,
  Eye,
  Download,
  CheckCircle,
  Clock,
  FileText,
  Maximize2,
  Minimize2,
  Moon,
  Sun,
} from "lucide-react";
import { useParams } from "next/navigation";
// import QRCode from "qrcode.react"; // <-- DIHAPUS, tidak perlu generate di frontend

// --- INTERFACES ---
interface CertificateElement {
  id: string | number;
  type: "text" | "image" | "shape" | "qrcode";
  x: number;
  y: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;

  // Text properties
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: "left" | "center" | "right";
  placeholderType?: "custom" | "name" | "number" | "date" | "instructor";

  // Image properties
  imageUrl?: string;
  src?: string; 
  image_path?: string;
  width?: number;
  height?: number;

  // Shape properties
  shapeType?: string;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  borderRadius?: number;
  opacity?: number;
  style?: {
    fillColor?: string;
    strokeColor?: string;
    color?: string;
    strokeWidth?: number;
    borderRadius?: number;
    opacity?: number;
  };
  zIndex?: number;
  isVisible?: boolean;
}

interface TemplateData {
  id: number;
  name: string;
  background_image: string;
  elements: CertificateElement[];
  is_active: boolean;
  created_at: string;
  merchant_id: number;
}

interface Notification {
  message: string;
  type: "success" | "error";
}

// UKURAN ASLI KANVAS
const ORIGINAL_WIDTH = 842;

// FUNGSI HELPER UNTUK URL LENGKAP
const getFullImageUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;

  // Handle absolute URLs from backend (even if malformed)
  if (url.startsWith("http")) {
    // Temporary fix for malformed URL like "http://localhost:8000certificates/..." (missing slash)
    if (/localhost:8000certificates/.test(url) || /127\.0\.0\.1:8000certificates/.test(url)) {
      return url.replace(/https?:\/\/localhost:8000certificates/, "http://localhost:8000/storage/certificates").replace(/https?:\/\/127\.0\.0\.1:8000certificates/, "http://127.0.0.1:8000/storage/certificates");
    }
    return url;
  }
  
  if (url.startsWith("data:")) return url;

  const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
  const cleanUrl = url.replace(/^\/?storage\//, "");
  
  return `${backendUrl}/storage/${cleanUrl}`;
};

// Helper untuk format tanggal
const getTodayDateString = () => {
  return new Date().toISOString().split("T")[0];
};

// Basic validation for certificate number. Accepts formats like CERT/YYYY/MM/XXX or flexible alnum with digits.
const isValidCertificateNumber = (num: string) => {
  if (!num) return false;
  const trimmed = num.trim();
  const strict = /CERT[-\/]([A-Z]{2})[-\/]\d{4}[-\/]\d{2}[-\/]\d{3}/i;
  if (strict.test(trimmed)) return true;
  if (/[A-Za-z]{2}/.test(trimmed) && /\d/.test(trimmed) && trimmed.length >= 6) return true;
  return false;
};

// Helper untuk render placeholder text
const renderPlaceholderText = (
  element: CertificateElement,
  recipientName: string,
  certificateNumber: string,
  certificateDate: string,
  instruktur: string
) => {
  if (element.type !== "text" || !element.text) return "";

  let displayText = element.text;

  // Replace placeholders with actual values
  if (element.placeholderType === "name" || element.text.includes("{NAMA}")) {
    displayText = displayText.replace(/\{NAMA\}/g, recipientName || "Nama Peserta");
  }
  if (
    element.placeholderType === "number" ||
    element.text.includes("{NOMOR}")
  ) {
    displayText = displayText.replace(/\{NOMOR\}/g, certificateNumber || "CERT-001");
  }
  if (
    element.placeholderType === "date" ||
    element.text.includes("{TANGGAL}")
  ) {
    const formattedDate = new Date(certificateDate).toLocaleDateString(
      "id-ID",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      },
    );
    displayText = displayText.replace(/\{TANGGAL\}/g, formattedDate);
  }
  if (
    element.placeholderType === "instructor" ||
    element.text.includes("{INSTRUKTUR}")
  ) {
    displayText = displayText.replace(/\{INSTRUKTUR\}/g, instruktur || "Instruktur Contoh");
  }

  return displayText;
};

// Fungsi untuk render shape
const renderShape = (element: CertificateElement, scale: number) => {
  if (element.type !== "shape" || !element.shapeType) return null;

  const { shapeType, width = 100, height = 100 } = element;
  const scaledWidth = width * scale;
  const scaledHeight = height * scale;

  let fillColor =
    element.fillColor || element.style?.fillColor || "transparent";
  let strokeColor =
    element.strokeColor ||
    element.style?.strokeColor ||
    element.style?.color ||
    "#000000";
  let strokeWidth = element.strokeWidth || element.style?.strokeWidth || 1;
  let opacity = element.opacity ?? element.style?.opacity ?? 1;
  let borderRadius = element.borderRadius || element.style?.borderRadius || 0;

  const getShapePath = () => {
    const w = scaledWidth;
    const h = scaledHeight;

    const paths = {
      rectangle: `M0,0 L${w},0 L${w},${h} L0,${h} Z`,
      circle: `M${w / 2},0 A${w / 2},${h / 2} 0 1,1 ${w / 2 - 0.1},0 Z`,
      triangle: `M${w / 2},0 L${w},${h} L0,${h} Z`,
      diamond: `M${w / 2},0 L${w},${h / 2} L${w / 2},${h} L0,${h / 2} Z`,
      star: `M${w / 2},0 L${w * 0.6},${h * 0.35} L${w},${h * 0.35} L${w * 0.75},${h * 0.6} L${w * 0.9},${h} L${w / 2},${h * 0.75} L${w * 0.1},${h} L${w * 0.25},${h * 0.6} L0,${h * 0.35} L${w * 0.4},${h * 0.35} Z`,
      pentagon: `M${w / 2},0 L${w * 0.95},${h * 0.35} L${w * 0.8},${h} L${w * 0.2},${h} L${w * 0.05},${h * 0.35} Z`,
      hexagon: `M${w * 0.25},0 L${w * 0.75},0 L${w},${h / 2} L${w * 0.75},${h} L${w * 0.25},${h} L0,${h / 2} Z`,
      heart: `M${w / 2},${h * 0.25} C${w / 2},${h * 0.15} ${w * 0.4},0 ${w * 0.25},0 C${w * 0.1},0 0,${h * 0.1} 0,${h * 0.25} C0,${h * 0.4} ${w / 2},${h * 0.7} ${w / 2},${h} C${w / 2},${h * 0.7} ${w},${h * 0.4} ${w},${h * 0.25} C${w},${h * 0.1} ${w * 0.9},0 ${w * 0.75},0 C${w * 0.6},0 ${w / 2},${h * 0.15} ${w / 2},${h * 0.25} Z`,
      cross: `M${w * 0.35},0 L${w * 0.65},0 L${w * 0.65},${h * 0.35} L${w},${h * 0.35} L${w},${h * 0.65} L${w * 0.65},${h * 0.65} L${w * 0.65},${h} L${w * 0.35},${h} L${w * 0.35},${h * 0.65} L0,${h * 0.65} L0,${h * 0.35} L${w * 0.35},${h * 0.35} Z`,
      arrow: `M0,${h / 2} L${w * 0.6},0 L${w * 0.6},${h * 0.25} L${w},${h * 0.25} L${w},${h * 0.75} L${w * 0.6},${h * 0.75} L${w * 0.6},${h} Z`,
      line: `M0,${h / 2} L${w},${h / 2}`,
    };

    return paths[shapeType as keyof typeof paths] || paths.rectangle;
  };

  const shapeStyle: CSSProperties = {
    position: "absolute",
    left: `${element.x * scale}px`,
    top: `${element.y * scale}px`,
    width: `${scaledWidth}px`,
    height: `${scaledHeight}px`,
    transform: `rotate(${element.rotation || 0}deg) scale(${element.scaleX || 1}, ${element.scaleY || 1})`,
    transformOrigin: "left top",
    opacity: opacity,
    zIndex: element.zIndex || 0,
  };

  if (element.isVisible === false) {
    shapeStyle.display = "none";
  }

  return (
    <div key={element.id} style={shapeStyle}>
      <svg width="100%" height="100%" style={{ overflow: "visible" }}>
        <path
          d={getShapePath()}
          fill={fillColor === "transparent" ? "none" : fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          rx={shapeType === "rectangle" ? borderRadius : 0}
          style={{
            fill: fillColor === "transparent" ? "none" : fillColor,
            stroke: strokeColor,
            strokeWidth: strokeWidth,
            opacity: opacity,
          }}
        />
      </svg>
    </div>
  );
};

// Helper: generate SVG path string for a shape element (using raw width/height)
const getShapePathForElement = (element: CertificateElement, w: number, h: number) => {
  const shapeType = element.shapeType || 'rectangle';

  const paths: Record<string, string> = {
    rectangle: `M0,0 L${w},0 L${w},${h} L0,${h} Z`,
    circle: `M${w / 2},0 A${w / 2},${h / 2} 0 1,1 ${w / 2 - 0.1},0 Z`,
    triangle: `M${w / 2},0 L${w},${h} L0,${h} Z`,
    diamond: `M${w / 2},0 L${w},${h / 2} L${w / 2},${h} L0,${h / 2} Z`,
    star: `M${w / 2},0 L${w * 0.6},${h * 0.35} L${w},${h * 0.35} L${w * 0.75},${h * 0.6} L${w * 0.9},${h} L${w / 2},${h * 0.75} L${w * 0.1},${h} L${w * 0.25},${h * 0.6} L0,${h * 0.35} L${w * 0.4},${h * 0.35} Z`,
    pentagon: `M${w / 2},0 L${w * 0.95},${h * 0.35} L${w * 0.8},${h} L${w * 0.2},${h} L${w * 0.05},${h * 0.35} Z`,
    hexagon: `M${w * 0.25},0 L${w * 0.75},0 L${w},${h / 2} L${w * 0.75},${h} L${w * 0.25},${h} L0,${h / 2} Z`,
    heart: `M${w / 2},${h * 0.25} C${w / 2},${h * 0.15} ${w * 0.4},0 ${w * 0.25},0 C${w * 0.1},0 0,${h * 0.1} 0,${h * 0.25} C0,${h * 0.4} ${w / 2},${h * 0.7} ${w / 2},${h} C${w / 2},${h * 0.7} ${w},${h * 0.4} ${w},${h * 0.25} C${w},${h * 0.1} ${w * 0.9},0 ${w * 0.75},0 C${w * 0.6},0 ${w / 2},${h * 0.15} ${w / 2},${h * 0.25} Z`,
    cross: `M${w * 0.35},0 L${w * 0.65},0 L${w * 0.65},${h * 0.35} L${w},${h * 0.35} L${w},${h * 0.65} L${w * 0.65},${h * 0.65} L${w * 0.65},${h} L${w * 0.35},${h} L${w * 0.35},${h * 0.65} L0,${h * 0.65} L0,${h * 0.35} L${w * 0.35},${h * 0.35} Z`,
    arrow: `M0,${h / 2} L${w * 0.6},0 L${w * 0.6},${h * 0.25} L${w},${h * 0.25} L${w},${h * 0.75} L${w * 0.6},${h * 0.75} L${w * 0.6},${h} Z`,
    line: `M0,${h / 2} L${w},${h / 2}`,
  };

  return paths[shapeType] || paths.rectangle;
};

// Convert a shape element into a PNG dataURL by rendering an SVG into a canvas
const shapeElementToDataUrl = async (element: CertificateElement): Promise<string> => {
  const width = Math.max(1, Math.round(element.width || 100));
  const height = Math.max(1, Math.round(element.height || 100));

  const fillColor = element.fillColor || element.style?.fillColor || 'transparent';
  const strokeColor = element.strokeColor || element.style?.strokeColor || element.style?.color || '#000000';
  const strokeWidth = element.strokeWidth ?? element.style?.strokeWidth ?? 1;
  const opacity = element.opacity ?? element.style?.opacity ?? 1;

  const d = getShapePathForElement(element, width, height);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<path d="${d}" fill="${fillColor === 'transparent' ? 'none' : fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" opacity="${opacity}"/>` +
    `</svg>`;

  try {
    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = document.createElement('img') as HTMLImageElement;
    img.crossOrigin = 'anonymous';

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load generated SVG image'));
      img.src = url;
    });

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    // draw white background only if fill is not transparent? Keep transparent by default
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    URL.revokeObjectURL(url);
    return canvas.toDataURL('image/png');
  } catch (err) {
    console.error('Error converting shape to image:', err);
    // fallback: return empty transparent 1x1 PNG
    const c = document.createElement('canvas');
    c.width = Math.max(1, width);
    c.height = Math.max(1, height);
    return c.toDataURL('image/png');
  }
};

// --- KOMPONEN PREVIEW ---
export default function PreviewPage() {
  const params = useParams();
  const id = params.id as string;

  const [template, setTemplate] = useState<TemplateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [certificateNumber, setCertificateNumber] = useState("");
  const [certificateNumberTouched, setCertificateNumberTouched] = useState(false);
  const [instruktur, setInstruktur] = useState("");
  const [certificateDate, setCertificateDate] = useState(getTodayDateString());
  const [genCounter, setGenCounter] = useState(() => Math.floor(Date.now() % 1000));
  const [isFullscreen, setIsFullscreen] = useState(false);
  const certificatePreviewRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const isDarkMode = document.documentElement.classList.contains("dark");
      if (isDarkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, []);

  useEffect(() => {
    const calculateScale = () => {
      if (certificatePreviewRef.current) {
        const currentWidth = certificatePreviewRef.current.offsetWidth;
        setScale(currentWidth / ORIGINAL_WIDTH);
      }
    };
    if (template) {
      calculateScale();
    }
    window.addEventListener("resize", calculateScale);
    return () => window.removeEventListener("resize", calculateScale);
  }, [template, isFullscreen]);

  useEffect(() => {
    const fetchTemplateDetail = async () => {
      if (!id) return;
      NProgress.start();
      setLoading(true);
      try {
        const response = await api.get(`/sertifikat-templates/${id}`);
        let data = response.data.data;

        data.background_image = getFullImageUrl(data.background_image);

        data.elements.forEach((el: CertificateElement) => {
          if (el.type === "image" || el.type === "qrcode") {
            const imageUrl = el.imageUrl || el.src || el.image_path;
            el.imageUrl = getFullImageUrl(imageUrl) || undefined;
          }
        });

        setTemplate(data);
      } catch (err) {
        setError("Gagal memuat data template.");
        console.error("Error fetching template:", err);
      } finally {
        setLoading(false);
        NProgress.done();
      }
    };
    fetchTemplateDetail();
  }, [id]);

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleGeneratePdf = async () => {
    if (!recipientName || !certificateDate || !certificateNumber || !instruktur) {
      showNotification("Semua field wajib diisi.", "error");
      return;
    }
    setIsGenerating(true);
    setNotification(null);
    try {
      if (!template) {
        showNotification("Template tidak ditemukan.", "error");
        return;
      }

      // TAMBAHKAN INI: Sertakan elements dalam payload
      // Sebelum mengirim, konversi semua shape menjadi image (dataURL PNG)
      const processedElements = await Promise.all(
        template.elements.map(async (el) => {
          if (el.type === 'shape') {
            try {
              const dataUrl = await shapeElementToDataUrl(el);
              return {
                ...el,
                type: 'image' as const,
                imageUrl: dataUrl,
                src: dataUrl,
              } as CertificateElement;
            } catch (err) {
              console.error('Failed to convert shape to image, sending original element', err);
              return el;
            }
          }
          return el;
        }),
      );

      const payload = {
        recipient_name: recipientName,
        certificate_number: certificateNumber,
        date: certificateDate,
        merchant_id: template.merchant_id,
        instruktur: instruktur,
        elements: processedElements,
      };

      console.log('Sending payload with elements:', payload.elements); // Debug log

      const response = await api.post(
        `/sertifikat-templates/${id}/generate-pdf`,
        payload,
        {
          headers: {
            Accept: "application/pdf",
            "Content-Type": "application/json",
          },
          responseType: "blob",
        },
      );

      const contentType = response.headers["content-type"] || response.headers["Content-Type"];
      if (contentType && contentType.includes("application/pdf")) {
        const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `sertifikat-${recipientName.replace(/\s+/g, "-")}.pdf`,
        );
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
        showNotification("PDF berhasil diunduh!", "success");
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errorData = JSON.parse(reader.result as string);
            showNotification(
              `Gagal membuat PDF: ${errorData.message || "Terjadi kesalahan"}`,
              "error",
            );
          } catch {
            showNotification("Gagal membuat PDF.", "error");
          }
        };
        reader.readAsText(response.data);
      }
    } catch (err: any) {
      console.error("Error generating PDF:", err);
      if (err.response && err.response.data) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errorData = JSON.parse(reader.result as string);
            showNotification(
              `Gagal membuat PDF: ${errorData.message || "Terjadi kesalahan"}`,
              "error",
            );
          } catch {
            showNotification("Gagal membuat PDF.", "error");
          }
        };
        reader.readAsText(err.response.data);
      } else if (err.request) {
        showNotification("Gagal membuat PDF: Tidak ada respons dari server", "error");
      } else {
        showNotification(`Gagal membuat PDF: ${err.message}`, "error");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-generate certificate number helper
  const generateCertificateNumber = () => {
    const d = new Date(certificateDate || getTodayDateString());
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const nextSeq = String((genCounter + 1) % 1000).padStart(3, "0");
  // include a two-letter code segment 'XX' by default; you can change logic to use merchant/instructor initials
  const code = "XX";
  const generated = `CERT/${code}/${y}/${m}/${nextSeq}`;
    setGenCounter((c) => (c + 1) % 1000);
    setCertificateNumber(generated);
    setCertificateNumberTouched(true);
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-gray-900">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400 dark:text-gray-500" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Memuat template...
          </p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
            <X className="h-6 w-6 text-red-500" />
          </div>
          <h2 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
            Terjadi Kesalahan
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );

  if (!template)
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <FileText className="mx-auto mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" />
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Template tidak ditemukan
          </h2>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-white transition-colors duration-200 dark:bg-gray-900">
      {notification && (
        <div className="animate-in slide-in-from-top-2 fixed left-1/2 top-4 z-50 -translate-x-1/2 duration-200">
          <div
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium shadow-lg ${
              notification.type === "success"
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <X className="h-4 w-4" />
            )}
            {notification.message}
            <button
              onClick={() => setNotification(null)}
              className="ml-2 rounded p-1 hover:bg-white/20"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      <header className="border-b border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/admin/tabel-sertifikat"
              className="flex items-center gap-2 text-gray-600 transition-colors hover:text-primary dark:text-gray-400 dark:hover:text-gray-100"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Kembali</span>
            </Link>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-primary dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
                {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div
          className={`grid gap-8 transition-all duration-300 ${
            isFullscreen ? "grid-cols-1" : "lg:grid-cols-3"
          }`}
        >
          <div
            className={`${isFullscreen ? "hidden" : "lg:col-span-1"} space-y-6`}
          >
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-4">
                <h1 className="mb-1 text-xl font-semibold text-gray-900 dark:text-white">
                  {template.name}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  ID: {template.id}
                </p>
              </div>

              <div className="mb-6 grid grid-cols-2 gap-3">
                <div className="rounded-md bg-gray-50 p-3 dark:bg-gray-700">
                  <div className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Status
                  </div>
                  <div className="flex items-center gap-1">
                    {template.is_active ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <X className="h-3 w-3 text-red-500" />
                    )}
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {template.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>
                </div>

                <div className="rounded-md bg-gray-50 p-3 dark:bg-gray-700">
                  <div className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Dibuat
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(template.created_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6 dark:border-gray-700">
                <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
                  Generate PDF
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
                      Nama Penerima <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400"
                      placeholder="Masukkan nama..."
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
                      Nomor Sertifikat <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={certificateNumber}
                        onChange={(e) => setCertificateNumber(e.target.value)}
                        onBlur={() => setCertificateNumberTouched(true)}
                        className="flex-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400"
                        placeholder="Contoh: CERT/2025/08/001 — wajib diisi"
                      />
                      <button
                        type="button"
                        onClick={generateCertificateNumber}
                        className="whitespace-nowrap rounded border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        title="Auto-generate nomor sertifikat"
                      >
                        Auto
                      </button>
                    </div>
                    {certificateNumberTouched && !isValidCertificateNumber(certificateNumber) && (
                      <p className="mt-1 text-xs text-red-600">Nomor sertifikat tidak valid. Gunakan format seperti <code>CERT/2025/08/001</code> atau kombinasi huruf & angka minimal.</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
                      Tanggal <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={certificateDate}
                      onChange={(e) => setCertificateDate(e.target.value)}
                      className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
                      Instruktur <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={instruktur}
                      onChange={(e) => setInstruktur(e.target.value)}
                      className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400"
                      placeholder="Nama instruktur"
                    />
                  </div>
                </div>

                <button
                  onClick={handleGeneratePdf}
                  disabled={isGenerating || !recipientName || !certificateDate || !instruktur || !isValidCertificateNumber(certificateNumber)}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-100"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Membuat PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span>Download PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className={`${isFullscreen ? "col-span-1" : "lg:col-span-2"}`}>
            <div className="mb-4">
              <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
                Preview
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Pratinjau template dengan data contoh
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="mx-auto aspect-[842/595] w-full overflow-hidden rounded-md bg-white shadow-sm dark:bg-gray-100">
                <div
                  id="certificate-preview"
                  ref={certificatePreviewRef}
                  className="relative h-full w-full"
                  style={{
                    backgroundImage: template.background_image
                      ? `url(${template.background_image})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  {template.elements
                    .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
                    .map((element, index) => {
                      const key = element.id || index;

                      if (element.type === "text") {
                        const transformFns = [];
                        if (element.rotation)
                          transformFns.push(`rotate(${element.rotation}deg)`);
                        if (element.scaleX || element.scaleY)
                          transformFns.push(
                            `scale(${element.scaleX || 1}, ${element.scaleY || 1})`,
                          );
                        if (element.textAlign === "center")
                          transformFns.push("translateX(-50%)");
                        else if (element.textAlign === "right")
                          transformFns.push("translateX(-100%)");

                        const elementStyle: CSSProperties = {
                          position: "absolute",
                          left: `${element.x * scale}px`,
                          top: `${element.y * scale}px`,
                          fontSize: `${(element.fontSize || 16) * scale}px`,
                          fontFamily: `"${element.fontFamily || "Arial"}", Arial, sans-serif`,
                          fontWeight: element.fontWeight || "normal",
                          fontStyle: element.fontStyle || "normal",
                          color: "#000000",
                          whiteSpace: "nowrap",
                          transform: `translate(0, ${0}px) ${transformFns.join(" ")}`,
                          transformOrigin: "left top",
                          zIndex: element.zIndex || 0,
                          display: element.isVisible === false ? 'none' : 'block'
                        };

                        const displayText = renderPlaceholderText(
                          element,
                          recipientName,
                          certificateNumber,
                          certificateDate,
                          instruktur
                        );

                        return (
                          <div key={key} style={elementStyle}>
                            {displayText}
                          </div>
                        );
                      }

                      if (element.type === "image" || element.type === "qrcode") {
                        const imageUrl = element.imageUrl || element.src || element.image_path;
                        
                        if (element.type === "qrcode" && !imageUrl) {
                          const elementStyle: CSSProperties = {
                            position: "absolute",
                            left: `${element.x * scale}px`,
                            top: `${element.y * scale}px`,
                            width: `${(element.width || 100) * scale}px`,
                            height: `${(element.height || 100) * scale}px`,
                            zIndex: element.zIndex || 0,
                            border: '1px dashed #ccc', 
                            display: element.isVisible === false ? 'none' : 'flex',
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            background: '#f9f9f9',
                          };
                           return (
                            <div key={key} style={elementStyle}>
                              <span style={{ fontSize: `${12 * scale}px`, color: '#888' }}>QR Code</span>
                            </div>
                          );
                        }

                        if (!imageUrl) return null;

                        const transformFns = [];
                        if (element.rotation)
                          transformFns.push(`rotate(${element.rotation}deg)`);
                        if (element.scaleX || element.scaleY)
                          transformFns.push(
                            `scale(${element.scaleX || 1}, ${element.scaleY || 1})`,
                          );

                        const elementStyle: CSSProperties = {
                          position: "absolute",
                          left: `${element.x * scale}px`,
                          top: `${element.y * scale}px`,
                          zIndex: element.zIndex || 0,
                          transform: `translate(0, ${0}px) ${transformFns.join(" ")}`,
                          transformOrigin: "left top",
                          display: element.isVisible === false ? 'none' : 'block'
                        };

                        return (
                          <div key={key} style={elementStyle}>
                            <div
                              style={{
                                position: "relative",
                                width: `${(element.width || 100) * scale}px`,
                                height: `${(element.height || 100) * scale}px`,
                              }}
                            >
                              <Image
                                src={imageUrl}
                                alt="certificate element"
                                fill
                                style={{
                                  objectFit: "contain",
                                }}
                                onError={() => {
                                  console.error(
                                    "Image failed to load:",
                                    imageUrl,
                                  );
                                }}
                                unoptimized={imageUrl?.startsWith(
                                  "data:",
                                )}
                              />
                            </div>
                          </div>
                        );
                      }

                      if (element.type === "shape") {
                        return renderShape(element, scale);
                      }

                      return null;
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
