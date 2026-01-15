export default function EventHorizon() {
    return (
        <div className="black-hole-system">
            <div className="accretion-disk"></div>
            <div className="event-horizon"></div>
            <div className="photon-ring"></div>
            <div className="gravitational-lens"></div>

            <style jsx>{`
                .black-hole-system {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    z-index: -1;
                    background: #000;
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    perspective: 1000px;
                }

                .event-horizon {
                    width: 300px;
                    height: 300px;
                    background: #000;
                    border-radius: 50%;
                    box-shadow: 0 0 60px rgba(0,0,0,1);
                    z-index: 10;
                    position: absolute;
                    animation: horizon-pulse 8s infinite alternate;
                }

                .photon-ring {
                    width: 310px;
                    height: 310px;
                    border-radius: 50%;
                    border: 2px solid rgba(255, 255, 255, 0.6);
                    box-shadow: 0 0 20px rgba(255, 255, 255, 0.4);
                    z-index: 9;
                    position: absolute;
                    filter: blur(1px);
                }

                .accretion-disk {
                    width: 900px;
                    height: 900px;
                    background: conic-gradient(
                        from 0deg, 
                        transparent 0%, 
                        rgba(100, 50, 255, 0.1) 20%, 
                        rgba(200, 100, 255, 0.4) 40%, 
                        rgba(255, 200, 255, 0.8) 50%,
                        rgba(200, 100, 255, 0.4) 60%,
                        rgba(100, 50, 255, 0.1) 80%,
                        transparent 100%
                    );
                    border-radius: 50%;
                    position: absolute;
                    animation: spin-accretion 20s linear infinite;
                    filter: blur(30px);
                    opacity: 0.7;
                    transform: rotateX(70deg); /* Tilt it */
                }

                .gravitational-lens {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    background: radial-gradient(circle at center, transparent 30%, rgba(20, 0, 40, 0.4) 80%);
                    z-index: 5;
                    pointer-events: none;
                }
            `}</style>
        </div>
    );
}
