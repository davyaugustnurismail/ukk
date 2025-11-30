async function saveTemplate() {
    try {
        const preview = document.getElementById("certificate-preview");
        const templateName = document.getElementById("templateName").value;
        const merchantId = document.getElementById("merchantId").value;

        // Validations
        if (!merchantId) {
            showNotification("Merchant ID tidak ditemukan", "error");
            return;
        }

        if (!templateName) {
            showNotification("Nama template harus diisi", "error");
            return;
        }

        // Check for background image
        const backgroundImage = preview.dataset.backgroundImage;
        if (!backgroundImage || !preview.classList.contains("has-bg")) {
            showNotification(
                "Background sertifikat harus diupload terlebih dahulu",
                "error"
            );
            return;
        }

        if (elements.length === 0) {
            showNotification("Tambahkan minimal satu elemen", "error");
            return;
        }

        showNotification("Menyimpan template...");

        const data = {
            merchant_id: merchantId,
            name: templateName,
            background_image: preview.dataset.backgroundImage,
            elements: elements.map((element) => {
                const el = {
                    type: element.type,
                    x: element.x,
                    y: element.y,
                    width: element.width,
                    height: element.height,
                    text: element.text,
                    fontSize: element.fontSize,
                    fontFamily: element.fontFamily,
                    fontWeight: element.fontWeight,
                    fontStyle: element.fontStyle,
                    textAlign: element.textAlign,
                    placeholderType: element.placeholderType,
                };

                if (element.type === 'qrcode') {
                    // Prefer qrcode data stored in model, fall back to DOM image src
                    el.qrcode = element.qrcode || element.data || null;
                    if (!el.qrcode) {
                        const qrCodeElement = document.querySelector(`[data-id='${element.id}'] img`);
                        if (qrCodeElement) el.qrcode = qrCodeElement.src;
                    }
                }

                if (element.type === 'image') {
                    // try to capture src from model or DOM
                    el.src = element.src || element.imageUrl || null;
                }

                if (element.type === 'text') {
                    // Send nested font object so server can resolve/embed fonts
                    el.font = {
                        family: element.fontFamily || element.font || 'Arial',
                        weight: element.fontWeight || '400',
                        style: element.fontStyle || 'normal',
                        cssWeight: element.fontWeight || '400'
                    };
                }

                return el;
            }),
        };

        const response = await fetch("/sertifikat-templates", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN": document.querySelector(
                    'meta[name="csrf-token"]'
                ).content,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.message || "Gagal menyimpan template");
        }

        showNotification("Template berhasil disimpan");

        // Reset form
        document.getElementById("templateName").value = "";
        elements = [];
        preview.style.backgroundImage = "";
        preview.classList.remove("has-bg");
        delete preview.dataset.backgroundImage;
        updatePreview();
    } catch (error) {
        console.error("Save template error:", error);
        showNotification(error.message || "Gagal menyimpan template", "error");
    }
}

// Background image handling
async function handleUploadBackground() {
    const fileInput = document.getElementById("backgroundFile");
    const file = fileInput.files[0];
    const preview = document.getElementById("certificate-preview");
    const uploadButton = document.getElementById("uploadButton");
    const uploadStatus = document.getElementById("uploadStatus");
    const uploadProgress = document.getElementById("uploadProgress");

    if (!file) {
        showNotification("Pilih file terlebih dahulu", "error");
        return;
    }

    try {
        uploadButton.disabled = true;
        uploadStatus.textContent = "Mengupload...";
        uploadProgress.style.display = "block";

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

        // Set background image
        preview.style.backgroundImage = `url('${result.url}')`;
        preview.classList.add("has-bg");
        preview.dataset.backgroundImage = result.url;

        // Remove preview message if exists
        const previewMessage = document.getElementById("preview-message");
        if (previewMessage) {
            previewMessage.remove();
        }

        uploadStatus.textContent = "Upload berhasil";
        showNotification("Background berhasil diupload");
    } catch (error) {
        console.error("Upload error:", error);
        uploadStatus.textContent = "Upload gagal";
        showNotification(
            error.message || "Gagal mengupload background",
            "error"
        );

        // Reset preview if upload failed
        preview.style.backgroundImage = "";
        preview.classList.remove("has-bg");
        delete preview.dataset.backgroundImage;
    } finally {
        uploadButton.disabled = false;
        uploadProgress.style.display = "none";
    }
}
