"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Save, ArrowLeft } from "lucide-react";
import api from "@/lib/axios";
import { AxiosError } from "axios";
import SidebarCreate from "./SidebarCreate/SidebarCreate";
import MainCanvasCreate from "./MainCanvasCreate/MainCanvasCreate";
import {
  TextElement,
  ImageElement,
  ShapeElement,
  CertificateElement,
  ElementConfig,
  Notification,
  SignatureElement,
} from "./interfaces";
import { prepareElementsForBackend } from "./elementUtils";

// ====== KONFIG BACKEND FONTS (sinkron dengan backend) ======
const backendFonts = [

  "Arimo/Arimo-Regular",
  "Arimo/Arimo-Bold",
  "Arimo/Arimo-Italic",
  "Barlow/Barlow-Regular",
  "Barlow/Barlow-Bold",
  "Barlow/Barlow-Italic",
  "Cormorant_Garamond/CormorantGaramond-Regular",
  "Cormorant_Garamond/CormorantGaramond-Bold",
  "Cormorant_Garamond/CormorantGaramond-Italic",
  "DM_Sans/DMSans_18pt-Regular",
  "DM_Sans/DMSans_18pt-Bold",
  "DM_Sans/DMSans_18pt-Italic",
  "Inter/Inter_18pt-Regular",
  "Inter/Inter_18pt-Bold",
  "Inter/Inter_18pt-Italic",
  "League_Spartan/LeagueSpartan-Regular",
  "League_Spartan/LeagueSpartan-Bold",
  "Lora/Lora-Regular",
  "Lora/Lora-Bold",
  "Lora/Lora-Italic",
  "Merriweather/Merriweather_24pt-Regular",
  "Merriweather/Merriweather_24pt-Bold",
  "Merriweather/Merriweather_24pt-Italic",
  "Montserrat/Montserrat-Regular",
  "Montserrat/Montserrat-Bold",
  "Montserrat/Montserrat-Italic",
  "Nunito/Nunito-Regular",
  "Nunito/Nunito-Bold",
  "Nunito/Nunito-Italic",
  "Open_Sans/OpenSans-Regular",
  "Open_Sans/OpenSans-Bold",
  "Open_Sans/OpenSans-Italic",
  "Oswald/Oswald-Regular",
  "Oswald/Oswald-Bold",
  "Playfair_Display/PlayfairDisplay-Regular",
  "Playfair_Display/PlayfairDisplay-Bold",
  "Playfair_Display/PlayfairDisplay-Italic",
  "Poppins/Poppins-Regular",
  "Poppins/Poppins-Bold",
  "Poppins/Poppins-Italic",
  "Quicksand/Quicksand-Regular",
  "Quicksand/Quicksand-Bold",
  "Raleway/Raleway-Regular",
  "Raleway/Raleway-Bold",
  "Raleway/Raleway-Italic",
  "Roboto/Roboto-Regular",
  "Roboto/Roboto-Bold",
  "Roboto/Roboto-Italic",
  // Fonts kustom
  "brittany_2/Brittany",
  "breathing/Breathing Personal Use Only",
  "brighter/Brighter Regular",
  "Bryndan Write/BryndanWriteBook",
  "caitlin_angelica/Caitlin Angelica",
  "railey/Railey-Personal",
  "more_sugar/More Sugar",
  "sans-serif/Arial-Regular",
];

const CANVAS_PX = 842; // Lebar canvas px di frontend
const CANVAS_PT = 842; // Lebar PDF pt di backend
// Multiplier for signature rendering. Use 1 so created signatures keep the
// frontend placeholder size (200x80) when persisted. Previously set to 2,
// which caused created templates to save double-sized signature elements.
const SIGNATURE_SCALE_MULTIPLIER = 1;

const getFullImageUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;

  if (url.startsWith("http")) {
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

const CertificateCreate: React.FC = () => {
  // ====== CORE STATE ======
  const [templateName, setTemplateName] = useState("");
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [elements, setElements] = useState<CertificateElement[]>([]);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // ====== ELEMENT CREATION / SIDEBAR STATE (sinkron dengan Editor) ======
  const [elementType, setElementType] = useState<"text" | "image" | "shape" | "qrcode" | "signature">("text");

  const defaultElementConfig: ElementConfig = {
    // Common properties
    width: 200,
    height: 80,
    scale: 1,
    rotation: 0,

    // Text
    text: "",
    fontSize: 16,
    fontFamily: "Arial",
    fontWeight: "normal",
    fontStyle: "normal",
    textAlign: "left",
    placeholderType: "custom",

    // Shape
    shapeType: "rectangle",
    fillColor: "#3B82F6",
    strokeColor: "#1E40AF",
    strokeWidth: 2,
    borderRadius: 0,
    opacity: 1,

    // Image/Signature
    imageUrl: "",
    imageSizeMode: "custom",
    instructorId: undefined
  };
  const [elementConfig, setElementConfig] = useState(defaultElementConfig);

  // Untuk upload image: pisahkan preview vs URL backend final
  const [imagePreview, setImagePreview] = useState<string | null>(null);       // ObjectURL
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null); // URL backend

  // ====== EDITING STATE ======
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [tempEditText, setTempEditText] = useState("");

  // ====== REFS ======
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const editInputRef = useRef<HTMLInputElement | null>(null);
  const dragStateRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  } | null>(null);

  const removeHandlerRef = useRef<(id: string) => void>(() => {});

  // ====== UTILS ======
  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const getRelativePath = (fullUrl: string): string => {
    const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
    if (!backendUrl) {
      try {
        const u = new URL(fullUrl);
        return u.pathname + u.search + u.hash;
      } catch (e) {
        return fullUrl;
      }
    }
    return fullUrl.replace(backendUrl, "");
  };

  // ====== INIT CSRF (menyamai Editor) ======
  useEffect(() => {
    api.get("/sanctum/csrf-cookie").catch(console.error);
  }, []);

  // ====== PLACEHOLDER MAPPING (selaras dengan Editor) ======
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

      const text = placeholders[elementConfig.placeholderType as keyof typeof placeholders];
  setElementConfig((prev: ElementConfig) => ({ ...prev, text }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elementConfig.placeholderType, elementType]);

  // ====== FOCUS saat edit teks ======
  useEffect(() => {
    if (editingElementId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingElementId]);

  // ====== Saat memilih elemen di canvas, sidebar mengikuti (TEKS & GAMBAR) ======
  useEffect(() => {
    if (!selectedElementId) return;
    const el = elements.find((e) => e.id === selectedElementId);
    if (!el) return;

    if (el.type === "text") {
      setElementType("text");
      setElementConfig((prev: ElementConfig) => ({
        ...prev,
        text: el.text || "",
        fontSize: el.fontSize ?? prev.fontSize,
        fontFamily: el.fontFamily ?? prev.fontFamily,
        fontWeight: el.fontWeight ?? prev.fontWeight,
        fontStyle: el.fontStyle ?? prev.fontStyle,
        textAlign: el.textAlign ?? prev.textAlign,
        placeholderType: el.placeholderType ?? prev.placeholderType,
      }));
    } else if (el.type === "image") {
      setElementType("image");
      setElementConfig((prev: ElementConfig) => ({
        ...prev,
        width: el.width ?? prev.width,
        height: el.height ?? prev.height,
  imageUrl: el.imageUrl || prev.imageUrl || "/logo.png", // always string
        imageSizeMode: el.imageSizeMode || "custom",
        rotation: el.rotation ?? 0,
        scale: typeof el.scale === "number" ? el.scale : 1,
      }));
    } else if (el.type === "signature") {
      setElementType("signature");
      setElementConfig((prev: ElementConfig) => ({
        ...prev,
        width: el.width ?? prev.width,
        height: el.height ?? prev.height,
        scale: typeof el.scale === "number" ? el.scale : 1,
      }));
    } else if (el.type === "shape") {
      setElementType("shape");
      setElementConfig((prev: ElementConfig) => {
        if (
          prev.shapeType === el.shapeType &&
          prev.width === el.width &&
          prev.height === el.height &&
          prev.fillColor === el.fillColor &&
          prev.strokeColor === el.strokeColor &&
          prev.strokeWidth === el.strokeWidth &&
          (typeof prev.borderRadius === "number" ? prev.borderRadius : 0) === (typeof el.borderRadius === "number" ? el.borderRadius : 0) &&
          (typeof prev.opacity === "number" ? prev.opacity : 1) === (typeof el.opacity === "number" ? el.opacity : 1)
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
          borderRadius: typeof el.borderRadius === "number" ? el.borderRadius : 0,
          opacity: typeof el.opacity === "number" ? el.opacity : 1,
        };
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedElementId]);

  // ====== Jika property di sidebar berubah, update elemen terpilih (TEKS & GAMBAR sinkron) ======
  useEffect(() => {
    if (!selectedElementId) return;

    setElements((prev) =>
      prev.map((el) => {
        if (el.id !== selectedElementId) return el;

        if (el.type === "text") {
          if (
            el.fontSize !== elementConfig.fontSize ||
            el.fontFamily !== elementConfig.fontFamily ||
            el.fontWeight !== elementConfig.fontWeight ||
            el.fontStyle !== elementConfig.fontStyle ||
            el.textAlign !== elementConfig.textAlign
          ) {
            return {
              ...el,
              fontSize: elementConfig.fontSize,
              fontFamily: elementConfig.fontFamily,
              fontWeight: elementConfig.fontWeight,
              fontStyle: elementConfig.fontStyle,
              textAlign: elementConfig.textAlign,
            } as TextElement;
          }
        } else if (el.type === "signature") {
          if (
            el.width !== elementConfig.width ||
            el.height !== elementConfig.height ||
            el.scale !== elementConfig.scale
          ) {
            return {
              ...el,
              width: elementConfig.width ?? el.width,
              height: elementConfig.height ?? el.height,
              scale: elementConfig.scale ?? el.scale,
            } as SignatureElement;
          }
        } else if (el.type === "image") {
          const currentScale = typeof (el as ImageElement).scale === "number" ? (el as ImageElement).scale : 1;
          const newScale = typeof elementConfig.scale === "number" ? elementConfig.scale : 1;

          if (
            el.width !== elementConfig.width ||
            el.height !== elementConfig.height ||
            (el as ImageElement).rotation !== (elementConfig.rotation ?? 0) ||
            ((el as ImageElement).imageSizeMode || "custom") !== (elementConfig.imageSizeMode || "custom") ||
            currentScale !== newScale
          ) {
            return {
              ...el,
              width: elementConfig.width,
              height: elementConfig.height,
              rotation: elementConfig.rotation ?? 0,
              imageSizeMode: elementConfig.imageSizeMode || "custom",
              scale: newScale,
            } as ImageElement;
          }
        } else if (el.type === "shape") {
          // sinkronisasi shape dari sidebar (bila sidebar mengubah langsung)
          return {
            ...el,
            shapeType: elementConfig.shapeType,
            width: elementConfig.width,
            height: elementConfig.height,
            fillColor: elementConfig.fillColor,
            strokeColor: elementConfig.strokeColor,
            strokeWidth: elementConfig.strokeWidth,
            borderRadius: elementConfig.shapeType === "rectangle" ? elementConfig.borderRadius : 0,
            opacity: elementConfig.opacity,
          } as ShapeElement;
        }
        return el;
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedElementId,
    elementConfig.fontSize,
    elementConfig.fontFamily,
    elementConfig.fontWeight,
    elementConfig.fontStyle,
    elementConfig.textAlign,
    elementConfig.width,
    elementConfig.height,
    elementConfig.rotation,
    elementConfig.imageSizeMode,
    elementConfig.scale,
    elementConfig.shapeType,
    elementConfig.fillColor,
    elementConfig.strokeColor,
    elementConfig.strokeWidth,
    elementConfig.borderRadius,
    elementConfig.opacity,
  ]);

  // ====== Jika user memilih mode FULL pada image, auto set ukuran natural ======
  useEffect(() => {
    if (elementType !== "image") return;
    if (elementConfig.imageSizeMode !== "full") return;

    const src = imagePreview || elementConfig.imageUrl;
    if (!src) return;

    const img = new window.Image();
    img.onload = () => {
      setElementConfig((prev: ElementConfig) => ({
        ...prev,
        width: img.naturalWidth,
        height: img.naturalHeight,
      }));
    };
    img.src = src;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elementConfig.imageSizeMode, elementConfig.imageUrl, imagePreview, elementType]);

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

  // ====== UPLOAD IMAGE ======
  const uploadImage = async (file: File, fieldName: string): Promise<string | null> => {
    const formData = new FormData();
    formData.append(fieldName, file);

    try {
      const response = await api.post("/sertifikat-templates/upload-image", formData);
      const relativeUrl = response.data?.url;
      if (!relativeUrl) throw new Error("URL tidak ditemukan dalam response");

      return getFullImageUrl(relativeUrl);
    } catch (error) {
      if (error instanceof AxiosError) {
        showNotification(error.response?.data?.message || "Upload gambar gagal", "error");
      } else {
        showNotification("Upload gambar gagal", "error");
      }
      return null;
    }
  };

  // ====== HANDLE FILE ======
  const handleFileUpload = async (file: File, type: "background" | "element") => {
    if (!file.type.startsWith("image/")) {
      showNotification("Format file harus berupa gambar", "error");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showNotification("Ukuran file maksimal 2MB", "error");
      return;
    }

    setIsUploading(true);
    const fieldName = type === "background" ? "background_image" : "element_image";
    const fullUrl = await uploadImage(file, fieldName);

      if (fullUrl) {
      if (type === "background") {
        setBackgroundImage(fullUrl);
        showNotification("Background berhasil diupload");
      } else {
        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);
        setUploadedImageUrl(fullUrl);

        // Set default dimensions for uploaded images: 100x100 when not using 'full' mode.
        setElementConfig((prev: ElementConfig) => ({
          ...prev,
          // keep server URL separate; preview used for immediate UI
          imageUrl: previewUrl,
          width: prev.imageSizeMode === "full" ? prev.width : prev.width ?? 100,
          height: prev.imageSizeMode === "full" ? prev.height : prev.height ?? 100,
        }));

        // Jika user sudah memilih "full", override ukuran dengan dimensi natural setelah load
        const img = new window.Image();
        img.onload = () => {
          setElementConfig((prev: ElementConfig) => {
            if (prev.imageSizeMode === "full") {
              return {
                ...prev,
                imageUrl: previewUrl,
                width: img.naturalWidth,
                height: img.naturalHeight,
              };
            }
            return prev; // leave as previously set (100x100 default)
          });
        };
        img.src = previewUrl;

        showNotification("Gambar elemen berhasil diupload");
      }
    }
    setIsUploading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "background" | "element") => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleFileUpload(file, type);
    e.target.value = "";
  };

  // ====== ADD ELEMENT (teks / shape / image) ======
  const handleAddElement = () => {
    const canvas = canvasRef.current;
    const defaultX = canvas ? canvas.offsetWidth / 2 : 421;
    const defaultY = canvas ? canvas.offsetHeight / 2 : 297;

    const base = {
      id: `element-${Date.now()}`,
      x: defaultX,
      y: defaultY,
    };

    if (elementType === "text") {
      if (elementConfig.placeholderType === "custom" && !elementConfig.text.trim()) {
        showNotification("Harap masukkan teks", "error");
        return;
      }

      const newText: TextElement = {
        ...base,
        type: "text",
        text: elementConfig.text,
        fontSize: elementConfig.fontSize,
        fontFamily: elementConfig.fontFamily,
        fontWeight: elementConfig.fontWeight,
        fontStyle: elementConfig.fontStyle,
        textAlign: elementConfig.textAlign,
        placeholderType: elementConfig.placeholderType,
      };
      setElements((prev) => [...prev, newText]);
    } else if (elementType === "shape") {
      const newShape: ShapeElement = {
        ...base,
        type: "shape",
        shapeType: elementConfig.shapeType || "rectangle",
        width: elementConfig.width || 100,
        height: elementConfig.height || 100,
        fillColor: elementConfig.fillColor || "#3B82F6",
        strokeColor: elementConfig.strokeColor || "#1E40AF",
        strokeWidth: elementConfig.strokeWidth || 2,
        borderRadius: elementConfig.shapeType === "rectangle" ? elementConfig.borderRadius || 0 : 0,
        opacity: elementConfig.opacity || 1,
        rotation: 0,
      };
      setElements((prev) => [...prev, newShape]);
    } else if (elementType === "qrcode") {
      const newQrCode: CertificateElement = {
        ...base,
        type: "qrcode",
        width: 100,
        height: 100,
      };
      setElements((prev) => [...prev, newQrCode]);
    } else if (elementType === "signature") {
      const newSignature: SignatureElement = {
        ...base,
        type: "signature",
        // Default placeholder size: 200 x 80 px
        width: elementConfig.width ?? 200,
        height: elementConfig.height ?? 80,
        scale: elementConfig.scale ?? 1,
        imageUrl: undefined,
      };
      setElements((prev) => [...prev, newSignature]);
    } else if (elementType === "image") {
      // IMAGE
      if (!uploadedImageUrl || !imagePreview) {
        showNotification("Harap upload gambar elemen", "error");
        return;
      }

      const newImg: ImageElement = {
        ...base,
        type: "image",
        imageUrl: uploadedImageUrl, // gunakan URL backend untuk elemen final
        width: elementConfig.width || 100,
        height: elementConfig.height || 100,
        rotation: elementConfig.rotation || 0,
        imageSizeMode: elementConfig.imageSizeMode || "custom",
        scale: elementConfig.scale || 1,
      };

      setElements((prev) => [...prev, newImg]);
      // reset upload buffer
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
    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
    showNotification("Elemen berhasil dihapus", "success");
  };

  removeHandlerRef.current = handleRemoveElement;

  // ====== DRAG ======
  const handleMouseDown = (e: React.MouseEvent, element: CertificateElement) => {
    e.preventDefault();
    e.stopPropagation();
    if (editingElementId) return;

    setSelectedElementId(element.id);
    setElementType(element.type); // Sync element type with selected element
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

    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, x: initialX + deltaX, y: initialY + deltaY } : el))
    );
  };

  const handleMouseUp = () => {
    dragStateRef.current = null;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  // ====== TEXT EDITING ======
  const handleStartEditing = (element: TextElement) => {
    if (element.placeholderType !== "custom") {
      showNotification("Placeholder elements cannot be edited directly", "error");
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
            : el
        )
      );
      showNotification("Text updated successfully");
    }
    setEditingElementId(null);
    setTempEditText("");
  };

  const handleEditKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleFinishEditing();
    else if (e.key === "Escape") {
      setEditingElementId(null);
      setTempEditText("");
    }
  };

  // ====== UPDATE ELEMENT (untuk SHAPE atau hal spesifik dari canvas) ======
  const handleUpdateElement = (id: string, updates: Partial<CertificateElement>) => {
    setElements((prev) =>
      prev.map((el) => {
        if (el.id !== id) return el;
        const updated = { ...el, ...updates };

        if (el.type === "text" && updated.type === "text") return updated as TextElement;
        if (el.type === "image" && updated.type === "image") return updated as ImageElement;
        if (el.type === "shape" && updated.type === "shape") {
          if (selectedElementId === id) {
            setElementConfig((prevConfig) => ({
              ...prevConfig,
              ...updates,
            }));
          }
          return updated as ShapeElement;
        }
        return el;
      })
    );
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains("canvas-container")) {
      setSelectedElementId(null);
      setElementType("text"); // Reset to default type when clicking empty canvas
      if (editingElementId) handleFinishEditing();
    }
  };

  // ====== SAVE ======
  const handleSave = async () => {
    try {
      if (!templateName) {
        showNotification("Harap masukkan nama template", "error");
        return;
      }
      if (!backgroundImage) {
        showNotification("Harap upload background image", "error");
        return;
      }

      setIsSaving(true);

      // Prefer backend-provided merchant_id from /auth/me (ensures correctness), fallback to localStorage
      let merchantId: number | null = null;
      try {
        const meRes = await api.get("/auth/me");
        merchantId = meRes?.data?.merchant_id ?? meRes?.data?.user?.merchant_id ?? null;
      } catch (e) {
        merchantId = null;
      }
  merchantId = merchantId ?? (Number(localStorage.getItem("merchant_id") || "0") || 1);

      // Ensure signature elements include explicit final size (apply element scale and canvas ratio)
      const ratio = CANVAS_PT / CANVAS_PX; // convert frontend px -> backend pt
      const elementsForBackend = elements.map((el) => {
        if (el.type === "signature") {
          const sig = el as SignatureElement & any;
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
            // send explicit final size so backend will render the signature at the placeholder size
            width: finalW,
            height: finalH,
            x: finalX,
            y: finalY,
          } as SignatureElement;
        }
        return el;
      });

      const templateData = {
        name: templateName,
        background_image: getRelativePath(backgroundImage),
        elements: prepareElementsForBackend(elementsForBackend),
        merchant_id: merchantId,
      };

      await api.post("/sertifikat-templates", templateData, {
        headers: { "Content-Type": "application/json" },
      });

      showNotification("Template berhasil disimpan");
      setTimeout(() => {
        window.location.href = "/admin/tabel-sertifikat";
      }, 1500);
    } catch (error) {
      if (error instanceof AxiosError) {
        const msg =
          error.response?.data?.message ||
          (error.response?.status === 500
            ? "Terjadi kesalahan pada server"
            : "Gagal menyimpan template");
        showNotification(msg, "error");
        console.error("Error response:", error.response?.data);
      } else {
        showNotification("Gagal menyimpan template", "error");
      }
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans dark:bg-slate-900">
      {/* Notification */}
      {notification && (
        <div
          className={`fixed right-5 top-5 z-50 rounded-lg px-4 py-3 text-white shadow-lg ${
            notification.type === "success" ? "bg-emerald-500" : "bg-red-500"
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Header */}
      <header className="border-b border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center justify-between px-4 py-3">
          <Link
            href="/admin/tabel-sertifikat"
            className="flex items-center gap-2 text-slate-600 transition-colors hover:text-primary dark:text-slate-400 dark:hover:text-slate-200"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium sm:text-base">Kembali ke Tabel</span>
          </Link>

          

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving || isUploading}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              <Save size={16} />
              {isSaving ? "Menyimpan..." : "Save Template"}
            </button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-65px)]">
        {/* Sidebar Create */}
        <div
          className={`w-[380px] border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 lg:block`}
        >
          <SidebarCreate
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
            editingElementId={editingElementId}
            selectedElementId={selectedElementId}
            tempEditText={tempEditText}
            setTempEditText={setTempEditText}
            handleEditKeyPress={handleEditKeyPress}
            handleFinishEditing={handleFinishEditing}
            imagePreview={imagePreview}
          />
        </div>

        {/* Main Canvas Create */}
        <MainCanvasCreate
          canvasRef={canvasRef}
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
          setElementType={setElementType}
        />
      </div>
    </div>
  );
};


export default CertificateCreate;
