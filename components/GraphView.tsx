"use client";

import React, { useMemo, useEffect, memo } from "react";
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    NodeProps,
    Handle,
    Position,
    useNodesState,
    useEdgesState,
    Node,
    Edge,
    MarkerType,
    Panel,
    BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Message } from "./MessageList";
import dagre from "dagre";

interface GraphViewProps {
    messages: Message[];
}

// ── Category config ───────────────────────────────────────────
const CATEGORY: Record<string, { color: string; icon: string }> = {
    claim: { color: "#5e5ce6", icon: "📌" },
    evidence: { color: "#30d158", icon: "📊" },
    counterargument: { color: "#ff9f0a", icon: "⚡" },
    question: { color: "#ff453a", icon: "❓" },
    synthesis: { color: "#bf5af2", icon: "🔗" },
};

const DEFAULT_CAT = { color: "#6c63ff", icon: "💬" };

const NODE_W = 240;
const NODE_H = 130;
const ROOT_GAP = 300;

// ── Custom Node Component ─────────────────────────────────────
// Using a custom node avoids all of React Flow's default wrapper
// styling conflicts. Handles are added so edges connect properly.
const ReasoningNode = memo(({ data }: NodeProps) => {
    const d = data as {
        content: string;
        username: string;
        column_type: string;
    };
    const isAI = d.username === "AI-Moderator";
    const cat = CATEGORY[d.column_type] ?? DEFAULT_CAT;

    return (
        <div
            style={{
                width: NODE_W,
                background: isAI ? "#f0fdf6" : "#ffffff",
                border: `1px solid ${cat.color}40`,
                borderTop: `3px solid ${cat.color}`,
                borderRadius: 12,
                padding: "12px 14px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.08), 0 0 0 1px ${cat.color}20",
                fontFamily: "Inter, -apple-system, sans-serif",
                userSelect: "none",
            }}
        >
            {/* Target handle — where edges come IN from parent */}
            <Handle
                type="target"
                position={Position.Top}
                style={{ background: cat.color, width: 8, height: 8, border: "none" }}
            />

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: cat.color,
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                }}
                >
                    {cat.icon} {d.column_type}
                </span>
                <span style={{
                    fontSize: 9,
                    color: isAI ? "#16a34a" : "#6d6d72",
                    background: isAI ? "rgba(22,163,74,0.08)" : "rgba(0,0,0,0.05)",
                    padding: "2px 8px",
                    borderRadius: 20,
                    fontWeight: 600,
                }}>
                    {isAI ? "🤖 AI" : `👤 ${d.username}`}
                </span>
            </div>

            {/* Content */}
            <div style={{
                fontSize: 12,
                color: isAI ? "#166534" : "#3a3a3c",
                lineHeight: 1.55,
                maxHeight: 70,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 4,
                WebkitBoxOrient: "vertical",
                wordBreak: "break-word",
            }}>
                {d.content}
            </div>

            {/* Source handle — where edges go OUT to children */}
            <Handle
                type="source"
                position={Position.Bottom}
                style={{ background: cat.color, width: 8, height: 8, border: "none" }}
            />
        </div>
    );
});
ReasoningNode.displayName = "ReasoningNode";

// Register our custom node type
const nodeTypes = { reasoning: ReasoningNode };

// ── Dagre tree layout ─────────────────────────────────────────
// Each root message gets its own dagre sub-tree laid out TB.
// Sub-trees are placed side-by-side horizontally.
function buildTree(messages: Message[]) {
    if (!messages.length) return { nodes: [] as Node[], edges: [] as Edge[] };

    const idSet = new Set(messages.map((m) => m.id));

    // Build children map
    const childrenOf: Record<string, string[]> = {};
    messages.forEach((m) => (childrenOf[m.id] = []));
    messages.forEach((m) => {
        if (m.parent_id && idSet.has(m.parent_id)) {
            childrenOf[m.parent_id].push(m.id);
        }
    });

    // Roots = nodes with no valid parent in the current set
    const roots = messages.filter(
        (m) => !m.parent_id || !idSet.has(m.parent_id)
    );
    const byId = Object.fromEntries(messages.map((m) => [m.id, m]));

    const allNodes: Node[] = [];
    const allEdges: Edge[] = [];
    let xCursor = 0;

    for (const root of roots) {
        // BFS to collect the whole sub-tree
        const subtreeIds: string[] = [];
        const q = [root.id];
        while (q.length) {
            const cur = q.shift()!;
            subtreeIds.push(cur);
            (childrenOf[cur] ?? []).forEach((c) => q.push(c));
        }

        // Dagre layout for this sub-tree
        const g = new dagre.graphlib.Graph();
        g.setDefaultEdgeLabel(() => ({}));
        g.setGraph({ rankdir: "TB", nodesep: 48, ranksep: 80 });

        subtreeIds.forEach((id) =>
            g.setNode(id, { width: NODE_W, height: NODE_H })
        );
        subtreeIds.forEach((id) => {
            const msg = byId[id];
            if (msg?.parent_id && idSet.has(msg.parent_id)) {
                g.setEdge(msg.parent_id, id);
            }
        });

        dagre.layout(g);

        // Find local minX so sub-tree starts at xCursor
        let minX = Infinity;
        subtreeIds.forEach((id) => {
            const n = g.node(id);
            if (n) minX = Math.min(minX, n.x - NODE_W / 2);
        });

        let maxRight = 0;

        subtreeIds.forEach((id) => {
            const n = g.node(id);
            if (!n) return;
            const msg = byId[id];
            const posX = n.x - NODE_W / 2 - minX + xCursor;
            const posY = n.y - NODE_H / 2;
            maxRight = Math.max(maxRight, posX + NODE_W);

            allNodes.push({
                id,
                type: "reasoning",           // ← our custom type
                position: { x: posX, y: posY },
                data: {
                    content: msg.content,
                    username: msg.username,
                    column_type: msg.column_type ?? "claim",
                },
                draggable: true,
            } as Node);
        });

        // Build edges for this sub-tree
        subtreeIds.forEach((id) => {
            const msg = byId[id];
            if (!msg?.parent_id || !idSet.has(msg.parent_id)) return;
            const cat = CATEGORY[msg.column_type] ?? DEFAULT_CAT;
            allEdges.push({
                id: `e-${msg.parent_id}-${id}`,
                source: msg.parent_id,
                target: id,
                type: "smoothstep",
                animated: true,
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: cat.color,
                    width: 14, height: 14,
                },
                style: { stroke: cat.color, strokeWidth: 2, opacity: 0.8 },
            } as Edge);
        });

        xCursor = maxRight + ROOT_GAP;
    }

    return { nodes: allNodes, edges: allEdges };
}

// ── GraphView component ───────────────────────────────────────
export default function GraphView({ messages }: GraphViewProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);

    const { nodes: newNodes, edges: newEdges } = useMemo(
        () => buildTree(messages),
        [messages]
    );

    useEffect(() => {
        setNodes(newNodes);
        setEdges(newEdges);
    }, [newNodes, newEdges, setNodes, setEdges]);

    const legendItems = Object.entries(CATEGORY).map(([key, val]) => ({
        key, ...val,
    }));

    return (
        /* This wrapper MUST have explicit pixel or 100% height! */
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.18 }}
                colorMode="light"
                minZoom={0.15}
                maxZoom={2.5}
                proOptions={{ hideAttribution: true }}
                style={{ background: "#f2f2f7" }}
            >
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={24}
                    size={1.5}
                    color="rgba(0,0,0,0.1)"
                />
                <Controls showInteractive={false} />
                <MiniMap
                    nodeColor={(n) => {
                        const cat = CATEGORY[(n.data as any)?.column_type ?? ""];
                        return cat?.color ?? "#5e5ce6";
                    }}
                    style={{
                        background: "#ffffff",
                        border: "1px solid rgba(0,0,0,0.08)",
                        borderRadius: 8,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    }}
                    maskColor="rgba(0,0,0,0.06)"
                />

                {/* Legend panel */}
                <Panel position="top-right">
                    <div style={{
                        background: "#ffffff",
                        border: "1px solid rgba(0,0,0,0.08)",
                        borderRadius: 10,
                        padding: "10px 14px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 5,
                        minWidth: 150,
                        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                    }}>
                        <p style={{ color: "#aeaeb2", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>Legend</p>
                        {legendItems.map((li) => (
                            <div key={li.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ width: 10, height: 10, borderRadius: 3, background: li.color, flexShrink: 0 }} />
                                <span style={{ color: "#3a3a3c", fontSize: 11, textTransform: "capitalize" }}>{li.icon} {li.key}</span>
                            </div>
                        ))}
                        <div style={{ borderTop: "1px solid rgba(0,0,0,0.07)", paddingTop: 5, marginTop: 3, color: "#aeaeb2", fontSize: 10 }}>
                            🌲 Tree — drag to rearrange
                        </div>
                    </div>
                </Panel>

                {/* Empty state */}
                {nodes.length === 0 && (
                    <Panel position="top-center">
                        <div style={{
                            color: "#aeaeb2",
                            fontSize: 14,
                            marginTop: 80,
                            textAlign: "center",
                            fontFamily: "Inter, sans-serif",
                        }}>
                            <div style={{ fontSize: 36, marginBottom: 12 }}>🌿</div>
                            Add your first claim or question to build the reasoning tree.
                        </div>
                    </Panel>
                )}
            </ReactFlow>
        </div>
    );
}
