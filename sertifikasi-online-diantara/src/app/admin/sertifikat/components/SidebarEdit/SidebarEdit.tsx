// SidebarEdit.tsx
import React from "react";
import Image from "next/image";
import {
  Upload,
  Type,
  Plus,
  Minus,
  Square,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Eye,
  Edit3,
  Trash2,
  QrCode,
} from "lucide-react";
import { FontDropdown } from "../FontDropdown";
import {
  CertificateElement,
  TextElement,
  ShapeElement,
  ElementConfig,
} from "../interfaces";

interface SidebarEditProps {
  templateName: string;
  setTemplateName: (name: string) => void;
  handleFileChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "background" | "element",
  ) => void;
  elementType: "text" | "image" | "shape" | "qrcode" | "signature";
  setElementType: (type: "text" | "image" | "shape" | "qrcode" | "signature") => void;
  elementConfig: ElementConfig;
  setElementConfig: (
    config: ElementConfig | ((prev: ElementConfig) => ElementConfig),
  ) => void;
  elements: CertificateElement[];
  handleAddElement: () => void;
  handleStartEditing: (element: TextElement) => void;
  handleRemoveElement: (id: string) => void;
  handleUpdateElement?: (id: string, updates: Partial<any>) => void;
  editingElementId: string | null;
  selectedElementId: string | null;
  tempEditText: string;
  setTempEditText: (text: string) => void;
  handleEditKeyPress: (e: React.KeyboardEvent) => void;
  handleFinishEditing: () => void;
}

const SidebarEdit: React.FC<SidebarEditProps> = ({
  templateName,
  setTemplateName,
  handleFileChange,
  elementType,
  setElementType,
  elementConfig,
  setElementConfig,
  elements,
  handleAddElement,
  handleStartEditing,
  handleRemoveElement,
  handleUpdateElement,
  editingElementId,
  selectedElementId,
  tempEditText,
  setTempEditText,
  handleEditKeyPress,
  handleFinishEditing,
}) => {
  const selectedEl = elements.find((el) => el.id === selectedElementId);
  const selectedHasSize =
    selectedEl &&
    (selectedEl.type === "image" ||
      selectedEl.type === "shape" ||
      selectedEl.type === "signature" ||
      selectedEl.type === "qrcode");

  const displayWidth = selectedHasSize
    ? (selectedEl as any).width ?? elementConfig.width
    : elementConfig.width;
  const displayHeight = selectedHasSize
    ? (selectedEl as any).height ?? elementConfig.height
    : elementConfig.height;

  // ===== Helper: sinkronkan perubahan ke elementConfig + elemen terpilih =====
  const updateSelected = (updates: Partial<any>) => {
    setElementConfig((prev) => ({ ...prev, ...updates }));
    if (selectedEl && handleUpdateElement) {
      handleUpdateElement(selectedEl.id, updates);
    }
  };

  return (
    <div className="flex h-full w-80 flex-col">
      {/* Header */}
      <div className="border-b border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-700">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
          Template Editor
        </h2>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6 p-6">
          {/* Template Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Template Name <span className="text-red-500 text-lg font-bold">*</span>
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
              placeholder="Enter template name"
            />
          </div>

          {/* Background Upload */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Background Image <span className="text-red-500 text-lg font-bold">*</span>
            </label>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Background sertifikat harus A4.
            </p>
            <div className="group rounded-lg border-2 border-dashed border-slate-300 p-6 text-center transition-all hover:border-blue-400 hover:bg-blue-50/50 dark:border-slate-600 dark:hover:border-blue-500/50 dark:hover:bg-blue-500/5">
              <input
                type="file"
                id="backgroundFile"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "background")}
                className="hidden"
              />
              <label
                htmlFor="backgroundFile"
                className="flex cursor-pointer flex-col items-center gap-2"
              >
                <div className="rounded-full bg-slate-100 p-3 transition-colors group-hover:bg-blue-100 dark:bg-slate-700 dark:group-hover:bg-blue-900/50">
                  <Upload
                    size={20}
                    className="text-slate-600 group-hover:text-blue-600 dark:text-slate-400 dark:group-hover:text-blue-400"
                  />
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-700 group-hover:text-blue-700 dark:text-slate-300 dark:group-hover:text-blue-400">
                    Upload Background
                  </span>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    JPG, PNG • Max 2MB
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Add Element Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Add Element
              </h3>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-600"></div>
            </div>

            {/* Element Type Selector */}
            <div className="grid grid-cols-5 gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-700">
              {[
                { type: "text", icon: Type, label: "Text" },
                { type: "image", icon: Upload, label: "Image" },
                { type: "shape", icon: Square, label: "Shape" },
                { type: "qrcode", icon: QrCode, label: "QR Code" },
                { type: "signature", icon: Edit3, label: "Sign" },
              ].map(({ type, icon: Icon, label }) => (
                <button
                  key={type}
                  onClick={() => {
                    const selectedEl = elements.find((el) => el.id === selectedElementId);
                    const shouldApplyDefaults = !selectedEl || selectedEl.type !== type;

                    if (shouldApplyDefaults) {
                      if (type === "signature") {
                        // default ukuran signature
                        setElementConfig((prev) => ({
                          ...prev,
                          imageUrl: prev.imageUrl || "{INSTRUKTUR_SIGNATURE}",
                          width: 200,
                          height: 80,
                        }));
                        if (selectedEl) {
                          handleUpdateElement?.(selectedEl.id, { width: 200, height: 80 });
                        }
                      } else if (type === "image") {
                        setElementConfig((prev) => ({
                          ...prev,
                          width: prev.imageSizeMode === "full" ? prev.width : 100,
                          height: prev.imageSizeMode === "full" ? prev.height : 100,
                        }));
                      }
                    }
                    setElementType(type as any);
                  }}
                  className={`flex flex-col items-center gap-1.5 rounded-md px-2 py-3 text-xs font-medium transition-all ${
                    elementType === type
                      ? "bg-white text-blue-600 shadow-sm dark:bg-slate-800 dark:text-blue-400"
                      : "text-slate-600 hover:bg-white/50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200"
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </button>
              ))}
            </div>

            {/* Element Configuration */}
            <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-600 dark:bg-slate-800/50">
              {elementType === "text" && (
                <div className="space-y-4">
                  {/* Text element configuration */}
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                      Text Type
                    </label>

                    <div className="grid gap-2">
                      {[
                        { value: "custom", label: "Custom Text" },
                        { value: "name", label: "Name" },
                        { value: "number", label: "Number" },
                        { value: "date", label: "Date" },
                        { value: "instructure", label: "Instructure" },
                        { value: "role_caption", label: "Role Caption" },
                        { value: "title", label: "Title" },
                      ].map(({ value, label }) => {
                        const isSelected = elementConfig.placeholderType === value;
                        const placeholders = {
                          custom: "",
                          name: "{NAMA}",
                          number: "{NOMOR}",
                          date: "{TANGGAL}",
                          instructure: "{INSTRUKTUR}",
                          role_caption: "{ROLE_CAPTION}",
                          title: "{TITLE}",
                        } as const;

                        return (
                          <button
                            key={value}
                            onClick={() =>
                              setElementConfig((prev) => ({
                                ...prev,
                                placeholderType: value as typeof prev.placeholderType,
                                text: placeholders[value as keyof typeof placeholders],
                              }))
                            }
                            className={`group relative flex items-center gap-3 rounded-lg border px-4 py-3 transition-all duration-200 ${
                              isSelected
                                ? "border-blue-200 bg-blue-50 text-blue-900 shadow-sm dark:border-blue-400/40 dark:bg-blue-500/10 dark:text-blue-100"
                                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-600"
                            }`}
                          >
                            <div
                              className={`h-4 w-4 flex-shrink-0 rounded-full border-2 transition-all duration-200 ${
                                isSelected
                                  ? "border-blue-500 bg-blue-500 dark:border-blue-400 dark:bg-blue-400"
                                  : "border-slate-300 group-hover:border-slate-400 dark:border-slate-500 dark:group-hover:border-slate-400"
                              }`}
                            >
                              {isSelected && (
                                <div className="h-full w-full scale-[0.4] rounded-full bg-white dark:bg-slate-900" />
                              )}
                            </div>

                            <div className="flex min-w-0 flex-1 items-center justify-between">
                              <span className="text-sm font-medium">{label}</span>

                              {value !== "custom" && (
                                <code
                                  className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-medium ${
                                    isSelected
                                      ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                                      : "bg-slate-100 text-slate-600 dark:bg-slate-600 dark:text-slate-300"
                                  }`}
                                >
                                  {`{${value.toUpperCase()}}`}
                                </code>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Text Input */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Text Content{" "}
                      {elementConfig.placeholderType === "custom" && (
                        <span className="text-red-500 text-lg font-bold">*</span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={elementConfig.text}
                      onChange={(e) => setElementConfig((prev) => ({ ...prev, text: e.target.value }))}
                      readOnly={elementConfig.placeholderType !== "custom"}
                      className={`w-full rounded-lg border px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                        elementConfig.placeholderType === "custom"
                          ? "border-slate-300 bg-white focus:border-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                          : "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                      placeholder={elementConfig.placeholderType === "custom" ? "Enter text" : ""}
                    />
                  </div>

                  {/* Text Properties */}
                  <div className="space-y-4">
                    {/* Font Size */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                          Font Size
                        </label>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {elementConfig.fontSize}px
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const newSize = Math.max(8, elementConfig.fontSize - 2);
                            setElementConfig((prev) => ({ ...prev, fontSize: newSize }));
                            if (selectedEl && handleUpdateElement) handleUpdateElement(selectedEl.id, { fontSize: newSize });
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-50 active:bg-slate-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 dark:active:bg-slate-600"
                        >
                          <Minus size={14} />
                        </button>
                        <div className="flex-1">
                          <input
                            type="range"
                            min="8"
                            max="72"
                            value={elementConfig.fontSize}
                            onChange={(e) => {
                                const v = parseInt(e.target.value);
                                if (isNaN(v)) return;
                                setElementConfig((prev) => ({ ...prev, fontSize: v }));
                                if (selectedEl && handleUpdateElement) handleUpdateElement(selectedEl.id, { fontSize: v });
                              }}
                            className="w-full accent-blue-500"
                          />
                        </div>
                          <button
                            onClick={() => {
                              const newSize = Math.min(72, elementConfig.fontSize + 2);
                              setElementConfig((prev) => ({ ...prev, fontSize: newSize }));
                              if (selectedEl && handleUpdateElement) handleUpdateElement(selectedEl.id, { fontSize: newSize });
                            }}
                          className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-50 active:bg-slate-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 dark:active:bg-slate-600"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Text Alignment */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                        Text Alignment
                      </label>
                      <div className="flex overflow-hidden rounded-lg border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-700">
                        {[ 
                          { value: "left", icon: AlignLeft, label: "Left" },
                          { value: "center", icon: AlignCenter, label: "Center" },
                          { value: "right", icon: AlignRight, label: "Right" },
                        ].map(({ value, icon: Icon, label }) => (
                          <button
                            key={value}
                            onClick={() => updateSelected({ textAlign: value })}
                            className={`flex-1 p-2.5 transition-colors ${
                              elementConfig.textAlign === value
                                ? "border-blue-200 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                                : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-600"
                            }`}
                            title={label}
                          >
                            <Icon size={16} className="mx-auto" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Font Family */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                        Font Family
                      </label>
                      <FontDropdown
                        value={elementConfig.fontFamily}
                        onChange={(value) => updateSelected({ fontFamily: value })}
                      />
                    </div>

                    {/* Font Style */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                        Font Style
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            updateSelected({
                              fontWeight: elementConfig.fontWeight === "bold" ? "normal" : "bold",
                            })
                          }
                          className={`flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-bold transition-colors ${
                            elementConfig.fontWeight === "bold"
                              ? "border-blue-500 bg-blue-600 text-white dark:border-blue-400 dark:bg-blue-500"
                              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                          }`}
                          title="Bold"
                        >
                          B
                        </button>
                        <button
                          onClick={() =>
                            updateSelected({
                              fontStyle: elementConfig.fontStyle === "italic" ? "normal" : "italic",
                            })
                          }
                          className={`flex h-10 w-10 items-center justify-center rounded-lg border text-sm italic transition-colors ${
                            elementConfig.fontStyle === "italic"
                              ? "border-blue-500 bg-blue-600 text-white dark:border-blue-400 dark:bg-blue-500"
                              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                          }`}
                          title="Italic"
                        >
                          I
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {elementType === "image" && (
                <div className="space-y-4">
                  <div className="group rounded-lg border-2 border-dashed border-slate-300 p-4 text-center transition-colors hover:border-blue-400 hover:bg-blue-50/50 dark:border-slate-600 dark:hover:border-blue-500/50 dark:hover:bg-blue-500/5">
                    <input
                      type="file"
                      id="imageFile"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, "element")}
                      className="hidden"
                    />
                    <label
                      htmlFor="imageFile"
                      className="flex cursor-pointer flex-col items-center gap-2"
                    >
                      <div className="rounded-full bg-slate-100 p-2 transition-colors group-hover:bg-blue-100 dark:bg-slate-700 dark:group-hover:bg-blue-900/50">
                        <Upload
                          size={16}
                          className="text-slate-600 group-hover:text-blue-600 dark:text-slate-400 dark:group-hover:text-blue-400"
                        />
                      </div>
                      <span className="text-sm text-slate-600 group-hover:text-blue-700 dark:text-slate-400 dark:group-hover:text-blue-400">
                        Upload Image <span className="text-red-500 text-lg font-bold">*</span>
                      </span>
                    </label>
                    {(() => {
                      const src = elementConfig.imageUrl || "";
                      const isValid =
                        typeof src === "string" &&
                        (src.startsWith("http") || src.startsWith("/") || src.startsWith("data:"));
                      const safeSrc = isValid ? src : "/logo.png";

                      return (
                        <div className="relative mt-3 h-20">
                          <Image
                            src={safeSrc}
                            alt="Preview"
                            className="rounded-lg shadow-sm ring-1 ring-slate-200 dark:ring-slate-600"
                            fill
                            style={{ objectFit: "contain" }}
                            unoptimized={safeSrc.startsWith("data:")}
                          />
                        </div>
                      );
                    })()}
                  </div>

                  {/* Opsi Ukuran Gambar */}
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="imageSizeMode"
                        value="full"
                        checked={elementConfig.imageSizeMode === "full"}
                        onChange={() => updateSelected({ imageSizeMode: "full" })}
                      />
                      Full Size
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="imageSizeMode"
                        value="custom"
                        checked={elementConfig.imageSizeMode === "custom"}
                        onChange={() => updateSelected({ imageSizeMode: "custom" })}
                      />
                      Custom Size
                    </label>
                  </div>

                  {/* Slider size (scale) selalu tampil */}
                  <div className="space-y-2 mt-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Size (%)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={10}
                        max={200}
                        step={1}
                        value={Math.round((elementConfig.scale ?? 1) * 100)}
                        onChange={(e) =>
                          updateSelected({ scale: parseInt(e.target.value) / 100 })
                        }
                        className="flex-1 accent-blue-500"
                      />
                      <input
                        type="number"
                        min={10}
                        max={200}
                        value={Math.round((elementConfig.scale ?? 1) * 100)}
                        onChange={(e) => {
                          let val = parseInt(e.target.value);
                          if (isNaN(val)) val = 100;
                          updateSelected({ scale: val / 100 });
                        }}
                        className="w-16 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                      />
                      <span className="text-xs text-slate-500">%</span>
                    </div>
                  </div>

                  {/* Input width/height hanya jika custom size */}
                  {elementConfig.imageSizeMode === "custom" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                          Width (px)
                        </label>
                        <input
                          type="number"
                          value={displayWidth}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 100;
                            updateSelected({ width: val });
                          }}
                          min="10"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                          Height (px)
                        </label>
                        <input
                          type="number"
                          value={displayHeight}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 100;
                            updateSelected({ height: val });
                          }}
                          min="10"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                        />
                      </div>
                    </div>
                  )}

                  {/* Pengaturan rotasi */}
                  <div className="space-y-2 mt-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Rotate (derajat)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={-180}
                        max={180}
                        step={1}
                        value={elementConfig.rotation ?? 0}
                        onChange={(e) => updateSelected({ rotation: parseInt(e.target.value) })}
                        className="flex-1 accent-blue-500"
                      />
                      <input
                        type="number"
                        min={-180}
                        max={180}
                        value={elementConfig.rotation ?? 0}
                        onChange={(e) => updateSelected({ rotation: parseInt(e.target.value) })}
                        className="w-16 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                      />
                      <span className="text-xs text-slate-500">°</span>
                    </div>
                  </div>
                </div>
              )}

              {elementType === "shape" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Shape Type
                    </label>
                    <select
                      value={elementConfig.shapeType}
                      onChange={(e) =>
                        updateSelected({ shapeType: e.target.value as ShapeElement["shapeType"] })
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                    >
                      <option value="rectangle">Rectangle</option>
                      <option value="circle">Circle</option>
                      <option value="triangle">Triangle</option>
                      <option value="star">Star</option>
                      <option value="diamond">Diamond</option>
                      <option value="pentagon">Pentagon</option>
                      <option value="hexagon">Hexagon</option>
                      <option value="line">Line</option>
                      <option value="arrow">Arrow</option>
                      <option value="heart">Heart</option>
                      <option value="cross">Cross</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                        Width (px)
                      </label>
                      <input
                        type="number"
                        value={elementConfig.width}
                        onChange={(e) =>
                          updateSelected({ width: parseInt(e.target.value) || 100 })
                        }
                        min="10"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                        Height (px)
                      </label>
                      <input
                        type="number"
                        value={elementConfig.height}
                        onChange={(e) =>
                          updateSelected({ height: parseInt(e.target.value) || 100 })
                        }
                        min="10"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                        Fill Color
                      </label>
                      <div className="space-y-2">
                        <input
                          type="color"
                          value={elementConfig.fillColor}
                          onChange={(e) => updateSelected({ fillColor: e.target.value })}
                          className="h-12 w-full cursor-pointer rounded-lg border border-slate-300 dark:border-slate-600"
                        />
                        <input
                          type="text"
                          value={elementConfig.fillColor}
                          onChange={(e) => updateSelected({ fillColor: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                          placeholder="#3B82F6"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                        Stroke Color
                      </label>
                      <div className="space-y-2">
                        <input
                          type="color"
                          value={elementConfig.strokeColor}
                          onChange={(e) => updateSelected({ strokeColor: e.target.value })}
                          className="h-12 w-full cursor-pointer rounded-lg border border-slate-300 dark:border-slate-600"
                        />
                        <input
                          type="text"
                          value={elementConfig.strokeColor}
                          onChange={(e) => updateSelected({ strokeColor: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                          placeholder="#1E40AF"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                        Stroke Width
                      </label>
                      <input
                        type="number"
                        value={elementConfig.strokeWidth}
                        onChange={(e) =>
                          updateSelected({ strokeWidth: parseInt(e.target.value) || 0 })
                        }
                        min="0"
                        max="20"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                        Opacity
                      </label>
                      <div className="space-y-2">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={elementConfig.opacity}
                          onChange={(e) =>
                            updateSelected({ opacity: parseFloat(e.target.value) })
                          }
                          className="w-full accent-blue-500"
                        />
                        <div className="rounded bg-slate-100 px-2 py-1 text-center text-xs text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                          {Math.round((elementConfig.opacity ?? 1) * 100)}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {elementConfig.shapeType === "rectangle" && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                        Border Radius
                      </label>
                      <input
                        type="number"
                        value={elementConfig.borderRadius}
                        onChange={(e) =>
                          updateSelected({ borderRadius: parseInt(e.target.value) || 0 })
                        }
                        min="0"
                        max="50"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                        placeholder="0"
                      />
                    </div>
                  )}
                </div>
              )}

              {elementType === "signature" && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Signature
                  </label>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Signature elements use a fixed default size of 200 x 80 px and scale 1. These cannot be changed from the sidebar.
                  </p>
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-900/20">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      ⚠️ Catatan Penting
                    </p>
                    <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                      Pastikan instruktur telah mengupload/scan signaturenya sebelum generate sertifikat.
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={handleAddElement}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 active:bg-indigo-800 dark:bg-indigo-500 dark:hover:bg-indigo-600 dark:active:bg-indigo-700"
              >
                <Plus size={16} />
                Add Element
              </button>
            </div>
          </div>

          {/* Elements List */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Elements ({elements.length})
              </h3>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-600"></div>
            </div>

            <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
              {elements.map((el) => (
                <div
                  key={el.id}
                  className={`group flex items-center justify-between rounded-lg border p-3 transition-all ${
                    selectedElementId === el.id
                      ? "border-blue-400 bg-blue-50 shadow-sm dark:border-blue-500 dark:bg-blue-500/10"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm dark:border-slate-600 dark:bg-slate-700 dark:hover:border-slate-500"
                  }`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div
                      className={`flex-shrink-0 rounded-md p-2 ${
                        el.type === "text"
                          ? "bg-blue-100 dark:bg-blue-500/20"
                          : el.type === "image"
                          ? "bg-emerald-100 dark:bg-emerald-500/20"
                          : el.type === "qrcode"
                          ? "bg-amber-100 dark:bg-amber-500/20"
                          : el.type === "signature"
                          ? "bg-indigo-100 dark:bg-indigo-500/20"
                          : "bg-purple-100 dark:bg-purple-500/20"
                      }`}
                    >
                      {el.type === "text" && (
                        <Type size={14} className="text-blue-600 dark:text-blue-400" />
                      )}
                      {el.type === "image" && (
                        <Upload size={14} className="text-emerald-600 dark:text-emerald-400" />
                      )}
                      {el.type === "shape" && (
                        <Square size={14} className="text-purple-600 dark:text-purple-400" />
                      )}
                      {el.type === "qrcode" && (
                        <QrCode size={14} className="text-amber-600 dark:text-amber-400" />
                      )}
                      {el.type === "signature" && (
                        <Edit3 size={14} className="text-indigo-600 dark:text-indigo-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                        {el.type === "text" ? (
                          editingElementId === el.id ? (
                            <input
                              type="text"
                              value={tempEditText}
                              onChange={(e) => setTempEditText(e.target.value)}
                              onKeyDown={handleEditKeyPress}
                              onBlur={handleFinishEditing}
                              className="w-full bg-transparent p-0 focus:outline-none dark:text-slate-200"
                            />
                          ) : (
                            `${el.text.substring(0, 20)}${el.text.length > 20 ? "..." : ""}`
                          )
                        ) : el.type === "image" ? (
                          "Image Element"
                        ) : el.type === "qrcode" ? (
                          "QR Code"
                        ) : el.type === "signature" ? (
                          "Signature"
                        ) : (
                          (() => {
                            const shapeType = (el as ShapeElement).shapeType;
                            if (shapeType) {
                              return `${shapeType.charAt(0).toUpperCase() + shapeType.slice(1)} Shape`;
                            }
                            return "Shape";
                          })()
                        )}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        Position: {Math.round(el.x)}, {Math.round(el.y)}
                        {typeof (el as any).rotation === "number" &&
                          (el as any).rotation !== 0 &&
                          ` • Rotation: ${Math.round((el as any).rotation)}°`}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    {el.type === "text" &&
                      (el as TextElement).placeholderType === "custom" && (
                        <button
                          onClick={() => handleStartEditing(el as TextElement)}
                          className="rounded-md p-1.5 text-blue-600 transition-colors hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-500/20"
                          title="Edit text"
                        >
                          <Edit3 size={12} />
                        </button>
                      )}
                    <button
                      onClick={() => handleRemoveElement(el.id)}
                      className="rounded-md p-1.5 text-red-600 transition-colors hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-500/20"
                      title="Delete element"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}

              {elements.length === 0 && (
                <div className="rounded-lg border-2 border-dashed border-slate-300 py-8 text-center dark:border-slate-600">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                    <Eye size={20} className="text-slate-400 dark:text-slate-500" />
                  </div>
                  <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    No elements yet
                  </div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                    Add your first element above
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SidebarEdit;
