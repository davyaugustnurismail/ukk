import { FontCategories } from "./interfaces";

// Font categories - simplified
export const FONT_CATEGORIES: FontCategories = {
  system: {
    label: "System Fonts",
    fonts: [
      { name: "Arial", label: "Arial" },
      { name: "Times New Roman", label: "Times New Roman" },
      { name: "Helvetica", label: "Helvetica" },
      { name: "Georgia", label: "Georgia" },
      { name: "Verdana", label: "Verdana" },
      { name: "Courier New", label: "Courier New" },
    ],
  },
  sansSerif: {
    label: "Sans-Serif",
    fonts: [
      {
        name: "Inter",
        label: "Inter",
        googleFont: "Inter:wght@300;400;500;600;700",
      },
      {
        name: "Poppins",
        label: "Poppins",
        googleFont: "Poppins:wght@300;400;500;600;700",
      },
      {
        name: "Montserrat",
        label: "Montserrat",
        googleFont: "Montserrat:wght@300;400;500;600;700",
      },
      {
        name: "Open Sans",
        label: "Open Sans",
        googleFont: "Open+Sans:wght@300;400;500;600;700",
      },
      {
        name: "League Spartan",
        label: "League Spartan",
        googleFont: "League+Spartan:wght@300;400;500;600;700",
      },
      {
        name: "DM Sans",
        label: "DM Sans",
        googleFont: "DM+Sans:wght@300;400;500;600;700",
      },
      {
        name: "Oswald",
        label: "Oswald",
        googleFont: "Oswald:wght@300;400;500;600;700",
      },
      {
        name: "Barlow",
        label: "Barlow",
        googleFont: "Barlow:wght@300;400;500;600;700",
      },
    ],
  },
  serif: {
    label: "Serif",
    fonts: [
      {
        name: "Playfair Display",
        label: "Playfair Display",
        googleFont: "Playfair+Display:wght@400;500;600;700",
      },
      {
        name: "Merriweather",
        label: "Merriweather",
        googleFont: "Merriweather:wght@300;400;700",
      },
      {
        name: "Libre Baskerville",
        label: "Libre Baskerville",
        googleFont: "Libre+Baskerville:wght@400;700",
      },
      { name: "Lora", label: "Lora", googleFont: "Lora:wght@400;500;600;700" },
      { name: "Bree Serif", label: "Bree Serif", googleFont: "Bree+Serif" },
      {
        name: "DM Serif Display",
        label: "DM Serif Display",
        googleFont: "DM+Serif+Display:wght@400",
      },
    ],
  },
  decorative: {
    label: "Decorative",
    fonts: [
      { name: "Alice", label: "Alice", googleFont: "Alice" },
      { name: "Allura", label: "Allura", googleFont: "Allura" },
      { name: "Great Vibes", label: "Great Vibes", googleFont: "Great+Vibes" },
      {
        name: "Dancing Script",
        label: "Dancing Script",
        googleFont: "Dancing+Script:wght@400;500;600;700",
      },
      // Local Fonts
      { name: "Brittany", label: "Brittany" },
      { name: "Breathing", label: "Breathing" },
      { name: "Brighter", label: "Brighter" },
      { name: "Bryndan Write", label: "Bryndan Write" },
      { name: "Caitlin Angelica", label: "Caitlin Angelica" },
      { name: "Railey", label: "Railey" },
      { name: "More Sugar", label: "More Sugar" },
    ],
  },
  display: {
    label: "Display",
    fonts: [
      { name: "Bebas Neue", label: "Bebas Neue", googleFont: "Bebas+Neue" },
      { name: "Anton", label: "Anton", googleFont: "Anton" },
      {
        name: "Archivo Black",
        label: "Archivo Black",
        googleFont: "Archivo+Black",
      },
      { name: "Fredoka One", label: "Fredoka One", googleFont: "Fredoka+One" },
    ],
  },
};
