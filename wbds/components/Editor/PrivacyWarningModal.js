'use client';

export default function PrivacyWarningModal({ isOpen, onClose, onConfirm, risks, warnings }) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <style jsx>{`
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(0, 0, 0, 0.7);
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
                    background: #1a0505; /* Dark Red tint */
                    border: 1px solid var(--accent-danger, #ff453a);
                    padding: 30px;
                    border-radius: 20px;
                    width: 90%;
                    max-width: 450px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 30px rgba(255, 69, 58, 0.1);
                    transform: scale(1);
                    transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }

                h2 {
                    margin: 0 0 16px 0;
                    font-size: 22px;
                    color: var(--accent-danger, #ff453a);
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .icon {
                    font-size: 28px;
                }

                .content {
                    color: var(--text-primary, #eee);
                    font-size: 15px;
                    line-height: 1.6;
                    margin-bottom: 24px;
                }

                .risk-list {
                    background: rgba(255, 69, 58, 0.1);
                    border-radius: 12px;
                    padding: 16px;
                    margin: 16px 0;
                    font-size: 14px;
                }

                .risk-item {
                    color: #ff9a9e;
                    margin-bottom: 8px;
                    display: flex;
                    gap: 8px;
                }
                .risk-item:last-child { margin-bottom: 0; }
                
                .risk-icon { font-weight: bold; }

                .actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                }

                .btn {
                    padding: 12px 24px;
                    border-radius: 50px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border: none;
                }

                .btn-edit {
                    background: transparent;
                    border: 1px solid var(--text-secondary, #888);
                    color: var(--text-primary, #fff);
                }
                .btn-edit:hover {
                    background: rgba(255,255,255,0.1);
                    border-color: #fff;
                }

                .btn-confirm {
                    background: var(--accent-danger, #ff453a);
                    color: white;
                    box-shadow: 0 4px 12px rgba(255, 69, 58, 0.3);
                }

                .btn-confirm:hover {
                    box-shadow: 0 6px 16px rgba(255, 69, 58, 0.5);
                    transform: scale(1.05);
                }
            `}</style>

            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <h2><span className="icon">⚠️</span> Privacy Warning</h2>

                <div className="content">
                    <p>This letter contains information that might identify you or others permanently.</p>

                    {(risks.length > 0 || warnings.length > 0) && (
                        <div className="risk-list">
                            {risks.map((r, i) => (
                                <div key={`r-${i}`} className="risk-item">
                                    <span className="risk-icon">🚨</span>
                                    <span>Detected: {r}</span>
                                </div>
                            ))}
                            {warnings.map((w, i) => (
                                <div key={`w-${i}`} className="risk-item">
                                    <span className="risk-icon">⚠️</span>
                                    <span>Potential: {w === 'POTENTIAL_NAME' ? 'Real Name' : w}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <p><strong>Once sent, it cannot be edited or deleted by you (unless you are the author, but others may have already seen it).</strong></p>
                    <p>Are you absolutely sure you want to release this into the void?</p>
                </div>

                <div className="actions">
                    <button className="btn btn-edit" onClick={onClose}>Back to Edit</button>
                    <button className="btn btn-confirm" onClick={onConfirm}>I Understand, Send It</button>
                </div>
            </div>
        </div>
    );
}
