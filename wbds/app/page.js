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
            width: ${isDesktop && isSidebarOpen ? '280px' : '0px'};
            overflow: hidden;
            transition: width 0.4s cubic-bezier(0.25, 1, 0.5, 1);
            position: relative;
            z-index: 10;
            opacity: ${isDesktop && isSidebarOpen ? 1 : 0};
         }
         
         .toggle-btn {
            position: fixed;
            left: ${isDesktop && isSidebarOpen ? '260px' : '20px'};
            bottom: 30px; 
            z-index: 20;
            background: var(--bg-surface);
            border: 1px solid var(--glass-border);
            color: var(--text-secondary);
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            font-size: 18px;
         }
         
         .toggle-btn:hover {
            transform: scale(1.1);
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
            transition: margin 0.4s ease;
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
                    WBDS / The Void
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
