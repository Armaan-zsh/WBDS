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

    const handleLetterSent = (text) => {
        const newLetter = {
            id: Date.now(),
            content: text,
            timestamp: Date.now()
        };
        setLetters([newLetter, ...letters]);
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

         .sidebar {
            width: ${isDesktop && isSidebarOpen ? '320px' : '0px'};
            overflow: hidden;
            transition: width 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
            position: relative; /* It acts as a spacer */
            z-index: 10;
            opacity: ${isDesktop && isSidebarOpen ? 1 : 0};
            pointer-events: ${isDesktop && isSidebarOpen ? 'auto' : 'none'};
         }
         
         .toggle-btn {
            position: fixed;
            left: ${isDesktop && isSidebarOpen ? '345px' : '40px'};
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
            padding: 40px 20px;
            position: relative;
            transition: margin 0.5s ease;
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

            {/* Sidebar (Desktop Only) */}
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
                <div style={{ paddingBottom: '40px', opacity: 0.5, letterSpacing: '2px', fontSize: '12px', textTransform: 'uppercase', textAlign: 'center' }}>
                    <span
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        style={{ cursor: 'pointer', margin: '0 8px' }}
                    >WBDS</span>
                    /
                    <span
                        onClick={() => document.querySelector('.feed-section').scrollIntoView({ behavior: 'smooth' })}
                        style={{ cursor: 'pointer', margin: '0 8px' }}
                    >READ</span>
                </div>

                <div className="animate-enter">
                    <LetterComposer onSend={handleLetterSent} onError={handleError} />
                </div>

                <div className="feed-section">
                    <div style={{ margin: '60px 0 40px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}></div>
                    <LetterFeed letters={letters} onLetterClick={setSelectedLetter} />
                </div>
            </div>

        </div>
    );
}
