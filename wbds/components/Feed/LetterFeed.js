'use client';

export default function LetterFeed({ letters, onLetterClick }) {
    if (!letters || letters.length === 0) {
        return (
            <div className="empty-state">
                <p></p>
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
        }
        .letter-card:hover {
           transform: scale(1.02);
           opacity: 0.9;
        }
        
        .letter-content {
           background: var(--bg-surface);
           border-radius: 8px; /* Slightly rounded, like paper */
           padding: 24px;
           font-family: 'Charter', 'Georgia', serif;
           font-size: 18px;
           line-height: 1.6;
           color: var(--text-primary);
           white-space: pre-wrap;
           box-shadow: 0 4px 20px rgba(0,0,0,0.4);
           max-height: 300px;
           overflow: hidden;
           mask-image: linear-gradient(to bottom, black 80%, transparent 100%);
        }

        .letter-meta {
            margin-top: 12px;
            font-size: 12px;
            color: var(--text-secondary);
            display: flex;
            justify-content: space-between;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

            {letters.map((letter) => (
                <div key={letter.id} className="letter-card" onClick={() => onLetterClick(letter)}>
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
