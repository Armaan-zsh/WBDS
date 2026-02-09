'use client';

import { useState, useEffect, useRef } from 'react';
import { radioEvents, radioControl } from '../../utils/audioEngine';

const STATIONS = [
    { id: 'post-rock', name: 'Post-Rock', videoId: 'f02mOEt18O4', label: '🪐 POST-ROCK' },
    { id: 'lofi', name: 'Lo-Fi', videoId: 'jfKfPfyJRdk', label: '☕ LO-FI' },
    { id: 'synthwave', name: 'Synthwave', videoId: '4xDzrJKXOOY', label: '🌆 SYNTHWAVE' }
];

export default function VoidRadio() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [stationId, setStationId] = useState('synthwave');
    const [isExpanded, setIsExpanded] = useState(false);
    const [volume, setVolume] = useState(0.5);
    const [isMuted, setIsMuted] = useState(false);

    const playerRef = useRef(null);
    const youtubeReady = useRef(false);

    // Initialize YouTube API
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Load YouTube API Script
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

            window.onYouTubeIframeAPIReady = () => {
                initPlayer();
            };
        } else {
            initPlayer();
        }

        function initPlayer() {
            // Check if element exists before initializing
            if (!document.getElementById('youtube-ghost-player')) return;

            const currentStation = STATIONS.find(s => s.id === stationId);
            playerRef.current = new window.YT.Player('youtube-ghost-player', {
                height: '1',
                width: '1',
                videoId: currentStation.videoId,
                playerVars: {
                    autoplay: 0,
                    controls: 0,
                    disablekb: 1,
                    fs: 0,
                    iv_load_policy: 3,
                    modestbranding: 1,
                    rel: 0,
                    showinfo: 0
                },
                events: {
                    onReady: (event) => {
                        youtubeReady.current = true;
                        event.target.setVolume(volume * 100);
                        if (isMuted) event.target.mute();
                        syncState();
                    },
                    onStateChange: (event) => {
                        // YT.PlayerState.PLAYING = 1, BUFFERING = 3
                        if (event.data === window.YT.PlayerState.PLAYING) {
                            setIsPlaying(true);
                            setIsLoading(false);
                        } else if (event.data === window.YT.PlayerState.BUFFERING) {
                            setIsLoading(true);
                        } else {
                            setIsPlaying(false);
                            setIsLoading(false);
                        }
                        syncState();
                    }
                }
            });
        }

        const syncState = () => {
            radioControl.emitState({
                isPlaying: isPlaying,
                isLoading: isLoading,
                station: STATIONS.find(s => s.id === stationId),
                volume: volume
            });
        };

        // Remote Controls
        const handleToggle = () => {
            if (!youtubeReady.current) return;
            if (isPlaying) playerRef.current.pauseVideo();
            else playerRef.current.playVideo();
        };
        const handleNext = () => {
            const nextIdx = (STATIONS.findIndex(s => s.id === stationId) + 1) % STATIONS.length;
            changeStation(STATIONS[nextIdx].id);
        };
        const handleVolume = (e) => {
            const newVol = e.detail;
            setVolume(newVol);
            if (youtubeReady.current) playerRef.current.setVolume(newVol * 100);
        };
        const handleMute = (e) => {
            const mute = e.detail;
            setIsMuted(mute);
            if (youtubeReady.current) {
                if (mute) playerRef.current.mute();
                else playerRef.current.unMute();
            }
        };

        if (radioEvents) {
            radioEvents.addEventListener('RADIO_TOGGLE', handleToggle);
            radioEvents.addEventListener('RADIO_NEXT', handleNext);
            radioEvents.addEventListener('RADIO_SET_VOLUME', handleVolume);
            radioEvents.addEventListener('RADIO_SET_MUTED', handleMute);
            radioEvents.addEventListener('RADIO_REQUEST_STATE', syncState);
        }

        return () => {
            if (radioEvents) {
                radioEvents.removeEventListener('RADIO_TOGGLE', handleToggle);
                radioEvents.removeEventListener('RADIO_NEXT', handleNext);
                radioEvents.removeEventListener('RADIO_SET_VOLUME', handleVolume);
                radioEvents.removeEventListener('RADIO_SET_MUTED', handleMute);
                radioEvents.removeEventListener('RADIO_REQUEST_STATE', syncState);
            }
        };
    }, [stationId, isPlaying, isLoading, volume, isMuted]);

    const togglePlay = () => {
        if (!youtubeReady.current) return;
        if (isPlaying) {
            playerRef.current.pauseVideo();
        } else {
            playerRef.current.playVideo();
        }
    };

    const changeStation = (id) => {
        const station = STATIONS.find(s => s.id === id);
        if (!station || !youtubeReady.current) return;

        setStationId(id);
        setIsLoading(true);
        playerRef.current.loadVideoById(station.videoId);
    };

    return (
        <div className="void-radio-root">
            {/* THE GHOST PLAYER CONTAINER */}
            <div id="youtube-ghost-player" className="ghost-container"></div>

            <div className={`radio-ui-container ${isExpanded ? 'expanded' : ''}`}>
                {isExpanded && (
                    <div className="radio-expanded-card">
                        <div className="card-header">
                            <span className="status-indicator">
                                {isLoading ? 'BUFFERING...' : isPlaying ? 'LIVE' : 'OFFLINE'}
                            </span>
                            <div className={`status-dot ${isPlaying ? 'active' : isLoading ? 'loading' : ''}`} />
                        </div>

                        <div className="station-selector">
                            {STATIONS.map(s => (
                                <button
                                    key={s.id}
                                    className={`station-btn ${stationId === s.id ? 'active' : ''}`}
                                    onClick={() => changeStation(s.id)}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>

                        <div className="card-controls">
                            <button
                                className="play-btn"
                                onClick={togglePlay}
                                disabled={isLoading}
                            >
                                {isLoading ? '...' : isPlaying ? 'PAUSE' : 'PLAY'}
                            </button>
                            <input
                                type="range"
                                min="0" max="1" step="0.05"
                                value={volume}
                                onChange={(e) => {
                                    const v = parseFloat(e.target.value);
                                    setVolume(v);
                                    if (youtubeReady.current) playerRef.current.setVolume(v * 100);
                                }}
                                className="volume-slider"
                            />
                        </div>
                    </div>
                )}

                <button
                    className={`radio-toggle ${isPlaying ? 'playing' : ''}`}
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <span className="radio-label">RADIO</span>
                    {isPlaying && (
                        <div className="visualizer">
                            <div className="bar v1" />
                            <div className="bar v2" />
                            <div className="bar v3" />
                        </div>
                    )}
                </button>
            </div>

            <style jsx>{`
                .void-radio-root {
                    position: fixed;
                    bottom: 40px;
                    right: 24px;
                    z-index: 1000;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    pointer-events: none;
                }

                .ghost-container {
                    position: absolute;
                    width: 1px;
                    height: 1px;
                    opacity: 0;
                    pointer-events: none;
                    visibility: hidden;
                }

                .radio-ui-container {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    pointer-events: auto;
                }

                .radio-toggle {
                    background: rgba(10, 10, 10, 0.4);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: rgba(255, 255, 255, 0.5);
                    padding: 10px 24px;
                    border-radius: 50px;
                    cursor: pointer;
                    font-size: 11px;
                    font-weight: 800;
                    letter-spacing: 2px;
                    transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    backdrop-filter: blur(10px);
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                }

                .radio-toggle:hover {
                    color: #fff;
                    border-color: rgba(255, 255, 255, 0.3);
                    transform: translateY(-2px);
                }

                .radio-toggle.playing {
                    color: #fff;
                    border-color: rgba(255, 255, 255, 0.2);
                    background: rgba(255, 255, 255, 0.05);
                }

                .radio-expanded-card {
                    background: rgba(15, 15, 15, 0.7);
                    backdrop-filter: blur(40px);
                    -webkit-backdrop-filter: blur(40px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    padding: 24px;
                    width: 280px;
                    margin-bottom: 20px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                    animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }

                .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .status-indicator {
                    font-size: 9px;
                    font-weight: 900;
                    letter-spacing: 1.5px;
                    color: rgba(255, 255, 255, 0.4);
                }

                .status-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: #333;
                }

                .status-dot.active {
                    background: #fff;
                    box-shadow: 0 0 10px #fff;
                }

                .status-dot.loading {
                    background: #555;
                    animation: pulse 1s infinite;
                }

                .station-selector {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    margin-bottom: 24px;
                }

                .station-btn {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    color: rgba(255, 255, 255, 0.4);
                    padding: 12px;
                    border-radius: 12px;
                    text-align: left;
                    font-size: 10px;
                    font-weight: 700;
                    letter-spacing: 1px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .station-btn:hover {
                    background: rgba(255, 255, 255, 0.08);
                    color: #fff;
                }

                .station-btn.active {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: rgba(255, 255, 255, 0.2);
                    color: #fff;
                }

                .card-controls {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                }

                .play-btn {
                    flex: 1;
                    background: #fff;
                    color: #000;
                    border: none;
                    padding: 10px;
                    border-radius: 10px;
                    font-size: 10px;
                    font-weight: 900;
                    letter-spacing: 1px;
                    cursor: pointer;
                    transition: transform 0.2s;
                }

                .play-btn:hover {
                    transform: scale(1.02);
                }

                .play-btn:disabled {
                    opacity: 0.5;
                    cursor: wait;
                }

                .volume-slider {
                    width: 80px;
                    accent-color: #fff;
                }

                .visualizer {
                    display: flex;
                    gap: 2px;
                    height: 10px;
                    align-items: flex-end;
                }

                .bar {
                    width: 2px;
                    background: #fff;
                    border-radius: 1px;
                }

                .v1 { height: 100%; animation: bounce 0.5s infinite alternate; }
                .v2 { height: 60%; animation: bounce 0.4s infinite alternate-reverse; }
                .v3 { height: 80%; animation: bounce 0.6s infinite alternate; }

                @keyframes bounce {
                    from { height: 20%; }
                    to { height: 100%; }
                }

                @keyframes pulse {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 1; }
                }

                @keyframes slideUp {
                    from { transform: translateY(10px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                @media (max-width: 768px) {
                    .void-radio-root {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
