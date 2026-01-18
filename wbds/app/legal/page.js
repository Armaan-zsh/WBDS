'use client';

export default function LegalPage() {
    return (
        <div className="legal-page-overlay">
            <div className="scroll-container">
                <div className="content-wrapper">
                    <h1 className="main-title">WBDS</h1>

                    <section className="legal-section">
                        <h2>LEGAL</h2>
                        <div className="legal-content">
                            <p>
                                <strong>WBDS (Wrote But Didn't Send)</strong> is an anonymous letter-sharing platform designed for personal expression and connection. This service operates under the following legal framework:
                            </p>
                            <p>
                                <strong>1. Anonymity & Privacy</strong><br />
                                WBDS is designed to be a completely anonymous platform. We do not collect, store, or share any personally identifiable information about our users. All letters are posted without usernames, email addresses, or any identifying markers. Your IP address is used solely for rate limiting and geographic visualization purposes and is not linked to your letters or shared with third parties.
                            </p>
                            <p>
                                <strong>2. Content Responsibility</strong><br />
                                WBDS is a platform for user-generated content. The views, opinions, and content expressed in letters are solely those of the anonymous authors and do not reflect the views, opinions, or policies of WBDS, its creators, or operators. WBDS acts as a neutral intermediary and is not responsible for the content posted by users.
                            </p>
                            <p>
                                <strong>3. Content Moderation</strong><br />
                                While WBDS implements automated filters to prevent doxxing, harassment, spam, and illegal content, we cannot guarantee that all inappropriate content will be caught. Users are encouraged to report content that violates our rules. WBDS reserves the right to remove any content that violates our terms of service or applicable laws.
                            </p>
                            <p>
                                <strong>4. No Warranty</strong><br />
                                WBDS is provided "as is" without any warranties, express or implied. We do not guarantee the availability, accuracy, or reliability of the service. WBDS is not liable for any damages arising from the use or inability to use the platform.
                            </p>
                            <p>
                                <strong>5. Intellectual Property</strong><br />
                                By posting content on WBDS, you grant WBDS a non-exclusive, royalty-free license to display, distribute, and modify your content solely for the purpose of operating the platform. You retain all rights to your original content.
                            </p>
                            <p>
                                <strong>6. Limitation of Liability</strong><br />
                                To the fullest extent permitted by law, WBDS, its creators, operators, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of the platform.
                            </p>
                            <p>
                                <strong>7. Changes to Terms</strong><br />
                                WBDS reserves the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.
                            </p>
                        </div>
                    </section>

                    <section className="legal-section">
                        <h2>RULES</h2>
                        <div className="rules-content">
                            <p>
                                <strong>1. Do Not Bypass Protections</strong><br />
                                Attempting to scrape, hack, exploit, or bypass the platform's security measures is strictly prohibited. This includes but is not limited to: automated data collection, reverse engineering, attempting to disable anti-scraping features, or any activity that compromises the platform's integrity.
                            </p>
                            <p>
                                <strong>2. No Doxxing</strong><br />
                                Revealing private information about yourself or others is strictly forbidden. This includes phone numbers, addresses, email addresses, social security numbers, credit card information, GPS coordinates, IP addresses, real names, workplace information, or any other personally identifiable information. All such content will be automatically redacted or blocked.
                            </p>
                            <p>
                                <strong>3. No Social Solicitation</strong><br />
                                Do not share social media handles, usernames, contact information, or request others to contact you off-platform. This includes Instagram, Snapchat, Telegram, WhatsApp, Discord, or any other platform identifiers. The void is meant to be anonymous and self-contained.
                            </p>
                            <p>
                                <strong>4. No Links</strong><br />
                                External links are not allowed. This includes URLs, website addresses, or any form of hyperlinks. The platform is designed to be a closed ecosystem for anonymous expression.
                            </p>
                            <p>
                                <strong>5. Be Human</strong><br />
                                Do not use bots, automated scripts, or any form of automation to spam, flood, or manipulate the feed. Each letter should be written by a human being for genuine expression.
                            </p>
                            <p>
                                <strong>6. No Hate Speech or Harassment</strong><br />
                                Content that promotes hate, discrimination, harassment, threats, or illegal activities is not tolerated. This includes but is not limited to: racism, sexism, homophobia, transphobia, religious discrimination, or any form of targeted harassment.
                            </p>
                            <p>
                                <strong>7. No Illegal Content</strong><br />
                                Do not post content that violates any applicable laws, including but not limited to: defamation, copyright infringement, threats of violence, or any criminal activity.
                            </p>
                            <p>
                                <strong>8. Respect the Platform</strong><br />
                                Use WBDS responsibly and in good faith. This is a space for genuine expression, not for abuse, manipulation, or exploitation. Violations of these rules may result in content removal, rate limiting, or permanent bans.
                            </p>
                        </div>
                    </section>

                    <section className="legal-section">
                        <h2>CREDITS</h2>
                        <div className="credits-content">
                            <p>
                                <strong>Synthwave Radio</strong><br />
                                The synthwave radio feature is powered by <strong>Nightride FM</strong> streaming service. Special thanks to <strong>Odysseus</strong> and all the featured artists who make the retro-futuristic soundscape possible.
                            </p>
                            <p>
                                <em>"In the void, we are all just frequencies."</em>
                            </p>
                            <p>
                                <strong>WBDS Platform</strong><br />
                                Built with Next.js, React, and Supabase. Designed for anonymity, privacy, and genuine human connection.
                            </p>
                        </div>
                    </section>

                    <div className="divider"></div>

                    <div className="copyright">
                        ALL RIGHTS RESERVED TO THE RESPECTIVE OWNERS. WBDS © {new Date().getFullYear()}.
                    </div>

                    <a href="/" className="back-link">« Return to Void</a>
                </div>
            </div>

            <style jsx>{`
                /* Base Overlay - Locked to Screen */
                .legal-page-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    height: 100dvh; /* Mobile: Dynamic Viewport Height */
                    background: #000000;
                    z-index: 99999; /* Highest priority */
                    display: flex;
                    flex-direction: column;
                }

                /* Scroll Container - Handles the actual scrolling */
                .scroll-container {
                    flex: 1;
                    width: 100%;
                    height: 100%;
                    overflow-y: auto; /* Force scrollbar */
                    -webkit-overflow-scrolling: touch; /* Smooth iOS scroll */
                    overscroll-behavior: contain; /* Prevent scrolling parent */
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

                /* === DESKTOP STYLES === */
                @media (min-width: 769px) {
                    .content-wrapper {
                        padding-bottom: 100px; /* Standard bottom padding */
                    }
                    
                    /* Custom Scrollbar for Desktop */
                    .scroll-container::-webkit-scrollbar {
                        width: 8px;
                    }
                    .scroll-container::-webkit-scrollbar-track {
                        background: #000;
                    }
                    .scroll-container::-webkit-scrollbar-thumb {
                        background: #333;
                        border-radius: 4px;
                    }
                    .scroll-container::-webkit-scrollbar-thumb:hover {
                        background: #555;
                    }
                }

                /* === MOBILE STYLES === */
                @media (max-width: 768px) {
                    .legal-page-overlay {
                        /* Ensure it sits on top of everything on mobile */
                        height: 100dvh; 
                    }

                    .scroll-container {
                        /* Native touch scrolling */
                        padding-top: 0;
                    }

                    .content-wrapper {
                        padding: 40px 20px;
                        /* EXTRA PADDING AT BOTTOM to prevent cut-off */
                        padding-bottom: 250px !important; 
                        gap: 40px;
                    }

                    .main-title {
                        font-size: 32px !important;
                        margin-top: 20px;
                    }
                }

                @keyframes fadeIn {
                    from {opacity: 0; transform: translateY(10px); }
                    to {opacity: 1; transform: translateY(0); }
                }

                .main-title {
                    font-size: 48px;
                    font-weight: 800;
                    color: #ffffff;
                    letter-spacing: -1px;
                    margin-bottom: 10px;
                    text-align: center;
                    text-transform: uppercase;
                }

                .legal-section {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .legal-section h2 {
                    font-weight: 700;
                    font-size: 20px;
                    color: #ffffff;
                    margin: 0;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .legal-content,
                .rules-content,
                .credits-content {
                    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Segoe UI", Roboto, sans-serif;
                    font-size: 16px;
                    line-height: 1.6;
                    color: #a1a1a6;
                    font-weight: 400;
                }

                .legal-content p strong,
                .rules-content p strong,
                .credits-content p strong {
                    color: #ffffff;
                    font-weight: 700;
                }
                
                .legal-content p em {
                    font-style: italic;
                    color: #8e8e93;
                }

                .divider {
                    width: 100%;
                    height: 1px;
                    background: rgba(255, 255, 255, 0.1);
                    margin: 30px 0;
                }

                .copyright {
                    font-family: 'Courier Prime', 'Courier New', monospace;
                    font-size: 10px;
                    color: #555555;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    text-align: center;
                    opacity: 0.6;
                }

                .back-link {
                    display: block;
                    text-align: center;
                    color: #888888;
                    text-decoration: none;
                    margin-top: 20px;
                    font-family: 'Courier Prime', 'Courier New', monospace;
                    font-size: 14px;
                    letter-spacing: 2px;
                    padding: 20px;
                    transition: color 0.2s;
                    cursor: pointer;
                }

                .back-link:hover {
                    color: #ffffff;
                }
            `}</style>
        </div>
    );
}
