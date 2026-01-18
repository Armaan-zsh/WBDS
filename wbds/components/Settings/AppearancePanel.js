'use client';

import { useEffect, useState } from 'react';
import { setAudioProfile, playTypeSound, toggleAmbience, setAmbienceProfile } from '../../utils/audioEngine';

export default function AppearancePanel({ onClose }) {
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

    useEffect(() => {
        // Load preference
        const savedTheme = localStorage.getItem('wbds_theme') || 'paper';
        const savedFont = localStorage.getItem('wbds_font') || 'serif';
        const savedAudio = localStorage.getItem('wbds_audio_profile') || 'mechanical';
        const savedAmbience = localStorage.getItem('wbds_ambience') === 'true';
        const savedAmbienceProfile = localStorage.getItem('wbds_ambience_profile') || 'space';

        applyTheme(savedTheme);
        applyFont(savedFont);

        // Init Audio State
        setLocalAudioProfile(savedAudio);
        setAudioProfile(savedAudio);

        // Init Ambience
        setCurrentAmbience(savedAmbienceProfile);
        setAmbienceProfile(savedAmbienceProfile);
        setIsAmbienceOn(savedAmbience);

        if (savedAmbience) {
            setTimeout(() => toggleAmbience(true), 1000);
        }
    }, []);

    const applyTheme = (t) => {
        setTheme(t);
        document.documentElement.setAttribute('data-theme', t);
        localStorage.setItem('wbds_theme', t);
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
            playTypeSound(); // Preview sound!
        }
    };

    const handleAmbienceSelect = (profile) => {
        // If clicking the active profile, toggle off
        if (isAmbienceOn && currentAmbience === profile) {
            setIsAmbienceOn(false);
            localStorage.setItem('wbds_ambience', 'false');
            toggleAmbience(false);
            return;
        }

        // Otherwise switch to it and turn on
        setCurrentAmbience(profile);
        setIsAmbienceOn(true);
        localStorage.setItem('wbds_ambience', 'true');
        localStorage.setItem('wbds_ambience_profile', profile);

        setAmbienceProfile(profile);
        toggleAmbience(true);
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
        <>
            <div className="panel-container">


                <div>
                    <div>
                        <div style={{ paddingBottom: '20px', fontSize: '18px', fontWeight: 'bold', letterSpacing: '0px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            Settings
                            {/* Mobile Close Button */}
                            <button
                                className="mobile-close-btn"
                                onClick={onClose}
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                </div>

                {/* THEMES */}
                <div>
                    <div className="section-title">Atmosphere</div>
                    <div className="option-grid">
                        <button className={`option-btn ${theme === 'void' ? 'active' : ''}`} onClick={() => applyTheme('void')}>
                            <div className="preview-circle" style={{ background: '#000000', border: '1px solid #333' }}></div>
                            The Void
                        </button>
                        <button className={`option-btn ${theme === 'midnight' ? 'active' : ''}`} onClick={() => applyTheme('midnight')}>
                            <div className="preview-circle" style={{ background: '#020817' }}></div>
                            Midnight
                        </button>
                        <button className={`option-btn ${theme === 'paper' ? 'active' : ''}`} onClick={() => applyTheme('paper')}>
                            <div className="preview-circle" style={{ background: '#f2f0e9' }}></div>
                            Paper
                        </button>
                        <button className={`option-btn ${theme === 'coffee-paper' ? 'active' : ''}`} onClick={() => applyTheme('coffee-paper')}>
                            <div className="preview-circle" style={{ background: '#d9c2a3', border: '1px solid #8b5a2b' }}></div>
                            Coffee Paper
                        </button>
                        <button className={`option-btn ${theme === 'rose' ? 'active' : ''}`} onClick={() => applyTheme('rose')}>
                            <div className="preview-circle" style={{ background: '#261010' }}></div>
                            Rose
                        </button>
                        <button className={`option-btn ${theme === 'forest' ? 'active' : ''}`} onClick={() => applyTheme('forest')}>
                            <div className="preview-circle" style={{ background: '#1a2f23' }}></div>
                            Forest
                        </button>
                        <button className={`option-btn ${theme === 'coffee' ? 'active' : ''}`} onClick={() => applyTheme('coffee')}>
                            <div className="preview-circle" style={{ background: '#2b211e' }}></div>
                            Coffee
                        </button>
                        <button className={`option-btn ${theme === 'nord' ? 'active' : ''}`} onClick={() => applyTheme('nord')}>
                            <div className="preview-circle" style={{ background: '#2e3440' }}></div>
                            Nord
                        </button>
                        <button className={`option-btn ${theme === 'dracula' ? 'active' : ''}`} onClick={() => applyTheme('dracula')}>
                            <div className="preview-circle" style={{ background: '#282a36' }}></div>
                            Dracula
                        </button>
                        <button className={`option-btn ${theme === 'solarized' ? 'active' : ''}`} onClick={() => applyTheme('solarized')}>
                            <div className="preview-circle" style={{ background: '#002b36' }}></div>
                            Solarized
                        </button>
                        <button className={`option-btn ${theme === 'cyberpunk' ? 'active' : ''}`} onClick={() => applyTheme('cyberpunk')}>
                            <div className="preview-circle" style={{ background: '#111', border: '1px solid #fcee0c' }}></div>
                            Cyberpunk
                        </button>
                        <button className={`option-btn ${theme === 'synthwave' ? 'active' : ''}`} onClick={() => applyTheme('synthwave')}>
                            <div className="preview-circle" style={{ background: '#2b213a', border: '1px solid #ff71ce' }}></div>
                            Synthwave
                        </button>
                        <button className={`option-btn ${theme === 'serika' ? 'active' : ''}`} onClick={() => applyTheme('serika')}>
                            <div className="preview-circle" style={{ background: '#323437', border: '1px solid #e2b714' }}></div>
                            Serika
                        </button>
                        <button className={`option-btn ${theme === 'carbon' ? 'active' : ''}`} onClick={() => applyTheme('carbon')}>
                            <div className="preview-circle" style={{ background: '#313131', border: '1px solid #f66e0d' }}></div>
                            Carbon
                        </button>
                        <button className={`option-btn ${theme === '8008' ? 'active' : ''}`} onClick={() => applyTheme('8008')}>
                            <div className="preview-circle" style={{ background: '#333a45', border: '1px solid #f44c7f' }}></div>
                            8008
                        </button>
                        <button className={`option-btn ${theme === 'red-dragon' ? 'active' : ''}`} onClick={() => applyTheme('red-dragon')}>
                            <div className="preview-circle" style={{ background: '#1a0b0c', border: '1px solid #ff3a32' }}></div>
                            Red Dragon
                        </button>
                        <button className={`option-btn ${theme === 'terminal' ? 'active' : ''}`} onClick={() => { applyTheme('terminal'); applyFont('typewriter'); }}>
                            <div className="preview-circle" style={{ background: '#0a0a0a', border: '1px solid #30d158' }}></div>
                            Terminal
                        </button>
                        <button className={`option-btn ${theme === 'neovim' ? 'active' : ''}`} onClick={() => { applyTheme('neovim'); applyFont('fira'); applyAudio('mechanical'); }}>
                            <div className="preview-circle" style={{ background: '#282828', border: '1px solid #ebdbb2' }}></div>
                            Neovim
                        </button>
                        <button className={`option-btn ${theme === 'notepad' ? 'active' : ''}`} onClick={() => { applyTheme('notepad'); applyFont('sans'); applyAudio('typewriter'); }}>
                            <div className="preview-circle" style={{ background: '#c0c0c0', border: '1px solid #000' }}></div>
                            Notepad
                        </button>
                    </div>
                </div>

                {/* TYPOGRAPHY */}
                <div>
                    <div className="section-title">Typography</div>
                    <div className="option-grid">
                        <button className={`option-btn ${font === 'serif' ? 'active' : ''}`} onClick={() => applyFont('serif')}>
                            <span style={{ fontFamily: 'serif' }}>Aa</span> Serif
                        </button>
                        <button className={`option-btn ${font === 'sans' ? 'active' : ''}`} onClick={() => applyFont('sans')}>
                            <span style={{ fontFamily: 'sans-serif' }}>Aa</span> Sans
                        </button>
                        <button className={`option-btn ${font === 'mono' ? 'active' : ''}`} onClick={() => applyFont('mono')}>
                            <span style={{ fontFamily: 'monospace' }}>Aa</span> Mono
                        </button>
                        <button className={`option-btn ${font === 'inter' ? 'active' : ''}`} onClick={() => applyFont('inter')}>
                            <span style={{ fontFamily: 'sans-serif', fontWeight: 600 }}>Aa</span> Inter
                        </button>
                        <button className={`option-btn ${font === 'playfair' ? 'active' : ''}`} onClick={() => applyFont('playfair')}>
                            <span style={{ fontFamily: 'serif', fontStyle: 'italic' }}>Aa</span> Playfair
                        </button>
                        <button className={`option-btn ${font === 'merriweather' ? 'active' : ''}`} onClick={() => applyFont('merriweather')}>
                            <span style={{ fontFamily: 'serif' }}>Aa</span> Merriweather
                        </button>
                        <button className={`option-btn ${font === 'fira' ? 'active' : ''}`} onClick={() => applyFont('fira')}>
                            <span style={{ fontFamily: 'Fira Code' }}>Aa</span> Fira Code
                        </button>
                        <button className={`option-btn ${font === 'jetbrains' ? 'active' : ''}`} onClick={() => applyFont('jetbrains')}>
                            <span style={{ fontFamily: 'JetBrains Mono' }}>Aa</span> JetBrains
                        </button>
                        <button className={`option-btn ${font === 'ibm_plex' ? 'active' : ''}`} onClick={() => applyFont('ibm_plex')}>
                            <span style={{ fontFamily: 'IBM Plex Mono' }}>Aa</span> IBM Plex
                        </button>
                        <button className={`option-btn ${font === 'roboto_mono' ? 'active' : ''}`} onClick={() => applyFont('roboto_mono')}>
                            <span style={{ fontFamily: 'Roboto Mono' }}>Aa</span> Roboto Mono
                        </button>
                        <button className={`option-btn ${font === 'source_code' ? 'active' : ''}`} onClick={() => applyFont('source_code')}>
                            <span style={{ fontFamily: 'Source Code Pro' }}>Aa</span> Source Code
                        </button>
                        <button className={`option-btn ${font === 'lexend' ? 'active' : ''}`} onClick={() => applyFont('lexend')}>
                            <span style={{ fontFamily: 'Lexend Deca' }}>Aa</span> Lexend
                        </button>
                        <button className={`option-btn ${font === 'montserrat' ? 'active' : ''}`} onClick={() => applyFont('montserrat')}>
                            <span style={{ fontFamily: 'Montserrat' }}>Aa</span> Montserrat
                        </button>
                        <button className={`option-btn ${font === 'nunito' ? 'active' : ''}`} onClick={() => applyFont('nunito')}>
                            <span style={{ fontFamily: 'Nunito' }}>Aa</span> Nunito
                        </button>
                        <button className={`option-btn ${font === 'comfortaa' ? 'active' : ''}`} onClick={() => applyFont('comfortaa')}>
                            <span style={{ fontFamily: 'Comfortaa' }}>Aa</span> Comfortaa
                        </button>
                        <button className={`option-btn ${font === 'courier_prime' ? 'active' : ''}`} onClick={() => applyFont('courier_prime')}>
                            <span style={{ fontFamily: 'Courier Prime' }}>Aa</span> Courier Prime
                        </button>
                        <button className={`option-btn ${font === 'hand' ? 'active' : ''}`} onClick={() => applyFont('hand')}>
                            <span style={{ fontFamily: 'cursive' }}>Aa</span> Hand
                        </button>
                        <button className={`option-btn ${font === 'typewriter' ? 'active' : ''}`} onClick={() => applyFont('typewriter')}>
                            <span style={{ fontFamily: 'Courier New' }}>Aa</span> Typewriter
                        </button>
                        <button className={`option-btn ${font === 'dancing' ? 'active' : ''}`} onClick={() => applyFont('dancing')}>
                            <span style={{ fontFamily: 'Dancing Script', fontSize: '16px' }}>Aa</span> Dancing Script
                        </button>
                        <button className={`option-btn ${font === 'great_vibes' ? 'active' : ''}`} onClick={() => applyFont('great_vibes')}>
                            <span style={{ fontFamily: 'Great Vibes', fontSize: '18px' }}>Aa</span> Great Vibes
                        </button>
                        <button className={`option-btn ${font === 'alex_brush' ? 'active' : ''}`} onClick={() => applyFont('alex_brush')}>
                            <span style={{ fontFamily: 'Alex Brush', fontSize: '16px' }}>Aa</span> Alex Brush
                        </button>
                        <button className={`option-btn ${font === 'allura' ? 'active' : ''}`} onClick={() => applyFont('allura')}>
                            <span style={{ fontFamily: 'Allura', fontSize: '16px' }}>Aa</span> Allura
                        </button>
                        <button className={`option-btn ${font === 'parisienne' ? 'active' : ''}`} onClick={() => applyFont('parisienne')}>
                            <span style={{ fontFamily: 'Parisienne', fontSize: '16px' }}>Aa</span> Parisienne
                        </button>
                    </div>
                </div>

                {/* TACTILE AUDIO */}
                <div>
                    <div className="section-title">Tactile Sound</div>
                    <div className="option-grid">
                        <button className={`option-btn ${audioProfile === 'mechanical' ? 'active' : ''}`} onClick={() => applyAudio('mechanical')}>
                            Mechanical
                        </button>
                        <button className={`option-btn ${audioProfile === 'typewriter' ? 'active' : ''}`} onClick={() => applyAudio('typewriter')}>
                            Typewriter
                        </button>
                        <button className={`option-btn ${audioProfile === 'bubble' ? 'active' : ''}`} onClick={() => applyAudio('bubble')}>
                            Bubble
                        </button>
                        <button className={`option-btn ${audioProfile === 'silent' ? 'active' : ''}`} onClick={() => applyAudio('silent')}>
                            Silent
                        </button>
                    </div>

                    <div className="section-title" style={{ marginTop: '20px' }}>Atmosphere</div>
                    <div className="option-grid">
                        <button
                            className={`option-btn ${isAmbienceOn && currentAmbience === 'deep_space' ? 'active' : ''}`}
                            onClick={() => handleAmbienceSelect('deep_space')}
                        >
                            Deep Space
                        </button>
                        <button
                            className={`option-btn ${isAmbienceOn && currentAmbience === 'interstellar' ? 'active' : ''}`}
                            onClick={() => handleAmbienceSelect('interstellar')}
                        >
                            Interstellar
                        </button>
                        <button
                            className={`option-btn ${isAmbienceOn && currentAmbience === 'cosmic_ocean' ? 'active' : ''}`}
                            onClick={() => handleAmbienceSelect('cosmic_ocean')}
                        >
                            Cosmic Ocean
                        </button>
                    </div>
                </div>

                {/* DATA & PRIVACY */}
                <div>
                    <div className="section-title" style={{ marginTop: '20px' }}>Data & Privacy</div>
                    <div className="option-grid">
                        <button className="option-btn" onClick={() => {
                            const owned = localStorage.getItem('wbds_owned') || '[]';
                            setCopyInput(owned);
                            setShowCopyModal(true);
                        }}>
                            View & Copy Key
                        </button>

                        <button className="option-btn" onClick={() => setShowRestoreModal(true)}>
                            Restore Backup
                        </button>

                        <button className="option-btn" style={{ color: '#ff453a', borderColor: 'rgba(255, 69, 58, 0.3)' }} onClick={() => {
                            if (confirm('This will wipe your local history (owned letters). Continue?')) {
                                localStorage.removeItem('wbds_owned');
                                window.location.reload();
                            }
                        }}>
                            Clear History
                        </button>
                    </div>
                </div>
            </div> {/* Closes the panel-container div */}

            {/* CUSTOM COPY MODAL */}
            {showCopyModal && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <h3>Your Encrypted Key</h3>
                        <p>Copy this code to save your history.</p>
                        <textarea
                            className="restore-input"
                            value={copyInput}
                            readOnly
                            onClick={(e) => e.target.select()}
                        />
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setShowCopyModal(false)}>Close</button>
                            <button className="btn-confirm" onClick={() => {
                                navigator.clipboard.writeText(copyInput);
                                setCopyButtonLabel('Copied!');
                                setTimeout(() => setCopyButtonLabel('Copy'), 2000);
                            }}>{copyButtonLabel}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* CUSTOM RESTORE MODAL - Moved outside to ignore parent transform */}
            {showRestoreModal && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <h3>Restore Backup</h3>
                        <p>Paste your Backup Key below to restore your history.</p>
                        <textarea
                            className="restore-input"
                            value={restoreInput}
                            onChange={(e) => setRestoreInput(e.target.value)}
                            placeholder='["123", "456", "789"]...'
                        />
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setShowRestoreModal(false)}>Cancel</button>
                            <button className="btn-confirm" onClick={handleRestore}>Restore</button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
        .panel-container {
            width: 280px;
            padding: 32px 24px;
            background: var(--bg-surface);
            border: 1px solid var(--glass-border);
            height: auto;
            max-height: 75vh; 
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 32px;
            position: fixed;
            left: 40px; 
            top: 50%;
            transform: translateY(-50%);
            border-radius: 24px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.3);
            backdrop-filter: blur(20px);
            z-index: 2010;
            scrollbar-width: none;
        }
        
        .panel-container::-webkit-scrollbar {
            display: none;
        }

        @media (max-width: 768px) {
          .panel-container {
            width: 280px; /* Keep it compact */
            height: auto;
            max-height: 60vh; /* Don't cover entire screen */
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%); /* Centered floating card */
            border-radius: 20px; /* Rounded corners back */
            padding: 24px 20px;
            gap: 20px;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            box-shadow: 0 10px 40px rgba(0,0,0,0.6); /* increased shadow */
            border: 1px solid var(--glass-border);
          }
        }

        .section-title {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: var(--text-secondary);
            margin-bottom: 12px;
            opacity: 0.7;
            position: sticky;
            top: 0;
            background: var(--bg-surface);
            padding-bottom: 10px;
            z-index: 10;
        }

        .option-grid {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .option-btn {
            background: transparent;
            border: 1px solid transparent;
            color: var(--text-secondary);
            padding: 12px 16px;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 14px;
            text-align: left;
        }

        .option-btn:hover {
            background: rgba(255,255,255,0.03);
            color: var(--text-primary);
        }

        .option-btn.active {
            background: rgba(255,255,255,0.05);
            border-color: var(--glass-border);
            color: var(--text-primary);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .preview-circle {
            width: 12px;
            height: 12px;
            border-radius: 50%;
        }

            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(8px);
                z-index: 9999; /* Max z-index */
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .modal-card {
                background: var(--bg-surface);
                border: 1px solid var(--glass-border);
                padding: 24px;
                border-radius: 20px;
                width: 320px;
                text-align: center;
                box-shadow: 0 20px 50px rgba(0,0,0,0.5);
            }
            h3 {
                margin: 0 0 10px 0;
                color: var(--text-primary);
                font-size: 18px;
            }
            p {
                color: var(--text-secondary);
                font-size: 12px;
                margin-bottom: 16px;
            }
            .restore-input {
                width: 100%;
                height: 100px;
                background: rgba(0,0,0,0.2);
                border: 1px solid var(--glass-border);
                border-radius: 12px;
                padding: 12px;
                color: var(--text-primary);
                font-family: monospace;
                font-size: 12px;
                margin-bottom: 20px;
                resize: none;
            }
            .restore-input:focus {
                outline: none;
                border-color: var(--text-secondary);
            }
            .modal-actions {
                display: flex;
                gap: 10px;
                justify-content: center;
            }
            .modal-actions button {
                padding: 10px 20px;
                border-radius: 50px;
                border: none;
                font-weight: 600;
                cursor: pointer;
            }
            .btn-cancel {
                background: transparent;
                border: 1px solid var(--glass-border) !important;
                color: var(--text-secondary);
            }
            .btn-confirm {
                background: var(--text-primary);
                color: #000000; /* Force black text for maximum contrast on white button */
                font-weight: 800; /* Extra bold for readability */
            }

            .mobile-close-btn {
                display: none;
                background: transparent;
                border: 1px solid var(--glass-border);
                color: var(--text-primary);
                width: 32px;
                height: 32px;
                border-radius: 50%;
                cursor: pointer;
                align-items: center;
                justify-content: center;
                font-size: 16px;
            }

            @media (max-width: 768px) {
                .mobile-close-btn {
                    display: flex;
                }
            }
         `}</style>
        </>
    );
}
