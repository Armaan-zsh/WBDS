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
            <div className="report-container">
                <div className="header">
                    <h1>Report an Issue</h1>
                    <p>Help us improve the void. Found a bug? Have a suggestion?</p>
                </div>

                {isRateLimited ? (
                    <div className="limit-message">
                        <h2>Transmission Cooldown</h2>
                        <p>You can only send one report every 10 days to prevent frequency jamming.</p>
                        <Link href="/">
                            <button className="btn-back">Return to Void</button>
                        </Link>
                    </div>
                ) : status === 'success' ? (
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
                    padding: 20px;
                    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
                    position: fixed;
                    top: 0;
                    left: 0;
                    z-index: 9999;
                    overflow-y: auto;
                    -webkit-font-smoothing: antialiased;
                }

                .report-container {
                    width: 100%;
                    max-width: 500px; /* Maximum width similar to iOS modal */
                    background: rgba(28, 28, 30, 0.6); /* iOS System Material Dark */
                    backdrop-filter: blur(25px) saturate(180%);
                    -webkit-backdrop-filter: blur(25px) saturate(180%);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 32px; /* Large rounded corners */
                    padding: 32px;
                    box-shadow: 
                        0 20px 60px rgba(0,0,0,0.5),
                        0 0 0 1px rgba(0,0,0,0.5); /* Inner border shadow */
                    animation: springUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                    transform-origin: center bottom;
                }

                .header {
                    margin-bottom: 32px;
                    text-align: center;
                }

                .header h1 {
                    font-size: 22px;
                    font-weight: 700;
                    margin: 0 0 8px 0;
                    color: #fff;
                    letter-spacing: -0.5px;
                }

                .header p {
                    color: #8e8e93; /* iOS Secondary Label Color */
                    font-size: 15px;
                    line-height: 1.4;
                }

                .report-form {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .form-row {
                    display: flex;
                    gap: 16px;
                }
                
                @media (max-width: 600px) {
                    .form-row { flex-direction: column; gap: 16px; }
                    .report-container { 
                        padding: 24px; 
                        border-radius: 24px;
                        max-width: 100%;
                    }
                }

                .form-group {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                label {
                    font-size: 13px;
                    font-weight: 600;
                    color: #8e8e93;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-left: 4px; /* Align with input curve */
                }

                .req { color: #ff453a; }

                input, select, textarea {
                    background: rgba(118, 118, 128, 0.24); /* iOS Fill Color */
                    border: none;
                    border-radius: 12px;
                    padding: 14px 16px;
                    color: #fff;
                    font-family: inherit;
                    font-size: 17px; /* iOS Body size */
                    transition: all 0.2s cubic-bezier(0.25, 0.1, 0.25, 1);
                    outline: none;
                    width: 100%;
                    box-sizing: border-box;
                    -webkit-appearance: none;
                }

                input:focus, select:focus, textarea:focus {
                    background: rgba(118, 118, 128, 0.36);
                    box-shadow: 0 0 0 2px #0a84ff; /* iOS Blue Focus */
                }

                /* Custom Select Arrow */
                select {
                    background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%238e8e93%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E');
                    background-repeat: no-repeat;
                    background-position: right 16px top 50%;
                    background-size: 12px auto;
                    padding-right: 40px;
                }

                .form-actions {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 16px;
                    margin-top: 12px;
                }

                button {
                    padding: 14px 28px;
                    border-radius: 100px; /* Pill shape */
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: transform 0.1s;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                button:active {
                    transform: scale(0.96);
                }

                .btn-cancel {
                    background: transparent;
                    color: #8e8e93;
                    font-weight: 500;
                }
                .btn-cancel:hover { color: #fff; }

                .btn-submit {
                    background: #fff;
                    color: #000;
                    flex: 1;
                    max-width: 200px;
                    box-shadow: 0 4px 12px rgba(255,255,255,0.15);
                }
                .btn-submit:hover { 
                    background: #f2f2f7; 
                    box-shadow: 0 6px 16px rgba(255,255,255,0.2);
                }
                .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }

                .success-message {
                    text-align: center;
                    padding: 60px 0;
                    animation: fadeIn 0.4s ease;
                }

                .success-message h2 { 
                    color: #30d158; 
                    margin-bottom: 16px; 
                    font-size: 24px;
                }
                .redirect-text { font-size: 13px; color: #8e8e93; margin-top: 24px; }
                .error-msg { color: #ff453a; font-size: 14px; text-align: center; margin-top: 10px; }

                @keyframes springUp {
                    from { 
                        opacity: 0; 
                        transform: translateY(40px) scale(0.95); 
                    }
                    to { 
                        opacity: 1; 
                        transform: translateY(0) scale(1); 
                    }
                }

                .limit-message {
                    text-align: center;
                    padding: 40px 0;
                    animation: fadeIn 0.4s ease;
                }
                .limit-message h2 {
                    color: #ff9f0a; /* iOS Orange */
                    margin-bottom: 16px;
                    font-size: 22px;
                }
                .limit-message p {
                    color: #8e8e93;
                    margin-bottom: 30px;
                    line-height: 1.5;
                }
                .btn-back {
                    background: rgba(255,255,255,0.1);
                    color: #fff;
                    margin: 0 auto;
                }
                .btn-back:hover {
                    background: rgba(255,255,255,0.2);
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    );
}
