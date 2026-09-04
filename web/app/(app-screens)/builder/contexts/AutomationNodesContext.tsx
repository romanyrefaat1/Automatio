"use client";

import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  MarkerType,
  type Connection,
  type Edge,
  type EdgeChange,
  type NodeChange,
  type XYPosition,
} from "@xyflow/react";

import ELK from "elkjs/lib/elk.bundled.js";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { AutomationNode } from "@/types/nodes";
import type { Tables } from "@/types/supabase-auto";

import { createClient } from "@/lib/supabase/client";

/*
 * ----------------------------------------
 * Database types
 * ----------------------------------------
 */

type AutomationStep = Tables<"automation_steps">;
type AutomationEdge = Tables<"automation_edges">;

/*
 * ----------------------------------------
 * Edge types
 * ----------------------------------------
 */

export type AutomationEdgeType =
  | "smoothstep"
  | "straight"
  | "step";

/*
 * ----------------------------------------
 * Editor state
 * ----------------------------------------
 */

type AutomationEditorState = {
  nodes: AutomationNode[];
  edges: Edge<AutomationEdgeType>[];
};

/*
 * ----------------------------------------
 * History
 * ----------------------------------------
 */

type AutomationHistory = {
  past: AutomationEditorState[];
  future: AutomationEditorState[];
};

/*
 * ----------------------------------------
 * Context
 * ----------------------------------------
 */

type AutomationNodesContextType = {
  nodes: AutomationNode[];
  edges: Edge<AutomationEdgeType>[];

  onNodesChange: (
    changes: NodeChange<AutomationNode>[]
  ) => void;

  onEdgesChange: (
    changes: EdgeChange[]
  ) => void;

  onConnect: (
    connection: Connection
  ) => void;

  /**
   * Ctrl/Cmd + click an edge:
   * delete the edge.
   *
   * Alt/Option + click an edge:
   * cycle its type:
   *
   * smoothstep -> straight
   * straight   -> step
   * step       -> smoothstep
   */
  onEdgeClick: (
    event: React.MouseEvent,
    edge: Edge<AutomationEdgeType>
  ) => void;

  /**
   * Add a node at the supplied flow position.
   */
  addNode: (
    node: AutomationNode,
    position?: XYPosition
  ) => void;

  /**
   * Remove a node and all connected edges.
   */
  removeNode: (
    nodeId: string
  ) => void;

  /**
   * Automatically arrange the workflow
   * using ELK.js.
   */
  autoLayout: () => Promise<void>;

  undo: () => void;
  redo: () => void;

  canUndo: boolean;
  canRedo: boolean;

  isDirty: boolean;
  isSaving: boolean;

  save: () => Promise<void>;
};

const AutomationNodesContext =
  createContext<
    AutomationNodesContextType | undefined
  >(undefined);

/*
 * ----------------------------------------
 * Provider props
 * ----------------------------------------
 */

type AutomationNodesProviderProps = {
  automationId: string;
  children: ReactNode;
};

/*
 * ----------------------------------------
 * ELK
 * ----------------------------------------
 */

const elk = new ELK();

const DEFAULT_NODE_WIDTH = 220;
const DEFAULT_NODE_HEIGHT = 90;

/*
 * ----------------------------------------
 * Provider
 * ----------------------------------------
 */

export function AutomationNodesProvider({
  automationId,
  children,
}: AutomationNodesProviderProps) {
  /*
   * ----------------------------------------
   * Graph state
   * ----------------------------------------
   */

  const [nodes, setNodes] =
    useState<AutomationNode[]>([]);

  const [edges, setEdges] =
    useState<Edge<AutomationEdgeType>[]>([]);

  /*
   * ----------------------------------------
   * Saved state
   * ----------------------------------------
   *
   * Used to determine whether the graph
   * has unsaved changes.
   */

  const [savedState, setSavedState] =
    useState<AutomationEditorState>({
      nodes: [],
      edges: [],
    });

  /*
   * ----------------------------------------
   * History
   * ----------------------------------------
   */

  const [history, setHistory] =
    useState<AutomationHistory>({
      past: [],
      future: [],
    });

  /*
   * ----------------------------------------
   * Loading / saving
   * ----------------------------------------
   */

  const [loading, setLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  /*
   * ----------------------------------------
   * Dirty state
   * ----------------------------------------
   */

  const isDirty =
    JSON.stringify({
      nodes,
      edges,
    }) !==
    JSON.stringify(savedState);

  /*
   * ----------------------------------------
   * Update graph
   * ----------------------------------------
   *
   * Every graph modification goes through
   * this function so that:
   *
   * 1. State is updated
   * 2. Undo history is created
   * 3. Redo history is cleared
   */

  const updateGraph = useCallback(
    (
      updater:
        | AutomationEditorState
        | ((
            previous: AutomationEditorState
          ) => AutomationEditorState),
      saveHistory = true
    ) => {
      const previousState: AutomationEditorState = {
        nodes,
        edges,
      };

      const nextState =
        typeof updater === "function"
          ? updater(previousState)
          : updater;

      if (
        JSON.stringify(previousState) ===
        JSON.stringify(nextState)
      ) {
        return;
      }

      setNodes(nextState.nodes);
      setEdges(nextState.edges);

      if (saveHistory) {
        setHistory(
          (currentHistory) => ({
            past: [
              ...currentHistory.past,
              previousState,
            ],
            future: [],
          })
        );
      }
    },
    [nodes, edges]
  );

  /*
   * ----------------------------------------
   * React Flow node changes
   * ----------------------------------------
   */

  const onNodesChange = useCallback(
    (
      changes: NodeChange<AutomationNode>[]
    ) => {
      const isDragging = changes.some(
        (change) =>
          change.type === "position" &&
          change.dragging
      );

      updateGraph(
        (currentState) => ({
          ...currentState,

          nodes: applyNodeChanges(
            changes,
            currentState.nodes
          ),
        }),
        !isDragging
      );
    },
    [updateGraph]
  );

  /*
   * ----------------------------------------
   * React Flow edge changes
   * ----------------------------------------
   */

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      updateGraph(
        (currentState) => ({
          ...currentState,

          edges: applyEdgeChanges(
            changes,
            currentState.edges
          ),
        })
      );
    },
    [updateGraph]
  );

  /*
   * ----------------------------------------
   * Edge click
   * ----------------------------------------
   *
   * Ctrl/Cmd + click:
   * Delete edge.
   *
   * Alt/Option + click:
   * Cycle edge type.
   */

  const onEdgeClick = useCallback(
    (
      event: React.MouseEvent,
      edge: Edge<AutomationEdgeType>
    ) => {
      /*
       * Ctrl/Cmd + click:
       * Delete the edge.
       */

      if (
        event.ctrlKey ||
        event.metaKey
      ) {
        event.preventDefault();
        event.stopPropagation();

        updateGraph(
          (currentState) => ({
            ...currentState,

            edges:
              currentState.edges.filter(
                (currentEdge) =>
                  currentEdge.id !==
                  edge.id
              ),
          })
        );

        return;
      }

      /*
       * Alt/Option + click:
       * Cycle the edge type.
       *
       * smoothstep -> straight
       * straight   -> step
       * step       -> smoothstep
       */

      if (event.altKey) {
        event.preventDefault();
        event.stopPropagation();

        updateGraph(
          (currentState) => {
            let nextType: AutomationEdgeType;

            switch (edge.type) {
              case "smoothstep":
                nextType = "straight";
                break;

              case "straight":
                nextType = "step";
                break;

              case "step":
                nextType = "smoothstep";
                break;

              default:
                nextType = "smoothstep";
            }

            return {
              ...currentState,

              edges:
                currentState.edges.map(
                  (currentEdge) =>
                    currentEdge.id ===
                    edge.id
                      ? {
                          ...currentEdge,
                          type: nextType,
                        }
                      : currentEdge
                ),
            };
          }
        );

        return;
      }
    },
    [updateGraph]
  );

  /*
   * ----------------------------------------
   * Connect nodes
   * ----------------------------------------
   */

  const onConnect = useCallback(
    (connection: Connection) => {
      if (
        !connection.source ||
        !connection.target
      ) {
        return;
      }

      updateGraph(
        (currentState) => ({
          ...currentState,

          edges: addEdge(
            {
              ...connection,

              id: crypto.randomUUID(),

              /*
               * New edges always start as
               * smoothstep.
               */

              type: "smoothstep",

              markerEnd: {
                type: MarkerType.ArrowClosed,
              },
            },
            currentState.edges
          ),
        })
      );
    },
    [updateGraph]
  );

  /*
   * ----------------------------------------
   * Add node
   * ----------------------------------------
   */

  const addNode = useCallback(
    (
      node: AutomationNode,
      position?: XYPosition
    ) => {
      updateGraph(
        (currentState) => ({
          nodes: [
            ...currentState.nodes,

            {
              ...node,

              ...(position
                ? {
                    position,
                  }
                : {}),
            },
          ],

          edges: currentState.edges,
        })
      );
    },
    [updateGraph]
  );

  /*
   * ----------------------------------------
   * Remove node
   * ----------------------------------------
   *
   * Also removes all edges connected to the
   * deleted node.
   */

  const removeNode = useCallback(
    (nodeId: string) => {
      updateGraph(
        (currentState) => ({
          nodes:
            currentState.nodes.filter(
              (node) =>
                node.id !== nodeId
            ),

          edges:
            currentState.edges.filter(
              (edge) =>
                edge.source !== nodeId &&
                edge.target !== nodeId
            ),
        })
      );
    },
    [updateGraph]
  );

  /*
   * ----------------------------------------
   * Auto layout
   * ----------------------------------------
   *
   * Uses ELK.js to arrange the workflow
   * from left -> right.
   *
   * Example:
   *
   * goto -> click -> fill -> press
   *
   * Branches become:
   *
   *                  -> fill
   * condition ->
   *                  -> screenshot
   */

  const autoLayout = useCallback(
    async () => {
      if (nodes.length === 0) {
        return;
      }

      try {
        /*
         * Build an ELK graph from the current
         * React Flow graph.
         */

        const graph = {
          id: "root",

          layoutOptions: {
            /*
             * Layered graph layout.
             */

            "elk.algorithm": "layered",

            /*
             * Left -> right.
             */

            "elk.direction": "DOWN",

            /*
             * Horizontal spacing between
             * nodes in the same layer.
             */

            "elk.spacing.nodeNode": "50",

            /*
             * Horizontal spacing between
             * layers.
             */

            "elk.layered.spacing.nodeNodeBetweenLayers":
              "100",

            /*
             * Additional space around
             * edges/nodes.
             */

            "elk.layered.spacing.edgeNodeBetweenLayers":
              "40",

            /*
             * Orthogonal routing works well
             * for workflow/tree diagrams.
             */

            "elk.edgeRouting":
              "ORTHOGONAL",

            /*
             * Good automatic node placement.
             */

            "elk.layered.nodePlacement.strategy":
              "NETWORK_SIMPLEX",

            /*
             * Try to minimize edge crossings.
             */

            "elk.layered.crossingMinimization.strategy":
              "LAYER_SWEEP",
          },

          /*
           * React Flow nodes -> ELK children.
           */

          children: nodes.map((node) => ({
            id: node.id,

            width:
              node.measured?.width ??
              node.width ??
              DEFAULT_NODE_WIDTH,

            height:
              node.measured?.height ??
              node.height ??
              DEFAULT_NODE_HEIGHT,
          })),

          /*
           * React Flow edges -> ELK edges.
           */

          edges: edges.map((edge) => ({
            id: edge.id,

            sources: [edge.source],

            targets: [edge.target],
          })),
        };

        /*
         * Ask ELK to calculate positions.
         */

        const result =
          await elk.layout(graph);

        /*
         * Apply ELK positions to the
         * React Flow nodes.
         */

        const layoutedNodes =
          nodes.map((node) => {
            const layoutNode =
              result.children?.find(
                (child) =>
                  child.id === node.id
              );

            if (!layoutNode) {
              return node;
            }

            return {
              ...node,

              position: {
                x:
                  layoutNode.x ??
                  node.position.x,

                y:
                  layoutNode.y ??
                  node.position.y,
              },
            };
          });

        /*
         * Put the layout change into
         * undo history.
         */

        updateGraph(
          (currentState) => ({
            ...currentState,

            nodes: layoutedNodes,
          }),
          true
        );

        /*
         * Tell the React Flow canvas that
         * layout finished.
         *
         * The canvas can listen for this
         * and call fitView().
         */

        window.dispatchEvent(
          new CustomEvent(
            "automatio:auto-layout-complete"
          )
        );
      } catch (err) {
        console.error(
          "Failed to auto-layout automation:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to auto-layout automation"
        );
      }
    },
    [nodes, edges, updateGraph]
  );

  /*
   * ----------------------------------------
   * Undo
   * ----------------------------------------
   */

  const undo = useCallback(() => {
    setHistory(
      (currentHistory) => {
        if (
          currentHistory.past.length === 0
        ) {
          return currentHistory;
        }

        const previous =
          currentHistory.past[
            currentHistory.past.length - 1
          ];

        const currentState:
          AutomationEditorState = {
          nodes,
          edges,
        };

        setNodes(previous.nodes);
        setEdges(previous.edges);

        return {
          past:
            currentHistory.past.slice(0, -1),

          future: [
            currentState,
            ...currentHistory.future,
          ],
        };
      }
    );
  }, [nodes, edges]);

  /*
   * ----------------------------------------
   * Redo
   * ----------------------------------------
   */

  const redo = useCallback(() => {
    setHistory(
      (currentHistory) => {
        if (
          currentHistory.future.length === 0
        ) {
          return currentHistory;
        }

        const next =
          currentHistory.future[0];

        const currentState:
          AutomationEditorState = {
          nodes,
          edges,
        };

        setNodes(next.nodes);
        setEdges(next.edges);

        return {
          past: [
            ...currentHistory.past,
            currentState,
          ],

          future:
            currentHistory.future.slice(1),
        };
      }
    );
  }, [nodes, edges]);

  /*
   * ----------------------------------------
   * Fetch graph
   * ----------------------------------------
   */

  const fetchGraph = useCallback(
    async () => {
      setLoading(true);
      setError(null);

      const supabase =
        createClient();

      try {
        const [
          stepsResult,
          edgesResult,
        ] = await Promise.all([
          /*
           * Fetch steps.
           */

          supabase
            .from("automation_steps")
            .select("*")
            .eq(
              "automation_id",
              automationId
            )
            .order("position", {
              ascending: true,
            }),

          /*
           * Fetch edges.
           */

          supabase
            .from("automation_edges")
            .select("*")
            .eq(
              "automation_id",
              automationId
            ),
        ]);

        if (stepsResult.error) {
          throw stepsResult.error;
        }

        if (edgesResult.error) {
          throw edgesResult.error;
        }

        /*
         * ----------------------------------------
         * Convert database steps -> React Flow
         * nodes
         * ----------------------------------------
         */

        const loadedNodes:
          AutomationNode[] =
          stepsResult.data.map(
            (step: AutomationStep) => ({
              id: step.id,

              type: step.type,

              position: {
                x: step.position_x,
                y: step.position_y,
              },

              data: {
                label: step.title,

                description:
                  step.description ?? "",

                config:
                  step.config,
              },
            })
          );

        /*
         * ----------------------------------------
         * Convert database edges -> React Flow
         * edges
         * ----------------------------------------
         */

        const loadedEdges:
          Edge<AutomationEdgeType>[] =
          edgesResult.data.map(
            (edge: AutomationEdge) => ({
              id: edge.id,

              source:
                edge.source_step_id,

              target:
                edge.target_step_id,

              type:
                (
                  edge.type as
                    | AutomationEdgeType
                    | null
                ) ?? "smoothstep",

              markerEnd: {
                type:
                  MarkerType.ArrowClosed,
              },
            })
          );

        /*
         * Apply loaded graph to frontend.
         */

        setNodes(loadedNodes);
        setEdges(loadedEdges);

        /*
         * Loaded graph becomes the
         * clean/saved version.
         */

        setSavedState({
          nodes: loadedNodes,
          edges: loadedEdges,
        });

        /*
         * Loading a graph resets undo/redo.
         */

        setHistory({
          past: [],
          future: [],
        });
      } catch (err) {
        console.error(
          "Failed to fetch automation graph:",
          err
        );

        setNodes([]);
        setEdges([]);

        setSavedState({
          nodes: [],
          edges: [],
        });

        setHistory({
          past: [],
          future: [],
        });

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load automation graph"
        );
      } finally {
        setLoading(false);
      }
    },
    [automationId]
  );

  /*
   * ----------------------------------------
   * Fetch graph when automation changes
   * ----------------------------------------
   */

  useEffect(() => {
    void fetchGraph();
  }, [fetchGraph]);

  /*
   * ----------------------------------------
   * Save graph
   * ----------------------------------------
   *
   * Sends BOTH nodes and edges to the RPC.
   *
   * Edge type is explicitly persisted.
   */

  const save = useCallback(
    async () => {
      if (!isDirty || isSaving) {
        return;
      }

      setIsSaving(true);
      setError(null);

      const supabase =
        createClient();

      try {
        /*
         * ----------------------------------------
         * Steps
         * ----------------------------------------
         */

        const stepsToSave =
          nodes.map((node, index) => ({
            id: node.id,

            position: index,

            position_x:
              node.position.x,

            position_y:
              node.position.y,

            title:
              node.data.label?.trim() ||
              "Untitled step",

            description:
              node.data.description?.trim() ||
              null,

            type: node.type,

            config:
              node.data.config ?? {},
          }));

        /*
         * ----------------------------------------
         * Edges
         * ----------------------------------------
         */

        const edgesToSave =
          edges.map((edge) => ({
            id: edge.id,

            type:
              edge.type ??
              "smoothstep",

            source_step_id:
              edge.source,

            target_step_id:
              edge.target,
          }));

        /*
         * ----------------------------------------
         * Save everything through one RPC
         * ----------------------------------------
         */

        const {
          error: saveError,
        } = await supabase.rpc(
          "save_automation_graph",
          {
            p_automation_id:
              automationId,

            p_steps:
              stepsToSave,

            p_edges:
              edgesToSave,
          }
        );

        if (saveError) {
          throw saveError;
        }

        /*
         * Current frontend graph is now
         * synchronized with Supabase.
         */

        setSavedState({
          nodes,
          edges,
        });
      } catch (err) {
        console.error(
          "Failed to save automation:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to save automation"
        );
      } finally {
        setIsSaving(false);
      }
    },
    [
      automationId,
      nodes,
      edges,
      isDirty,
      isSaving,
    ]
  );

  /*
   * ----------------------------------------
   * Keyboard shortcuts
   * ----------------------------------------
   *
   * Ctrl/Cmd + Z
   *     Undo
   *
   * Ctrl/Cmd + Shift + Z
   *     Redo
   *
   * Ctrl/Cmd + Y
   *     Redo
   *
   * Ctrl/Cmd + S
   *     Save
   *
   * Ctrl/Cmd + Shift + L
   *     Auto layout
   */

  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      const modifier =
        event.ctrlKey ||
        event.metaKey;

      /*
       * Undo
       */

      if (
        modifier &&
        event.key.toLowerCase() ===
          "z" &&
        !event.shiftKey
      ) {
        event.preventDefault();

        undo();

        return;
      }

      /*
       * Redo
       */

      if (
        modifier &&
        (
          (
            event.key.toLowerCase() ===
              "z" &&
            event.shiftKey
          ) ||
          event.key.toLowerCase() ===
            "y"
        )
      ) {
        event.preventDefault();

        redo();

        return;
      }

      /*
       * Save
       */

      if (
        modifier &&
        event.key.toLowerCase() ===
          "s"
      ) {
        event.preventDefault();

        void save();

        return;
      }

      /*
       * Auto layout
       */

      if (
        modifier &&
        event.shiftKey &&
        event.key.toLowerCase() ===
          "l"
      ) {
        event.preventDefault();

        void autoLayout();

        return;
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    undo,
    redo,
    save,
    autoLayout,
  ]);

  /*
   * ----------------------------------------
   * Provider
   * ----------------------------------------
   */

  return (
    <AutomationNodesContext.Provider
      value={{
        nodes,
        edges,

        onNodesChange,
        onEdgesChange,
        onConnect,
        onEdgeClick,

        addNode,
        removeNode,

        autoLayout,

        undo,
        redo,

        canUndo:
          history.past.length > 0,

        canRedo:
          history.future.length > 0,

        isDirty,
        isSaving,

        save,
      }}
    >
      {children}
    </AutomationNodesContext.Provider>
  );
}

/*
 * ----------------------------------------
 * Hook
 * ----------------------------------------
 */

export function useAutomationNodes() {
  const context =
    useContext(
      AutomationNodesContext
    );

  if (!context) {
    throw new Error(
      "useAutomationNodes must be used inside an AutomationNodesProvider"
    );
  }

  return context;
}