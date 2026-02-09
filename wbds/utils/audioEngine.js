// Advanced Synth Engine for Tactile Audio
// Features: Physical Modeling for switches, diverse profiles, and dynamic modulation.

let audioCtx = null;
let currentProfile = 'mechanical';
let volume = 0.5;

const initAudio = () => {
    if (!audioCtx && typeof window !== 'undefined') {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Load saved settings
    if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem('wbds_audio_profile');
        if (saved) currentProfile = saved;
    }
};

export const setAudioProfile = (profile) => {
    currentProfile = profile;
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('wbds_audio_profile', profile);
    }
};

export const getAudioProfile = () => currentProfile;

const createNoiseBuffer = () => {
    if (!audioCtx) return null;
    const bufferSize = audioCtx.sampleRate * 0.1; // 100ms
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    return buffer;
};

export const playTypeSound = () => {
    initAudio();
    if (!audioCtx || audioCtx.state === 'suspended') {
        audioCtx?.resume();
    }
    if (!audioCtx || currentProfile === 'silent') return;

    const t = audioCtx.currentTime;
    const gain = audioCtx.createGain();
    gain.connect(audioCtx.destination);

    if (currentProfile === 'mechanical') {
        // THOCKY SWITCH (Cherry MX Brown-ish)
        // Body: Triangle Wave
        const osc = audioCtx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120 + (Math.random() * 20), t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.05);
        osc.connect(gain);

        // Click: Low-passed Noise
        const noise = audioCtx.createBufferSource();
        noise.buffer = createNoiseBuffer();
        const noiseFilter = audioCtx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.value = 1500;
        noise.connect(noiseFilter);
        noiseFilter.connect(gain);

        // Envelope
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.4, t + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

        osc.start(t);
        osc.stop(t + 0.1);
        noise.start(t);
        noise.stop(t + 0.05);

    } else if (currentProfile === 'typewriter') {
        // SHARP CLACK (Old Typewriter / MX Blue)
        // High pitch metallic ping
        const osc = audioCtx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(2200, t);
        osc.frequency.exponentialRampToValueAtTime(800, t + 0.02);
        osc.connect(gain);

        // Heavy mechanics noise
        const noise = audioCtx.createBufferSource();
        noise.buffer = createNoiseBuffer();
        const noiseFilter = audioCtx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.value = 800;
        noise.connect(noiseFilter);
        noiseFilter.connect(gain);

        // Envelope: Instant attack, fast decay
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.002);
        gain.gain.linearRampToValueAtTime(0, t + 0.06);

        osc.start(t);
        osc.stop(t + 0.06);
        noise.start(t);
        noise.stop(t + 0.04);

    } else if (currentProfile === 'bubble') {
        // POP SOUND (Cute)
        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400 + Math.random() * 100, t);
        osc.frequency.exponentialRampToValueAtTime(800, t + 0.05); // Pitch Up Pop
        osc.connect(gain);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.01);
        gain.gain.linearRampToValueAtTime(0, t + 0.1);

        osc.start(t);
        osc.stop(t + 0.1);
    }
};

export const playSendSound = () => {
    initAudio();
    if (!audioCtx || audioCtx.state === 'suspended') {
        audioCtx?.resume();
    }
    if (!audioCtx || currentProfile === 'silent') return;

    const t = audioCtx.currentTime;
    const gain = audioCtx.createGain();
    gain.connect(audioCtx.destination);

    // MASTER SEND SOUND (Satisfying Whoosh + Ding)

    // 1. The Whoosh (Wind-up)
    const osc1 = audioCtx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(200, t);
    osc1.frequency.exponentialRampToValueAtTime(800, t + 0.6);

    const gain1 = audioCtx.createGain();
    gain1.gain.setValueAtTime(0, t);
    gain1.gain.linearRampToValueAtTime(0.2, t + 0.1);
    gain1.gain.linearRampToValueAtTime(0, t + 0.6);

    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);

    // 2. The Ding (Arrival)
    const osc2 = audioCtx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, t + 0.6); // A5
    osc2.frequency.exponentialRampToValueAtTime(880, t + 2.0); // Sustain pitch

    const gain2 = audioCtx.createGain();
    gain2.gain.setValueAtTime(0, t + 0.6);
    gain2.gain.linearRampToValueAtTime(0.3, t + 0.61);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 2.5); // Long Decay

    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);

    osc1.start(t);
    osc1.stop(t + 0.7);

    osc2.start(t + 0.6);
    osc2.stop(t + 2.5);
};

// --- FM SYNTHESIS & FX ---

const createDelay = (ctx) => {
    const delay = ctx.createDelay();
    delay.delayTime.value = 0.3; // 300ms
    const feedback = ctx.createGain();
    feedback.gain.value = 0.4;
    const filter = ctx.createBiquadFilter();
    filter.frequency.value = 2000;

    delay.connect(feedback);
    feedback.connect(filter);
    filter.connect(delay);

    return { input: delay, output: delay };
};

const playFMBell = (ctx, dest, freq) => {
    const t = ctx.currentTime;

    // Carrier
    const carrier = ctx.createOscillator();
    carrier.frequency.value = freq;

    // Modulator
    const modulator = ctx.createOscillator();
    modulator.frequency.value = freq * 2.0; // Harmonic ratio
    const modGain = ctx.createGain();
    modGain.gain.value = 1000; // FM Index (Brightness)

    // Envelope
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 2.0);

    // Connections
    modulator.connect(modGain);
    modGain.connect(carrier.frequency);
    carrier.connect(gain);
    gain.connect(dest);

    modulator.start(t);
    carrier.start(t);
    modulator.stop(t + 2);
    carrier.stop(t + 2);
};

const playGlitch = (ctx, dest) => {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.exponentialRampToValueAtTime(8000, t + 0.1);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(t);
    osc.stop(t + 0.1);
};

// --- REAL AMBIENT AUDIO PLAYER ---
// Uses HTML5 Audio to stream real ambient sound files from /public/audio/

let ambienceAudio = null;
let currentAmbienceProfile = 'deep_space';

// Available ambient tracks (place MP3 files in /public/audio/)
const AMBIENT_TRACKS = {
    deep_space: '/audio/deep_space.mp3',
    interstellar: '/audio/interstellar.mp3',
    cosmic_ocean: '/audio/cosmic_ocean.mp3',
};

export const setAmbienceProfile = (profile) => {
    const wasPlaying = ambienceAudio && !ambienceAudio.paused;
    currentAmbienceProfile = profile;

    // If was playing, switch to new track
    if (wasPlaying) {
        toggleAmbience(false);
        setTimeout(() => toggleAmbience(true), 100);
    }
};

export const toggleAmbience = (shouldPlay) => {
    if (shouldPlay) {
        // Create new audio element if needed
        if (!ambienceAudio) {
            ambienceAudio = new Audio();
            ambienceAudio.loop = true;
            ambienceAudio.volume = 0.5;
        }

        // Set track source
        const trackUrl = AMBIENT_TRACKS[currentAmbienceProfile] || AMBIENT_TRACKS.deep_space;

        // Only change src if different
        if (!ambienceAudio.src.endsWith(trackUrl)) {
            ambienceAudio.src = trackUrl;
        }

        // Play with fade in
        ambienceAudio.volume = 0;
        ambienceAudio.play().catch(e => console.log('Ambient audio blocked:', e));

        // Fade in
        let vol = 0;
        const fadeIn = setInterval(() => {
            vol += 0.05;
            if (vol >= 0.5) {
                ambienceAudio.volume = 0.5;
                clearInterval(fadeIn);
            } else {
                ambienceAudio.volume = vol;
            }
        }, 50);

    } else {
        // Stop with fade out
        if (ambienceAudio && !ambienceAudio.paused) {
            let vol = ambienceAudio.volume;
            const fadeOut = setInterval(() => {
                vol -= 0.05;
                if (vol <= 0) {
                    ambienceAudio.pause();
                    ambienceAudio.currentTime = 0;
                    clearInterval(fadeOut);
                } else {
                    ambienceAudio.volume = vol;
                }
            }, 50);
        }
    }
};

// --- RADIO CONTROL BUS (Remote Control for SynthwaveRadio) ---
export const radioEvents = typeof window !== 'undefined' ? new EventTarget() : null;

export const radioControl = {
    // Radio Control Methods
    play: () => radioEvents?.dispatchEvent(new Event('RADIO_PLAY')),
    pause: () => radioEvents?.dispatchEvent(new Event('RADIO_PAUSE')),
    toggle: () => radioEvents?.dispatchEvent(new Event('RADIO_TOGGLE')),
    next: () => radioEvents?.dispatchEvent(new Event('RADIO_NEXT')),
    prev: () => radioEvents?.dispatchEvent(new Event('RADIO_PREV')),
    setVolume: (vol) => {
        if (!radioEvents) return;
        const e = new CustomEvent('RADIO_SET_VOLUME', { detail: vol });
        radioEvents.dispatchEvent(e);
    },
    setMuted: (mute) => {
        if (!radioEvents) return;
        const e = new CustomEvent('RADIO_SET_MUTED', { detail: mute });
        radioEvents.dispatchEvent(e);
    },

    // Sync Mechanism: Components ask for state, Radio answers
    requestState: () => radioEvents?.dispatchEvent(new Event('RADIO_REQUEST_STATE')),

    // Radio sends this when state changes
    emitState: (state) => {
        if (!radioEvents) return;
        const e = new CustomEvent('RADIO_STATE_UPDATE', { detail: state });
        radioEvents.dispatchEvent(e);
    }
};

