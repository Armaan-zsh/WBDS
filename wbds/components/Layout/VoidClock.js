'use client';
import { useState, useEffect } from 'react';
import { setAudioProfile, playTypeSound } from '../../utils/audioEngine';

export default function VoidClock() {
    const [time, setTime] = useState(null);
    const [is24Hour, setIs24Hour] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [streak, setStreak] = useState(0);

    // Load preferences from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Clock format
            const savedFormat = localStorage.getItem('wbds_clock_format');
            if (savedFormat === '12') setIs24Hour(false);

            // Mute state
            const savedMute = localStorage.getItem('wbds_muted');
            if (savedMute === 'true') {
                setIsMuted(true);
                setAudioProfile('silent');
            }

            // Streak calculation
            const lastWrite = localStorage.getItem('wbds_last_write_date');
            const streakCount = parseInt(localStorage.getItem('wbds_streak') || '0');

            if (lastWrite) {
                const lastDate = new Date(lastWrite);
                const today = new Date();
                const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

                if (diffDays === 0) {
                    // Wrote today
                    setStreak(streakCount);
                } else if (diffDays === 1) {
                    // Wrote yesterday, streak continues
                    setStreak(streakCount);
                } else {
                    // Missed a day, reset
                    setStreak(0);
                    localStorage.setItem('wbds_streak', '0');
                }
            }
        }
    }, []);

    useEffect(() => {
        const updateTime = () => {
            setTime(new Date());
            requestAnimationFrame(updateTime);
        };

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

    const toggleMute = (e) => {
        e.stopPropagation();
        setIsMuted(prev => {
            const newValue = !prev;
            localStorage.setItem('wbds_muted', newValue.toString());
            if (newValue) {
                setAudioProfile('silent');
            } else {
                const savedProfile = localStorage.getItem('wbds_audio') || 'mechanical';
                setAudioProfile(savedProfile);
            }
            return newValue;
        });
    };

    if (!time) return <div className="void-status-bar" />;

    // Format time
    let hours = time.getHours();
    let suffix = '';

    if (!is24Hour) {
        suffix = hours >= 12 ? ' PM' : ' AM';
        hours = hours % 12 || 12;
    }

    const hoursStr = hours.toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const seconds = time.getSeconds().toString().padStart(2, '0');
    const ms = time.getMilliseconds().toString().padStart(3, '0');

    return (
        <div className="void-status-bar fade-in">
            {/* Streak Counter */}
            {streak > 0 && (
                <div className="streak" title={`${streak} day streak of writing to the void`}>
                    🔥 {streak}
                </div>
            )}

            {/* Mute Toggle */}
            <button
                className={`mute-btn ${isMuted ? 'muted' : ''}`}
                onClick={toggleMute}
                title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
            >
                {isMuted ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 5L6 9H2v6h4l5 4V5z" />
                        <line x1="23" y1="9" x2="17" y2="15" />
                        <line x1="17" y1="9" x2="23" y2="15" />
                    </svg>
                ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 5L6 9H2v6h4l5 4V5z" />
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                    </svg>
                )}
            </button>

            {/* Clock */}
            <div className="clock" onClick={toggleFormat} title="Click to toggle 12/24 hour format">
                {hoursStr}:{minutes}:{seconds}<span className="ms">.{ms}</span>{suffix && <span className="suffix">{suffix}</span>}
            </div>

            <style jsx>{`
                .void-status-bar {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    z-index: 100;
                    opacity: 0.5;
                    transition: opacity 0.3s ease;
                }
                .void-status-bar:hover {
                    opacity: 1;
                }
                .streak {
                    font-size: 14px;
                    color: #ff9500;
                    font-family: 'JetBrains Mono', monospace;
                    background: rgba(255, 149, 0, 0.1);
                    padding: 4px 10px;
                    border-radius: 12px;
                    border: 1px solid rgba(255, 149, 0, 0.2);
                }
                .mute-btn {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    padding: 6px;
                    cursor: pointer;
                    color: var(--text-secondary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }
                .mute-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: var(--text-primary);
                }
                .mute-btn.muted {
                    color: #ff453a;
                    border-color: rgba(255, 69, 58, 0.3);
                }
                .clock {
                    font-family: 'JetBrains Mono', 'Fira Code', monospace;
                    font-size: 18px;
                    color: var(--text-secondary);
                    letter-spacing: 1px;
                    font-variant-numeric: tabular-nums;
                    text-shadow: 0 0 10px rgba(0,0,0,0.5);
                    cursor: pointer;
                    user-select: none;
                }
                .void-status-bar:hover .clock {
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
        </div>
    );
}
