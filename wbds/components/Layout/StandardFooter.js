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
                    background: rgba(10, 10, 10, 0.3); /* Darker, more subtle */
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                    padding: 6px 18px;
                    border-radius: 20px;
                    display: flex;
                    gap: 20px;
                    border: 1px solid rgba(255, 255, 255, 0.03);
                    pointer-events: auto; /* Re-enable clicks on links */
                    transition: all 0.3s ease;
                }

                .footer-links:hover {
                     background: rgba(20, 20, 20, 0.5);
                     border-color: rgba(255, 255, 255, 0.08);
                }

                a {
                    color: var(--text-secondary, #8e8e93);
                    text-decoration: none;
                    font-size: 10px;
                    font-weight: 500;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                    transition: color 0.2s ease;
                    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                    opacity: 0.7;
                }

                a:hover {
                    color: var(--text-primary, #fff);
                }

                @media (max-width: 600px) {
                    .std-footer {
                        position: fixed; /* anchor to bottom */
                        width: 100%;
                        bottom: 20px;
                        left: 0;
                        margin: 0;
                        pointer-events: none; /* Let clicks pass through container */
                    }
                    .footer-links {
                        background: transparent;
                        border: none;
                        backdrop-filter: none;
                        padding: 0;
                        gap: 24px;
                        pointer-events: auto; /* Enable links */
                    }
                    a {
                        font-family: var(--font-mono); /* Tech feel */
                        font-size: 10px;
                        opacity: 0.4;
                        letter-spacing: 1px;
                        padding: 10px; /* Touch target */
                    }
                }
            `}</style>
        </footer>
    );
}
