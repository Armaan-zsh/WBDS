/**
 * aiModeration.js
 * AI-powered content moderation using Google Perspective API
 */

const PERSPECTIVE_URL = 'https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze';

/**
 * Analyze text with Google Perspective API
 * Returns toxicity scores (0-1) for various categories
 */
export async function analyzeWithAI(text) {
    const apiKey = process.env.PERSPECTIVE_API_KEY;

    // Graceful degradation if no key
    if (!apiKey) {
        console.warn('PERSPECTIVE_API_KEY not set, skipping AI moderation');
        return { skip: true };
    }

    try {
        const response = await fetch(`${PERSPECTIVE_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                comment: { text },
                languages: ['en'],
                requestedAttributes: {
                    TOXICITY: {},
                    SEVERE_TOXICITY: {},
                    IDENTITY_ATTACK: {},
                    THREAT: {},
                    SEXUALLY_EXPLICIT: {},
                }
            }),
            signal: AbortSignal.timeout(3000) // 3s timeout
        });

        if (!response.ok) {
            throw new Error(`Perspective API: ${response.status}`);
        }

        const data = await response.json();

        // Extract scores
        const scores = {};
        for (const [attr, val] of Object.entries(data.attributeScores || {})) {
            scores[attr] = val.summaryScore.value;
        }

        const maxScore = Math.max(...Object.values(scores));

        return {
            skip: false,
            scores,
            maxScore,
            flagged: scores.SEVERE_TOXICITY > 0.85 || scores.THREAT > 0.85,
            needsReview: scores.TOXICITY > 0.6 && !(scores.SEVERE_TOXICITY > 0.85)
        };

    } catch (error) {
        console.error('AI Moderation Error:', error.message);
        return { skip: true, error: error.message };
    }
}

/**
 * Get dynamic toxicity threshold based on trust score
 */
export function getToxicityThreshold(trustScore) {
    if (trustScore > 70) return 0.85;  // Trusted user
    if (trustScore > 30) return 0.70;  // Normal user
    return 0.50;                        // Low trust
}
