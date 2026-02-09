'use client';

import { useState, useEffect, useRef } from 'react';
import { radioEvents, radioControl } from '../../utils/audioEngine';

const STATIONS = [
    { id: 'post-rock', name: 'Post-Rock', type: 'youtube', videoId: 'lS7_N085v9Y', label: '🪐 POST-ROCK' },
    { id: 'kexp', name: 'KEXP 90.3', type: 'stream', url: 'https://kexp-mp3-128.streamguys1.com/kexp128.mp3', label: '🎧 KEXP SEATTLE' },
    { id: 'lofi', name: 'Lo-Fi', type: 'youtube', videoId: 'jfKfPfyJRdk', label: '☕ LO-FI GIRL' },
    { id: 'synthwave', name: 'Synthwave', type: 'youtube', videoId: '4xDzrJKXOOY', label: '🌆 SYNTHWAVE' }
];

const POST_ROCK_POOL = [
    'lS7_N085v9Y', 'HKFDYdaSyEg', '_F2w61v_5bI', 'l9bW5Qj3v4k', 'c5X7M-y0VpE',
    'tK1p9y_L7p4', 'aB8g0_q2yE4', 'rX0s9_a3vF2', '_mGUE_f_y-I', '1-SHowSjt-I',
    'X9K5mD8fFkI', '2-0Y9x6kY7Q', '8pA_E-jC9S8', 'v9_C2L2v6kI', 'lK7j9_x2zP1',
    'm9_B5L-kP7A', 'jT_R8v_C9S1', 'wT_B5f_K8l2', 'rT_B8f_G9j1', 'bT_R9v_C1l0'
];

export default function VoidRadio() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [stationId, setStationId] = useState('post-rock');
    const [isExpanded, setIsExpanded] = useState(false);
    const [volume, setVolume] = useState(0.5);
    const [isMuted, setIsMuted] = useState(false);
    const [postRockIdx, setPostRockIdx] = useState(0);

    const playerRef = useRef(null); // YouTube Player
    const audioRef = useRef(null); // Direct Stream Player
    const youtubeReady = useRef(false);

    // CRITICAL: Use a ref for stationId to avoid stale closures in YouTube Events
    const stationIdRef = useRef(stationId);
    useEffect(() => { stationIdRef.current = stationId; }, [stationId]);

    // Initial Audio Setup
    useEffect(() => {
        if (typeof window === 'undefined') return;
        audioRef.current = new Audio();
        audioRef.current.crossOrigin = 'anonymous';

        const onAudioPlay = () => { setIsPlaying(true); setIsLoading(false); setError(null); };
        const onAudioPause = () => setIsPlaying(false);
        const onAudioWaiting = () => setIsLoading(true);
        const onAudioError = (e) => {
            console.error('Direct Stream Error:', e);
            setError('STREAM OFFLINE');
            setIsLoading(false);
            setIsPlaying(false);
        };

        audioRef.current.addEventListener('playing', onAudioPlay);
        audioRef.current.addEventListener('pause', onAudioPause);
        audioRef.current.addEventListener('waiting', onAudioWaiting);
        audioRef.current.addEventListener('error', onAudioError);

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = "";
                audioRef.current.removeEventListener('playing', onAudioPlay);
                audioRef.current.removeEventListener('pause', onAudioPause);
                audioRef.current.removeEventListener('waiting', onAudioWaiting);
                audioRef.current.removeEventListener('error', onAudioError);
            }
        };
    }, []);

    // 1. Load YouTube API Script (Once)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }
    }, []);

    // 2. Initialize YouTube Player (Once YT is ready)
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const initPlayer = () => {
            if (playerRef.current) return;
            if (!document.getElementById('youtube-ghost-player')) return;

            playerRef.current = new window.YT.Player('youtube-ghost-player', {
                height: '1',
                width: '1',
                playerVars: {
                    autoplay: 0,
                    controls: 0,
                    disablekb: 1,
                    fs: 0,
                    iv_load_policy: 3,
                    modestbranding: 1,
                    rel: 0,
                    showinfo: 0,
                    origin: window.location.origin
                },
                events: {
                    onReady: (event) => {
                        youtubeReady.current = true;
                        event.target.setVolume(volume * 100);
                        if (isMuted) event.target.mute();
                    },
                    onError: (event) => {
                        console.error('Radio Engine Error (YT):', event.data);
                        setIsLoading(false);
                        setIsPlaying(false);
                    },
                    onStateChange: (event) => {
                        const currentStation = STATIONS.find(s => s.id === stationIdRef.current);
                        if (!currentStation || currentStation.type !== 'youtube') return;

                        if (event.data === window.YT.PlayerState.PLAYING) {
                            setIsPlaying(true);
                            setIsLoading(false);
                            setError(null);
                        } else if (event.data === window.YT.PlayerState.BUFFERING) {
                            setIsLoading(true);
                        } else if (event.data === window.YT.PlayerState.ENDED) {
                            event.target.playVideo();
                        } else {
                            setIsPlaying(false);
                            setIsLoading(false);
                        }
                    }
                }
            });
        };

        if (window.YT && window.YT.Player) {
            initPlayer();
        } else {
            window.onYouTubeIframeAPIReady = initPlayer;
        }
    }, []);

    // 3. Sync Volume & Mute Changes
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (audioRef.current) {
            audioRef.current.volume = volume;
            audioRef.current.muted = isMuted;
        }
        if (youtubeReady.current && playerRef.current && playerRef.current.setVolume) {
            playerRef.current.setVolume(volume * 100);
            if (isMuted) playerRef.current.mute();
            else playerRef.current.unMute();
        }
    }, [volume, isMuted]);

    // 4. Handle Remote Controls & State Broadcasting
    useEffect(() => {
        const syncState = () => {
            radioControl.emitState({
                isPlaying,
                isLoading,
                station: STATIONS.find(s => s.id === stationId),
                volume
            });
        };

        const handleToggle = () => togglePlay();

        const handleNext = () => {
            const nextIdx = (STATIONS.findIndex(s => s.id === stationId) + 1) % STATIONS.length;
            changeStation(STATIONS[nextIdx].id);
        };

        const handleVolume = (e) => setVolume(e.detail);
        const handleMute = (e) => setIsMuted(e.detail);

        if (radioEvents) {
            radioEvents.addEventListener('RADIO_TOGGLE', handleToggle);
            radioEvents.addEventListener('RADIO_NEXT', handleNext);
            radioEvents.addEventListener('RADIO_SET_VOLUME', handleVolume);
            radioEvents.addEventListener('RADIO_SET_MUTED', handleMute);
            radioEvents.addEventListener('RADIO_REQUEST_STATE', syncState);
        }

        syncState();

        return () => {
            if (radioEvents) {
                radioEvents.removeEventListener('RADIO_TOGGLE', handleToggle);
                radioEvents.removeEventListener('RADIO_NEXT', handleNext);
                radioEvents.removeEventListener('RADIO_SET_VOLUME', handleVolume);
                radioEvents.removeEventListener('RADIO_SET_MUTED', handleMute);
                radioEvents.removeEventListener('RADIO_REQUEST_STATE', syncState);
            }
        };
    }, [isPlaying, isLoading, stationId, volume]);

    const togglePlay = () => {
        const station = STATIONS.find(s => s.id === stationId);
        if (!station) return;
        setError(null);

        if (isPlaying) {
            if (station.type === 'stream' && audioRef.current) {
                audioRef.current.pause();
            } else if (station.type === 'youtube' && youtubeReady.current) {
                playerRef.current.pauseVideo();
            }
        } else {
            if (station.type === 'stream' && audioRef.current) {
                if (!audioRef.current.src) audioRef.current.src = station.url;
                audioRef.current.play().catch(e => {
                    console.error("Playback blocked:", e);
                    setError('CLICK TO UNMUTE');
                });
            } else if (station.type === 'youtube' && youtubeReady.current) {
                try {
                    playerRef.current.playVideo();
                    setError(null);
                } catch (e) {
                    setError('CLICK TO UNMUTE');
                }
            }
        }
    };

    const changeStation = (id) => {
        const station = STATIONS.find(s => s.id === id);
        if (!station) return;

        // If clicking Post-Rock again while playing, shuffle!
        if (id === 'post-rock' && stationId === 'post-rock' && youtubeReady.current) {
            const nextIdx = (postRockIdx + 1) % POST_ROCK_POOL.length;
            setPostRockIdx(nextIdx);
            playerRef.current.loadVideoById(POST_ROCK_POOL[nextIdx]);
            playerRef.current.playVideo();
            setIsLoading(true);
            setError(null);
            return;
        }

        setIsLoading(true);
        setError(null);

        // Stop current
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
        }
        if (youtubeReady.current && playerRef.current) {
            playerRef.current.stopVideo();
        }

        setStationId(id);

        if (station.type === 'stream') {
            audioRef.current.src = station.url;
            audioRef.current.load();
            audioRef.current.play().catch(e => {
                setError('CLICK TO UNMUTE');
            });
        } else if (station.type === 'youtube' && youtubeReady.current) {
            const vid = id === 'post-rock' ? POST_ROCK_POOL[postRockIdx] : station.videoId;
            playerRef.current.loadVideoById(vid);
            playerRef.current.playVideo();
        }
    };

    return (
        <div className="void-radio-root">
            <div id="youtube-ghost-player" className="ghost-container"></div>

            <div className={`radio-ui-container ${isExpanded ? 'expanded' : ''}`}>
                {isExpanded && (
                    <div className="radio-expanded-card">
                        <div className="card-header">
                            <span className="status-indicator">
                                {error ? error : isLoading ? 'BUFFERING...' : isPlaying ? 'LIVE' : 'OFFLINE'}
                            </span>
                            <div className={`status-dot ${isPlaying ? 'active' : isLoading ? 'loading' : error ? 'error' : ''}`} />
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
                                disabled={isLoading && !isPlaying}
                            >
                                {isLoading ? '...' : isPlaying ? 'PAUSE' : 'PLAY'}
                            </button>
                            <input
                                type="range"
                                min="0" max="1" step="0.05"
                                value={volume}
                                onChange={(e) => setVolume(parseFloat(e.target.value))}
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
                .void-radio-root { position: fixed; bottom: 40px; right: 24px; z-index: 1000; display: flex; flex-direction: column; align-items: flex-end; pointer-events: none; }
                .ghost-container { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; visibility: hidden; }
                .radio-ui-container { display: flex; flex-direction: column; align-items: flex-end; pointer-events: auto; }
                .radio-toggle { background: rgba(10, 10, 10, 0.4); border: 1px solid rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.5); padding: 10px 24px; border-radius: 50px; cursor: pointer; font-size: 11px; font-weight: 800; letter-spacing: 2px; transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1); display: flex; align-items: center; gap: 10px; backdrop-filter: blur(10px); box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3); }
                .radio-toggle:hover { color: #fff; border-color: rgba(255, 255, 255, 0.3); transform: translateY(-2px); }
                .radio-toggle.playing { color: #fff; border-color: rgba(255, 255, 255, 0.2); background: rgba(255, 255, 255, 0.05); }
                .radio-expanded-card { background: rgba(15, 15, 15, 0.7); backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; padding: 24px; width: 280px; margin-bottom: 20px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
                .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                .status-indicator { font-size: 9px; font-weight: 900; letter-spacing: 1.5px; color: rgba(255, 255, 255, 0.4); }
                .status-dot { width: 6px; height: 6px; border-radius: 50%; background: #333; }
                .status-dot.active { background: #fff; box-shadow: 0 0 10px #fff; }
                .status-dot.loading { background: #555; animation: pulse 1s infinite; }
                .status-dot.error { background: #ff453a; box-shadow: 0 0 10px #ff453a; }
                .station-selector { display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; }
                .station-btn { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); color: rgba(255, 255, 255, 0.4); padding: 12px; border-radius: 12px; text-align: left; font-size: 10px; font-weight: 700; letter-spacing: 1px; cursor: pointer; transition: all 0.2s; }
                .station-btn:hover { background: rgba(255, 255, 255, 0.08); color: #fff; }
                .station-btn.active { background: rgba(255, 255, 255, 0.1); border-color: rgba(255, 255, 255, 0.2); color: #fff; }
                .card-controls { display: flex; gap: 12px; align-items: center; }
                .play-btn { flex: 1; background: #fff; color: #000; border: none; padding: 10px; border-radius: 10px; font-size: 10px; font-weight: 900; letter-spacing: 1px; cursor: pointer; transition: transform 0.2s; }
                .play-btn:hover { transform: scale(1.02); }
                .play-btn:disabled { opacity: 0.5; cursor: wait; }
                .volume-slider { width: 80px; accent-color: #fff; }
                .visualizer { display: flex; gap: 2px; height: 10px; align-items: flex-end; }
                .bar { width: 2px; background: #fff; border-radius: 1px; }
                .v1 { height: 100%; animation: bounce 0.5s infinite alternate; }
                .v2 { height: 60%; animation: bounce 0.4s infinite alternate-reverse; }
                .v3 { height: 80%; animation: bounce 0.6s infinite alternate; }
                @keyframes bounce { from { height: 20%; } to { height: 100%; } }
                @keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
                @keyframes slideUp { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @media (max-width: 768px) { .void-radio-root { display: none !important; } }
            `}</style>
        </div>
    );
}
