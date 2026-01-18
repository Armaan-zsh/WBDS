/**
 * antiScraping.js
 * Protects content from being copied, scraped, or extracted.
 */

/**
 * Disables common copy methods and adds protection layers
 */
export function enableAntiScraping() {
    // Disable right-click context menu
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
    });

    // Disable common keyboard shortcuts for copy/cut/paste/select all
    document.addEventListener('keydown', (e) => {
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

        // Allow Ctrl+C/V in input fields, but prevent on body/content
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return; // Allow normal copy/paste in inputs
        }

        // Prevent Ctrl+A (Select All), Ctrl+C (Copy), Ctrl+X (Cut)
        if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'x'].includes(e.key.toLowerCase())) {
            e.preventDefault();
            return false;
        }
    });

    // Disable text selection on non-input elements
    document.addEventListener('selectstart', (e) => {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            return false;
        }
    });

    // Disable drag
    document.addEventListener('dragstart', (e) => {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            return false;
        }
    });

    // Add watermark overlay on copy attempts (even if prevented)
    document.addEventListener('copy', (e) => {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            const watermark = '\n\n--- WBDS --- Anonymous Letters --- Do not copy ---\n';
            e.clipboardData.setData('text/plain', watermark);
            showCopyWarning();
        }
    });

    // Blur content when DevTools is opened (basic detection)
    let devtools = { open: false };
    const element = new Image();
    Object.defineProperty(element, 'id', {
        get: function() {
            devtools.open = true;
            blurContent();
            clearInterval(checkDevTools);
        }
    });

    const checkDevTools = setInterval(() => {
        devtools.open = false;
        console.clear();
        console.log(element);
        console.clear();
        if (!devtools.open) {
            unblurContent();
        }
    }, 1000);
}

/**
 * Apply CSS to prevent selection and copying
 */
export function applyAntiScrapingStyles() {
    const style = document.createElement('style');
    style.id = 'wbds-anti-scraping';
    style.textContent = `
        /* Disable text selection on content */
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

        /* Disable copy cursor */
        body {
            cursor: default !important;
        }

        /* Add invisible watermark layer */
        .letter-content::after {
            content: 'WBDS';
            position: absolute;
            opacity: 0.01;
            pointer-events: none;
            font-size: 1px;
            color: transparent;
        }
    `;
    document.head.appendChild(style);
}

/**
 * Blur content when DevTools detected
 */
function blurContent() {
    document.body.style.filter = 'blur(5px)';
    document.body.style.transition = 'filter 0.3s';
}

/**
 * Unblur content
 */
function unblurContent() {
    document.body.style.filter = 'none';
}

/**
 * Show warning when copy attempt detected
 */
function showCopyWarning() {
    const warning = document.createElement('div');
    warning.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(255, 0, 0, 0.9);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 999999;
        font-weight: bold;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    warning.textContent = 'Content is protected. Copying is not allowed.';
    document.body.appendChild(warning);
    setTimeout(() => warning.remove(), 3000);
}

/**
 * Obfuscate text content (makes scraping harder)
 */
export function obfuscateText(element) {
    if (!element) return;
    
    const text = element.textContent;
    const obfuscated = text.split('').map(char => {
        // Add zero-width spaces randomly (invisible but breaks scraping)
        if (Math.random() > 0.95) {
            return char + '\u200B'; // Zero-width space
        }
        return char;
    }).join('');
    
    element.textContent = obfuscated;
}