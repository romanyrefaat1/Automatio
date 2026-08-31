"use client";

import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

import type { AutomationNode } from "@/types/types";

type AutomationNodesContextType = {
  nodes: AutomationNode[];
  edges: Edge[];

  setNodes: React.Dispatch<React.SetStateAction<AutomationNode[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;

  onNodesChange: (changes: NodeChange<AutomationNode>[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;

  addNode: (node: AutomationNode) => void;
  removeNode: (nodeId: string) => void;
};

const AutomationNodesContext = createContext<
  AutomationNodesContextType | undefined
>(undefined);

const initialNodes: AutomationNode[] = [
  {
    id: "n1",
    position: { x: 0, y: 0 },
    data: {
      label: "Node 1",
    },
    type: "input",
  },
  {
    id: "n2",
    position: { x: 100, y: 100 },
    data: {
      label: "Node 2",
    },
    type: "output",
  },
];

const initialEdges: Edge[] = [
  {
    id: "n1-n2",
    source: "n1",
    target: "n2",
    type: "smoothstep",
    label: "connects with",
  },
];

export function AutomationNodesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [nodes, setNodes] =
    useState<AutomationNode[]>(initialNodes);

  const [edges, setEdges] =
    useState<Edge[]>(initialEdges);

  const onNodesChange = useCallback(
    (changes: NodeChange<AutomationNode>[]) => {
      setNodes((nodesSnapshot) =>
        applyNodeChanges(changes, nodesSnapshot)
      );
    },
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((edgesSnapshot) =>
        applyEdgeChanges(changes, edgesSnapshot)
      );
    },
    []
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((edgesSnapshot) =>
        addEdge(connection, edgesSnapshot)
      );
    },
    []
  );

  const addNode = useCallback((node: AutomationNode) => {
    setNodes((currentNodes) => [
      ...currentNodes,
      node,
    ]);
  }, []);

  const removeNode = useCallback((nodeId: string) => {
    setNodes((currentNodes) =>
      currentNodes.filter((node) => node.id !== nodeId)
    );

    setEdges((currentEdges) =>
      currentEdges.filter(
        (edge) =>
          edge.source !== nodeId &&
          edge.target !== nodeId
      )
    );
  }, []);

  return (
    <AutomationNodesContext.Provider
      value={{
        nodes,
        edges,

        setNodes,
        setEdges,

        onNodesChange,
        onEdgesChange,
        onConnect,

        addNode,
        removeNode,
      }}
    >
      {children}
    </AutomationNodesContext.Provider>
  );
}

export function useAutomationNodes() {
  const context = useContext(AutomationNodesContext);

  if (!context) {
    throw new Error(
      "useAutomationNodes must be used inside AutomationNodesProvider"
    );
  }

  return context;
}