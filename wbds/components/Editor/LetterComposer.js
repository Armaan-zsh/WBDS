'use client';

import { useState, useRef, useEffect } from 'react';
import { containsLinkPattern, containsSocialSolicitation } from '../../utils/contentFilters';
import { maskPrivateInfo, detectPotentialDox } from '../../utils/privacyShield';

import { playTypeSound, playSendSound } from '../../utils/audioEngine';
import TurnstileWidget from '../Security/TurnstileWidget';

export default function LetterComposer({ onSend, onError, onFocusChange, replyTo }) {
    const [text, setText] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [errorShake, setErrorShake] = useState(false);
    const [status, setStatus] = useState('IDLE'); // IDLE, SENDING, BURNING
    const [unlockAt, setUnlockAt] = useState(null);
    const [isVerified, setIsVerified] = useState(false);

    // Vim State
    const [vimMode, setVimMode] = useState('INSERT'); // INSERT or NORMAL
    const [cmdBuffer, setCmdBuffer] = useState('');

    const textareaRef = useRef(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'; // Reset
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [text]);

    const handleSend = () => {
        if (!text.trim()) return;

        // 1. Check Links
        if (containsLinkPattern(text)) {
            triggerShake();
            if (onError) onError("No links. The void rejects them.");
            return;
        }

        // 2. Check Social Solicitation
        if (containsSocialSolicitation(text)) {
            triggerShake();
            if (onError) onError("No social handles or self-promo allowed.");
            return;
        }

        // 3. Check Doxxing Risk
        const doxRisk = detectPotentialDox(text);
        if (doxRisk.isRisky) {
            const confirm = window.confirm("Privacy Warning: You mentioned real names or locations. Are you sure this is anonymous?");
            if (!confirm) return;
        }

        const safeText = maskPrivateInfo(text);

        playSendSound(); // WHOOSH

        setStatus('SENDING');
        setTimeout(() => {
            onSend(safeText, unlockAt, replyTo?.id);
            setText('');
            setUnlockAt(null);
            setStatus('IDLE');
        }, 1500);
    };

    const handleBurn = () => {
        setStatus('BURNING');
        setTimeout(() => {
            setText('');
            setStatus('IDLE');
        }, 600);
    };

    const triggerShake = () => {
        setErrorShake(true);
        setTimeout(() => setErrorShake(false), 300);
    };

    const handleKeyDown = (e) => {
        playTypeSound(); // CLACK

        // CHECK VIM THEME
        const isVim = typeof document !== 'undefined' &&
            (document.documentElement.getAttribute('data-theme') === 'neovim' ||
                document.documentElement.getAttribute('data-theme') === 'terminal');

        if (isVim) {
            if (vimMode === 'INSERT') {
                if (e.key === 'Escape') {
                    setVimMode('NORMAL');
                    return;
                }
            } else {
                // NORMAL MODE
                e.preventDefault(); // Block typing

                if (e.key === 'i') {
                    setVimMode('INSERT');
                    setCmdBuffer('');
                    return;
                }

                // Command Buffer Logic
                if (e.key === ':' || cmdBuffer.startsWith(':')) {
                    if (e.key === 'Enter') {
                        // EXECUTE
                        if (cmdBuffer === ':w') handleSend();
                        if (cmdBuffer === ':q') handleBurn();
                        if (cmdBuffer === ':wq') { handleSend(); }
                        setCmdBuffer('');
                        setVimMode('NORMAL');
                    } else if (e.key === 'Backspace') {
                        setCmdBuffer(prev => prev.slice(0, -1));
                    } else if (e.key.length === 1) {
                        setCmdBuffer(prev => prev + e.key);
                    }
                    return;
                }
            }
        }

        // Standard Shortcuts (Ctrl+B/I)
        if ((!isVim || vimMode === 'INSERT') && (e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'i')) {
            e.preventDefault();
            const wrapper = e.key === 'b' ? '**' : '*';
            const start = textareaRef.current.selectionStart;
            const end = textareaRef.current.selectionEnd;
            if (start === end) return;
            const selected = text.substring(start, end);
            const newValue = text.substring(0, start) + wrapper + selected + wrapper + text.substring(end);
            setText(newValue);
            setTimeout(() => {
                textareaRef.current.setSelectionRange(start, end + (wrapper.length * 2));
            }, 0);
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text');
        const urlRegex = /(https?:\/\/[^\s]+)/g;

        if (containsLinkPattern(pastedData)) {
            const sanitized = pastedData.replace(urlRegex, '[LINK REMOVED]');
            const start = textareaRef.current.selectionStart;
            const end = textareaRef.current.selectionEnd;
            const newValue = text.substring(0, start) + sanitized + text.substring(end);
            setText(newValue);
            triggerShake();
            if (onError) onError("Links were stripped. The void is pure.");
        } else {
            const start = textareaRef.current.selectionStart;
            const end = textareaRef.current.selectionEnd;
            const newValue = text.substring(0, start) + pastedData + text.substring(end);
            setText(newValue);
        }
    };

    return (
        <div className={`composer-container ${isFocused ? 'focused' : ''} ${status === 'SENDING' ? 'sending' : ''}`}>
            <style jsx>{`
        @keyframes flyAway {
            0% { transform: scale(1) translateY(0) rotateX(0); opacity: 1; filter: blur(0); }
            20% { transform: scale(0.9) translateY(20px) rotateX(-10deg); opacity: 1; }
            40% { opacity: 0.8; }
            100% { transform: scale(0.2) translateY(-300px) rotateX(20deg); opacity: 0; filter: blur(10px); }
        }

        .composer-container {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
          transition: transform 0.4s var(--ease-ios);
          perspective: 1000px;
        }

        .sending .composer-card {
            animation: flyAway 1.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
            pointer-events: none;
        }

        .composer-card {
           background: rgba(10, 10, 10, 0.3);
           backdrop-filter: blur(12px);
           border: 1px solid rgba(255, 255, 255, 0.1);
           border-radius: 20px;
           padding: 30px;
           box-shadow: 0 10px 40px rgba(0,0,0,0.2);
           transition: all 0.4s var(--ease-ios);
           position: relative;
        }

        .focused .composer-card {
           box-shadow: 0 20px 60px rgba(0,0,0,0.15);
           transform: translateY(-2px);
           border-color: var(--text-secondary);
        }
        
        .letter-input {
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-family: var(--font-current);
          font-size: 21px;
          line-height: 1.6;
          width: 100%;
          resize: none;
          outline: none;
          min-height: 200px;
          max-height: 60vh;
          overflow-y: auto;
          padding: 0;
          scrollbar-width: none;
        }
        
        .letter-input::-webkit-scrollbar {
            display: none;
        }

        .letter-input::placeholder {
          color: var(--text-secondary);
          opacity: 0.4;
          font-style: italic;
        }

        .controls {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 20px;
          opacity: ${text.length > 0 ? 1 : 0};
          transform: translateY(${text.length > 0 ? 0 : '10px'});
          transition: all 0.4s var(--ease-ios);
          pointer-events: ${text.length > 0 ? 'auto' : 'none'};
          margin-top: 10px;
          border-top: 1px solid var(--glass-border);
        }

        .helper-text {
            font-size: 13px;
            color: var(--text-secondary);
            margin-right: auto;
            align-self: center;
            opacity: 0.6;
        }

        .btn-icon {
            background: transparent;
            border: 1px solid var(--glass-border);
            color: var(--text-secondary);
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .btn-icon:hover {
            background: rgba(255,255,255,0.1);
            color: var(--text-primary);
        }
        .btn-icon.active {
            background: var(--accent-gold, #ffd700);
            color: black;
            border-color: var(--accent-gold, #ffd700);
            width: auto;
            padding: 0 12px;
            border-radius: 16px;
            font-weight: bold;
            font-size: 13px;
        }

        .reply-context {
            font-size: 12px;
            color: var(--accent-gold, #ffd700);
            margin-bottom: 10px;
            font-family: monospace;
            opacity: 0.8;
        }

        .vim-status-bar {
            display: none;
            margin-top: 10px;
            font-family: 'Fira Code', monospace;
            font-size: 14px;
            color: var(--text-primary);
            border-top: 1px solid var(--glass-border);
            padding-top: 5px;
        }

                /* Accessing Global Theme State */
        :global([data-theme='neovim']) .vim-status-bar,
        :global([data-theme='terminal']) .vim-status-bar {
            display: flex;
            justify-content: space-between;
        }

        /* --- NEOVIM TERMINAL OVERRIDES --- */
        :global([data-theme='neovim']) .composer-card {
            background: transparent !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            backdrop-filter: none !important;
        }

        :global([data-theme='neovim']) .letter-input {
            font-family: 'Fira Code', monospace !important;
            font-size: 16px !important;
            padding-left: 40px; /* Space for imaginary line numbers */
            min-height: 60vh;
        }

        /* Hide standard controls in Vim mode to force motions */
        :global([data-theme='neovim']) .controls {
            opacity: 0 !important;
            pointer-events: none !important;
            height: 0;
            overflow: hidden;
        }

        /* Fix Status Bar to Bottom of Screen */
        :global([data-theme='neovim']) .vim-status-bar {
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100vw;
            background: var(--bg-surface);
            color: var(--text-primary);
            padding: 5px 10px;
            font-size: 14px;
            border-top: none;
            z-index: 1000;
        }

        .vim-mode {
            font-weight: bold;
            color: var(--accent-success);
        }
        .vim-cmd {
            color: var(--text-primary);
        }
      `}</style>

            <div className="composer-card">
                {replyTo && (
                    <div className="reply-context">
                        <span>↳ Threading with Fragment #{replyTo.id.toString().substring(0, 6)}...</span>
                    </div>
                )}

                <textarea
                    ref={textareaRef}
                    className={`letter-input ${errorShake ? 'animate-shake' : ''}`}
                    placeholder={replyTo ? "Continue the thought..." : "Dear..."}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onFocus={() => { setIsFocused(true); if (onFocusChange) onFocusChange(true); }}
                    onBlur={() => { setIsFocused(false); if (onFocusChange) onFocusChange(false); }}
                    onPaste={handlePaste}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    spellCheck={false}
                    autoCorrect="off"
                    autoCapitalize="none"
                />

                <TurnstileWidget onVerify={(token) => setIsVerified(true)} />

                <div className="controls">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: 'auto' }}>
                        <button
                            className={`btn-icon ${unlockAt ? 'active' : ''}`}
                            onClick={() => {
                                if (unlockAt) {
                                    setUnlockAt(null);
                                } else {
                                    const tomorrow = new Date();
                                    tomorrow.setDate(tomorrow.getDate() + 1);
                                    setUnlockAt(tomorrow);
                                }
                            }}
                            title="Time Capsule (Lock Letter)"
                        >
                            {unlockAt ? '⏳' : '⏳'}
                        </button>

                        {unlockAt && (
                            <input
                                type="date"
                                min={new Date().toISOString().split('T')[0]}
                                value={unlockAt.toISOString().split('T')[0]}
                                onChange={(e) => {
                                    if (e.target.value) {
                                        setUnlockAt(new Date(e.target.value));
                                    }
                                }}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-secondary)',
                                    fontFamily: 'var(--font-current)',
                                    fontSize: '12px',
                                    cursor: 'pointer'
                                }}
                            />
                        )}
                    </div>

                    <span className="helper-text">{text.length} chars</span>
                    <button className="btn-action btn-danger" onClick={handleBurn}>
                        {status === 'BURNING' ? '🔥' : 'Burn'}
                    </button>
                    <button
                        className={`btn-action ${!isVerified ? 'disabled' : ''}`}
                        onClick={handleSend}
                        disabled={!isVerified}
                        style={{
                            opacity: isVerified ? 1 : 0.5,
                            cursor: isVerified ? 'pointer' : 'not-allowed'
                        }}
                    >
                        {status === 'SENDING' ? 'Sent' : 'Send'}
                    </button>
                </div>

                <div className="vim-status-bar">
                    <span className="vim-mode">-- {vimMode} --</span>
                    <span className="vim-cmd">{cmdBuffer}</span>
                </div>
            </div>
        </div>
    );
}
