import { maskPrivateInfo, detectPotentialDox } from './utils/privacyShield.js';

const FAILED_CASE = "Call +91 98765 43210 please";
const ADDRESS_CASE = "I live at Flat No 302, Green View Apartments";

console.log("--- 🕵️ PRIVACY REGEX AUDIT ---");

const redactedPhone = maskPrivateInfo(FAILED_CASE);
console.log(`Input: "${FAILED_CASE}"`);
console.log(`Output: "${redactedPhone}"`);

const redactedAddress = maskPrivateInfo(ADDRESS_CASE);
console.log(`Input: "${ADDRESS_CASE}"`);
console.log(`Output: "${redactedAddress}"`);

if (redactedPhone.includes("98765")) {
    console.error("❌ FAILURE: Phone number still visible.");
    process.exit(1);
} else {
    console.log("✅ SUCCESS: Phone number redacted.");
}

if (redactedAddress.includes("Flat No 302")) {
    console.error("❌ FAILURE: Address still visible.");
} else {
    console.log("✅ SUCCESS: Address redacted.");
}
