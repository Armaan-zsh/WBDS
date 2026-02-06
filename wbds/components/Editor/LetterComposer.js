'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { containsLinkPattern, containsSocialSolicitation, moderateContent } from '../../utils/contentFilters';
import { maskPrivateInfo, detectPotentialDox } from '../../utils/privacyShield';

import { playTypeSound, playSendSound } from '../../utils/audioEngine';
import TurnstileWidget from '../Security/TurnstileWidget';

import PrivacyWarningModal from './PrivacyWarningModal';

export default function LetterComposer({ onSend, onError, onFocusChange, replyTo }) {
    const [text, setText] = useState('');
    const [tags, setTags] = useState([]); // [NEW] Emotional Tags
    const [isFocused, setIsFocused] = useState(false);
    const [errorShake, setErrorShake] = useState(false);
    const [status, setStatus] = useState('IDLE'); // IDLE, SENDING, BURNING
    const [unlockAt, setUnlockAt] = useState(null);
    const [isVerified, setIsVerified] = useState(false);
    const [doxWarning, setDoxWarning] = useState(null);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    const [detectedRisks, setDetectedRisks] = useState({ risks: [], warnings: [] });
    const [recipientType, setRecipientType] = useState('unknown'); // [NEW] Purpose Protection
    const [showGuidanceModal, setShowGuidanceModal] = useState(false); // [NEW] Purpose Protection
    const [isCrisisDetected, setIsCrisisDetected] = useState(false); // [NEW] Crisis Lifeline
    const [isFocusMode, setIsFocusMode] = useState(false); // [NEW] Distraction-Free Mode

    const MAX_CHARS = 7777; // Maximum character limit

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

    // Focus Mode Keyboard Shortcuts
    useEffect(() => {
        const handleFocusShortcut = (e) => {
            // Cmd/Ctrl + Shift + F to enter focus mode
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'f' || e.key === 'F')) {
                e.preventDefault();
                setIsFocusMode(true);
                setTimeout(() => textareaRef.current?.focus(), 100);
            }
            // ESC to exit focus mode (only when not in Vim theme)
            if (e.key === 'Escape' && isFocusMode) {
                const isVim = typeof document !== 'undefined' &&
                    (document.documentElement.getAttribute('data-theme') === 'neovim' ||
                        document.documentElement.getAttribute('data-theme') === 'terminal');
                if (!isVim) {
                    e.preventDefault();
                    setIsFocusMode(false);
                }
            }
        };

        document.addEventListener('keydown', handleFocusShortcut);
        return () => document.removeEventListener('keydown', handleFocusShortcut);
    }, [isFocusMode]);

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

        // 1. CONTENT MODERATION (8 layers)
        const moderation = moderateContent(text);
        if (moderation.blocked) {
            triggerShake();
            if (onError) onError(moderation.blockMessage);
            return;
        }

        // 2. Check Links (additional warning - moderation catches most)
        if (containsLinkPattern(text)) {
            triggerShake();
            if (onError) onError("No links. The void rejects them.");
            return;
        }

        // 3. Check Social Solicitation
        if (containsSocialSolicitation(text)) {
            triggerShake();
            if (onError) onError("No social handles or self-promo allowed.");
            return;
        }

        // 4. Check Doxxing Risk - Enhanced warning
        const doxRisk = detectPotentialDox(text);
        if (doxRisk.isRisky) {
            setDetectedRisks({ risks: doxRisk.risks || [], warnings: doxRisk.warnings || [] });
            setShowPrivacyModal(true);
            return;
        }

        // No risk? Just send.
        processSend();
    };

    const processSend = async (forced = false) => {
        setShowPrivacyModal(false);
        setShowGuidanceModal(false);

        // 4. Final sanitization
        const safeText = maskPrivateInfo(text);

        playSendSound(); // WHOOSH
        setStatus('SENDING');

        try {
            // [MODIFIED] Using internal onSend and handling response
            const response = await onSend(safeText, unlockAt, replyTo?.id, tags, recipientType, forced);

            // Check if API returned an error (blocked by moderation)
            if (response?.error) {
                setStatus('IDLE');
                // Error is already shown by handleError in page.js
                // Don't clear text - let user see what was blocked
                return;
            }

            if (response?.crisis_detected) {
                setIsCrisisDetected(true);
            }

            if (response?.guidance_needed && !forced) {
                setStatus('IDLE');
                setShowGuidanceModal(true);
                return;
            }

            // Only clear on SUCCESS
            setText('');
            setTags([]);
            setRecipientType('unknown');
            setUnlockAt(null);
            setDoxWarning(null);
            setStatus('IDLE');
        } catch (err) {
            setStatus('IDLE');
            if (onError) onError(err.message || "The void is unstable. Try again.");
        }
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

    // Handle markdown shortcuts in focus mode
    const handleFocusKeyDown = (e) => {
        const textarea = e.target;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = text.substring(start, end);

        // Ctrl/Cmd + B for bold
        if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
            e.preventDefault();
            if (selectedText) {
                const newText = text.substring(0, start) + `**${selectedText}**` + text.substring(end);
                if (newText.length <= MAX_CHARS) {
                    setText(newText);
                    // Set cursor after the formatted text
                    setTimeout(() => {
                        textarea.selectionStart = start + 2;
                        textarea.selectionEnd = end + 2;
                    }, 0);
                }
            }
        }

        // Ctrl/Cmd + I for italic
        if ((e.ctrlKey || e.metaKey) && (e.key === 'i' || e.key === 'I')) {
            e.preventDefault();
            if (selectedText) {
                const newText = text.substring(0, start) + `*${selectedText}*` + text.substring(end);
                if (newText.length <= MAX_CHARS) {
                    setText(newText);
                    setTimeout(() => {
                        textarea.selectionStart = start + 1;
                        textarea.selectionEnd = end + 1;
                    }, 0);
                }
            }
        }
    };

    // Focus mode portal element - NOT a component to prevent remount on every render
    const focusModeElement = isFocusMode && typeof document !== 'undefined' ? createPortal(
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(30px) saturate(150%)',
                WebkitBackdropFilter: 'blur(30px) saturate(150%)',
                zIndex: 99999,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            {/* Close button */}
            <button
                onClick={() => setIsFocusMode(false)}
                style={{
                    position: 'fixed',
                    top: 24,
                    right: 24,
                    width: 44,
                    height: 44,
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '50%',
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: 20,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                }}
            >
                ×
            </button>

            {/* Main content - glass card */}
            <div style={{
                width: '90%',
                maxWidth: 800,
                height: '70vh',
                display: 'flex',
                flexDirection: 'column',
                background: 'rgba(20, 20, 25, 0.6)',
                borderRadius: 20,
                padding: 40,
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}>
                <textarea
                    value={text}
                    onChange={(e) => {
                        if (e.target.value.length <= MAX_CHARS) {
                            setText(e.target.value);
                        }
                    }}
                    onKeyDown={handleFocusKeyDown}
                    placeholder="Dear..."
                    autoFocus
                    spellCheck={false}
                    style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-primary, #fff)',
                        fontFamily: 'var(--font-current, serif)',
                        fontSize: 24,
                        lineHeight: 1.8,
                        width: '100%',
                        resize: 'none',
                        outline: 'none',
                        caretColor: 'var(--text-primary, #fff)',
                    }}
                />

                {/* Bottom bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 20 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary, rgba(255,255,255,0.5))', fontFamily: 'monospace' }}>
                        {text.split(/\s+/).filter(w => w.length > 0).length} words · {text.length}/{MAX_CHARS}
                    </span>
                    <button
                        onClick={() => {
                            setIsFocusMode(false);
                            setTimeout(() => handlePreSend(), 100);
                        }}
                        disabled={!text.trim()}
                        style={{
                            padding: '10px 24px',
                            background: text.trim() ? 'var(--text-primary, #fff)' : 'rgba(255,255,255,0.1)',
                            border: 'none',
                            borderRadius: 30,
                            color: text.trim() ? 'var(--bg-depth, #000)' : 'rgba(255,255,255,0.3)',
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: text.trim() ? 'pointer' : 'not-allowed',
                        }}
                    >
                        Send to Void
                    </button>
                </div>
            </div>

            {/* Hint */}
            <span style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', padding: '6px 12px', borderRadius: 20, backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
                ESC to exit · ⌘B bold · ⌘I italic
            </span>
        </div>,
        document.body
    ) : null;

    return (
        <>
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
          perspective: 1000px;
          padding: 0 16px;
          box-sizing: border-box;
          transform: translateZ(0); /* Force GPU */
        }

        .sending .composer-card {
            animation: flyAway 1.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
            pointer-events: none;
        }

        .composer-card {
           position: relative;
           width: 100%;
           box-sizing: border-box;
           background: transparent;
           border: 1px solid rgba(255, 255, 255, 0.18);
           border-radius: 28px;
           padding: 30px;
           box-shadow: 0 20px 60px rgba(0,0,0,0.5);
           isolation: isolate; 
           transform: translateZ(0);
           transition: box-shadow 0.4s var(--ease-ios);
        }

        @keyframes flyAway {
            0% { transform: scale(1) translateY(0) rotateX(0); opacity: 1; filter: blur(0); }
            20% { transform: scale(0.9) translateY(20px) rotateX(-10deg); opacity: 1; }
            100% { transform: scale(0.2) translateY(-300px) rotateX(20deg) translateZ(0); opacity: 0; filter: blur(10px); }
        }

        .composer-card::before {
           content: "";
           position: absolute;
           inset: 0;
           background: rgba(15, 15, 15, 0.55);
           backdrop-filter: blur(40px) saturate(220%);
           -webkit-backdrop-filter: blur(40px) saturate(220%);
           border-radius: 28px;
           z-index: -1;
           /* NO TRANSITIONS HERE to prevent drop during render */
        }

        @media (max-width: 768px) {
          .composer-card {
            padding: 18px;
            border-radius: 20px;
          }
          .composer-card::before {
            border-radius: 20px;
          }
        }

        .focused .composer-card {
           border-color: rgba(255, 255, 255, 0.35);
           box-shadow: 0 30px 80px rgba(0,0,0,0.6);
        }

        .focused .composer-card::before {
           background: rgba(10, 10, 10, 0.65);
           /* Still no transitions */
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
            font-size: 16px; /* Prevent IOS zoom */
            min-height: 80px; /* Smaller starting height */
            max-height: 35vh; /* Don't take more than 35% of screen */
            padding: 8px !important; /* Reduced padding */
          }
        }
        
        @media (max-width: 480px) {
          .letter-input {
            min-height: 60px; /* Even smaller on very small screens */
            max-height: 30vh; /* Less vertical space */
            font-size: 15px;
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
          align-items: center;
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

        @media (max-width: 480px) {
          .controls {
            flex-direction: column-reverse;
            gap: 8px;
          }
        }

        .helper-text {
            font-size: 13px;
            color: var(--text-secondary);
            opacity: 0.6;
        }

        .btn-action {
            padding: 12px 28px;
            border-radius: 50px;
            font-size: 15px;
            font-weight: 600;
            border: none;
            cursor: pointer;
            transition: all 0.3s var(--ease-ios);
            background: var(--text-primary);
            color: var(--bg-depth);
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 100px;
            height: 48px;
        }

        .btn-action.btn-danger {
            background: rgba(255, 69, 58, 0.15);
            color: #ff453a;
            border: 1px solid rgba(255, 69, 58, 0.2);
        }

        .btn-action:hover {
            transform: scale(1.02);
            filter: brightness(1.1);
        }

        .btn-action.disabled {
            opacity: 0.4;
            cursor: not-allowed;
            filter: grayscale(1);
        }

        .char-count {
            font-size: 11px;
            font-family: var(--font-mono, monospace);
            color: var(--text-secondary);
            opacity: 0.5;
            letter-spacing: 0.1em;
            padding: 6px 14px;
            align-self: center;
        }

        .char-count.warning { color: var(--accent-gold); opacity: 1; }
        .char-count.error { color: var(--accent-danger); opacity: 1; font-weight: bold; }

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

        /* TAGS START */
        .tags-section {
            margin-top: 16px;
            padding-top: 12px;
            border-top: 1px solid var(--glass-border);
        }
        .tags-container {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        .tag-pill {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--glass-border);
            color: var(--text-secondary);
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
            font-family: var(--font-current);
        }
        .tag-pill:hover {
            background: rgba(255, 255, 255, 0.1);
            color: var(--text-primary);
        }
        .tag-pill.selected {
            background: var(--text-primary);
            color: var(--bg-depth);
            border-color: var(--text-primary);
            font-weight: 600;
        }
        /* TAGS END */

        /* RECIPIENT SELECTOR */
        .recipient-section {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
        }
        .recipient-select {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--glass-border);
            color: var(--text-secondary);
            padding: 8px 16px;
            border-radius: 12px;
            font-size: 13px;
            font-family: var(--font-current);
            outline: none;
            cursor: pointer;
            transition: all 0.2s ease;
            appearance: none;
            -webkit-appearance: none;
            background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.4)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
            background-repeat: no-repeat;
            background-position: right 12px center;
            background-size: 14px;
            padding-right: 36px;
        }
        .recipient-select:focus {
            border-color: var(--text-primary);
            color: var(--text-primary);
            background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.8)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
        }
        .recipient-select option {
            background: #111; /* Fallback for dark themes */
            color: white;
        }
        /* Specific theme override for paper/light theme */
        :global([data-theme='paper']) .recipient-select option {
            background: #fdfdfd;
            color: #333;
        }
        :global([data-theme='neovim']) .recipient-select option {
            background: #1d2021;
            color: #ebdbb2;
        }

        /* GUIDANCE MODAL */
        .guidance-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.8);
            backdrop-filter: blur(10px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 20px;
        }
        .guidance-card {
            background: #111;
            border: 1px solid var(--glass-border);
            border-radius: 20px;
            padding: 40px;
            max-width: 450px;
            text-align: center;
        }
        .guidance-card h3 { font-size: 24px; margin-bottom: 16px; color: var(--text-primary); }
        .guidance-card p { font-size: 16px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 24px; }
        .guidance-actions { display: flex; gap: 12px; justify-content: center; }

        /* CRISIS BANNER */
        .crisis-banner {
            background: rgba(255, 69, 58, 0.1);
            border: 1px solid var(--accent-danger);
            color: var(--text-primary);
            padding: 20px;
            border-radius: 12px;
            margin-top: 20px;
            text-align: center;
            animation: fadeIn 0.5s ease;
        }
        .crisis-banner a { color: #ff453a; font-weight: bold; text-decoration: underline; }

        /* FOCUS MODE - Distraction-Free Writing */
        .focus-mode-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(30px) saturate(180%);
            -webkit-backdrop-filter: blur(30px) saturate(180%);
            z-index: 9999;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            animation: focusFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes focusFadeIn {
            from { opacity: 0; backdrop-filter: blur(0); }
            to { opacity: 1; backdrop-filter: blur(30px); }
        }

        .focus-mode-content {
            width: 100%;
            max-width: 700px;
            padding: 40px;
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        .focus-textarea {
            background: transparent;
            border: none;
            color: var(--text-primary);
            font-family: var(--font-current);
            font-size: 24px;
            line-height: 1.8;
            width: 100%;
            min-height: 50vh;
            resize: none;
            outline: none;
            caret-color: var(--text-primary);
        }

        .focus-textarea::placeholder {
            color: rgba(255, 255, 255, 0.2);
            font-style: italic;
        }

        .focus-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            opacity: 0.4;
            transition: opacity 0.3s ease;
        }

        .focus-footer:hover {
            opacity: 0.8;
        }

        .focus-word-count {
            font-size: 13px;
            color: var(--text-secondary);
            font-family: monospace;
        }

        .focus-close-btn {
            position: fixed;
            top: 30px;
            right: 30px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: var(--text-secondary);
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            opacity: 0.5;
        }

        .focus-close-btn:hover {
            background: rgba(255, 255, 255, 0.2);
            color: var(--text-primary);
            opacity: 1;
            transform: scale(1.1);
        }

        .focus-hint {
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 12px;
            color: var(--text-secondary);
            opacity: 0.3;
            font-family: monospace;
        }
      `}</style>

                <div className="composer-card">
                    {replyTo && (
                        <div className="reply-context">
                            <span>↳ Threading with Fragment #{replyTo.id.toString().substring(0, 6)}...</span>
                        </div>
                    )}

                    {/* RECIPIENT SELECTOR */}
                    <div className="recipient-section">
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', opacity: 0.6 }}>To:</span>
                        <select
                            className="recipient-select"
                            value={recipientType}
                            onChange={(e) => setRecipientType(e.target.value)}
                        >
                            <option value="unknown">Someone unnamed...</option>
                            <option value="specific">A specific person...</option>
                            <option value="universe">The universe...</option>
                            <option value="self">My future/past self...</option>
                        </select>
                    </div>

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
                        onDoubleClick={() => setIsFocusMode(true)}
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

                    {/* EMOTIONAL TAGS SELECTOR */}
                    <div className="tags-section">
                        <div className="tags-container">
                            {['#Love', '#Hope', '#Regret', '#Anger', '#Grief', '#Joy', '#Fear', '#Void'].map(tag => (
                                <button
                                    key={tag}
                                    className={`tag-pill ${tags.includes(tag) ? 'selected' : ''}`}
                                    onClick={() => {
                                        if (tags.includes(tag)) {
                                            setTags(tags.filter(t => t !== tag));
                                        } else {
                                            if (tags.length < 5) setTags([...tags, tag]);
                                            else triggerShake();
                                        }
                                    }}
                                >
                                    {tag}
                                </button>
                            ))}

                            {text.length > 0 && (
                                <div className={`char-count ${text.length > MAX_CHARS * 0.9 ? 'warning' : ''} ${text.length >= MAX_CHARS ? 'error' : ''}`}>
                                    {text.length} / {MAX_CHARS}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="controls">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: 'auto' }}>
                            {/* Fullscreen Focus Mode Button */}
                            <button
                                className="btn-icon"
                                onClick={() => setIsFocusMode(true)}
                                title="Focus Mode (⌘⇧F)"
                                style={{ opacity: 0.6 }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="15 3 21 3 21 9"></polyline>
                                    <polyline points="9 21 3 21 3 15"></polyline>
                                    <polyline points="21 15 21 21 15 21"></polyline>
                                    <polyline points="3 9 3 3 9 3"></polyline>
                                </svg>
                            </button>
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

                        <div className="helper-text" style={{ flexGrow: 1 }}>
                            {text.length === 0 ? 'Write what you think' : ''}
                        </div>

                        <button className="btn-action btn-danger" onClick={handleBurn}>
                            {status === 'BURNING' ? '🔥' : 'Burn'}
                        </button>
                        <button
                            className={`btn-action ${!isVerified ? 'disabled' : ''}`}
                            onClick={() => processSend(false)}
                            disabled={!isVerified}
                        >
                            {status === 'SENDING' ? 'Sent' : 'Send'}
                        </button>
                    </div>

                    {/* GUIDANCE MODAL */}
                    {showGuidanceModal && (
                        <div className="guidance-overlay">
                            <div className="guidance-card">
                                <h3>Is this a letter?</h3>
                                <p>WBDS is a space for unsent letters and personal release. Your words feel more like a story or a public post.</p>
                                <div className="guidance-actions">
                                    <button className="btn-action btn-danger" onClick={() => setShowGuidanceModal(false)}>Edit</button>
                                    <button className="btn-action" onClick={() => processSend(true)}>It IS a letter</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CRISIS LIFELINE */}
                    {isCrisisDetected && (
                        <div className="crisis-banner">
                            <p>The void hears you, but the world still needs you.</p>
                            <p style={{ fontSize: '14px', marginTop: '8px' }}>
                                You are not alone. Please consider reaching out: <br />
                                <strong>National Suicide Prevention Lifeline: 988</strong> or <a href="https://findahelpline.com" target="_blank">Find a local helpline</a>
                            </p>
                            <button
                                className="tag-pill"
                                style={{ marginTop: '16px', background: 'rgba(255,255,255,0.1)' }}
                                onClick={() => setIsCrisisDetected(false)}
                            >
                                Close
                            </button>
                        </div>
                    )}

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

            {/* Focus Mode - Rendered via Portal for true fullscreen */}
            {focusModeElement}
        </>
    );
}
