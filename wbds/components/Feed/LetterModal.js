'use client';

import { useEffect, useState } from 'react';

export default function LetterModal({ letter, onClose }) {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        requestAnimationFrame(() => setIsOpen(true));
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        setTimeout(onClose, 300);
    };

    import ReactMarkdown from 'react-markdown';

    // ... (props)

    return (
        <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={handleClose}>
            <style jsx>{`
             /* ... existing styles ... */
            .paper-texture {
                font-size: 20px;
                line-height: 1.8;
            }
            /* Markdown Styles */
            .paper-texture :global(strong) { font-weight: bold; color: var(--text-primary); }
            .paper-texture :global(em) { font-style: italic; opacity: 0.8; }
            .paper-texture :global(p) { margin-bottom: 20px; }
            .paper-texture :global(blockquote) { 
                border-left: 3px solid var(--text-secondary); 
                padding-left: 20px; 
                opacity: 0.7; 
            }
        `}</style>

            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="paper-texture">
                    <ReactMarkdown>{letter.content}</ReactMarkdown>
                </div>
                {/* ... signature ... */}
            </div>
        </div>
    );
}
