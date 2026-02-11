'use client';

import { useState } from 'react';

export default function DonatePage() {
    const [copied, setCopied] = useState(null);

    const copyAddress = (type, address) => {
        navigator.clipboard.writeText(address);
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="donate-page-overlay">
            <div className="scroll-container">
                <div className="content-wrapper">

                    <section className="donate-section">
                        <h2>FUEL THE VOID</h2>
                        <div className="donate-content">
                            <p className="anon-quote">
                                <em>Yeah, I could have just linked my PayPal here. But that felt wrong for a place built on anonymity. So here we are crypto only.</em>
                            </p>
                            <p>
                                WBDS runs on real servers that cost real money. If this space has meant something to you, even a small contribution helps cover hosting and keeps the project independent. No middlemen, no accounts, no strings attached.
                            </p>
                        </div>
                        <div className="wallet-cards">
                            <button
                                className={`wallet-card ${copied === 'sol' ? 'copied' : ''}`}
                                onClick={() => copyAddress('sol', 'EGr5ZvhtTb7nqczg5VZfH7CR9jhcQ9rwBhvnydfDcAkk')}
                            >
                                <span className="wallet-chain">SOLANA</span>
                                <span className="wallet-addr">EGr5Zvh...DcAkk</span>
                                <span className="wallet-action">{copied === 'sol' ? 'COPIED' : 'CLICK TO COPY'}</span>
                            </button>
                            <button
                                className={`wallet-card ${copied === 'eth' ? 'copied' : ''}`}
                                onClick={() => copyAddress('eth', '0x666DA238E89fbf3293aF8fe723fC22C0D5e208EE')}
                            >
                                <span className="wallet-chain">ETHEREUM</span>
                                <span className="wallet-addr">0x666DA...208EE</span>
                                <span className="wallet-action">{copied === 'eth' ? 'COPIED' : 'CLICK TO COPY'}</span>
                            </button>
                        </div>
                    </section>

                    <a href="/" className="back-link">« Return to Void</a>
                </div>
            </div>

            <style jsx>{`
                .donate-page-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    height: 100dvh;
                    background: #000000;
                    z-index: 99999;
                    display: flex;
                    flex-direction: column;
                }

                .scroll-container {
                    flex: 1;
                    width: 100%;
                    height: 100%;
                    overflow-y: auto;
                    -webkit-overflow-scrolling: touch;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .content-wrapper {
                    width: 100%;
                    max-width: 700px;
                    margin: 0 auto;
                    padding: 60px 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 40px;
                    animation: fadeIn 0.5s ease;
                    box-sizing: border-box;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .donate-section {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }

                .donate-section h2 {
                    font-weight: 900;
                    font-size: 32px;
                    color: #ffffff;
                    margin: 0;
                    text-transform: uppercase;
                    letter-spacing: 3px;
                }

                .donate-content {
                    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif;
                    font-size: 17px;
                    line-height: 1.8;
                    color: #a1a1a6;
                    font-weight: 400;
                }

                .donate-content p strong { color: #ffffff; font-weight: 600; }

                .anon-quote {
                    font-size: 15px;
                    color: rgba(255, 255, 255, 0.25);
                    border-left: 2px solid rgba(255, 255, 255, 0.1);
                    padding-left: 16px;
                    margin-bottom: 8px;
                }

                .wallet-cards {
                    display: flex;
                    gap: 16px;
                    margin-top: 8px;
                }

                .wallet-card {
                    all: unset;
                    flex: 1;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 16px;
                    padding: 24px;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    text-align: left;
                }

                .wallet-card:hover {
                    background: rgba(255, 255, 255, 0.05);
                    border-color: rgba(255, 255, 255, 0.15);
                    transform: translateY(-2px);
                }

                .wallet-card.copied {
                    border-color: rgba(255, 255, 255, 0.3);
                    background: rgba(255, 255, 255, 0.06);
                }

                .wallet-chain {
                    font-size: 11px;
                    font-weight: 900;
                    letter-spacing: 3px;
                    color: rgba(255, 255, 255, 0.4);
                    text-transform: uppercase;
                }

                .wallet-addr {
                    font-family: 'SF Mono', 'Menlo', 'Fira Code', monospace;
                    font-size: 14px;
                    color: rgba(255, 255, 255, 0.7);
                    word-break: break-all;
                }

                .wallet-action {
                    font-size: 9px;
                    font-weight: 900;
                    letter-spacing: 2px;
                    color: rgba(255, 255, 255, 0.2);
                    margin-top: 4px;
                    text-transform: uppercase;
                }

                .wallet-card.copied .wallet-action {
                    color: #fff;
                }

                .back-link {
                    display: block;
                    text-align: center;
                    color: #444;
                    text-decoration: none;
                    font-family: 'Courier Prime', monospace;
                    font-size: 14px;
                    letter-spacing: 2px;
                    padding: 20px;
                    transition: all 0.2s;
                }

                .back-link:hover { color: #fff; transform: translateY(-2px); }

                @media (max-width: 768px) {
                    .wallet-cards { flex-direction: column; }
                    .donate-section h2 { font-size: 24px; letter-spacing: 2px; }
                    .content-wrapper { padding: 40px 20px; }
                }
            `}</style>
        </div>
    );
}
