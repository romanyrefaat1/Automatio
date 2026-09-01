"use client";

import { nodes } from "@/components/nodes";
import AddNodeButton from "./AddNodeButton";

export default function AddNodeTabInRightPanel() {
  return (
    <div className="mt-4 space-y-3">
      <h2 className="text-sm font-semibold">
        Add New Nodes
      </h2>

      <div className="space-y-2">
        {Object.entries(nodes).map(([type, node]) => (
          <AddNodeButton
            key={type}
            type={type as keyof typeof nodes}
            title={node.title}
            description={node.description}
            defaultData={node.defaultData}
          />
        ))}
      </div>
    </div>
  );
}