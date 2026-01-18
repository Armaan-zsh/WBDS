'use client';

import { useState, useEffect } from 'react';

export default function StandardFooter({ onSettingsClick, isSettingsOpen }) {
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

    useEffect(() => {
        // Function to check if an input element is focused
        const handleFocusChange = () => {
            const activeElement = document.activeElement;
            const isInput = activeElement && (
                activeElement.tagName === 'INPUT' ||
                activeElement.tagName === 'TEXTAREA' ||
                activeElement.isContentEditable
            );
            
            setIsKeyboardOpen(isInput);
        };

        // Listen for focus and blur events globally
        // 'focusin' and 'focusout' bubble, while 'focus' and 'blur' do not
        window.addEventListener('focusin', handleFocusChange);
        window.addEventListener('focusout', handleFocusChange);

        // Backup: Visual Viewport API for devices where focus might be tricky
        // If the viewport shrinks by more than 20%, it's likely the keyboard
        const handleResize = () => {
             if (window.visualViewport) {
                const heightRatio = window.visualViewport.height / window.screen.height;
                if (heightRatio < 0.7) {
                    setIsKeyboardOpen(true);
                } else if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
                    // Only reset if we aren't focused on an input
                    setIsKeyboardOpen(false);
                }
             }
        };

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleResize);
        }

        return () => {
            window.removeEventListener('focusin', handleFocusChange);
            window.removeEventListener('focusout', handleFocusChange);
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', handleResize);
            }
        };
    }, []);

    // If keyboard is open (user is typing), DO NOT RENDER the footer at all
    if (isKeyboardOpen) return null;

    return (
        <footer className="std-footer">
            <div className="footer-links">
                <a href="/report">REPORT A BUG</a>
                <button
                    className="footer-settings-btn"
                    onClick={onSettingsClick}
                >
                    SETTINGS
                </button>
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
                    z-index: 10000;
                    pointer-events: none; /* Let clicks pass through empty areas */
                    touch-action: none; /* Prevent scrolling on footer */
                    transition: opacity 0.2s ease; /* Smooth fade out if state changes */
                }

                .footer-links {
                    background: rgba(10, 10, 10, 0.3); /* Darker, more subtle */
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                    padding: 6px 18px;
                    border-radius: 20px;
                    display: flex;
                    gap: 0; /* Remove gap, use margin instead for even spacing */
                    align-items: center; /* Center items vertically */
                    justify-content: center; /* Center items horizontally */
                    border: 1px solid rgba(255, 255, 255, 0.03);
                    pointer-events: auto; /* Re-enable clicks on links */
                    transition: all 0.3s ease;
                }

                .footer-links a:not(:last-child),
                .footer-links .footer-settings-btn {
                    margin-right: 18px; /* Even spacing between items */
                }

                .footer-links a:last-child {
                    margin-right: 0;
                }

                .footer-links > * {
                    display: flex;
                    align-items: center;
                    height: 100%;
                }

                .footer-links:hover {
                     background: rgba(20, 20, 20, 0.5);
                     border-color: rgba(255, 255, 255, 0.08);
                }

                a, .footer-settings-btn {
                    color: var(--text-secondary, #8e8e93);
                    text-decoration: none;
                    font-size: 10px;
                    font-weight: 500;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                    transition: color 0.2s ease;
                    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                    opacity: 0.7;
                    padding: 0;
                    margin: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    line-height: 1;
                    height: auto;
                }

                .footer-settings-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                }

                a:hover, .footer-settings-btn:hover {
                    color: var(--text-primary, #fff);
                }

                .footer-settings-btn {
                    display: none; /* GRID HIDE on Desktop */
                }

                @media (max-width: 768px) {
                    .footer-settings-btn {
                        display: block; /* Show ONLY on mobile */
                        opacity: ${isSettingsOpen ? 1 : 0.7};
                        color: ${isSettingsOpen ? 'var(--text-primary, #fff)' : 'var(--text-secondary, #8e8e93)'};
                    }

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
                        gap: 0; /* Remove gap, use margin instead */
                        pointer-events: auto; /* Enable links */
                    }

                    .footer-links a:not(:last-child),
                    .footer-links .footer-settings-btn {
                        margin-right: 18px; /* Even spacing on mobile */
                    }

                    .footer-links a:last-child {
                        margin-right: 0;
                    }
                    a, .footer-settings-btn {
                        font-family: var(--font-mono); /* Tech feel */
                        font-size: 10px;
                        opacity: 0.4;
                        letter-spacing: 1px;
                        padding: 10px; /* Touch target */
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        line-height: 1;
                        margin: 0;
                        height: auto;
                    }

                    .footer-settings-btn {
                        opacity: ${isSettingsOpen ? 0.7 : 0.4};
                    }
                }
            `}</style>
        </footer>
    );
}
