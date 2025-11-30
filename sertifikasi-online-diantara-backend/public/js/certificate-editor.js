// Global variables
let elements = [];
let selectedElement = null;
let draggedElement = null;
let offsetX = 0;
let offsetY = 0;
let currentZoom = 1;
const _registeredFontFaces = {};

// Zoom functions
function zoomPreview(direction) {
    const container = document.getElementById("certificate-preview");
    if (direction === "in" && currentZoom < 2) {
        currentZoom += 0.1;
    } else if (direction === "out" && currentZoom > 0.5) {
        currentZoom -= 0.1;
    }
    container.style.transform = `scale(${currentZoom})`;
}

function resetZoom() {
    currentZoom = 1;
    const container = document.getElementById("certificate-preview");
    container.style.transform = "scale(1)";
}

// Notification function
function showNotification(message, type = "success") {
    const existingNotifications = document.querySelectorAll(".notification");
    existingNotifications.forEach((notification) => notification.remove());

    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = "fadeOut 0.3s ease-out forwards";
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// File handling functions
function handleFileSelect(event) {
    const fileInput = event.target;
    const fileNameWrapper = document.querySelector(".file-name-wrapper");
    const fileNameSpan = document.querySelector(".file-name");
    const uploadButton = document.getElementById("uploadButton");
    const fileIcon = document.querySelector(".file-icon");
    const file = fileInput.files[0];
    const uploadStatus = document.getElementById("uploadStatus");
    const uploadProgress = document.getElementById("uploadProgress");

    // Reset all states first
    fileNameSpan.textContent = "Belum ada file yang dipilih";
    fileIcon.textContent = "📄";
    fileNameWrapper.style.color = "#666";
    uploadButton.style.display = "none";
    uploadStatus.textContent = "";
    uploadProgress.style.display = "none";
    fileInput.classList.remove("is-invalid");

    if (!file) return;

    // Validate file type and size
    validateAndPreviewFile(
        file,
        fileInput,
        fileNameSpan,
        fileIcon,
        fileNameWrapper,
        uploadButton
    );
}

function validateAndPreviewFile(
    file,
    fileInput,
    fileNameSpan,
    fileIcon,
    fileNameWrapper,
    uploadButton
) {
    const validTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!validTypes.includes(file.type)) {
        showNotification("Format file harus JPG, PNG, atau GIF", "error");
        fileInput.value = "";
        fileInput.classList.add("is-invalid");
        return;
    }

    if (file.size > 2 * 1024 * 1024) {
        showNotification("Ukuran file maksimal 2MB", "error");
        fileInput.value = "";
        fileInput.classList.add("is-invalid");
        return;
    }

    const img = new Image();
    img.onload = function () {
        URL.revokeObjectURL(img.src);
        fileNameSpan.textContent = file.name;
        fileIcon.textContent = "🖼️";
        fileNameWrapper.style.color = "#2d3436";
        uploadButton.style.display = "inline-block";
        uploadButton.style.opacity = "1";
    };

    img.onerror = function () {
        URL.revokeObjectURL(img.src);
        showNotification("File bukan gambar yang valid", "error");
        fileInput.value = "";
        fileInput.classList.add("is-invalid");
    };

    img.src = URL.createObjectURL(file);
}

// Image upload functions
async function uploadImage(file) {
    const formData = new FormData();
    formData.append("background_image", file);
    formData.append(
        "_token",
        document.querySelector('meta[name="csrf-token"]').content
    );

    const response = await fetch("/sertifikat-templates/upload-image", {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Upload gagal");
    }

    const result = await response.json();
    return result.url;
}

async function handleUploadBackground() {
    try {
        const fileInput = document.getElementById("backgroundFile");
        const file = fileInput.files[0];
        const preview = document.getElementById("certificate-preview");
        const uploadStatus = document.getElementById("uploadStatus");
        const uploadProgress = document.getElementById("uploadProgress");
        const uploadButton = document.getElementById("uploadButton");

        if (!file) {
            showNotification("Pilih file terlebih dahulu", "error");
            return;
        }

        uploadButton.disabled = true;
        uploadStatus.textContent = "Mengupload...";
        uploadProgress.style.display = "block";

        const imageUrl = await uploadImage(file);

        const img = new Image();
        img.onload = function () {
            preview.style.backgroundImage = `url('${imageUrl}')`;
            preview.classList.add("has-bg");
            preview.dataset.backgroundImage = imageUrl;
            uploadStatus.textContent = "Upload berhasil";
            uploadProgress.style.display = "none";
            uploadButton.disabled = false;
            showNotification("Background berhasil diupload");
        };

        img.onerror = function () {
            throw new Error("Gagal memuat gambar yang diupload");
        };

        img.src = imageUrl;
    } catch (error) {
        console.error("Upload error:", error);
        uploadStatus.textContent = "Upload gagal";
        uploadProgress.style.display = "none";
        uploadButton.disabled = false;
        showNotification(
            error.message || "Gagal mengupload background",
            "error"
        );

        preview.style.backgroundImage = "";
        preview.classList.remove("has-bg");
        delete preview.dataset.backgroundImage;
    }
}

// Element management functions
function toggleOptions() {
    const type = document.getElementById("elementType").value;
    document.getElementById("textOptions").style.display =
        type === "text" ? "block" : "none";
    document.getElementById("imageOptions").style.display =
        type === "image" ? "block" : "none";
    document.getElementById("qrcodeOptions").style.display =
        type === "qrcode" ? "block" : "none";
}

function updatePlaceholderText() {
    const type = document.getElementById("placeholderType").value;
    const input = document.getElementById("elementText");

    if (type === "custom") {
        input.value = "";
        input.removeAttribute("readonly");
    } else {
        const placeholders = {
            nama: "[Nama Peserta]",
            nomor: "[Nomor Sertifikat]",
            tanggal: "[Tanggal Terbit]",
        };
        input.value = placeholders[type] || "";
        input.setAttribute("readonly", "readonly");
    }
}

function addElement() {
    const type = document.getElementById("elementType").value;
    const element = createNewElement(type);

    if (!element) return;

    elements.push(element);
    updatePreview();

    // Reset form fields
    if (type === "text") {
        document.getElementById("elementText").value = "";
    }
    showNotification("Elemen berhasil ditambahkan");
}

function createNewElement(type) {
    const element = {
        id: "element-" + Date.now(),
        type: type,
        x: Math.round(842 / 2 - 50),
        y: Math.round(595 / 2 - 20),
    };

    switch (type) {
        case "qrcode":
            return createQRCodeElement(element);
        case "text":
            return createTextElement(element);
        case "image":
            return createImageElement(element);
        default:
            return null;
    }
}

function createQRCodeElement(element) {
    const size = parseInt(document.getElementById("qrcodeSize").value) || 100;
    element.width = size;
    element.height = size;
    element.placeholderType = "qrcode";
    return element;
}

function createTextElement(element) {
    const placeholderType = document.getElementById("placeholderType").value;
    const text = document.getElementById("elementText").value;

    if (!text && placeholderType === "custom") {
        showNotification("Text tidak boleh kosong", "error");
        return null;
    }

    element.text = text;
    element.fontSize =
        parseInt(document.getElementById("fontSize").value) || 16;
    element.font = getFontSettings();
    element.textAlign = document.getElementById("textAlign").value;
    element.placeholderType = placeholderType;
    return element;
}

function getFontSettings() {
    const familyDisplay = document.getElementById("fontFamily").value;
    const weightSelect = document.getElementById("fontWeight");
    const weightOption = weightSelect.options[weightSelect.selectedIndex];
    const file = weightOption
        ? weightOption.dataset.file || weightOption.value
        : null;
    const cssWeight = weightOption
        ? weightOption.dataset.cssWeight || weightOption.value
        : "400";
    const cssStyle = document.getElementById("fontStyle").value || "normal";

    return {
        family: familyDisplay,
        weight: cssWeight,
        style: cssStyle,
        file: file,
    };
}

function createImageElement(element) {
    const imagePreview = document.getElementById("imagePreview");
    const uploadedUrl = imagePreview.dataset.uploadedUrl;

    if (!uploadedUrl) {
        showNotification("Upload gambar terlebih dahulu", "error");
        return null;
    }

    element.imageUrl = uploadedUrl;
    element.width =
        parseInt(document.getElementById("imageWidth").value) || 100;
    element.height =
        parseInt(document.getElementById("imageHeight").value) || 100;
    return element;
}

// Preview management
function updatePreview() {
    const preview = document.getElementById("certificate-preview");
    const hasBackground = preview.classList.contains("has-bg");
    preview.innerHTML = "";

    createPreviewContainer(preview);
    createElementContainer(preview);

    if (!hasBackground) {
        showBackgroundMessage(preview);
    }

    updateElementsList();
}

function createPreviewContainer(preview) {
    const container = document.createElement("div");
    container.style.cssText = `
        position: relative;
        width: 842px;
        height: 595px;
        transform-origin: top left;
        transform: scale(${preview.offsetWidth / 842});
        margin: 0 auto;
    `;
    preview.appendChild(container);

    elements.forEach((element) => renderElement(element, container));
}

function renderElement(element, container) {
    const div = document.createElement("div");
    div.className = "element";
    div.dataset.id = element.id;

    if (element.type === "qrcode") {
        renderQRCode(element, div);
    } else if (element.type === "text") {
        renderText(element, div);
    }

    setupElementPosition(element, div);
    setupDragAndDrop(div);
    container.appendChild(div);
}

// Font management
function sanitizeKey(s) {
    return String(s || "")
        .replace(/[^a-z0-9\-_]+/gi, "-")
        .toLowerCase();
}

function _formatFromExtension(fileName) {
    if (!fileName) return "truetype";
    const ext = String(fileName).split(".").pop().toLowerCase();
    if (ext === "woff2") return "woff2";
    if (ext === "woff") return "woff";
    if (ext === "otf") return "opentype";
    return "truetype";
}

function registerFontFace(
    folderName,
    fileName,
    cssWeight = "400",
    cssStyle = "normal",
    displayFamily = null
) {
    if (!folderName) return null;

    // Generate family name
    const base = sanitizeKey(folderName);
    const filenameBase = fileName
        ? sanitizeKey(fileName.replace(/\.[^.]+$/, ""))
        : "";
    const genFamily =
        fileName && /\.(ttf|otf|woff2?|woff)$/i.test(fileName)
            ? `${base}-${filenameBase}`
            : `${base}-${cssWeight}-${cssStyle}`;

    if (_registeredFontFaces[genFamily]) return genFamily;
    if (!fileName || !/\.(ttf|otf|woff2?|woff)$/i.test(fileName)) return null;

    const url = `/fonts/${encodeURIComponent(folderName)}/${encodeURIComponent(
        fileName
    )}`;
    const format = _formatFromExtension(fileName);
    const style = document.createElement("style");
    style.type = "text/css";
    style.textContent = `
        @font-face {
            font-family: '${genFamily}';
            src: url('${url}') format('${format}');
            font-weight: ${cssWeight};
            font-style: ${cssStyle};
            font-display: swap;
        }
    `;
    document.head.appendChild(style);
    _registeredFontFaces[genFamily] = true;
    return genFamily;
}

// Initialize
document.addEventListener("DOMContentLoaded", function () {
    const fontFamilySelect = document.getElementById("fontFamily");
    const elementTextInput = document.getElementById("elementText");
    const elementType = document.getElementById("elementType");

    // Initial setup
    fetchWeightsForFont(fontFamilySelect.value);

    // Event listeners
    fontFamilySelect.addEventListener("change", function () {
        fetchWeightsForFont(this.value);
    });

    elementType.addEventListener("change", toggleOptions);

    // Mouse event listeners for drag and drop
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
});
