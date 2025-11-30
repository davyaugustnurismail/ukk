// Placeholder text mappings
const PLACEHOLDER_TEXTS = {
    custom: "",
    nama: "{NAMA}",
    instruktur: "{INSTRUKTUR}",
    nomor: "{NOMOR}",
    tanggal: "{TANGGAL}",
};

// Preview text mappings (for visual display only)
const PREVIEW_TEXTS = {
    custom: "",
    nama: "Nama Peserta",
    instruktur: "Nama Instruktur",
    nomor: "CERT-001",
    tanggal: "19 Agustus 2025",
};

// Function to update placeholder text
function updatePlaceholderText() {
    const placeholderType = document.getElementById("placeholderType");
    const elementText = document.getElementById("elementText");
    const previewText = document.getElementById("previewText");

    if (placeholderType && elementText) {
        const selectedType = placeholderType.value;

        if (selectedType === "custom") {
            // For custom text, make the field editable
            elementText.removeAttribute("readonly");
            elementText.value = "";
            elementText.placeholder = "Masukkan teks";
            if (previewText) previewText.textContent = "";
        } else {
            // For placeholders, set both the actual placeholder and make readonly
            elementText.value = PLACEHOLDER_TEXTS[selectedType];
            elementText.setAttribute("readonly", "true");
            elementText.placeholder = "";

            // Update preview if available
            if (previewText) {
                previewText.textContent = PREVIEW_TEXTS[selectedType];
            }
        }

        // Store the type for validation
        elementText.dataset.placeholderType = selectedType;

        // Update any live preview
        updateLivePreview();
    }
}

// Initialize when the page loads
document.addEventListener("DOMContentLoaded", function () {
    // Initialize placeholders when page loads
    const placeholderType = document.getElementById("placeholderType");
    const textInput = document.getElementById("elementText");

    if (placeholderType) {
        // Set initial value and trigger update
        placeholderType.value = placeholderType.options[0].value;
        updatePlaceholderText();

        // Add event listener for changes
        placeholderType.addEventListener("change", updatePlaceholderText);
    }

    // Add event listener for element text to store custom text
    if (textInput) {
        textInput.addEventListener("input", function () {
            const type = placeholderType.value;
            if (type === "custom") {
                this.dataset.customText = this.value;
            }
        });
    }

    // Add event listener for element text input
    const elementText = document.getElementById("elementText");
    if (elementText) {
        elementText.addEventListener("input", function () {
            if (placeholderType.value === "custom") {
                // Store the custom text if needed
                this.dataset.customText = this.value;
            }
        });
    }
});

// Function to get display text for a placeholder type (used in preview)
function getPlaceholderDisplayText(type) {
    // For preview, use the preview text if available, otherwise use the placeholder
    const placeholderText =
        PREVIEW_TEXTS[type] || PLACEHOLDER_TEXTS[type] || type;
    return `<div class="element-content">${placeholderText}</div>`;
}

// Function to update live preview if available
function updateLivePreview() {
    const previewContainer = document.querySelector(".preview-container");
    if (!previewContainer) return;

    const elements = previewContainer.querySelectorAll(
        '.element[data-type="text"]'
    );
    elements.forEach((element) => {
        const placeholderType = element.dataset.placeholderType;
        if (placeholderType && placeholderType !== "custom") {
            const previewContent = element.querySelector(".element-content");
            if (previewContent) {
                previewContent.textContent =
                    PREVIEW_TEXTS[placeholderType] ||
                    PLACEHOLDER_TEXTS[placeholderType];
            }
        }
    });
}

// Function to validate text input before adding element
function validateElementText() {
    const elementText = document.getElementById("elementText");
    const placeholderType = document.getElementById("placeholderType");

    if (!elementText.value.trim()) {
        if (placeholderType.value === "custom") {
            showNotification("Teks tidak boleh kosong", "error");
        } else {
            // If it's a placeholder type but no value, trigger update to set correct value
            updatePlaceholderText();
        }
        return false;
    }
    return true;
}
