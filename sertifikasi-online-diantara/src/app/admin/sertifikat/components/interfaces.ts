// interfaces.ts
export interface BaseElement {
  id: string;
  type: "text" | "image" | "shape" | "qrcode" | "signature";
  x: number;
  y: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  scale?: number; // 1 = 100%
}

// Signature element for instructor signature placeholder/image
export interface SignatureElement extends BaseElement {
  type: "signature";
  width: number;
  height: number;
  imageUrl?: string;
  scale: number; // 1 = 100%
  instructorId?: number;
}

// Text element interface for text-based elements
export interface TextElement extends BaseElement {
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
  // Informasi font tambahan untuk keperluan preview
  font?: {
    family: string;
    weight: string;
    style: string;
  };
}

// Image element interface for image-based elements
export interface ImageElement extends BaseElement {
  type: "image";
  imageUrl: string;
  width: number;
  height: number;
  rotation: number;
  imageSizeMode: "full" | "custom";
  scale: number; // 1 = 100%
}

// Shape element interface for geometric shapes
export interface ShapeElement extends BaseElement {
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

// QR Code element
export interface QrCodeElement extends BaseElement {
  type: "qrcode";
  width: number;
  height: number;
  // optional data encoded in QR
  data?: string;
}

// Union type for any kind of certificate element
export type CertificateElement = TextElement | ImageElement | ShapeElement | QrCodeElement | SignatureElement;

// Notification interface for toast messages
export interface Notification {
  message: string;
  type: "success" | "error";
}

// Font category and related types
export type FontCategory = {
  label: string;
  fonts: Array<{
    name: string;
    label: string;
    googleFont?: string; // For Google Fonts
  }>;
};

export type FontCategories = {
  [key in
    | "system"
    | "sansSerif"
    | "serif"
    | "decorative"
    | "display"]: FontCategory;
};

// Interface for element configuration options
export interface ElementConfig {
  // Common properties for elements that have dimensions
  width?: number;
  height?: number;
  scale?: number;
  rotation?: number;

  // Text element configuration
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

  // Shape element configuration
  shapeType?:
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
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  borderRadius?: number;
  opacity?: number;

  // Image element configuration
  imageUrl?: string;
  imageSizeMode?: "full" | "custom";

  // Signature element configuration
  instructorId?: number;
}
