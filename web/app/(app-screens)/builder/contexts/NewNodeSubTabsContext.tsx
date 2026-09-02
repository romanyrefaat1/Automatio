"use client";

import { NodeTypes } from "@/types/nodes";
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

type Tab = {
  id: string;
  type: NodeTypes;
  label: string;
  description: string;
  config: unknown;
};

type NewNodeSubTabsContextType = {
  tabs: Tab[];
  activeTab: string | undefined;
  setActiveTab: (id: string) => void;

  addTab: (type: NodeTypes) => void;

  updateTab: (
    id: string,
    updates: Partial<Pick<Tab, "label" | "description">>
  ) => void;

  updateTabConfig: (id: string, config: unknown) => void;
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

  const addTab = (type: NodeTypes) => {
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

  const updateTabConfig = (id: string, config: unknown) => {
    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === id
          ? {
              ...tab,
              config,
            }
          : tab
      )
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