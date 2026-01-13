'use client';

import { useState, useEffect } from 'react';
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

    const handleLetterSent = (text) => {
        const id = Date.now();
        const newLetter = {
            id: id,
            content: text,
            timestamp: id
        };
        setLetters([newLetter, ...letters]);

        // Mark as owned
        setMyLetterIds(prev => new Set(prev).add(id));

        // Auto-scroll to feed
        setTimeout(() => {
            const feed = document.querySelector('.feed-section');
            if (feed) feed.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const handleDeleteLetter = (id) => {
        if (window.confirm("Burn this letter forever?")) {
            setLetters(prev => prev.filter(l => l.id !== id));
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
         }

         .nav-header {
            padding-bottom: 60px;
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
         }
         
         .nav-item:hover {
            opacity: 1;
            transform: scale(1.1);
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
                        className="nav-item"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    >WBDS</span>

                    <span
                        className="nav-item"
                        onClick={() => document.querySelector('.feed-section').scrollIntoView({ behavior: 'smooth' })}
                    >READ</span>
                </div>

                <div className="animate-enter">
                    <LetterComposer onSend={handleLetterSent} onError={handleError} />
                </div>

                <div className="feed-section">
                    <div style={{ margin: '60px 0 40px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}></div>
                    <LetterFeed
                        letters={letters}
                        onLetterClick={setSelectedLetter}
                        onDelete={handleDeleteLetter}
                        myLetterIds={myLetterIds}
                    />
                </div>
            </div>

        </div>
    );
}
