import { useCallback, useEffect, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  useNodesState,
  useEdgesState,
  type NodeTypes,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useNavigate } from "@tanstack/react-router";
import { CentralOrbNode } from "./nodes/CentralOrbNode";
import { MindMapNode } from "./nodes/MindMapNode";

const nodeTypes: NodeTypes = {
  mindMapNode: MindMapNode,
  centralOrb: CentralOrbNode,
};

type UserData = {
  user: { id: string; name: string };
  tracks: Array<{ id: string; languageLabel: string; proficiency: number }>;
};

export function MindMapFlow() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user")
      .then((res) => res.json())
      .then((data: UserData) => {
        setUserData(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch user data:", error);
        setIsLoading(false);
      });
  }, []);

  const trackId = userData?.tracks[0]?.id || "";

  // Center position
  const centerX = 500;
  const centerY = 400;
  const orbSize = 128;
  const radius = 350;

  // Node definitions with handle positions based on their angle
  const nodes_data = [
    {
      id: "vocabulary",
      label: "Vocabulary",
      icon: "📚",
      description: "Words you've learned",
      color: "emerald" as const,
      angle: -90, // Top
      targetHandle: "bottom", // Edge comes from bottom of node
      sourceHandle: "top", // Center connects to top
    },
    {
      id: "grammar",
      label: "Grammar",
      icon: "📝",
      description: "Grammar patterns",
      color: "amber" as const,
      angle: -30, // Top-right
      targetHandle: "left",
      sourceHandle: "right",
    },
    {
      id: "sessions",
      label: "Sessions",
      icon: "🎙️",
      description: "Practice sessions",
      color: "blue" as const,
      angle: 30, // Bottom-right
      targetHandle: "left",
      sourceHandle: "right",
    },
    {
      id: "rewrites",
      label: "Improvements",
      icon: "✨",
      description: "Sentence rewrites",
      color: "emerald" as const,
      angle: 90, // Bottom
      targetHandle: "top",
      sourceHandle: "bottom",
    },
    {
      id: "topics",
      label: "Topics",
      icon: "💡",
      description: "Suggested topics",
      color: "amber" as const,
      angle: 150, // Bottom-left
      targetHandle: "right",
      sourceHandle: "left",
    },
    {
      id: "stats",
      label: "Statistics",
      icon: "📊",
      description: "Your progress",
      color: "blue" as const,
      angle: 210, // Top-left
      targetHandle: "right",
      sourceHandle: "left",
    },
  ];

  const initialNodes: Node[] = [
    {
      id: "center",
      type: "centralOrb",
      position: { x: centerX, y: centerY },
      data: {},
      zIndex: 1,
      style: {
        width: orbSize,
        height: orbSize,
      },
    },
    ...nodes_data.map((node) => {
      const angleRad = node.angle * (Math.PI / 180);
      const x = centerX + radius * Math.cos(angleRad) - 100;
      const y = centerY + radius * Math.sin(angleRad) - 50;
      return {
        id: node.id,
        type: "mindMapNode",
        position: { x, y },
        data: node,
        zIndex: 10,
      };
    }),
  ];

  const initialEdges: Edge[] = nodes_data.map((node) => {
    // Determine which handle on the center orb to use based on node angle
    let centerSourceHandle = "right";
    const angle = node.angle;

    if (angle >= -135 && angle < -45) {
      centerSourceHandle = "top";
    } else if (angle >= -45 && angle < 45) {
      centerSourceHandle = "right";
    } else if (angle >= 45 && angle < 135) {
      centerSourceHandle = "bottom";
    } else {
      centerSourceHandle = "left";
    }

    return {
      id: `center-${node.id}`,
      source: "center",
      sourceHandle: centerSourceHandle,
      target: node.id,
      targetHandle: node.targetHandle,
      type: "bezier",
      animated: false, // Disable built-in animation, we use CSS
      className: "animated", // Add class for our CSS animation
      style: {
        stroke:
          node.color === "emerald"
            ? "#10b981"
            : node.color === "amber"
            ? "#f59e0b"
            : "#3b82f6",
        strokeWidth: 2,
        strokeDasharray: "8 8",
      },
      zIndex: 5,
    };
  });

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (node.id === "center") return;

      const routes: Record<string, string> = {
        vocabulary: `/vocabulary/${trackId}`,
        grammar: `/grammar/${trackId}`,
        sessions: `/sessions/${trackId}`,
        rewrites: `/rewrites/${trackId}`,
        topics: `/topics/${trackId}`,
        stats: `/stats/${trackId}`,
      };

      const route = routes[node.id];
      if (route) {
        navigate({ to: route });
      }
    },
    [navigate, trackId]
  );

  if (isLoading) {
    return (
      <div
        className="w-full h-full flex items-center justify-center pattern-grid-bg animated-overlay"
        style={{ width: "100vw", height: "100vh" }}
      >
        <div className="text-emerald-600 text-6xl animate-spin">⟳</div>
      </div>
    );
  }

  return (
    <div
      className="w-full h-full pattern-grid-bg animated-overlay"
      style={{ width: "100vw", height: "100vh" }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        elementsSelectable={true}
        fitView
        fitViewOptions={{
          padding: 0.2,
          includeHiddenNodes: false,
        }}
        minZoom={0.4}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          color="#a8a29e"
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1.5}
          style={{ opacity: 0.3 }}
        />
        <Controls />
      </ReactFlow>
    </div>
  );
}
