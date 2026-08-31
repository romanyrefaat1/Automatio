import AutomationCanvas from "../components/AutomationCanvas";
import { AutomationProvider } from "../contexts/AutomationContext";
import { AutomationNodesProvider } from "../contexts/AutomationNodesContext";
import { NewNodeSubTabsProvider } from "../contexts/NewNodeSubTabsContext";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function BuilderPage({ params }: Props) {
const { id: automationId } = await params;

    return (
        <div className="w-screen h-screen">
            <AutomationProvider automationId={automationId}>
            <AutomationNodesProvider automationId={automationId}>
            <NewNodeSubTabsProvider>
                <AutomationCanvas />
            </NewNodeSubTabsProvider>
            </AutomationNodesProvider>
            </AutomationProvider>
        </div>
    )
}