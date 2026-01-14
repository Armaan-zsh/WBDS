import React from 'react';
import ReactMarkdown from 'react-markdown';

const ChainLink = ({ letter, prevLetter, nextLetter, index }) => {
    return (
        <div className="chain-link">
            <div className="timeline">
                <div className="line top"></div>
                <div className="node">
                    <div className="core"></div>
                    <div className="pulse"></div>
                </div>
                <div className="line bottom"></div>
            </div>

            <div className="content-card">
                <div className="header">
                    <span className="fragment-id">FRAGMENT #{letter.id}</span>
                    <span className="timestamp">
                        {new Date(letter.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>

                <div className="body">
                    <ReactMarkdown>{letter.content}</ReactMarkdown>
                </div>

                <div className="meta-links">
                    {nextLetter && (
                        <div className="link-info item-prev">
                            <span className="arrow">↑</span>
                            User #{nextLetter.id}
                            <span className="fade"> ({new Date(nextLetter.created_at).toLocaleTimeString()})</span>
                        </div>
                    )}

                    {prevLetter && (
                        <div className="link-info item-next">
                            <span className="arrow">↓</span>
                            User #{prevLetter.id}
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
        .chain-link {
          display: flex;
          gap: 20px;
          min-height: 200px; /* Space between nodes */
          position: relative;
          opacity: 0;
          animation: slideIn 0.5s ease forwards;
          animation-delay: ${Math.min(index * 0.1, 1)}s;
        }

        .timeline {
           display: flex;
           flex-direction: column;
           align-items: center;
           min-width: 40px;
        }

        .line {
            width: 2px;
            background: linear-gradient(to bottom, transparent, var(--accent-primary), transparent);
            flex: 1;
            box-shadow: 0 0 10px var(--accent-primary);
            opacity: 0.5;
        }
        
        .line.top {
            background: linear-gradient(to top, var(--accent-primary), transparent);
        }
         .line.bottom {
            background: linear-gradient(to bottom, var(--accent-primary), transparent);
        }

        .node {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: var(--bg-surface);
            border: 2px solid var(--accent-primary);
            position: relative;
            z-index: 2;
            box-shadow: 0 0 15px var(--accent-primary);
        }
        
        .core {
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            width: 6px; height: 6px;
            background: white;
            border-radius: 50%;
        }

        .content-card {
            flex: 1;
            background: rgba(0,0,0,0.4);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 40px;
            backdrop-filter: blur(5px);
            transition: all 0.3s ease;
        }
        
        .content-card:hover {
            border-color: var(--accent-primary);
            box-shadow: 0 0 20px rgba(0,0,0,0.5);
            background: rgba(0,0,0,0.6);
        }

        .fragment-id {
            color: var(--accent-primary);
            font-family: monospace;
            letter-spacing: 2px;
            font-size: 12px;
            font-weight: bold;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            padding-bottom: 8px;
        }

        .timestamp {
            font-size: 12px;
            color: #666;
        }

        .body {
            font-size: 15px;
            line-height: 1.5;
            color: #ddd;
        }

        .meta-links {
            margin-top: 20px;
            font-size: 11px;
            color: #555;
            font-family: monospace;
        }
        
        .link-info {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .arrow { color: var(--accent-primary); }
        .fade { opacity: 0.5; }

        @keyframes slideIn {
            from { opacity: 0; transform: translateX(20px); }
            to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
        </div>
    );
};

export default ChainLink;
