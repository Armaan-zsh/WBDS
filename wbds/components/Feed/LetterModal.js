'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

export default function LetterModal({ letter, onClose }) {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        requestAnimationFrame(() => setIsOpen(true));
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        setTimeout(onClose, 300);
    };

    if (!letter) return null;

    return (
        <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={handleClose}>
            <style jsx>{`
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0,0,0,0.4);
            backdrop-filter: blur(0px);
            -webkit-backdrop-filter: blur(0px);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: all 0.4s ease;
            cursor: pointer;
        }

        .modal-overlay.open {
            opacity: 1;
            backdrop-filter: blur(20px) saturate(180%);
            -webkit-backdrop-filter: blur(20px) saturate(180%);
            background: rgba(0,0,0,0.6);
        }

        .modal-content {
            background: var(--bg-surface);
            width: 90%;
            max-width: 500px;
            padding: 40px;
            border-radius: 24px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            transform: scale(0.95);
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            cursor: default;
            color: var(--text-primary);
            font-family: var(--font-current);
            position: relative;
            border: 1px solid var(--glass-border);
            max-height: 80vh;
            overflow-y: auto;
            scrollbar-width: none;
        }

        .modal-content::-webkit-scrollbar {
             display: none;
        }

        .modal-overlay.open .modal-content {
            transform: scale(1);
        }

        .paper-texture {
            font-size: 20px;
            line-height: 1.8;
        }

        /* Markdown Styles */
        .paper-texture :global(p) { margin: 0 0 20px 0; }
        .paper-texture :global(strong) { font-weight: bold; color: var(--text-primary); }
        .paper-texture :global(em) { font-style: italic; opacity: 0.8; }
        .paper-texture :global(blockquote) { 
            border-left: 3px solid var(--text-secondary); 
            padding-left: 20px; 
            margin: 20px 0;
            opacity: 0.7; 
        }

        .signature {
            margin-top: 40px;
            text-align: right;
            font-style: italic;
            font-size: 16px;
            color: var(--text-secondary);
            font-family: 'Snell Roundhand', 'Cursive', serif;
            opacity: 0.7;
        }
       `}</style>

            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="paper-texture">
                    <ReactMarkdown>{letter.content}</ReactMarkdown>
                </div>
                <div className="signature">
                    - Anonymous
                </div>
            </div>
        </div>
    );
}
