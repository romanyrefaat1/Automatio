"use client";

import { NodeTypes } from "@/types/types";
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

type Tab = {
  id: number;
  type: NodeTypes;
};

type NewNodeSubTabsContextType = {
  tabs: Tab[];
  addTab: (type: string) => void;
  removeTabById: (id: number) => void;
};

const NewNodeSubTabsContext =
  createContext<NewNodeSubTabsContextType | undefined>(undefined);

export function NewNodeSubTabsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [tabsContent, setTabsContent] = useState<Tab[]>([]);

  const addTab = (type: string) => {
    setTabs((prev) => [
      ...prev,
      {
        type,
        id: Math.random(),
        name: type.slice(0,1).toUpperCase() + type.slice(1) + `${tabs.filter((el)=> el.type === type).length+1}`
      },
    ]);
  };

  const removeTabById = (id: number) => {
    setTabs((prev) => prev.filter((tab) => tab.id !== id));
  };

  return (
    <NewNodeSubTabsContext.Provider
      value={{
        tabs,
        addTab,
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