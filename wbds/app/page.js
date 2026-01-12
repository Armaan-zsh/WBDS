'use client';

import { useState } from 'react';
import LetterComposer from '../components/Editor/LetterComposer';
import LetterFeed from '../components/Feed/LetterFeed';
import VoidNotification from '../components/Layout/VoidNotification';
import LetterModal from '../components/Feed/LetterModal';

export default function Home() {
    const [letters, setLetters] = useState([]);
    const [notification, setNotification] = useState(null); // { message, type }
    const [selectedLetter, setSelectedLetter] = useState(null);

    const handleLetterSent = (text) => {
        const newLetter = {
            id: Date.now(),
            content: text,
            timestamp: Date.now()
        };
        // Add to top of feed
        setLetters([newLetter, ...letters]);
    };

    const handleError = (message) => {
        setNotification({ message, type: 'error' });
    };

    return (
        <div style={{
            minHeight: '100%',
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '600px',
            margin: '0 auto',
            padding: '20px 20px 0 20px'
        }}>
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

            {/* Header */}
            <div style={{ padding: '20px 0', opacity: 0.5, letterSpacing: '2px', fontSize: '12px', textTransform: 'uppercase' }}>
                WBDS / The Void
            </div>

            <div className="animate-enter">
                <LetterComposer onSend={handleLetterSent} onError={handleError} />
            </div>

            <div className="feed-section">
                <div style={{ margin: '40px 0 20px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}></div>
                <LetterFeed letters={letters} onLetterClick={setSelectedLetter} />
            </div>

        </div>
    );
}
