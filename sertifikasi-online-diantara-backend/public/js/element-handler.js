// Function to render all elements on the certificate
function renderElements() {
    const previewContainer = document.getElementById("certificate-preview");
    // Remove any old preview-elements-container
    const oldContainers = previewContainer.querySelectorAll('.preview-elements-container');
    oldContainers.forEach(c => c.remove());

    // Create a new fixed-size container for all elements
    const container = document.createElement('div');
    container.className = 'preview-elements-container';
    container.style.cssText = 'position:relative; width:842px; height:595px; transform-origin: top left; margin:0 auto;';
    previewContainer.appendChild(container);

    // Render each element inside the fixed container
    elements.forEach((element, index) => {
        const elementDiv = document.createElement("div");
        elementDiv.className = `element element-${element.type}`;
        elementDiv.id = element.id;
        elementDiv.dataset.id = element.id;
        elementDiv.dataset.type = element.type;
        elementDiv.style.position = "absolute";
        elementDiv.style.left = (element.x || 0) + "px";
        elementDiv.style.top = (element.y || 0) + "px";
        elementDiv.style.zIndex = (element.zIndex || index + 1);

        if (element.type === "text") {
            elementDiv.style.background = 'transparent';
            elementDiv.style.padding = '0';
            elementDiv.style.border = 'none';
            const textContent = getDisplayText(element);
            const content = document.createElement('div');
            content.className = 'element-content';
            content.textContent = textContent;
            content.style.fontFamily = element.fontFamily || "Arial";
            content.style.fontSize = (element.fontSize || 16) + "px";
            content.style.fontWeight = element.fontWeight || "400";
            content.style.fontStyle = element.fontStyle || 'normal';
            content.style.textAlign = element.textAlign || 'left';
            content.style.color = element.color || '#2d3436';
            elementDiv.appendChild(content);
            elementDiv.dataset.originalText = element.text || '';
            elementDiv.dataset.placeholderType = element.placeholderType || 'custom';
        } else if (element.type === "qrcode") {
            elementDiv.style.background = 'white';
            elementDiv.style.padding = '6px';
            elementDiv.style.borderRadius = '4px';
            const size = element.width || 100;
            const img = document.createElement('img');
            try {
                const qr = qrcode(0, 'M');
                qr.addData(element.data || 'https://diantara.co.id');
                qr.make();
                const dataUrl = qr.createDataURL(Math.max(1, Math.round(size/25)));
                img.src = dataUrl;
            } catch (err) {
                img.src = '/storage/preview-sample.svg';
            }
            img.style.width = size + 'px';
            img.style.height = size + 'px';
            img.style.display = 'block';
            img.style.pointerEvents = 'none';
            elementDiv.appendChild(img);
        } else if (element.type === "image") {
            elementDiv.style.background = 'transparent';
            elementDiv.style.padding = '0';
            const img = document.createElement('img');
            img.src = element.src || element.imageUrl || '';
            img.style.width = (element.width || 100) + 'px';
            img.style.height = (element.height || 100) + 'px';
            img.style.objectFit = 'contain';
            img.style.display = 'block';
            img.style.pointerEvents = 'none';
            elementDiv.appendChild(img);
        }
        elementDiv.addEventListener('pointerdown', startDragging);
        elementDiv.addEventListener('click', selectElement);
        container.appendChild(elementDiv);
    });
    updateElementsList();
}

// Handle image file selection for new image elements - used by the blade input onchange
function handleImageSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        // store last-picked image as dataURL so addElement can use it as fallback
        window._lastImageData = e.target.result;
        // show preview thumbnail in sidebar (reuse backgroundPreview if present)
        const preview = document.getElementById('backgroundPreview');
        if (preview) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        }
    };
    reader.readAsDataURL(file);

    // Upload the selected image as an element image to the server
    try {
        const formData = new FormData();
        formData.append('element_image', file);
        // attach optional data_activity_id if available in the DOM
        const dataActivity = document.getElementById('dataActivityId');
        if (dataActivity && dataActivity.value) formData.append('data_activity_id', dataActivity.value);
        // CSRF
        const token = document.querySelector('meta[name="csrf-token"]')?.content;
        if (token) formData.append('_token', token);

        fetch('/sertifikat-templates/upload-image', {
            method: 'POST',
            body: formData
        }).then(resp => resp.json()).then(data => {
            if (!data || data.status === 'error') {
                showNotification(data?.message || 'Gagal mengupload gambar elemen', 'error');
                return;
            }
            // store uploaded public URL for use when creating elements
            window._lastImageUrl = data.url;
            showNotification('Gambar elemen berhasil diupload');
        }).catch(err => {
            console.error('Upload element image error', err);
            showNotification('Gagal mengupload gambar elemen', 'error');
        });
    } catch (err) {
        console.error('Upload element image error', err);
    }
}

// Helper function to get display text for placeholders
function getDisplayText(element) {
    if (element.placeholderType === "custom") {
        return element.text;
    }

    // Get preview text from the preview inputs
    const previewTexts = {
        nama: document.getElementById("previewName")?.value || "Nama Peserta",
        nomor: document.getElementById("previewNumber")?.value || "CERT-001",
        tanggal:
            document.getElementById("previewDate")?.value || "19 Agustus 2025",
        instruktur:
            document.getElementById("previewInstructor")?.value ||
            "Nama Instruktur",
    };

    return previewTexts[element.placeholderType] || element.text;
}

// Function to update elements list in sidebar
function updateElementsList() {
    const listContainer = document.getElementById("elementsList");
    listContainer.innerHTML = "";

    elements.forEach((element, index) => {
        const elementItem = document.createElement("div");
        elementItem.className = "element-item";

        // Determine icon and label per element type
        let iconClass = 'fa-question';
        let label = '';
        if (element.type === 'text') {
            iconClass = 'fa-font';
            label = (element.text || '').toString().substring(0, 40) + ((element.text || '').toString().length > 40 ? '...' : '');
        } else if (element.type === 'qrcode') {
            iconClass = 'fa-qrcode';
            label = 'QR Code';
        } else if (element.type === 'image') {
            iconClass = 'fa-image';
            label = 'Gambar';
        } else if (element.type === 'shape') {
            iconClass = 'fa-shapes';
            label = (element.shapeType || 'Shape');
        } else {
            iconClass = 'fa-layer-group';
            label = element.type;
        }

        elementItem.innerHTML = `
            <div>
                <i class="fas ${iconClass}"></i>
                ${label}
            </div>
            <div>
                <button onclick="editElement('${element.id}')" class="button" style="padding: 4px 8px; margin-right: 4px;">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteElement('${element.id}')" class="button danger" style="padding: 4px 8px;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        listContainer.appendChild(elementItem);
    });
}

// Note: drag handling is centralized in drag-handler.js (pointer events)

// Function to select an element
function selectElement(e) {
    const element = e.target.closest(".element");
    if (!element) return;

    // Deselect previously selected element
    document.querySelectorAll(".element.selected").forEach((el) => {
        el.classList.remove("selected");
    });

    // Select new element
    element.classList.add("selected");
    selectedElement = element;
}

// Function to edit an element
function editElement(elementId) {
    const element = elements.find((el) => el.id === elementId);
    if (!element) return;

    // Select the element in the preview
    const elementDiv = document.getElementById(elementId);
    if (elementDiv) {
        selectElement({ target: elementDiv });
    }

    // Populate form fields based on element type
    document.getElementById("elementType").value = element.type;
    toggleOptions();

    if (element.type === "text") {
        document.getElementById("placeholderType").value =
            element.placeholderType;
        document.getElementById("elementText").value = element.text;
        document.getElementById("fontSize").value = element.fontSize;
        document.getElementById("fontFamily").value = element.fontFamily;
        document.getElementById("fontWeight").value = element.fontWeight;
        document.getElementById("fontStyle").value = element.fontStyle;
        document.getElementById("textAlign").value = element.textAlign;
    } else if (element.type === "qrcode") {
        document.getElementById("qrcodeSize").value = element.width;
    } else if (element.type === "image") {
        // Populate image options so user can edit image size and preview
        document.getElementById('imageWidth').value = element.width || 100;
        document.getElementById('imageHeight').value = element.height || 100;

        // show image preview in the sidebar preview area
        const preview = document.getElementById('backgroundPreview');
        if (preview) {
            preview.src = element.src || element.imageUrl || window._lastImageUrl || window._lastImageData || '';
            preview.style.display = preview.src ? 'block' : 'none';
        }
    }
}

// Function to delete an element
function deleteElement(elementId) {
    const index = elements.findIndex((el) => el.id === elementId);
    if (index !== -1) {
        elements.splice(index, 1);
        renderElements();
        showNotification("Elemen berhasil dihapus");
    }
}
