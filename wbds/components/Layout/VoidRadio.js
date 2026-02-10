'use client';

import { useState, useEffect, useRef } from 'react';
import { radioEvents, radioControl } from '../../utils/audioEngine';

const STATIONS = [
    { id: 'kexp', name: 'KEXP 90.3', type: 'stream', url: 'https://kexp-mp3-128.streamguys1.com/kexp128.mp3', label: '🎧 KEXP SEATTLE' },
    { id: 'lofi', name: 'Lo-Fi', type: 'youtube', videoId: 'jfKfPfyJRdk', label: '☕ LO-FI GIRL' },
    { id: 'synthwave', name: 'Synthwave', type: 'youtube', videoId: '4xDzrJKXOOY', label: '🌆 SYNTHWAVE' }
];

export default function VoidRadio() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [stationId, setStationId] = useState('kexp');
    const [isExpanded, setIsExpanded] = useState(false);
    const [volume, setVolume] = useState(0.5);
    const [isMuted, setIsMuted] = useState(false);
    const [nowPlaying, setNowPlaying] = useState(null);
    const [isRainy, setIsRainy] = useState(false);
    const [isThundery, setIsThundery] = useState(false);

    // Core Logic Refs
    const playerRef = useRef(null);
    const audioRef = useRef(null);
    const youtubeReady = useRef(false);
    const lastPlayerState = useRef(-1);

    // Ambiance Refs (isolated Web Audio context)
    const ambiCtxRef = useRef(null);
    const rainNodeRef = useRef(null);
    const rainGainRef = useRef(null);
    const thunderGainRef = useRef(null);
    const thunderIntervalRef = useRef(null);

    // Track stationId to avoid closures
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

            const initialVid = STATIONS.find(s => s.type === 'youtube').videoId;

            playerRef.current = new window.YT.Player('youtube-ghost-player', {
                height: '10',
                width: '10',
                videoId: initialVid,
                playerVars: {
                    autoplay: 0,
                    controls: 0,
                    disablekb: 1,
                    fs: 0,
                    iv_load_policy: 3,
                    modestbranding: 1,
                    rel: 0,
                    showinfo: 0,
                    origin: window.location.origin,
                    enablejsapi: 1
                },
                events: {
                    onReady: (event) => {
                        youtubeReady.current = true;
                        event.target.setVolume(volume * 100);
                        if (isMuted) event.target.mute();
                    },
                    onError: (event) => {
                        console.error('Radio Engine Error (YT):', event.data);
                        setError(`PLAYER ERROR ${event.data}`);
                        setIsLoading(false);
                        setIsPlaying(false);
                    },
                    onStateChange: (event) => {
                        const newState = event.data;
                        lastPlayerState.current = newState;

                        // Atomic State Machine
                        switch (newState) {
                            case window.YT.PlayerState.PLAYING:
                                setIsPlaying(true);
                                setIsLoading(false);
                                setError(null);
                                break;
                            case window.YT.PlayerState.BUFFERING:
                                setIsLoading(true);
                                break;
                            case window.YT.PlayerState.ENDED:
                                event.target.playVideo();
                                break;
                            case window.YT.PlayerState.PAUSED:
                                setIsPlaying(false);
                                setIsLoading(false);
                                break;
                            default:
                                break;
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
        const v = isMuted ? 0 : volume;
        if (audioRef.current) {
            audioRef.current.volume = v;
            audioRef.current.muted = isMuted;
        }
        if (youtubeReady.current && playerRef.current && playerRef.current.setVolume) {
            playerRef.current.setVolume(v * 100);
            if (isMuted) playerRef.current.mute();
            else playerRef.current.unMute();
        }
        // Sync ambiance volume
        if (rainGainRef.current) rainGainRef.current.gain.setTargetAtTime(isRainy ? v * 0.5 : 0, ambiCtxRef.current?.currentTime || 0, 0.1);
        if (thunderGainRef.current) thunderGainRef.current.gain.setTargetAtTime(isThundery ? v * 0.7 : 0, ambiCtxRef.current?.currentTime || 0, 0.1);
    }, [volume, isMuted, isRainy, isThundery]);

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

    // 5. Buffer Timeout Recovery
    useEffect(() => {
        if (!isLoading) return;

        const timeout = setTimeout(() => {
            if (isLoading) {
                console.warn('Playback hang detected.');
                setError('LINK STRETCHED... TRY ANOTHER');
                setIsLoading(false);
                setIsPlaying(false);
            }
        }, 15000); // 15s threshold

        return () => clearTimeout(timeout);
    }, [isLoading, stationId]);

    // 6. Poll KEXP Metadata
    useEffect(() => {
        if (stationId !== 'kexp') {
            setNowPlaying(null);
            return;
        }

        const fetchMeta = async () => {
            try {
                const res = await fetch('https://api.kexp.org/v2/plays/?limit=1');
                const data = await res.json();
                if (data.results && data.results.length > 0) {
                    const play = data.results[0];
                    setNowPlaying({
                        artist: play.artist,
                        song: play.song,
                        album: play.album,
                        image: play.thumbnail_uri
                    });
                }
            } catch (e) {
                console.error('KEXP Meta Error:', e);
            }
        };

        fetchMeta();
        const interval = setInterval(fetchMeta, 30000); // 30s polling
        return () => clearInterval(interval);
    }, [stationId]);

    // 7. Procedural Ambiance Engine (isolated AudioContext)
    const initAmbiCtx = () => {
        if (ambiCtxRef.current) return;
        const AC = window.AudioContext || window.webkitAudioContext;
        ambiCtxRef.current = new AC();

        // Rain gain node
        rainGainRef.current = ambiCtxRef.current.createGain();
        rainGainRef.current.gain.value = 0;
        rainGainRef.current.connect(ambiCtxRef.current.destination);

        // Thunder gain node
        thunderGainRef.current = ambiCtxRef.current.createGain();
        thunderGainRef.current.gain.value = 0;
        thunderGainRef.current.connect(ambiCtxRef.current.destination);
    };

    // Rain: looped brown noise through a lowpass filter
    useEffect(() => {
        if (stationId === 'kexp') return;
        if (!isRainy) {
            if (rainNodeRef.current) { try { rainNodeRef.current.stop(); } catch (e) { } rainNodeRef.current = null; }
            if (rainGainRef.current) rainGainRef.current.gain.setTargetAtTime(0, ambiCtxRef.current?.currentTime || 0, 0.1);
            return;
        }

        initAmbiCtx();
        if (ambiCtxRef.current.state === 'suspended') ambiCtxRef.current.resume();

        const ctx = ambiCtxRef.current;
        const bufferSize = ctx.sampleRate * 4;
        const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);

        // Generate brown noise for rain
        for (let ch = 0; ch < 2; ch++) {
            const data = buffer.getChannelData(ch);
            let lastOut = 0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                lastOut = (lastOut + (0.02 * white)) / 1.02;
                data[i] = lastOut * 3.5;
            }
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;

        source.connect(filter);
        filter.connect(rainGainRef.current);

        const v = isMuted ? 0 : volume;
        rainGainRef.current.gain.setTargetAtTime(v * 0.5, ctx.currentTime, 0.3);
        source.start();
        rainNodeRef.current = source;

        return () => { try { source.stop(); } catch (e) { } };
    }, [isRainy, stationId]);

    // Thunder: random burst strikes
    useEffect(() => {
        if (stationId === 'kexp') return;
        if (!isThundery) {
            if (thunderGainRef.current) thunderGainRef.current.gain.setTargetAtTime(0, ambiCtxRef.current?.currentTime || 0, 0.1);
            clearTimeout(thunderIntervalRef.current);
            return;
        }

        initAmbiCtx();
        if (ambiCtxRef.current.state === 'suspended') ambiCtxRef.current.resume();

        const ctx = ambiCtxRef.current;
        const v = isMuted ? 0 : volume;

        const strike = () => {
            // Create a short burst of filtered noise for thunder
            const len = ctx.sampleRate * (1.5 + Math.random() * 2);
            const buf = ctx.createBuffer(1, len, ctx.sampleRate);
            const data = buf.getChannelData(0);
            for (let i = 0; i < len; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
            }

            const src = ctx.createBufferSource();
            src.buffer = buf;

            const lp = ctx.createBiquadFilter();
            lp.type = 'lowpass';
            lp.frequency.value = 150 + Math.random() * 100;

            src.connect(lp);
            lp.connect(thunderGainRef.current);
            thunderGainRef.current.gain.setTargetAtTime(v * 0.7, ctx.currentTime, 0.05);
            src.start();

            // Schedule next strike randomly (8-25s)
            thunderIntervalRef.current = setTimeout(strike, 8000 + Math.random() * 17000);
        };

        strike();
        return () => clearTimeout(thunderIntervalRef.current);
    }, [isThundery, stationId]);

    // 8. Enforce KEXP no-ambience rule
    useEffect(() => {
        if (stationId !== 'kexp') return;
        if (isRainy) setIsRainy(false);
        if (isThundery) setIsThundery(false);
    }, [stationId]);

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
            } else if (station.type === 'youtube' && !youtubeReady.current) {
                setError('API LOADING...');
            }
        }
    };

    const changeStation = (id) => {
        const station = STATIONS.find(s => s.id === id);
        if (!station) return;

        setIsLoading(true);
        setError(null);

        // Cross-fade out
        if (audioRef.current) {
            audioRef.current.volume = 0;
        }
        if (youtubeReady.current && playerRef.current?.setVolume) {
            playerRef.current.setVolume(0);
        }

        setTimeout(() => {
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
                playerRef.current.loadVideoById(station.videoId);
                playerRef.current.playVideo();
            } else {
                setError('API LOADING...');
            }

            // Sync volume back
            const v = isMuted ? 0 : volume;
            if (audioRef.current) audioRef.current.volume = v;
            if (youtubeReady.current && playerRef.current?.setVolume) {
                playerRef.current.setVolume(v * 100);
            }
        }, 500);
    };

    const handleToggleRain = () => {
        if (stationId === 'kexp') return;
        setIsRainy(prev => !prev);
    };

    const handleToggleThunder = () => {
        if (stationId === 'kexp') return;
        setIsThundery(prev => !prev);
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

                        {nowPlaying && (
                            <div className="now-playing-info">
                                <div className="track-meta">
                                    <span className="artist">{nowPlaying.artist}</span>
                                    <span className="song">{nowPlaying.song}</span>
                                </div>
                                {nowPlaying.image && <img src={nowPlaying.image} alt="album" className="album-art" />}
                            </div>
                        )}

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

                        {stationId !== 'kexp' && (
                            <div className="ambient-toggles">
                                <button
                                    className={`ambient-btn ${isRainy ? 'active' : ''}`}
                                    onClick={handleToggleRain}
                                >
                                    🌧️ RAIN
                                </button>
                                <button
                                    className={`ambient-btn ${isThundery ? 'active' : ''}`}
                                    onClick={handleToggleThunder}
                                >
                                    ⚡ THUNDER
                                </button>
                            </div>
                        )}

                        <div className="card-controls">
                            <button
                                className="play-btn"
                                onClick={togglePlay}
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
                    <div className="visualizer">
                        <div className="bar v1" />
                        <div className="bar v2" />
                        <div className="bar v3" />
                    </div>
                    <span className="radio-label">RADIO</span>
                </button>
            </div>

            <style jsx>{`
                .void-radio-root { position: fixed; bottom: 40px; right: 24px; z-index: 1000; display: flex; flex-direction: column; align-items: flex-end; pointer-events: none; }
                .ghost-container { position: absolute; width: 10px; height: 10px; opacity: 0.1; pointer-events: none; }
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
                
                .now-playing-info { display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.05); padding: 12px; border-radius: 12px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.05); }
                .track-meta { flex: 1; display: flex; flex-direction: column; gap: 2px; overflow: hidden; }
                .artist { font-size: 8px; font-weight: 800; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 1px; }
                .song { font-size: 11px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .album-art { width: 32px; height: 32px; border-radius: 4px; object-fit: cover; }

                .station-selector { display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; }
                .station-btn { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); color: rgba(255, 255, 255, 0.4); padding: 12px; border-radius: 12px; text-align: left; font-size: 10px; font-weight: 700; letter-spacing: 1px; cursor: pointer; transition: all 0.2s; }
                .station-btn:hover { background: rgba(255, 255, 255, 0.08); color: #fff; }
                .station-btn.active { background: rgba(255, 255, 255, 0.1); border-color: rgba(255, 255, 255, 0.2); color: #fff; }
                
                .ambient-toggles { display: flex; gap: 8px; margin-bottom: 24px; }
                .ambient-btn { flex: 1; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); color: rgba(255,255,255,0.3); padding: 10px; border-radius: 10px; font-size: 9px; font-weight: 800; cursor: pointer; transition: all 0.2s; }
                .ambient-btn:hover { background: rgba(255,255,255,0.06); }
                .ambient-btn.active { background: rgba(255,255,255,0.1); color: #fff; border-color: rgba(255,255,255,0.2); }

                .card-controls { display: flex; gap: 12px; align-items: center; }
                .play-btn { flex: 1; background: #fff; color: #000; border: none; padding: 10px; border-radius: 10px; font-size: 10px; font-weight: 900; letter-spacing: 1px; cursor: pointer; transition: transform 0.2s; }
                .play-btn:hover { transform: scale(1.02); }
                .play-btn:disabled { opacity: 0.5; cursor: wait; }
                .volume-slider { width: 80px; accent-color: #fff; }
                
                .visualizer { display: flex; gap: 2px; height: 10px; align-items: flex-end; margin-right: 8px; }
                .bar { width: 2px; background: #fff; border-radius: 1px; opacity: 0.4; }
                .playing .bar { opacity: 1; }
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
