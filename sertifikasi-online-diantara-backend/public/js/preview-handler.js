let selectedFile = null;

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    selectedFile = file;
    updateFilePreview(file);
    document.getElementById("uploadButton").style.display = "inline-block";
}

function updateFilePreview(file) {
    const preview = document.getElementById("backgroundPreview");
    const reader = new FileReader();
    const fileSize = document.querySelector(".file-size");
    const fileName = document.querySelector(".file-name");

    reader.onloadend = () => {
        preview.src = reader.result;
        preview.style.display = "block";
    };

    if (file) {
        reader.readAsDataURL(file);
        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);
    }
}

function uploadBackground() {
    if (!selectedFile) {
        showNotification("Please select a file first.", "error");
        return;
    }

    const formData = new FormData();
    formData.append("background_image", selectedFile);

    // Get CSRF token from meta tag
    const token = document.querySelector('meta[name="csrf-token"]').content;

    // Show progress
    const uploadButton = document.getElementById("uploadButton");
    uploadButton.disabled = true;
    uploadButton.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Uploading...';

    fetch("/sertifikat-templates/upload-image", {
        method: "POST",
        headers: {
            "X-CSRF-TOKEN": token,
        },
        body: formData,
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            if (data.status === "error") {
                throw new Error(data.message || "Upload failed");
            }

            // Update preview background
            const preview = document.getElementById("certificate-preview");
            preview.classList.add("has-bg");
            preview.style.backgroundImage = `url(${data.url})`;
            preview.style.backgroundSize = "100% 100%";
            // Store the background image URL in the dataset
            preview.dataset.backgroundImage = data.url;

            // Hide upload button and reset its state
            uploadButton.style.display = "none";
            uploadButton.disabled = false;
            uploadButton.innerHTML =
                '<i class="fas fa-upload"></i> Upload Background';

            // Remove preview message if exists
            const message = document.getElementById("preview-message");
            if (message) message.remove();

            showNotification("Background berhasil diupload", "success");
        })
        .catch((error) => {
            console.error("Upload error:", error);
            showNotification(error.message || "Upload failed", "error");
            uploadButton.disabled = false;
            uploadButton.innerHTML =
                '<i class="fas fa-upload"></i> Upload Background';
        });
}

function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function showNotification(message, type = "success") {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = "fadeOut 0.3s ease-out forwards";
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function updatePreview() {
    const preview = document.getElementById("certificate-preview");
    const hasBackground = preview.classList.contains("has-bg");
    preview.innerHTML = "";

    // Create preview message if no background
    if (!hasBackground && elements.length === 0) {
        const message = document.createElement("div");
        message.id = "preview-message";
        message.style.cssText =
            "position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;";
        message.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 15px;">📄</div>
            <div style="font-weight: 500; margin-bottom: 8px;">Upload background sertifikat terlebih dahulu</div>
            <div style="color: #666;">Format yang didukung: JPG, PNG, GIF</div>
        `;
        preview.appendChild(message);
    }

    // Create container for elements
    const container = document.createElement("div");
    container.style.cssText = `
        position: relative;
        width: 842px;
        height: 595px;
        transform-origin: top left;
        margin: 0 auto;
        background-size: contain;
        background-position: center;
        background-repeat: no-repeat;
    `;
    preview.appendChild(container);

    // Render each element
    elements.forEach((element) => {
        const div = document.createElement("div");
        div.className = "element";
        div.dataset.id = element.id;
        div.dataset.type = element.type;

        if (element.type === "qrcode") {
            renderQRCode(div, element);
        } else if (element.type === "text") {
            renderText(div, element);
        } else if (element.type === "image") {
            renderImage(div, element);
        }

        // Set position
        div.style.position = "absolute";
        div.style.left = (element.x || 0) + "px";
        div.style.top = (element.y || 0) + "px";

        // Use centralized pointer-based dragging
        div.addEventListener('pointerdown', startDragging);

        container.appendChild(div);
    });

    updateElementsList();
}

function renderQRCode(div, element) {
    div.className += " element-qrcode";
    const size = element.width || 100;
    const img = document.createElement('img');
    img.style.width = size + 'px';
    img.style.height = size + 'px';
    img.style.pointerEvents = 'none';

    try {
        const qr = qrcode(0, 'M');
        qr.addData(element.data || 'https://diantara.co.id');
        qr.make();
        img.src = qr.createDataURL(Math.max(1, Math.round(size/25)));
    } catch (err) {
        img.src = '/storage/preview-sample.svg';
    }

    div.appendChild(img);
}

function renderText(div, element) {
    div.style.fontSize = (element.fontSize || 16) + "px";
    div.style.fontFamily = element.fontFamily || "Arial";
    div.style.fontWeight = element.fontWeight || "normal";
    div.style.fontStyle = element.fontStyle || "normal";
    div.style.color = element.color || "#000";
    div.style.textAlign = element.textAlign || "left";
    div.style.whiteSpace = "nowrap";

    // Create text container
    const textContainer = document.createElement("div");
    textContainer.className = "element-content";
    textContainer.textContent = element.text;
    div.appendChild(textContainer);
}

function renderImage(div, element) {
    div.className += " element-image";
    const img = document.createElement("img");
    img.src = element.src || element.imageUrl || '';
    img.style.width = (element.width || 100) + "px";
    img.style.height = (element.height || 100) + "px";
    img.style.pointerEvents = "none";
    div.appendChild(img);
}

function getPlaceholderLabel(type) {
    const labels = {
        name: "Nama Peserta",
        instructor: "Nama Instruktur",
        number: "Nomor Sertifikat",
        date: "Tanggal",
    };
    return labels[type] || type;
}

// Dragging is handled centrally in drag-handler.js (pointermove/pointerup)

function updateElementsList() {
    const list = document.getElementById("elementsList");
    list.innerHTML = "";

    elements.forEach((element, index) => {
        const div = document.createElement("div");
        div.className = "element-item";

        const typeText =
            element.type === "text"
                ? element.text
                : element.type === "qrcode"
                ? "QR Code"
                : "Image";

        div.innerHTML = `
            <span>${typeText}</span>
            <div class="element-actions">
                <button onclick="editElement(${index})" class="button-edit">Edit</button>
                <button onclick="removeElement(${index})" class="button-delete">Hapus</button>
            </div>
        `;
        list.appendChild(div);
    });
}
