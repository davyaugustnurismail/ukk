// components/ResizableImage.tsx
import React, { useRef, useState } from "react";
import Image from "next/image";
import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";

export default function ResizableImage({ node, updateAttributes }: any) {
  const { src, alt, width = 300 } = node.attrs;
  return (
    <NodeViewWrapper
      className="resizable-image"
      style={{ display: "inline-block" }}
    >
      <Image
        src={src}
        alt={alt || ""}
        width={width}
        height={width * 0.75} // Using a 4:3 aspect ratio by default
        style={{ width: width + "px", height: "auto" }}
        unoptimized={src.startsWith("data:")} // Don't optimize data URLs
      />
    </NodeViewWrapper>
  );
}
