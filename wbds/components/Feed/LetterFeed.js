'use client';
import ReactMarkdown from 'react-markdown';

import { useState, useEffect } from 'react';

export default function LetterFeed({ letters, onOpen, onDelete, myLetterIds, onLike, likedLetters, onReport, viewMode, isAdmin, adminSecret, triggerModal }) {
    const [activeTag, setActiveTag] = useState(null);
    const [pinnedLetters, setPinnedLetters] = useState(new Set());
    const TAGS = ['#Love', '#Hope', '#Regret', '#Anger', '#Grief', '#Joy', '#Fear', '#Void'];

    // --- ADMIN ACTIONS ---
    const handleAdminAction = async (e, action, letterId, ip, fingerprint) => {
        e.stopPropagation();

        triggerModal({
            isOpen: true,
            type: 'confirm',
            title: 'Moderation Action',
            message: `Are you sure you want to ${action === 'burn' ? 'delete this letter forever' : 'shadow-ban this user'}?`,
            onConfirm: async () => {
                try {
                    const res = await fetch('/api/admin/action', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action,
                            letterId,
                            ip,
                            fingerprint,
                            adminSecret
                        })
                    });
                    const data = await res.json();
                    if (data.success) {
                        triggerModal({
                            isOpen: true,
                            type: 'alert',
                            title: 'Success',
                            message: data.message,
                            onConfirm: () => {
                                triggerModal(prev => ({ ...prev, isOpen: false }));
                                window.location.reload();
                            },
                        });
                    } else {
                        triggerModal({
                            isOpen: true,
                            type: 'alert',
                            title: 'Failed',
                            message: data.error || 'Action failed',
                            onConfirm: () => triggerModal(prev => ({ ...prev, isOpen: false })),
                        });
                    }
                } catch (err) {
                    console.error('Admin Action Error:', err);
                }
            },
            onCancel: () => triggerModal(prev => ({ ...prev, isOpen: false }))
        });
    };

    // Load pinned letters from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('wbds_pinned_letters');
            if (saved) {
                try {
                    setPinnedLetters(new Set(JSON.parse(saved)));
                } catch (e) {
                    console.error('Failed to load pinned letters');
                }
            }
        }
    }, []);

    // Toggle pin
    const togglePin = (letterId) => {
        setPinnedLetters(prev => {
            const newPinned = new Set(prev);
            if (newPinned.has(letterId)) {
                newPinned.delete(letterId);
            } else {
                newPinned.add(letterId);
            }
            localStorage.setItem('wbds_pinned_letters', JSON.stringify([...newPinned]));
            return newPinned;
        });
    };

    // Filter by tag (no pin sorting - pins shown in Saved section)
    let sortedLetters = activeTag
        ? letters.filter(l => l.tags && l.tags.includes(activeTag))
        : letters;

    // If in saved view, filter to only pinned letters
    if (viewMode === 'saved') {
        sortedLetters = letters.filter(l => pinnedLetters.has(l.id));
    }

    // Empty state for saved view
    if (viewMode === 'saved' && sortedLetters.length === 0) {
        return (
            <div className="empty-state" style={{ marginTop: 60, textAlign: 'center', opacity: 0.5 }}>
                <p style={{ fontSize: 16, marginBottom: 8 }}>📖 No saved letters yet</p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Click the bookmark icon on any letter to save it here</p>
            </div>
        );
    }

    if (!letters || letters.length === 0) {
        return (
            <div className="empty-state">
                <p></p> {/* Empty state message */}
                <style jsx>{`
          .empty-state {
            text-align: center;
            opacity: 0.3;
            margin-top: 60px;
            font-size: 14px;
          }
        `}</style>
            </div>
        );
    }

    return (
        <div className="feed-container">
            <style jsx>{`
        .feed-container {
          margin-top: 40px;
          padding-bottom: 100px;
          width: 100%;
          box-sizing: border-box;
          padding-left: 16px;
          padding-right: 16px;
        }

        .witness-badge {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
            color: var(--text-secondary);
            opacity: 0.7;
            margin-right: 8px;
        }
        .witness-badge svg {
            width: 16px;
            height: 16px;
        }

        /* FILTER BAR */
        .filter-bar {
            display: flex;
            gap: 12px;
            overflow-x: auto;
            padding-bottom: 20px;
            margin-bottom: 20px;
            scrollbar-width: none; /* Hide scrollbar Firefox */
            -webkit-overflow-scrolling: touch;
        }
        .filter-bar::-webkit-scrollbar { display: none; }

        .filter-pill {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--glass-border);
            color: var(--text-secondary);
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 13px;
            white-space: nowrap;
            cursor: pointer;
            transition: all 0.2s ease;
            font-family: var(--font-current);
        }
        .filter-pill:hover {
            background: rgba(255, 255, 255, 0.1);
            color: var(--text-primary);
        }
        .filter-pill.active {
            background: var(--text-primary);
            color: var(--bg-depth);
            border-color: var(--text-primary);
            font-weight: 600;
        }

        @media (max-width: 768px) {
          .feed-container {
            margin-top: 20px;
            padding-left: 12px;
            padding-right: 12px;
            padding-bottom: 120px;
          }
        }

        .letter-card {
           margin-bottom: 40px;
           opacity: 0;
           animation: fadeIn 0.8s ease forwards;
           cursor: pointer;
           transition: transform 0.2s ease, opacity 0.2s ease;
           position: relative;
           width: 100%;
           box-sizing: border-box;
        }

        @media (max-width: 768px) {
          .letter-card {
            margin-bottom: 24px;
          }
        }

        @media (hover: hover) {
          .letter-card:hover {
            transform: scale(1.02);
            opacity: 0.9;
          }
        }
        
        .letter-content {
           background: var(--bg-surface);
           border-radius: 24px; /* Curved, modern look */
           padding: 24px;
           font-family: var(--font-current);
           font-size: var(--letter-font-size, 18px);
           line-height: 1.6;
           color: var(--text-primary);
           box-shadow: 0 4px 20px rgba(0,0,0,0.4);
           max-height: 300px;
           overflow: hidden;
           border: 1px solid var(--glass-border);
           width: 100%;
           box-sizing: border-box;
           display: flex;
           flex-direction: column;
        }

        .letter-content.pinned {
            border-color: #d4af37;
            box-shadow: 0 4px 20px rgba(212, 175, 55, 0.2);
        }

        .pin-btn {
            position: absolute;
            top: 24px;
            right: 90px;
            background: transparent;
            border: none;
            color: var(--text-secondary);
            padding: 0;
            width: 24px;
            height: 24px;
            opacity: 0;
            transition: all 0.3s ease;
            cursor: pointer;
            z-index: 10;
        }

        .pin-btn.pinned {
            color: #d4af37;
            opacity: 1 !important;
        }

        @media (hover: hover) {
            .letter-card:hover .pin-btn {
                opacity: 0.5;
            }
        }

        @media (max-width: 768px) {
            .pin-btn {
                opacity: 0.3;
                top: 16px;
                right: 85px;
            }
        }

        .pin-btn:hover {
            opacity: 1 !important;
            transform: scale(1.1);
        }

        .content-text {
            flex: 1;
            overflow: hidden;
        }

        .card-tags {
            display: flex;
            gap: 8px;
            margin-top: 16px;
            flex-wrap: wrap;
        }

        .card-tag {
            font-size: 11px;
            color: var(--text-secondary);
            background: rgba(255,255,255,0.03);
            padding: 4px 10px;
            border-radius: 12px;
            border: 1px solid var(--glass-border);
            opacity: 0.7;
        }

        @media (max-width: 768px) {
          .letter-content {
            padding: 16px;
            font-size: 16px;
            border-radius: 16px;
            max-height: 250px;
          }
        }

        @media (max-width: 480px) {
          .letter-content {
            padding: 14px;
            font-size: 15px;
            border-radius: 12px;
          }
        }
        
        /* Markdown Styling */
        .letter-content :global(p) {
            margin: 0 0 16px 0;
        }
        .letter-content :global(p:last-child) {
            margin: 0;
        }
        .letter-content :global(strong) {
            font-weight: 700;
            color: var(--text-primary);
        }
        .letter-content :global(em) {
            font-style: italic;
            opacity: 0.8;
        }
        .letter-content :global(blockquote) {
            border-left: 2px solid var(--text-secondary);
            margin: 16px 0;
            padding-left: 16px;
            opacity: 0.7;
        }

        .letter-meta {
            margin-top: 12px;
            font-size: 12px;
            color: var(--text-secondary);
            display: flex;
            justify-content: space-between;
        }
        
        .delete-btn {
            position: absolute;
            top: 24px;
            right: 24px;
            background: transparent;
            border: none;
            color: #444; /* Very subtle default */
            padding: 0;
            width: 24px;
            height: 24px;
            opacity: 0;
            transition: all 0.4s ease;
            cursor: pointer;
            z-index: 10;
        }

        @media (max-width: 768px) {
          .delete-btn {
            opacity: 0.3; /* visible on mobile */
            top: 16px;
            right: 16px;
          }
        }
        
        @media (hover: hover) {
          .letter-card:hover .delete-btn {
            opacity: 0.2; /* faint hint */
          }
        }
        
        .delete-btn:hover {
            opacity: 1 !important;
            color: #888; /* Just slightly brighter, not red */
            transform: scale(1.1); /* light pop */
        }

        .report-btn {
            position: absolute;
            top: 15px;
            right: 55px;
            background: rgba(255, 152, 0, 0.1);
            color: #ff9800;
            border: 1px solid #ff9800;
            width: 32px;
            height: 32px;
            min-width: 32px;
            min-height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: all 0.2s ease;
            cursor: pointer;
            font-size: 14px;
            line-height: 1;
            z-index: 10;
        }

        @media (max-width: 768px) {
          .report-btn {
            opacity: 0.6;
            width: 36px;
            height: 36px;
            min-width: 36px;
            min-height: 36px;
            top: 12px;
            right: 50px;
          }
        }
        
        @media (hover: hover) {
          .letter-card:hover .report-btn {
            opacity: 1;
          }
        }
        
        .report-btn:hover {
            background: #ff9800;
            color: white;
            transform: scale(1.1);
        }

        .admin-tools {
            position: absolute;
            top: 15px;
            right: 15px;
            display: flex;
            gap: 8px;
            z-index: 20;
        }

        .admin-btn {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 1px solid rgba(255,255,255,0.2);
            background: rgba(0,0,0,0.6);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            transition: all 0.2s ease;
            backdrop-filter: blur(5px);
        }

        .admin-btn:hover {
            transform: scale(1.2);
            background: #fff;
            color: #000;
        }

        .admin-btn.burn:hover { background: #ff453a; color: white; border-color: #ff453a; }
        .admin-btn.ban:hover { background: #000; color: white; border-color: #fff; }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .action-bar {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
        }

        @media (max-width: 480px) {
          .action-bar {
            gap: 8px;
          }
        }

        .like-btn {
            background: transparent;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 12px;
            min-height: 40px;
            min-width: 40px;
            border-radius: 12px;
            transition: all 0.2s ease;
            touch-action: manipulation;
        }

        .like-btn:hover {
            background: rgba(255,255,255,0.05);
            color: var(--accent-danger);
        }

        .like-btn.liked {
            color: var(--accent-danger);
        }

        .like-btn.liked svg {
            filter: drop-shadow(0 0 8px rgba(255, 69, 58, 0.4));
            transform: scale(1.1);
        }

        .like-count {
            font-size: 13px;
            font-weight: 600;
        }

        .share-btn {
            background: transparent;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 8px;
            min-height: 36px;
            min-width: 36px;
            border-radius: 10px;
            transition: all 0.2s ease;
            touch-action: manipulation;
        }

        .share-btn:hover {
            background: rgba(255,255,255,0.05);
            color: var(--text-primary);
        }

        .share-btn.copied {
            color: #30d158;
        }

        .share-btn.copied::after {
            content: '✓';
            position: absolute;
            font-size: 10px;
        }

        /* LOCKED STATE */
        .locked-content {
            background: #000;
            border-color: #333;
            color: #444;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 150px;
            position: relative;
            overflow: hidden;
        }

        .locked-overlay {
            text-align: center;
            z-index: 2;
        }

        .unlock-date {
            display: block;
            margin-top: 8px;
            font-size: 11px;
            color: #666;
            font-family: monospace;
            letter-spacing: 1px;
            text-transform: uppercase;
        }

        .glitch-text {
            font-weight: bold;
            font-size: 24px;
            color: white;
            letter-spacing: 4px;
            position: relative;
        }

        .glitch-text::before,
        .glitch-text::after {
            content: attr(data-text);
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #000;
        }

        .glitch-text::before {
            left: 2px;
            text-shadow: -1px 0 red;
            clip: rect(24px, 550px, 90px, 0);
            animation: glitch-anim-1 2.5s infinite linear alternate-reverse;
        }

        .glitch-text::after {
            left: -2px;
            text-shadow: -1px 0 blue;
            clip: rect(85px, 550px, 140px, 0);
            animation: glitch-anim-2 3s infinite linear alternate-reverse;
        }

        @keyframes glitch-anim-1 {
            0% { clip: rect(20px, 9999px, 15px, 0); }
            20% { clip: rect(50px, 9999px, 60px, 0); }
            40% { clip: rect(10px, 9999px, 80px, 0); }
            60% { clip: rect(30px, 9999px, 10px, 0); }
            80% { clip: rect(80px, 9999px, 40px, 0); }
            100% { clip: rect(60px, 9999px, 90px, 0); }
        }

        @keyframes glitch-anim-2 {
            0% { clip: rect(60px, 9999px, 70px, 0); }
            20% { clip: rect(10px, 9999px, 30px, 0); }
            40% { clip: rect(90px, 9999px, 10px, 0); }
            60% { clip: rect(15px, 9999px, 80px, 0); }
            80% { clip: rect(50px, 9999px, 40px, 0); }
            100% { clip: rect(30px, 9999px, 60px, 0); }
        }
      `}</style>

            {/* FILTER BAR */}
            <div className="filter-bar">
                <button
                    className={`filter-pill ${activeTag === null ? 'active' : ''}`}
                    onClick={() => setActiveTag(null)}
                >
                    All
                </button>
                {TAGS.map(tag => (
                    <button
                        key={tag}
                        className={`filter-pill ${activeTag === tag ? 'active' : ''}`}
                        onClick={() => setActiveTag(tag === activeTag ? null : tag)}
                    >
                        {tag}
                    </button>
                ))}
            </div>

            {sortedLetters.map((letter) => (
                <div
                    key={letter.id}
                    className="letter-card"
                    onClick={() => {
                        if (onOpen) onOpen(letter);

                        // Trigger Witness API
                        console.log('Witness Triggered for:', letter.id);
                        const key = `wbds_witness_${letter.id}`;
                        if (!sessionStorage.getItem(key)) {
                            console.log('Sending Witness Request...');
                            fetch('/api/letters/view', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ letter_id: letter.id })
                            })
                                .then(res => res.json())
                                .then(data => console.log('Witness Response:', data))
                                .catch(err => console.error("Witness failed", err));
                            sessionStorage.setItem(key, 'true');
                        } else {
                            console.log('Already witnessed in this session.');
                        }
                    }}
                >
                    {/* Report button - visible for all letters except own */}
                    {onReport && (!myLetterIds || !myLetterIds.has(letter.id)) && (
                        <button
                            className="report-btn"
                            onClick={(e) => { e.stopPropagation(); onReport(letter.id); }}
                            title="Report inappropriate content"
                        >⚠</button>
                    )}

                    {/* ADMIN TOOLS - Double Locked */}
                    {isAdmin && (
                        <div className="admin-tools">
                            <button
                                className="admin-btn burn"
                                onClick={(e) => handleAdminAction(e, 'burn', letter.id)}
                                title="Burn Letter (Instant Delete)"
                            >🔥</button>
                            <button
                                className="admin-btn ban"
                                onClick={(e) => handleAdminAction(e, 'shadow_ban', letter.id, letter.ip_address, letter.browser_fingerprint)}
                                title="Shadow Ban User"
                            >🚫</button>
                        </div>
                    )}
                    {myLetterIds && myLetterIds.has(letter.id) && (
                        <button
                            className="delete-btn"
                            onClick={(e) => { e.stopPropagation(); onDelete(letter.id); }}
                            title="Delete your letter"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    )}
                    {/* Pin button */}
                    <button
                        className={`pin-btn ${pinnedLetters.has(letter.id) ? 'pinned' : ''}`}
                        onClick={(e) => { e.stopPropagation(); togglePin(letter.id); }}
                        title={pinnedLetters.has(letter.id) ? 'Unpin letter' : 'Pin letter'}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill={pinnedLetters.has(letter.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                        </svg>
                    </button>
                    <div className={`letter-content ${letter.is_locked ? 'locked-content' : ''} ${pinnedLetters.has(letter.id) ? 'pinned' : ''}`}>
                        {letter.is_locked ? (
                            <div className="locked-overlay">
                                <div className="glitch-text" data-text="LOCKED">LOCKED</div>
                                <span className="unlock-date">
                                    Unlocks {new Date(letter.unlock_at).toLocaleDateString()}
                                </span>
                            </div>
                        ) : (
                            <>
                                <div className="content-text">
                                    <ReactMarkdown>{letter.content}</ReactMarkdown>
                                </div>
                                {letter.tags && letter.tags.length > 0 && (
                                    <div className="card-tags">
                                        {letter.tags.map(tag => (
                                            <span key={tag} className="card-tag">{tag}</span>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    <div className="letter-meta">
                        <span>Anonymous</span>
                        <div className="action-bar">
                            {/* WITNESS COUNT */}
                            <div className="witness-badge" title="Witnesses">
                                <svg width="16" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                                <span>{letter.views || 0}</span>
                            </div>

                            <button
                                className={`like-btn ${likedLetters && likedLetters.has(letter.id) ? 'liked' : ''}`}
                                onClick={(e) => { e.stopPropagation(); onLike(letter.id); }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill={likedLetters && likedLetters.has(letter.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                </svg>
                                {letter.likes > 0 && <span className="like-count">{letter.likes}</span>}
                            </button>
                            <button
                                className="share-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const url = `${window.location.origin}/letter/${letter.id}`;
                                    navigator.clipboard.writeText(url);
                                    // Show brief feedback
                                    const btn = e.currentTarget;
                                    btn.classList.add('copied');
                                    setTimeout(() => btn.classList.remove('copied'), 1500);
                                }}
                                title="Copy link to this letter"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                                    <polyline points="16 6 12 2 8 6" />
                                    <line x1="12" y1="2" x2="12" y2="15" />
                                </svg>
                            </button>
                            <span className="timestamp">
                                {new Date(letter.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {new Date(letter.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
