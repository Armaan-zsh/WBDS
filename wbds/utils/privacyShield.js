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
    // Looks for x@y.z pattern
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    processed = processed.replace(emailRegex, REDACTED_LABEL);

    // 2. Phone Number Redaction
    // Looks for 7-15 digits with or without separators
    // This is tricky to not catch years (2025), so we look for specific separators usually.
    const phoneRegex = /(?:\+?\d{1,3}[ -]?)?\(?\d{3}\)?[ -]?\d{3}[ -]?\d{4}/g;
    processed = processed.replace(phoneRegex, REDACTED_LABEL);

    // 3. Credit Card-ish numbers (Sequences of 16 digits)
    const ccRegex = /\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b/g;
    processed = processed.replace(ccRegex, REDACTED_LABEL);

    return processed;
}

/**
 * Detects "Indirect Doxxing" patterns.
 * e.g. "My boss John at Google", "Tim who lives in Seattle"
 * Returns internal flags to determine if we should warn the user.
 */
export function detectPotentialDox(text) {
    const warnings = [];
    const normalized = text.toLowerCase();

    // HEURISTIC 1: "At [Company]" pattern
    // We look for "at" followed by a capitalized word (in original text ideally, but simple check first)
    // Simple check: "works at", "boss at", "manager at"
    const workplaceTriggers = ['works at', 'boss at', 'manager at', 'employed by'];

    // HEURISTIC 2: "Lives in [City]" pattern
    const locationTriggers = ['lives in', 'address is', 'street is', 'house is'];

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
