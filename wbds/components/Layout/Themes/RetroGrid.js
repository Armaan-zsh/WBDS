export default function RetroGrid() {
    return (
        <div className="synth-world">
            <div className="synth-sun"></div>
            <div className="grid-floor"></div>
            <div className="horizon-glow"></div>

            <style jsx>{`
                .synth-world {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    z-index: -1;
                    background: linear-gradient(to bottom, #10002b 0%, #240046 60%, #3c096c 100%);
                    overflow: hidden;
                    perspective: 600px;
                }

                .synth-sun {
                    position: absolute;
                    top: 15%;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 300px;
                    height: 300px;
                    background: linear-gradient(to bottom, #ff9e00, #ff0054);
                    border-radius: 50%;
                    box-shadow: 0 0 60px #ff0054, 0 0 100px #ff9e00;
                    z-index: 1;
                    /* "Cut" lines effect via mask or gradient */
                    -webkit-mask-image: linear-gradient(to bottom, black 0%, black 50%, transparent 50%, transparent 52%, black 52%, black 58%, transparent 58%, transparent 60%, black 60%, black 68%, transparent 68%, transparent 70%, black 70%, black 100%);
                }

                .horizon-glow {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    height: 60%;
                    background: linear-gradient(to top, rgba(255, 0, 255, 0.3) 0%, transparent 100%);
                    z-index: 5;
                    pointer-events: none;
                }

                .grid-floor {
                    position: absolute;
                    bottom: -50%;
                    left: -50%;
                    width: 200%;
                    height: 100%;
                    background-image: 
                        linear-gradient(rgba(255, 0, 255, 0.5) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255, 0, 255, 0.5) 1px, transparent 1px);
                    background-size: 40px 40px;
                    transform: rotateX(60deg) translateY(0);
                    transform-origin: 50% 0%;
                    animation: grid-move 1s linear infinite;
                    z-index: 2;
                    mask-image: linear-gradient(to top, black 40%, transparent 100%);
                    -webkit-mask-image: linear-gradient(to top, black 40%, transparent 100%);
                }
            `}</style>
        </div>
    );
}
