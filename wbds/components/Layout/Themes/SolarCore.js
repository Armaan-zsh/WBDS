export default function SolarCore() {
    return (
        <div className="solar-system">
            <div className="sun-core"></div>
            <div className="solar-flare flare-1"></div>
            <div className="solar-flare flare-2"></div>
            <div className="solar-flare flare-3"></div>

            <style jsx>{`
                .solar-system {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    z-index: -1;
                    background: #002b36; /* Deep solarized bg */
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    perspective: 1000px;
                }

                .sun-core {
                    width: 400px;
                    height: 400px;
                    background: radial-gradient(circle at 30% 30%, #fdf6e3, #b58900, #cb4b16);
                    border-radius: 50%;
                    box-shadow: 
                        0 0 60px #b58900, 
                        0 0 120px #cb4b16,
                        inset 0 0 40px rgba(253, 246, 227, 0.5);
                    animation: solar-pulse 4s ease-in-out infinite;
                    position: relative;
                    z-index: 2;
                }

                .solar-flare {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    border-radius: 50%;
                    z-index: 1;
                    filter: blur(20px);
                    opacity: 0.6;
                }

                .flare-1 {
                    width: 500px;
                    height: 500px;
                    background: conic-gradient(from 0deg, transparent, #b58900, transparent, #cb4b16, transparent);
                    animation: flare-movement 10s linear infinite;
                }

                .flare-2 {
                    width: 550px;
                    height: 550px;
                    background: conic-gradient(from 120deg, transparent, #cb4b16, transparent, #b58900, transparent);
                    animation: flare-movement 15s linear infinite reverse;
                }

                .flare-3 {
                    width: 600px;
                    height: 600px;
                    border: 2px solid rgba(181, 137, 0, 0.2);
                    animation: spin-accretion 20s linear infinite;
                }
            `}</style>
        </div>
    );
}
