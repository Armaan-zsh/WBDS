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
        // Start with real nodes
        const nodes = (letters || []).map(l => ({
            id: l.id,
            user: `Fragment #${l.id}`,
            val: 3, // Real nodes are bigger
            color: '#ffffff' // Real nodes are white
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

        // GHOST NODES (The Fake Universe)
        // If we don't have enough data, we simulate the "Archive"
        const ghostCount = 2000;
        for (let i = 0; i < ghostCount; i++) {
            nodes.push({
                id: `ghost-${i}`,
                user: 'Unknown Fragment',
                val: 0.5, // Tiny distant stars
                color: '#222' // Very faint
            });
        }

        // Connect ghosts randomly to create the "Web"
        for (let i = 0; i < ghostCount; i++) {
            // Link to a random neighbor (real or ghost)
            const targetIndex = Math.floor(Math.random() * nodes.length);
            // Avoid self-loops
            if (nodes[targetIndex].id !== `ghost-${i}`) {
                links.push({
                    source: `ghost-${i}`,
                    target: nodes[targetIndex].id,
                    color: '#111' // Almost invisible web
                });
            }
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
                backgroundColor="#000000" // Pure Black (No Theme)
                nodeLabel="user"
                nodeColor={() => "#555555"} // Dark Grey Nodes
                nodeRelSize={4}
                linkColor={() => "#333333"} // Faint Grey Links
                linkWidth={1}
                linkDirectionalParticles={1}
                linkDirectionalParticleSpeed={0.005} // Slow flow
                linkDirectionalParticleWidth={2}

                // Physics
                d3VelocityDecay={0.6} // Branding feel
                cooldownTicks={100}
                onEngineStop={() => {
                    if (graphRef.current) {
                        graphRef.current.zoomToFit(400);
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
