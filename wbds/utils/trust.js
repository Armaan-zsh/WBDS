/**
 * Device Fingerprinting Utility (Canvas-based)
 * Creates a persistent identifier based on GPU/Font/OS rendering quirks.
 */

export const getFingerprint = async () => {
    if (typeof window === 'undefined') return 'server';

    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return 'no-canvas';

        // 1. Precise drawing instructions that trigger variations in GPU/Font smoothing
        canvas.width = 200;
        canvas.height = 50;

        // Background
        ctx.fillStyle = "#f60";
        ctx.fillRect(125, 1, 62, 20);

        // Text with specific fonts and styles
        ctx.fillStyle = "#069";
        ctx.font = "11pt no-real-font-123"; // Triggers fallback font rendering
        ctx.fillText("WBDS-Trust-v1, <canvas> \uD83D\uDE42", 2, 15);

        ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
        ctx.font = "18pt Arial";
        ctx.fillText("WBDS-Trust-v1, <canvas> \uD83D\uDE42", 4, 45);

        // 2. Extract Data URL (Pixel Data)
        const data = canvas.toDataURL();

        // 3. Quick hash function (MurmurHash style or simple SHA-256)
        // For lightness, we'll use a simple transformation of the data string
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }

        return `fp_${Math.abs(hash).toString(16)}`;
    } catch (e) {
        console.warn('Fingerprinting failed:', e);
        return 'error';
    }
};

/**
 * Checks if the environment is suspicious (e.g., automated headless browsers)
 */
export const isTrustworthy = () => {
    if (typeof window === 'undefined') return true;

    const n = window.navigator;
    const isBot = /bot|googlebot|crawler|spider|robot|crawling/i.test(n.userAgent);
    const isHeadless = n.webdriver || !n.languages || n.languages.length === 0;

    return !isBot && !isHeadless;
};
