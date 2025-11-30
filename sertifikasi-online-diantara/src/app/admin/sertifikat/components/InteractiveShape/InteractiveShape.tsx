// InteractiveShape.tsx
import React, { useRef, useState } from "react";
import { RotateCw } from "lucide-react";

interface BaseElement {
  id: string;
  type: "text" | "image" | "shape";
  x: number;
  y: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
}

interface ShapeElement extends BaseElement {
  type: "shape";
  shapeType:
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
  width: number;
  height: number;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  borderRadius?: number;
  opacity?: number;
  zIndex?: number;
  isVisible?: boolean;
}

interface TextElement extends BaseElement {
  type: "text";
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  fontStyle: string;
  textAlign: "left" | "center" | "right";
  placeholderType:
    | "custom"
    | "name"
    | "number"
    | "date"
    | "instructure"
    | "title";
}

interface ImageElement extends BaseElement {
  type: "image";
  imageUrl: string;
  width: number;
  height: number;
}

type CertificateElement = TextElement | ImageElement | ShapeElement;

interface InteractiveShapeProps {
  element: ShapeElement;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<ShapeElement>) => void;
  onMouseDown: (e: React.MouseEvent, element: CertificateElement) => void;
}

const InteractiveShape: React.FC<InteractiveShapeProps> = ({
  element,
  isSelected,
  onSelect,
  onUpdate,
  onMouseDown,
}) => {
  const shapeRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  const getShapePath = () => {
    const { shapeType, width, height } = element;
    const w = width;
    const h = height;

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

    return paths[shapeType] || paths.rectangle;
  };

  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = element.width;
    const startHeight = element.height;
    const startPosX = element.x;
    const startPosY = element.y;

    const handleResize = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;
      let newX = startPosX;
      let newY = startPosY;

      if (direction.includes("e")) {
        newWidth = Math.max(10, startWidth + deltaX);
      } else if (direction.includes("w")) {
        newWidth = Math.max(10, startWidth - deltaX);
        newX = startPosX + (startWidth - newWidth);
      }

      if (direction.includes("s")) {
        newHeight = Math.max(10, startHeight + deltaY);
      } else if (direction.includes("n")) {
        newHeight = Math.max(10, startHeight - deltaY);
        newY = startPosY + (startHeight - newHeight);
      }

      onUpdate(element.id, {
        width: newWidth,
        height: newHeight,
        x: newX,
        y: newY,
      });
    };

    const handleResizeEnd = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", handleResize);
      document.removeEventListener("mouseup", handleResizeEnd);
    };

    document.addEventListener("mousemove", handleResize);
    document.addEventListener("mouseup", handleResizeEnd);
  };

  const handleRotateStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsRotating(true);

    const rect = shapeRef.current?.getBoundingClientRect();
    if (!rect) return;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    const startRotation = element.rotation || 0;

    const handleRotate = (e: MouseEvent) => {
      const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      const deltaAngle = (currentAngle - startAngle) * (180 / Math.PI);
      const newRotation = (startRotation + deltaAngle) % 360;

      onUpdate(element.id, { rotation: newRotation });
    };

    const handleRotateEnd = () => {
      setIsRotating(false);
      document.removeEventListener("mousemove", handleRotate);
      document.removeEventListener("mouseup", handleRotateEnd);
    };

    document.addEventListener("mousemove", handleRotate);
    document.addEventListener("mouseup", handleRotateEnd);
  };

  const handleShapeMouseDown = (e: React.MouseEvent) => {
    // Don't handle drag if we're in the middle of resizing or rotating
    if (isResizing || isRotating) return;

    // Select this shape
    onSelect(element.id);

    // Only start dragging if clicking on the shape itself, not on control handles
    const target = e.target as HTMLElement;
    if (target.closest("[data-control-handle]")) {
      return;
    }

    // Call parent's mouse down handler for dragging
    onMouseDown(e, element);
  };

  return (
    <div
      ref={shapeRef}
      className={`absolute cursor-move select-none ${isSelected ? "z-10" : "z-0"}`}
      style={{
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        transform: `rotate(${element.rotation || 0}deg) scale(${element.scaleX || 1}, ${element.scaleY || 1})`,
        transformOrigin: "center center",
      }}
      onMouseDown={handleShapeMouseDown}
    >
      {/* Main SVG Shape */}
      <svg
        width="100%"
        height="100%"
        className="pointer-events-auto"
        style={{ display: "block" }}
      >
        <path
          d={getShapePath()}
          fill={element.fillColor || "#3B82F6"}
          stroke={element.strokeColor || "#1E40AF"}
          strokeWidth={element.strokeWidth || 2}
          rx={element.borderRadius || 0}
          opacity={element.opacity || 1}
        />
      </svg>

      {/* Selection indicators and controls - only show when selected */}
      {isSelected && (
        <>
          {/* Selection border */}
          <div className="pointer-events-none absolute inset-0 border-2 border-dashed border-blue-500" />

          {/* Resize handles */}
          <div
            data-control-handle="true"
            className="pointer-events-auto absolute -left-1 -top-1 h-3 w-3 cursor-nw-resize rounded border border-white bg-blue-500"
            onMouseDown={(e) => handleResizeStart(e, "nw")}
          />
          <div
            data-control-handle="true"
            className="pointer-events-auto absolute -top-1 left-1/2 h-3 w-3 -translate-x-1/2 cursor-n-resize rounded border border-white bg-blue-500"
            onMouseDown={(e) => handleResizeStart(e, "n")}
          />
          <div
            data-control-handle="true"
            className="pointer-events-auto absolute -right-1 -top-1 h-3 w-3 cursor-ne-resize rounded border border-white bg-blue-500"
            onMouseDown={(e) => handleResizeStart(e, "ne")}
          />
          <div
            data-control-handle="true"
            className="pointer-events-auto absolute -right-1 top-1/2 h-3 w-3 -translate-y-1/2 cursor-e-resize rounded border border-white bg-blue-500"
            onMouseDown={(e) => handleResizeStart(e, "e")}
          />
          <div
            data-control-handle="true"
            className="pointer-events-auto absolute -bottom-1 -right-1 h-3 w-3 cursor-se-resize rounded border border-white bg-blue-500"
            onMouseDown={(e) => handleResizeStart(e, "se")}
          />
          <div
            data-control-handle="true"
            className="pointer-events-auto absolute -bottom-1 left-1/2 h-3 w-3 -translate-x-1/2 cursor-s-resize rounded border border-white bg-blue-500"
            onMouseDown={(e) => handleResizeStart(e, "s")}
          />
          <div
            data-control-handle="true"
            className="pointer-events-auto absolute -bottom-1 -left-1 h-3 w-3 cursor-sw-resize rounded border border-white bg-blue-500"
            onMouseDown={(e) => handleResizeStart(e, "sw")}
          />
          <div
            data-control-handle="true"
            className="pointer-events-auto absolute -left-1 top-1/2 h-3 w-3 -translate-y-1/2 cursor-w-resize rounded border border-white bg-blue-500"
            onMouseDown={(e) => handleResizeStart(e, "w")}
          />

          {/* Rotate handle */}
          <div
            data-control-handle="true"
            className="pointer-events-auto absolute -top-6 left-1/2 flex h-4 w-4 -translate-x-1/2 cursor-pointer items-center justify-center rounded-full border border-white bg-green-500"
            onMouseDown={handleRotateStart}
            title="Rotate"
          >
            <RotateCw size={10} className="text-white" />
          </div>

          {/* Info tooltip */}
          <div className="pointer-events-none absolute -left-2 -top-8 whitespace-nowrap rounded bg-black/75 px-2 py-1 text-xs text-white">
            {element.width}×{element.height} •{" "}
            {Math.round(element.rotation || 0)}°
          </div>
        </>
      )}
    </div>
  );
};

export default InteractiveShape;
