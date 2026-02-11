'use client';

import { useState } from 'react';

export default function AboutPage() {
    const [copied, setCopied] = useState(null);

    const copyAddress = (type, address) => {
        navigator.clipboard.writeText(address);
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="about-page-overlay">
            <div className="scroll-container">
                <div className="content-wrapper">
                    <h1 className="main-title">ABOUT THE <strong>WBDS</strong></h1>

                    <section className="about-section">
                        <h2>A NOTE FROM THE CREATOR</h2>
                        <div className="about-content">
                            <p>
                                It means everything to see you here. Whether you stumbled upon this place by chance or followed a quiet whisper, I am truly grateful that you’ve found your way into the Void.
                            </p>
                            <p>
                                My only purpose in building this was to create a sanctuary for pure anonymity. A place where you can finally unburden your heart and let out the things you’ve been carrying in your chest. The words that were always meant to stay <em>"Wrote But Didn't Send."</em>
                            </p>
                        </div>
                    </section>

                    <section className="about-section">
                        <h2>PRIVACY & LIMITS</h2>
                        <div className="about-content">
                            <p>
                                To protect the sanctity of this space, we only track your IP address, not to know who you are, but simply to prevent spam and keep the Void calm.
                            </p>
                            <p>
                                You are granted <strong>7 letters per day</strong>, with up to <strong>7,000 characters</strong> each. We hope this gives you the room you need to breathe. If it ever feels like it isn't enough, please reach out; we are always willing to expand the horizons of the Void for your stories.
                            </p>
                        </div>
                    </section>

                    <section className="about-section">
                        <h2>OPEN SOURCE & TRUST</h2>
                        <div className="about-content">
                            <p>
                                WBDS is fully open-source. There is no data theft here, and no privacy compromises. This is transparent by design. You can audit every line of our soul and verify our commitment to privacy on <strong>GitHub</strong>.
                            </p>
                        </div>
                    </section>

                    <section className="about-section">
                        <h2>A REQUEST TO YOU</h2>
                        <div className="about-content">
                            <p>
                                I only ask one thing of you: help us protect this sanctuary.
                            </p>
                            <p>
                                Please report any letters that break our guidelines especially things like <strong>CSAM or doxxing</strong>. Your vigilance helps keep the Void a safe place for everyone’s truth.
                            </p>
                        </div>
                    </section>

                    <section className="about-section">
                        <h2>THE FUTURE OF THE VOID</h2>
                        <div className="about-content">
                            <p>
                                I don't know if WBDS will ever find the "hype" that other platforms chase, but that’s not why it exists. However, if we reach <strong>1,000 souls</strong> here before 2026, it will be a signal that this sanctuary is needed.
                            </p>
                            <p>
                                Currently, we rely on technical foundations like Supabase and Cloudflare, systems built by giant corporations. Honestly, as a creator, that dependency feels wrong. It goes against the very spirit of the Void.
                            </p>
                            <p>
                                My dream is to move beyond them. To build our own heart: a custom database paired with <strong>IPFS</strong>. A future where WBDS doesn't live on a corporate server, but drifts across the decentralized web. A future where, even if the world's major networks fail, the Void remains open. Independent. Unstoppable.
                            </p>
                        </div>
                    </section>

                    <section className="about-section" id="donate">
                        <h2>☕ FUEL THE VOID</h2>
                        <div className="about-content">
                            <p className="anon-quote">
                                <em>"I should have dropped my PayPal here, but I chose anonymity."</em>
                            </p>
                            <p>
                                If the Void has been a home for your unspoken words, you can help keep it alive. Every donation fuels hosting, development, and the dream of a truly independent sanctuary.
                            </p>
                        </div>
                        <div className="wallet-cards">
                            <button
                                className={`wallet-card ${copied === 'sol' ? 'copied' : ''}`}
                                onClick={() => copyAddress('sol', 'EGr5ZvhtTb7nqczg5VZfH7CR9jhcQ9rwBhvnydfDcAkk')}
                            >
                                <span className="wallet-chain">◎ SOLANA</span>
                                <span className="wallet-addr">EGr5Zvh...DcAkk</span>
                                <span className="wallet-action">{copied === 'sol' ? '✓ COPIED' : 'CLICK TO COPY'}</span>
                            </button>
                            <button
                                className={`wallet-card ${copied === 'eth' ? 'copied' : ''}`}
                                onClick={() => copyAddress('eth', '0x666DA238E89fbf3293aF8fe723fC22C0D5e208EE')}
                            >
                                <span className="wallet-chain">⟠ ETHEREUM</span>
                                <span className="wallet-addr">0x666DA...208EE</span>
                                <span className="wallet-action">{copied === 'eth' ? '✓ COPIED' : 'CLICK TO COPY'}</span>
                            </button>
                        </div>
                    </section>

                    <div className="divider"></div>

                    <div className="about-footer">
                        <p>Thanks for using WBDS. May your heart feel lighter here.</p>
                    </div>

                    <a href="/" className="back-link">« Return to Void</a>
                </div>
            </div>

            <style jsx>{`
                .about-page-overlay {
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
                }

                .content-wrapper {
                    width: 100%;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 80px 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 60px;
                    animation: fadeIn 0.5s ease;
                    box-sizing: border-box;
                }

                @media (min-width: 769px) {
                    .content-wrapper { padding-bottom: 100px; }
                    .scroll-container::-webkit-scrollbar { width: 8px; }
                    .scroll-container::-webkit-scrollbar-track { background: #000; }
                    .scroll-container::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
                }

                @media (max-width: 768px) {
                    .content-wrapper {
                        padding: 40px 20px;
                        padding-bottom: 200px !important;
                        gap: 40px;
                    }
                    .main-title { font-size: 28px !important; }
                }

                @keyframes fadeIn {
                    from {opacity: 0; transform: translateY(10px); }
                    to {opacity: 1; transform: translateY(0); }
                }

                .main-title {
                    font-size: 42px;
                    font-weight: 300;
                    color: #ffffff;
                    letter-spacing: 2px;
                    text-align: center;
                    text-transform: uppercase;
                }

                .main-title strong {
                    font-weight: 900;
                    color: #fff;
                    text-shadow: 0 0 20px rgba(255,255,255,0.2);
                }

                .about-section {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .about-section h2 {
                    font-weight: 700;
                    font-size: 14px;
                    color: #555;
                    margin: 0;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                }

                .about-content {
                    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif;
                    font-size: 17px;
                    line-height: 1.8;
                    color: #a1a1a6;
                    font-weight: 400;
                }

                .about-content p strong { color: #ffffff; font-weight: 600; }
                .about-content p em { color: #fff; font-style: italic; opacity: 0.9; }

                .divider {
                    width: 100%;
                    height: 1px;
                    background: rgba(255, 255, 255, 0.05);
                    margin: 30px 0;
                }

                .about-footer {
                    text-align: center;
                    font-family: 'Courier Prime', monospace;
                    font-size: 12px;
                    color: #666;
                    letter-spacing: 1px;
                    line-height: 1.5;
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

                .anon-quote {
                    font-size: 15px;
                    color: rgba(255, 255, 255, 0.25);
                    border-left: 2px solid rgba(255, 255, 255, 0.1);
                    padding-left: 16px;
                    margin-bottom: 8px;
                }

                .wallet-cards {
                    display: flex;
                    gap: 12px;
                    margin-top: 8px;
                }

                .wallet-card {
                    all: unset;
                    flex: 1;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 16px;
                    padding: 20px;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
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
                    font-size: 10px;
                    font-weight: 800;
                    letter-spacing: 2px;
                    color: rgba(255, 255, 255, 0.5);
                }

                .wallet-addr {
                    font-family: 'SF Mono', 'Menlo', 'Fira Code', monospace;
                    font-size: 13px;
                    color: rgba(255, 255, 255, 0.7);
                    word-break: break-all;
                }

                .wallet-action {
                    font-size: 9px;
                    font-weight: 800;
                    letter-spacing: 1.5px;
                    color: rgba(255, 255, 255, 0.25);
                    margin-top: 4px;
                }

                .wallet-card.copied .wallet-action {
                    color: #fff;
                }

                @media (max-width: 768px) {
                    .wallet-cards { flex-direction: column; }
                }
            `}</style>
        </div>
    );
}
