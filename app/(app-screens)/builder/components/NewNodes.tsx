import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useNewNodeSubTabsContext } from "../contexts/NewNodeSubTabsContext";
import AddNodeTabInRightPanel from "./AddNodeTabInRightPanel";
import SubTabContent from "./SubTabContent";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NewNodes() {
  const {
    tabs,
    removeTabById,
    activeTab,
    setActiveTab,
  } = useNewNodeSubTabsContext();

  // If there are no dynamic tabs, always show "Add Nodes"
  const currentTab = tabs.length === 0 ? "default" : activeTab ?? "default";

  return (
    <Tabs
      value={currentTab}
      onValueChange={setActiveTab}
      className="w-full"
    >
      <TabsList>
        <TabsTrigger value="default">
          Add Nodes
        </TabsTrigger>

        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="group relative pr-7"
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="
                absolute -right-1 -top-1
                size-4
                rounded-full
                p-0
                opacity-0
                shadow-sm
                transition-all duration-150
                hover:scale-110
                group-hover:opacity-100
              "
              onClick={(e) => {
                e.stopPropagation();
                removeTabById(tab.id);
              }}
            >
              <X className="size-2.5" />
            </Button>

            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="default">
        <AddNodeTabInRightPanel />
      </TabsContent>

      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id}>
          <SubTabContent
            tabId={tab.id}
            type={tab.type}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}