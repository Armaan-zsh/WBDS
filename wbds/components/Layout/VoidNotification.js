'use client';

import { useEffect, useState } from 'react';

export default function VoidNotification({ message, type = 'error', onClose }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Entrance animation
        requestAnimationFrame(() => setIsVisible(true));

        // Auto dismiss
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300); // Wait for exit animation
        }, 3000);

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`notification-container ${isVisible ? 'visible' : ''} ${type}`}>
            <style jsx>{`
        .notification-container {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%) translateY(-20px);
          background: rgba(20, 20, 20, 0.9);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 12px 24px;
          border-radius: 99px;
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--text-primary);
          font-size: 14px;
          font-weight: 500;
          opacity: 0;
          transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
          z-index: 9999;
          box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        }

        .notification-container.visible {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }

        .notification-container.error {
          border-color: rgba(255, 69, 58, 0.3);
          box-shadow: 0 0 20px rgba(255, 69, 58, 0.1);
        }

        .icon {
            font-size: 16px;
        }
      `}</style>
            <span className="icon">{type === 'error' ? '⛔' : 'ℹ️'}</span>
            <span>{message}</span>
        </div>
    );
}
