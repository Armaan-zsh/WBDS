/**
 * privacyShield.js
 * Protects users from Doxxing (Direct and Indirect).
 */

const REDACTED_LABEL = '[REDACTED]';

/**
 * Redacts direct PII (Phone numbers, Emails)
 */
export function maskPrivateInfo(text) {
    let processed = text;

    // 1. Email Redaction
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    processed = processed.replace(emailRegex, REDACTED_LABEL);

    // 2. Phone Number Redaction (Aggressive)
    // Matches international codes (+91) and various spacings.
    // Strategy: continuous string of digits/spaces/dashes that contains at least 7 digits.
    // We use a broader match and then validate strict digit count to avoid redacting 2025.
    const phoneBroadMatch = /(?:(?:\+|00)\d{1,3}[ \-.]?)?(?:\(?\d{2,5}\)?[ \-.]?){2,5}\d{2,10}/g;

    processed = processed.replace(phoneBroadMatch, (match) => {
        // Count actual digits
        const digitCount = match.replace(/[^0-9]/g, '').length;
        // Standard phones are usually 7-15 digits.
        if (digitCount >= 7 && digitCount <= 15) {
            return REDACTED_LABEL;
        }
        return match;
    });

    // 3. Address / Coordinates (Simple Heuristic for basic protection)
    // Matches "Flat No 123", "H.No 123"
    const houseNoRegex = /(flat|house|apartment|plot|room)\s*(?:no|number|#)?\.?\s*\d+/gi;
    processed = processed.replace(houseNoRegex, REDACTED_LABEL);

    // 4. Pin codes / Zip codes (6 digits or 5 digits isolated)
    // India/UK/US styles
    const pinCodeRegex = /\b\d{3}\s?\d{3}\b|\b\d{5}(?:-\d{4})?\b/g;
    // processed = processed.replace(pinCodeRegex, REDACTED_LABEL); // Warning: Might catch common numbers, use with caution.

    return processed;
}

/**
 * Detects "Indirect Doxxing" patterns.
 */
export function detectPotentialDox(text) {
    const warnings = [];
    const normalized = text.toLowerCase();

    // HEURISTIC 1: "At [Company]" pattern
    const workplaceTriggers = ['works at', 'boss at', 'manager at', 'employed by'];

    // HEURISTIC 2: "Lives in [City]" pattern
    const locationTriggers = ['lives in', 'lives at', 'address is', 'located at'];

    for (const trigger of workplaceTriggers) {
        if (normalized.includes(trigger)) {
            warnings.push('WORKPLACE_MENTION');
            break;
        }
    }

    for (const trigger of locationTriggers) {
        if (normalized.includes(trigger)) {
            warnings.push('LOCATION_MENTION');
            break;
        }
    }

    return {
        isRisky: warnings.length > 0,
        warnings: warnings
    };
}
