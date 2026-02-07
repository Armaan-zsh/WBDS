/**
 * contentFilters.js
 * The first line of defense against spam and chaos.
 */

// Zero-width characters to strip
const ZERO_WIDTH = /[\u200B-\u200D\uFEFF\u00A0]/g;

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
 * "The Squisher" - Collapse ALL whitespace to catch split handles
 * Input: "@  user\nname 123"
 * Output: "@username123"
 */
export function squishText(text) {
    return text
        .replace(ZERO_WIDTH, '')      // Remove zero-width chars
        .replace(/[\s\r\n\t]+/g, '')  // Remove ALL whitespace
        .toLowerCase();
}

/**
 * Detect obfuscated social handles that bypass normalizeText
 */
export function containsObfuscatedSocial(text) {
    const squished = squishText(text);

    const patterns = [
        /@[a-z0-9_]{3,}/,                          // @handle
        /followmeon(insta|ig|tiktok|snap|discord|telegram)/,
        /dmme(on)?/,
        /(add|hit)me(up)?(on)?/,
        /my(ig|insta|snap|tiktok|discord)[:=]/,
        /u(ser)?[:=][a-z0-9_]+/,
    ];

    return patterns.some(p => p.test(squished));
}

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
        /\b(user|username)[:\s-]+\w+/, // "user: name" or "username name"
        /\bu[:\-]+\w+/         // "u: name" (Must have colon/dash, space alone not enough for 'u')
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

// ============================================
// NEW DETECTION LAYERS (Content Moderation V2)
// ============================================

/**
 * Layer 1: Encoded Content Detection
 * Detects morse code, base64, hex, binary attempts to bypass filters
 */
export function containsEncodedContent(text) {
    const { skeleton } = normalizeText(text);

    // Morse code: sequences of dots and dashes
    const morsePattern = /[.\-]{10,}/;
    if (morsePattern.test(text.replace(/\s/g, ''))) {
        return { detected: true, type: 'morse' };
    }

    // Binary: long sequences of 0s and 1s
    const binaryPattern = /\b[01]{16,}\b/;
    if (binaryPattern.test(text)) {
        return { detected: true, type: 'binary' };
    }

    // Hex: long hex strings
    const hexPattern = /\b[0-9a-f]{20,}\b/i;
    if (hexPattern.test(text)) {
        return { detected: true, type: 'hex' };
    }

    // Base64: characteristic pattern with = padding
    const base64Pattern = /[A-Za-z0-9+/]{30,}={0,2}/;
    if (base64Pattern.test(text)) {
        return { detected: true, type: 'base64' };
    }

    return { detected: false };
}

/**
 * Layer 1.5: Emoji Limit Check
 * Limits emojis to 7 per letter
 */
const MAX_EMOJIS = 7;

export function countEmojis(text) {
    // Unicode emoji regex - catches most emojis including compound ones
    const emojiRegex = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu;
    const matches = text.match(emojiRegex);
    return matches ? matches.length : 0;
}

export function containsTooManyEmojis(text) {
    const count = countEmojis(text);
    if (count > MAX_EMOJIS) {
        return { detected: true, count, limit: MAX_EMOJIS };
    }
    return { detected: false, count };
}

/**
 * Layer 2: HTML/JS Injection Detection
 * Strips or blocks script injection attempts
 */
export function containsInjection(text) {
    const injectionPatterns = [
        /<script[\s\S]*?>/gi,
        /<\/script>/gi,
        /javascript:/gi,
        /on(click|error|load|mouseover|focus|blur|submit|change)\s*=/gi,
        /<iframe/gi,
        /<object/gi,
        /<embed/gi,
        /<img\s+[^>]*(onerror|onload)/gi,
        /document\.(cookie|location|write|domain)/gi,
        /window\.(location|open|eval)/gi,
        /eval\s*\(/gi,
        /new\s+Function\s*\(/gi,
        /innerHTML\s*=/gi,
        /outerHTML\s*=/gi,
    ];

    for (const pattern of injectionPatterns) {
        if (pattern.test(text)) {
            return { detected: true, type: 'injection' };
        }
    }

    return { detected: false };
}

/**
 * Layer 3: Commercial Spam Detection
 * Blocks promotional/commercial content
 */
export function containsCommercialSpam(text) {
    const { normalized } = normalizeText(text);

    // Promotional keywords
    const spamKeywords = [
        /\b(buy|shop|purchase|order)\s+(now|today|here)/gi,
        /\b(discount|sale|off|promo|coupon|deal|offer)\s*\d/gi,
        /\b(shopify|gumroad|etsy|amazon|ebay)\s*(store|shop|link)/gi,
        /\b(crypto|bitcoin|ethereum|nft|token|airdrop|wallet)\b/gi,
        /\$\d+(\.\d{2})?\s*(off|discount|only)/gi,
        /\b(free|win|winner|prize|giveaway|lottery)\b.*\b(click|link|enter)\b/gi,
        /\b(mlm|passive income|work from home|be your own boss)\b/gi,
        /\bcheck out my (shop|store|page|website)\b/gi,
    ];

    for (const pattern of spamKeywords) {
        if (pattern.test(normalized)) {
            return { detected: true, type: 'commercial_spam' };
        }
    }

    return { detected: false };
}

/**
 * Layer 4: Targeted Threat Detection
 * Blocks direct threats to specific individuals
 */
export function containsTargetedThreat(text) {
    const { normalized } = normalizeText(text);

    const threatPatterns = [
        /i\s+(will|am going to|gonna|want to|need to)\s+(kill|murder|hurt|attack|shoot|stab|bomb)\s+\w+/gi,
        /\b(kill|murder|hurt|attack|shoot|stab)\s+(him|her|them|you|that\s+\w+)/gi,
        /\b(gonna|going to)\s+(find|get|hurt)\s+(you|him|her|them)\b/gi,
        /\b(i know where)\s+(you|he|she|they)\s+(live|work|go)/gi,
        /\b(your|his|her|their)\s+(address|location|school|workplace)\s+is\b/gi,
    ];

    for (const pattern of threatPatterns) {
        if (pattern.test(normalized)) {
            return { detected: true, type: 'targeted_threat' };
        }
    }

    return { detected: false };
}

/**
 * Layer 5: CSAM Detection
 * Blocks child exploitation content
 */
export function containsCSAM(text) {
    const { normalized } = normalizeText(text);

    // Direct keywords (always block)
    const directKeywords = /\b(cp|pedo|pedophile|loli|shota|jailbait)\b/gi;
    if (directKeywords.test(normalized)) {
        return { detected: true, type: 'csam_keyword' };
    }

    // Context-based detection (minor + sexual context)
    const minorTerms = /\b(child|children|kid|kids|minor|minors|underage|young|little)\b/gi;
    const sexualTerms = /\b(nude|naked|sex|sexual|porn|fuck|molest|touch|abuse)\b/gi;

    const hasMinor = minorTerms.test(normalized);
    const hasSexual = sexualTerms.test(normalized);

    // Reset regex lastIndex
    minorTerms.lastIndex = 0;
    sexualTerms.lastIndex = 0;

    // Check for co-occurrence within proximity
    if (hasMinor && hasSexual) {
        // Additional check: are they near each other?
        const words = normalized.split(/\s+/);
        let minorIndex = -1;
        let sexualIndex = -1;

        for (let i = 0; i < words.length; i++) {
            if (minorTerms.test(words[i])) minorIndex = i;
            if (sexualTerms.test(words[i])) sexualIndex = i;
            minorTerms.lastIndex = 0;
            sexualTerms.lastIndex = 0;
        }

        // If within 10 words of each other, flag
        if (minorIndex !== -1 && sexualIndex !== -1 && Math.abs(minorIndex - sexualIndex) <= 10) {
            return { detected: true, type: 'csam_context' };
        }
    }

    return { detected: false };
}

/**
 * Master Moderation Function
 * Runs all checks and returns structured result
 */
export function moderateContent(text) {
    const results = {
        allowed: true,
        blocked: false,
        warnings: [],
        blockReason: null,
        blockMessage: null,
    };

    // Layer 0: Obfuscation Check (runs first)
    if (containsObfuscatedSocial(text)) {
        results.blocked = true;
        results.allowed = false;
        results.blockReason = 'obfuscated_social';
        results.blockMessage = "The void is for releasing emotions, not collecting followers.";
        return results;
    }

    // Layer 1: Encoded Content
    const encoded = containsEncodedContent(text);
    if (encoded.detected) {
        results.blocked = true;
        results.allowed = false;
        results.blockReason = 'encoded_content';
        results.blockMessage = "The void speaks in words, not code. Please write plainly.";
        return results;
    }

    // Layer 1.5: Emoji Limit
    const emojis = containsTooManyEmojis(text);
    if (emojis.detected) {
        results.blocked = true;
        results.allowed = false;
        results.blockReason = 'too_many_emojis';
        results.blockMessage = `Too many emojis (${emojis.count}). Maximum ${emojis.limit} allowed. Express with words.`;
        return results;
    }

    // Layer 2: HTML/JS Injection (strip, don't block)
    const injection = containsInjection(text);
    if (injection.detected) {
        results.warnings.push('html_stripped');
    }

    // Layer 3: Commercial Spam
    const spam = containsCommercialSpam(text);
    if (spam.detected) {
        results.blocked = true;
        results.allowed = false;
        results.blockReason = 'commercial_spam';
        results.blockMessage = "This space is for emotions, not promotions.";
        return results;
    }

    // Layer 4: Targeted Threats
    const threat = containsTargetedThreat(text);
    if (threat.detected) {
        results.blocked = true;
        results.allowed = false;
        results.blockReason = 'targeted_threat';
        results.blockMessage = "The void doesn't carry threats. Release anger, not violence.";
        return results;
    }

    // Layer 5: CSAM
    const csam = containsCSAM(text);
    if (csam.detected) {
        results.blocked = true;
        results.allowed = false;
        results.blockReason = 'csam';
        results.blockMessage = "This content is not allowed.";
        return results;
    }

    // Layer 6-8: Existing checks (warnings, not blocks)
    if (containsLinkPattern(text)) {
        results.warnings.push('links_detected');
    }

    if (containsSocialSolicitation(text)) {
        results.warnings.push('social_handles_detected');
    }

    return results;
}

/**
 * Strip HTML/JS from content (sanitize rather than block)
 */
export function sanitizeContent(text) {
    // Remove script tags and their contents
    let cleaned = text.replace(/<script[\s\S]*?<\/script>/gi, '');

    // Remove all HTML tags
    cleaned = cleaned.replace(/<[^>]*>/g, '');

    // Remove javascript: URLs
    cleaned = cleaned.replace(/javascript:/gi, '');

    // Remove event handlers
    cleaned = cleaned.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');

    return cleaned;
}
