/**
 * privacyShield.js
 * Protects users from Doxxing (Direct and Indirect).
 * Enhanced with comprehensive PII detection.
 */

const REDACTED_LABEL = '[REDACTED]';

/**
 * Redacts direct PII (Phone numbers, Emails, SSN, Credit Cards, Addresses, GPS)
 */
export function maskPrivateInfo(text) {
    let processed = text;

    // 1. Email Redaction
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    processed = processed.replace(emailRegex, REDACTED_LABEL);

    // 2. Social Security Number (US) - Format: XXX-XX-XXXX or XXX XX XXXX
    const ssnRegex = /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g;
    processed = processed.replace(ssnRegex, REDACTED_LABEL);

    // 3. Credit Card Numbers - Luhn algorithm would be ideal, but pattern matching first
    // Common formats: XXXX-XXXX-XXXX-XXXX, XXXX XXXX XXXX XXXX, or 16 consecutive digits
    const creditCardRegex = /\b(?:\d{4}[-\s]?){3}\d{4}\b|\b\d{13,19}\b/g;
    processed = processed.replace(creditCardRegex, (match) => {
        const digitsOnly = match.replace(/[^0-9]/g, '');
        // Credit cards are typically 13-19 digits (with spaces/dashes)
        if (digitsOnly.length >= 13 && digitsOnly.length <= 19) {
            return REDACTED_LABEL;
        }
        return match;
    });

    // 4. Phone Number Redaction (Enhanced)
    const phoneBroadMatch = /(?:(?:\+|00)\d{1,3}[ \-.]?)?(?:\(?\d{2,5}\)?[ \-.]?){2,5}\d{2,10}/g;
    processed = processed.replace(phoneBroadMatch, (match) => {
        const digitCount = match.replace(/[^0-9]/g, '').length;
        if (digitCount >= 7 && digitCount <= 15) {
            return REDACTED_LABEL;
        }
        return match;
    });

    // 5. IP Addresses (IPv4)
    const ipRegex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
    processed = processed.replace(ipRegex, REDACTED_LABEL);

    // 6. GPS Coordinates (Latitude/Longitude)
    // Matches: 40.7128, -74.0060 or 40°42'46.08"N, 74°00'21.6"W
    const gpsRegex = /-?\d{1,3}\.?\d*[°]?\s*[NS]?,?\s*-?\d{1,3}\.?\d*[°]?\s*[EW]?/gi;
    processed = processed.replace(gpsRegex, REDACTED_LABEL);

    // 7. Street Addresses (Enhanced patterns)
    const addressPatterns = [
        /(flat|house|apartment|apt|plot|room|unit|suite)\s*(?:no|number|#)?\.?\s*\d+/gi,
        /\d+\s+[a-zA-Z]+(?:\s+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd|way|circle|cir))\.?/gi,
        /\b\d{5}(?:-\d{4})?\s+[a-zA-Z]+/gi, // ZIP + City
    ];
    addressPatterns.forEach(pattern => {
        processed = processed.replace(pattern, REDACTED_LABEL);
    });

    // 8. Pin codes / Zip codes (when clearly identifiable)
    const pinCodeRegex = /\b(?:pin|zip|postal)\s*(?:code)?\s*:?\s*\d{3}\s?\d{3}\b|\b\d{5}(?:-\d{4})?\b/gi;
    processed = processed.replace(pinCodeRegex, REDACTED_LABEL);

    return processed;
}

/**
 * Detects "Indirect Doxxing" patterns and PII before sending.
 */
export function detectPotentialDox(text) {
    const warnings = [];
    const risks = [];
    const normalized = text.toLowerCase();

    // HEURISTIC 1: "At [Company]" pattern
    const workplaceTriggers = ['works at', 'boss at', 'manager at', 'employed by', 'works for', 'employee of'];

    // HEURISTIC 2: "Lives in [City]" pattern
    const locationTriggers = ['lives in', 'lives at', 'address is', 'located at', 'from', 'residing in'];

    // HEURISTIC 3: Real names (capitalized first + last name pattern)
    const namePattern = /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g;
    const nameMatches = text.match(namePattern);
    if (nameMatches && nameMatches.length > 0) {
        // Check if it's not common phrases like "Dear John" or "Thank You"
        const commonPhrases = ['dear', 'thank you', 'best regards', 'sincerely', 'yours truly'];
        const hasCommon = commonPhrases.some(phrase => normalized.includes(phrase));
        if (!hasCommon) {
            warnings.push('POTENTIAL_NAME');
        }
    }

    // HEURISTIC 4: Specific location mentions (cities, states)
    const specificLocationPattern = /\b(live|live in|from|located in|based in|currently in)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/gi;
    if (specificLocationPattern.test(text)) {
        warnings.push('SPECIFIC_LOCATION');
    }

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

    // Check for credit card patterns
    if (/\b(?:\d{4}[-\s]?){3}\d{4}\b|\b\d{13,19}\b/.test(text)) {
        risks.push('CREDIT_CARD');
    }

    // Check for SSN patterns
    if (/\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/.test(text)) {
        risks.push('SSN');
    }

    // Check for GPS coordinates
    if (/-?\d{1,3}\.?\d*[°]?\s*[NS]?,?\s*-?\d{1,3}\.?\d*[°]?\s*[EW]?/i.test(text)) {
        risks.push('GPS_COORDINATES');
    }

    return {
        isRisky: warnings.length > 0 || risks.length > 0,
        warnings: warnings,
        risks: risks
    };
}
