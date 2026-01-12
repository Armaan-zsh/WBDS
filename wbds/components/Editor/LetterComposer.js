'use client';

import { useState, useRef, useEffect } from 'react';
import { normalizeText, containsLinkPattern } from '../../utils/contentFilters';
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

        // 1. VIOLATION CHECK (Links)
        if (containsLinkPattern(text)) {
            triggerShake();
            alert("No links. The void rejects them."); // Temporary, will be UI later
            return;
        }

        // 2. PRIVACY CHECK (Doxing)
        const doxRisk = detectPotentialDox(text);
        if (doxRisk.isRisky) {
            // Ideally show a modal, for now alert
            const confirm = window.confirm("Privacy Warning: You mentioned real names and locations. Are you sure this is anonymous?");
            if (!confirm) return;
        }

        // 3. SANITIZE
        const safeText = maskPrivateInfo(text);

        setStatus('SENDING');
        setTimeout(() => {
            onSend(safeText); // Simulate network
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
            {/* 
        We use inline styles for the composer specific layout to keep it co-located 
        until we deciding on moving it to module.css
      */}
            <style jsx>{`
        .composer-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 24px;
          transition: all 0.4s var(--ease-ios);
        }
        .composer-container.focused {
          background: #000; /* Deep black focus */
        }
        .controls {
          display: flex;
          justify-content: space-between;
          padding-top: 20px;
          opacity: ${text.length > 0 ? 1 : 0};
          transform: translateY(${text.length > 0 ? 0 : '10px'});
          transition: all 0.3s var(--ease-ios);
          pointer-events: ${text.length > 0 ? 'auto' : 'none'};
        }
      `}</style>

            <textarea
                ref={textareaRef}
                className={`void-input ${errorShake ? 'animate-shake' : ''}`}
                placeholder="Write it down. Let it go..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                rows={1}
                spellCheck={false}
            />

            <div className="controls">
                <button className="btn-action btn-danger" onClick={handleBurn}>
                    {status === 'BURNING' ? '🔥 Burning...' : 'Burn it'}
                </button>
                <button className="btn-action" onClick={handleSend}>
                    {status === 'SENDING' ? '🕊️ Sending...' : 'Send to Void'}
                </button>
            </div>
        </div>
    );
}
