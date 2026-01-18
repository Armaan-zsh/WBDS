export default function StandardFooter() {
    return (
        <footer className="std-footer">
            <div className="footer-links">
                <a href="/report">REPORT A BUG</a>
                <a href="/legal">LEGAL</a>
            </div>
            <style jsx>{`
                .std-footer {
                    position: fixed;
                    bottom: 20px;
                    left: 0;
                    width: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 100;
                    pointer-events: none; /* Let clicks pass through empty areas */
                }

                .footer-links {
                    background: rgba(20, 20, 20, 0.4);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    padding: 8px 24px;
                    border-radius: 100px;
                    display: flex;
                    gap: 24px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    pointer-events: auto; /* Re-enable clicks on links */
                    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                    transition: all 0.3s ease;
                }

                .footer-links:hover {
                     background: rgba(20, 20, 20, 0.6);
                     border-color: rgba(255, 255, 255, 0.1);
                }

                a {
                    color: var(--text-secondary, #8e8e93);
                    text-decoration: none;
                    font-size: 11px;
                    font-weight: 600;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                    transition: color 0.2s ease;
                    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                }

                a:hover {
                    color: var(--text-primary, #fff);
                }

                @media (max-width: 600px) {
                    .std-footer {
                        bottom: 10px;
                    }
                    .footer-links {
                        padding: 6px 16px;
                        gap: 16px;
                    }
                    a {
                        font-size: 10px;
                    }
                }
            `}</style>
        </footer>
    );
}
