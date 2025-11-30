document.addEventListener('DOMContentLoaded', function() {
    const fontFamilySelect = document.getElementById('fontFamily');
    
    // Create a custom select wrapper
    function createCustomSelect() {
        const wrapper = document.createElement('div');
        wrapper.className = 'custom-font-select-wrapper';
        
        const selectedFont = document.createElement('div');
        selectedFont.className = 'selected-font';
        selectedFont.textContent = fontFamilySelect.options[fontFamilySelect.selectedIndex].text;
        selectedFont.style.fontFamily = fontFamilySelect.value;
        
        const optionsList = document.createElement('div');
        optionsList.className = 'font-options-list';
        
        // Convert options to custom elements
        Array.from(fontFamilySelect.options).forEach(option => {
            const optionElement = document.createElement('div');
            optionElement.className = 'font-option';
            optionElement.textContent = option.text;
            optionElement.style.fontFamily = option.value;
            optionElement.setAttribute('data-value', option.value);
            
            optionElement.addEventListener('click', () => {
                fontFamilySelect.value = option.value;
                selectedFont.textContent = option.text;
                selectedFont.style.fontFamily = option.value;
                optionsList.style.display = 'none';
                // Trigger the change event on the original select
                fontFamilySelect.dispatchEvent(new Event('change'));
            });
            
            optionsList.appendChild(optionElement);
        });
        
        // Toggle options list
        selectedFont.addEventListener('click', () => {
            const isOpen = optionsList.style.display === 'block';
            optionsList.style.display = isOpen ? 'none' : 'block';
        });
        
        // Close options list when clicking outside
        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) {
                optionsList.style.display = 'none';
            }
        });
        
        wrapper.appendChild(selectedFont);
        wrapper.appendChild(optionsList);
        
        // Insert the custom select after the original and hide the original
        fontFamilySelect.parentNode.insertBefore(wrapper, fontFamilySelect.nextSibling);
        fontFamilySelect.style.display = 'none';
        
        return wrapper;
    }
    
    // Add styles for the custom select
    const style = document.createElement('style');
    style.textContent = `
        .custom-font-select-wrapper {
            position: relative;
            width: 100%;
        }
        
        .selected-font {
            padding: 8px 12px;
            border: 1px solid var(--border-color);
            border-radius: 5px;
            background: white;
            cursor: pointer;
            font-size: 14px;
            line-height: 1.5;
            position: relative;
        }
        
        .selected-font::after {
            content: '▼';
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 10px;
            color: #666;
        }
        
        .font-options-list {
            display: none;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            max-height: 300px;
            overflow-y: auto;
            background: white;
            border: 1px solid var(--border-color);
            border-radius: 5px;
            margin-top: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            z-index: 1000;
        }
        
        .font-option {
            padding: 8px 12px;
            cursor: pointer;
            font-size: 14px;
            line-height: 1.5;
            border-bottom: 1px solid #f0f0f0;
        }
        
        .font-option:last-child {
            border-bottom: none;
        }
        
        .font-option:hover {
            background: #f8f9fa;
        }
    `;
    
    document.head.appendChild(style);
    
    // Initialize the custom select
    createCustomSelect();
});
