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

    // Multiple fallback streams for better compatibility and reduced buffering
    const STATIONS = [
        { 
            name: 'NIGHTRIDE FM', 
            urls: [
                'https://stream.nightride.fm/nightride.mp3',
                'http://stream.nightride.fm/nightride.mp3' // HTTP fallback
            ]
        },
        { 
            name: 'CHILLSYNTH', 
            urls: [
                'https://stream.nightride.fm/chillsynth.mp3',
                'http://stream.nightride.fm/chillsynth.mp3'
            ]
        },
        { 
            name: 'DATAWAVE', 
            urls: [
                'https://stream.nightride.fm/datawave.mp3',
                'http://stream.nightride.fm/datawave.mp3'
            ]
        },
        { 
            name: 'SPACED OUT', 
            urls: [
                'https://stream.nightride.fm/spaced.mp3',
                'http://stream.nightride.fm/spaced.mp3'
            ]
        }
    ];

    const [stationIndex, setStationIndex] = useState(0);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        // Set volume
        audio.volume = volume;
        
        // Firefox-specific optimizations
        audio.setAttribute('preload', 'auto');
        audio.load(); // Force load for Firefox compatibility

        // Event Listeners for smooth UI
        const onPlay = () => {
            setIsPlaying(true);
            setIsLoading(false);
            setError(false);
        };
        const onPause = () => setIsPlaying(false);
        const onWaiting = () => setIsLoading(true); // Buffering
        const onPlaying = () => setIsLoading(false); // Resumed
        const onCanPlay = () => setIsLoading(false); // Ready to play
        const onLoadStart = () => setIsLoading(true); // Loading started
        const onError = (e) => {
            console.error("Stream Error", e);
            setIsPlaying(false);
            setIsLoading(false);
            setError(true);
        };
        
        // Stalled event for network issues
        const onStalled = () => {
            console.warn("Stream stalled, attempting to resume...");
            setIsLoading(true);
        };

        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);
        audio.addEventListener('waiting', onWaiting);
        audio.addEventListener('playing', onPlaying);
        audio.addEventListener('canplay', onCanPlay);
        audio.addEventListener('loadstart', onLoadStart);
        audio.addEventListener('error', onError);
        audio.addEventListener('stalled', onStalled);

        return () => {
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('pause', onPause);
            audio.removeEventListener('waiting', onWaiting);
            audio.removeEventListener('playing', onPlaying);
            audio.removeEventListener('canplay', onCanPlay);
            audio.removeEventListener('loadstart', onLoadStart);
            audio.removeEventListener('error', onError);
            audio.removeEventListener('stalled', onStalled);
        };
    }, [volume, stationIndex, isPlaying]);

    const changeStation = async (index, urlIndex = 0) => {
        setStationIndex(index);
        const audio = audioRef.current;
        if (!audio || !STATIONS[index]) return;
        
        setIsLoading(true);
        setError(false);
        
        // Try current URL, fallback to others if it fails
        const station = STATIONS[index];
        const currentUrl = station.urls ? station.urls[urlIndex] : station.url;
        
        // Pause and reset before changing source
        audio.pause();
        audio.src = '';
        
        // Small delay to ensure reset
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Set new source
        audio.src = currentUrl;
        
        // Firefox requires load() after setting src
        audio.load();
        
        try {
            // Wait a bit for Firefox to process
            await new Promise(resolve => setTimeout(resolve, 200));
            await audio.play();
            setIsPlaying(true);
        } catch (e) {
            console.error("Play failed for URL", urlIndex, e);
            // Try fallback URL if available
            if (station.urls && urlIndex < station.urls.length - 1) {
                console.log("Trying fallback URL...");
                setTimeout(() => changeStation(index, urlIndex + 1), 500);
            } else {
                setIsPlaying(false);
                setError(true);
            }
        }
    };

    const togglePlay = async () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
        } else {
            // Initial Load
            if (!audio.src) {
                const station = STATIONS[stationIndex];
                const url = station.urls ? station.urls[0] : station.url;
                audio.src = url;
                // Firefox requires load() after setting src
                audio.load();
            }
            
            try {
                setIsLoading(true);
                setError(false);
                
                // Small delay for Firefox to initialize
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Attempt play - requires user interaction in most browsers
                const playPromise = audio.play();
                
                if (playPromise !== undefined) {
                    await playPromise;
                    setIsPlaying(true);
                }
            } catch (err) {
                if (err.name !== 'AbortError' && err.name !== 'NotAllowedError') {
                    console.error("Playback failed:", err);
                    // Try fallback URL if available
                    const station = STATIONS[stationIndex];
                    if (station.urls && station.urls.length > 1 && audio.src === station.urls[0]) {
                        console.log("Trying fallback stream...");
                        audio.src = station.urls[1];
                        audio.load();
                        setTimeout(async () => {
                            try {
                                await audio.play();
                                setIsPlaying(true);
                            } catch (e2) {
                                console.error("Fallback also failed:", e2);
                                setError(true);
                                setIsLoading(false);
                            }
                        }, 200);
                    } else {
                        setError(true);
                        setIsLoading(false);
                    }
                } else {
                    setIsLoading(false);
                    // NotAllowedError usually means user interaction needed - that's OK
                }
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
            {/* HIDDEN AUDIO ELEMENT - Firefox optimized */}
            <audio 
                ref={audioRef} 
                preload="auto"
                crossOrigin="anonymous"
                playsInline
            />

            {/* EXPANDED PLAYER */}
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
                            background: isPlaying ? '#05ffa1' : (isLoading ? '#fcee0c' : '#555'),
                            boxShadow: isPlaying ? '0 0 10px #05ffa1' : 'none',
                            animation: isLoading ? 'pulse 1s infinite' : 'none'
                        }}></div>
                    </div>

                    <div style={{ fontSize: '10px', color: '#888', marginBottom: '16px' }}>
                        {isLoading ? 'TUNING FREQUENCY...' : (isPlaying ? (STATIONS[stationIndex].urls?.[0]?.includes('nightride') || STATIONS[stationIndex].url?.includes('nightride') ? 'BROADCASTING LIVE' : 'SIGNAL LOCKED') : (error ? 'CONNECTION ERROR' : 'OFFLINE'))}
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
