'use client';
import { useState, useEffect } from 'react';

export default function VoidClock() {
    const [time, setTime] = useState(null);

    useEffect(() => {
        // Run on client only to avoid hydration mismatch
        setTime(new Date());

        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    if (!time) return <div className="void-clock" />; // Placeholder

    return (
        <div className="void-clock fade-in">
            <style jsx>{`
                .void-clock {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    font-family: var(--font-family-mono);
                    font-size: 14px;
                    color: var(--text-secondary);
                    opacity: 0.5;
                    z-index: 100;
                    letter-spacing: 1px;
                    transition: opacity 0.3s ease;
                }
                .void-clock:hover {
                    opacity: 1;
                }
                .fade-in {
                    animation: fadeIn 1s ease;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 0.5; }
                }
            `}</style>
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
    );
}
