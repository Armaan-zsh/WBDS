// Simple synth for mechanical keyboard sounds
// Uses Web Audio API to avoid external assets

let audioCtx = null;

const initAudio = () => {
    if (!audioCtx && typeof window !== 'undefined') {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
};

export const playTypeSound = () => {
    initAudio();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const t = audioCtx.currentTime;

    // Config for a "Thocky" switch sound
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    // Noise buffer for the "click" texture
    const bufferSize = audioCtx.sampleRate * 0.01; // 10ms click
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;

    // Filter the noise
    const noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 1000;

    noise.connect(noiseFilter);
    noiseFilter.connect(gain);

    // Oscillator for the "body" of the keypress
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150 + (Math.random() * 50), t); // Random pitch
    osc.connect(gain);

    // Envelope
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.3, t + 0.005); // Attack
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1); // Decay

    osc.start(t);
    osc.stop(t + 0.1);

    noise.start(t);
    noise.stop(t + 0.02);

    gain.connect(audioCtx.destination);
};

export const playSendSound = () => {
    initAudio();
    if (!audioCtx) return;

    // Swoosh sound
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.5); // Pitch up

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.1);
    gain.gain.linearRampToValueAtTime(0, t + 1.5);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(t);
    osc.stop(t + 1.5);
};
