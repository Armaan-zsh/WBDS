import { useRef, useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with canvas
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
    ssr: false,
    loading: () => <div className="graph-loading">Initializing Neural Net...</div>
});

export default function GlobalGraph({ letters }) {
    const graphRef = useRef();
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    // Handle Resize
    useEffect(() => {
        const updateDim = () => {
            setDimensions({
                width: window.innerWidth,
                height: window.innerHeight
            });
        };

        updateDim();
        window.addEventListener('resize', updateDim);
        return () => window.removeEventListener('resize', updateDim);
    }, []);

    // Transform Data for Graph
    const graphData = useMemo(() => {
        const getColor = (theme) => {
            const colors = {
                'void': '#ffffff', // White
                'paper': '#fcd34d', // Gold/Yellow
                'rose': '#f472b6', // Pink
                'terminal': '#4ade80', // Green
                'hacker': '#4ade80',
                'ocean': '#60a5fa', // Blue
                'nord': '#81a1c1', // Nord Blue
                'sunset': '#fb923c', // Orange
                'default': '#ffffff'
            };
            // Random-ish fallback for others based on char code
            const fallbacks = ['#c084fc', '#2dd4bf', '#fb7185', '#a78bfa'];
            return colors[theme] || fallbacks[theme ? theme.length % fallbacks.length : 0];
        };

        // Start with real nodes
        const nodes = (letters || []).map(l => ({
            id: l.id,
            user: `Fragment #${l.id}`,
            val: 3,
            color: getColor(l.theme)
        }));

        const links = [];

        // Connect real nodes linearly
        for (let i = 0; i < nodes.length - 1; i++) {
            links.push({
                source: nodes[i].id,
                target: nodes[i + 1].id,
                color: '#444'
            });
        }

        return { nodes, links };
    }, [letters]);

    return (
        <div className="graph-wrapper">
            <ForceGraph2D
                ref={graphRef}
                width={dimensions.width}
                height={dimensions.height}
                graphData={graphData}

                // Visual Style (Obsidian-like)
                backgroundColor="#000000" // Pure Black
                nodeLabel="user"
                nodeColor={node => node.color || "#ffffff"}
                nodeRelSize={4}
                linkColor={() => "#333333"}
                linkWidth={1}
                linkDirectionalParticles={1}
                linkDirectionalParticleSpeed={0.005} // Slow flow
                linkDirectionalParticleWidth={2}

                // Physics - Smoother & Centered
                d3VelocityDecay={0.4} // Less friction = smoother float
                d3AlphaDecay={0.01}  // Slower decay = longer settling
                cooldownTicks={100}
                onEngineStop={() => {
                    if (graphRef.current) {
                        // Prevent infinite zoom on single/few nodes
                        if (graphData.nodes.length <= 2) {
                            graphRef.current.zoom(6, 400); // Fixed reasonable zoom
                            graphRef.current.centerAt(0, 0, 400);
                        } else {
                            graphRef.current.zoomToFit(400, 100); // 100px padding
                        }
                    }
                }}
            />

            <div className="overlay-info">
                <h3>FRAGMENT NETWORK</h3>
                <p>{letters.length} NODES CONNECTED</p>
            </div>

            <style jsx>{`
                .graph-wrapper {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    z-index: 5; /* Above background but below UI controls if needed */
                    background: black;
                }
                
                .graph-loading {
                    color: #444;
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-family: monospace;
                }

                .overlay-info {
                    position: absolute;
                    bottom: 40px;
                    left: 40px;
                    pointer-events: none;
                    font-family: monospace;
                    color: #444;
                }

                .overlay-info h3 {
                    font-size: 14px;
                    letter-spacing: 2px;
                    margin: 0 0 5px 0;
                }

                .overlay-info p {
                    font-size: 11px;
                    margin: 0;
                    opacity: 0.7;
                }
            `}</style>
        </div>
    );
}
