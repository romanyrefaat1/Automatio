import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { nodeConfigComponents } from "@/components/nodes/configs";

import { useNewNodeSubTabsContext } from "../contexts/NewNodeSubTabsContext";
import { useAutomationNodes } from "../contexts/AutomationNodesContext";

import type { AutomationNode } from "@/types/nodes";
import type { AutomationNodeType } from "@/types/nodes";

type SubTabContentProps = {
  tabId: string;
  type: AutomationNodeType;
};

export default function SubTabContent({
  tabId,
  type,
}: SubTabContentProps) {
  const {
    tabs,
    updateTab,
    updateTabConfig,
    removeTabById,
  } = useNewNodeSubTabsContext();

  const { addNode } = useAutomationNodes();

  const tab = tabs.find((tab) => tab.id === tabId);

  if (!tab) {
    return null;
  }

  const ConfigComponent = nodeConfigComponents[type];

  const handleAddNode = () => {
  console.log("ADDING NODE CONFIG:", tab.config);

  const node: AutomationNode = {
    id: crypto.randomUUID(),
    type,
    position: {
      x: 100,
      y: 100,
    },
    data: {
      label: tab.label,
      description: tab.description,
      config: tab.config,
    },
  };

  console.log("NODE CREATED:", node);

  addNode(node);
  removeTabById(tabId);
};

  return (
    <div className="space-y-6">
      {/* Common Node Information */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor={`node-name-${tabId}`}
            className="text-sm font-medium"
          >
            Name
          </label>

          <Input
            id={`node-name-${tabId}`}
            value={tab.label}
            onChange={(e) =>
              updateTab(tabId, {
                label: e.target.value,
              })
            }
            placeholder="Enter node name"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor={`node-description-${tabId}`}
            className="text-sm font-medium"
          >
            Description
          </label>

          <Textarea
            id={`node-description-${tabId}`}
            value={tab.description}
            onChange={(e) =>
              updateTab(tabId, {
                description: e.target.value,
              })
            }
            placeholder="Describe what this node does"
            rows={3}
          />
        </div>
      </div>

      {/* Type-specific Configuration */}
      <ConfigComponent
  config={tab.config ?? {}}
  onConfigChange={(config) => {
    console.log("CONFIG CHANGED:", config);

    updateTabConfig(tabId, config);
  }}
/>

      {/* Add Node */}
      <Button type="button" onClick={handleAddNode}>
        Add Node
      </Button>
    </div>
  );
}