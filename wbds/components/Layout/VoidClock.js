'use client';
import { useState, useEffect } from 'react';

export default function VoidClock() {
    const [time, setTime] = useState(null);

    useEffect(() => {
        const updateTime = () => {
            setTime(new Date());
            requestAnimationFrame(updateTime);
        };

        // Start loop
        const frameId = requestAnimationFrame(updateTime);
        return () => cancelAnimationFrame(frameId);
    }, []);

    if (!time) return <div className="void-clock" />;

    // Format: HH:MM:SS.mmm
    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const seconds = time.getSeconds().toString().padStart(2, '0');
    const ms = time.getMilliseconds().toString().padStart(3, '0');

    return (
        <div className="void-clock fade-in">
            <style jsx>{`
                .void-clock {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    font-family: 'JetBrains Mono', 'Fira Code', monospace;
                    font-size: 14px;
                    color: var(--text-secondary);
                    opacity: 0.5;
                    z-index: 100;
                    letter-spacing: 1px;
                    transition: opacity 0.3s ease;
                    font-variant-numeric: tabular-nums;
                    text-shadow: 0 0 10px rgba(0,0,0,0.5);
                    cursor: default;
                }
                .void-clock:hover {
                    opacity: 1;
                    color: var(--text-primary);
                }
                .ms {
                    opacity: 0.5;
                    font-size: 10px;
                    margin-left: 4px;
                }
                .fade-in {
                    animation: fadeIn 1s ease;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 0.5; }
                }
            `}</style>
            {hours}:{minutes}:{seconds}<span className="ms">.{ms}</span>
        </div>
    );
}
