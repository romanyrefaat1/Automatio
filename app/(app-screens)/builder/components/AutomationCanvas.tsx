"use client";

import {
  ReactFlow,
  Background,
  Controls,
  applyEdgeChanges,
  applyNodeChanges,
  addEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import RightPanel from "./RightPanel";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useAutomationNodes } from "../contexts/AutomationNodesContext";

export default function AutomationCanvas() {
  const {nodes, edges, onNodesChange, onEdgesChange, onConnect} = useAutomationNodes()  

  return (
    <div className="h-[100vh] w-full min-w-0">
      <ResizablePanelGroup
        direction="horizontal"
        className="h-full w-full"
      >
        {/* Canvas */}
        <ResizablePanel
          defaultSize={75}
          minSize={50}
        >
          <div className="h-full w-full">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              fitView
            >
              <Background />
              <Controls />
            </ReactFlow>
          </div>
        </ResizablePanel>

        {/* Handle */}
        <ResizableHandle withHandle />

        {/* Right panel */}
        <ResizablePanel
          defaultSize={40}
          minSize={20}
          maxSize={500}
        >
          <RightPanel />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}