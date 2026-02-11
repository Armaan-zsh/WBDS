'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '../../../lib/supabase';

export default function AdminReports() {
    const [password, setPassword] = useState('');
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('letters'); // 'letters' or 'feedback'

    // Use environment variable for admin access
    const ADMIN_SECRET = (process.env.NEXT_PUBLIC_ADMIN_SECRET || 'wbds-admin').trim();

    const fetchReports = useCallback(async () => {
        const supabase = getSupabase();
        if (!supabase) {
            console.error("Supabase client not initialized.");
            setLoading(false);
            return;
        }

        setLoading(true);
        const table = activeTab === 'letters' ? 'letter_reports' : 'feedback';

        let query = supabase.from(table).select('*').order('created_at', { ascending: false });

        // If letter reports, join with letters to see content
        if (activeTab === 'letters') {
            query = supabase
                .from('letter_reports')
                .select(`
                    *,
                    letters (
                        content,
                        ip_address
                    )
                `)
                .order('created_at', { ascending: false });
        }

        const { data, error } = await query;

        if (error) {
            console.error(`Error fetching ${activeTab} reports:`, error);
        } else {
            setReports(data || []);
        }
        setLoading(false);
    }, [activeTab]);

    useEffect(() => {
        if (isUnlocked) {
            fetchReports();
        }
    }, [isUnlocked, fetchReports]);

    const handleUnlock = (e) => {
        e.preventDefault();
        if (password.trim() === ADMIN_SECRET) {
            setIsUnlocked(true);
        } else {
            alert('Access Denied');
        }
    };

    const handleAction = async (action, report) => {
        const confirmMsg = `Are you sure you want to ${action.replace('_', ' ')}?`;
        if (!window.confirm(confirmMsg)) return;

        try {
            const res = await fetch('/api/admin/actions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${ADMIN_SECRET}`
                },
                body: JSON.stringify({
                    action,
                    report_id: report.id,
                    letter_id: report.letter_id,
                    target_ip: report.letters?.ip_address || report.reporter_ip,
                    notes: `Action taken via admin dashboard: ${action}`
                })
            });

            const result = await res.json();

            if (result.success) {
                // Optimistic refresh
                fetchReports();
            } else {
                alert(`Action failed: ${result.error}`);
            }
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    if (!isUnlocked) {
        return (
            <div className="admin-lock">
                <form onSubmit={handleUnlock} className="lock-form">
                    <h1>Restricted Area</h1>
                    <div className="input-group">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter Admin Secret"
                            autoFocus
                        />
                        <button type="submit">Unlock</button>
                    </div>
                    {process.env.NEXT_PUBLIC_ADMIN_SECRET ? (
                        <div className="hint-container">
                            <span className="hint">✅ Secure Environment Detected</span>
                        </div>
                    ) : (
                        <div className="hint-container">
                            <span className="hint">⚠️ Using Default Secret</span>
                        </div>
                    )}
                </form>
                <style jsx>{`
                    .admin-lock {
                        height: 100vh;
                        width: 100vw;
                        background: #050505;
                        color: #fff;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        font-family: 'Inter', -apple-system, sans-serif;
                    }
                    .lock-form {
                        display: flex;
                        flex-direction: column;
                        gap: 24px;
                        text-align: center;
                        background: rgba(255, 255, 255, 0.02);
                        padding: 40px;
                        border-radius: 20px;
                        border: 1px solid rgba(255, 255, 255, 0.05);
                    }
                    h1 { font-weight: 300; letter-spacing: 2px; margin-bottom: 20px; }
                    .input-group { display: flex; gap: 10px; }
                    input {
                        padding: 12px 20px;
                        border-radius: 8px;
                        border: 1px solid #333;
                        background: #111;
                        color: #fff;
                        outline: none;
                        transition: border-color 0.2s;
                    }
                    input:focus { border-color: #555; }
                    button {
                        padding: 12px 24px;
                        background: #fff;
                        color: #000;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 600;
                    }
                    .hint-container {
                        margin-top: 20px;
                        display: flex;
                        justify-content: center;
                    }
                    .hint {
                        font-size: 11px;
                        color: #444;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <header>
                <div className="brand">
                    <h1>WBDS Control Center</h1>
                    <div className="tabs">
                        <button
                            className={activeTab === 'letters' ? 'active' : ''}
                            onClick={() => setActiveTab('letters')}
                        >
                            Letter Reports
                        </button>
                        <button
                            className={activeTab === 'feedback' ? 'active' : ''}
                            onClick={() => setActiveTab('feedback')}
                        >
                            Feedback
                        </button>
                    </div>
                </div>
                <button onClick={fetchReports} className="refresh-btn">Refresh Feed</button>
            </header>

            {loading ? (
                <div className="loading">Scanning void for transmissions...</div>
            ) : (
                <div className="content-area">
                    {activeTab === 'letters' ? (
                        <div className="reports-grid">
                            {reports.length === 0 ? (
                                <div className="empty">The void is silent. No reports found.</div>
                            ) : (
                                reports.map(report => (
                                    <div key={report.id} className={`report-card ${report.status}`}>
                                        <div className="card-header">
                                            <span className={`status-badge ${report.status}`}>{report.status}</span>
                                            <span className="reason-badge">{report.reason}</span>
                                            {report.toxicity_score && (
                                                <span className={`toxicity-badge ${report.toxicity_score > 0.7 ? 'high' : 'low'}`}>
                                                    Tox: {(report.toxicity_score * 100).toFixed(0)}%
                                                </span>
                                            )}
                                            <span className="timestamp">{new Date(report.created_at).toLocaleString()}</span>
                                        </div>

                                        <div className="letter-preview">
                                            <p>{report.letters?.content || "Letter content missing or deleted"}</p>
                                        </div>

                                        {report.description && (
                                            <div className="user-note">
                                                <strong>Reporter Note:</strong> {report.description}
                                            </div>
                                        )}

                                        <div className="card-footer">
                                            <div className="meta-info">
                                                <span>IP: {report.letters?.ip_address || report.reporter_ip}</span>
                                            </div>
                                            <div className="actions">
                                                {report.status === 'pending' && (
                                                    <>
                                                        <button className="btn-dismiss" onClick={() => handleAction('dismiss', report)}>Dismiss</button>
                                                        <button className="btn-ban" onClick={() => handleAction('ban_ip', report)}>Ban IP</button>
                                                        <button className="btn-delete" onClick={() => handleAction('delete_letter', report)}>Delete Letter</button>
                                                    </>
                                                )}
                                                {report.status !== 'pending' && (
                                                    <span className="action-taken">Resolved: {report.action_taken}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="feedback-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Type</th>
                                        <th>Description</th>
                                        <th>Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.map(f => (
                                        <tr key={f.id}>
                                            <td>{new Date(f.created_at).toLocaleDateString()}</td>
                                            <td><span className={`tag ${f.type.toLowerCase()}`}>{f.type}</span></td>
                                            <td>{f.description}</td>
                                            <td>{f.email || 'Anonymous'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            <style jsx>{`
                .admin-dashboard {
                    min-height: 100vh;
                    background: #0a0a0b;
                    color: #e2e2e7;
                    font-family: 'Inter', -apple-system, sans-serif;
                    padding: 40px;
                }

                header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    margin-bottom: 40px;
                    border-bottom: 1px solid #1c1c1e;
                    padding-bottom: 24px;
                }

                .brand h1 { margin: 0 0 16px 0; font-weight: 300; font-size: 24px; }
                .tabs { display: flex; gap: 8px; }
                .tabs button {
                    background: transparent;
                    color: #8e8e93;
                    border: 1px solid #2c2c2e;
                    padding: 8px 16px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.2s;
                }
                .tabs button.active {
                    background: #1c1c1e;
                    color: #fff;
                    border-color: #444;
                }

                .refresh-btn {
                    background: #2c2c2e;
                    color: #fff;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                }

                .reports-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
                    gap: 24px;
                }

                .report-card {
                    background: #1c1c1e;
                    border-radius: 12px;
                    border: 1px solid #2c2c2e;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .card-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    flex-wrap: wrap;
                }

                .status-badge {
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-size: 10px;
                    font-weight: 800;
                    text-transform: uppercase;
                }
                .status-badge.pending { background: #ff9f0a; color: #000; }
                .status-badge.dismissed { background: #333; color: #8e8e93; }
                .status-badge.resolved { background: #30d158; color: #000; }

                .reason-badge {
                    background: #2c2c2e;
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-size: 10px;
                    font-weight: 600;
                    color: #d1d1d6;
                }

                .toxicity-badge {
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-size: 10px;
                    font-weight: 800;
                }
                .toxicity-badge.high { background: rgba(255, 69, 58, 0.2); color: #ff453a; }
                .toxicity-badge.low { background: rgba(48, 209, 88, 0.2); color: #30d158; }

                .timestamp { font-size: 11px; color: #636366; margin-left: auto; }

                .letter-preview {
                    background: #000;
                    padding: 16px;
                    border-radius: 8px;
                    font-family: serif;
                    line-height: 1.5;
                    font-size: 14px;
                    max-height: 150px;
                    overflow-y: auto;
                    border: 1px solid #111;
                }

                .user-note {
                    font-size: 13px;
                    color: #a1a1a6;
                    background: #2c2c2e;
                    padding: 10px;
                    border-radius: 6px;
                }

                .card-footer {
                    margin-top: auto;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-top: 16px;
                    border-top: 1px solid #2c2c2e;
                }

                .meta-info { font-family: monospace; font-size: 11px; color: #636366; }

                .actions { display: flex; gap: 8px; }
                .actions button {
                    padding: 6px 12px;
                    border-radius: 6px;
                    border: none;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: opacity 0.2s;
                }
                .actions button:hover { opacity: 0.8; }
                .btn-dismiss { background: #333; color: #fff; }
                .btn-ban { background: #ff9f0a; color: #000; }
                .btn-delete { background: #ff453a; color: #fff; }
                .action-taken { font-size: 12px; color: #8e8e93; font-style: italic; }

                .feedback-table table { width: 100%; border-collapse: collapse; }
                .feedback-table th { text-align: left; padding: 12px; border-bottom: 2px solid #2c2c2e; font-size: 12px; color: #8e8e93; }
                .feedback-table td { padding: 12px; border-bottom: 1px solid #1c1c1e; font-size: 14px; }
                .tag { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 800; }
                .tag.bug { background: #ff453a; color: #fff; }
            `}</style>
        </div>
    );
}

