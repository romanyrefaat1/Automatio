import { cookies } from "next/headers";

import {
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { AppSidebar } from "./components/AppSidebar";

export default async function AppScreensLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();

  const defaultOpen =
    cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />

      <main className="flex min-h-svh w-full flex-col">
        <header className="flex h-12 shrink-0 items-center border-b border-border px-4">
          <SidebarTrigger />
        </header>

        <div className="flex-1">
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
}