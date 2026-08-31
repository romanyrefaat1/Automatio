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

import type { AutomationNode } from "@/types/types";
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
  (changes: NodeChange<AutomationNode>[]) => {
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
    console.log("ADDING NODE:", node);

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
        nodes: currentState.nodes.filter(
          (node) => node.id !== nodeId
        ),

        edges: currentState.edges.filter(
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

  const fetchGraph = useCallback(async () => {
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
       *
       * Adjust data mapping if your
       * AutomationNodeData changes.
       */

      const loadedNodes: AutomationNode[] =
  stepsResult.data.map((step) => ({
    id: step.id,

    type: step.type,

    position: {
      x: step.position_x,
      y: step.position_y,
    },

    data: {
      label: step.title,
      description: step.description ?? "",
      config: step.config,
    },
  }));
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
  }, [automationId]);

  useEffect(() => {
    void fetchGraph();
  }, [fetchGraph]);

  /*
   * ----------------------------------------
   * Save graph
   * ----------------------------------------
   */

  const save = useCallback(async () => {
    if (!isDirty || isSaving) {
      return;
    }

    setIsSaving(true);
    setError(null);

    const supabase = createClient();

    try {
      /*
       * --------------------------------
       * Save steps
       * --------------------------------
       */

      const stepsToSave = nodes.map((node, index) => ({
  id: node.id,
  automation_id: automationId,

  position: index,

  position_x: node.position.x,
  position_y: node.position.y,

  title: node.data.label,

  type: node.type,

  config: node.data.config ?? {},
}));

console.log(
  "STEPS TO SAVE:",
  stepsToSave
);

      /*
       * If there are no nodes, delete all
       * existing steps instead of upserting
       * an empty array.
       */

      if (stepsToSave.length > 0) {
        const {
          error: stepsError,
        } = await supabase
          .from("automation_steps")
          .upsert(stepsToSave);

        if (stepsError) {
          throw stepsError;
        }
      }

      /*
       * Remove database steps that no
       * longer exist in the editor.
       */

      const currentNodeIds = new Set(
        nodes.map((node) => node.id)
      );

      const {
        data: existingSteps,
        error: existingStepsError,
      } = await supabase
        .from("automation_steps")
        .select("id")
        .eq(
          "automation_id",
          automationId
        );

      if (existingStepsError) {
        throw existingStepsError;
      }

      const deletedStepIds =
        existingSteps
          .map((step) => step.id)
          .filter(
            (id) => !currentNodeIds.has(id)
          );

      if (
        deletedStepIds.length > 0
      ) {
        const {
          error: deleteStepsError,
        } = await supabase
          .from("automation_steps")
          .delete()
          .in(
            "id",
            deletedStepIds
          );

        if (deleteStepsError) {
          throw deleteStepsError;
        }
      }

      /*
       * --------------------------------
       * Replace edges
       * --------------------------------
       *
       * The canvas is the source of truth,
       * so replacing all edges keeps the
       * database synchronized with React Flow.
       */

      const {
        error: deleteEdgesError,
      } = await supabase
        .from("automation_edges")
        .delete()
        .eq(
          "automation_id",
          automationId
        );

      if (deleteEdgesError) {
        throw deleteEdgesError;
      }

      if (edges.length > 0) {
        const edgesToSave =
          edges.map((edge) => ({
            id: edge.id,

            automation_id:
              automationId,

            source_step_id:
              edge.source,

            target_step_id:
              edge.target,
          }));

        const {
          error: edgesError,
        } = await supabase
          .from("automation_edges")
          .insert(edgesToSave);

        if (edgesError) {
          throw edgesError;
        }
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
  }, [
    automationId,
    nodes,
    edges,
    isDirty,
    isSaving,
  ]);

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
        event.key.toLowerCase() === "z" &&
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
            event.key.toLowerCase() === "z" &&
            event.shiftKey
          ) ||
          event.key.toLowerCase() === "y"
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
        event.key.toLowerCase() === "s"
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