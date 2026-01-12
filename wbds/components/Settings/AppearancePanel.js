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
            width: 260px;
            padding: 32px 24px;
            background: var(--bg-surface);
            border: 1px solid var(--glass-border);
            /* Centered Floating Card */
            height: auto;
            max-height: 80vh; 
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
        }

        .section-title {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: var(--text-secondary);
            margin-bottom: 12px;
            opacity: 0.7;
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
            padding: 10px 14px;
            text-align: left;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .option-btn:hover {
            background: rgba(255,255,255,0.03);
            color: var(--text-primary);
        }

        .option-btn.active {
            background: rgba(255,255,255,0.08);
            color: var(--text-primary);
            font-weight: 500;
        }

        /* Paper Theme Specific Override for Visibility */
        :global([data-theme='paper']) .option-btn:hover {
            background: rgba(0,0,0,0.03);
        }
        :global([data-theme='paper']) .option-btn.active {
            background: rgba(0,0,0,0.08);
        }

        .preview-circle {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            border: 1px solid rgba(255,255,255,0.1);
        }
      `}</style>

            <div>
                <div>
                    <div style={{ paddingBottom: '20px', fontSize: '18px', fontWeight: 'bold', letterSpacing: '0px' }}>
                        Settings
                    </div>
                </div>
            </div>

            {/* THEME SELECTOR */}
            <div>
                <div className="section-title">Atmosphere</div>
                <div className="option-grid">
                    <button className={`option-btn ${theme === 'void' ? 'active' : ''}`} onClick={() => applyTheme('void')}>
                        <div className="preview-circle" style={{ background: '#000' }}></div>
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
                </div>
            </div>

            {/* FONT SELECTOR */}
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
                </div>
            </div>

        </div>
    );
}
