import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
// Gunakan font yang tersedia secara lokal
import "@/css/custom-fonts.css";
import "@/app/admin/sertifikat/components/backend-fonts.css";

interface FontDropdownProps {
  value: string;
  onChange: (value: string) => void;
}

// Daftar font yang tersedia
const availableFonts = [
  { label: "Arimo", value: "Arimo" },
  { label: "Barlow", value: "Barlow" },
  { label: "Cormorant Garamond", value: "Cormorant Garamond" },
  { label: "DM Sans", value: "DM Sans" },
  { label: "Inter", value: "Inter" },
  { label: "League Spartan", value: "League Spartan" },
  { label: "Lora", value: "Lora" },
  { label: "Merriweather", value: "Merriweather" },
  { label: "Montserrat", value: "Montserrat" },
  { label: "Nunito", value: "Nunito" },
  { label: "Open Sans", value: "Open Sans" },
  { label: "Oswald", value: "Oswald" },
  { label: "Playfair Display", value: "Playfair Display" },
  { label: "Poppins", value: "Poppins" },
  { label: "Quicksand", value: "Quicksand" },
  { label: "Raleway", value: "Raleway" },
  { label: "Roboto", value: "Roboto" },
  // Custom fonts
  { label: "Brittany", value: "Brittany" },
  { label: "Breathing", value: "Breathing" },
  { label: "Brighter", value: "Brighter" },
  { label: "Bryndan Write", value: "Bryndan Write" },
  { label: "Caitlin Angelica", value: "Caitlin Angelica" },
  { label: "Railey", value: "Railey" },
  { label: "More Sugar", value: "More Sugar" },
  { label: "Arial", value: "Arial" },
];

export const FontDropdown: React.FC<FontDropdownProps> = ({
  value,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredFonts = availableFonts.filter((font) =>
    font.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentFont = availableFonts.find((font) => font.value === value);

  const handleFontChange = (fontValue: string) => {
    onChange(fontValue);
    setIsOpen(false);
    setSearchTerm("");
  };

  const previewStyle = (fontValue: string) => {
    return {
      fontFamily: `"${fontValue}", Arial, sans-serif`,
    };
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-slate-800 outline-none transition-all hover:border-slate-400 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
        style={previewStyle(value)}
      >
        <span className="truncate">{currentFont?.label || value}</span>
        <ChevronDown
          size={16}
          className={`ml-2 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full max-w-sm rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-600 dark:bg-slate-800">
          <div className="border-b border-slate-200 p-3 dark:border-slate-600">
            <input
              type="text"
              placeholder="Search fonts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
            />
          </div>

          <div className="max-h-80 overflow-y-auto">
            {filteredFonts.map((font) => (
              <button
                key={font.value}
                type="button"
                onClick={() => handleFontChange(font.value)}
                className={`flex w-full items-center px-3 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 ${
                  value === font.value
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                    : "text-slate-700 dark:text-slate-200"
                }`}
                style={previewStyle(font.value)}
              >
                <div className="min-w-0 flex-1">
                  <div
                    className="truncate font-medium"
                    style={{ fontSize: "16px" }}
                  >
                    {font.label}
                  </div>
                </div>
                {value === font.value && (
                  <div className="ml-2 h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                )}
              </button>
            ))}
            {filteredFonts.length === 0 && (
              <div className="px-3 py-6 text-center text-slate-500 dark:text-slate-400">
                <div className="text-sm">No fonts found</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};