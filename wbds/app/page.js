'use client';

import LetterComposer from '../components/Editor/LetterComposer';

export default function Home() {

    const handleLetterSent = (text) => {
        console.log("Letter sent to void:", text);
        // In next step: Add to local feed state
    };

    return (
        <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            maxWidth: '600px',
            margin: '0 auto'
        }}>
            <div className="glass-card animate-enter" style={{ margin: '20px' }}>
                <LetterComposer onSend={handleLetterSent} />
            </div>

            <div style={{ textAlign: 'center', opacity: 0.3, fontSize: '12px', marginTop: '20px' }}>
                <p>WBDS v0.1 • Anonymous • Encrypted</p>
            </div>
        </div>
    );
}
