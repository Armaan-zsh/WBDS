/**
 * test_defenses.js
 * A quick script to verify our shields hold up.
 */
import { containsLinkPattern, normalizeText } from './utils/contentFilters.js';
import { maskPrivateInfo, detectPotentialDox } from './utils/privacyShield.js';

const SPAM_SAMPLES = [
    "www.google.com",
    "w w w . g o o g l e . c o m", // The Squasher test
    "visit my site at google dot com",
    "buy crypto at btc-now",
    "hey check out http://badsite.com",
    "w_w_w_._t_e_s_t_._c_o_m"
];

const CLEAN_SAMPLES = [
    "I went to the park today.",
    "My cat is cute.",
    "Why did she leave me?",
    "I wrote a letter to you but I will never send it."
];

const DOX_SAMPLES = [
    "Call me at 555-123-4567 please",
    "My email is test@example.com",
    "My boss John works at Google and he is mean.",
    "She lives in Seattle on 4th street."
];

console.log("--- 🛡️ SPAM DEFENSE TEST ---");
SPAM_SAMPLES.forEach(sample => {
    const isCaught = containsLinkPattern(sample);
    console.log(`[${isCaught ? '✅ CAUGHT' : '❌ MISSED'}] "${sample}"`);
});

console.log("\n--- ✨ FALSE POSITIVE TEST ---");
CLEAN_SAMPLES.forEach(sample => {
    const isCaught = containsLinkPattern(sample);
    console.log(`[${!isCaught ? '✅ PASS' : '❌ FALSE POSITIVE'}] "${sample}"`);
});

console.log("\n--- 🎭 PRIVACY SHIELD TEST ---");
DOX_SAMPLES.forEach(sample => {
    const masked = maskPrivateInfo(sample);
    const doxCheck = detectPotentialDox(sample);

    console.log(`Original: "${sample}"`);
    console.log(`Masked:   "${masked}"`);
    if (doxCheck.isRisky) {
        console.log(`Risk:     ⚠️ POSSIBLY DOXXING (${doxCheck.warnings.join(', ')})`);
    }
    console.log('---');
});
