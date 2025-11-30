// Global variables
let elements = [];
let selectedElement = null;
let draggedElement = null;
let currentZoom = 1;
let initialMouseX = 0;
let initialMouseY = 0;
let initialElementX = 0;
let initialElementY = 0;

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

    if (!file) return;

    // Reset states
    fileNameSpan.textContent = "Belum ada file yang dipilih";
    fileIcon.textContent = "📄";
    fileNameWrapper.style.color = "#666";
    uploadButton.style.display = "none";
    fileInput.classList.remove("is-invalid");

    // Validate file
    if (!validateFile(file)) {
        fileInput.value = "";
        return;
    }

    // Preview valid file
    fileNameSpan.textContent = file.name;
    fileIcon.textContent = "🖼️";
    fileNameWrapper.style.color = "#2d3436";
    uploadButton.style.display = "inline-block";
    uploadButton.style.opacity = "1";
}

function validateFile(file) {
    const validTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!validTypes.includes(file.type)) {
        showNotification("Format file harus JPG, PNG, atau GIF", "error");
        return false;
    }

    if (file.size > 2 * 1024 * 1024) {
        showNotification("Ukuran file maksimal 2MB", "error");
        return false;
    }

    return true;
}

// Image upload functions
async function handleUploadBackground() {
    const fileInput = document.getElementById("backgroundFile");
    const file = fileInput.files[0];
    const preview = document.getElementById("certificate-preview");
    const uploadButton = document.getElementById("uploadButton");

    if (!file) {
        showNotification("Pilih file terlebih dahulu", "error");
        return;
    }

    try {
        uploadButton.disabled = true;
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
            throw new Error("Upload gagal");
        }

        const result = await response.json();
        preview.style.backgroundImage = `url('${result.url}')`;
        preview.classList.add("has-bg");
        preview.dataset.backgroundImage = result.url;
        showNotification("Background berhasil diupload");
    } catch (error) {
        console.error("Upload error:", error);
        showNotification(
            error.message || "Gagal mengupload background",
            "error"
        );
        preview.style.backgroundImage = "";
        preview.classList.remove("has-bg");
        delete preview.dataset.backgroundImage;
    } finally {
        uploadButton.disabled = false;
    }
}

// Element management
function toggleOptions() {
    const type = document.getElementById("elementType").value;
    document.getElementById("textOptions").style.display =
        type === "text" ? "block" : "none";
    document.getElementById("imageOptions").style.display =
        type === "image" ? "block" : "none";
    document.getElementById("qrcodeOptions").style.display =
        type === "qrcode" ? "block" : "none";
}

function addElement() {
    const type = document.getElementById("elementType").value;
    const element = createNewElement(type);

    if (!element) return;

    // Add the new element to the end of the array to ensure highest z-index
    element.zIndex = elements.length + 1;
    elements.push(element);

    // Render all elements to maintain proper layering
    renderElements();

    // Show success notification
    showNotification("Elemen berhasil ditambahkan");

    // Clear form fields if needed
    if (type === "text") {
        document.getElementById("elementText").value = "";
    }
}

function renderElements() {
    updatePreview();
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
            return {
                ...element,
                width: parseInt(document.getElementById("qrcodeSize").value) || 100,
                height: parseInt(document.getElementById("qrcodeSize").value) || 100,
                data: "https://diantara.co.id", // Default QR code data
            };
        case "image":
            // For images, prefer server-uploaded URL, fall back to last dataURL
            return {
                ...element,
                width: parseInt(document.getElementById("imageWidth").value) || 100,
                height: parseInt(document.getElementById("imageHeight").value) || 100,
                src: window._lastImageUrl || window._lastImageData || "",
            };
        case "text":
            const text = document.getElementById("elementText").value;
            const placeholderType =
                document.getElementById("placeholderType").value;

            if (!text && placeholderType === "custom") {
                showNotification("Text tidak boleh kosong", "error");
                return null;
            }

            return {
                ...element,
                text: text,
                fontSize:
                    parseInt(document.getElementById("fontSize").value) || 16,
                fontFamily:
                    document.getElementById("fontFamily").value || "Arial",
                fontWeight:
                    parseInt(document.getElementById("fontWeight").value) || "400",
                fontStyle:
                    document.getElementById("fontStyle").value || "normal",
                textAlign: document.getElementById("textAlign").value || "left",
                placeholderType: placeholderType,
                color: "#000000",
            };
        default:
            return null;
    }
}

// Preview management
function updatePreview() {
    const preview = document.getElementById("certificate-preview");
    preview.innerHTML = "";

    elements.forEach((element) => {
        const div = document.createElement("div");
        div.className = "element";
        div.dataset.id = element.id;

        if (element.type === "qrcode") {
            div.className += " element-qrcode";
            const qr = qrcode(0, 'M');
            qr.addData(element.data || 'https://diantara.co.id'); // Use element.data
            qr.make();
            const qrCodeImage = qr.createDataURL(10, 0);
            div.innerHTML = `<img src="${qrCodeImage}" style="width: ${element.width}px; height: ${element.height}px;">`;
        } else if (element.type === "image") {
            div.className += " element-image";
            div.innerHTML = `<img src="${element.src}" style="width: ${element.width}px; height: ${element.height}px;">`;
        } else if (element.type === "text") {
            div.style.fontSize = element.fontSize + "px";
            div.style.fontFamily = element.fontFamily;
            div.style.fontWeight = element.fontWeight;
            div.style.fontStyle = element.fontStyle;
            div.style.textAlign = element.textAlign;
            div.textContent = element.text;
        }

        div.style.left = element.x + "px";
        div.style.top = element.y + "px";

        // Make element draggable
        div.draggable = true;
        div.addEventListener("mousedown", startDragging);

        preview.appendChild(div);
    });

    updateElementsList();
}

// Initialize drag handling
let isDragging = false;

// Add event listeners for dragging
// Dragging is handled centrally in drag-handler.js (pointer events)

// Update preview container scale on window resize
window.addEventListener('resize', updatePreviewScale);

function updatePreviewScale() {
    const preview = document.getElementById('certificate-preview');
    const workspace = document.querySelector('.preview-workspace');
    const scale = Math.min(
        workspace.offsetWidth / 842,
        workspace.offsetHeight / 595
    );
    preview.style.transform = `scale(${scale})`;
    preview.style.transformOrigin = 'center';
    preview.style.transformBox = 'border-box';
}

// Handle element type selection
function selectElementType(button, type) {
    document.querySelectorAll('.element-type-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    button.classList.add('active');
    document.getElementById('elementType').value = type;
    toggleOptions();
}

function toggleOptions() {
    const type = document.getElementById('elementType').value;
    document.getElementById('textOptions').style.display = type === 'text' ? 'block' : 'none';
    document.getElementById('imageOptions').style.display = type === 'image' ? 'block' : 'none';
    document.getElementById('qrcodeOptions').style.display = type === 'qrcode' ? 'block' : 'none';
}

// Handle drag and drop for background image
const uploadArea = document.querySelector('.upload-btn');

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    uploadArea.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, unhighlight, false);
});

function highlight(e) {
    uploadArea.classList.add('highlight');
}

function unhighlight(e) {
    uploadArea.classList.remove('highlight');
}

uploadArea.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const file = dt.files[0];
    handleFileSelect({ target: { files: [file] } });
}

// Update file preview
function updateFilePreview(file) {
    const preview = document.getElementById('backgroundPreview');
    const reader = new FileReader();
    const fileSize = document.querySelector('.file-size');
    const fileName = document.querySelector('.file-name');

    reader.onloadend = () => {
        preview.src = reader.result;
        preview.style.display = 'block';
    }

    if (file) {
        reader.readAsDataURL(file);
        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Override the original handleFileSelect function
const originalHandleFileSelect = handleFileSelect;
handleFileSelect = function(event) {
    originalHandleFileSelect(event);
    updateFilePreview(event.target.files[0]);
}

// Function to download the certificate preview
function downloadPreview() {
    const preview = document.getElementById('certificate-preview');
    if (!preview.style.backgroundImage) {
        alert('Harap upload background sertifikat terlebih dahulu');
        return;
    }

    html2canvas(preview, {
        scale: 2,
        backgroundColor: null,
        logging: false,
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'preview-sertifikat.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
}

// Scale preview on scroll
const workspace = document.querySelector('.preview-workspace');
workspace.addEventListener('wheel', (e) => {
    if (e.ctrlKey) {
        e.preventDefault();
        const preview = document.getElementById('certificate-preview');
        const currentScale = preview.style.transform ? 
            parseFloat(preview.style.transform.match(/scale\((.*?)\)/)[1]) : 1;
        
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.min(Math.max(currentScale * delta, 0.5), 2);
        
        preview.style.transform = `scale(${newScale})`;
    }
});

// Initialize everything
document.addEventListener("DOMContentLoaded", function () {
    // Set up event listeners
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    // Set up initial element type
    toggleOptions();
});