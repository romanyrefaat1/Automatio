import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import NewNodes from "./NewNodes";

export default function RightPanel() {
  return (
    <div className="h-full w-full overflow-hidden rounded-xl bg-secondary p-4">
      <Tabs
        defaultValue="new-node"
        className="flex h-full w-full flex-col"
      >
        <TabsList className="w-full shrink-0">
          <TabsTrigger value="new-node" className="flex-1">
            Nodes
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="new-node"
          className="min-h-0 flex- overflow-auto"
        >
            {/* Sub tabs */}
            <NewNodes />   
        </TabsContent>
{/* 
        <TabsContent
          value="password"
          className="min-h-0 flex-1 overflow-auto"
        >
          Change your password here.
        </TabsContent> */}
      </Tabs>
    </div>
  );
}