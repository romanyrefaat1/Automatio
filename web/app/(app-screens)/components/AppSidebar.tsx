"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LogOut,
  Plus,
  Settings,
  Workflow,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ThemeSwitcher } from "@/components/theme-switcher";

const navItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "New Automation",
    url: "/new-automation",
    icon: Plus,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();

  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border bg-sidebar p-2 py-6">
        <SidebarMenu>
          <SidebarMenuItem>
            {isCollapsed ? (
              <div className="group/logo relative flex h-8 w-8 shrink-0 items-center justify-center">
                {/* Logo */}
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-sidebar-primary transition-opacity duration-150 group-hover/logo:opacity-0">
                  <Workflow className="h-4 w-4 text-sidebar-primary-foreground" />
                </div>

                {/* Hover trigger */}
                <SidebarTrigger
                  aria-label="Open sidebar"
                  className="
                    absolute inset-0
                    h-8 w-8
                    rounded-lg
                    bg-sidebar-primary
                    text-sidebar-primary-foreground
                    opacity-0
                    transition-opacity
                    duration-150
                    group-hover/logo:opacity-100
                    hover:bg-sidebar-primary/90
                    hover:text-sidebar-primary-foreground
                  "
                />
              </div>
            ) : (
              /*
               * EXPANDED
               * Normal header layout.
               * The trigger is always visible on the far right.
               */
              <div className="flex w-full items-center gap-2">
                <Link
                  href="/dashboard"
                  className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary">
                    <Workflow className="h-4 w-4 text-sidebar-primary-foreground" />
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-0.5 overflow-hidden leading-none">
                    <span className="truncate font-semibold">
                      Automatio
                    </span>
                    <span className="truncate text-xs text-sidebar-foreground/60">
                      Browser automation
                    </span>
                  </div>
                </Link>

                <SidebarTrigger
                  aria-label="Collapse sidebar"
                  className="ml-auto shrink-0"
                />
              </div>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="bg-sidebar">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60">
            Workspace
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  pathname === item.url ||
                  (item.url !== "/dashboard" &&
                    pathname.startsWith(`${item.url}/`));

                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className="
                        text-sidebar-foreground
                        hover:bg-sidebar-accent
                        hover:text-sidebar-accent-foreground
                        data-[active=true]:bg-sidebar-accent
                        data-[active=true]:text-sidebar-accent-foreground
                      "
                    >
                      <Link href={item.url}>
                        <Icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border bg-sidebar p-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex gap-2 items-center justify-start">
            <ThemeSwitcher /> {!isCollapsed && <span className="text-sm">Theme switcher</span>}
          </SidebarMenuItem>

          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  tooltip="Account"
                  className="
                    text-sidebar-foreground
                    hover:bg-sidebar-accent
                    hover:text-sidebar-accent-foreground
                  "
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sidebar-accent">
                    <Settings className="h-3.5 w-3.5 text-sidebar-accent-foreground" />
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col text-left">
                    <span className="truncate text-sm font-medium">
                      Account
                    </span>
                    <span className="truncate text-xs text-sidebar-foreground/60">
                      Settings & preferences
                    </span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                side="top"
                align="start"
                sideOffset={8}
                className="w-56"
              >
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link href="/logout">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}