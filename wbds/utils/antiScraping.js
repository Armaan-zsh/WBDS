/**
 * antiScraping.js
 * Protects content from being copy-pasted, scraped, or extracted.
 */

let styleElement = null;
let listeners = [];

function addListener(type, handler) {
    if (typeof document !== 'undefined') {
        document.addEventListener(type, handler);
        listeners.push({ type, handler });
    }
}

function removeListeners() {
    if (typeof document !== 'undefined') {
        listeners.forEach(({ type, handler }) => {
            document.removeEventListener(type, handler);
        });
        listeners = [];
    }
}

/**
 * Disables common copy methods and adds protection layers
 * Returns a cleanup function
 */
export function enableAntiScraping() {
    if (typeof document === 'undefined') return () => { };

    // Prevent double-binding
    removeListeners();

    // 1. Disable Right Click
    addListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
    });

    // 2. Disable Keyboard Shortcuts
    addListener('keydown', (e) => {
        // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U (DevTools shortcuts)
        if (
            e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key)) ||
            (e.ctrlKey && e.key === 'U') ||
            (e.ctrlKey && e.shiftKey && e.key === 'C')
        ) {
            e.preventDefault();
            return false;
        }

        // Allow Ctrl+C/V in input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        // Prevent Ctrl+A, Ctrl+C, Ctrl+X
        if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'x'].includes(e.key.toLowerCase())) {
            e.preventDefault();
            return false;
        }
    });

    // 3. Disable Selection
    addListener('selectstart', (e) => {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            return false;
        }
    });

    // 4. Disable Drag
    addListener('dragstart', (e) => {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            return false;
        }
    });

    // 5. Apply Styles
    if (!document.getElementById('wbds-anti-scraping')) {
        styleElement = document.createElement('style');
        styleElement.id = 'wbds-anti-scraping';
        styleElement.textContent = `
            body, .letter-content, .letter-card, .modal-content {
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                user-select: none;
                -webkit-touch-callout: none;
            }

            /* Allow selection in inputs and textareas */
            input, textarea, .letter-input, .composer-card textarea {
                -webkit-user-select: text !important;
                -moz-user-select: text !important;
                -ms-user-select: text !important;
                user-select: text !important;
            }
            
            /* Prevent image dragging */
            img {
                -webkit-user-drag: none;
                user-drag: none;
                pointer-events: none;
            }
        `;
        document.head.appendChild(styleElement);
    }

    return disableAntiScraping;
}

/**
 * Removes all protections (e.g., for Legal page)
 */
export function disableAntiScraping() {
    removeListeners();
    if (typeof document !== 'undefined') {
        const style = document.getElementById('wbds-anti-scraping');
        if (style) {
            style.remove();
        }
        // Force re-enable selection
        document.body.style.userSelect = 'text';
        document.body.style.webkitUserSelect = 'text';
    }
}

// Keep explicit export for backward compatibility if needed, though mostly handled by enable
export function applyAntiScrapingStyles() {
    // This is now handled inside enableAntiScraping, but keeping empty to prevent breakages if called elsewhere
}