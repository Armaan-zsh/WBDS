import { useRef, useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with canvas
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
    ssr: false,
    loading: () => <div className="graph-loading">Initializing Neural Net...</div>
});

export default function GlobalGraph({ letters, onNodeClick }) {
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

        const nodesMap = new Map();

        // Start with real nodes
        const nodes = (letters || []).map(l => {
            const node = {
                id: l.id,
                user: `Fragment #${l.id.toString().substring(0, 4)}`,
                val: 3,
                color: getColor(l.theme),
                data: l // Store full letter data
            };
            nodesMap.set(l.id, node);
            return node;
        });

        const links = [];

        // 1. Time Chain (Linear)
        // Connect i to i+1 (chronological) - Weak connection
        for (let i = 0; i < nodes.length - 1; i++) {
            links.push({
                source: nodes[i].id,
                target: nodes[i + 1].id,
                color: '#333', // Dark / Subtle
                width: 1,
                particles: 1 // Slow flow
            });
        }

        // 2. Thread Links (Semantic)
        // Connect Parent -> Child - Strong connection
        letters.forEach(l => {
            if (l.parent_id && nodesMap.has(l.parent_id)) {
                links.push({
                    source: l.parent_id,
                    target: l.id,
                    color: '#ffd700', // Gold
                    width: 3, // Thick
                    particles: 4 // Fast flow
                });
            }
        });

        return { nodes, links };
    }, [letters]);

    return (
        <div className="graph-wrapper">
            <ForceGraph2D
                ref={graphRef}
                width={dimensions.width}
                height={dimensions.height}
                graphData={graphData}
                onNodeClick={(node) => onNodeClick && onNodeClick(node.data)}

                // Visual Style (Obsidian-like)
                backgroundColor="#000000" // Pure Black
                nodeLabel="user"
                nodeColor={node => node.color || "#ffffff"}
                nodeRelSize={4}

                // Dynamic Link Style
                linkColor={link => link.color}
                linkWidth={link => link.width}
                linkDirectionalParticles={link => link.particles}
                linkDirectionalParticleSpeed={0.005}
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
