import React, { useState, useEffect } from 'react';

const PROMPTS = [
    "Write about the one who got away...",
    "Let that frustration out from your chest.",
    "The void is listening. What are you hiding?",
    "Do you miss them? Tell us why.",
    "Describe the color of your current mood.",
    "What would you say if you knew they'd never read it?",
    "A secret you've never told anyone...",
    "Why are you still holding on?",
    "What does your silence sound like?",
    "The person you were 5 years ago... what do they need to hear?"
];

export default function VoidWhisper() {
    const [prompt, setPrompt] = useState('');
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if we already showed a whisper today
        const lastWhisper = localStorage.getItem('wbds_last_whisper');
        const today = new Date().toDateString();

        if (lastWhisper !== today) {
            const randomPrompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
            setPrompt(randomPrompt);

            // Show after a slight delay for dramatic effect
            const timer = setTimeout(() => {
                setIsVisible(true);
                localStorage.setItem('wbds_last_whisper', today);
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, []);

    if (!isVisible) return null;

    return (
        <div className="void-whisper-overlay" onClick={() => setIsVisible(false)}>
            <div className="whisper-card animate-float-up">
                <div className="whisper-header">
                    <span className="whisper-icon">💭</span>
                    <span className="whisper-label">Whisper from the Void</span>
                </div>
                <p className="whisper-text">"{prompt}"</p>
                <div className="whisper-hint">Click to dismiss</div>
            </div>

            <style jsx>{`
                .void-whisper-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.4);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 100000;
                    cursor: pointer;
                }

                .whisper-card {
                    background: rgba(15, 15, 15, 0.9);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 32px;
                    border-radius: 24px;
                    max-width: 400px;
                    width: 90%;
                    text-align: center;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.8), 0 0 20px rgba(255,255,255,0.05);
                }

                .whisper-header {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    margin-bottom: 20px;
                    opacity: 0.6;
                }

                .whisper-label {
                    font-size: 12px;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    font-weight: 600;
                }

                .whisper-text {
                    font-size: 20px;
                    line-height: 1.6;
                    color: white;
                    font-style: italic;
                    margin: 0 0 24px 0;
                    font-family: var(--font-serif);
                }

                .whisper-hint {
                    font-size: 10px;
                    opacity: 0.3;
                    letter-spacing: 1px;
                }

                .animate-float-up {
                    animation: float-up 0.8s cubic-bezier(0.16, 1, 0.3, 1);
                }

                @keyframes float-up {
                    from { opacity: 0; transform: translateY(40px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
}
