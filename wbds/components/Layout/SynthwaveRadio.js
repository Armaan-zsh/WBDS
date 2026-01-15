'use client';

import { useState, useEffect, useRef } from 'react';

export default function SynthwaveRadio() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.5);
    const [isExpanded, setIsExpanded] = useState(false);
    const [error, setError] = useState(false);

    // Audio Element Ref
    const audioRef = useRef(null);
    const streamUrl = 'http://bbr0.radioca.st:8179/stream';

    useEffect(() => {
        // Initialize volume
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    const togglePlay = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            // Re-load to catch live edge if paused for too long
            audioRef.current.src = streamUrl;
            audioRef.current.play()
                .then(() => {
                    setError(false);
                    setIsPlaying(true);
                })
                .catch(err => {
                    console.error("Radio Play Error:", err);
                    setError(true);
                });
        }
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: '40px', // Raised to avoid bottom sheet/nav overlap
            right: '24px',  // Moved slightly inward
            zIndex: 99999,  // Maximum Z
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            fontFamily: "'Courier Prime', monospace",
            pointerEvents: 'auto', // Force interaction
            filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))'
        }}>
            {/* HIDDEN AUDIO ELEMENT */}
            <audio ref={audioRef} crossOrigin="anonymous" preload="none" />

            {/* EXPANDED PLAYER */}
            {isExpanded && (
                <div style={{
                    background: 'rgba(5, 0, 10, 0.9)',
                    border: '1px solid #ff71ce',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '12px',
                    width: '260px',
                    boxShadow: '0 0 20px rgba(255, 113, 206, 0.4)',
                    backdropFilter: 'blur(10px)',
                    color: '#01cdfe'
                }}>
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'
                    }}>
                        <span style={{ fontSize: '12px', letterSpacing: '1px', color: '#ff71ce', textShadow: '0 0 5px #ff71ce' }}>
                            SYNTHWAVE CITY
                        </span>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isPlaying ? '#05ffa1' : '#555', boxShadow: isPlaying ? '0 0 10px #05ffa1' : 'none' }}></div>
                    </div>

                    <div style={{ fontSize: '10px', color: '#888', marginBottom: '16px' }}>
                        {isPlaying ? 'B ROADCASTING LIVE' : 'OFFLINE'}
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <button
                            onClick={togglePlay}
                            style={{
                                background: isPlaying ? 'transparent' : '#ff71ce',
                                border: '1px solid #ff71ce',
                                color: isPlaying ? '#ff71ce' : '#000',
                                padding: '8px 16px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '12px',
                                textTransform: 'uppercase',
                                transition: 'all 0.2s',
                                flex: 1
                            }}
                        >
                            {isPlaying ? 'Stop' : 'Play'}
                        </button>

                        <input
                            type="range"
                            min="0" max="1" step="0.05"
                            value={volume}
                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                            style={{ width: '80px', accentColor: '#01cdfe' }}
                        />
                    </div>
                </div>
            )}

            {/* TOGGLE BUTTON */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                    background: '#090011',
                    border: '1px solid #01cdfe',
                    color: '#01cdfe',
                    padding: '10px 20px',
                    borderRadius: '50px',
                    cursor: 'pointer',
                    boxShadow: '0 0 15px rgba(1, 205, 254, 0.3)',
                    fontWeight: 'bold',
                    letterSpacing: '2px',
                    fontSize: '12px',
                    textShadow: '0 0 5px rgba(1, 205, 254, 0.8)',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}
            >
                <span>RADIO</span>
                {isPlaying && (
                    <span style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '10px' }}>
                        <span style={{ width: '2px', background: '#05ffa1', height: '100%', animation: 'bounce 0.5s infinite alternate' }}></span>
                        <span style={{ width: '2px', background: '#05ffa1', height: '60%', animation: 'bounce 0.4s infinite alternate-reverse' }}></span>
                        <span style={{ width: '2px', background: '#05ffa1', height: '80%', animation: 'bounce 0.6s infinite alternate' }}></span>
                    </span>
                )}
            </button>

            <style jsx>{`
                @keyframes bounce {
                    0% { height: 20%; }
                    100% { height: 100%; }
                }
            `}</style>
        </div>
    );
}
