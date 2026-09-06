"use client";

import {
  ReactFlow,
  Background,
  Controls,
  Panel,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useEffect, useMemo, useState } from "react";

import RightPanel from "./RightPanel";
import AutomationTopInfo from "./AutomationTopInfo";
import CanvasSurviveButtons from "./CanvasSurviveButtons";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

import { useAutomationNodes } from "../contexts/AutomationNodesContext";
import { useAutomationContext } from "../contexts/AutomationContext";

import { nodeTypes } from "@/types/nodes";
import NodeContextMenu from "@/components/nodes/NodeContextMenu";

export default function AutomationCanvas() {
  const {
    nodes,
    edges,
    loading,
    error,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onEdgeClick,
    removeNode,
  } = useAutomationNodes();

  const {
    isRunning,
    activeRun,
    runSteps,
    runningStepId,
  } = useAutomationContext();

  const [menuState, setMenuState] = useState<{
    nodeId: string;
    position: {
      x: number;
      y: number;
    };
  } | null>(null);

  const [layoutReady, setLayoutReady] = useState(false);

  useEffect(() => {
    setLayoutReady(true);
  }, []);

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

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background p-6">
        <div className="w-full max-w-md rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold">
            Failed to load automation
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full min-w-0">
      {layoutReady && (
        <ResizablePanelGroup
          direction="horizontal"
          className="h-full w-full"
          autoSaveId="automation-builder-layout-v2"
        >
          <ResizablePanel
            id="canvas"
            defaultSize={70}
            minSize={30}
            className="min-w-0"
          >
            <div className="relative h-full w-full overflow-hidden">
              <div
                className={
                  loading
                    ? "h-full w-full animate-pulse"
                    : "h-full w-full"
                }
              >
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
                  fitView={!loading}
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

              {loading && (
                <div className="pointer-events-none absolute inset-0 z-50 bg-background/20" />
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel
            id="rightPanel"
            defaultSize={30}
            minSize={20}
            className="min-w-0"
          >
            <div className="h-full w-full overflow-hidden">
              <RightPanel />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </div>
  );
}