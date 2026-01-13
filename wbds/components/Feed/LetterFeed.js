'use client';

export default function LetterFeed({ letters, onLetterClick, onDelete, myLetterIds }) {
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
           border-radius: 8px; /* Slightly rounded, like paper */
           padding: 24px;
           font-family: var(--font-current);
           font-size: 18px;
           line-height: 1.6;
           color: var(--text-primary);
           white-space: pre-wrap;
           box-shadow: 0 4px 20px rgba(0,0,0,0.4);
           max-height: 300px;
           overflow: hidden;
           mask-image: linear-gradient(to bottom, black 80%, transparent 100%);
           border: 1px solid var(--glass-border);
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
                    <div className="letter-content">
                        {letter.content}
                    </div>
                    <div className="letter-meta">
                        <span>Anonymous</span>
                        <span>{new Date(letter.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}
