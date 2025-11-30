"use client";

import React, { CSSProperties } from "react";
import { Upload, Edit3 } from "lucide-react";
import Image from "next/image";
import {
  CertificateElement,
  TextElement,
  ShapeElement,
} from "../interfaces";
import InteractiveShape from "../InteractiveShape/InteractiveShape";

interface MainCanvasCreateProps {
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

const MainCanvasCreate: React.FC<MainCanvasCreateProps> = ({
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
            width: "842px",  // A4 landscape width @ 72dpi approx
            height: "595px", // A4 landscape height @ 72dpi approx
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
              const raw: any = element;
              const scaleX =
                typeof raw.scaleX === "number"
                  ? raw.scaleX
                  : typeof raw.scale === "number"
                  ? raw.scale
                  : 1;
              const scaleY =
                typeof raw.scaleY === "number"
                  ? raw.scaleY
                  : typeof raw.scale === "number"
                  ? raw.scale
                  : 1;

              // Base transform: rotation + scale
              let transform = `rotate(${typeof element.rotation === "number" ? element.rotation : 0}deg) scale(${scaleX}, ${scaleY})`;

              // Alignment translate:
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
              const rawImg: any = element;
              const scale = typeof rawImg.scale === "number" ? rawImg.scale : 1;

              // Support relative paths & data URLs
              const rawSrc = (rawImg.imageUrl ?? "") as string;
              const safeSrc =
                rawSrc.startsWith("data:") ||
                rawSrc.startsWith("/") ||
                rawSrc.startsWith("http")
                  ? rawSrc || "/logo.png"
                  : `/${rawSrc}`;

              return (
                <div
                  key={element.id}
                  onMouseDown={(e) => {
                    handleMouseDown(e, element);
                    // Mirror editor behavior: set element type and ensure selection
                    try {
                      setElementType("image");
                    } catch (err) {
                      // ignore if prop not provided
                    }
                    setSelectedElementId(element.id);
                  }}
                  className="absolute cursor-move"
                  style={{
                    left: `${element.x}px`,
                    top: `${element.y}px`,
                    width: `${(element.width || 100) * scale}px`,
                    height: `${(element.height || 100) * scale}px`,
                    transform: `rotate(${element.rotation || 0}deg)`,
                    transformOrigin: "center center",
                    border: isSelected ? "2px dashed #3498db" : "2px solid transparent",
                    padding: "2px",
                  }}
                >
                  <Image
                    src={safeSrc}
                    alt="Certificate element"
                    width={(element.width || 100) * scale}
                    height={(element.height || 100) * scale}
                    className="pointer-events-none h-full w-full object-cover"
                    unoptimized={!!safeSrc && safeSrc.startsWith("data:")}
                    onError={() => {
                      console.error("Image failed to load:", (element as any).imageUrl);
                    }}
                  />
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
                  onMouseDown={(e) => handleMouseDown(e, element)}
                />
              );
            }

            // ---------- QR CODE PLACEHOLDER ----------
            if (element.type === "qrcode") {
              const rawQr: any = element;
              const scale = typeof rawQr.scale === "number" ? rawQr.scale : 1;

              return (
                <div
                  key={element.id}
                  onMouseDown={(e) => handleMouseDown(e, element)}
                  className="absolute cursor-move"
                  style={{
                    left: `${element.x}px`,
                    top: `${element.y}px`,
                    width: `${(element.width || 100) * scale}px`,
                    height: `${(element.height || 100) * scale}px`,
                    transform: `rotate(${element.rotation || 0}deg)`,
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
              const rawSig: any = element;
              const scale = typeof rawSig.scale === "number" ? rawSig.scale : 1;
              const sigWidth = (rawSig.width || 200) * scale;
              const sigHeight = (rawSig.height || 80) * scale;
              const imageUrl = rawSig.imageUrl as string | undefined;
              const isPlaceholder = !imageUrl || imageUrl === "{INSTRUKTUR_SIGNATURE}";

              return (
                <div
                  key={rawSig.id}
                  onMouseDown={(e) => handleMouseDown(e, element)}
                  className="absolute cursor-move"
                  style={{
                    left: `${rawSig.x}px`,
                    top: `${rawSig.y}px`,
                    width: `${sigWidth}px`,
                    height: `${sigHeight}px`,
                    transform: `rotate(${rawSig.rotation || 0}deg)`,
                    transformOrigin: "center center",
                    border: isSelected ? "2px dashed #3498db" : "2px dashed #cccccc",
                    padding: "2px",
                    background: isPlaceholder ? "#f9f9f9" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  {isPlaceholder ? (
                    <div className="flex flex-col items-center gap-1 text-gray-500">
                      <Edit3 size={16} className="opacity-50" />
                      <span className="text-xs">Instructor Signature</span>
                    </div>
                  ) : (
                    <Image
                      src={imageUrl!}
                      alt="Instructor Signature"
                      width={sigWidth}
                      height={sigHeight}
                      className="pointer-events-none h-full w-full object-contain"
                      unoptimized={true}
                      onError={() => console.error('Signature image failed to load', imageUrl)}
                    />
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

export default MainCanvasCreate;
