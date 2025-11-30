"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Upload,
  Save,
  ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import "@/css/custom-fonts.css";
import SidebarEdit from "./SidebarEdit";
import MainCanvasEdit from "./MainCanvasEdit";
import {
  TextElement,
  ImageElement,
  ShapeElement,
  CertificateElement,
  ElementConfig,
  Notification as NotificationInterface,
} from "./interfaces";
import { prepareElementsForBackend } from "./elementUtils";

// Daftar font backend (hardcode sesuai folder di public/fonts)
const backendFonts = [
  "Alice-Alice-Regular",
  "Allura-Allura-Regular",
  "Anonymous_Pro-AnonymousPro-Regular",
  "Anonymous_Pro-AnonymousPro-Bold",
  "Anton-Anton-Regular",
  // ...tambahkan sesuai isi folder font backend
  "Arial",
];

const CANVAS_PX = 842; // Lebar canvas px di frontend
const CANVAS_PT = 842; // Lebar PDF pt di backend
// Multiplier for signature rendering (set to 1 so backend size == frontend placeholder)
const SIGNATURE_SCALE_MULTIPLIER = 1;

interface CertificateEditorProps {
  mode: "create" | "edit";
  onSaveSuccess?: () => void;
  onCancel?: () => void;
  initialData?: {
    id?: number;
    name: string;
    background_image: string | null;
    elements: CertificateElement[];
  };
}

// --- HELPER FUNCTIONS ---
const getFullImageUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
  const cleanUrl = url.replace(/^\/?storage\//, "");
  return `${backendUrl}/storage/${cleanUrl}`;
};

const getRelativePath = (fullUrl: string | null): string => {
  if (!fullUrl) return "";
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
  return fullUrl.replace(backendUrl, "");
};

const CertificateEditor: React.FC<CertificateEditorProps> = ({
  mode,
  initialData,
}) => {
  const router = useRouter();

  // --- STATE & REFS ---
  const [templateName, setTemplateName] = useState<string>(
    initialData?.name || "",
  );
  const [backgroundImage, setBackgroundImage] = useState<string | null>(
    getFullImageUrl(initialData?.background_image),
  );
  const [elements, setElements] = useState<CertificateElement[]>(
    initialData?.elements.map((el) => {
      // Normalize image URLs
      if (el.type === "image" && el.imageUrl) {
        return { ...el, imageUrl: getFullImageUrl(el.imageUrl) || el.imageUrl };
      }

      // Backend stores text elements' x as the left edge when preparing for PDF
      // (elementUtils shifts center/right to left before saving). Frontend expects
      // x to be the original placement (center or right positions when using
      // CSS translateX(-50%)/(-100%)). Convert back here so rendering stays
      // visually consistent after loading from backend.
      if (el.type === "text") {
        const width = (el as any).width ?? 0;
        let displayX = el.x;
        if (el.textAlign === "center" && width) {
          displayX = Math.round(el.x + width / 2);
        } else if (el.textAlign === "right" && width) {
          displayX = Math.round(el.x + width);
        }
        return { ...el, x: displayX } as CertificateElement;
      }

      return el;
    }) || [],
  );
  const [notification, setNotification] =
    useState<NotificationInterface | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [elementType, setElementType] = useState<
    "text" | "image" | "shape" | "qrcode" | "signature"
  >("text");
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [tempEditText, setTempEditText] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  const defaultElementConfig: ElementConfig = {
    // common
    width: 200,
    height: 80,
    scale: 1,
    rotation: 0,

    // text
    text: "",
    fontSize: 16,
    fontFamily: "Arial",
    fontWeight: "normal",
    fontStyle: "normal",
    textAlign: "left",
    placeholderType: "custom",

    // shape
    shapeType: "rectangle",
    fillColor: "#3B82F6",
    strokeColor: "#1E40AF",
    strokeWidth: 2,
    borderRadius: 0,
    opacity: 1,

    // image/signature
    imageUrl: "",
    imageSizeMode: "custom",
  };

  const [elementConfig, setElementConfig] =
    useState<ElementConfig>(defaultElementConfig);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);

  const certificateCanvasRef = useRef<HTMLDivElement>(null);

  // --- DRAG STATE ---
  const dragStateRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  } | null>(null);
  // requestAnimationFrame id for throttling mousemove updates
  const rafRef = useRef<number | null>(null);

  // Keep a ref to the remove handler so effects can call it without creating a new dependency
  const removeHandlerRef = useRef<(id: string) => void>(() => {});

  // flag untuk mencegah loop saat sync signature
  const [configFromElement, setConfigFromElement] = useState(false);

  // --- EFFECTS ---
  useEffect(() => {
    api.get("/sanctum/csrf-cookie").catch(console.error);
  }, []);

  // Update teks placeholder saat jenis text dipilih/berubah
  useEffect(() => {
    if (elementType === "text") {
      const placeholders = {
        name: "{NAMA}",
        number: "{NOMOR}",
        date: "{TANGGAL}",
        instructure: "{INSTRUCTURE}",
        role_caption: "{ROLE_CAPTION}",
        title: "{JUDUL}",
        custom: "",
      } as const;

      const placeholderType = elementConfig.placeholderType || "custom";
      const text = placeholders[placeholderType as keyof typeof placeholders];
      setElementConfig((prev) => ({
        ...prev,
        text: text,
      }));
    }
  }, [elementConfig.placeholderType, elementType]);

  // Ketika memilih elemen baru, sidebar mengikuti properti elemen terpilih
  useEffect(() => {
    if (!selectedElementId) return;
    const el = elements.find((el) => el.id === selectedElementId);
    if (!el) return;

    if (el.type === "text") {
      setElementConfig((prev) => {
        if (
          prev.fontSize === el.fontSize &&
          prev.fontFamily === el.fontFamily &&
          prev.fontWeight === el.fontWeight &&
          prev.fontStyle === el.fontStyle &&
          prev.textAlign === el.textAlign &&
          prev.text === el.text &&
          prev.placeholderType === el.placeholderType
        ) {
          return prev;
        }
        return {
          ...prev,
          fontSize: el.fontSize,
          fontFamily: el.fontFamily,
          fontWeight: el.fontWeight,
          fontStyle: el.fontStyle,
          textAlign: el.textAlign,
          text: el.text,
          placeholderType: el.placeholderType,
        };
      });
    } else if (el.type === "image") {
      setElementConfig((prev) => {
        const scl = typeof el.scale === "number" ? el.scale : 1;
        const mode = el.imageSizeMode || "custom";
        if (
          prev.width === el.width &&
          prev.height === el.height &&
          prev.imageUrl === el.imageUrl &&
          (prev.imageSizeMode || "custom") === mode &&
          (prev.rotation ?? 0) === (el.rotation ?? 0) &&
          (typeof prev.scale === "number" ? prev.scale : 1) === scl
        ) {
          return prev;
        }
        return {
          ...prev,
          width: el.width,
          height: el.height,
          imageUrl: el.imageUrl,
          imageSizeMode: mode,
          rotation: el.rotation ?? 0,
          scale: scl,
        };
      });
    } else if (el.type === "shape") {
      setElementConfig((prev) => {
        const br = typeof el.borderRadius === "number" ? el.borderRadius : 0;
        const op = typeof el.opacity === "number" ? el.opacity : 1;
        if (
          prev.shapeType === el.shapeType &&
          prev.width === el.width &&
          prev.height === el.height &&
          prev.fillColor === el.fillColor &&
          prev.strokeColor === el.strokeColor &&
          prev.strokeWidth === el.strokeWidth &&
          (typeof prev.borderRadius === "number" ? prev.borderRadius : 0) === br &&
          (typeof prev.opacity === "number" ? prev.opacity : 1) === op
        ) {
          return prev;
        }
        return {
          ...prev,
          shapeType: el.shapeType,
          width: el.width,
          height: el.height,
          fillColor: el.fillColor,
          strokeColor: el.strokeColor,
          strokeWidth: el.strokeWidth,
          borderRadius: br,
          opacity: op,
        };
      });
    } else if (el.type === "signature") {
      // For signatures, use fixed 200x80 size
      setElementConfig((prev) => ({
        ...prev,
        width: 200,
        height: 80,
        scale: typeof (el as any).scale === "number" ? (el as any).scale : 1,
        imageUrl: (el as any).imageUrl || ""
      }));
    }
  }, [selectedElementId, elements]);

  // Propagate perubahan sidebar → elemen (khusus signature) tanpa loop
  // NOTE: we intentionally guard inside the effect to avoid writing back when
  // only position (x/y) changes; including `elements` in dependencies is
  // necessary to satisfy the hooks rule and ensure correct sync when other
  // element properties change.
  useEffect(() => {
    if (!selectedElementId) return;
    const sel = elements.find((el) => el.id === selectedElementId);
    if (!sel || sel.type !== "signature") return;

    // For signatures, only sync imageUrl and scale while keeping size fixed.
    // Avoid calling setElements on every render to prevent update loops.
    const selIndex = elements.findIndex((el) => el.id === selectedElementId);
    if (selIndex === -1) return;
    const selEl = elements[selIndex] as any;
    const desiredImageUrl = elementConfig.imageUrl || selEl.imageUrl || "";
    const desiredScale = typeof elementConfig.scale === "number" ? elementConfig.scale : selEl.scale || 1;

    const shouldUpdate =
      selEl.width !== 200 ||
      selEl.height !== 80 ||
      selEl.scale !== desiredScale ||
      (selEl.imageUrl || "") !== desiredImageUrl;

    if (!shouldUpdate) return;

    setElements((prev) =>
      prev.map((el) => {
        if (el.id !== selectedElementId || el.type !== "signature") return el;
        return {
          ...(el as any),
          width: 200,
          height: 80,
          scale: desiredScale,
          imageUrl: desiredImageUrl,
        } as CertificateElement;
      }),
    );
  // Include `elements` in deps so the effect reacts to element changes.
  // Internal guards prevent writes when the change is only positional (x/y),
  // avoiding feedback loops.
  }, [
    selectedElementId,
    elementConfig.width,
    elementConfig.height,
    elementConfig.scale,
    elementConfig.imageUrl,
    configFromElement,
    elements,
  ]);

  // Upload image util
  const showNotification = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const uploadImage = async (
    file: File,
    fieldName: string,
  ): Promise<string | null> => {
    const formData = new FormData();
    formData.append(fieldName, file);
    try {
      const response = await api.post(
        "/sertifikat-templates/upload-image",
        formData,
      );
      const relativeUrl = response.data.url;
      if (!relativeUrl) throw new Error("URL gambar tidak ditemukan.");
      return getFullImageUrl(relativeUrl);
    } catch (error: any) {
      showNotification(
        error.response?.data?.message || "Upload gambar gagal",
        "error",
      );
      return null;
    }
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "background" | "element",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      return showNotification("Format file harus berupa gambar", "error");
    }
    if (file.size > 2 * 1024 * 1024) {
      return showNotification("Ukuran file maksimal 2MB", "error");
    }

    setIsUploading(true);
    const fieldName =
      type === "background" ? "background_image" : "element_image";
    const absoluteUrl = await uploadImage(file, fieldName);

    if (absoluteUrl) {
      if (type === "element") {
        const previewUrl = URL.createObjectURL(file);
        // Keep a local preview for immediate UI, but persist server URL into elementConfig
        setImagePreview(previewUrl);
        setUploadedImageUrl(absoluteUrl);

        // Default uploaded image dimensions to 100x100 unless user uses 'full' mode
        setElementConfig((prev) => ({
          ...prev,
          imageUrl: absoluteUrl,
          width: prev.imageSizeMode === "full" ? prev.width : prev.width ?? 100,
          height: prev.imageSizeMode === "full" ? prev.height : prev.height ?? 100,
        }));

        // If mode full is selected, override with natural dimensions after load
        const img = new window.Image();
        img.onload = () => {
          setElementConfig((prev) => {
            if (prev.imageSizeMode === "full") {
              return {
                ...prev,
                width: img.naturalWidth,
                height: img.naturalHeight,
              };
            }
            // For non-full mode, set default 100x100 but preserve signature size
            return {
              ...prev,
              width: elementType === "signature" ? 200 : 100,
              height: elementType === "signature" ? 80 : 100,
            };
          });
        };
        img.src = previewUrl;

        // If an element is currently selected and it's an image/signature, update it to use the uploaded URL
        if (selectedElementId) {
          setElements((prev) =>
            prev.map((el) =>
              el.id === selectedElementId &&
              (el.type === "image" || el.type === "signature")
                ? { ...el, imageUrl: absoluteUrl }
                : el,
            ),
          );
        }

        showNotification("Gambar elemen berhasil diupload");
      } else {
        setBackgroundImage(absoluteUrl);
        showNotification("Gambar background berhasil diupload");
      }
    }
    setIsUploading(false);
    e.target.value = "";
  };

  // Jika user ganti mode imageSizeMode ke full, set width/height ke dimensi asli gambar preview (jika ada)
  useEffect(() => {
    if (
      elementType === "image" &&
      elementConfig.imageSizeMode === "full" &&
      elementConfig.imageUrl
    ) {
      const img = new window.Image();
      img.onload = () => {
        setElementConfig((prev) => ({
          ...prev,
          width: img.naturalWidth,
          height: img.naturalHeight,
        }));
      };
      img.src = elementConfig.imageUrl;
    }
  }, [elementConfig.imageSizeMode, elementConfig.imageUrl, elementType]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedElementId) {
          removeHandlerRef.current(selectedElementId);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedElementId]);

  const handleAddElement = (prebuiltElement?: Partial<CertificateElement>) => {
    const canvas = certificateCanvasRef.current;
    const defaultX = canvas ? canvas.offsetWidth / 2 : 421;
    const defaultY = canvas ? canvas.offsetHeight / 2 : 297;
    const newElementBase = {
      id: `element-${Date.now()}`,
      x: defaultX,
      y: defaultY,
    };

    if (elementType === "text") {
      if (
        elementConfig.placeholderType === "custom" &&
        !elementConfig.text.trim()
      ) {
        return showNotification("Harap masukkan teks", "error");
      }

      const newTextElement: TextElement = {
        ...newElementBase,
        type: "text",
        text: elementConfig.text,
        fontSize: elementConfig.fontSize,
        fontFamily: elementConfig.fontFamily,
        fontWeight: elementConfig.fontWeight,
        fontStyle: elementConfig.fontStyle,
        textAlign: elementConfig.textAlign,
        placeholderType: elementConfig.placeholderType,
      };

      setElements((prev) => [...prev, newTextElement]);
    } else if (elementType === "shape") {
      const newShapeElement: ShapeElement = {
        ...newElementBase,
        type: "shape",
        shapeType: elementConfig.shapeType || "rectangle",
        width: elementConfig.width || 100,
        height: elementConfig.height || 100,
        fillColor: elementConfig.fillColor || "#3B82F6",
        strokeColor: elementConfig.strokeColor || "#1E40AF",
        strokeWidth: elementConfig.strokeWidth || 2,
        borderRadius: elementConfig.borderRadius || 0,
        opacity: elementConfig.opacity || 1,
        rotation: 0,
      };

      setElements((prev) => [...prev, newShapeElement]);
    } else if (elementType === "signature") {
      const newSignature: CertificateElement = {
        ...newElementBase,
        type: "signature",
        // Fixed signature size
        width: 200,
        height: 80,
        scale: typeof elementConfig.scale === "number" ? elementConfig.scale : 1,
        imageUrl: elementConfig.imageUrl || "{INSTRUKTUR_SIGNATURE}",
      } as CertificateElement;
      setElements((prev) => [...prev, newSignature]);
    } else {
      if (elementType === "qrcode") {
        const newQr: CertificateElement = {
          ...newElementBase,
          type: "qrcode",
          width: 100,
          height: 100,
        } as any;
        setElements((prev) => [...prev, newQr]);
        showNotification("Elemen QR Code berhasil ditambahkan");
        return;
      }

      if (!uploadedImageUrl || !elementConfig.imageUrl) {
        return showNotification("Harap upload gambar elemen", "error");
      }

      const newImageElement: ImageElement = {
        ...newElementBase,
        type: "image",
        imageUrl: uploadedImageUrl, // URL backend
        width: elementConfig.width || 100,
        height: elementConfig.height || 100,
        rotation: elementConfig.rotation || 0,
        imageSizeMode: elementConfig.imageSizeMode || "custom",
        scale: elementConfig.scale || 1,
      };

      setElements((prev) => [...prev, newImageElement]);
      setImagePreview(null);
      setUploadedImageUrl(null);
    }
    showNotification("Elemen berhasil ditambahkan");
  };

  const handleRemoveElement = (id: string) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
    if (editingElementId === id) {
      setEditingElementId(null);
      setTempEditText("");
    }
    showNotification("Elemen berhasil dihapus", "success");
  };

  // keep ref updated to latest implementation
  removeHandlerRef.current = handleRemoveElement;

  const handleStartEditing = (element: TextElement) => {
    if (element.placeholderType !== "custom") {
      showNotification(
        "Placeholder elements cannot be edited directly",
        "error",
      );
      return;
    }
    setEditingElementId(element.id);
    setTempEditText(element.text);
  };

  const handleFinishEditing = () => {
    if (editingElementId && tempEditText.trim()) {
      setElements((prev) =>
        prev.map((el) =>
          el.id === editingElementId && el.type === "text"
            ? { ...el, text: tempEditText.trim() }
            : el,
        ),
      );
      showNotification("Text updated successfully");
    }
    setEditingElementId(null);
    setTempEditText("");
  };

  const handleEditKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleFinishEditing();
    } else if (e.key === "Escape") {
      setEditingElementId(null);
      setTempEditText("");
    }
  };

  const handleMouseDown = (
    e: React.MouseEvent,
    element: CertificateElement,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (editingElementId) return;

    setSelectedElementId(element.id);
    dragStateRef.current = {
      id: element.id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: element.x,
      initialY: element.y,
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragStateRef.current) return;

    const { id, startX, startY, initialX, initialY } = dragStateRef.current;
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    // throttle updates to animation frames to avoid rapid state churn
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      setElements((prev) =>
        prev.map((el) =>
          el.id === id
            ? { ...el, x: initialX + deltaX, y: initialY + deltaY }
            : el,
        ),
      );
    });
  };

  const handleMouseUp = () => {
    dragStateRef.current = null;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).classList.contains("canvas-container")) {
      setSelectedElementId(null);
    }
  };

  const handleUpdateElement = (id: string, updates: Partial<CertificateElement>) => {
    // Update the elements array for any element type. This ensures text/font
    // changes from the sidebar are applied to the selected element on canvas.
    setElements((prev) =>
      prev.map((el) => {
        if (el.id !== id) return el;
        return { ...el, ...updates } as CertificateElement;
      }),
    );

    // If the updated element is currently selected, also merge into the
    // sidebar's elementConfig so the UI stays in sync.
    if (selectedElementId === id) {
      setElementConfig((prevConfig) => ({ ...prevConfig, ...(updates as any) }));
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName) {
      return showNotification("Harap masukkan nama template", "error");
    }
    if (!backgroundImage) {
      return showNotification("Harap upload background", "error");
    }

    setIsSaving(true);

    // Ensure signature elements include explicit final size (apply element scale and canvas ratio)
    const ratio = CANVAS_PT / CANVAS_PX; // convert frontend px -> backend pt
    const elementsForBackend = elements.map((el) => {
      if (el.type === "signature") {
        const sig: any = el;
        const scale = typeof sig.scale === "number" ? sig.scale : 1;
  const rawW = typeof sig.width === "number" ? sig.width : 200;
  const rawH = typeof sig.height === "number" ? sig.height : 80;
        const finalW = Math.round(rawW * scale * ratio * SIGNATURE_SCALE_MULTIPLIER);
        const finalH = Math.round(rawH * scale * ratio * SIGNATURE_SCALE_MULTIPLIER);

  // Frontend stores signature x/y as top-left (px). Convert directly to pt for backend.
  const pxX = typeof sig.x === "number" ? sig.x : 0;
  const pxY = typeof sig.y === "number" ? sig.y : 0;
  const finalX = Math.round(pxX * ratio);
  const finalY = Math.round(pxY * ratio);

        return {
          ...sig,
          width: finalW,
          height: finalH,
          x: finalX,
          y: finalY,
        } as any;
      }
      return el;
    });

    const templateData = {
      name: templateName,
      background_image: getRelativePath(backgroundImage),
      elements: prepareElementsForBackend(elementsForBackend),
    };
  const merchantId = Number(localStorage.getItem("merchant_id") || "0") || 1;
  const templateDataWithMerchant = { ...templateData, merchant_id: merchantId };

    try {
      if (mode === "edit" && initialData?.id) {
        await api.put(`/sertifikat-templates/${initialData.id}`, templateDataWithMerchant);
        showNotification("Template berhasil diperbarui");
      } else {
        await api.post("/sertifikat-templates", templateDataWithMerchant);
        showNotification("Template berhasil dibuat");
      }

      setTimeout(() => {
        router.push("/admin/tabel-sertifikat");
      }, 2000);
    } catch (error: any) {
      showNotification(
        error.response?.data?.message || "Gagal menyimpan template",
        "error",
      );
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans dark:bg-slate-900">
      {notification && (
        <div
          className={`fixed right-5 top-5 z-50 rounded-lg px-5 py-3 text-white shadow-lg transition-all duration-300 ${
            notification.type === "success" ? "bg-emerald-500" : "bg-red-500"
          }`}
        >
          {notification.message}
        </div>
      )}

      <header className="border-b border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <ArrowLeft size={18} />
              <span className="text-sm font-medium sm:text-base">Batal</span>
            </button>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={handleSaveTemplate}
                disabled={isSaving || isUploading}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={16} />
                <span className="text-sm font-semibold">
                  {isSaving ? "Menyimpan..." : "Simpan"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-65px)]">
        <div
          className={`w-[380px] border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 lg:block`}
        >
          <SidebarEdit
            templateName={templateName}
            setTemplateName={setTemplateName}
            handleFileChange={handleFileChange}
            elementType={elementType}
            setElementType={setElementType}
            elementConfig={elementConfig}
            setElementConfig={setElementConfig}
            elements={elements}
            handleAddElement={handleAddElement}
            handleStartEditing={handleStartEditing}
            handleRemoveElement={handleRemoveElement}
            handleUpdateElement={handleUpdateElement}
            editingElementId={editingElementId}
            selectedElementId={selectedElementId}
            tempEditText={tempEditText}
            setTempEditText={setTempEditText}
            handleEditKeyPress={handleEditKeyPress}
            handleFinishEditing={handleFinishEditing}
          />
        </div>

        <MainCanvasEdit
          canvasRef={certificateCanvasRef}
          backgroundImage={backgroundImage}
          elements={elements}
          selectedElementId={selectedElementId}
          editingElementId={editingElementId}
          tempEditText={tempEditText}
          editInputRef={editInputRef}
          handleCanvasClick={handleCanvasClick}
          handleMouseDown={handleMouseDown}
          handleStartEditing={handleStartEditing}
          handleFinishEditing={handleFinishEditing}
          handleKeyPress={handleEditKeyPress}
          handleUpdateElement={handleUpdateElement}
          setTempEditText={setTempEditText}
          setSelectedElementId={setSelectedElementId}
          // prop ini opsional di MainCanvasEdit, oke bila diabaikan
          setElementType={setElementType as any}
        />
      </div>
    </div>
  );
};

export default CertificateEditor;
