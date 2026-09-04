"use client";

import { useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Panel,
  useReactFlow,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import RightPanel from "./RightPanel";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useAutomationNodes } from "../contexts/AutomationNodesContext";
import AutomationTopInfo from "./AutomationTopInfo";
import CanvasSurviveButtons from "./CanvasSurviveButtons";
import { nodeTypes } from "@/types/nodes";
import NodeContextMenu from "@/components/nodes/NodeContextMenu";

export default function AutomationCanvas() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onEdgeClick,
    removeNode,
  } = useAutomationNodes();

  const { screenToFlowPosition } = useReactFlow();

  const [menuState, setMenuState] = useState<{
    nodeId: string;
    position: { x: number; y: number };
  } | null>(null);

  const onNodeContextMenu: NodeMouseHandler = (
    event,
    node
  ) => {
    event.preventDefault();

    setMenuState({
      nodeId: node.id,
      position: {
        x: event.clientX,
        y: event.clientY,
      },
    });
  };

  return (
    <div className="h-[100vh] w-full min-w-0">
      <ResizablePanelGroup
        direction="horizontal"
        className="h-full w-full"
      >
        <ResizablePanel
          defaultSize={75}
          minSize={50}
        >
          <div className="h-full w-full">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onEdgeClick={onEdgeClick}
              onNodeContextMenu={onNodeContextMenu}
              onPaneClick={() =>
                setMenuState(null)
              }
              fitView
            >
              <Background />
              <Controls />

              <Panel position="top-left">
                <AutomationTopInfo />
              </Panel>

              <Panel position="top-right">
                <CanvasSurviveButtons />
              </Panel>
            </ReactFlow>

            <NodeContextMenu
              nodeId={
                menuState?.nodeId ?? null
              }
              position={
                menuState?.position ?? null
              }
              onClose={() =>
                setMenuState(null)
              }
              onDelete={removeNode}
            />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel
          defaultSize={105}
          minSize={100}
          maxSize={800}
        >
          <RightPanel />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}