'use client';

import { useState, useEffect } from 'react';

export default function ReportModal({ isOpen, onClose, onSubmit }) {
    const [reason, setReason] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [isShimmying, setIsShimmying] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setReason('');
            setCustomReason('');
        }
    }, [isOpen]);

    const handleSubmit = () => {
        if (!reason) {
            setIsShimmying(true);
            setTimeout(() => setIsShimmying(false), 300);
            return;
        }

        const finalReason = reason === 'other' ? customReason : reason;
        onSubmit(finalReason);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <style jsx>{`
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(8px);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: fadeIn 0.3s ease;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .modal-card {
                    background: var(--bg-surface, #111);
                    border: 1px solid var(--glass-border, rgba(255,255,255,0.1));
                    padding: 30px;
                    border-radius: 20px;
                    width: 90%;
                    max-width: 400px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                    transform: scale(1);
                    transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }

                .shimmy {
                    animation: shimmy 0.3s ease-in-out;
                }

                @keyframes shimmy {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }

                h2 {
                    margin: 0 0 20px 0;
                    font-size: 20px;
                    color: var(--text-primary, #fff);
                    text-align: center;
                }

                .options {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-bottom: 24px;
                }

                .option-btn {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid transparent;
                    padding: 12px 16px;
                    border-radius: 12px;
                    color: var(--text-secondary, #ccc);
                    text-align: left;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-family: inherit;
                    font-size: 14px;
                }

                .option-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: var(--text-primary, #fff);
                }

                .option-btn.selected {
                    background: rgba(255, 69, 58, 0.15);
                    border-color: rgba(255, 69, 58, 0.5);
                    color: #ff453a;
                    font-weight: 600;
                }

                textarea {
                    width: 100%;
                    background: rgba(0,0,0,0.2);
                    border: 1px solid var(--glass-border, rgba(255,255,255,0.1));
                    color: var(--text-primary, #fff);
                    padding: 12px;
                    border-radius: 12px;
                    resize: none;
                    height: 80px;
                    font-family: inherit;
                    box-sizing: border-box;
                    margin-top: -4px;
                    margin-bottom: 24px;
                }
                
                textarea:focus {
                    outline: none;
                    border-color: var(--text-secondary, #888);
                }

                .actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                }

                .btn {
                    padding: 10px 20px;
                    border-radius: 50px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border: none;
                }

                .btn-cancel {
                    background: transparent;
                    color: var(--text-secondary, #ccc);
                }
                .btn-cancel:hover {
                    color: var(--text-primary, #fff);
                    background: rgba(255,255,255,0.05);
                }

                .btn-submit {
                    background: var(--text-primary, #fff);
                    color: #000;
                    opacity: 0.5;
                    pointer-events: none;
                }

                .btn-submit.active {
                    opacity: 1;
                    pointer-events: auto;
                }

                .btn-submit:hover {
                    transform: scale(1.05);
                }
            `}</style>

            <div className={`modal-card ${isShimmying ? 'shimmy' : ''}`} onClick={(e) => e.stopPropagation()}>
                <h2>Report Letter</h2>

                <div className="options">
                    {['Contains personal information', 'Harassment or hate speech', 'Spam or commercial', 'Illegal content'].map((opt) => (
                        <button
                            key={opt}
                            className={`option-btn ${reason === opt ? 'selected' : ''}`}
                            onClick={() => setReason(opt)}
                        >
                            {opt}
                        </button>
                    ))}
                    <button
                        className={`option-btn ${reason === 'other' ? 'selected' : ''}`}
                        onClick={() => setReason('other')}
                    >
                        Other
                    </button>
                </div>

                {reason === 'other' && (
                    <textarea
                        placeholder="Please describe the issue..."
                        value={customReason}
                        onChange={(e) => setCustomReason(e.target.value)}
                        autoFocus
                    />
                )}

                <div className="actions">
                    <button className="btn btn-cancel" onClick={onClose}>Cancel</button>
                    <button
                        className={`btn btn-submit ${(reason && (reason !== 'other' || customReason.trim().length > 0)) ? 'active' : ''}`}
                        onClick={handleSubmit}
                    >
                        Report
                    </button>
                </div>
            </div>
        </div>
    );
}
