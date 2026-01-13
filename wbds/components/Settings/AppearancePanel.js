'use client';

import { useEffect, useState } from 'react';

export default function AppearancePanel() {
    const [theme, setTheme] = useState('void');
    const [font, setFont] = useState('serif');

    useEffect(() => {
        // Load preference
        const savedTheme = localStorage.getItem('wbds_theme') || 'void';
        const savedFont = localStorage.getItem('wbds_font') || 'serif';
        applyTheme(savedTheme);
        applyFont(savedFont);
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

    return (
        <div className="panel-container">
            <style jsx>{`
        .panel-container {
            width: 280px; /* Slight increase for scrollbar space */
            padding: 32px 24px;
            background: var(--bg-surface);
            border: 1px solid var(--glass-border);
            /* Centered Floating Card */
            height: auto;
            max-height: 75vh; 
            overflow-y: auto; /* Enable Scrolling */
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
            z-index: 50;
            
            /* Hide Scrollbar for clean UI */
            scrollbar-width: none;  /* Firefox */
        }
        
        .panel-container::-webkit-scrollbar {
            display: none; /* Chrome/Safari */
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
      `}</style>

            <div>
                <div>
                    <div style={{ paddingBottom: '20px', fontSize: '18px', fontWeight: 'bold', letterSpacing: '0px' }}>
                        Settings
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
                    <button className={`option-btn ${theme === 'terminal' ? 'active' : ''}`} onClick={() => { applyTheme('terminal'); applyFont('typewriter'); }}>
                        <div className="preview-circle" style={{ background: '#0a0a0a', border: '1px solid #30d158' }}></div>
                        Terminal
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
                        <span style={{ fontFamily: 'monospace' }}>Aa</span> Fira Code
                    </button>
                    <button className={`option-btn ${font === 'hand' ? 'active' : ''}`} onClick={() => applyFont('hand')}>
                        <span style={{ fontFamily: 'cursive' }}>Aa</span> Hand
                    </button>
                    <button className={`option-btn ${font === 'typewriter' ? 'active' : ''}`} onClick={() => applyFont('typewriter')}>
                        <span style={{ fontFamily: 'Courier New' }}>Aa</span> Type
                    </button>
                </div>
            </div>

        </div>
    );
}
