'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase'; // Import Supabase
import LetterComposer from '../components/Editor/LetterComposer';
import LetterFeed from '../components/Feed/LetterFeed';
import VoidNotification from '../components/Layout/VoidNotification';
import LetterModal from '../components/Feed/LetterModal';
import ReportModal from '../components/Feed/ReportModal';
import AppearancePanel from '../components/Settings/AppearancePanel';
import VoidClock from '../components/Layout/VoidClock';
import GalaxyBackground from '../components/Layout/GalaxyBackground';
import StandardFooter from '../components/Layout/StandardFooter';
import VoidWhisper from '../components/Layout/VoidWhisper';
import CustomWallpaper from '../components/Layout/CustomWallpaper';
import dynamic from 'next/dynamic';

const Link = dynamic(() => import('next/link'), { ssr: false }); // Example fallback if needed, but we need GlobalGraph
const GlobalGraph = dynamic(() => import('../components/Chain/GlobalGraph'), {
    ssr: false,
    loading: () => <div style={{ color: '#333' }}>Loading Chain...</div>
});

const RealtimeGlobe = dynamic(() => import('../components/Live/RealtimeGlobe'), {
    ssr: false,
    loading: () => <div style={{ color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>Scanning Deep Space...</div>
});

export default function Home() {
    const [letters, setLetters] = useState([]);
    const [notification, setNotification] = useState(null);
    const [selectedLetter, setSelectedLetter] = useState(null);
    const [reportModalOpen, setReportModalOpen] = useState(null); // ID of letter being reported
    const [isDesktop, setIsDesktop] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const sidebarRef = useRef(null);

    const [view, setView] = useState('write'); // 'write', 'read', 'best'
    const [likedLetters, setLikedLetters] = useState(new Set()); // Local liked state
    const [myLetterIds, setMyLetterIds] = useState(new Set());
    const [deleteTargetId, setDeleteTargetId] = useState(null);
    const [isWriting, setIsWriting] = useState(false);
    const [totalCount, setTotalCount] = useState(0); // [NEW] Global Pulse

    const [replyTo, setReplyTo] = useState(null); // Track parent letter
    const [currentTheme, setCurrentTheme] = useState('paper'); // Track theme for conditional rendering
    const [showSplash, setShowSplash] = useState(true); // Splash screen state
    const [lastBottleTime, setLastBottleTime] = useState(0); // [NEW] Bottle Cooldown

    // Splash Screen Timer
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowSplash(false);
        }, 2200); // 2.2 seconds (slightly over 2s for smoothness)
        return () => clearTimeout(timer);
    }, []);

    // Watch for Theme Changes (to unmount Galaxy when needed)
    useEffect(() => {
        // Initial set
        if (typeof document !== 'undefined') {
            const saved = localStorage.getItem('wbds_theme');
            // If saved exists, use it. If not, default to 'paper'.
            // Note: We check if attribute is already set by script in head to avoid flicker
            const htmlTheme = document.documentElement.getAttribute('data-theme');
            setCurrentTheme(htmlTheme || saved || 'paper');
        }

        // Observer
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                    setCurrentTheme(document.documentElement.getAttribute('data-theme') || 'paper');
                }
            });
        });

        if (typeof document !== 'undefined') {
            observer.observe(document.documentElement, { attributes: true });
        }

        return () => observer.disconnect();
    }, []);

    // --- SEND LOGIC ---
    const handleSaveLetter = async (content, unlockDate, parentId = null) => {
        setIsWriting(false); // Close editor view after send
        setReplyTo(null);    // Clear reply state

        // 1. Optimistic UI Update (Instant)
        const tempId = crypto.randomUUID();
        const newLetter = {
            id: tempId,
            content,
            created_at: new Date().toISOString(),
            theme: document.documentElement.getAttribute('data-theme') || 'void',
            font: document.documentElement.getAttribute('data-font') || 'sans',
            likes: 0,
            unlock_at: unlockDate ? unlockDate.toISOString() : null,
            parent_id: parentId // Local optimistic link
        };

        // Add to local list immediately
        if (!unlockDate) {
            setLetters(prev => [newLetter, ...prev]);
        }

        // Track ownership locally
        const newMyIds = new Set(myLetterIds);
        newMyIds.add(tempId);
        setMyLetterIds(newMyIds);

        setNotification({ message: unlockDate ? 'Capsule Sealed. See you in the future.' : 'Letter released into the void.', type: 'success' });

        // 2. Async Backend Save
        const { data, error } = await supabase
            .from('letters')
            .insert([{
                content,
                theme: newLetter.theme,
                font: newLetter.font,
                unlock_at: newLetter.unlock_at,
                parent_id: parentId // DB Link
            }])
            .select()
            .single();

        if (error) {
            console.error('Send Error:', error);
            handleError("Transmission failed. The void rejected your message.");
            // Rollback optimistic update
            setLetters(prev => prev.filter(l => l.id !== tempId));
        } else if (data) {
            // Replace temp ID with real ID, avoiding duplicates
            setLetters(prev => {
                const realIdExists = prev.some(l => l.id === data.id);
                if (realIdExists) {
                    // Realtime beat us to it; just remove temp
                    return prev.filter(l => l.id !== tempId);
                }
                // Swap temp -> real
                return prev.map(l => l.id === tempId ? { ...l, id: data.id } : l);
            });

            // Update Auth Set
            setMyLetterIds(prev => {
                const next = new Set(prev);
                next.delete(tempId);
                next.add(data.id);
                return next;
            });
        }
    };

    const handleReply = (letter) => {
        setSelectedLetter(null); // Close modal
        setReplyTo(letter);      // Set context
        setView('write');        // Go to composer
        setIsWriting(true);      // Ensure visible on mobile
    };

    const confirmDelete = async () => {
        if (!deleteTargetId) return;

        const { error } = await supabase
            .from('letters')
            .delete()
            .eq('id', deleteTargetId);

        if (error) {
            handleError("Could not burn letter. It refuses to die.");
        } else {
            setLetters(current => current.filter(l => l.id !== deleteTargetId));
            setMyLetterIds(prev => {
                const asked = new Set(prev);
                asked.delete(deleteTargetId);
                return asked;
            });
            setNotification({ message: 'Letter burned to ash.', type: 'success' });
        }
        setDeleteTargetId(null);
    };

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
                !sidebarRef.current.contains(event.target)
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
        // Load owned letters (Support UUID strings) & Sanitize Bad Data
        const rawOwned = JSON.parse(localStorage.getItem('wbds_owned') || '[]');
        const cleanOwned = rawOwned.filter(id => id && typeof id !== 'object' && id !== 'NaN');
        setMyLetterIds(new Set(cleanOwned));

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
    // Load letters from Supabase (re-run when view changes)
    useEffect(() => {
        const fetchLetters = async () => {
            let data, error;

            // Fetch Total Count for Pulse (Run once on load)
            const { count } = await supabase.from('letters').select('*', { count: 'exact', head: true });
            if (count) setTotalCount(count);

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
                // If in 'chain' (Graph) mode, we fetch MORE (500) to populate the sky.
                // If in 'read' (Feed) mode, we fetch LESS (50) for speed.
                const limit = (view === 'chain' || view === 'personal') ? 500 : 50;

                const result = await supabase
                    .from('letters')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(limit);
                data = result.data;
                error = result.error;
            }

            if (data) {
                // Normalize data for UI
                const formatted = data.map(l => ({
                    ...l,
                    timestamp: l.created_at // Map Supabase field to UI field
                }));
                // Only overwrite if we found data (don't clear on error)
                setLetters(formatted);
            }
        };

        fetchLetters();
    }, [view]); // Re-fetch when view changes (e.g. Feed -> Graph)

    // Realtime Subscription (Run Once)
    useEffect(() => {
        const channel = supabase
            .channel('public:letters')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'letters' }, (payload) => {
                const newLetter = {
                    ...payload.new,
                    timestamp: payload.new.created_at
                };
                setLetters(current => {
                    // Deduplicate
                    if (current.some(l => l.id === newLetter.id)) return current;

                    // Update Total Count [NEW]
                    setTotalCount(prev => prev + 1);

                    // Safety Valve: Cap at 100 items to prevent memory overflow during viral spikes
                    const updated = [newLetter, ...current];
                    if (updated.length > 100) {
                        return updated.slice(0, 100);
                    }
                    return updated;
                });
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'letters' }, (payload) => {
                setLetters(current => current.map(l =>
                    l.id === payload.new.id ? { ...l, ...payload.new } : l
                ));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleError = (message) => {
        setNotification({ message, type: 'error' });
    };

    const handleLetterSent = async (text, unlockAt, parentId = null, tags = [], recipientType = 'unknown', forced = false) => {
        // Basic Spam Prevention (Cooldown)
        const lastSent = localStorage.getItem('wbds_last_sent');
        if (lastSent && Date.now() - parseInt(lastSent) < 10000) { // Reduced to 10s for testing/growth
            handleError("You're writing too fast. Take a deep breath.");
            return;
        }

        try {
            const res = await fetch('/api/letters', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: text,
                    theme: currentTheme || 'default',
                    font: typeof document !== 'undefined' ? document.documentElement.getAttribute('data-font') || 'sans' : 'sans',
                    unlockAt: unlockAt ? unlockAt.toISOString() : null,
                    tags: tags,
                    recipient_type: recipientType,
                    forced: forced
                })
            });

            const data = await res.json();

            if (!res.ok) {
                handleError(data.error || "The Void rejected your letter.");
                return data;
            }

            // [SOUL LAYER] If it's a story and not forced, return for guidance modal
            if (data.guidance_needed && !forced) {
                return data;
            }

            const id = data.letter.id;

            // Mark as owned (Local Persistence)
            setMyLetterIds(prev => new Set(prev).add(id));
            localStorage.setItem('wbds_last_sent', Date.now());

            // Switch to Read View
            setTimeout(() => {
                setView('read');
            }, 100);

            return data;
        } catch (err) {
            handleError("Connection lost. The Void is unreachable.");
            return { error: true };
        }
    };

    const handleReport = (letterId) => {
        setReportModalOpen(letterId);
    };

    const submitReport = async (letterId, reason) => {
        try {
            // Send report to backend (implement API endpoint)
            const res = await fetch('/api/letters/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ letterId, reason })
            });

            if (res.ok) {
                setNotification({ message: 'Report submitted. Thank you for keeping WBDS safe.', type: 'success' });
            } else {
                throw new Error('Failed to report');
            }
        } catch (err) {
            // Fallback: store locally if API fails or doesn't exist
            const reports = JSON.parse(localStorage.getItem('wbds_reports') || '[]');
            reports.push({ letterId, reason, timestamp: Date.now() });
            localStorage.setItem('wbds_reports', JSON.stringify(reports));
            setNotification({ message: 'Report recorded. Thank you.', type: 'success' });
        }
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
                body: JSON.stringify({ letter_id: letterId })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            // Sync Local Set with Server Truth (Liked status only)
            setLikedLetters(prev => {
                const next = new Set(prev);
                if (data.liked) {
                    next.add(letterId);
                    setNotification({ message: 'Letter Liked.', type: 'success' });
                } else {
                    next.delete(letterId);
                    setNotification({ message: 'Like removed.', type: 'info' });
                }
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
    // --- BOTTLE FROM THE VOID LOGIC ---
    useEffect(() => {
        const saved = localStorage.getItem('wbds_last_bottle');
        if (saved) setLastBottleTime(parseInt(saved));
    }, []);

    const handleOpenBottle = async () => {
        const now = Date.now();
        const cooldown = 24 * 60 * 60 * 1000; // 24 hours

        if (now - lastBottleTime < cooldown) {
            const remaining = cooldown - (now - lastBottleTime);
            const hours = Math.ceil(remaining / (1000 * 60 * 60));
            setNotification({ message: `The sea is empty. Try again in ${hours}h.`, type: 'info' });
            return;
        }

        try {
            const res = await fetch('/api/letters/bottle');
            const data = await res.json();

            if (data.letter) {
                setSelectedLetter(data.letter);
                localStorage.setItem('wbds_last_bottle', now.toString());
                setLastBottleTime(now);
                setNotification({ message: 'A bottle drifted from the void...', type: 'success' });
            } else {
                handleError("The bottle was empty.");
            }
        } catch (err) {
            handleError("The sea is too rough right now.");
        }
    };

    // Old handleDeleteLetter removed

    return (
        <div className="app-layout">
            {/* SPLASH SCREEN */}
            <div className={`splash-screen ${!showSplash ? 'fade-out' : ''}`} style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 99999,
                pointerEvents: showSplash ? 'auto' : 'none',
                transition: 'opacity 0.8s ease-out',
                opacity: showSplash ? 1 : 0
            }}>
                <img src="/splash-logo.png?v=3" alt="WB SD" style={{ width: '180px', height: 'auto' }} />
            </div>

            {/* Only show Galaxy in Void theme or Chain view */}
            {(view === 'chain' || currentTheme === 'void' || currentTheme === 'midnight' || currentTheme === 'synthwave') && <GalaxyBackground />}

            <CustomWallpaper theme={currentTheme} />

            <VoidClock />

            <style jsx>{`
         .app-layout {
            display: flex;
            height: 100vh; /* Fixed height for viewport */
            overflow: hidden; /* Prevent body scroll */
            position: relative;
         }

          /* Sidebar is now an overlay/ghost element that doesn't push content */
          :global(body) {
            background-color: ${(view === 'chain' || view === 'personal') ? '#000000 !important' : (currentTheme === 'custom' ? 'transparent !important' : 'var(--bg-depth) !important')};
          }
          
          .sidebar {
             position: absolute;
             left: 0;
             top: 0;
             z-index: 2000; /* High enough to cover content and radio */
             opacity: ${isDesktop && isSidebarOpen ? 1 : 0};
             pointer-events: ${isDesktop && isSidebarOpen ? 'auto' : 'none'};
             transition: opacity 0.3s ease;
          }
          /* On mobile, remove the desktop restriction for opacity */
          @media (max-width: 768px) {
            .sidebar {
                opacity: ${isSidebarOpen ? 1 : 0};
                pointer-events: ${isSidebarOpen ? 'auto' : 'none'};
                position: fixed; /* Fix to viewport on mobile */
                width: 100%;
                height: 100%;
            }
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
             height: 100vh; /* Fallback */
             height: 100dvh; /* Sync with app-layout - dynamic viewport */
             overflow-y: auto;
             -webkit-overflow-scrolling: touch;
             scrollbar-width: none;
             box-sizing: border-box;
          }

          @media (max-width: 768px) {
            .main-content {
              padding: 0 12px; /* Sticky header handles top spacing */
              padding-top: 0;
              /* Fix viewport height when keyboard opens */
              height: 100vh;
              height: 100dvh; /* Dynamic viewport height */
              max-height: 100vh;
              max-height: 100dvh;
              /* Ensure content can scroll when keyboard is open */
              overflow-y: auto;
              -webkit-overflow-scrolling: touch;
            }
          }

          .main-content::-webkit-scrollbar {
             display: none;
          }
          
          /* Center the actual content */
          .nav-header, .write-mode, .animate-enter {
             width: 100%;
             max-width: 700px;
             box-sizing: border-box;
          }

          @media (max-width: 768px) {
            .nav-header, .write-mode, .animate-enter {
              max-width: 100%;
            }
          }

          .nav-header {
             padding-bottom: 20px;
             text-align: center;
             display: flex;
             justify-content: center;
             align-items: center; /* Center items vertically */
             gap: 60px; /* Big gap */
             z-index: 50;
             position: relative;
          }

          @media (max-width: 768px) {
            .nav-header {
              position: sticky; /* Keep visible */
              position: -webkit-sticky; /* Safari support */
              top: 0;
              top: env(safe-area-inset-top, 0); /* Account for notch */
              background: ${view === 'chain' || view === 'personal' ? '#000000' : 'var(--bg-depth)'};
              width: 100%;
              gap: 8px; /* Reduced gap to fit all items */
              padding-top: max(10px, env(safe-area-inset-top, 10px)); /* Reduced padding */
              padding-bottom: 10px; /* Reduced bottom padding */
              flex-wrap: nowrap; /* Keep on one line */
              overflow-x: visible; /* No scrolling - items should fit */
              -webkit-overflow-scrolling: touch;
              justify-content: space-around; /* Distribute evenly */
              align-items: center; /* Center items vertically */
              padding-left: max(8px, env(safe-area-inset-left, 8px)); /* Reduced safe area */
              padding-right: max(8px, env(safe-area-inset-right, 8px)); /* Reduced safe area */
              z-index: 100;
              transition: background 0.3s ease;
              backdrop-filter: blur(10px);
              -webkit-backdrop-filter: blur(10px);
              /* Ensure header stays visible when keyboard opens */
            }
            /* Hide scrollbar */
            .nav-header::-webkit-scrollbar { display: none; }
            
            /* Header font size for mobile - balanced size */
            .nav-header :global(a), .nav-header :global(button) {
                font-size: 12px !important; /* Slightly smaller */
                letter-spacing: 1px;
                font-weight: 700;
            }
          }

          .nav-item {
             color: var(--text-secondary);
             font-size: 13px;
             font-weight: 500;
             letter-spacing: 2px;
             cursor: pointer;
             transition: all 0.2s ease;
             padding: 8px 16px;
             border-radius: 20px;
             text-transform: uppercase;
             position: relative;
             white-space: nowrap; /* Prevent wrapping */
          }

          /* Active State Dot (Apple-style) */
          .nav-item::after {
             content: '';
             position: absolute;
             bottom: -4px; /* Slightly below text */
             left: 50%;
             transform: translateX(-50%) scale(0);
             width: 4px;
             height: 4px;
             border-radius: 50%;
             background-color: var(--text-primary);
             transition: transform 0.2s cubic-bezier(0.25, 1, 0.5, 1);
             opacity: 0;
          }

          .nav-item.active {
             color: var(--text-primary);
             font-weight: 600;
          }

          .nav-item.active::after {
             transform: translateX(-50%) scale(1);
             opacity: 1;
          }

          .nav-item:hover {
             color: var(--text-primary);
          }

          .write-mode {
             flex: 1;
             display: flex;
             flex-direction: column;
             justify-content: center; /* Vertically center the composer */
             align-items: center;
             width: 100%;
          }

          .composer-wrapper {
             width: 100%;
             max-width: 600px;
             margin: 0 auto;
             animation: scaleIn 0.4s var(--ease-ios);
          }

          @keyframes scaleIn {
             from { transform: scale(0.98); opacity: 0; }
             to { transform: scale(1); opacity: 1; }
          }
          
          .animate-enter {
             animation: fadeIn 0.5s ease-out forwards;
          }
          
          @keyframes fadeIn {
             from { opacity: 0; transform: translateY(10px); }
             to { opacity: 1; transform: translateY(0); }
          }
          
          /* Footer Area spacer */
          .footer-spacer {
             height: 60px;
          }

          /* Modal Shake Animation */
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }
            .shake-anim {
                animation: shake 0.3s ease-out;
            }
            `}</style>

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
                    >BWBDS</span>

                    <span
                        className={`nav-item ${view === 'chain' ? 'active' : ''}`}
                        onClick={() => setView('chain')}
                    >FMWBDS</span>

                    <span
                        className={`nav-item ${view === 'personal' ? 'active' : ''}`}
                        onClick={() => setView('personal')}
                    >YWBDS</span>
                </div>

                {/* VIEW: WRITE */}
                {view === 'write' && (
                    <div className="write-mode animate-enter">
                        <div className="composer-wrapper">
                            <LetterComposer
                                onSend={handleLetterSent}
                            />
                        </div>
                    </div>
                )}

                {/* VIEW: READ / BEST */}
                {(view === 'read' || view === 'best') && (
                    <div className="animate-enter" style={{ zIndex: 10 }}>
                        <LetterFeed
                            letters={letters}
                            onOpen={(l) => setSelectedLetter(l)}
                            viewMode={view}
                            myLetterIds={myLetterIds}
                            onDelete={setDeleteTargetId}
                            onLike={handleLike}
                            likedLetters={likedLetters}
                            onReport={handleReport}
                        />

                        {/* BOTTLE FROM THE VOID BUTTON */}
                        <button
                            className={`bottle-button ${Date.now() - lastBottleTime >= 24 * 60 * 60 * 1000 ? 'ready' : ''}`}
                            onClick={handleOpenBottle}
                            title="Bottle from the Void (Daily)"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10 2h4M12 2v3M10 5h4v2l-2 2-2-2V5z" />
                                <path d="M8 9a3 3 0 0 0-3 3v7a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-7a3 3 0 0 0-3-3H8z" />
                                <path d="M12 13v4" />
                            </svg>
                            <span className="tooltip">Bottle from the Void</span>
                        </button>
                    </div>
                )}

                {/* VIEW: CHAIN (Global Graph) - Rendered at Root */}
                {(view === 'chain' || view === 'personal') && (
                    <GlobalGraph
                        letters={view === 'personal' ? letters.filter(l => myLetterIds.has(l.id)) : letters}
                        onNodeClick={setSelectedLetter}
                    />
                )}

                {/* FOOTER */}
                {(view !== 'chain') && (
                    <StandardFooter
                        onSettingsClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        isSettingsOpen={isSidebarOpen}
                        letterCount={totalCount}
                    />
                )}
                <div className="footer-spacer"></div>
            </div>

            {/* SHARED MODAL */}
            <LetterModal
                letter={selectedLetter}
                onClose={() => setSelectedLetter(null)}
                isOwner={selectedLetter && myLetterIds.has(selectedLetter.id)}
                onReply={handleReply}
            />

            {/* Delete Confirmation Modal */}
            {deleteTargetId && (
                <div className="delete-modal-overlay">
                    <div className="delete-modal-card shake-anim">
                        <h3>Burn this letter?</h3>
                        <p>This action cannot be undone. The fragment will be lost to the void forever.</p>
                        <div className="delete-actions">
                            <button className="btn-keep" onClick={() => setDeleteTargetId(null)}>Keep</button>
                            <button className="btn-burn" onClick={confirmDelete}>Burn Forever</button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .delete-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.85);
                    backdrop-filter: blur(8px);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }

                .delete-modal-card {
                    background: #111;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    padding: 32px;
                    max-width: 360px;
                    width: 100%;
                    text-align: center;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
                }

                .delete-modal-card h3 {
                    font-size: 20px;
                    font-weight: 700;
                    margin: 0 0 12px 0;
                    color: white;
                }

                .delete-modal-card p {
                    font-size: 14px;
                    color: #888;
                    margin: 0 0 24px 0;
                    line-height: 1.5;
                }

                .delete-actions {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                }

                .btn-keep {
                    padding: 12px 24px;
                    border-radius: 50px;
                    background: transparent;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    color: white;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.2s;
                }

                .btn-keep:hover {
                    background: rgba(255, 255, 255, 0.1);
                }

                .btn-burn {
                    padding: 12px 24px;
                    border-radius: 50px;
                    background: rgba(255, 69, 58, 0.1);
                    border: 1px solid rgba(255, 69, 58, 0.3);
                    color: #ff453a;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.2s;
                }

                .btn-burn:hover {
                    background: rgba(255, 69, 58, 0.2);
                    box-shadow: 0 0 15px rgba(255, 69, 58, 0.3);
                }

                .shake-anim {
                    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
                }

                @keyframes shake {
                    10%, 90% { transform: translate3d(-1px, 0, 0); }
                    20%, 80% { transform: translate3d(2px, 0, 0); }
                    30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                    40%, 60% { transform: translate3d(4px, 0, 0); }
                }

                .bottle-button {
                    position: fixed;
                    left: 25px;
                    bottom: 25px;
                    width: 56px;
                    height: 56px;
                    border-radius: 50%;
                    background: var(--glass-bg);
                    border: 1px solid var(--glass-border);
                    color: var(--text-secondary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    z-index: 50; /* Below settings, but above content */
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
                    backdrop-filter: var(--glass-blur);
                    -webkit-backdrop-filter: var(--glass-blur);
                }

                .bottle-button:hover {
                    transform: scale(1.1) translateY(-5px);
                    color: var(--accent-primary);
                    border-color: var(--accent-primary);
                    box-shadow: 0 0 20px var(--accent-primary-glow);
                }

                .bottle-button.ready {
                    animation: bottle-pulse 2s infinite;
                    color: var(--accent-primary);
                    border-color: var(--accent-primary);
                }

                @keyframes bottle-pulse {
                    0% { box-shadow: 0 0 0 0 var(--accent-primary-glow); }
                    70% { box-shadow: 0 0 0 15px rgba(0,0,0,0); }
                    100% { box-shadow: 0 0 0 0 rgba(0,0,0,0); }
                }

                .bottle-button .tooltip {
                    position: absolute;
                    left: 65px;
                    background: var(--bg-surface);
                    padding: 8px 14px;
                    border-radius: 12px;
                    font-size: 12px;
                    white-space: nowrap;
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.2s ease;
                    border: 1px solid var(--glass-border);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.4);
                }

                .bottle-button:hover .tooltip {
                    opacity: 1;
                }

                @media (max-width: 768px) {
                    .bottle-button {
                        bottom: 80px;
                        left: 20px;
                        width: 48px;
                        height: 48px;
                    }
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

            {/* Report Modal */}
            <ReportModal
                isOpen={!!reportModalOpen}
                onClose={() => setReportModalOpen(null)}
                onSubmit={(reason) => submitReport(reportModalOpen, reason)}
            />

            {/* Settings Sidebar */}
            <AppearancePanel
                isOpen={isSidebarOpen}
                onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                onClose={() => setIsSidebarOpen(false)}
            />

            {/* Daily Whisper Prompt */}
            <VoidWhisper />
        </div>
    );
}
