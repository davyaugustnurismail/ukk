import React from "react";
import "../backend-fonts.css";

interface TextElementProps {
  text: string;
  style: React.CSSProperties;
  fontFamily: string;
  fontSize: number;
}

const TextElement: React.FC<TextElementProps> = ({
  text,
  style,
  fontFamily,
  fontSize,
}) => {
  // Add quotes around font family name and proper fallbacks
  const fontFamilyWithFallbacks = `"${fontFamily}", Arial, sans-serif`;

  return (
    <div
      style={{
        ...style,
        fontSize: `${fontSize}px`,
        fontFamily: fontFamilyWithFallbacks,
        fontWeight: "normal",
        fontStyle: "normal",
        letterSpacing: "normal",
      }}
    >
      {text}
    </div>
  );
};

export default TextElement;
