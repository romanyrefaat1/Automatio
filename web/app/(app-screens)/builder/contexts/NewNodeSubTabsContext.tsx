"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

import type { AutomationNodeType } from "@/types/nodes";
import type { Json } from "@/types/supabase-auto";

/*
 * NOTE: previously imported `NodeTypes` from
 * `@/types/nodes` and used it as the node-type string
 * union. `NodeTypes` there is actually
 * `Record<AutomationNodeType, Component>` — the React Flow
 * component map, not a string union — so `type: NodeTypes`
 * on Tab was structurally wrong (would only "work" if
 * TypeScript wasn't strictly checking it, or would produce
 * confusing errors). Using AutomationNodeType directly,
 * which is the actual string union and lives alongside the
 * step config shapes in types/automation.ts.
 *
 * `config` was `unknown`, which meant every consumer
 * (SubTabContent's ConfigComponent, updateTabConfig) had to
 * either cast or fight the type checker. Typed as `Json`
 * (same type Supabase uses for automation_steps.config) so
 * it round-trips cleanly to the DB; individual config
 * components narrow it further via
 * Partial<AutomationStepConfigMap[T]>.
 */

type Tab = {
  id: string;
  type: AutomationNodeType;
  label: string;
  description: string;
  config: Json;
};

type NewNodeSubTabsContextType = {
  tabs: Tab[];
  activeTab: string | undefined;
  setActiveTab: (id: string) => void;

  addTab: (type: AutomationNodeType) => void;

  updateTab: (
    id: string,
    updates: Partial<Pick<Tab, "label" | "description">>
  ) => void;

  updateTabConfig: (id: string, config: Json) => void;
  removeTabById: (id: string) => void;
};

const NewNodeSubTabsContext =
  createContext<NewNodeSubTabsContextType | undefined>(undefined);

export function NewNodeSubTabsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTab, setActiveTab] = useState<string>("default");

  const addTab = (type: AutomationNodeType) => {
    setTabs((prev) => {
      const count = prev.filter((tab) => tab.type === type).length + 1;

      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          type,
          label: `${type.slice(0, 1).toUpperCase()}${type.slice(1)} ${count}`,
          description: "",
          config: {},
        },
      ];
    });

    // Always go back to Add Nodes after creating a tab
    setActiveTab("default");
  };

  const updateTab = (
    id: string,
    updates: Partial<Pick<Tab, "label" | "description">>
  ) => {
    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === id
          ? {
              ...tab,
              ...updates,
            }
          : tab
      )
    );
  };

  const updateTabConfig = (id: string, config: Json) => {
  setTabs((prev) =>
    prev.map((tab) => {
      if (tab.id !== id) {
        return tab;
      }

      const existingConfig =
        tab.config &&
        typeof tab.config === "object" &&
        !Array.isArray(tab.config)
          ? tab.config
          : {};

      const nextConfig =
        config &&
        typeof config === "object" &&
        !Array.isArray(config)
          ? config
          : {};

      return {
        ...tab,
        config: {
          ...existingConfig,
          ...nextConfig,
        },
      };
    })
  );
};

  const removeTabById = (id: string) => {
    setTabs((prev) => {
      const remainingTabs = prev.filter((tab) => tab.id !== id);

      // If we're deleting the currently active tab,
      // switch to the first remaining tab.
      if (activeTab === id) {
        setActiveTab(remainingTabs[0]?.id);
      }

      return remainingTabs;
    });
  };

  return (
    <NewNodeSubTabsContext.Provider
      value={{
        tabs,
        activeTab,
        setActiveTab,
        addTab,
        updateTab,
        updateTabConfig,
        removeTabById,
      }}
    >
      {children}
    </NewNodeSubTabsContext.Provider>
  );
}

export function useNewNodeSubTabsContext() {
  const context = useContext(NewNodeSubTabsContext);

  if (!context) {
    throw new Error(
      "useNewNodeSubTabsContext must be used inside NewNodeSubTabsProvider"
    );
  }

  return context;
}