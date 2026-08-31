"use client";

import {
  ReactFlow,
  Background,
  Controls,
  Panel,
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
import AutomationTopInfo from "./AutomationTopInfo";
import CanvasSurviveButtons from "./CanvasSurviveButtons";
import { nodeTypes } from "@/types/types";
import { useEffect } from "react";

export default function AutomationCanvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useAutomationNodes();

 useEffect(() => {
    console.log("CANVAS NODES:", nodes);
  }, [nodes]);
  return (
    <div className="h-[100vh] w-full min-w-0">
      <ResizablePanelGroup direction="horizontal" className="h-full w-full">

        {/* Canvas */}
        <ResizablePanel defaultSize={75} minSize={50}>
          <div className="h-full w-full">
            <ReactFlow
  nodes={nodes}
  edges={edges}
  nodeTypes={nodeTypes}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
  onConnect={onConnect}
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
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right panel */}
        <ResizablePanel defaultSize={105} minSize={100} maxSize={800}>
          <RightPanel />
        </ResizablePanel>

      </ResizablePanelGroup>
    </div>
  );
}