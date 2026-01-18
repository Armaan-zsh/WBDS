'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client (Client-side)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AdminReports() {
    const [password, setPassword] = useState('');
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);

    // Simple hardcoded secret for now - clear enough for this use case
    const SECRET_CODE = 'wbds-admin';

    const handleUnlock = (e) => {
        e.preventDefault();
        if (password === SECRET_CODE) {
            setIsUnlocked(true);
            fetchReports();
        } else {
            alert('Access Denied');
        }
    };

    const fetchReports = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('feedback')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) console.error('Error fetching reports:', error);
        else setReports(data || []);
        setLoading(false);
    };

    const toggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'resolved' ? 'open' : 'resolved';

        // Optimistic update
        setReports(prev => prev.map(r =>
            r.id === id ? { ...r, status: newStatus } : r
        ));

        const { error } = await supabase
            .from('feedback')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) {
            console.error('Update failed:', error);
            // Revert
            fetchReports();
        }
    };

    if (!isUnlocked) {
        return (
            <div className="admin-lock">
                <form onSubmit={handleUnlock} className="lock-form">
                    <h1>Restricted Area</h1>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter Code"
                        autoFocus
                    />
                    <button type="submit">Unlock</button>
                </form>
                <style jsx>{`
                    .admin-lock {
                        height: 100vh;
                        width: 100vw;
                        background: #000;
                        color: #fff;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        font-family: monospace;
                    }
                    .lock-form {
                        display: flex;
                        flex-direction: column;
                        gap: 20px;
                        text-align: center;
                    }
                    input {
                        padding: 10px;
                        border-radius: 4px;
                        border: 1px solid #333;
                        background: #111;
                        color: #fff;
                        text-align: center;
                    }
                    button {
                        padding: 10px;
                        background: #fff;
                        color: #000;
                        border: none;
                        cursor: pointer;
                        font-weight: bold;
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <header>
                <h1>WBDS Reports</h1>
                <button onClick={fetchReports} className="refresh-btn">Refresh</button>
            </header>

            {loading ? (
                <div className="loading">Loading transmission logs...</div>
            ) : (
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Description</th>
                                <th>Details</th>
                                <th>Meta</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.map(report => (
                                <tr key={report.id} className={report.status}>
                                    <td className="date">
                                        {new Date(report.created_at).toLocaleDateString()}
                                    </td>
                                    <td>
                                        <span className={`tag ${report.type.toLowerCase()}`}>
                                            {report.type}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            className={`status-btn ${report.status}`}
                                            onClick={() => toggleStatus(report.id, report.status)}
                                        >
                                            {report.status}
                                        </button>
                                    </td>
                                    <td className="desc">
                                        <div className="main-desc">{report.description}</div>
                                        {report.steps_to_reproduce && (
                                            <div className="steps">
                                                <strong>Steps:</strong> {report.steps_to_reproduce}
                                            </div>
                                        )}
                                    </td>
                                    <td className="user-details">
                                        {report.name && <div>👤 {report.name}</div>}
                                        {report.email && <div>✉️ {report.email}</div>}
                                    </td>
                                    <td className="meta">
                                        <div title={report.user_agent}>🖥 {report.screen_size}</div>
                                        <div className="url-trunc" title={report.current_url}>🔗 {report.current_url.split('/').pop() || '/'}</div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <style jsx>{`
                .admin-dashboard {
                    min-height: 100vh;
                    background: #111;
                    color: #fff;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                    padding: 40px;
                }

                header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 40px;
                    border-bottom: 1px solid #333;
                    padding-bottom: 20px;
                }

                .refresh-btn {
                    background: #333;
                    color: #fff;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                }

                .table-wrapper {
                    overflow-x: auto;
                    background: #1c1c1e;
                    border-radius: 12px;
                    border: 1px solid #333;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 14px;
                }

                th {
                    text-align: left;
                    padding: 16px;
                    border-bottom: 1px solid #333;
                    color: #8e8e93;
                    font-weight: 600;
                    text-transform: uppercase;
                    font-size: 12px;
                }

                td {
                    padding: 16px;
                    border-bottom: 1px solid #2c2c2e;
                    vertical-align: top;
                }

                tr:last-child td { border-bottom: none; }

                .tag {
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                }
                .tag.bug { background: rgba(255, 69, 58, 0.2); color: #ff453a; }
                .tag.feature { background: rgba(10, 132, 255, 0.2); color: #0a84ff; }
                .tag.security { background: rgba(255, 159, 10, 0.2); color: #ff9f0a; }

                .status-btn {
                    border: none;
                    padding: 4px 12px;
                    border-radius: 100px;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                    cursor: pointer;
                }
                .status-btn.open { background: #30d158; color: #000; }
                .status-btn.resolved { background: #333; color: #8e8e93; }

                .desc { max-width: 400px; }
                .main-desc { margin-bottom: 8px; font-size: 15px; }
                .steps { 
                    background: #2c2c2e; 
                    padding: 8px; 
                    border-radius: 6px; 
                    font-family: monospace; 
                    font-size: 12px;
                    color: #d1d1d6;
                }

                .user-details div { margin-bottom: 4px; font-size: 12px; color: #a1a1a6; }

                .meta { font-family: monospace; font-size: 12px; color: #636366; }
                .url-trunc { 
                    max-width: 100px; 
                    white-space: nowrap; 
                    overflow: hidden; 
                    text-overflow: ellipsis; 
                }
            `}</style>
        </div>
    );
}
