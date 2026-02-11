/**
 * lib/edge-crypto.js
 * Edge-compatible crypto utilities using Web Crypto API.
 * This replaces the Node.js 'crypto' module which is unavailable on Edge.
 */

export async function hashIp(ip, salt) {
    const msgUint8 = new TextEncoder().encode(ip);
    const keyUint8 = new TextEncoder().encode(salt);

    // Import the salt as an HMAC key
    const key = await crypto.subtle.importKey(
        'raw',
        keyUint8,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    // Sign the IP address
    const sig = await crypto.subtle.sign('HMAC', key, msgUint8);

    // Convert ArrayBuffer to Hex String
    const hashArray = Array.from(new Uint8Array(sig));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
