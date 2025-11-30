// Preview text state
let previewState = {
    nama: "Nama Peserta",
    nomor: "CERT-001",
    tanggal: "19 Agustus 2025",
    instruktur: "Nama Instruktur",
};

// Function to update preview values
function updatePreview() {
    const previewName = document.getElementById("previewName").value;
    const previewNumber = document.getElementById("previewNumber").value;
    const previewDate = document.getElementById("previewDate").value;
    const previewInstructor =
        document.getElementById("previewInstructor").value;

    // Update the preview state
    previewState = {
        nama: previewName,
        nomor: previewNumber,
        tanggal: previewDate,
        instruktur: previewInstructor,
    };

    // Update all placeholder elements in the preview
    const elements = document.querySelectorAll('.element[data-type="text"]');
    elements.forEach((element) => {
        const text = element.querySelector(".element-content");
        if (text) {
            const originalText = text.getAttribute("data-original");
            if (originalText) {
                text.textContent = getPreviewText(originalText);
            }
        }
    });

    showNotification("Preview updated successfully", "success");
}

// Function to get preview text for a placeholder
function getPreviewText(text) {
    return text
        .replace(/{NAMA}/g, previewState.nama)
        .replace(/{NOMOR}/g, previewState.nomor)
        .replace(/{TANGGAL}/g, previewState.tanggal)
        .replace(/{INSTRUKTUR}/g, previewState.instruktur);
}

// Function to add a new text element to the preview
function addTextElement(config) {
    const element = document.createElement("div");
    element.className = "element";
    element.setAttribute("data-type", "text");

    const content = document.createElement("div");
    content.className = "element-content";
    content.setAttribute("data-original", config.text);
    content.textContent = getPreviewText(config.text);

    element.appendChild(content);

    // Set position
    element.style.left = config.x + "pt";
    element.style.top = config.y + "pt";

    // Add to preview container
    document.querySelector(".preview-container").appendChild(element);
}

// Helper function to show notifications
function showNotification(message, type = "success") {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Initialize preview when document loads
document.addEventListener("DOMContentLoaded", function () {
    // Set initial values in preview inputs
    const previewName = document.getElementById("previewName");
    const previewNumber = document.getElementById("previewNumber");
    const previewDate = document.getElementById("previewDate");
    const previewInstructor = document.getElementById("previewInstructor");

    if (previewName) previewName.value = previewState.nama;
    if (previewNumber) previewNumber.value = previewState.nomor;
    if (previewDate) previewDate.value = previewState.tanggal;
    if (previewInstructor) previewInstructor.value = previewState.instruktur;

    // Update preview if elements already exist
    updatePreview();
});
