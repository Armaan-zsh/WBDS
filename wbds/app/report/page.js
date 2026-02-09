'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ReportPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        type: 'Bug',
        name: '',
        email: '',
        description: '',
        steps: ''
    });
    const [status, setStatus] = useState('idle'); // idle, submitting, success, error
    const [metaData, setMetaData] = useState({});

    const [isRateLimited, setIsRateLimited] = useState(false);

    useEffect(() => {
        // Collect automated info on mount
        setMetaData({
            userAgent: navigator.userAgent,
            screenSize: `${window.innerWidth}x${window.innerHeight}`,
            currentUrl: window.location.href
        });

        // Check Rate Limit (10 days = 864000000 ms)
        const lastReport = localStorage.getItem('wbds_last_report');
        if (lastReport) {
            const timeDiff = Date.now() - parseInt(lastReport);
            if (timeDiff < 864000000) {
                setIsRateLimited(true);
            }
        }
    }, []);

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isRateLimited) return;
        setStatus('submitting');

        try {
            const res = await fetch('/api/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    ...metaData
                })
            });

            if (res.ok) {
                // Set Rate Limit
                localStorage.setItem('wbds_last_report', Date.now().toString());
                setStatus('success');
                setTimeout(() => {
                    router.push('/');
                }, 3000);
            } else {
                setStatus('error');
            }
        } catch (err) {
            console.error(err);
            setStatus('error');
        }
    };

    return (
        <div className="report-page">
            <div className="void-background">
                <div className="void-glow g1" />
                <div className="void-glow g2" />
            </div>

            <div className="report-container">
                <div className="header">
                    <span className="system-tag">SYSTEM // REPORT_BUG</span>
                    <h1>Transmit Feedback</h1>
                    <p>Encountered a glitch in the void? Log your findings below.</p>
                </div>

                {isRateLimited ? (
                    <div className="limit-message">
                        <div className="warning-icon">⚠️</div>
                        <h2>COOLDOWN ACTIVE</h2>
                        <p>To prevent signal interference, only one transmission is allowed every 10 days.</p>
                        <Link href="/">
                            <button className="btn-back">RETURN TO SOURCE</button>
                        </Link>
                    </div>
                ) : status === 'success' ? (
                    <div className="success-message">
                        <div className="success-icon">✓</div>
                        <h2>SIGNAL RECEIVED</h2>
                        <p>Your data has been successfully logged into the void manifest.</p>
                        <div className="loading-bar">
                            <div className="loading-fill" />
                        </div>
                        <p className="redirect-text">Returning to origin...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="report-form">

                        <div className="form-group full">
                            <label>ENQUIRY TYPE</label>
                            <select name="type" value={formData.type} onChange={handleChange}>
                                <option value="Bug">GLITCH / BUG</option>
                                <option value="Feature">EVOLUTION REQUEST</option>
                                <option value="Security">VULNERABILITY</option>
                                <option value="Other">MISC FREQUENCY</option>
                            </select>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>TRAVELER NAME (OPTIONAL)</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Anonymous"
                                />
                            </div>
                            <div className="form-group">
                                <label>RETURN FREQUENCY (OPTIONAL)</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="contact@void.net"
                                />
                            </div>
                        </div>

                        <div className="form-group full">
                            <label>DESCRIPTION <span className="req">*</span></label>
                            <textarea
                                name="description"
                                required
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Describe the anomaly..."
                                rows={5}
                            />
                        </div>

                        {formData.type === 'Bug' && (
                            <div className="form-group full">
                                <label>REPLICATION STEPS</label>
                                <textarea
                                    name="steps"
                                    value={formData.steps}
                                    onChange={handleChange}
                                    placeholder="1. Navigate to...&#10;2. Interact with..."
                                    rows={3}
                                />
                            </div>
                        )}

                        <div className="form-actions">
                            <Link href="/">
                                <button type="button" className="btn-cancel">ABORT</button>
                            </Link>
                            <button
                                type="submit"
                                className="btn-submit"
                                disabled={status === 'submitting'}
                            >
                                {status === 'submitting' ? 'TRANSMITTING...' : 'TRANSMIT SIGNAL'}
                            </button>
                        </div>

                        {status === 'error' && (
                            <p className="error-msg">CONNECTION LOST. RETRY TRANSMISSION.</p>
                        )}
                    </form>
                )}
            </div>

            <style jsx>{`
                .report-page {
                    min-height: 100vh;
                    width: 100vw;
                    background: #000000;
                    color: #fff;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 40px 20px;
                    font-family: 'Inter', -apple-system, sans-serif;
                    position: relative;
                    overflow-x: hidden;
                    box-sizing: border-box;
                }

                .void-background {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    z-index: 1;
                    overflow: hidden;
                }

                .void-glow {
                    position: absolute;
                    width: 600px;
                    height: 600px;
                    border-radius: 50%;
                    filter: blur(120px);
                    opacity: 0.15;
                    pointer-events: none;
                }

                .g1 { top: -200px; right: -100px; background: #3aedff; animation: float 15s infinite alternate; }
                .g2 { bottom: -200px; left: -100px; background: #7000ff; animation: float 18s infinite alternate-reverse; }

                @keyframes float {
                    from { transform: translate(0, 0); }
                    to { transform: translate(100px, 50px); }
                }

                .report-container {
                    width: 100%;
                    max-width: 600px;
                    background: rgba(10, 10, 10, 0.4);
                    backdrop-filter: blur(40px) saturate(180%);
                    -webkit-backdrop-filter: blur(40px) saturate(180%);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 40px;
                    padding: 48px;
                    box-shadow: 0 40px 100px rgba(0, 0, 0, 0.8);
                    position: relative;
                    z-index: 2;
                    animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
                }

                .system-tag {
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 10px;
                    color: rgba(255, 255, 255, 0.3);
                    letter-spacing: 4px;
                    margin-bottom: 12px;
                    display: block;
                }

                .header { margin-bottom: 40px; text-align: left; }
                .header h1 {
                    font-size: 36px;
                    font-weight: 800;
                    margin: 0 0 12px 0;
                    letter-spacing: -1.5px;
                    background: linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.5) 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .header p { color: rgba(255, 255, 255, 0.5); font-size: 16px; line-height: 1.5; }

                .report-form { display: flex; flex-direction: column; gap: 28px; }
                .form-row { display: flex; gap: 20px; }
                .form-group { flex: 1; display: flex; flex-direction: column; gap: 10px; }

                label {
                    font-size: 11px;
                    font-weight: 700;
                    color: rgba(255, 255, 255, 0.4);
                    letter-spacing: 1.5px;
                    margin-left: 2px;
                }

                input, select, textarea {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 16px;
                    padding: 16px 20px;
                    color: #fff;
                    font-size: 15px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    outline: none;
                }

                input:focus, select:focus, textarea:focus {
                    background: rgba(255, 255, 255, 0.06);
                    border-color: rgba(255, 255, 255, 0.3);
                    box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.05);
                }

                select {
                    -webkit-appearance: none;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 20px center;
                    background-size: 16px;
                    padding-right: 50px;
                }

                .form-actions { display: flex; gap: 20px; align-items: center; margin-top: 10px; }

                .btn-cancel {
                    background: transparent;
                    color: rgba(255, 255, 255, 0.4);
                    padding: 18px 32px;
                    font-size: 13px;
                    font-weight: 700;
                    letter-spacing: 2px;
                    border-radius: 20px;
                    transition: all 0.3s;
                }
                .btn-cancel:hover { color: #fff; background: rgba(255, 255, 255, 0.05); }

                .btn-submit {
                    flex: 2;
                    background: #fff;
                    color: #000;
                    padding: 18px 32px;
                    font-size: 13px;
                    font-weight: 800;
                    letter-spacing: 2px;
                    border-radius: 20px;
                    box-shadow: 0 8px 25px rgba(255, 255, 255, 0.2);
                }
                .btn-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 35px rgba(255, 255, 255, 0.3); }
                .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }

                .success-message, .limit-message {
                    text-align: center;
                    padding: 40px 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 20px;
                }

                .success-icon, .warning-icon {
                    width: 64px;
                    height: 64px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    margin-bottom: 10px;
                }

                .success-icon { color: #30d158; box-shadow: 0 0 30px rgba(48, 209, 88, 0.2); }
                .warning-icon { color: #ff9f0a; box-shadow: 0 0 30px rgba(255, 159, 10, 0.2); }

                .loading-bar { width: 100%; height: 4px; background: rgba(255,255,255,0.05); border-radius: 2px; overflow: hidden; }
                .loading-fill { width: 100%; height: 100%; background: #fff; animation: loading 3s linear forwards; }

                @keyframes loading { from { transform: translateX(-100%); } to { transform: translateX(0); } }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(30px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }

                @media (max-width: 600px) {
                    .report-container { padding: 32px 24px; border-radius: 30px; }
                    .form-row { flex-direction: column; }
                    .header h1 { font-size: 28px; }
                }
            `}</style>
        </div>
    );
}
