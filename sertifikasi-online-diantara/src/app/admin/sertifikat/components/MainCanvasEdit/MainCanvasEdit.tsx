import React, { CSSProperties } from "react";
import { Upload, Edit3 } from "lucide-react";
import Image from "next/image";
import {
  CertificateElement,
  TextElement,
  ShapeElement,
} from "../interfaces";
import InteractiveShape from "../InteractiveShape/InteractiveShape";

interface MainCanvasEditProps {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  backgroundImage: string | null;
  elements: CertificateElement[];
  selectedElementId: string | null;
  editingElementId: string | null;
  tempEditText: string;
  editInputRef: React.RefObject<HTMLInputElement | null>;
  handleCanvasClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleMouseDown: (e: React.MouseEvent, element: CertificateElement) => void;
  handleStartEditing: (element: TextElement) => void;
  handleFinishEditing: () => void;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  handleUpdateElement: (id: string, updates: Partial<CertificateElement>) => void;
  setTempEditText: (text: string) => void;
  setSelectedElementId: (id: string | null) => void;
  setElementType: (type: "text" | "image" | "shape" | "qrcode" | "signature") => void;
}

const MainCanvasEdit: React.FC<MainCanvasEditProps> = ({
  canvasRef,
  backgroundImage,
  elements,
  selectedElementId,
  editingElementId,
  tempEditText,
  editInputRef,
  handleCanvasClick,
  handleMouseDown,
  handleStartEditing,
  handleFinishEditing,
  handleKeyPress,
  handleUpdateElement,
  setTempEditText,
  setSelectedElementId,
  setElementType,
}) => {
  return (  
    <main className="flex-1 overflow-auto bg-slate-100 p-6 dark:bg-slate-900">
      <div className="flex h-full items-center justify-center">
        <div
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="relative rounded-lg bg-white shadow-lg dark:bg-slate-800 canvas-container"
          style={{
            width: "842px",
            height: "595px",
            backgroundImage: backgroundImage ? `url(${backgroundImage})` : "none",
            backgroundSize: "cover",
            backgroundPosition: "center",
            overflow: "hidden",
          }}
        >
          {!backgroundImage && (
            <div className="absolute inset-0 flex items-center justify-center text-center text-slate-400">
              <div className="flex flex-col items-center gap-2">
                <Upload size={48} className="opacity-50" />
                <span className="font-semibold">Upload Background</span>
                <span className="text-sm">Select an image from the sidebar</span>
              </div>
            </div>
          )}

          {/* Render Elements */}
          {elements.map((element) => {
            const isSelected = element.id === selectedElementId;
            const isEditing = element.id === editingElementId;

            // ---------- TEXT ----------
            if (element.type === "text") {
              const scaleX = (element as any).scaleX ?? (element as any).scale ?? 1;
              const scaleY = (element as any).scaleY ?? (element as any).scale ?? 1;


              // Base transform: rotation + scale
              let transform = `rotate(${typeof element.rotation === "number" ? element.rotation : 0}deg) scale(${scaleX}, ${scaleY})`;

              // Alignment translate (disesuaikan dengan cara yang sama seperti di MainCanvasCreate):
              // left   -> no translate
              // center -> translateX(-50%)
              // right  -> translateX(-100%)
              if (element.textAlign === "center") {
                transform += " translateX(-50%)";
              } else if (element.textAlign === "right") {
                transform += " translateX(-100%)";
              }

              const style: CSSProperties = {
                position: "absolute",
                left: `${element.x}px`,
                top: `${element.y}px`,
                fontSize: `${element.fontSize}px`,
                fontFamily: `"${element.fontFamily}", Arial, sans-serif`,
                fontWeight: element.fontWeight,
                fontStyle: element.fontStyle,
                textAlign: element.textAlign,
                cursor: isEditing ? "text" : "move",
                whiteSpace: "nowrap",
                transform,
                transformOrigin: "center center",
                border: isSelected ? "2px dashed #3498db" : "2px solid transparent",
                padding: "2px",
                display: "inline-block",
                // Optional anti-aliasing in dark mode
                WebkitFontSmoothing: "antialiased",
                MozOsxFontSmoothing: "grayscale",
              };

              return (
                <div
                  key={element.id}
                  onMouseDown={(e) => handleMouseDown(e, element)}
                  onDoubleClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleStartEditing(element);
                  }}
                  style={style}
                  className="group relative"
                >
                  {isEditing ? (
                    <input
                      ref={editInputRef}
                      type="text"
                      value={tempEditText}
                      onChange={(e) => setTempEditText(e.target.value)}
                      onKeyDown={handleKeyPress}
                      onBlur={handleFinishEditing}
                      className="m-0 border-none bg-transparent p-0 outline-none"
                      style={{
                        fontSize: `${element.fontSize}px`,
                        fontFamily: `"${element.fontFamily}", Arial, sans-serif`,
                        fontWeight: element.fontWeight,
                        fontStyle: element.fontStyle,
                        textAlign: element.textAlign,
                        minWidth: "50px",
                      }}
                    />
                  ) : (
                    <>
                      {element.text}
                      {element.placeholderType === "custom" && (
                        <div className="absolute -top-6 left-0 hidden items-center gap-1 whitespace-nowrap rounded bg-black/75 px-2 py-1 text-xs text-white group-hover:flex">
                          <Edit3 size={10} />
                          Double-click to edit
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            }

            // ---------- IMAGE ----------
            if (element.type === "image") {
              const scale = typeof (element as any).scale === "number" ? (element as any).scale : 1;
              // Use imageUrl if present, else fallback to image_path from payload
              const imageUrl = (element as any).imageUrl as string | undefined;
              const imagePath = (element as any).image_path as string | undefined;
              const rawSrc = imageUrl && imageUrl.trim() !== "" ? imageUrl : (imagePath && imagePath.trim() !== "" ? imagePath : undefined);
              const backendBase = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "").replace(/\/$/, "");
              const src = rawSrc && rawSrc.startsWith("/") ? (backendBase ? `${backendBase}${rawSrc}` : rawSrc) : rawSrc;
              // If src contains a placeholder token like "{INSTRUKTUR_SIGNATURE}", treat it as no image
              const isPlaceholderSrc = typeof src === "string" && src.includes("{");

              return (
                <div
                  key={element.id}
                  onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => {
                    handleMouseDown(e, element);
                    setElementType("image");
                    setSelectedElementId(element.id);
                  }}
                  className="absolute cursor-move"
                  style={{
                    left: `${element.x}px`,
                    top: `${element.y}px`,
                    width: `${((element as any).width || 100) * scale}px`,
                    height: `${((element as any).height || 100) * scale}px`,
                    transform: `rotate(${(element as any).rotation || 0}deg)`,
                    transformOrigin: "center center",
                    border: isSelected ? "2px dashed #3498db" : "2px solid transparent",
                    padding: "2px",
                  }}
                >
                  {!isPlaceholderSrc && src ? (
                    <Image
                      src={src}
                      alt="Certificate element"
                      width={((element as any).width || 100) * scale}
                      height={((element as any).height || 100) * scale}
                      className="pointer-events-none h-full w-full object-cover"
                      unoptimized={true}
                      onError={() => {
                        // Only log errors for real URLs, not for placeholder tokens
                        try {
                          if (typeof src === 'string' && src.includes('{')) return;
                        } catch (e) {}
                        console.error("Image failed to load:", src);
                      }}
                    />
                  ) : (
                    <Image
                      src="/logo.png"
                      alt="Certificate element placeholder"
                      width={((element as any).width || 100) * scale}
                      height={((element as any).height || 100) * scale}
                      className="pointer-events-none h-full w-full object-cover"
                    />
                  )}
                </div>
              );
            }

            // ---------- SHAPE ----------
            if (element.type === "shape") {
              return (
                <InteractiveShape
                  key={element.id}
                  element={element as ShapeElement}
                  isSelected={isSelected}
                  onSelect={setSelectedElementId}
                  onUpdate={handleUpdateElement}
                  onMouseDown={(e: React.MouseEvent) => handleMouseDown(e, element)}
                />
              );
            }

            // ---------- QR CODE PLACEHOLDER ----------
            if (element.type === "qrcode") {
              const scale = typeof (element as any).scale === "number" ? (element as any).scale : 1;

              return (
                <div
                  key={element.id}
                  onMouseDown={(e) => handleMouseDown(e, element)}
                  className="absolute cursor-move"
                  style={{
                    left: `${element.x}px`,
                    top: `${element.y}px`,
                    width: `${((element as any).width || 100) * scale}px`,
                    height: `${((element as any).height || 100) * scale}px`,
                    transform: `rotate(${(element as any).rotation || 0}deg)`,
                    transformOrigin: "center center",
                    border: isSelected ? "2px dashed #3498db" : "2px dashed #cccccc",
                    padding: "2px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#f9f9f9",
                  }}
                >
                  <span style={{ fontSize: "12px", color: "#888" }}>QR Code</span>
                </div>
              );
            }

            // ---------- SIGNATURE ----------
            if (element.type === "signature") {
              const scale = typeof (element as any).scale === "number" ? (element as any).scale : 1;
              const sigWidth = ((element as any).width || 200) * scale;
              const sigHeight = ((element as any).height || 80) * scale;
              const imageUrl = (element as any).imageUrl as string | undefined;
              // If imageUrl is a placeholder token (eg. "{INSTRUKTUR_SIGNATURE}"), treat as no image
              const isPlaceholder = typeof imageUrl === 'string' && imageUrl.includes('{');
              const hasImage = !!imageUrl && !isPlaceholder;

              return (
                <div
                  key={element.id}
                  onMouseDown={(e) => {
                    handleMouseDown(e, element);
                    // when clicking a signature element, switch sidebar to signature tab
                    if (element.type === "signature") {
                      setElementType("signature");
                      setSelectedElementId(element.id);
                    }
                  }}
                  className="absolute cursor-move"
                  style={{
                    left: `${element.x}px`,
                    top: `${element.y}px`,
                    width: `${sigWidth}px`,
                    height: `${sigHeight}px`,
                    transform: `rotate(${(element as any).rotation || 0}deg)`,
                    transformOrigin: "center center",
                    border: isSelected ? "2px dashed #3498db" : "2px dashed #cccccc",
                    padding: "2px",
                    background: hasImage ? "transparent" : "#f9f9f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  {hasImage ? (
                    (() => {
                      const rawSig = imageUrl!;
                      const backendBaseSig = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "").replace(/\/$/, "");
                      const sigSrc = rawSig.startsWith("/") && backendBaseSig ? `${backendBaseSig}${rawSig}` : rawSig;
                      return (
                        <Image
                          src={sigSrc}
                          alt="Instructor Signature"
                          width={sigWidth}
                          height={sigHeight}
                          className="pointer-events-none h-full w-full object-contain"
                          unoptimized={true}
                          onError={() => {
                            // Only log errors for real URLs
                            try {
                              if (typeof sigSrc === 'string' && sigSrc.includes('{')) return;
                            } catch (e) {}
                            console.error("Signature image failed to load:", sigSrc);
                          }}
                        />
                      );
                    })()
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-gray-500">
                      <Edit3 size={16} className="opacity-50" />
                      <span className="text-xs">Instructor Signature</span>
                    </div>
                  )}
                </div>
              );
            }

            return null;
          })}
        </div>
      </div>
    </main>
  );
};

export default MainCanvasEdit;
