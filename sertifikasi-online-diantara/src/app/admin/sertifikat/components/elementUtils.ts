// elementUtils.ts

const A4_WIDTH_PT = 842;
const SCALE_FACTOR = 1; // Since frontend canvas and PDF have same width

// Mapping font yang diperbaiki untuk mencocokkan struktur folder
const fontMapping: { [key: string]: { folder: string; baseFile: string } } = {
  "Arimo": { folder: "Arimo", baseFile: "Arimo" },
  "Barlow": { folder: "Barlow", baseFile: "Barlow" },
  "Cormorant Garamond": { folder: "Cormorant_Garamond", baseFile: "CormorantGaramond" },
  "DM Sans": { folder: "DM_Sans", baseFile: "DMSans" },
  "Inter": { folder: "Inter", baseFile: "Inter" },
  "League Spartan": { folder: "League_Spartan", baseFile: "LeagueSpartan" },
  "Lora": { folder: "Lora", baseFile: "Lora" },
  "Merriweather": { folder: "Merriweather", baseFile: "Merriweather" },
  "Montserrat": { folder: "Montserrat", baseFile: "Montserrat" },
  "Nunito": { folder: "Nunito", baseFile: "Nunito" },
  "Open Sans": { folder: "Open_Sans", baseFile: "OpenSans" },
  "Oswald": { folder: "Oswald", baseFile: "Oswald" },
  "Playfair Display": { folder: "Playfair_Display", baseFile: "PlayfairDisplay" },
  "Poppins": { folder: "Poppins", baseFile: "Poppins" },
  "Quicksand": { folder: "Quicksand", baseFile: "Quicksand" },
  "Raleway": { folder: "Raleway", baseFile: "Raleway" },
  "Roboto": { folder: "Roboto", baseFile: "Roboto" },
  // Fonts kustom
  "Brittany": { folder: "brittany_2", baseFile: "Brittany" },
  "Breathing": { folder: "breathing", baseFile: "Breathing" },
  "Brighter": { folder: "brighter", baseFile: "Brighter" },
  "Bryndan Write": { folder: "Bryndan Write", baseFile: "BryndanWrite" },
  "Caitlin Angelica": { folder: "caitlin_angelica", baseFile: "Caitlin Angelica" },
  "Railey": { folder: "railey", baseFile: "Railey" },
  "More Sugar": { folder: "more_sugar", baseFile: "More Sugar" },
};

// Main function to prepare a single element for the backend
function prepareElementForBackend(element: any): any {
  const newEl = { ...element };

  // --- Coordinate and Dimension Scaling ---
  newEl.x = Math.round(element.x * SCALE_FACTOR);
  newEl.y = Math.round(element.y * SCALE_FACTOR);
  if (element.fontSize) {
    newEl.fontSize = Math.round(element.fontSize * SCALE_FACTOR);
  }
  if (element.width) {
    newEl.width = Math.round(element.width * SCALE_FACTOR);
  }
  if (element.height) {
    newEl.height = Math.round(element.height * SCALE_FACTOR);
  }

  // --- Text Alignment & Font Processing ---
  if (element.type === "text") {
    // --- Width Calculation (Crucial for Alignment) ---
    // If width is not set, estimate it based on text length and font size.
    // This is a rough estimation but necessary for the backend alignment.
    if (!newEl.width && element.text) {
      const estimatedCharWidth = (newEl.fontSize || 16) * 0.6;
      newEl.width = Math.round(element.text.length * estimatedCharWidth);
    }

    // --- Alignment Adjustment ---
    // Backend expects element.x to be the top-left x coordinate of the text box.
    // Frontend positions may be provided as the visual anchor depending on textAlign:
    // - left: element.x is already the left edge -> no change
    // - center: element.x is the center point -> subtract width/2 to get left
    // - right: element.x is the right edge -> subtract width to get left
    if (newEl.width) {
      if (element.textAlign === "center") {
        newEl.x = Math.round((element.x - newEl.width / 2) * SCALE_FACTOR);
      } else if (element.textAlign === "right") {
        newEl.x = Math.round((element.x - newEl.width) * SCALE_FACTOR);
      } else {
        // left or unknown
        newEl.x = Math.round(element.x * SCALE_FACTOR);
      }
    } else {
      // If width unknown, keep original x scaled
      newEl.x = Math.round(element.x * SCALE_FACTOR);
    }

    // --- Font Processing ---
    if (element.fontFamily) {
      const rawFontFamily = element.fontFamily || "Arial";
      const weight = element.fontWeight || "normal";
      const style = element.fontStyle || "normal";

      const fontInfo = fontMapping[rawFontFamily];

      if (fontInfo) {
        // Tentukan suffix berdasarkan weight dan style
        let weightSuffix = "Regular";
        const normalizedWeight = weight.toString().toLowerCase();
        if (normalizedWeight === "bold" || normalizedWeight === "700") weightSuffix = "Bold";
        else if (["light", "300"].includes(normalizedWeight)) weightSuffix = "Light";
        else if (["medium", "500"].includes(normalizedWeight)) weightSuffix = "Medium";

        if (style === "italic") {
          weightSuffix = weightSuffix === "Regular" ? "Italic" : `${weightSuffix}Italic`;
        }

        const fontFileName = `${fontInfo.baseFile}-${weightSuffix}`;
        newEl.font = {
          family: `${fontInfo.folder}/${fontFileName}.ttf`,
          weight: weightSuffix,
          style: style,
        };
      } else {
        // Jika font tidak ditemukan dalam mapping, gunakan font family asli sebagai fallback
        newEl.font = {
          family: rawFontFamily,
          weight: weight,
          style: style,
        };
      }
      
      // Tetap simpan informasi font untuk keperluan preview di frontend
      // Jangan hapus fontFamily agar bisa digunakan untuk preview
    }
  }

  // --- Image Path Processing ---
  if (element.type === "image" && element.imageUrl) {
    let path = element.imageUrl;
    // Handle malformed URLs like "http://localhost:8000certificates/..." (missing slash)
    if (/localhost:8000certificates/.test(path) || /127\.0\.0\.1:8000certificates/.test(path)) {
      path = path.replace(/https?:\/\/localhost:8000certificates/, "/storage/certificates");
      path = path.replace(/https?:\/\/127\.0\.0\.1:8000certificates/, "/storage/certificates");
    } else if (path.startsWith("http")) {
      const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
      if (backendUrl) {
        path = path.replace(backendUrl, "");
      } else {
        // If no backendUrl provided, try stripping origin
        try {
          const u = new URL(path);
          path = u.pathname + u.search + u.hash;
        } catch (e) {
          // leave path as-is
        }
      }
    }
    newEl.image_path = path;
    delete newEl.imageUrl;
  }

  return newEl;
}

// Main function to process an array of elements
export function prepareElementsForBackend(elements: any[]): any[] {
  return elements.map((el) => prepareElementForBackend(el));
}