import React, { useRef, useState, useEffect, useCallback } from "react";
import Draggable from "react-draggable";

import { BaseElement, ShapeElement, CertificateElement } from "./interfaces";

interface InteractiveShapeProps {
  element: ShapeElement;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<ShapeElement>) => void;
  onMouseDown?: (e: React.MouseEvent, element: CertificateElement) => void;
}

const InteractiveShape: React.FC<InteractiveShapeProps> = ({
  element,
  isSelected,
  onSelect,
  onUpdate,
  onMouseDown,
}) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const {
    id,
    x,
    y,
    width,
    height,
    rotation,
    fillColor,
    strokeColor,
    strokeWidth,
    opacity,
    shapeType,
    borderRadius,
  } = element;

  const [currentX, setCurrentX] = useState(x);
  const [currentY, setCurrentY] = useState(y);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [initialMousePos, setInitialMousePos] = useState({ x: 0, y: 0 });
  const [initialElement, setInitialElement] = useState<ShapeElement | null>(
    null,
  );

  useEffect(() => {
    setCurrentX(x);
    setCurrentY(y);
  }, [x, y]);

  const handleDrag = (e: any, ui: any) => {
    setCurrentX(ui.x);
    setCurrentY(ui.y);
  };

  const handleStop = (e: any, ui: any) => {
    onUpdate(id, { x: ui.x, y: ui.y });
  };

  const getCenter = useCallback(() => {
    if (!nodeRef.current) return { x: 0, y: 0 };
    const rect = nodeRef.current.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }, []);

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsResizing(true);
      setInitialMousePos({ x: e.clientX, y: e.clientY });
      setInitialElement(element);
    },
    [element],
  );

  const handleRotateMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsRotating(true);
      setInitialMousePos({ x: e.clientX, y: e.clientY });
      setInitialElement(element);
    },
    [element],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isResizing && initialElement) {
        const dx = e.clientX - initialMousePos.x;
        const dy = e.clientY - initialMousePos.y;

        const newWidth = Math.max(10, initialElement.width + dx);
        const newHeight = Math.max(10, initialElement.height + dy);

        onUpdate(id, { width: newWidth, height: newHeight });
      } else if (isRotating && initialElement) {
        const center = getCenter();
        const initialAngle = Math.atan2(
          initialMousePos.y - center.y,
          initialMousePos.x - center.x,
        );
        const currentAngle = Math.atan2(
          e.clientY - center.y,
          e.clientX - center.x,
        );
        let angleDiff = (currentAngle - initialAngle) * (180 / Math.PI);

        // Normalize angleDiff to be between -180 and 180
        if (angleDiff > 180) angleDiff -= 360;
        if (angleDiff < -180) angleDiff += 360;

        const newRotation = (initialElement.rotation || 0) + angleDiff;
        onUpdate(id, { rotation: newRotation });
      }
    },
    [
      isResizing,
      isRotating,
      initialMousePos,
      initialElement,
      id,
      onUpdate,
      getCenter,
    ],
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    setIsRotating(false);
    setInitialElement(null);
  }, []);

  useEffect(() => {
    if (isResizing || isRotating) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, isRotating, handleMouseMove, handleMouseUp]);

  const renderShape = () => {
    const commonProps = {
      fill: fillColor,
      stroke: strokeColor,
      strokeWidth: strokeWidth,
      opacity: opacity,
    };

    switch (shapeType) {
      case "rectangle":
        return (
          <rect
            x="0"
            y="0"
            width={width}
            height={height}
            rx={borderRadius || 0}
            ry={borderRadius || 0}
            {...commonProps}
          />
        );
      case "circle":
        const radius = Math.min(width, height) / 2;
        return (
          <circle cx={width / 2} cy={height / 2} r={radius} {...commonProps} />
        );
      case "triangle":
        const points = `${width / 2},0 0,${height} ${width},${height}`;
        return <polygon points={points} {...commonProps} />;
      case "line":
        return (
          <line
            x1="0"
            y1="0"
            x2={width}
            y2={height}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            opacity={opacity}
          />
        );
      case "arrow":
        // Simple arrow (line with a triangle at the end)
        return (
          <g>
            <line
              x1="0"
              y1={height / 2}
              x2={width}
              y2={height / 2}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              opacity={opacity}
            />
            <polygon
              points={`${width},${height / 2} ${width - 10},${height / 2 - 5} ${width - 10},${height / 2 + 5}`}
              fill={strokeColor}
              opacity={opacity}
            />
          </g>
        );
      case "heart":
        // SVG path for a heart shape
        const heartPath = `M${width / 2},${height * 0.9} C${width * 0.1},${height * 0.7} ${width * 0.5},${height * 0.1} ${width / 2},${height * 0.3} C${width * 0.5},${height * 0.1} ${width * 0.9},${height * 0.7} ${width / 2},${height * 0.9} Z`;
        return <path d={heartPath} {...commonProps} />;
      case "star":
        // Simple 5-point star
        const starPoints = [];
        const outerRadius = Math.min(width, height) / 2;
        const innerRadius = outerRadius / 2.5;
        for (let i = 0; i < 5; i++) {
          starPoints.push(
            outerRadius * Math.sin((i * 2 * Math.PI) / 5 + Math.PI / 2) +
              width / 2,
            outerRadius * Math.cos((i * 2 * Math.PI) / 5 + Math.PI / 2) +
              height / 2,
            innerRadius *
              Math.sin((i * 2 * Math.PI) / 5 + Math.PI / 2 + Math.PI / 5) +
              width / 2,
            innerRadius *
              Math.cos((i * 2 * Math.PI) / 5 + Math.PI / 2 + Math.PI / 5) +
              height / 2,
          );
        }
        return <polygon points={starPoints.join(" ")} {...commonProps} />;
      case "diamond":
        const diamondPoints = `${width / 2},0 ${width},${height / 2} ${width / 2},${height} 0,${height / 2}`;
        return <polygon points={diamondPoints} {...commonProps} />;
      case "pentagon":
        const pentagonPoints = [];
        const pentagonRadius = Math.min(width, height) / 2;
        for (let i = 0; i < 5; i++) {
          pentagonPoints.push(
            pentagonRadius * Math.sin((i * 2 * Math.PI) / 5 + Math.PI / 2) +
              width / 2,
            pentagonRadius * Math.cos((i * 2 * Math.PI) / 5 + Math.PI / 2) +
              height / 2,
          );
        }
        return <polygon points={pentagonPoints.join(" ")} {...commonProps} />;
      case "hexagon":
        const hexagonPoints = [];
        const hexagonRadius = Math.min(width, height) / 2;
        for (let i = 0; i < 6; i++) {
          hexagonPoints.push(
            hexagonRadius * Math.sin((i * 2 * Math.PI) / 6 + Math.PI / 2) +
              width / 2,
            hexagonRadius * Math.cos((i * 2 * Math.PI) / 6 + Math.PI / 2) +
              height / 2,
          );
        }
        return <polygon points={hexagonPoints.join(" ")} {...commonProps} />;
      case "cross":
        // Simple cross shape using two rectangles
        return (
          <g>
            <rect
              x={width / 3}
              y="0"
              width={width / 3}
              height={height}
              {...commonProps}
            />
            <rect
              x="0"
              y={height / 3}
              width={width}
              height={height / 3}
              {...commonProps}
            />
          </g>
        );
      default:
        return (
          <rect x="0" y="0" width={width} height={height} {...commonProps} />
        );
    }
  };

  return (
    <Draggable
      nodeRef={nodeRef}
      position={{ x: currentX, y: currentY }}
      onDrag={handleDrag}
      onStop={handleStop}
      bounds="parent"
      disabled={isResizing || isRotating} // Disable dragging during resize/rotate
    >
      <div
        ref={nodeRef}
        className="absolute"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          transformOrigin: "center center",
          cursor:
            isSelected && !(isResizing || isRotating) ? "grab" : "default",
          zIndex: isSelected ? 100 : 1,
        }}
        onClick={(e) => {
          e.stopPropagation(); // Prevent canvas click when clicking on shape
          onSelect(id);
        }}
        onMouseDown={(e) => {
          if (!isResizing && !isRotating && onMouseDown) {
            onMouseDown(e, element);
          }
        }}
      >
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{
            overflow: "visible",
            transform: `rotate(${rotation || 0}deg)`,
            transformOrigin: "center center",
          }}
        >
          {renderShape()}
        </svg>

        {isSelected && (
          <>
            {/* Selection border */}
            <div
              className="pointer-events-none absolute inset-0 border-2 border-blue-500"
              style={{ transform: `rotate(-${rotation || 0}deg)` }}
            ></div>

            {/* Resize handles */}
            <div
              className="absolute -bottom-1 -right-1 h-3 w-3 cursor-se-resize border border-white bg-blue-500"
              onMouseDown={handleResizeMouseDown}
            ></div>

            {/* Rotation handle */}
            <div
              className="absolute -top-4 left-1/2 h-3 w-3 -translate-x-1/2 cursor-grab rounded-full border border-white bg-blue-500"
              onMouseDown={handleRotateMouseDown}
            ></div>
          </>
        )}
      </div>
    </Draggable>
  );
};

export default InteractiveShape;
