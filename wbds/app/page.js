'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase'; // Import Supabase
import LetterComposer from '../components/Editor/LetterComposer';
import LetterFeed from '../components/Feed/LetterFeed';
import VoidNotification from '../components/Layout/VoidNotification';
import LetterModal from '../components/Feed/LetterModal';
import AppearancePanel from '../components/Settings/AppearancePanel';

export default function Home() {
    const [letters, setLetters] = useState([]);
    const [notification, setNotification] = useState(null);
    const [selectedLetter, setSelectedLetter] = useState(null);
    const [isDesktop, setIsDesktop] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const [view, setView] = useState('write'); // 'write' or 'read'

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

    const [myLetterIds, setMyLetterIds] = useState(new Set());

    // Load owned letters logic
    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem('wbds_owned') || '[]');
        setMyLetterIds(new Set(saved));
    }, []);

    // Persist owned letters
    useEffect(() => {
        if (myLetterIds.size > 0) {
            localStorage.setItem('wbds_owned', JSON.stringify([...myLetterIds]));
        }
    }, [myLetterIds]);

    // Load letters from Supabase
    useEffect(() => {
        const fetchLetters = async () => {
            const { data, error } = await supabase
                .from('letters')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

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

        // Realtime Subscription
        const channel = supabase
            .channel('public:letters')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'letters' }, (payload) => {
                const newLetter = {
                    ...payload.new,
                    timestamp: payload.new.created_at
                };
                setLetters(current => [newLetter, ...current]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleLetterSent = async (text) => {
        // Basic Spam Prevention (Cooldown)
        const lastSent = localStorage.getItem('wbds_last_sent');
        if (lastSent && Date.now() - parseInt(lastSent) < 30000) { // 30s cooldown
            handleError("You're writing too fast. Take a deep breath.");
            return;
        }

        const { data, error } = await supabase
            .from('letters')
            .insert([{ content: text, theme: 'default' }])
            .select()
            .single();

        if (error) {
            handleError("The Void rejected your letter. Try again.");
            return;
        }

        const id = data.id;

        // Mark as owned (Local Persistence)
        setMyLetterIds(prev => new Set(prev).add(id));
        localStorage.setItem('wbds_last_sent', Date.now());

        // Switch to Read View
        setTimeout(() => {
            setView('read');
        }, 10);
    };

    const handleDeleteLetter = async (id) => {
        if (window.confirm("Burn this letter forever?")) {
            // Optimistic update
            setLetters(prev => prev.filter(l => l.id !== id));

            // Server delete
            const { error } = await supabase.from('letters').delete().eq('id', id);

            if (error) {
                handleError("Could not burn letter. It refuses to die.");
                // Optional: Revert optimistic update here if needed
            }
        }
    };

    const handleError = (message) => {
        setNotification({ message, type: 'error' });
    };

    return (
        <div className="app-layout">
            <style jsx>{`
         .app-layout {
            display: flex;
            min-height: 100vh;
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
            max-width: 700px;
            margin: 0 auto;
            padding: 60px 20px;
            position: relative;
            min-height: 100vh;
         }

         .nav-header {
            padding-bottom: 40px;
            text-align: center;
            display: flex;
            justify-content: center;
            gap: 60px; /* Big gap */
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
            <div className="sidebar">
                {isDesktop && <AppearancePanel />}
            </div>

            {/* Sidebar Toggle */}
            {isDesktop && (
                <button className="toggle-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
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
                </div>

                {/* VIEW: WRITE */}
                {view === 'write' && (
                    <div className="write-mode animate-enter">
                        <LetterComposer onSend={handleLetterSent} onError={handleError} />
                    </div>
                )}

                {/* VIEW: READ */}
                {view === 'read' && (
                    <div className="animate-enter">
                        <LetterFeed
                            letters={letters}
                            onLetterClick={setSelectedLetter}
                            onDelete={handleDeleteLetter}
                            myLetterIds={myLetterIds}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
