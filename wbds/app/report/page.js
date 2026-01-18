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

    useEffect(() => {
        // Collect automated info on mount
        setMetaData({
            userAgent: navigator.userAgent,
            screenSize: `${window.innerWidth}x${window.innerHeight}`,
            currentUrl: window.location.href // Captures referrer/origin implicitly
        });
    }, []);

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
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
            <div className="report-container">
                <div className="header">
                    <h1>Report an Issue</h1>
                    <p>Help us improve the void. Found a bug? Have a suggestion?</p>
                </div>

                {status === 'success' ? (
                    <div className="success-message">
                        <h2>Signal Received.</h2>
                        <p>Your report has been logged. Thank you for your contribution.</p>
                        <p className="redirect-text">Returning to the void...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="report-form">

                        <div className="form-group full">
                            <label>Issue Type</label>
                            <select name="type" value={formData.type} onChange={handleChange}>
                                <option value="Bug">Bug Report</option>
                                <option value="Feature">Feature Request</option>
                                <option value="Security">Security Vulnerability</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Name (Optional)</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Traveler Name"
                                />
                            </div>
                            <div className="form-group">
                                <label>Email (Optional)</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="contact@email.com"
                                />
                            </div>
                        </div>

                        <div className="form-group full">
                            <label>Description <span className="req">*</span></label>
                            <textarea
                                name="description"
                                required
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="What happened? What did you expect?"
                                rows={5}
                            />
                        </div>

                        {formData.type === 'Bug' && (
                            <div className="form-group full">
                                <label>Steps to Reproduce</label>
                                <textarea
                                    name="steps"
                                    value={formData.steps}
                                    onChange={handleChange}
                                    placeholder="1. Go to homepage&#10;2. Click button..."
                                    rows={3}
                                />
                            </div>
                        )}

                        <div className="form-actions">
                            <Link href="/">
                                <button type="button" className="btn-cancel">Cancel</button>
                            </Link>
                            <button
                                type="submit"
                                className="btn-submit"
                                disabled={status === 'submitting'}
                            >
                                {status === 'submitting' ? 'Transmitting...' : 'Submit Report'}
                            </button>
                        </div>

                        {status === 'error' && (
                            <p className="error-msg">Transmission failed. Please try again.</p>
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
                    font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif;
                    position: fixed;
                    top: 0;
                    left: 0;
                    z-index: 9999;
                    overflow-y: auto;
                }

                .report-container {
                    width: 100%;
                    max-width: 600px;
                    background: #0a0a0a;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    padding: 40px;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
                }

                .header {
                    margin-bottom: 30px;
                    text-align: center;
                }

                .header h1 {
                    font-size: 24px;
                    font-weight: 700;
                    margin: 0 0 10px 0;
                    color: #fff;
                }

                .header p {
                    color: #8e8e93;
                    font-size: 14px;
                }

                .report-form {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .form-row {
                    display: flex;
                    gap: 20px;
                }
                
                @media (max-width: 600px) {
                    .form-row { flex-direction: column; gap: 20px; }
                    .report-container { padding: 24px; }
                }

                .form-group {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                label {
                    font-size: 12px;
                    font-weight: 600;
                    color: #8e8e93;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .req { color: #ff453a; }

                input, select, textarea {
                    background: #111;
                    border: 1px solid #333;
                    border-radius: 8px;
                    padding: 12px;
                    color: #f2f2f7;
                    font-family: inherit;
                    font-size: 14px;
                    transition: border-color 0.2s;
                    outline: none;
                }

                input:focus, select:focus, textarea:focus {
                    border-color: #555;
                }

                .form-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    margin-top: 10px;
                }

                button {
                    padding: 12px 24px;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-cancel {
                    background: transparent;
                    border: 1px solid #333;
                    color: #8e8e93;
                }
                .btn-cancel:hover { border-color: #555; color: #fff; }

                .btn-submit {
                    background: #fff;
                    border: none;
                    color: #000;
                }
                .btn-submit:hover { background: #e0e0e0; }
                .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }

                .success-message {
                    text-align: center;
                    padding: 40px 0;
                    animation: fadeIn 0.5s ease;
                }

                .success-message h2 { color: #30d158; margin-bottom: 16px; }
                .redirect-text { font-size: 12px; color: #555; margin-top: 20px; }
                .error-msg { color: #ff453a; font-size: 13px; text-align: center; }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
