import AutomationCanvas from "./components/AutomationCanvas";
import { AutomationNodesProvider } from "./contexts/AutomationNodesContext";
import { NewNodeSubTabsProvider } from "./contexts/NewNodeSubTabsContext";

export default function BuilderPage() {

    return (
        <div className="w-screen h-screen">
            <AutomationNodesProvider>
            <NewNodeSubTabsProvider>
                <AutomationCanvas />
            </NewNodeSubTabsProvider>
            </AutomationNodesProvider>
        </div>
    )
}