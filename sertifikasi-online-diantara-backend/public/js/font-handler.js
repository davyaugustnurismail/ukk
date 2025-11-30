// Font handling and preview functionality
document.addEventListener('DOMContentLoaded', function() {
    const fontFamilySelect = document.getElementById('fontFamily');
    const fontWeightSelect = document.getElementById('fontWeight');
    const fontStyleSelect = document.getElementById('fontStyle');
    const previewArea = document.querySelector('.preview-container');

    // Update font preview when font family changes
    fontFamilySelect.addEventListener('change', updateFontPreview);
    fontWeightSelect.addEventListener('change', updateFontPreview);
    fontStyleSelect.addEventListener('change', updateFontPreview);

    // Apply the selected font to the select element itself
    function updateSelectFont() {
        const selectedFont = fontFamilySelect.value;
        fontFamilySelect.style.fontFamily = selectedFont;
    }

    // Initial font application to select
    updateSelectFont();

    // Update font when selection changes
    fontFamilySelect.addEventListener('change', updateSelectFont);

    function updateFontPreview() {
        const selectedFont = fontFamilySelect.value;
        const selectedWeight = fontWeightSelect.value;
        const selectedStyle = fontStyleSelect.value;

        // Update all text elements in preview with selected font
        const textElements = previewArea.querySelectorAll('.element[data-type="text"]');
        textElements.forEach(element => {
            if (element === document.activeElement || element.classList.contains('selected')) {
                element.style.fontFamily = selectedFont;
                element.style.fontWeight = selectedWeight;
                element.style.fontStyle = selectedStyle;
            }
        });
    }

    // Update preview when adding new text element
    window.addTextElement = function(text, properties) {
        const element = document.createElement('div');
        element.className = 'element';
        element.setAttribute('data-type', 'text');
        element.contentEditable = true;
        element.textContent = text || 'Text Baru';
        
        // Apply font properties
        element.style.fontFamily = fontFamilySelect.value;
        element.style.fontWeight = fontWeightSelect.value;
        element.style.fontStyle = fontStyleSelect.value;
        element.style.fontSize = properties?.fontSize || '16px';
        
        // Position the element
        element.style.left = properties?.left || '50%';
        element.style.top = properties?.top || '50%';
        element.style.transform = 'translate(-50%, -50%)';
        
        previewArea.appendChild(element);
        makeElementDraggable(element);
        
        // Select the new element
        selectElement(element);
        return element;
    };

    // Helper function to update font properties of selected element
    window.updateSelectedElementFont = function() {
        const selectedElement = previewArea.querySelector('.element.selected');
        if (selectedElement && selectedElement.getAttribute('data-type') === 'text') {
            selectedElement.style.fontFamily = fontFamilySelect.value;
            selectedElement.style.fontWeight = fontWeightSelect.value;
            selectedElement.style.fontStyle = fontStyleSelect.value;
        }
    };
});
