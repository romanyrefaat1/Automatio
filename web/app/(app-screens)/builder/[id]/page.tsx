import { ReactFlowProvider } from "@xyflow/react";
import AutomationCanvas from "../components/AutomationCanvas";
import { AutomationProvider } from "../contexts/AutomationContext";
import { AutomationNodesProvider } from "../contexts/AutomationNodesContext";
import { NewNodeSubTabsProvider } from "../contexts/NewNodeSubTabsContext";
import { KeyboardShortcutsDialog } from "../components/KeyboardShortcutsDialog";

export const instant = false;

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function BuilderPage({ params }: Props) {
const { id: automationId } = await params;

    return (
        <div className="w-screen h-screen">
            <ReactFlowProvider>
            <AutomationProvider automationId={automationId}>
            <AutomationNodesProvider automationId={automationId}>
            <NewNodeSubTabsProvider>
                <KeyboardShortcutsDialog />
                <AutomationCanvas />
            </NewNodeSubTabsProvider>
            </AutomationNodesProvider>
            </AutomationProvider>
            </ReactFlowProvider>
        </div>
    )
}