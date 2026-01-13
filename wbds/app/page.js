'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase'; // Import Supabase
import LetterComposer from '../components/Editor/LetterComposer';
import LetterFeed from '../components/Feed/LetterFeed';
import VoidNotification from '../components/Layout/VoidNotification';
import LetterModal from '../components/Feed/LetterModal';
import AppearancePanel from '../components/Settings/AppearancePanel';
import VoidClock from '../components/Layout/VoidClock';
import GalaxyBackground from '../components/Layout/GalaxyBackground';
import dynamic from 'next/dynamic';

const RealtimeGlobe = dynamic(() => import('../components/Live/RealtimeGlobe'), {
    ssr: false,
    loading: () => <div style={{ color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>Scanning Deep Space...</div>
});

export default function Home() {
    const [letters, setLetters] = useState([]);
    const [notification, setNotification] = useState(null);
    const [selectedLetter, setSelectedLetter] = useState(null);
    const [isDesktop, setIsDesktop] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const sidebarRef = useRef(null);
    const toggleBtnRef = useRef(null);

    const [view, setView] = useState('write'); // 'write', 'read', 'best'
    const [likedLetters, setLikedLetters] = useState(new Set()); // Local liked state
    const [myLetterIds, setMyLetterIds] = useState(new Set());

    // Simple responsive check
    useEffect(() => {
        const checkSize = () => {
            const desktop = window.innerWidth > 900;
            setIsDesktop(desktop);
            if (!desktop) setIsSidebarOpen(false); // Auto close on mobile
        };
        checkSize();
        window.addEventListener('resize', checkSize);
        return () => window.removeEventListener('resize', checkSize);
    }, []);

    // Handle Click Outside & ESC
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isSidebarOpen &&
                sidebarRef.current &&
                !sidebarRef.current.contains(event.target) &&
                toggleBtnRef.current &&
                !toggleBtnRef.current.contains(event.target)
            ) {
                setIsSidebarOpen(false);
            }
        };

        const handleEsc = (event) => {
            if (event.key === 'Escape') {
                setIsSidebarOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEsc);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEsc);
        };
    }, [isSidebarOpen]);

    // Load owned letters and liked letters logic
    useEffect(() => {
        const savedOwned = JSON.parse(localStorage.getItem('wbds_owned') || '[]');
        setMyLetterIds(new Set(savedOwned));

        const savedLikes = JSON.parse(localStorage.getItem('wbds_likes') || '[]');
        setLikedLetters(new Set(savedLikes));
    }, []);

    // Persist owned letters
    useEffect(() => {
        if (myLetterIds.size > 0) {
            localStorage.setItem('wbds_owned', JSON.stringify([...myLetterIds]));
        }
    }, [myLetterIds]);

    // Persist likes
    useEffect(() => {
        localStorage.setItem('wbds_likes', JSON.stringify([...likedLetters]));
    }, [likedLetters]);

    // Load letters from Supabase (Dynamic based on View)
    useEffect(() => {
        const fetchLetters = async () => {
            let data, error;

            if (view === 'best') {
                try {
                    const res = await fetch('/api/letters/best');
                    data = await res.json();
                    if (data.error) throw new Error(data.error);
                } catch (e) {
                    error = e;
                }
            } else {
                // Default 'read' view (Latest) AND 'write' view (for globe)
                const result = await supabase
                    .from('letters')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(50);
                data = result.data;
                error = result.error;
            }

            if (data) {
                // Normalize data for UI
                const formatted = data.map(l => ({
                    ...l,
                    timestamp: l.created_at // Map Supabase field to UI field
                }));
                setLetters(formatted);
            }
        };

        fetchLetters();

        // Realtime Subscription (Always Active)
        const channel = supabase
            .channel('public:letters')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'letters' }, (payload) => {
                const newLetter = {
                    ...payload.new,
                    timestamp: payload.new.created_at
                };
                setLetters(current => [newLetter, ...current]);
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'letters' }, (payload) => {
                setLetters(current => current.map(l =>
                    l.id === payload.new.id ? { ...l, likes: payload.new.likes } : l
                ));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [view]);

    const handleError = (message) => {
        setNotification({ message, type: 'error' });
    };

    const handleLetterSent = async (text, unlockAt) => {
        // Basic Spam Prevention (Cooldown)
        const lastSent = localStorage.getItem('wbds_last_sent');
        if (lastSent && Date.now() - parseInt(lastSent) < 30000) { // 30s cooldown
            handleError("You're writing too fast. Take a deep breath.");
            return;
        }

        try {
            const res = await fetch('/api/letters', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: text,
                    theme: 'default',
                    unlockAt: unlockAt ? unlockAt.toISOString() : null
                })
            });

            const data = await res.json();

            if (!res.ok) {
                // Rate limit or other error
                handleError(data.error || "The Void rejected your letter.");
                return;
            }

            const id = data.letter.id;

            // Mark as owned (Local Persistence)
            setMyLetterIds(prev => new Set(prev).add(id));
            localStorage.setItem('wbds_last_sent', Date.now());
        } catch (err) {
            handleError("Connection lost. The Void is unreachable.");
            return;
        }

        // Switch to Read View
        setTimeout(() => {
            setView('read');
        }, 10);
    };

    const handleLike = async (letterId) => {
        // Optimistic UI Update
        const isLiked = likedLetters.has(letterId);
        const delta = isLiked ? -1 : 1;

        // Update Local Set
        setLikedLetters(prev => {
            const next = new Set(prev);
            if (isLiked) next.delete(letterId);
            else next.add(letterId);
            return next;
        });

        // Update Letter Count in State
        setLetters(prev => prev.map(l =>
            l.id === letterId ? { ...l, likes: (l.likes || 0) + delta } : l
        ));

        // API Call
        try {
            const res = await fetch('/api/letters/like', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ letterId })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            // Sync with Server Truth
            setLetters(prev => prev.map(l =>
                l.id === letterId ? { ...l, likes: data.likes } : l
            ));

            // Sync Local Set with Server Truth
            setLikedLetters(prev => {
                const next = new Set(prev);
                if (data.liked) next.add(letterId);
                else next.delete(letterId);
                return next;
            });

        } catch (err) {
            handleError("Like failed. The void is indifferent.");
            setLikedLetters(prev => {
                const next = new Set(prev);
                if (isLiked) next.add(letterId);
                else next.delete(letterId);
                return next;
            });
            setLetters(prev => prev.map(l =>
                l.id === letterId ? { ...l, likes: (l.likes || 0) - delta } : l
            ));
        }
    };

    const handleDeleteLetter = async (id) => {
        if (window.confirm("Burn this letter forever?")) {
            setLetters(prev => prev.filter(l => l.id !== id));
            const { error } = await supabase.from('letters').delete().eq('id', id);
            if (error) {
                handleError("Could not burn letter. It refuses to die.");
            }
        }
    };

    return (
        <div className="app-layout">
            <GalaxyBackground />
            <VoidClock />
            <style jsx>{`
         .app-layout {
            display: flex;
            height: 100vh; /* Fixed height for viewport */
            overflow: hidden; /* Prevent body scroll */
            position: relative;
         }

          /* Sidebar is now an overlay/ghost element that doesn't push content */
          .sidebar {
             position: absolute;
             left: 0;
             top: 0;
             z-index: 10;
             opacity: ${isDesktop && isSidebarOpen ? 1 : 0};
             pointer-events: ${isDesktop && isSidebarOpen ? 'auto' : 'none'};
             transition: opacity 0.3s ease;
          }
          
          .toggle-btn {
             position: fixed;
             left: ${isDesktop && isSidebarOpen ? '400px' : '40px'};
             top: 50%;
             transform: translateY(-50%); 
             z-index: 100;
             background: transparent;
             border: none;
             color: var(--text-secondary);
             width: auto;
             height: auto;
             padding: 10px;
             display: flex;
             align-items: center;
             justify-content: center;
             cursor: pointer;
             transition: all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
             font-size: 32px;
             opacity: 0.6;
          }
          
          .toggle-btn:hover {
             opacity: 1;
             transform: translateY(-50%) translateX(4px);
             color: var(--text-primary);
          }

          .main-content {
             flex: 1;
             display: flex;
             flex-direction: column;
             width: 100%; /* Full width to catch all scrolls */
             max-width: 100%; /* Remove constraint */
             align-items: center; /* Center children */
             margin: 0;
             padding: 60px 20px;
             position: relative;
             height: 100vh;
             overflow-y: auto;
             -webkit-overflow-scrolling: touch;
             scrollbar-width: none;
          }

          .main-content::-webkit-scrollbar {
             display: none;
          }
          
          /* Center the actual content */
          .nav-header, .write-mode, .animate-enter {
             width: 100%;
             max-width: 700px;
          }

          .nav-header {
             padding-bottom: 20px;
             text-align: center;
             display: flex;
             justify-content: center;
             gap: 60px; /* Big gap */
             z-index: 50;
             position: relative;
          }

          .nav-item {
             font-size: 14px;
             font-weight: 700;
             letter-spacing: 3px;
             text-transform: uppercase;
             opacity: 0.3;
             cursor: pointer;
             transition: all 0.3s ease;
             position: relative;
          }
          
          .nav-item:hover {
             opacity: 1;
             transform: scale(1.1);
          }

          .nav-item.active {
             opacity: 1;
          }
          
          .nav-item.active::after {
             content: '';
             position: absolute;
             bottom: -8px;
             left: 50%;
             transform: translateX(-50%);
             width: 4px;
             height: 4px;
             background: var(--text-primary);
             border-radius: 50%;
          }

          .write-mode {
              display: flex;
              flex-direction: column;
              justify-content: center;
              flex: 1;
              padding-bottom: 100px; /* Center visually */
              position: relative;
          }

          .globe-background {
             position: absolute;
             top: 50%;
             left: 50%;
             transform: translate(-50%, -50%);
             width: 100vw;
             height: 100vh;
             z-index: 0;
             opacity: 0.4;
             pointer-events: none; /* Let clicks pass through */
             overflow: hidden;
             display: flex;
             align-items: center;
             justify-content: center;
          }

          .composer-wrapper {
              position: relative;
              z-index: 10;
          }
       `}</style>

            {/* Global Notification */}
            {notification && (
                <VoidNotification
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification(null)}
                />
            )}

            {/* Reading Modal */}
            {selectedLetter && (
                <LetterModal
                    letter={selectedLetter}
                    onClose={() => setSelectedLetter(null)}
                />
            )}

            {/* Sidebar (Overlay) */}
            <div className="sidebar" ref={sidebarRef}>
                {isDesktop && <AppearancePanel />}
            </div>

            {/* Sidebar Toggle */}
            {isDesktop && (
                <button className="toggle-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)} ref={toggleBtnRef}>
                    {isSidebarOpen ? '«' : '»'}
                </button>
            )}

            <div className="main-content">
                {/* Header */}
                <div className="nav-header">
                    <span
                        className={`nav-item ${view === 'write' ? 'active' : ''}`}
                        onClick={() => setView('write')}
                    >WBDS</span>

                    <span
                        className={`nav-item ${view === 'read' ? 'active' : ''}`}
                        onClick={() => setView('read')}
                    >READ</span>

                    <span
                        className={`nav-item ${view === 'best' ? 'active' : ''}`}
                        onClick={() => setView('best')}
                    >BEST</span>
                </div>

                {/* VIEW: WRITE + GLOBE */}
                {view === 'write' && (
                    <div className="write-mode animate-enter">
                        <div className="globe-background">
                            <RealtimeGlobe letters={letters} />
                        </div>
                        <div className="composer-wrapper">
                            <LetterComposer onSend={handleLetterSent} onError={handleError} />
                        </div>
                    </div>
                )}

                {/* VIEW: READ & BEST */}
                {(view === 'read' || view === 'best') && (
                    <div className="animate-enter" style={{ zIndex: 10 }}>
                        <LetterFeed
                            letters={letters}
                            onLetterClick={setSelectedLetter}
                            onDelete={handleDeleteLetter}
                            myLetterIds={myLetterIds}
                            onLike={handleLike}
                            likedLetters={likedLetters}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
