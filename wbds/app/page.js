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

    // Simple responsive check
    useEffect(() => {
        const checkSize = () => setIsDesktop(window.innerWidth > 900);
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
         }

         .sidebar {
            width: ${isDesktop ? '280px' : '0px'};
            overflow: hidden;
            transition: width 0.3s ease;
            position: relative;
            z-index: 10;
         }

         .main-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            max-width: 700px;
            margin: 0 auto;
            padding: 40px 20px;
            position: relative;
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

            {/* Sidebar (Desktop Only for now) */}
            <div className="sidebar">
                {isDesktop && <AppearancePanel />}
            </div>

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
