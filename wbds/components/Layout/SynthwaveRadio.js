'use client';

import { useState, useEffect, useRef } from 'react';

export default function SynthwaveRadio() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false); // New Loading State
    const [volume, setVolume] = useState(0.5);
    const [isExpanded, setIsExpanded] = useState(false);
    const [error, setError] = useState(false);

    // Audio Element Ref
    const audioRef = useRef(null);

    const STATIONS = [
        { name: 'NIGHTRIDE FM', url: 'https://stream.nightride.fm/nightride.mp3' },
        { name: 'CHILLSYNTH', url: 'https://stream.nightride.fm/chillsynth.mp3' },
        { name: 'DATAWAVE', url: 'https://stream.nightride.fm/datawave.mp3' },
        { name: 'SPACED OUT', url: 'https://stream.nightride.fm/spaced.mp3' }
    ];

    const [stationIndex, setStationIndex] = useState(0);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        // removed crossOrigin to prevent CORS blocks on streams
        audio.volume = volume;

        // Event Listeners for smooth UI
        const onPlay = () => {
            setIsPlaying(true);
            setIsLoading(false);
            setError(false);
        };
        const onPause = () => setIsPlaying(false);
        const onWaiting = () => setIsLoading(true); // Buffering
        const onPlaying = () => setIsLoading(false); // Resumed
        const onError = (e) => {
            console.error("Stream Error", e);
            setIsPlaying(false);
            setIsLoading(false);
            setError(true);
            // Auto-try next station on error if likely connection issue
            if (isPlaying) {
                setTimeout(() => changeStation((stationIndex + 1) % STATIONS.length), 1000);
            }
        };

        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);
        audio.addEventListener('waiting', onWaiting);
        audio.addEventListener('playing', onPlaying);
        audio.addEventListener('error', onError);

        return () => {
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('pause', onPause);
            audio.removeEventListener('waiting', onWaiting);
            audio.removeEventListener('playing', onPlaying);
            audio.removeEventListener('error', onError);
        };
    }, [volume, stationIndex, isPlaying]);

    const changeStation = async (index) => {
        setStationIndex(index);
        const audio = audioRef.current;
        if (audio) {
            setIsLoading(true);
            setError(false);
            audio.src = STATIONS[index].url;
            // Firefox requires load() after setting src
            audio.load();
            try {
                await audio.play();
                setIsPlaying(true);
            } catch (e) {
                console.error("Play failed", e);
                setIsPlaying(false);
                setError(true);
                setIsLoading(false);
            }
        }
    };

    const togglePlay = async () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
        } else {
            if (!audio.src || audio.src !== STATIONS[stationIndex].url) {
                audio.src = STATIONS[stationIndex].url;
                // Firefox requires load() after setting src
                audio.load();
            }
            try {
                setIsLoading(true);
                setError(false);
                // Firefox fix: ensure audio is loaded before play
                if (audio.readyState < 2) {
                    await new Promise((resolve) => {
                        audio.addEventListener('canplay', resolve, { once: true });
                        audio.load();
                    });
                }
                await audio.play();
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error("Playback failed:", err);
                    setError(err.message || 'PLAYBACK ERROR');
                }
                setIsLoading(false);
            }
        }
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: '40px', // Raised to avoid bottom sheet/nav overlap
            right: '24px',  // Moved slightly inward
            zIndex: 2147483647,  // Maximum Z (32-bit int)
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            fontFamily: "'Courier Prime', monospace",
            pointerEvents: 'auto', // Force interaction
            filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))'
        }}
            className="synthwave-radio-wrapper"
        >
            {/* HIDDEN AUDIO ELEMENT */}
            {/* Firefox Fix: Remove crossOrigin to avoid CORS issues */}
            <audio
                ref={audioRef}
                preload="auto"
                onError={(e) => {
                    const err = e.target.error;
                    console.error("Audio Tag Error:", err);
                    let msg = 'CONNECTION ERR';
                    if (err) {
                        if (err.code === 1) msg = 'ABORTED';
                        if (err.code === 2) msg = 'NETWORK ERR';
                        if (err.code === 3) msg = 'DECODE ERR';
                        if (err.code === 4) msg = 'SRC NOT SUPPORTED';
                    }
                    setError(msg);
                    setIsLoading(false);
                    setIsPlaying(false);
                }}
            />

            {/* EXPANDED PLAYER */}
            {/* Firefox Debug: Removed explicit load(), displaying error message */}
            {isExpanded && (
                <div className="radio-expanded-player" style={{
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                                onClick={() => changeStation((stationIndex - 1 + STATIONS.length) % STATIONS.length)}
                                style={{ background: 'transparent', border: 'none', color: '#ff71ce', cursor: 'pointer', fontSize: '14px' }}
                            >
                                «
                            </button>
                            <span style={{ fontSize: '12px', letterSpacing: '1px', color: '#ff71ce', textShadow: '0 0 5px #ff71ce', minWidth: '100px', textAlign: 'center' }}>
                                {STATIONS[stationIndex].name}
                            </span>
                            <button
                                onClick={() => changeStation((stationIndex + 1) % STATIONS.length)}
                                style={{ background: 'transparent', border: 'none', color: '#ff71ce', cursor: 'pointer', fontSize: '14px' }}
                            >
                                »
                            </button>
                        </div>
                        <div style={{
                            width: '8px', height: '8px', borderRadius: '50%',
                            background: isPlaying ? '#05ffa1' : (isLoading ? '#fcee0c' : (error ? '#ff0000' : '#555')),
                            boxShadow: isPlaying ? '0 0 10px #05ffa1' : 'none',
                            animation: isLoading ? 'pulse 1s infinite' : 'none'
                        }}></div>
                    </div>

                    <div style={{ fontSize: '10px', color: error ? '#ff453a' : '#888', marginBottom: '16px', textTransform: 'uppercase' }}>
                        {error ? (typeof error === 'string' ? error : 'CONNECTION ERR') : isLoading ? 'TUNING FREQUENCY...' : (isPlaying ? 'BROADCASTING LIVE' : 'OFFLINE')}
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <button
                            onClick={togglePlay}
                            disabled={isLoading}
                            style={{
                                background: isPlaying ? 'transparent' : '#ff71ce',
                                border: '1px solid #ff71ce',
                                color: isPlaying ? '#ff71ce' : '#000',
                                padding: '8px 16px',
                                borderRadius: '4px',
                                cursor: isLoading ? 'wait' : 'pointer',
                                opacity: isLoading ? 0.7 : 1,
                                fontWeight: 'bold',
                                fontSize: '12px',
                                textTransform: 'uppercase',
                                transition: 'all 0.2s',
                                flex: 1
                            }}
                        >
                            {isLoading ? '...' : (isPlaying ? 'Stop' : 'Play')}
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
                @keyframes pulse {
                    0% { opacity: 0.5; }
                    100% { opacity: 1; }
                }

                .radio-expanded-player {
                  width: 260px;
                }

                @media (max-width: 768px) {
                  .synthwave-radio-wrapper {
                    bottom: 20px !important;
                    right: 16px !important;
                  }
                  .radio-expanded-player {
                    width: 240px;
                    padding: 14px;
                  }
                }

                @media (max-width: 480px) {
                  .synthwave-radio-wrapper {
                    bottom: 16px !important;
                    right: 12px !important;
                  }
                  .radio-expanded-player {
                    width: calc(100vw - 48px);
                    max-width: 280px;
                    padding: 12px;
                  }
                }
            `}</style>
        </div>
    );
}
