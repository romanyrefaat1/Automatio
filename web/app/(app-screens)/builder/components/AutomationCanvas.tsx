"use client";

import {
  ReactFlow,
  Background,
  Controls,
  Panel,
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
import { useState } from "react";

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

  const [menuState, setMenuState] = useState<{
    nodeId: string;
    position: {
      x: number;
      y: number;
    };
  } | null>(null);

  const onNodeContextMenu: NodeMouseHandler = (event, node) => {
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
    <div className="h-screen w-full min-w-0">
      <ResizablePanelGroup
        direction="horizontal"
        className="h-full w-full"
        autoSaveId="automation-builder-layout"
      >
        {/* CANVAS */}
        <ResizablePanel
          id="canvas"
          defaultSize={70}
          minSize={30}
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
              onPaneClick={() => setMenuState(null)}
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
              nodeId={menuState?.nodeId ?? null}
              position={menuState?.position ?? null}
              onClose={() => setMenuState(null)}
              onDelete={removeNode}
            />
          </div>
        </ResizablePanel>

        {/* HANDLE */}
        <ResizableHandle withHandle />

        {/* RIGHT PANEL */}
        <ResizablePanel
          id="rightPanel"
          defaultSize={30}
          minSize={20}
        >
          <div className="h-full w-full overflow-hidden">
            <RightPanel />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}