import { NodeViewWrapper } from "@tiptap/react";
import { ResizableBox } from "react-resizable";
import Image from "next/image";
import "react-resizable/css/styles.css";
interface Props {
  node: any;
  updateAttributes: (attrs: Record<string, any>) => void;
}

export default function ResizableImageComponent(props: Props) {
  const { node, updateAttributes } = props;
  const { src, alt, width = 200, height = 200 } = node.attrs;

  const safeWidth = Number.isNaN(parseInt(width)) ? 200 : parseInt(width);
  const safeHeight = Number.isNaN(parseInt(height)) ? 200 : parseInt(height);

  return (
    <NodeViewWrapper
      className="resizable-image"
      style={{ display: "inline-block", position: "relative", width: `${safeWidth}px`, height: `${safeHeight}px` }}
    >
      <ResizableBox
        width={safeWidth}
        height={safeHeight}
        resizeHandles={["se"]}
        minConstraints={[50, 50]}
        onResizeStop={(_e, data) => {
          updateAttributes({
            width: data.size.width,
            height: data.size.height,
          });
        }}
      >
        <Image
          src={src}
          alt={alt || ""}
          width={safeWidth}
          height={safeHeight}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            cursor: "grab",
            userSelect: "none",
          }}
          draggable={true}
          unoptimized={src.startsWith("data:")} // Don't optimize data URLs
        />
      </ResizableBox>
    </NodeViewWrapper>
  );
}
