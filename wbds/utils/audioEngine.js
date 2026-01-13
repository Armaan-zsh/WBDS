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

// --- MULTI-PROFILE ATMOSPHERE ENGINE ---

let ambienceInterval = null;
let currentAmbienceProfile = 'space';
let masterBus = null;
let activeNodes = []; // Track oscillators to stop them

const cleanupAmbience = () => {
    if (ambienceInterval) clearTimeout(ambienceInterval);
    ambienceInterval = null;

    activeNodes.forEach(node => {
        try { node.stop(); } catch (e) { }
        try { node.disconnect(); } catch (e) { }
    });
    activeNodes = [];

    if (masterBus) {
        const bus = masterBus;
        // Fade out
        try {
            bus.gain.cancelScheduledValues(audioCtx.currentTime);
            bus.gain.setTargetAtTime(0, audioCtx.currentTime, 0.5);
            setTimeout(() => { bus.disconnect(); }, 1000);
        } catch (e) { }
        masterBus = null;
    }
};

// 1. SPACE ENGINE (Aphex Style)
const runSpaceLoop = (ctx, dest) => {
    // FX Chain
    const delay = ctx.createDelay();
    delay.delayTime.value = 0.4;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.4;
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(dest);

    // Scale: A Minor Pentatonic
    const scale = [220, 261.63, 293.66, 329.63, 392.00, 440, 523.25];

    const tick = () => {
        const r = Math.random();
        const freq = scale[Math.floor(Math.random() * scale.length)];

        if (r > 0.5) playFMBell(ctx, delay, freq);
        else if (r > 0.2) playGlitch(ctx, dest);
        else playFMBell(ctx, delay, freq / 2); // Bass

        ambienceInterval = setTimeout(tick, 400 + Math.random() * 2000);
    };
    tick();
};

// 2. VIVALDI ENGINE (String Ensemble)
const playViolin = (ctx, dest, freq, duration) => {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;

    // Vibrato
    const vib = ctx.createOscillator();
    vib.frequency.value = 5; // 5Hz
    const vibGain = ctx.createGain();
    vibGain.gain.value = 3;
    vib.connect(vibGain);
    vibGain.connect(osc.frequency);

    // Filter (Bowing texture)
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2000;

    // Envelope
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.5); // Slow attack
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration); // Release

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start();
    vib.start();
    osc.stop(ctx.currentTime + duration);
    vib.stop(ctx.currentTime + duration);

    activeNodes.push(osc, vib);
};

const runVivaldiLoop = (ctx, dest) => {
    // Winter (F Minor) Arpeggios
    const chord = [349.23, 415.30, 523.25, 698.46]; // F4, Ab4, C5, F5
    let index = 0;

    const tick = () => {
        // Rapid bowing
        playViolin(ctx, dest, chord[index % chord.length], 0.3);
        index++;

        // Occasional long note
        if (Math.random() > 0.8) {
            playViolin(ctx, dest, chord[0] / 2, 2.0); // Cello bass
        }

        ambienceInterval = setTimeout(tick, 200); // 16th notes
    };
    tick();
};

// 3. BACH ENGINE (Piano/Harpsichord)
const playPiano = (ctx, dest, freq) => {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'triangle'; // Mellower than saw
    osc.frequency.value = freq;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.4, t + 0.01); // Hammer strike
    gain.gain.exponentialRampToValueAtTime(0.01, t + 1.0); // Decay

    osc.connect(gain);
    gain.connect(dest);

    osc.start(t);
    osc.stop(t + 1.0);
    activeNodes.push(osc);
};

const runBachLoop = (ctx, dest) => {
    // C Major Prelude Logic
    // C E G C E G C E
    const pattern = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
    let note = 0;

    const tick = () => {
        // Pseudo-random counterpoint
        const pitch = pattern[Math.floor(Math.random() * pattern.length)];
        playPiano(ctx, dest, pitch);

        // Walking Bass
        if (note % 4 === 0) {
            playPiano(ctx, dest, pattern[0] / 2);
        }
        note++;

        const timing = 250; // Andante
        ambienceInterval = setTimeout(tick, timing);
    };
    tick();
};

export const setAmbienceProfile = (profile) => {
    currentAmbienceProfile = profile;
    // If playing, restart with new profile
    if (ambienceInterval) {
        toggleAmbience(false);
        setTimeout(() => toggleAmbience(true), 100);
    }
};

export const toggleAmbience = (shouldPlay) => {
    initAudio();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    if (shouldPlay) {
        if (ambienceInterval) return; // Already playing

        activeNodes = []; // Reset tracker
        masterBus = audioCtx.createGain();
        masterBus.gain.value = 0.4;
        masterBus.connect(audioCtx.destination);

        if (currentAmbienceProfile === 'vivaldi') {
            runVivaldiLoop(audioCtx, masterBus);
        } else if (currentAmbienceProfile === 'bach') {
            runBachLoop(audioCtx, masterBus);
        } else {
            runSpaceLoop(audioCtx, masterBus); // Default
        }

    } else {
        cleanupAmbience();
    }
};
