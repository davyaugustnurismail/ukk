function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const preview = document.getElementById("certificate-preview");
            const previewMessage = document.getElementById("preview-message");
            const img = new Image();

            img.onload = function () {
                // Sembunyikan pesan preview
                if (previewMessage) {
                    previewMessage.style.display = "none";
                }

                const maxWidth = 800;
                const maxHeight = 600;

                // Calculate aspect ratio
                const aspectRatio = img.width / img.height;

                // Calculate new dimensions
                let newWidth = img.width;
                let newHeight = img.height;

                if (newWidth > maxWidth) {
                    newWidth = maxWidth;
                    newHeight = newWidth / aspectRatio;
                }

                if (newHeight > maxHeight) {
                    newHeight = maxHeight;
                    newWidth = newHeight * aspectRatio;
                }

                // Update preview dimensions
                preview.style.width = `${newWidth}px`;
                preview.style.height = `${newHeight}px`;
                preview.style.backgroundImage = `url(${e.target.result})`;
                preview.style.backgroundSize = "contain";
                preview.style.backgroundRepeat = "no-repeat";
                preview.style.backgroundPosition = "center";

                // Store original dimensions
                preview.dataset.originalWidth = img.width;
                preview.dataset.originalHeight = img.height;
            };

            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}
