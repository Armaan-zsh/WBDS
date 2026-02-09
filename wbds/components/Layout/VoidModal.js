'use client';

import { useState, useEffect, useRef } from 'react';

export default function VoidModal({
    isOpen,
    type = 'alert', // 'alert', 'confirm', 'prompt'
    title,
    message,
    placeholder = "Type here...",
    onConfirm,
    onCancel,
    defaultValue = ""
}) {
    const [inputValue, setInputValue] = useState(defaultValue);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setInputValue(defaultValue);
            if (type === 'prompt') {
                setTimeout(() => inputRef.current?.focus(), 100);
            }
        }
    }, [isOpen, type, defaultValue]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (type === 'prompt') {
            onConfirm(inputValue);
        } else {
            onConfirm();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleConfirm();
        if (e.key === 'Escape') onCancel();
    };

    return (
        <div className="void-modal-overlay" onClick={onCancel}>
            <div className="void-modal-card" onClick={e => e.stopPropagation()}>
                {title && <h3 className="modal-title">{title}</h3>}
                {message && <p className="modal-message">{message}</p>}

                {type === 'prompt' && (
                    <div className="input-wrapper">
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder}
                            className="modal-input"
                            autoComplete="off"
                        />
                    </div>
                )}

                <div className="modal-actions">
                    {(type === 'confirm' || type === 'prompt') && (
                        <button className="btn-cancel" onClick={onCancel}>
                            CANCEL
                        </button>
                    )}
                    <button className="btn-confirm" onClick={handleConfirm}>
                        {type === 'alert' ? 'OK' : 'CONFIRM'}
                    </button>
                </div>
            </div>

            <style jsx>{`
                .void-modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.4);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 99999;
                    animation: fadeIn 0.3s ease;
                }

                .void-modal-card {
                    background: rgba(30, 30, 30, 0.4);
                    backdrop-filter: blur(40px);
                    -webkit-backdrop-filter: blur(40px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 32px;
                    padding: 32px;
                    width: 90%;
                    max-width: 400px;
                    box-shadow: 0 40px 100px rgba(0, 0, 0, 0.5);
                    animation: scaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                    text-align: center;
                }

                .modal-title {
                    margin: 0 0 12px 0;
                    font-size: 18px;
                    font-weight: 600;
                    color: var(--text-primary);
                    letter-spacing: 1px;
                    text-transform: uppercase;
                }

                .modal-message {
                    font-size: 14px;
                    color: var(--text-secondary);
                    margin: 0 0 24px 0;
                    line-height: 1.6;
                }

                .input-wrapper {
                    position: relative;
                    margin-bottom: 24px;
                }

                .modal-input {
                    width: 100%;
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 16px;
                    padding: 14px 20px;
                    color: white;
                    font-size: 15px;
                    outline: none;
                    text-align: center;
                    transition: all 0.3s ease;
                    position: relative;
                    z-index: 2;
                }

                .modal-input:focus {
                    background: rgba(0, 0, 0, 0.4);
                    border-color: rgba(255, 255, 255, 0.15);
                }

                .input-glow {
                    display: none; /* Removed golden glow */
                }

                .modal-actions {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                }

                .btn-confirm, .btn-cancel {
                    padding: 12px 24px;
                    min-width: 120px;
                    border-radius: 99px;
                    font-size: 12px;
                    font-weight: 700;
                    letter-spacing: 1.5px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .btn-confirm {
                    background: var(--text-primary);
                    color: black;
                    border: none;
                }

                .btn-confirm:hover {
                    transform: scale(1.05);
                    box-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
                }

                .btn-cancel {
                    background: transparent;
                    color: var(--text-secondary);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .btn-cancel:hover {
                    background: rgba(255, 255, 255, 0.05);
                    color: var(--text-primary);
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes scaleUp {
                    from { transform: scale(0.95) translateY(10px); opacity: 0; }
                    to { transform: scale(1) translateY(0); opacity: 1; }
                }

                @media (max-width: 480px) {
                    .void-modal-card {
                        padding: 24px;
                    }
                }
            `}</style>
        </div>
    );
}
