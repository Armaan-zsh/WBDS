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
            backdrop-filter: blur(0px); /* Animate to 20px */
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
            background: #fff; /* Paper color */
            width: 90%;
            max-width: 500px;
            padding: 40px;
            border-radius: 4px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            transform: scale(0.95);
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            cursor: default;
            color: #111; /* Deep black ink */
            font-family: 'Charter', 'Georgia', serif;
            position: relative;
        }

        .modal-overlay.open .modal-content {
            transform: scale(1);
        }

        .paper-texture {
            font-size: 20px;
            line-height: 1.8;
            white-space: pre-wrap;
        }

        .signature {
            margin-top: 40px;
            text-align: right;
            font-style: italic;
            font-size: 16px;
            color: #555;
            font-family: 'Snell Roundhand', 'Cursive', serif;
        }
       `}</style>

            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="paper-texture">
                    {letter.content}
                </div>
                <div className="signature">
                    - Anonymous
                </div>
            </div>
        </div>
    );
}
