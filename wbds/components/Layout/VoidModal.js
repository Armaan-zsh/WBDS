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
                    background: rgba(20, 20, 20, 0.6);
                    backdrop-filter: blur(40px);
                    -webkit-backdrop-filter: blur(40px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 32px;
                    padding: 40px;
                    width: 90%;
                    max-width: 420px;
                    box-shadow: 0 40px 100px rgba(0, 0, 0, 0.6);
                    animation: scaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .modal-title {
                    margin: 0 0 16px 0;
                    font-size: 18px;
                    font-weight: 700;
                    color: white;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                }

                .modal-message {
                    font-size: 14px;
                    color: rgba(255, 255, 255, 0.6);
                    margin: 0 0 32px 0;
                    line-height: 1.6;
                    max-width: 300px;
                }

                .input-wrapper {
                    width: 100%;
                    position: relative;
                    margin-bottom: 32px;
                }

                .modal-input {
                    width: 100%;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    padding: 16px;
                    color: white;
                    font-size: 15px;
                    outline: none;
                    text-align: center;
                    transition: all 0.3s ease;
                    font-family: inherit;
                    box-sizing: border-box;
                }

                .modal-input:focus {
                    background: rgba(255, 255, 255, 0.05);
                    border-color: rgba(255, 255, 255, 0.3);
                    box-shadow: 0 0 20px rgba(255, 255, 255, 0.05);
                }

                .modal-input::placeholder {
                    color: rgba(255, 255, 255, 0.2);
                }

                .modal-actions {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                    width: 100%;
                }

                .btn-confirm, .btn-cancel {
                    flex: 1;
                    max-width: 140px;
                    padding: 14px;
                    border-radius: 99px;
                    font-size: 12px;
                    font-weight: 800;
                    letter-spacing: 1.5px;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    text-transform: uppercase;
                    box-sizing: border-box;
                    white-space: nowrap;
                }

                .btn-confirm {
                    background: white;
                    color: black;
                    border: 1px solid white;
                }

                .btn-confirm:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(255, 255, 255, 0.2);
                }

                .btn-cancel {
                    background: rgba(255, 255, 255, 0.05);
                    color: rgba(255, 255, 255, 0.5);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .btn-cancel:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                    border-color: rgba(255, 255, 255, 0.2);
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes scaleUp {
                    from { transform: scale(0.9) translateY(20px); opacity: 0; }
                    to { transform: scale(1) translateY(0); opacity: 1; }
                }

                @media (max-width: 480px) {
                    .void-modal-card {
                        padding: 32px 24px;
                    }
                    .btn-confirm, .btn-cancel {
                        flex: 1;
                        padding: 12px 8px;
                    }
                }
            `}</style>
        </div>
    );
}
