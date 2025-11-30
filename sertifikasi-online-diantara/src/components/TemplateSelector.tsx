"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "@/lib/axios";
import { toast } from "react-toastify";
import Image from "next/image";
import {
  PhotoIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PaperAirplaneIcon,
  TrashIcon,
  XMarkIcon,
  ChevronDownIcon,
  PlusIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

// --- INTERFACES ---
interface Template {
  id: number;
  name: string;
  background_image_url: string;
  elements: CertificateElement[];
  description?: string;
  created_at?: string;
  status?: "selected" | "pending" | "approved";
  agentPreviewUrl?: string | null;
}

interface CertificateElement {
  id: string | number;
  type: "text" | "image" | "shape";
  x: number;
  y: number;
  // text properties
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  textAlign?: "left" | "center" | "right";
  color?: string;
  fontWeight?: string;
  // image properties
  imageUrl?: string;
  width?: number;
  height?: number;
  // shape properties
  shapeType?:
    | "rectangle"
    | "circle"
    | "triangle"
    | "star"
    | "diamond"
    | "pentagon"
    | "hexagon"
    | "line"
    | "arrow"
    | "heart"
    | "cross";
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  borderRadius?: number;
  opacity?: number;
  rotation?: number;
}

interface Template {
  id: number;
  name: string;
  background_image_url: string;
  elements: CertificateElement[];
  description?: string;
  created_at?: string;
  status?: "selected" | "pending" | "approved";
  agentPreviewUrl?: string | null;
}

interface TemplateSelectorProps {
  activityId: string;
  initialTemplateId?: number | null;
  initialTemplateName?: string | null;
  isAdmin?: boolean;
  onTemplateChange?: (templates: Template[]) => void;
}

interface SelectedTemplate extends Template {
  previewUrl?: string | null;
  status?: "selected" | "pending" | "approved";
  agentPreviewUrl?: string | null; // final certificate preview
}

const ORIGINAL_WIDTH = 842;
const ORIGINAL_HEIGHT = 595;
const PREVIEW_SIZE = 240;
const THUMBNAIL_SIZE = 180;

// Utility functions
const getFullImageUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (url.startsWith("http")) return url;

  const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
  const cleanUrl = url.replace(/^\/?storage\//, "");
  return `${backendUrl}/storage/${cleanUrl}`;
};

const transformApiDataToTemplate = (apiData: any): Template => {
  const backgroundImage =
    apiData.background_image_url ||
    apiData.background_image ||
    apiData.backgroundImage ||
    apiData.background_url ||
    apiData.image_url ||
    apiData.image ||
    apiData.thumbnail ||
    apiData.preview;

  return {
    id: apiData.id,
    name: apiData.name || `Template ${apiData.id}`,
    background_image_url: backgroundImage,
    elements: apiData.elements || [],
    description: apiData.description,
    created_at: apiData.created_at,
  };
};

const fetchTemplateDetail = async (
  id: number,
  status: string,
  activityId: string,
) => {
  try {
    let endpoint = `/data-activities/${activityId}/template/${id}`;
    if (status === "approved") {
      endpoint = `/data-activities/certificate-templates/${id}`;
    }
    const response = await axios.get(endpoint);
    if (response.data?.data) {
      return transformApiDataToTemplate(response.data.data);
    }
    return null;
  } catch (error) {
    toast.error("Gagal memuat detail template");
    return null;
  }
};

// Enhanced Template Preview Component with complete element rendering
const TemplatePreview: React.FC<{
  template: Template;
  size?: number;
  showElements?: boolean;
  className?: string;
}> = ({
  template,
  size = PREVIEW_SIZE,
  showElements = true,
  className = "",
}) => {
  const scale = size / ORIGINAL_WIDTH;
  const height = size * (ORIGINAL_HEIGHT / ORIGINAL_WIDTH);

  // Shape rendering helper
  const renderShape = useCallback(
    (element: CertificateElement, index: number) => {
      const width = (element.width || 100) * scale;
      const height = (element.height || 100) * scale;
      const x = element.x * scale;
      const y = element.y * scale;

      const commonProps = {
        fill: element.fillColor || "#000000",
        stroke: element.strokeColor || "transparent",
        strokeWidth: (element.strokeWidth || 0) * scale,
        opacity: element.opacity ?? 1,
      };

      let shapeElement;

      switch (element.shapeType) {
        case "rectangle":
          shapeElement = (
            <rect
              width={width}
              height={height}
              rx={(element.borderRadius || 0) * scale}
              {...commonProps}
            />
          );
          break;
        case "circle":
          shapeElement = (
            <ellipse
              cx={width / 2}
              cy={height / 2}
              rx={width / 2}
              ry={height / 2}
              {...commonProps}
            />
          );
          break;
        case "triangle":
          shapeElement = (
            <polygon
              points={`${width / 2},0 ${width},${height} 0,${height}`}
              {...commonProps}
            />
          );
          break;
        case "star":
          const points = [];
          const outerRadius = Math.min(width, height) / 2;
          const innerRadius = outerRadius * 0.4;
          for (let i = 0; i < 10; i++) {
            const angle = (i * Math.PI) / 5;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const px = width / 2 + radius * Math.cos(angle - Math.PI / 2);
            const py = height / 2 + radius * Math.sin(angle - Math.PI / 2);
            points.push(`${px},${py}`);
          }
          shapeElement = <polygon points={points.join(" ")} {...commonProps} />;
          break;
        case "diamond":
          shapeElement = (
            <polygon
              points={`${width / 2},0 ${width},${height / 2} ${width / 2},${height} 0,${height / 2}`}
              {...commonProps}
            />
          );
          break;
        case "heart":
          const heartPath = `M${width / 2},${height * 0.8} C${width / 2},${height * 0.8} ${width * 0.1},${height * 0.3} ${width * 0.1},${height * 0.15} C${width * 0.1},${height * 0.05} ${width * 0.2},0 ${width * 0.35},0 C${width * 0.45},0 ${width / 2},${height * 0.1} ${width / 2},${height * 0.1} C${width / 2},${height * 0.1} ${width * 0.55},0 ${width * 0.65},0 C${width * 0.8},0 ${width * 0.9},${height * 0.05} ${width * 0.9},${height * 0.15} C${width * 0.9},${height * 0.3} ${width / 2},${height * 0.8} ${width / 2},${height * 0.8} Z`;
          shapeElement = <path d={heartPath} {...commonProps} />;
          break;
        case "line":
          shapeElement = (
            <line
              x1={0}
              y1={height / 2}
              x2={width}
              y2={height / 2}
              stroke={element.strokeColor || "#000000"}
              strokeWidth={(element.strokeWidth || 2) * scale}
              opacity={element.opacity ?? 1}
            />
          );
          break;
        case "arrow":
          const arrowPath = `M0,${height / 2} L${width * 0.7},${height / 2} L${width * 0.7},${height * 0.2} L${width},${height / 2} L${width * 0.7},${height * 0.8} L${width * 0.7},${height / 2} Z`;
          shapeElement = <path d={arrowPath} {...commonProps} />;
          break;
        default:
          shapeElement = (
            <rect width={width} height={height} {...commonProps} />
          );
      }

      return (
        <svg
          key={`shape-${element.id || index}`}
          style={{
            position: "absolute",
            left: x,
            top: y,
            width,
            height,
            transform: `translate(-50%, -50%) rotate(${element.rotation || 0}deg)`,
            zIndex: 10,
            overflow: "visible",
          }}
        >
          {shapeElement}
        </svg>
      );
    },
    [scale],
  );

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-white shadow-md transition-all duration-300 hover:shadow-lg ${className}`}
      style={{ width: size, height }}
    >
      {/* Background Image */}
      {template.background_image_url && (
        <Image
          src={
            getFullImageUrl(template.background_image_url) ||
            template.background_image_url
          }
          alt={template.name}
          fill
          className="absolute inset-0 h-full w-full object-cover"
          style={{ zIndex: 1 }}
          priority
        />
      )}

      {/* Template Elements */}
      {showElements &&
        template.elements?.map((element, index) => {
          // Text Elements
          if (element.type === "text") {
            return (
              <div
                key={`text-${element.id || index}`}
                style={{
                  position: "absolute",
                  left: element.x * scale,
                  top: element.y * scale,
                  fontSize: Math.max(8, (element.fontSize || 16) * scale),
                  fontFamily: element.fontFamily || "Arial, sans-serif",
                  color: element.color || "#000000",
                  textAlign: element.textAlign || "left",
                  fontWeight: element.fontWeight || 500,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  transform: "translate(-50%, -50%)",
                  zIndex: 15,
                  maxWidth: size * 0.9,
                  lineHeight: 1.2,
                  textShadow: "0 1px 2px rgba(255,255,255,0.8)",
                }}
              >
                {element.text || "Sample Text"}
              </div>
            );
          }

          // Image Elements
          if (element.type === "image" && element.imageUrl) {
            const width = (element.width || 100) * scale;
            const height = (element.height || 100) * scale;
            return (
              <Image
                key={`image-${element.id || index}`}
                src={getFullImageUrl(element.imageUrl) || element.imageUrl}
                alt="Template element"
                width={Math.round(width)}
                height={Math.round(height)}
                style={{
                  position: "absolute",
                  left: element.x * scale,
                  top: element.y * scale,
                  width,
                  height,
                  objectFit: "contain",
                  transform: `translate(-50%, -50%) rotate(${element.rotation || 0}deg)`,
                  zIndex: 12,
                  borderRadius: "4px",
                }}
              />
            );
          }

          // Shape Elements
          if (element.type === "shape") {
            return renderShape(element, index);
          }

          return null;
        })}

      {/* Overlay for better text visibility */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"
        style={{ zIndex: 5 }}
      />
    </div>
  );
};

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  activityId,
  initialTemplateId,
  initialTemplateName,
  onTemplateChange,
}) => {
  // State management
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplates, setSelectedTemplates] = useState<
    SelectedTemplate[]
  >([]);
  const [sentTemplates, setSentTemplates] = useState<any[]>([]); // store full sent template objects
  const [attachedTemplate, setAttachedTemplate] =
    useState<SelectedTemplate | null>(null);
  const [attachedId, setAttachedId] = useState<number | null>(null); // to track if template is attached
  // UI State
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Normalize sentTemplates into an array for safe iteration
  const sentList = Array.isArray(sentTemplates)
    ? sentTemplates
    : sentTemplates
    ? [sentTemplates]
    : [];

  // Compute if there are any sent templates that are not yet approved
  const hasProcessingApprove = sentList.some((s: any) => {
    const st = (s?.status || "").toString().toLowerCase();
    return st !== "approved" && st !== "";
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load activity data and templates on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch DataActivity to check sertifikat_id
        const activityRes = await axios.get(`/data-activities/${activityId}`);
        const activityData = activityRes.data.data;
        let id = activityData?.sertifikat_id ?? activityData?.certificate_id;

        // Treat 0, null, undefined as not attached
        if (!id || id === 0 || id === "0") {
          id = null;
        }
        setAttachedId(id ? Number(id) : null);

        // 2. Fetch available templates for selection
        const templatesRes = await axios.get(
          "/data-activities/certificate-templates",
        );
        const fetchedTemplates: Template[] = (templatesRes.data.data || []).map(
          transformApiDataToTemplate,
        );
        setTemplates(fetchedTemplates);

        // 3. If template is attached, fetch its details
        if (id) {
          const detail = await fetchTemplateDetail(
            Number(id),
            activityData?.status || "approved",
            activityId,
          );
          if (detail) {
            setAttachedTemplate(detail);
          }
        }

        // Ensure sentTemplates is always an array
        const normalized = Array.isArray(activityData?.templates)
          ? activityData.templates
          : activityData?.templates
          ? [activityData.templates]
          : [];
        setSentTemplates(normalized);
      } catch (error) {
        toast.error("Gagal memuat data aktivitas atau template");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [activityId]);

  // Fetch sentTemplates only after sending or when needed
  const fetchSentTemplates = async () => {
    try {
      const sentRes = await axios.get(`/data-activities/${activityId}`);
  const d = sentRes.data.data;
  const normalized = Array.isArray(d) ? d : d ? [d] : [];
  setSentTemplates(normalized);
    } catch (err) {
      setSentTemplates([]);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Notify parent of template changes
  useEffect(() => {
    if (onTemplateChange) {
      onTemplateChange(selectedTemplates);
    }
  }, [selectedTemplates, onTemplateChange]);

  // Fetch detailed template data
  // Perbaiki fungsi fetchTemplateDetail
  const fetchTemplateDetail = async (
    templateId: number,
    status?: string,
    activityId?: string,
  ): Promise<SelectedTemplate | null> => {
    try {
      const response = await axios.get(`/sertifikat-templates/${templateId}`);
      const data = response.data.data;

      // Process image URLs
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      if (data.background_image && !data.background_image.startsWith("http")) {
        const cleanBgUrl = data.background_image.replace(/^\/?storage\//, "");
        data.background_image = `${backendUrl}/storage/${cleanBgUrl}`;
      }

      // If approved, fetch agent (final) preview
      let agentPreviewUrl: string | null = null;
      if (status === "approved" && activityId) {
        try {
          // Endpoint for final certificate preview (adjust as needed)
          // Format date ke dd-mm-yyyy
          const now = new Date();
          const day = String(now.getDate()).padStart(2, "0");
          const month = String(now.getMonth() + 1).padStart(2, "0");
          const year = now.getFullYear();
          const formattedDate = `${day}-${month}-${year}`;
          const agentRes = await axios.post(
            `/sertifikat-templates/${templateId}/preview-template`,
            {
              recipient_name: "Nama Penerima", // ganti dengan value dinamis jika ada
              date: formattedDate, // format dd-mm-yyyy
              certificate_number: "CERT-2025-0001", // ganti dengan value dinamis jika ada
            },
          );
          agentPreviewUrl = agentRes.data.preview_url || null;
        } catch (err) {
          agentPreviewUrl = null;
        }
      }

      const validStatus =
        status === "selected" || status === "pending" || status === "approved"
          ? status
          : undefined;
      return {
        id: data.id,
        name: data.name,
        background_image_url: data.background_image,
        elements: data.elements || [],
        description: data.description,
        created_at: data.created_at,
        status: validStatus,
        previewUrl: getFullImageUrl(data.background_image),
        agentPreviewUrl,
      };
    } catch (error) {
      console.error("Error fetching template detail:", error);
      toast.error("Gagal memuat detail template");
      return null;
    }
  };

  // Perbaiki fungsi handleTemplateToggle
  const handleTemplateToggle = async (template: Template) => {
    const isSelected = selectedTemplates.some((t) => t.id === template.id);
    if (isSelected) {
      setSelectedTemplates((prev) => prev.filter((t) => t.id !== template.id));
    } else {
      // Fetch detail template agar preview langsung tampil lengkap
      // If template is approved, fetch agent preview
      const detail = await fetchTemplateDetail(
        template.id,
        (template as any).status,
        activityId,
      );
      const newSelectedTemplate: SelectedTemplate = {
        ...(detail || template),
        status: (template as any).status || "selected",
        previewUrl: getFullImageUrl((detail || template).background_image_url),
        agentPreviewUrl: detail?.agentPreviewUrl || null,
      };
      setSelectedTemplates((prev) => [...prev, newSelectedTemplate]);
    }
  };

  // Remove template from selection
  const handleRemoveTemplate = (templateId: number) => {
    setSelectedTemplates((prev) => prev.filter((t) => t.id !== templateId));
  };

  // Send templates for attach (no admin validation, backend handles merchant_id logic)
  const handleSaveTemplates = async () => {
    if (selectedTemplates.length === 0) {
      toast.warn("Silakan pilih minimal satu template terlebih dahulu.");
      return;
    }
    // Only send templates that are not blocked
    const getAdminId = () => {
      return localStorage.getItem("user_id") || "1";
    };
    // use normalized sentList for checks
    const toSend = selectedTemplates.filter((t) => {
      const sent = sentList.find(
        (item: any) =>
          (item.sertifikat_id || item.certificate_id || item.id) === t.id,
      );
      return !sent || sent.status === "approved";
    });
    if (toSend.length === 0) {
      const errMsg = "Semua template yang dipilih sudah pernah dikirim dan belum di-approve.";
      setValidationError(errMsg);
      toast.error(errMsg);
      return;
    }
    setIsSaving(true);
    setValidationError(null);
    try {
      await axios.post(`/data-activities/${activityId}/templates/attach`, {
        sertifikat_id: toSend.map((t) => t.id),
        admin_id: Number(getAdminId()),
      });
      toast.success(`${toSend.length} template berhasil dikirim!`);
      setValidationError(null);
      // mark sent templates locally as pending to reflect processing state
      setSentTemplates((prev) => {
        const base = Array.isArray(prev) ? prev : prev ? [prev] : [];
        return [
          ...base,
          ...toSend.map((t) => ({
            sertifikat_id: t.id,
            certificate_id: t.id,
            id: t.id,
            name: t.name,
            status: "pending",
          })),
        ];
      });
      setSelectedTemplates([]);
      await fetchSentTemplates(); // fetch sentTemplates setelah kirim
    } catch (error: any) {
      const status = error?.response?.status;
      const data = error?.response?.data;
      const message = data?.message || "Gagal mengirim template";
      let errorDisplay = "";

      // Handle conflict: templates already sent
      if (status === 409 && data?.already_sent) {
        const failedIds = data.already_sent;
        const failedNames = selectedTemplates
          .filter((t) => failedIds.includes(t.id))
          .map((t) => t.name)
          .join(", ");
        errorDisplay = `Template sudah pernah dikirim: ${failedNames}`;
        setValidationError(errorDisplay);
        toast.error(errorDisplay);
        return;
      }

      // Handle 422: Validation errors or business logic errors
      if (status === 422) {
        // Instruktur belum upload signature
        if (message.includes("signature")) {
          errorDisplay = "⚠️ Instruktur belum memiliki signature. Minta instruktur untuk upload signature terlebih dahulu.";
          setValidationError(errorDisplay);
          toast.error(errorDisplay);
          return;
        }
        // Generic validation error
        errorDisplay = `Validasi gagal: ${message}`;
        setValidationError(errorDisplay);
        toast.error(errorDisplay);
        return;
      }

      // Handle 404: Instruktur tidak ditemukan
      if (status === 404) {
        errorDisplay = "❌ Instruktur tidak ditemukan. Pastikan instruktur telah ditugaskan.";
        setValidationError(errorDisplay);
        toast.error(errorDisplay);
        return;
      }

      // Handle 400: Bad request (merchant_id, instruktur_id invalid)
      if (status === 400) {
        if (message.includes("instruktur")) {
          errorDisplay = "❌ Instruktur tidak valid atau belum ditugaskan untuk kegiatan ini.";
        } else if (message.includes("merchant")) {
          errorDisplay = "❌ Konfigurasi merchant tidak valid. Hubungi administrator.";
        } else {
          errorDisplay = `❌ Request tidak valid: ${message}`;
        }
        setValidationError(errorDisplay);
        toast.error(errorDisplay);
        return;
      }

      // Handle generic server errors
      if (status >= 500) {
        errorDisplay = "❌ Terjadi kesalahan pada server. Silakan coba lagi nanti.";
        setValidationError(errorDisplay);
        toast.error(errorDisplay);
        return;
      }

      // Fallback error message
      errorDisplay = `❌ ${message || "Gagal mengirim template. Silakan coba lagi."}`;
      setValidationError(errorDisplay);
      toast.error(errorDisplay);
      console.error("Error saving templates:", error);
    } finally {
      setIsSaving(false);
    }
  };
  // Filter templates based on search
  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const hasUnsavedChanges = selectedTemplates.some(
    (t) => t.status === "selected",
  );
  const selectedCount = selectedTemplates.length;

  return (
    <>
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
        .animate-pulse-slow {
          animation: pulse 2s infinite;
        }
      `}</style>

      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800/50">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm">
              <PhotoIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Template Sertifikat
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Pilih dan kirim template sertifikat
              </p>
            </div>
          </div>

          {/* Status Badge */}
          {attachedTemplate && attachedId && (
            <div className="flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 dark:border-green-800 dark:bg-green-900/20">
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                Aktif: {attachedTemplate.name}
              </span>
            </div>
          )}
        </div>

        {/* Unsaved Changes Alert */}
        {hasUnsavedChanges && (
          <div className="animate-slideDown mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
            <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300">
                Ada perubahan yang belum disimpan
              </h3>
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                {selectedCount} template terpilih. Klik &apos;Kirim
                Template&apos; untuk menyimpan.
              </p>
            </div>
          </div>
        )}

        {/* Template Selection Dropdown: hanya tampil jika tidak ada template terpasang */}
        {!attachedTemplate && !attachedId && (
          <div className="mb-6">
            <label className="mb-3 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Pilih Template
              {selectedCount > 0 && (
                <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                  {selectedCount} terpilih
                </span>
              )}
            </label>
            <div ref={dropdownRef} className="relative">
              {/* Dropdown Trigger */}
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                disabled={isLoading || isSaving}
                className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-3 text-left shadow-sm transition-all hover:border-blue-400 hover:shadow-md focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-blue-500"
              >
                <span className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500"></div>
                      Memuat template...
                    </>
                  ) : selectedCount === 0 ? (
                    <>
                      <PlusIcon className="h-4 w-4 text-gray-400" />
                      Pilih Template
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4 text-blue-500" />
                      {selectedCount} template terpilih
                    </>
                  )}
                </span>
                <ChevronDownIcon
                  className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="animate-slideDown absolute left-0 right-0 top-full z-30 mt-2 max-h-96 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-600 dark:bg-gray-700">
                  {/* Search Input */}
                  <div className="border-b border-gray-200 p-3 dark:border-gray-600">
                    <input
                      type="text"
                      placeholder="Cari template..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>
                  {/* Template Options */}
                  <div className="max-h-72 overflow-auto p-2">
                    {filteredTemplates.map((template) => {
                      const isSelected = selectedTemplates.some(
                        (t) => t.id === template.id,
                      );
                      const sent = sentTemplates.find(
                        (item: any) =>
                          (item.sertifikat_id ||
                            item.certificate_id ||
                            item.id) === template.id,
                      );
                      const isBlocked = sent && sent.status !== "approved";
                      return (
                        <div
                          key={template.id}
                          onClick={() =>
                            !isBlocked && handleTemplateToggle(template)
                          }
                          className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition-all ${
                            isBlocked
                              ? "cursor-not-allowed bg-gray-50 opacity-60 dark:bg-gray-600/50"
                              : isSelected
                                ? "cursor-pointer border border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-100"
                                : "cursor-pointer text-gray-900 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-600"
                          }`}
                        >
                          <div
                            className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                              isBlocked
                                ? "border-gray-300 bg-gray-200 dark:border-gray-500 dark:bg-gray-600"
                                : isSelected
                                  ? "border-blue-500 bg-blue-500"
                                  : "border-gray-300 dark:border-gray-500"
                            }`}
                          >
                            {isSelected && (
                              <CheckIcon className="h-3 w-3 text-white" />
                            )}
                            {isBlocked && (
                              <XMarkIcon className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">
                              {template.name}
                            </p>
                            {template.description && (
                              <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                                {template.description}
                              </p>
                            )}
                            {isBlocked && (
                              <p className="mt-0.5 text-xs text-red-500 dark:text-red-400">
                                Sudah terkirim & belum di-approve
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {filteredTemplates.length === 0 && (
                      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        {searchQuery
                          ? "Tidak ada template yang cocok"
                          : "Tidak ada template tersedia"}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Selected Templates Preview */}
        {selectedTemplates.length > 0 && (
          <div className="mb-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Template Terpilih
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {selectedTemplates.length} template
              </span>
            </div>

            {/* Preview Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {selectedTemplates.map((template) => (
                <div key={template.id} className="animate-scaleIn flex items-center">
                  <button
                    onClick={() => {
                      const base = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
                      const url = `${base}/sertifikat-templates/preview/${template.id}`;
                      window.open(url, "_blank", "noopener,noreferrer");
                    }}
                    className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    title={`Preview PDF: ${template.name}`}
                  >
                    <EyeIcon className="h-4 w-4" />
                    <span className="truncate max-w-[10rem]">{template.name}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State: hanya tampil jika tidak ada template terpasang */}
        {selectedTemplates.length === 0 &&
          !isLoading &&
          !attachedTemplate &&
          !attachedId && (
            <div className="py-12 text-center">
              <PhotoIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
                Belum ada template terpilih
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Pilih template untuk disetujui sebagai template sertifikat
              </p>
            </div>
          )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row">
          {hasProcessingApprove && (
            <div className="mb-2 flex items-center gap-2 rounded-md bg-yellow-100 px-3 py-2 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <span>Processing Approve</span>
            </div>
          )}

          {validationError && (
            <div className="mb-2 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
              <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Save/Send Button */}
          <button
            onClick={handleSaveTemplates}
            disabled={isSaving || selectedTemplates.length === 0 || hasProcessingApprove}
            className={`flex flex-1 items-center justify-center gap-3 rounded-lg px-6 py-3 font-semibold text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
              isSaving
                ? "bg-gray-400"
                : selectedTemplates.length === 0 || hasProcessingApprove
                  ? "bg-gray-300 dark:bg-gray-600"
                  : "bg-green-600 hover:bg-green-700 focus:ring-green-500"
            }`}
            title={hasProcessingApprove ? 'Admin telah mengirim template, menunggu persetujuan instruktur' : undefined}
          >
            {isSaving ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                <span>Mengirim Template...</span>
              </>
            ) : (
              <>
                <PaperAirplaneIcon className="h-5 w-5" />
                <span>Kirim Template</span>
              </>
            )}
          </button>

          {/* Clear Selection Button */}
          {selectedTemplates.length > 0 && (
            <button
              onClick={() => {
                setSelectedTemplates([]);
                setValidationError(null);
                toast.info("Pilihan template telah dihapus");
              }}
              disabled={isSaving}
              className="rounded-lg border border-gray-300 px-4 py-3 text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500/20 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <TrashIcon className="mx-auto h-5 w-5 sm:hidden" />
              <span className="hidden sm:inline">Hapus Semua</span>
            </button>
          )}
        </div>

        {/* Full Preview Modal */}
        {showFullPreview && previewTemplate && (
          <div
            className="animate-fadeIn fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => {
              setShowFullPreview(false);
              setPreviewTemplate(null);
            }}
          >
            <div
              className="animate-scaleIn relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-lg font-semibold text-gray-900">
                    {previewTemplate.name}
                  </h3>
                  {previewTemplate.description && (
                    <p className="mt-1 truncate text-sm text-gray-600">
                      {previewTemplate.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const base = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
                      const url = `${base}/sertifikat-templates/preview/${previewTemplate.id}`;
                      window.open(url, "_blank", "noopener,noreferrer");
                    }}
                    className="flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    title="Buka Preview PDF (stream)"
                  >
                    <EyeIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Open PDF</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowFullPreview(false);
                      setPreviewTemplate(null);
                    }}
                    className="ml-2 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-900"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="bg-gray-50 p-6">
                <div className="flex justify-center">
                  {/* If approved and agentPreviewUrl exists, show agent preview */}
                  {previewTemplate.status === "approved" &&
                  previewTemplate.agentPreviewUrl ? (
                    <Image
                      src={previewTemplate.agentPreviewUrl}
                      alt="Preview Sertifikat Final"
                      width={Math.min(window.innerWidth * 0.7, 600)}
                      height={Math.min(window.innerWidth * 0.7, 600) * 0.7}
                      className="h-auto w-full rounded-xl border shadow"
                      style={{
                        maxHeight: Math.min(window.innerWidth * 0.7, 600) * 1.2,
                      }}
                    />
                  ) : (
                    <TemplatePreview
                      template={previewTemplate}
                      size={Math.min(window.innerWidth * 0.7, 600)}
                      showElements={true}
                      className="shadow-xl"
                    />
                  )}
                </div>

                {/* Template Details */}
                {previewTemplate.elements &&
                  previewTemplate.elements.length > 0 && (
                    <div className="mx-auto mt-6 max-w-2xl">
                      <h4 className="mb-3 text-sm font-medium text-gray-900">
                        Elemen Template ({previewTemplate.elements.length})
                      </h4>
                      <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2 lg:grid-cols-3">
                        {previewTemplate.elements.map((element, index) => (
                          <div
                            key={element.id || index}
                            className="flex items-center gap-2 rounded border bg-white px-2 py-1"
                          >
                            <div
                              className={`h-3 w-3 rounded-full ${
                                element.type === "text"
                                  ? "bg-blue-400"
                                  : element.type === "image"
                                    ? "bg-green-400"
                                    : "bg-purple-400"
                              }`}
                            ></div>
                            <span className="font-medium capitalize">
                              {element.type}
                            </span>
                            {element.type === "text" && element.text && (
                              <span className="truncate text-gray-500">
                                &ldquo;{element.text.substring(0, 15)}...&rdquo;
                              </span>
                            )}
                            {element.type === "shape" && element.shapeType && (
                              <span className="capitalize text-gray-500">
                                {element.shapeType}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default TemplateSelector;
