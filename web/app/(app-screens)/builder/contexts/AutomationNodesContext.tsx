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

  loading: boolean;
  error: string | null;

  isSaving: boolean;
  isAutoLayouting: boolean;

  onNodesChange: (
    changes: NodeChange<AutomationNode>[]
  ) => void;

  onEdgesChange: (
    changes: EdgeChange[]
  ) => void;

  onConnect: (
    connection: Connection
  ) => void;

  onEdgeClick: (
    event: React.MouseEvent,
    edge: Edge<AutomationEdgeType>
  ) => void;

  addNode: (
    node: AutomationNode,
    position?: XYPosition
  ) => void;

  removeNode: (
    nodeId: string
  ) => void;

  autoLayout: () => Promise<void>;

  undo: () => void;
  redo: () => void;

  canUndo: boolean;
  canRedo: boolean;

  isDirty: boolean;

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
 * Node size hints
 * ----------------------------------------
 */

const NODE_SIZE_HINTS: Record<
  string,
  {
    width: number;
    height: number;
  }
> = {
  condition: {
    width: 260,
    height: 120,
  },

  loop: {
    width: 260,
    height: 120,
  },

  parallel: {
    width: 260,
    height: 110,
  },

  trigger: {
    width: 200,
    height: 80,
  },
};

function getNodeSize(
  node: AutomationNode
) {
  const hint =
    NODE_SIZE_HINTS[node.type ?? ""];

  return {
    width:
      node.measured?.width ??
      node.width ??
      hint?.width ??
      DEFAULT_NODE_WIDTH,

    height:
      node.measured?.height ??
      node.height ??
      hint?.height ??
      DEFAULT_NODE_HEIGHT,
  };
}

/*
 * ----------------------------------------
 * Branch handle order
 * ----------------------------------------
 */

const BRANCH_HANDLE_ORDER = [
  "true",
  "false",
  "body",
  "done",
];

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
   * Async state
   * ----------------------------------------
   *
   * Each async operation has its own loading
   * state and error state.
   */

  const [loading, setLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [isAutoLayouting, setIsAutoLayouting] =
    useState(false);

  const [loadError, setLoadError] =
    useState<string | null>(null);

  const [saveError, setSaveError] =
    useState<string | null>(null);

  const [layoutError, setLayoutError] =
    useState<string | null>(null);

  /*
   * Public error.
   *
   * Loading errors have the highest priority,
   * followed by save and layout errors.
   */

  const error =
    loadError ??
    saveError ??
    layoutError;

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
        return false;
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

      return true;
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
       * Ctrl/Cmd + click
       *
       * Delete edge.
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
                  currentEdge.id !== edge.id
              ),
          })
        );

        return;
      }

      /*
       * Alt/Option + click
       *
       * Cycle edge type.
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
                    currentEdge.id === edge.id
                      ? {
                          ...currentEdge,
                          type: nextType,
                        }
                      : currentEdge
                ),
            };
          }
        );
      }
    },
    [updateGraph]
  );

  /*
   * ----------------------------------------
   * Connect nodes
   * ----------------------------------------
   *
   * IMPORTANT:
   *
   * sourceHandle MUST be preserved.
   *
   * Condition nodes use:
   *
   * true
   * false
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

              type: "smoothstep",

              sourceHandle:
                connection.sourceHandle ??
                undefined,

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
   */

  const autoLayout = useCallback(
    async () => {
      if (
        nodes.length === 0 ||
        isAutoLayouting
      ) {
        return;
      }

      setIsAutoLayouting(true);
      setLayoutError(null);

      try {
        /*
         * Group outgoing edges by source.
         */

        const outgoingBySource = new Map<
          string,
          Edge<AutomationEdgeType>[]
        >();

        for (const edge of edges) {
          const existing =
            outgoingBySource.get(
              edge.source
            ) ?? [];

          existing.push(edge);

          outgoingBySource.set(
            edge.source,
            existing
          );
        }

        /*
         * Sort outgoing edges by branch handle.
         */

        const sortedOutgoing = (
          sourceId: string
        ) => {
          const outgoing =
            outgoingBySource.get(
              sourceId
            ) ?? [];

          return [...outgoing].sort(
            (a, b) => {
              const aIndex =
                BRANCH_HANDLE_ORDER.indexOf(
                  a.sourceHandle ?? ""
                );

              const bIndex =
                BRANCH_HANDLE_ORDER.indexOf(
                  b.sourceHandle ?? ""
                );

              const aRank =
                aIndex === -1
                  ? BRANCH_HANDLE_ORDER.length
                  : aIndex;

              const bRank =
                bIndex === -1
                  ? BRANCH_HANDLE_ORDER.length
                  : bIndex;

              return aRank - bRank;
            }
          );
        };

        /*
         * Build ELK children.
         */

        const children = nodes.map(
          (node) => {
            const size =
              getNodeSize(node);

            const outgoing =
              sortedOutgoing(node.id);

            const needsPorts =
              outgoing.length > 1;

            return {
              id: node.id,

              width: size.width,

              height: size.height,

              ...(needsPorts
                ? {
                    layoutOptions: {
                      "elk.portConstraints":
                        "FIXED_ORDER",
                    },

                    ports: outgoing.map(
                      (
                        edge,
                        index
                      ) => ({
                        id: `${node.id}__port__${edge.sourceHandle ?? index}`,

                        layoutOptions: {
                          "elk.port.side":
                            "SOUTH",

                          "elk.port.index":
                            String(index),
                        },
                      })
                    ),
                  }
                : {}),
            };
          }
        );

        /*
         * Map React Flow edges to
         * ELK port ids.
         */

        const portLookup = new Map<
          string,
          string
        >();

        for (const node of nodes) {
          const outgoing =
            sortedOutgoing(node.id);

          if (outgoing.length <= 1) {
            continue;
          }

          outgoing.forEach(
            (edge, index) => {
              portLookup.set(
                edge.id,
                `${node.id}__port__${edge.sourceHandle ?? index}`
              );
            }
          );
        }

        /*
         * Build ELK graph.
         */

        const graph = {
          id: "root",

          layoutOptions: {
            "elk.algorithm": "layered",

            "elk.direction": "DOWN",

            "elk.spacing.nodeNode":
              "60",

            "elk.layered.spacing.nodeNodeBetweenLayers":
              "110",

            "elk.layered.spacing.edgeNodeBetweenLayers":
              "40",

            "elk.edgeRouting":
              "ORTHOGONAL",

            "elk.layered.nodePlacement.strategy":
              "NETWORK_SIMPLEX",

            "elk.layered.crossingMinimization.strategy":
              "LAYER_SWEEP",

            "elk.separateConnectedComponents":
              "true",

            "elk.spacing.componentComponent":
              "120",
          },

          children,

          edges: edges.map(
            (edge) => ({
              id: edge.id,

              sources: [
                portLookup.get(
                  edge.id
                ) ?? edge.source,
              ],

              targets: [edge.target],
            })
          ),
        };

        /*
         * Run ELK.
         */

        const result =
          await elk.layout(graph);

        /*
         * Apply calculated positions.
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
         * Update graph only if something
         * actually changed.
         */

        const changed = updateGraph(
          (currentState) => ({
            ...currentState,

            nodes: layoutedNodes,
          }),
          true
        );

        if (changed) {
          window.dispatchEvent(
            new CustomEvent(
              "automatio:auto-layout-complete"
            )
          );
        }
      } catch (err) {
        console.error(
          "Failed to auto-layout automation:",
          err
        );

        setLayoutError(
          err instanceof Error
            ? err.message
            : "Failed to auto-layout automation"
        );
      } finally {
        setIsAutoLayouting(false);
      }
    },
    [
      nodes,
      edges,
      updateGraph,
      isAutoLayouting,
    ]
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
      setLoadError(null);

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
         * Database steps -> React Flow nodes
         * ----------------------------------------
         */

        const loadedNodes:
          AutomationNode[] =
          stepsResult.data.map(
            (
              step: AutomationStep
            ) => ({
              id: step.id,

              type: step.type,

              position: {
                x: step.position_x,
                y: step.position_y,
              },

              data: {
                label: step.title,

                description:
                  step.description ??
                  "",

                config:
                  step.config,
              },
            })
          );

        /*
         * ----------------------------------------
         * Database edges -> React Flow edges
         * ----------------------------------------
         */

        const loadedEdges:
          Edge<AutomationEdgeType>[] =
          edgesResult.data.map(
            (
              edge: AutomationEdge
            ) => ({
              id: edge.id,

              source:
                edge.source_step_id,

              target:
                edge.target_step_id,

              sourceHandle:
                edge.source_handle ??
                undefined,

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
         * ----------------------------------------
         * Apply graph
         * ----------------------------------------
         */

        setNodes(loadedNodes);

        setEdges(loadedEdges);

        /*
         * Loaded graph becomes the
         * current saved state.
         */

        setSavedState({
          nodes: loadedNodes,
          edges: loadedEdges,
        });

        /*
         * Reset history.
         */

        setHistory({
          past: [],
          future: [],
        });

        setLoadError(null);
      } catch (err) {
        console.error(
          "Failed to fetch automation graph:",
          err
        );

        /*
         * IMPORTANT:
         *
         * Do NOT clear the existing graph.
         *
         * The user should still be able to
         * see/use the last successfully loaded
         * graph while the error is displayed.
         */

        setLoadError(
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
   * Fetch when automation changes
   * ----------------------------------------
   */

  useEffect(() => {
    void fetchGraph();
  }, [fetchGraph]);

  /*
   * ----------------------------------------
   * Save graph
   * ----------------------------------------
   */

  const save = useCallback(
    async () => {
      /*
       * Don't save when:
       *
       * - nothing changed
       * - another save is running
       * - initial graph loading is running
       */

      if (
        !isDirty ||
        isSaving ||
        loading
      ) {
        return;
      }

      setIsSaving(true);
      setSaveError(null);

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

            source_handle:
              edge.sourceHandle ??
              null,
          }));

        console.log(
          "Edges being saved:",
          edgesToSave
        );

        /*
         * ----------------------------------------
         * Save through RPC
         * ----------------------------------------
         */

        const {
          error: rpcError,
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

        if (rpcError) {
          throw rpcError;
        }

        /*
         * Save succeeded.
         *
         * The current frontend state is now
         * synchronized with Supabase.
         */

        setSavedState({
          nodes,
          edges,
        });

        setSaveError(null);
      } catch (err) {
        console.error(
          "Failed to save automation:",
          err
        );

        /*
         * IMPORTANT:
         *
         * Keep the graph dirty.
         *
         * Supabase does not contain this
         * frontend state because the save failed.
         */

        setSaveError(
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
      loading,
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
       * ----------------------------------------
       * Undo
       * ----------------------------------------
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
       * ----------------------------------------
       * Redo
       * ----------------------------------------
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
       * ----------------------------------------
       * Save
       * ----------------------------------------
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
       * ----------------------------------------
       * Auto layout
       * ----------------------------------------
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

        loading,
        error,

        isSaving,
        isAutoLayouting,

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