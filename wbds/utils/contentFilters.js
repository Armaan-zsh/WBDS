/**
 * contentFilters.js
 * The first line of defense against spam and chaos.
 */

// LEETSPEAK MAPPING
// We map common "trick" characters back to their normal English counterparts
// so our pattern matchers can see through the disguise.
const LEET_MAP = {
    '0': 'o',
    '1': 'i',
    '3': 'e',
    '4': 'a',
    '5': 's',
    '@': 'a',
    '$': 's',
    '(': 'c',
    '[': 'c',
    '{': 'c',
    '+': 't'
};

/**
 * "The Squasher"
 * Normalizes text to strictly lowercase english letters to find hidden patterns.
 * e.g., "W_W_W . G00GLE . C0M" -> "wwwgooglecom"
 */
export function normalizeText(text) {
    let normalized = text.toLowerCase();

    // 1. Replace Leetspeak
    normalized = normalized.replace(/[01345@$([+]/g, char => LEET_MAP[char] || char);

    // 2. Remove ALL non-alphanumeric characters (spaces, dots, underscores, emojis)
    // We want to see the "skeleton" of the text.
    const skeleton = normalized.replace(/[^a-z0-9]/g, '');

    return {
        raw: text,
        normalized: normalized,
        skeleton: skeleton
    };
}

/**
 * "The Shape Detector"
 * Checks if the generic structure of the text contains a link.
 * We look for the "Pattern" of a domain in the skeleton text.
 */
export function containsLinkPattern(text) {
    const { skeleton } = normalizeText(text);

    // High-Risk TLD signatures (in skeleton form)
    // We look for patterns like "www" followed by anything, or "http"
    // or common suffixes appearing at the end or middle.

    const blockPatterns = [
        /www\.[a-z0-9]+\.(com|net|org|xyz|io|co)/, // www.something.com (Strict)
        /http(s)?:\/\/[a-z0-9]+/,                   // http(s)://...
        /[a-z0-9]+\.(com|net|org|xyz|io|co)(\/|$)/  // domain.com (Strict dot)
    ];

    for (const pattern of blockPatterns) {
        if (pattern.test(skeleton)) {
            return true;
        }
    }

    return false;
}

/**
 * "The Vibe Check" (Simple Heuristic for now)
 * Returns true if the text seems legitimate enough to process.
 */
export function isLegitContent(text) {
    if (!text || text.length < 10) return false; // Too short to be a letter

    // Check for "Keyboard Mash" (too many consonants in a row)
    // Check for "All Caps" yelling (allowable, but maybe we flag it internally)

    return true;
}

/**
 * "The Social Shield"
 * Detects requests to move off-platform or share handles.
 * Targets: Instagram, Snapchat, Telegram, WhatsApp, Discord, Handle references.
 */
export function containsSocialSolicitation(text) {
    const { normalized } = normalizeText(text);

    // 1. Explicit Platform Keywords
    const platforms = [
        'instagra', 'insta', ' ig ', 'snapchat', ' snap ', 'telegram', 'whatsapp', 'discord', 'kik ', 'wickr'
    ];

    for (const p of platforms) {
        if (normalized.includes(p)) return true;
    }

    // 2. Action Phrases + Handle Patterns
    // "add me @..." "dm me on..." 
    const actionPhrases = [
        /add\s+me/i,
        /dm\s+me/i,
        /inbox\s+me/i,
        /follow\s+me/i,
        /message\s+me/i,
        /hit\s+me\s+up/i
    ];

    // 3. Handle Detectors (@username, username_123)
    // We look for "@" or "user:" patterns commonly used to drop handles.
    const handlePatterns = [
        /@\w{3,}/,             // @somebody
        /(user|u)(name)?[:\s-]+\w+/ // username: somebody
    ];

    // Check if phrases exist
    for (const pattern of actionPhrases) {
        if (pattern.test(normalized)) return true;
    }

    // Check handles
    for (const pattern of handlePatterns) {
        if (pattern.test(normalized)) return true;
    }

    return false;
}
