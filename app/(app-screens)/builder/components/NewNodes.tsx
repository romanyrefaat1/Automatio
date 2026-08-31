import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNewNodeSubTabsContext } from "../contexts/NewNodeSubTabsContext";
import AddNodeTabInRightPanel from "./AddNodeTabInRightPanel";
import SubTabContent from "./SubTabContent";

export default function NewNodes() {
  const { tabs } = useNewNodeSubTabsContext();

  return (
    <Tabs defaultValue="default" className="w-full">
      <TabsList className="w-full flex justify-start h-1 gap-2 p-2 overflow-x-auto">
  <TabsTrigger
    value="default"
    className="w-fit flex-none py-1 hover:bg-muted"
  >
    Add Nodes
  </TabsTrigger>
  {tabs.map((tab)=> (
    <TabsTrigger
    key={tab.id}
    value={tab.id}
    className="w-fit flex-none py-1 hover:bg-muted"
  >
    {tab.name}
  </TabsTrigger>
  ))}
</TabsList>

      <TabsContent value="default">
        <AddNodeTabInRightPanel />
        {
          tabs.map((tab)=> (
            <SubTabContent key={tab.id} type={tab.type}/>
          ))
        }
      </TabsContent>
    </Tabs>
  );
}