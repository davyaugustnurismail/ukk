// Drag handling functions
function getPreviewScale() {
    const previewContainer = document.getElementById('certificate-preview');
    if (!previewContainer) return 1;
    const workspace = document.querySelector('.preview-workspace');
    if (!workspace) return 1;
    const scale = Math.min(
        workspace.offsetWidth / 842,
        workspace.offsetHeight / 595
    );
    return scale || 1;
}

function startDragging(e) {
    // only respond to primary button / pointer events
    if (e.button && e.button !== 0) return;
    const element = e.target.closest('.element');
    if (!element) return;

    e.preventDefault();
    e.stopPropagation();

    isDragging = true;
    draggedElement = element;
    selectedElement = element;

    const previewContainer = document.getElementById('certificate-preview');
    // Prefer the inner fixed-size element container (842x595) as reference
    const inner = previewContainer.querySelector('.preview-elements-container') || previewContainer.querySelector('div');
    const containerRect = inner ? inner.getBoundingClientRect() : previewContainer.getBoundingClientRect();
    // scale relative to that inner container (its CSS pixels correspond to editor px)
    const scale = getPreviewScale();

    // Read element position from style.left/top or dataset
    const left = parseFloat(element.style.left) || parseFloat(element.dataset.x) || 0;
    const top = parseFloat(element.style.top) || parseFloat(element.dataset.y) || 0;

    initialX = (e.clientX - containerRect.left) / scale;
    initialY = (e.clientY - containerRect.top) / scale;

    xOffset = initialX - left;
    yOffset = initialY - top;

    initialElementX = left;
    initialElementY = top;

    // bring to front
    element.style.zIndex = getHighestZIndex() + 1;

    // attempt pointer capture when available
    if (e.pointerId && element.setPointerCapture) {
        try { element.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    }
}

function handleElementDrag(e) {
    if (!isDragging || !draggedElement) return;
    e.preventDefault();

    const previewContainer = document.getElementById('certificate-preview');
    const inner = previewContainer.querySelector('.preview-elements-container') || previewContainer.querySelector('div');
    const containerRect = inner ? inner.getBoundingClientRect() : previewContainer.getBoundingClientRect();
    const scale = getPreviewScale();

    // Compute pointer position relative to preview and scale
    const pointerX = (e.clientX - containerRect.left) / scale;
    const pointerY = (e.clientY - containerRect.top) / scale;

    let newX = pointerX - xOffset;
    let newY = pointerY - yOffset;

    // Constrain to preview bounds
    newX = Math.max(0, Math.min(newX, 842 - draggedElement.offsetWidth));
    newY = Math.max(0, Math.min(newY, 595 - draggedElement.offsetHeight));

    draggedElement.style.left = newX + 'px';
    draggedElement.style.top = newY + 'px';
    // store dataset for robustness
    draggedElement.dataset.x = newX;
    draggedElement.dataset.y = newY;

    // Update model
    const elementId = draggedElement.dataset.id || draggedElement.id;
    const element = elements.find(el => el.id === elementId);
    if (element) {
        element.x = newX;
        element.y = newY;
    }
}

// Listen for pointermove/up at document level to support dragging outside element
document.addEventListener('pointermove', handleElementDrag);
document.addEventListener('pointerup', function(e) {
    if (!isDragging) return;
    isDragging = false;
    if (draggedElement && e.pointerId && draggedElement.releasePointerCapture) {
        try { draggedElement.releasePointerCapture(e.pointerId); } catch (err) { }
    }
    draggedElement = null;
    selectedElement = null;
});

function getHighestZIndex() {
    const elements = document.querySelectorAll(".element");
    let highest = 0;

    elements.forEach((el) => {
        const zIndex = parseInt(window.getComputedStyle(el).zIndex) || 0;
        highest = Math.max(highest, zIndex);
    });

    return highest;
}

// Initialize preview scale on load
document.addEventListener("DOMContentLoaded", function () {
    updatePreviewScale();
});
