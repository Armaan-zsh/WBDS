'use client';

import { useState, useRef, useEffect } from 'react';
import { containsLinkPattern, containsSocialSolicitation } from '../../utils/contentFilters';
import { maskPrivateInfo, detectPotentialDox } from '../../utils/privacyShield';

import { playTypeSound, playSendSound } from '../../utils/audioEngine';
import TurnstileWidget from '../Security/TurnstileWidget';

import PrivacyWarningModal from './PrivacyWarningModal';

export default function LetterComposer({ onSend, onError, onFocusChange, replyTo }) {
    const [text, setText] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [errorShake, setErrorShake] = useState(false);
    const [status, setStatus] = useState('IDLE'); // IDLE, SENDING, BURNING
    const [unlockAt, setUnlockAt] = useState(null);
    const [isVerified, setIsVerified] = useState(false);
    const [doxWarning, setDoxWarning] = useState(null);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    const [detectedRisks, setDetectedRisks] = useState({ risks: [], warnings: [] });

    const MAX_CHARS = 5000; // Maximum character limit

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

    // Real-time doxxing detection
    useEffect(() => {
        if (!text.trim()) {
            setDoxWarning(null);
            return;
        }

        const doxRisk = detectPotentialDox(text);
        if (doxRisk.isRisky) {
            let warningMessage = 'Privacy Warning: ';
            if (doxRisk.risks && doxRisk.risks.length > 0) {
                warningMessage += 'Detected: ' + doxRisk.risks.join(', ') + '. ';
            }
            if (doxRisk.warnings && doxRisk.warnings.length > 0) {
                warningMessage += 'Potential personal details. ';
            }
            setDoxWarning(warningMessage);
        } else {
            setDoxWarning(null);
        }
    }, [text]);

    const handlePreSend = () => {
        if (!text.trim()) return;

        // 0. Check character limit
        if (text.length > MAX_CHARS) {
            triggerShake();
            if (onError) onError(`Letter too long. Maximum ${MAX_CHARS} characters.`);
            return;
        }

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

        // 3. Check Doxxing Risk - Enhanced warning
        const doxRisk = detectPotentialDox(text);
        if (doxRisk.isRisky) {
            setDetectedRisks({ risks: doxRisk.risks || [], warnings: doxRisk.warnings || [] });
            setShowPrivacyModal(true);
            return;
        }

        // No risk? Just send.
        processSend();
    };

    const processSend = () => {
        setShowPrivacyModal(false);

        // 4. Final sanitization
        const safeText = maskPrivateInfo(text);

        playSendSound(); // WHOOSH

        setStatus('SENDING');
        setTimeout(() => {
            onSend(safeText, unlockAt, replyTo?.id);
            setText('');
            setUnlockAt(null);
            setDoxWarning(null);
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
                    e.preventDefault();
                    setVimMode('NORMAL');
                    return;
                }
            } else {
                // NORMAL MODE
                e.preventDefault(); // Block ANY typing in Normal mode
                e.stopPropagation(); // Stop bubbling

                if (e.key === 'i') {
                    setVimMode('INSERT');
                    setCmdBuffer('');
                    return;
                }

                // Command Buffer Logic
                if (e.key === ':' || cmdBuffer.startsWith(':')) {
                    // Firefox fix: Handle Enter key properly
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        // EXECUTE
                        if (cmdBuffer === ':w') handlePreSend();
                        if (cmdBuffer === ':q') handleBurn();
                        if (cmdBuffer === ':wq') { handlePreSend(); }
                        setCmdBuffer('');
                        setVimMode('NORMAL');
                        return;
                    }

                    if (e.key === 'Backspace') {
                        e.preventDefault();
                        setCmdBuffer(prev => prev.slice(0, -1));
                        return;
                    }

                    // Firefox fix: Better key detection
                    if (e.key === ':') {
                        e.preventDefault();
                        setCmdBuffer(':');
                        return;
                    }

                    // Firefox fix: Check for printable characters more reliably
                    if (cmdBuffer.startsWith(':') && e.key.length === 1 &&
                        !e.ctrlKey && !e.metaKey && !e.altKey &&
                        e.key !== 'Enter' && e.key !== 'Backspace' && e.key !== 'Escape') {
                        e.preventDefault();
                        setCmdBuffer(prev => prev + e.key);
                        return;
                    }
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
          padding: 0 16px;
          box-sizing: border-box;
        }

        @media (max-width: 768px) {
          .composer-container {
            max-width: 100%;
            padding: 0 12px;
          }
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
           width: 100%;
           box-sizing: border-box;
        }

        @media (max-width: 768px) {
          .composer-card {
            padding: 20px;
            border-radius: 16px;
          }
        }

        @media (max-width: 480px) {
          .composer-card {
            padding: 16px;
            border-radius: 12px;
          }
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
          box-sizing: border-box;
        }

        @media (max-width: 768px) {
          .letter-input {
            font-size: 18px;
            min-height: 150px;
            max-height: 50vh;
          }
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
          flex-wrap: wrap;
        }

        @media (max-width: 480px) {
          .controls {
            flex-direction: column-reverse;
            gap: 8px;
          }
        }

        .helper-text {
            font-size: 13px;
            color: var(--text-secondary);
            margin-right: auto;
            align-self: center;
            opacity: 0.6;
        }

        .char-count {
            font-size: 12px;
            color: var(--text-secondary);
            opacity: 0.7;
            margin-right: 8px;
        }

        .char-count.warning {
            color: #ff9f00;
        }

        .char-count.error {
            color: var(--accent-danger);
            font-weight: bold;
        }

        .dox-warning {
            background: rgba(255, 69, 58, 0.1);
            border: 1px solid var(--accent-danger);
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 16px;
            font-size: 13px;
            color: var(--accent-danger);
            line-height: 1.5;
        }

        .dox-warning strong {
            display: block;
            margin-bottom: 4px;
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
        /* These are overridden by the global styles below for square appearance */

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

                {doxWarning && (
                    <div className="dox-warning">
                        <strong>⚠️ Privacy Warning</strong>
                        {doxWarning}
                    </div>
                )}

                <textarea
                    ref={textareaRef}
                    className={`letter-input ${errorShake ? 'animate-shake' : ''}`}
                    placeholder={replyTo ? "Continue the thought..." : "Dear..."}
                    value={text}
                    onChange={(e) => {
                        if (e.target.value.length <= MAX_CHARS) {
                            setText(e.target.value);
                        }
                    }}
                    onFocus={() => { setIsFocused(true); if (onFocusChange) onFocusChange(true); }}
                    onBlur={() => { setIsFocused(false); if (onFocusChange) onFocusChange(false); }}
                    onPaste={handlePaste}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    spellCheck={false}
                    autoCorrect="off"
                    autoCapitalize="none"
                    maxLength={MAX_CHARS}
                />

                <TurnstileWidget onVerify={(token) => setIsVerified(true)} />

                <PrivacyWarningModal
                    isOpen={showPrivacyModal}
                    onClose={() => setShowPrivacyModal(false)}
                    onConfirm={processSend}
                    risks={detectedRisks.risks}
                    warnings={detectedRisks.warnings}
                />

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

                    <span className={`char-count ${text.length > MAX_CHARS * 0.9 ? 'warning' : ''} ${text.length >= MAX_CHARS ? 'error' : ''}`}>
                        {text.length} / {MAX_CHARS}
                    </span>
                    <span className="helper-text">{text.length === 0 ? 'Write what you think' : `${text.length} characters`}</span>
                    <button className="btn-action btn-danger" onClick={handleBurn}>
                        {status === 'BURNING' ? '🔥' : 'Burn'}
                    </button>
                    <button
                        className={`btn-action ${!isVerified ? 'disabled' : ''}`}
                        onClick={handlePreSend}
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
                    {cmdBuffer ? (
                        <span className="vim-cmd">{cmdBuffer}<span className="cursor-block"></span></span>
                    ) : (
                        <span className="vim-mode">-- {vimMode} --</span>
                    )}
                </div>
            </div>

            <style jsx global>{`
                .cursor-block {
                    display: inline-block;
                    width: 10px;
                    height: 18px;
                    background: var(--text-primary);
                    margin-left: 2px;
                    vertical-align: middle;
                    animation: blink 1s step-end infinite;
                }
                @keyframes blink { 50% { opacity: 0; } }

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
                    align-items: center;
                }

                /* --- NEOVIM TERMINAL OVERRIDES --- */
                :global([data-theme='neovim']) .composer-container {
                    width: 500px !important;
                    max-width: 500px !important;
                    height: 500px !important;
                    border-radius: 0 !important; /* Square container */
                    padding: 0 !important;
                }

                @media (max-width: 600px) {
                  :global([data-theme='neovim']) .composer-container {
                    width: 100% !important;
                    max-width: 100% !important;
                    height: auto !important;
                    min-height: 400px !important;
                  }
                }

                :global([data-theme='neovim']) .composer-card {
                    background: #1d2021 !important; /* Hard Gruvbox Background */
                    box-shadow: 0 0 0 2px rgba(235, 219, 178, 0.4) !important; /* Visible Outline */
                    border: 2px solid #ebdbb2 !important; /* High Contrast Border */
                    border-radius: 0 !important; /* Strict Square Corners */
                    padding: 0 !important;
                    display: flex !important;
                    flex-direction: column !important;
                    overflow: hidden !important;
                    width: 500px !important;
                    height: 500px !important;
                    min-height: 500px !important;
                    margin: 0 auto !important; /* Ensure centered */
                }

                @media (max-width: 600px) {
                  :global([data-theme='neovim']) .composer-card {
                    width: 100% !important;
                    height: auto !important;
                    min-height: 400px !important;
                  }
                }

                :global([data-theme='neovim']) .letter-input {
                    font-family: 'Fira Code', monospace !important;
                    font-size: 15px !important;
                    line-height: 1.6 !important;
                    padding: 20px 20px !important;
                    width: 100% !important;
                    height: 100% !important;
                    min-height: 0 !important; /* Allow flex sizing */
                    border: none !important;
                    outline: none !important;
                    resize: none !important;
                    flex-grow: 1;
                }

                /* Hide standard controls in Vim mode to force motions */
                :global([data-theme='neovim']) .controls {
                    opacity: 0 !important;
                    pointer-events: none !important;
                    height: 0;
                    overflow: hidden;
                }

                @media (max-width: 768px) {
                    /* Restore controls for mobile users who can't use Vim bindings */
                    :global([data-theme='neovim']) .controls {
                        opacity: 1 !important;
                        pointer-events: auto !important;
                        height: auto !important;
                        overflow: visible !important;
                        padding-top: 10px;
                    }
                }

                /* Status Bar inside the Card */
                :global([data-theme='neovim']) .vim-status-bar {
                    position: relative; /* Inside card flow */
                    bottom: auto;
                    left: auto;
                    width: 100%;
                    padding: 8px 15px;
                    font-size: 13px;
                    border-top: 1px solid rgba(235, 219, 178, 0.1);
                    background: rgba(30, 30, 30, 0.5);
                    justify-content: flex-start;
                }

                .vim-mode {
                    font-weight: bold;
                    color: var(--accent-success);
                }
                .vim-cmd {
                    color: var(--text-primary);
                    font-weight: bold;
                    display: flex;
                    align-items: center;
                }
            `}</style>
        </div>
    );
}
