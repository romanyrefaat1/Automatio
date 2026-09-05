"use client";

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
import { useCallback, useEffect, useRef, useState } from "react";

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

  /*
   * ----------------------------------------
   * Modifier + scroll panning
   * ----------------------------------------
   *
   * Plain scroll:
   *     Zoom (React Flow's default behavior —
   *     left untouched).
   *
   * Ctrl/Cmd + scroll:
   *     Pan vertically.
   *
   * Shift + scroll:
   *     Pan horizontally.
   *
   * React Flow's built-in zoomOnScroll/panOnScroll
   * config can't branch on modifier keys, so this is
   * handled with a native (non-passive) wheel listener
   * on the canvas wrapper. Native, not React's onWheel,
   * because some browsers won't let a synthetic handler
   * call preventDefault() on a wheel event over a
   * scrollable container — the pane would still shift.
   *
   * Only Ctrl/Cmd or Shift (not both, and not neither)
   * intercept the event; everything else falls through
   * to React Flow untouched.
   */

  const { getViewport, setViewport } = useReactFlow();

  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleWheel = useCallback(
    (event: WheelEvent) => {
      const modifierPan =
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey;

      if (!modifierPan) {
        return;
      }

      event.preventDefault();

      const viewport = getViewport();

      /*
       * Ctrl/Cmd: vertical pan.
       * Shift: horizontal pan.
       *
       * Some trackpads report a horizontal-intent
       * scroll as deltaX even without Shift, and a
       * Shift+wheel scroll as deltaX instead of deltaY
       * depending on the OS/browser — deltaY is used as
       * the magnitude either way so both input styles
       * feel consistent.
       */

      const delta =
        event.deltaY !== 0
          ? event.deltaY
          : event.deltaX;

      if (event.ctrlKey || event.metaKey) {
        setViewport({
          ...viewport,
          y: viewport.y - delta,
        });

        return;
      }

      if (event.shiftKey) {
        setViewport({
          ...viewport,
          x: viewport.x - delta,
        });
      }
    },
    [getViewport, setViewport]
  );

  useEffect(() => {
    const wrapper = wrapperRef.current;

    if (!wrapper) {
      return;
    }

    wrapper.addEventListener(
      "wheel",
      handleWheel,
      { passive: false }
    );

    return () => {
      wrapper.removeEventListener(
        "wheel",
        handleWheel
      );
    };
  }, [handleWheel]);

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
          <div className="h-full w-full" ref={wrapperRef}>
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