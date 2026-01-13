'use client';

import { useState, useRef, useEffect } from 'react';
import { containsLinkPattern, containsSocialSolicitation } from '../../utils/contentFilters';
import { maskPrivateInfo, detectPotentialDox } from '../../utils/privacyShield';

import { playTypeSound, playSendSound } from '../../utils/audioEngine';

export default function LetterComposer({ onSend, onError }) {
    const [text, setText] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [errorShake, setErrorShake] = useState(false);
    const [status, setStatus] = useState('IDLE'); // IDLE, SENDING, BURNING
    const [unlockAt, setUnlockAt] = useState(null);

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

        // 2. Check Social Solicitation (New AI-lite filter)
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
            onSend(safeText, unlockAt); // Pass Lock Date
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

        if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'i')) {
            e.preventDefault();
            const wrapper = e.key === 'b' ? '**' : '*';

            const start = textareaRef.current.selectionStart;
            const end = textareaRef.current.selectionEnd;

            if (start === end) return; // No selection

            const selected = text.substring(start, end);
            const newValue =
                text.substring(0, start) +
                wrapper + selected + wrapper +
                text.substring(end);

            setText(newValue);

            // Restore selection (including wrappers)
            // setTimeout needed to run after React render
            setTimeout(() => {
                textareaRef.current.setSelectionRange(start, end + (wrapper.length * 2));
            }, 0);
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text');

        // Regex to find URLs
        const urlRegex = /(https?:\/\/[^\s]+)/g;

        if (containsLinkPattern(pastedData)) {
            const sanitized = pastedData.replace(urlRegex, '[LINK REMOVED]');

            // Insert at cursor position
            const selectionStart = textareaRef.current.selectionStart;
            const selectionEnd = textareaRef.current.selectionEnd;
            const newValue =
                text.substring(0, selectionStart) +
                sanitized +
                text.substring(selectionEnd);

            setText(newValue);
            triggerShake();
            if (onError) onError("Links were stripped. The void is pure.");
        } else {
            // Normal paste
            const selectionStart = textareaRef.current.selectionStart;
            const selectionEnd = textareaRef.current.selectionEnd;
            const newValue =
                text.substring(0, selectionStart) +
                pastedData +
                text.substring(selectionEnd);
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
          perspective: 1000px; /* Enable 3D space */
        }

        .sending .composer-card {
            animation: flyAway 1.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
            pointer-events: none;
        }

        .composer-card {
           background: rgba(10, 10, 10, 0.3); /* High transparency */
           backdrop-filter: blur(12px); /* Strong blur for readability */
           border: 1px solid rgba(255, 255, 255, 0.1);
           border-radius: 20px; /* iOS rounded styles */
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
          font-family: var(--font-current); /* Dynamic Font */
          font-size: 21px;
          line-height: 1.6;
          width: 100%;
          resize: none;
          outline: none;
          min-height: 200px;
          max-height: 60vh; /* Prevent infinite growth */
          overflow-y: auto; /* Enable internal scrolling */
          padding: 0;
          scrollbar-width: none; /* Firefox */
          -webkit-overflow-scrolling: touch; /* smooth iOS scrolling */
        }
        
        .letter-input::-webkit-scrollbar {
            display: none; /* Chrome/Safari */
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
      `}</style>

            <div className="composer-card">
                <textarea
                    ref={textareaRef}
                    className={`letter-input ${errorShake ? 'animate-shake' : ''}`}
                    placeholder="Dear..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onPaste={handlePaste}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    spellCheck={false}
                    autoCorrect="off"
                    autoCapitalize="none"
                />

                <div className="controls">
                    {/* Time Capsule Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: 'auto' }}>
                        <button
                            className={`btn-icon ${unlockAt ? 'active' : ''}`}
                            onClick={() => {
                                if (unlockAt) {
                                    setUnlockAt(null); // Clear
                                } else {
                                    // Default to 1 Year
                                    const date = new Date();
                                    date.setFullYear(date.getFullYear() + 1);
                                    setUnlockAt(date);
                                }
                            }}
                            title="Time Capsule (Lock Letter)"
                        >
                            {unlockAt ? '⏳ Locked' : '⏳'}
                        </button>

                        {unlockAt && (
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                Unlocks: {unlockAt.toLocaleDateString()}
                            </span>
                        )}
                    </div>

                    <span className="helper-text">{text.length} chars</span>
                    <button className="btn-action btn-danger" onClick={handleBurn}>
                        {status === 'BURNING' ? '🔥' : 'Burn'}
                    </button>
                    <button className="btn-action" onClick={handleSend}>
                        {status === 'SENDING' ? 'Sent' : 'Send'}
                    </button>

                    <style jsx>{`
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
                     `}</style>
                </div>
            </div>
        </div>
    );
}
