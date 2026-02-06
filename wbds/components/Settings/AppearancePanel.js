'use client';

import { useState, useEffect } from 'react';
import { setAudioProfile, playTypeSound, toggleAmbience, setAmbienceProfile, radioControl, radioEvents } from '../../utils/audioEngine';
import { saveImage, getImage } from '../../utils/db';

export default function AppearancePanel({ onClose, isOpen, onToggle, letters = [], onOpenLetter }) {
    const [theme, setTheme] = useState('void');
    const [font, setFont] = useState('serif');
    const [audioProfile, setLocalAudioProfile] = useState('mechanical');
    const [isAmbienceOn, setIsAmbienceOn] = useState(false);
    const [currentAmbience, setCurrentAmbience] = useState('space');
    const [showRestoreModal, setShowRestoreModal] = useState(false);
    const [showCopyModal, setShowCopyModal] = useState(false);
    const [restoreInput, setRestoreInput] = useState('');
    const [copyInput, setCopyInput] = useState('');
    const [copyButtonLabel, setCopyButtonLabel] = useState('Copy');
    const [fontSize, setFontSize] = useState('medium');
    const [customBgDesktop, setCustomBgDesktop] = useState(null);
    const [customBgMobile, setCustomBgMobile] = useState(null);
    const [pinnedLetters, setPinnedLetters] = useState(new Set());

    // Radio State for Mobile
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTrack, setCurrentTrack] = useState(null);

    // Load pinned letters from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('wbds_pinned_letters');
            if (saved) {
                try {
                    setPinnedLetters(new Set(JSON.parse(saved)));
                } catch (e) {
                    console.error('Failed to load pinned letters');
                }
            }
        }
    }, []);

    // Get saved letters from props
    const savedLetters = letters.filter(l => pinnedLetters.has(l.id));

    // Sync Settings & Audio
    useEffect(() => {
        const loadInitial = async () => {
            if (typeof window !== 'undefined') {
                const savedTheme = localStorage.getItem('wbds_theme') || 'void';
                const savedFont = localStorage.getItem('wbds_font') || 'serif';
                const savedAudio = localStorage.getItem('wbds_audio_profile') || 'mechanical';
                const savedAmbience = localStorage.getItem('wbds_ambience') === 'true';
                const savedAmbienceProfile = localStorage.getItem('wbds_ambience_profile') || 'space';
                const savedFontSize = localStorage.getItem('wbds_font_size') || 'medium';

                setTheme(savedTheme);
                setFont(savedFont);
                setFontSize(savedFontSize);
                setLocalAudioProfile(savedAudio);
                setAudioProfile(savedAudio);
                setCurrentAmbience(savedAmbienceProfile);
                setAmbienceProfile(savedAmbienceProfile);
                setIsAmbienceOn(savedAmbience);

                // Apply font size CSS variable
                const fontSizeMap = { small: '14px', medium: '16px', large: '18px', xl: '20px' };
                document.documentElement.style.setProperty('--letter-font-size', fontSizeMap[savedFontSize] || '16px');

                // Load from IndexedDB (supporting 10MB images)
                const savedCustomDesktop = await getImage('wbds_custom_bg_desktop');
                const savedCustomMobile = await getImage('wbds_custom_bg_mobile');

                if (savedCustomDesktop) {
                    setCustomBgDesktop(savedCustomDesktop);
                }
                if (savedCustomMobile) {
                    setCustomBgMobile(savedCustomMobile);
                }

                document.documentElement.setAttribute('data-theme', savedTheme);
                document.documentElement.setAttribute('data-font', savedFont);

                if (savedAmbience) {
                    setTimeout(() => toggleAmbience(true), 1000);
                }

                radioControl.requestState();
            }
        };

        loadInitial();

        const onRadioUpdate = (e) => {
            const state = e.detail;
            setIsPlaying(state.isPlaying);
            setCurrentTrack(state.station ? { title: state.station.name } : null);
        };

        if (radioEvents) {
            radioEvents.addEventListener('RADIO_STATE_UPDATE', onRadioUpdate);
        }

        return () => {
            if (radioEvents) {
                radioEvents.removeEventListener('RADIO_STATE_UPDATE', onRadioUpdate);
            }
        };
    }, []);

    const applyTheme = async (t) => {
        setTheme(t);
        document.documentElement.setAttribute('data-theme', t);
        localStorage.setItem('wbds_theme', t);

        if (t === 'custom') {
            window.dispatchEvent(new Event('custom-bg-update'));
        }
        window.dispatchEvent(new Event('storage'));
    };

    const applyFont = (f) => {
        setFont(f);
        document.documentElement.setAttribute('data-font', f);
        localStorage.setItem('wbds_font', f);
    };

    const applyAudio = (profile) => {
        setLocalAudioProfile(profile);
        setAudioProfile(profile);
        if (profile !== 'silent') {
            playTypeSound();
        }
        localStorage.setItem('wbds_audio_profile', profile);
    };

    const handleAmbienceSelect = (profile) => {
        if (isAmbienceOn && currentAmbience === profile) {
            setIsAmbienceOn(false);
            localStorage.setItem('wbds_ambience', 'false');
            toggleAmbience(false);
            return;
        }

        setCurrentAmbience(profile);
        setIsAmbienceOn(true);
        localStorage.setItem('wbds_ambience', 'true');
        localStorage.setItem('wbds_ambience_profile', profile);
        setAmbienceProfile(profile);
        toggleAmbience(true);
    };

    const handleCustomBgUpload = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        // Increased to 10MB! Supported by IndexedDB without slowing down.
        if (file.size > 10 * 1024 * 1024) {
            alert("Image too large. Even for the void, 10MB is the limit for stability.");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result;
            if (type === 'desktop') {
                setCustomBgDesktop(base64);
                await saveImage('wbds_custom_bg_desktop', base64);
            } else {
                setCustomBgMobile(base64);
                await saveImage('wbds_custom_bg_mobile', base64);
            }
            // Trigger refresh in CustomWallpaper component
            window.dispatchEvent(new Event('custom-bg-update'));
        };
        reader.readAsDataURL(file);
    };

    const handleRestore = () => {
        if (!restoreInput) return;
        try {
            const parsed = JSON.parse(restoreInput);
            if (Array.isArray(parsed)) {
                localStorage.setItem('wbds_owned', JSON.stringify(parsed));
                window.location.reload();
            } else {
                alert('Invalid Key Format (Must be an array)');
            }
        } catch (e) {
            alert('Invalid Key Data');
        }
    };

    return (
        <div className={`panel-wrapper ${isOpen ? 'open' : ''}`}>
            <button
                className="sidebar-toggle"
                onClick={onToggle}
                aria-label="Toggle Settings"
            >
                {isOpen ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="13 17 18 12 13 7"></polyline>
                        <polyline points="6 17 11 12 6 7"></polyline>
                    </svg>
                ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="11 17 6 12 11 7"></polyline>
                        <polyline points="18 17 13 12 18 7"></polyline>
                    </svg>
                )}
            </button>

            <div className="panel-container">
                <div style={{ paddingBottom: '20px', fontSize: '18px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Settings
                    <button className="mobile-close-btn" onClick={onClose}>✕</button>
                </div>

                {/* THEMES */}
                <div className="setting-section">
                    <div className="section-title">Atmosphere</div>
                    <div className="option-grid">
                        {[
                            { id: 'void', label: 'The Void', color: '#000000' },
                            { id: 'midnight', label: 'Midnight', color: '#020817' },
                            { id: 'paper', label: 'Paper', color: '#f2f0e9' },
                            { id: 'coffee-paper', label: 'Coffee Paper', color: '#d9c2a3' },
                            { id: 'rose', label: 'Rose', color: '#261010' },
                            { id: 'forest', label: 'Forest', color: '#1a2f23' },
                            { id: 'coffee', label: 'Coffee', color: '#2b211e' },
                            { id: 'nord', label: 'Nord', color: '#2e3440' },
                            { id: 'dracula', label: 'Dracula', color: '#282a36' },
                            { id: 'solarized', label: 'Solarized', color: '#002b36' },
                            { id: 'cyberpunk', label: 'Cyberpunk', color: '#111', border: '#fcee0c' },
                            { id: 'synthwave', label: 'Synthwave', color: '#2b213a', border: '#ff71ce' },
                            { id: 'serika', label: 'Serika', color: '#323437', border: '#e2b714' },
                            { id: 'carbon', label: 'Carbon', color: '#313131', border: '#f66e0d' },
                            { id: '8008', label: '8008', color: '#333a45', border: '#f44c7f' },
                            { id: 'red-dragon', label: 'Red Dragon', color: '#1a0b0c', border: '#ff3a32' },
                            { id: 'terminal', label: 'Terminal', color: '#0a0a0a', border: '#30d158', action: () => applyFont('typewriter') },
                            { id: 'neovim', label: 'Neovim', color: '#282828', border: '#ebdbb2', action: () => { applyFont('fira'); applyAudio('mechanical'); } },
                            { id: 'notepad', label: 'Notepad', color: '#c0c0c0', border: '#000', action: () => { applyFont('sans'); applyAudio('typewriter'); } },
                            { id: 'custom', label: 'Custom', gradient: 'linear-gradient(45deg, #ff00ff, #00ffff)' }
                        ].map(t => (
                            <button
                                key={t.id}
                                className={`option-btn ${theme === t.id ? 'active' : ''}`}
                                onClick={() => { applyTheme(t.id); if (t.action) t.action(); }}
                            >
                                <div
                                    className="preview-circle"
                                    style={{
                                        background: t.gradient || t.color,
                                        border: t.border ? `1px solid ${t.border}` : (t.id === 'void' ? '1px solid #333' : 'none')
                                    }}
                                ></div>
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {theme === 'custom' && (
                        <div className="custom-upload-section">
                            <div className="upload-group">
                                <label>Desktop Image (1920x1080)</label>
                                <input type="file" accept="image/*" onChange={(e) => handleCustomBgUpload(e, 'desktop')} id="desktop-upload" hidden />
                                <button className="upload-btn" onClick={() => document.getElementById('desktop-upload').click()}>
                                    {customBgDesktop ? 'Change Desktop' : 'Upload Desktop'}
                                </button>
                            </div>
                            <div className="upload-group">
                                <label>Mobile Image (Portrait)</label>
                                <input type="file" accept="image/*" onChange={(e) => handleCustomBgUpload(e, 'mobile')} id="mobile-upload" hidden />
                                <button className="upload-btn" onClick={() => document.getElementById('mobile-upload').click()}>
                                    {customBgMobile ? 'Change Mobile' : 'Upload Mobile'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* TYPOGRAPHY */}
                <div className="setting-section">
                    <div className="section-title">Typography</div>
                    <div className="option-grid">
                        {[
                            { id: 'serif', label: 'Serif', font: 'serif' },
                            { id: 'sans', label: 'Sans', font: 'sans-serif' },
                            { id: 'mono', label: 'Mono', font: 'monospace' },
                            { id: 'inter', label: 'Inter', font: 'sans-serif', weight: 600 },
                            { id: 'playfair', label: 'Playfair', font: 'serif', italic: true },
                            { id: 'merriweather', label: 'Merriweather', font: 'serif' },
                            { id: 'fira', label: 'Fira Code', font: 'Fira Code' },
                            { id: 'jetbrains', label: 'JetBrains', font: 'JetBrains Mono' },
                            { id: 'ibm_plex', label: 'IBM Plex', font: 'IBM Plex Mono' },
                            { id: 'roboto_mono', label: 'Roboto Mono', font: 'Roboto Mono' },
                            { id: 'source_code', label: 'Source Code', font: 'Source Code Pro' },
                            { id: 'lexend', label: 'Lexend', font: 'Lexend Deca' },
                            { id: 'montserrat', label: 'Montserrat', font: 'Montserrat' },
                            { id: 'nunito', label: 'Nunito', font: 'Nunito' },
                            { id: 'comfortaa', label: 'Comfortaa', font: 'Comfortaa' },
                            { id: 'courier_prime', label: 'Courier Prime', font: 'Courier Prime' },
                            { id: 'hand', label: 'Hand', font: 'cursive' },
                            { id: 'typewriter', label: 'Typewriter', font: 'Courier New' },
                            { id: 'dancing', label: 'Dancing Script', font: 'Dancing Script', size: '16px' },
                            { id: 'great_vibes', label: 'Great Vibes', font: 'Great Vibes', size: '18px' },
                            { id: 'alex_brush', label: 'Alex Brush', font: 'Alex Brush', size: '16px' },
                            { id: 'allura', label: 'Allura', font: 'Allura', size: '16px' },
                            { id: 'parisienne', label: 'Parisienne', font: 'Parisienne', size: '16px' }
                        ].map(f => (
                            <button key={f.id} className={`option-btn ${font === f.id ? 'active' : ''}`} onClick={() => applyFont(f.id)}>
                                <span style={{ fontFamily: f.font, fontWeight: f.weight, fontStyle: f.italic ? 'italic' : 'normal', fontSize: f.size }}>Aa</span> {f.label}
                            </button>
                        ))}
                    </div>

                    {/* FONT SIZE */}
                    <div style={{ marginTop: 16 }}>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>Text Size</div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {[
                                { id: 'small', label: 'S', size: '14px' },
                                { id: 'medium', label: 'M', size: '16px' },
                                { id: 'large', label: 'L', size: '18px' },
                                { id: 'xl', label: 'XL', size: '20px' }
                            ].map(s => (
                                <button
                                    key={s.id}
                                    className={`option-btn ${fontSize === s.id ? 'active' : ''}`}
                                    onClick={() => {
                                        setFontSize(s.id);
                                        document.documentElement.style.setProperty('--letter-font-size', s.size);
                                        localStorage.setItem('wbds_font_size', s.id);
                                    }}
                                    style={{ minWidth: 44, padding: '8px 12px' }}
                                >
                                    <span style={{ fontSize: s.size }}>{s.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* SAVED LETTERS */}
                <div className="setting-section">
                    <div className="section-title">Saved ({savedLetters.length})</div>
                    {savedLetters.length === 0 ? (
                        <div style={{
                            fontSize: 13,
                            color: 'var(--text-secondary)',
                            opacity: 0.5,
                            padding: '12px 0'
                        }}>
                            No saved letters yet. Click the bookmark icon on any letter to save it.
                        </div>
                    ) : (
                        <div style={{
                            maxHeight: 300,
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8
                        }}>
                            {savedLetters.map(letter => (
                                <button
                                    key={letter.id}
                                    className="option-btn"
                                    onClick={() => {
                                        if (onOpenLetter) onOpenLetter(letter);
                                    }}
                                    style={{
                                        textAlign: 'left',
                                        display: 'block',
                                        width: '100%',
                                        padding: '12px',
                                        borderColor: '#d4af37',
                                    }}
                                >
                                    <div style={{
                                        fontSize: 13,
                                        lineHeight: 1.4,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        color: 'var(--text-primary)',
                                    }}>
                                        {letter.content.substring(0, 100)}{letter.content.length > 100 ? '...' : ''}
                                    </div>
                                    <div style={{
                                        fontSize: 11,
                                        color: 'var(--text-secondary)',
                                        marginTop: 6,
                                        opacity: 0.6
                                    }}>
                                        {letter.tags?.join(' ') || 'No tags'}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* TACTILE AUDIO */}
                <div className="setting-section">
                    <div className="section-title">Tactile Sound</div>
                    <div className="option-grid">
                        <button className={`option-btn ${audioProfile === 'mechanical' ? 'active' : ''}`} onClick={() => applyAudio('mechanical')}>Mechanical</button>
                        <button className={`option-btn ${audioProfile === 'typewriter' ? 'active' : ''}`} onClick={() => applyAudio('typewriter')}>Typewriter</button>
                        <button className={`option-btn ${audioProfile === 'bubble' ? 'active' : ''}`} onClick={() => applyAudio('bubble')}>Bubble</button>
                        <button className={`option-btn ${audioProfile === 'silent' ? 'active' : ''}`} onClick={() => applyAudio('silent')}>Silent</button>
                    </div>

                    <div className="section-title" style={{ marginTop: '20px' }}>Atmosphere</div>
                    <div className="option-grid">
                        <button className={`option-btn ${isAmbienceOn && currentAmbience === 'deep_space' ? 'active' : ''}`} onClick={() => handleAmbienceSelect('deep_space')}>Deep Space</button>
                        <button className={`option-btn ${isAmbienceOn && currentAmbience === 'interstellar' ? 'active' : ''}`} onClick={() => handleAmbienceSelect('interstellar')}>Interstellar</button>
                        <button className={`option-btn ${isAmbienceOn && currentAmbience === 'cosmic_ocean' ? 'active' : ''}`} onClick={() => handleAmbienceSelect('cosmic_ocean')}>Cosmic Ocean</button>
                    </div>
                </div>

                {/* DATA & PRIVACY */}
                <div className="setting-section">
                    <div className="section-title">Data & Privacy</div>
                    <div className="option-grid">
                        <button className="option-btn" onClick={() => { setCopyInput(localStorage.getItem('wbds_owned') || '[]'); setShowCopyModal(true); }}>View & Copy Key</button>
                        <button className="option-btn" onClick={() => setShowRestoreModal(true)}>Restore Backup</button>
                        <button className="option-btn" style={{ color: '#ff453a', borderColor: 'rgba(255, 69, 58, 0.3)' }} onClick={() => { if (confirm('Wipe history?')) { localStorage.removeItem('wbds_owned'); window.location.reload(); } }}>Clear History</button>
                    </div>
                </div>
            </div>

            {showCopyModal && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <h3>Your Encrypted Key</h3>
                        <p>Copy this code to save your history.</p>
                        <textarea className="restore-input" value={copyInput} readOnly onClick={(e) => e.target.select()} />
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setShowCopyModal(false)}>Close</button>
                            <button className="btn-confirm" onClick={() => { navigator.clipboard.writeText(copyInput); setCopyButtonLabel('Copied!'); setTimeout(() => setCopyButtonLabel('Copy'), 2000); }}>{copyButtonLabel}</button>
                        </div>
                    </div>
                </div>
            )}

            {showRestoreModal && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <h3>Restore Backup</h3>
                        <p>Paste your Backup Key below.</p>
                        <textarea className="restore-input" value={restoreInput} onChange={(e) => setRestoreInput(e.target.value)} placeholder='["123", "456"]...' />
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setShowRestoreModal(false)}>Cancel</button>
                            <button className="btn-confirm" onClick={handleRestore}>Restore</button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
        .panel-wrapper {
            position: fixed;
            left: 0;
            top: 0;
            height: 100vh;
            z-index: 5000;
            display: flex;
            align-items: center;
            pointer-events: none;
        }
        .panel-wrapper.open .panel-container { 
            transform: translateX(0); 
            opacity: 1;
            pointer-events: auto;
        }
        .panel-container {
            width: 280px;
            padding: 32px 24px;
            background: var(--bg-surface);
            border: 1px solid var(--glass-border);
            max-height: 85vh;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 32px;
            margin-left: 40px;
            border-radius: 24px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.3);
            backdrop-filter: blur(20px);
            scrollbar-width: none;
            transform: translateX(-400px);
            opacity: 0;
            transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.3s ease;
        }
        .sidebar-toggle {
            position: fixed;
            left: 10px;
            top: 50%;
            transform: translateY(-50%);
            background: transparent;
            border: none;
            color: #ff71ce;
            cursor: pointer;
            display: flex;
            transition: all 0.2s;
            pointer-events: auto;
            z-index: 5001;
        }
        .panel-wrapper.open .sidebar-toggle {
            left: 370px;
        }
        .sidebar-toggle:hover { color: #fff; transform: translateY(-50%) scale(1.1); }
        .section-title {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: var(--text-secondary);
            margin-bottom: 12px;
            opacity: 0.7;
        }
        .option-grid { display: flex; flex-direction: column; gap: 8px; }
        .option-btn {
            background: transparent;
            border: 1px solid transparent;
            color: var(--text-secondary);
            padding: 10px 16px;
            border-radius: 12px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 14px;
            transition: all 0.2s;
        }
        .option-btn:hover { color: var(--text-primary); background: rgba(255,255,255,0.03); }
        .option-btn.active { color: var(--text-primary); background: rgba(255,255,255,0.05); border-color: var(--glass-border); }
        .preview-circle { width: 12px; height: 12px; border-radius: 50%; }
        .custom-upload-section {
            margin-top: 16px;
            padding: 16px;
            background: rgba(255,255,255,0.02);
            border: 1px dashed var(--glass-border);
            border-radius: 16px;
            display: flex;
            flex-direction: column; gap: 16px;
        }
        .upload-group { display: flex; flex-direction: column; gap: 6px; }
        .upload-group label { font-size: 10px; color: var(--text-secondary); text-transform: uppercase; }
        .upload-btn {
            background: rgba(255,255,255,0.05);
            border: 1px solid var(--glass-border);
            color: var(--text-primary);
            padding: 8px;
            border-radius: 8px;
            font-size: 12px;
            cursor: pointer;
        }
        .modal-overlay {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);
            z-index: 9999; display: flex; align-items: center; justify-content: center;
        }
        .modal-card {
            background: var(--bg-surface); border: 1px solid var(--glass-border);
            padding: 24px; border-radius: 20px; width: 320px; text-align: center;
        }
        .restore-input {
            width: 100%; height: 80px; background: rgba(0,0,0,0.2);
            border: 1px solid var(--glass-border); border-radius: 12px;
            padding: 12px; color: var(--text-primary); font-family: monospace;
            margin-bottom: 20px; resize: none;
        }
        .modal-actions { display: flex; gap: 10px; justify-content: center; }
        .modal-actions button { padding: 8px 16px; border-radius: 20px; border: none; cursor: pointer; font-weight: 600; }
        .btn-confirm { background: var(--text-primary); color: #000; }
        .btn-cancel { background: transparent; border: 1px solid var(--glass-border) !important; color: var(--text-secondary); }
        .mobile-close-btn { display: none; }
        @media (max-width: 768px) {
            .mobile-close-btn { display: block; background: none; border: none; color: var(--text-primary); font-size: 20px; }
            .panel-wrapper { transform: none; width: 100%; display: ${isOpen ? 'flex' : 'none'}; justify-content: center; pointer-events: none; }
            .panel-container { position: relative; left: 0; width: 90%; pointer-events: auto; }
            .sidebar-toggle { display: none; }
        }
      `}</style>
        </div>
    );
}
