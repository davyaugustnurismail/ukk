import { NodeViewWrapper } from "@tiptap/react";
import { ResizableBox } from "react-resizable";
import "react-resizable/css/styles.css";
import React, { useState } from "react";

interface Props {
  node: any;
  updateAttributes: (attrs: Record<string, any>) => void;
}

export default function ShapeComponent(props: Props) {
  const { node, updateAttributes } = props;
  const { form, width, height, rotation, color } = node.attrs;

  const safeWidth = parseInt(width) || 100;
  const safeHeight = parseInt(height) || 100;
  const safeRotation = parseInt(rotation) || 0;

  const [currentRotation, setCurrentRotation] = useState(safeRotation);

  const handleRotate = () => {
    const newRotation = (currentRotation + 45) % 360; // Rotate by 45 degrees
    setCurrentRotation(newRotation);
    updateAttributes({ rotation: `${newRotation}deg` });
  };

  const shapeStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    backgroundColor: color,
    transform: `rotate(${currentRotation}deg)`,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "grab",
    userSelect: "none",
  };

  // Apply specific styles based on the form
  if (form === "circle") {
    shapeStyle.borderRadius = "50%";
  } else if (form === "triangle") {
    // This is a simplified triangle, a real one would need more complex CSS or SVG
    shapeStyle.width = "0";
    shapeStyle.height = "0";
    shapeStyle.borderLeft = `${safeWidth / 2}px solid transparent`;
    shapeStyle.borderRight = `${safeWidth / 2}px solid transparent`;
    shapeStyle.borderBottom = `${safeHeight}px solid ${color}`;
    shapeStyle.backgroundColor = "transparent"; // Clear background for triangle
  }

  return (
    <NodeViewWrapper
      className="shape-node"
      style={{
        display: "inline-block",
        position: "relative",
        width: `${safeWidth}px`,
        height: `${safeHeight}px`,
      }}
    >
      <ResizableBox
        width={safeWidth}
        height={safeHeight}
        resizeHandles={["se"]}
        minConstraints={[20, 20]}
        onResizeStop={(_e, data) => {
          updateAttributes({
            width: `${data.size.width}px`,
            height: `${data.size.height}px`,
          });
        }}
      >
        <div style={shapeStyle} onClick={handleRotate}>
          {/* Optional: Add a rotation indicator or handle */}
        </div>
      </ResizableBox>
    </NodeViewWrapper>
  );
}
