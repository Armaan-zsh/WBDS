'use client';

import { useState, useRef, useEffect } from 'react';
import { containsLinkPattern } from '../../utils/contentFilters';
import { maskPrivateInfo, detectPotentialDox } from '../../utils/privacyShield';

export default function LetterComposer({ onSend }) {
    const [text, setText] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [errorShake, setErrorShake] = useState(false);
    const [status, setStatus] = useState('IDLE'); // IDLE, SENDING, BURNING

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

        if (containsLinkPattern(text)) {
            triggerShake();
            alert("No links. The void rejects them.");
            return;
        }

        const doxRisk = detectPotentialDox(text);
        if (doxRisk.isRisky) {
            const confirm = window.confirm("Privacy Warning: You mentioned real names and locations. Are you sure this is anonymous?");
            if (!confirm) return;
        }

        const safeText = maskPrivateInfo(text);

        setStatus('SENDING');
        setTimeout(() => {
            onSend(safeText);
            setText('');
            setStatus('IDLE');
        }, 800);
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

    return (
        <div className={`composer-container ${isFocused ? 'focused' : ''}`}>
            <style jsx>{`
        .composer-container {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px 0;
          transition: opacity 0.4s var(--ease-ios);
        }
        
        .letter-input {
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-family: 'Charter', 'Georgia', 'Times New Roman', serif; /* The "Letter" Look */
          font-size: 22px;
          line-height: 1.6;
          width: 100%;
          resize: none;
          outline: none;
          min-height: 150px;
          padding: 0;
        }

        .letter-input::placeholder {
          color: rgba(255, 255, 255, 0.15);
          font-style: italic;
        }

        .controls {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 24px;
          opacity: ${text.length > 0 ? 1 : 0};
          transform: translateY(${text.length > 0 ? 0 : '10px'});
          transition: all 0.4s var(--ease-ios);
          pointer-events: ${text.length > 0 ? 'auto' : 'none'};
          border-top: 1px solid rgba(255,255,255,0.05);
          margin-top: 20px;
        }

        .helper-text {
            font-size: 13px;
            color: var(--text-secondary);
            margin-right: auto;
            align-self: center;
            opacity: 0.6;
        }
      `}</style>

            <textarea
                ref={textareaRef}
                className={`letter-input ${errorShake ? 'animate-shake' : ''}`}
                placeholder="Dear..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                rows={1}
                spellCheck={false}
            />

            <div className="controls">
                <span className="helper-text">{text.length} chars</span>
                <button className="btn-action btn-danger" onClick={handleBurn}>
                    {status === 'BURNING' ? '🔥' : 'Burn'}
                </button>
                <button className="btn-action" onClick={handleSend}>
                    {status === 'SENDING' ? 'Sent' : 'Send'}
                </button>
            </div>
        </div>
    );
}
