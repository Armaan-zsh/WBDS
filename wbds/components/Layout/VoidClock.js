'use client';
import { useState, useEffect } from 'react';

export default function VoidClock() {
    const [time, setTime] = useState(null);
    const [is24Hour, setIs24Hour] = useState(true);

    // Load preference from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('wbds_clock_format');
            if (saved === '12') setIs24Hour(false);
        }
    }, []);

    useEffect(() => {
        const updateTime = () => {
            setTime(new Date());
            requestAnimationFrame(updateTime);
        };

        // Start loop
        const frameId = requestAnimationFrame(updateTime);
        return () => cancelAnimationFrame(frameId);
    }, []);

    const toggleFormat = () => {
        setIs24Hour(prev => {
            const newValue = !prev;
            localStorage.setItem('wbds_clock_format', newValue ? '24' : '12');
            return newValue;
        });
    };

    if (!time) return <div className="void-clock" />;

    // Format time based on preference
    let hours = time.getHours();
    let suffix = '';

    if (!is24Hour) {
        suffix = hours >= 12 ? ' PM' : ' AM';
        hours = hours % 12 || 12; // Convert 0 to 12
    }

    const hoursStr = hours.toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const seconds = time.getSeconds().toString().padStart(2, '0');
    const ms = time.getMilliseconds().toString().padStart(3, '0');

    return (
        <div className="void-clock fade-in" onClick={toggleFormat} title="Click to toggle 12/24 hour format">
            <style jsx>{`
                .void-clock {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    font-family: 'JetBrains Mono', 'Fira Code', monospace;
                    font-size: 18px;
                    color: var(--text-secondary);
                    opacity: 0.5;
                    z-index: 100;
                    letter-spacing: 1px;
                    transition: opacity 0.3s ease;
                    font-variant-numeric: tabular-nums;
                    text-shadow: 0 0 10px rgba(0,0,0,0.5);
                    cursor: pointer;
                    user-select: none;
                }
                .void-clock:hover {
                    opacity: 1;
                    color: var(--text-primary);
                }
                .ms {
                    opacity: 0.5;
                    font-size: 13px;
                    margin-left: 4px;
                }
                .suffix {
                    opacity: 0.6;
                    font-size: 12px;
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
            {hoursStr}:{minutes}:{seconds}<span className="ms">.{ms}</span>{suffix && <span className="suffix">{suffix}</span>}
        </div>
    );
}
