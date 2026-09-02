import type { ReactNode } from "react";
import { useNewNodeSubTabsContext } from "../contexts/NewNodeSubTabsContext";

import type { AutomationNodeType } from "@/types/nodes";
import type { AutomationNodeData } from "@/types/nodes";

type AddNodeButtonProps = {
  type: AutomationNodeType;
  title: string;
  description: string;
  preview: ReactNode;
  defaultData?: Partial<AutomationNodeData>;
};

export default function AddNodeButton({
  type,
  title,
  description,
  preview,
}: AddNodeButtonProps) {
  const { addTab } = useNewNodeSubTabsContext();

  return (
    <button
      type="button"
      onClick={() => {
        addTab(type);
      }}
      className="w-full text-left bg-muted p-3 rounded-xl"
    >
      <div className="space-y-2">
        <div>
          <h4 className="text-sm font-semibold text-foreground">
            {title}
          </h4>

          <p className="text-xs text-muted-foreground">
            {description}
          </p>
        </div>

        {/* <div className="pointer-events-none">
          {preview}
        </div> */}
      </div>
    </button>
  );
}