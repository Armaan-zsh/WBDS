import ChainLink from './ChainLink';

export default function TimeChain({ letters }) {
    if (!letters || letters.length === 0) {
        return <div className="loading">Initializing Time Stream...</div>;
    }

    return (
        <div className="chain-container">
            <h2 className="chain-title">FRAGMENT ARCHIVE</h2>
            <div className="chain-stream">
                {letters.map((letter, index) => {
                    // Logic: The "Previous" letter in time is at index + 1 (since list is DESC)
                    // The "Next" letter in time is at index - 1
                    const prevLetter = letters[index + 1];
                    const nextLetter = letters[index - 1];

                    return (
                        <ChainLink
                            key={letter.id}
                            letter={letter}
                            prevLetter={prevLetter}
                            nextLetter={nextLetter}
                            index={index}
                        />
                    );
                })}
            </div>

            <style jsx>{`
                .chain-container {
                    width: 100%;
                    max-width: 600px;
                    margin: 0 auto;
                    padding-bottom: 100px;
                }
                
                .chain-title {
                    text-align: center;
                    font-family: monospace;
                    letter-spacing: 4px;
                    font-size: 14px;
                    color: var(--text-secondary);
                    margin-bottom: 40px;
                    opacity: 0.5;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                    padding-bottom: 20px;
                }

                .loading {
                    text-align: center;
                    margin-top: 100px;
                    font-family: monospace;
                    color: #666;
                }
            `}</style>
        </div>
    );
}
