'use client';
import ReactMarkdown from 'react-markdown';

export default function LetterFeed({ letters, onLetterClick, onDelete, myLetterIds, onLike, likedLetters }) {
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
        }
        .letter-card {
           margin-bottom: 40px;
           opacity: 0;
           animation: fadeIn 0.8s ease forwards;
           cursor: pointer;
           transition: transform 0.2s ease, opacity 0.2s ease;
           position: relative;
        }
        .letter-card:hover {
           transform: scale(1.02);
           opacity: 0.9;
        }
        
        .letter-content {
           background: var(--bg-surface);
           border-radius: 24px; /* Curved, modern look */
           padding: 24px;
           font-family: var(--font-current);
           font-size: 18px;
           line-height: 1.6;
           color: var(--text-primary);
           box-shadow: 0 4px 20px rgba(0,0,0,0.4);
           max-height: 300px;
           overflow: hidden;
           border: 1px solid var(--glass-border);
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
            top: 15px;
            right: 15px;
            background: rgba(255, 0, 0, 0.1);
            color: var(--accent-danger);
            border: 1px solid var(--accent-danger);
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: all 0.2s ease;
            cursor: pointer;
            font-size: 16px;
            line-height: 1;
        }
        
        .letter-card:hover .delete-btn {
            opacity: 1;
        }
        
        .delete-btn:hover {
            background: var(--accent-danger);
            color: white;
            transform: scale(1.1);
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .action-bar {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .like-btn {
            background: transparent;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 4px 8px;
            border-radius: 12px;
            transition: all 0.2s ease;
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

            {letters.map((letter) => (
                <div key={letter.id} className="letter-card" onClick={() => onLetterClick(letter)}>
                    {myLetterIds && myLetterIds.has(letter.id) && (
                        <button
                            className="delete-btn"
                            onClick={(e) => { e.stopPropagation(); onDelete(letter.id); }}
                            title="Delete your letter"
                        >×</button>
                    )}
                    <div className={`letter-content ${letter.is_locked ? 'locked-content' : ''}`}>
                        {letter.is_locked ? (
                            <div className="locked-overlay">
                                <div className="glitch-text" data-text="LOCKED">LOCKED</div>
                                <span className="unlock-date">
                                    Unlocks {new Date(letter.unlock_at).toLocaleDateString()}
                                </span>
                            </div>
                        ) : (
                            <ReactMarkdown>{letter.content}</ReactMarkdown>
                        )}
                    </div>
                    <div className="letter-meta">
                        <span>Anonymous</span>
                        <div className="action-bar">
                            <button
                                className={`like-btn ${likedLetters && likedLetters.has(letter.id) ? 'liked' : ''}`}
                                onClick={(e) => { e.stopPropagation(); onLike(letter.id); }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill={likedLetters && likedLetters.has(letter.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                </svg>
                                {letter.likes > 0 && <span className="like-count">{letter.likes}</span>}
                            </button>
                            <span className="timestamp">{new Date(letter.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
