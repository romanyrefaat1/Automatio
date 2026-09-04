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
} from "@xyflow/react";

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

type AutomationStep = Tables<"automation_steps">;
type AutomationEdge = Tables<"automation_edges">;

type AutomationEditorState = {
  nodes: AutomationNode[];
  edges: Edge[];
};

type AutomationHistory = {
  past: AutomationEditorState[];
  future: AutomationEditorState[];
};

type AutomationNodesContextType = {
  nodes: AutomationNode[];
  edges: Edge[];

  onNodesChange: (
    changes: NodeChange<AutomationNode>[]
  ) => void;

  onEdgesChange: (
    changes: EdgeChange[]
  ) => void;

  onConnect: (
    connection: Connection
  ) => void;

  addNode: (
    node: AutomationNode
  ) => void;

  removeNode: (
    nodeId: string
  ) => void;

  undo: () => void;
  redo: () => void;

  canUndo: boolean;
  canRedo: boolean;

  isDirty: boolean;
  isSaving: boolean;

  save: () => Promise<void>;
};

const AutomationNodesContext = createContext<
  AutomationNodesContextType | undefined
>(undefined);

type AutomationNodesProviderProps = {
  automationId: string;
  children: ReactNode;
};

export function AutomationNodesProvider({
  automationId,
  children,
}: AutomationNodesProviderProps) {
  const [nodes, setNodes] =
    useState<AutomationNode[]>([]);

  const [edges, setEdges] =
    useState<Edge[]>([]);

  /*
   * ----------------------------------------
   * Saved state
   * ----------------------------------------
   *
   * Used to determine whether the editor
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
   * Every actual editor change creates
   * an undo history entry.
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
      const previousState = {
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
        setHistory((currentHistory) => ({
          past: [
            ...currentHistory.past,
            previousState,
          ],
          future: [],
        }));
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
      updateGraph((currentState) => ({
        ...currentState,

        edges: applyEdgeChanges(
          changes,
          currentState.edges
        ),
      }));
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

      updateGraph((currentState) => ({
        ...currentState,

        edges: addEdge(
          {
            ...connection,

            id: crypto.randomUUID(),

            type: "smoothstep",

            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
          },
          currentState.edges
        ),
      }));
    },
    [updateGraph]
  );

  /*
   * ----------------------------------------
   * Add node
   * ----------------------------------------
   */

  const addNode = useCallback(
    (node: AutomationNode) => {
      updateGraph((currentState) => ({
        nodes: [
          ...currentState.nodes,
          node,
        ],

        edges: currentState.edges,
      }));
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
      updateGraph((currentState) => ({
        nodes:
          currentState.nodes.filter(
            (node) => node.id !== nodeId
          ),

        edges:
          currentState.edges.filter(
            (edge) =>
              edge.source !== nodeId &&
              edge.target !== nodeId
          ),
      }));
    },
    [updateGraph]
  );

  /*
   * ----------------------------------------
   * Undo
   * ----------------------------------------
   */

  const undo = useCallback(() => {
    setHistory((currentHistory) => {
      if (
        currentHistory.past.length === 0
      ) {
        return currentHistory;
      }

      const previous =
        currentHistory.past[
          currentHistory.past.length - 1
        ];

      const currentState: AutomationEditorState = {
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
    });
  }, [nodes, edges]);

  /*
   * ----------------------------------------
   * Redo
   * ----------------------------------------
   */

  const redo = useCallback(() => {
    setHistory((currentHistory) => {
      if (
        currentHistory.future.length === 0
      ) {
        return currentHistory;
      }

      const next =
        currentHistory.future[0];

      const currentState: AutomationEditorState = {
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
    });
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

      const supabase = createClient();

      try {
        const [
          stepsResult,
          edgesResult,
        ] = await Promise.all([
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
         * Convert database steps into
         * React Flow nodes.
         */

        const loadedNodes: AutomationNode[] =
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
                config: step.config,
              },
            })
          );

        /*
         * Convert database edges into
         * React Flow edges.
         */

        const loadedEdges: Edge[] =
          edgesResult.data.map(
            (edge: AutomationEdge) => ({
              id: edge.id,

              source:
                edge.source_step_id,

              target:
                edge.target_step_id,

              type: "smoothstep",

              markerEnd: {
                type: MarkerType.ArrowClosed,
              },
            })
          );

        /*
         * Loading from Supabase is NOT an
         * editor action, so it must not
         * enter undo history.
         */

        setNodes(loadedNodes);
        setEdges(loadedEdges);

        setSavedState({
          nodes: loadedNodes,
          edges: loadedEdges,
        });

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

  useEffect(() => {
    void fetchGraph();
  }, [fetchGraph]);

  /*
   * ----------------------------------------
   * Save graph
   * ----------------------------------------
   *
   * Delegates to a single Postgres RPC
   * (save_automation_graph) that upserts
   * steps, deletes removed steps, and
   * replaces edges inside one transaction.
   *
   * This avoids the old "shuffle existing
   * rows to negative positions" workaround,
   * which broke because automation_steps
   * has a CHECK (position >= 0) constraint.
   * The unique(automation_id, position)
   * constraint is now DEFERRABLE INITIALLY
   * DEFERRED (see migration), so the RPC can
   * write steps straight to their final
   * positions without any temporary shuffle.
   */

  const save = useCallback(
    async () => {
      if (!isDirty || isSaving) {
        return;
      }

      setIsSaving(true);
      setError(null);

      const supabase = createClient();

      try {
        /*
         * --------------------------------
         * Prepare steps payload
         * --------------------------------
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
         * --------------------------------
         * Prepare edges payload
         * --------------------------------
         */

        const edgesToSave =
          edges.map((edge) => ({
            id: edge.id,

            source_step_id:
              edge.source,

            target_step_id:
              edge.target,
          }));

        /*
         * --------------------------------
         * Save via single atomic RPC
         * --------------------------------
         */

        const {
          error: saveError,
        } = await supabase.rpc(
          "save_automation_graph",
          {
            p_automation_id:
              automationId,

            p_steps: stepsToSave,

            p_edges: edgesToSave,
          }
        );

        if (saveError) {
          throw saveError;
        }

        /*
         * --------------------------------
         * Save successful
         * --------------------------------
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
   */

  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      /*
       * Undo
       *
       * Ctrl + Z
       * Cmd + Z
       */

      if (
        (event.ctrlKey ||
          event.metaKey) &&
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
       *
       * Ctrl + Shift + Z
       * Cmd + Shift + Z
       *
       * Also supports:
       * Ctrl + Y
       * Cmd + Y
       */

      if (
        (event.ctrlKey ||
          event.metaKey) &&
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
       *
       * Ctrl + S
       * Cmd + S
       */

      if (
        (event.ctrlKey ||
          event.metaKey) &&
        event.key.toLowerCase() ===
          "s"
      ) {
        event.preventDefault();

        void save();
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
  }, [undo, redo, save]);

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

        addNode,
        removeNode,

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

export function useAutomationNodes() {
  const context = useContext(
    AutomationNodesContext
  );

  if (!context) {
    throw new Error(
      "useAutomationNodes must be used inside an AutomationNodesProvider"
    );
  }

  return context;
}