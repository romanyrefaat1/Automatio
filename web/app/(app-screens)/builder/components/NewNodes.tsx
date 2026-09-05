"use client";

import { useEffect, useRef, useState } from "react";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  ScrollArea,
  ScrollBar,
} from "@/components/ui/scroll-area";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

import { useNewNodeSubTabsContext } from "../contexts/NewNodeSubTabsContext";
import AddNodeTabInRightPanel from "./AddNodeTabInRightPanel";
import SubTabContent from "./SubTabContent";

export default function NewNodes() {
  const {
    tabs,
    removeTabById,
    activeTab,
    setActiveTab,
  } = useNewNodeSubTabsContext();

  const scrollRef = useRef<HTMLDivElement>(null);

  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  const currentTab =
    tabs.length === 0
      ? "default"
      : activeTab ?? "default";

  useEffect(() => {
    const viewport =
      scrollRef.current?.querySelector(
        "[data-radix-scroll-area-viewport]"
      ) as HTMLElement | null;

    if (!viewport) return;

    const updateFades = () => {
      const maxScroll =
        viewport.scrollWidth - viewport.clientWidth;

      setShowLeftFade(viewport.scrollLeft > 4);
      setShowRightFade(
        viewport.scrollLeft < maxScroll - 4
      );
    };

    updateFades();

    viewport.addEventListener(
      "scroll",
      updateFades,
      { passive: true }
    );

    const observer = new ResizeObserver(updateFades);

    observer.observe(viewport);

    if (viewport.firstElementChild) {
      observer.observe(viewport.firstElementChild);
    }

    return () => {
      viewport.removeEventListener(
        "scroll",
        updateFades
      );

      observer.disconnect();
    };
  }, [tabs]);

  return (
    <Tabs
      value={currentTab}
      onValueChange={setActiveTab}
      className="flex h-full min-h-0 w-full flex-col"
    >
      {/* Sub-tab header */}
      <div
        className="
          relative
          z-20
          shrink-0
          overflow-hidden
          border-b
          border-border/40
          bg-secondary
          shadow-[0_4px_10px_-9px_hsl(var(--foreground)/0.4)]
        "
      >
        <div
          ref={scrollRef}
          className="relative min-w-0"
        >
          {/* Left fade */}
          <div
            className={`
              pointer-events-none
              absolute
              inset-y-0
              left-0
              z-30
              w-5
              bg-gradient-to-r
              from-secondary
              to-transparent
              transition-opacity
              duration-150
              ${showLeftFade ? "opacity-100" : "opacity-0"}
            `}
          />

          {/* Right fade */}
          <div
            className={`
              pointer-events-none
              absolute
              inset-y-0
              right-0
              z-30
              w-5
              bg-gradient-to-l
              from-secondary
              to-transparent
              transition-opacity
              duration-150
              ${showRightFade ? "opacity-100" : "opacity-0"}
            `}
          />

          <ScrollArea className="w-full whitespace-nowrap">
            <TabsList
              className="
                flex
                w-max
                min-w-full
                justify-start
                gap-1
                bg-transparent
                px-1
                py-1
              "
            >
              <TabsTrigger
                value="default"
                className="shrink-0"
              >
                Add Nodes
              </TabsTrigger>

              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="
                    group
                    relative
                    shrink-0
                    pr-7
                  "
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="
                      absolute
                      -right-1
                      -top-1
                      size-4
                      rounded-full
                      p-0
                      opacity-0
                      transition-all
                      duration-150
                      group-hover:opacity-100
                      hover:scale-110
                    "
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTabById(tab.id);
                    }}
                  >
                    <X className="size-2.5" />
                  </Button>

                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <ScrollBar
              orientation="horizontal"
              className="h-1"
            />
          </ScrollArea>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <TabsContent
          value="default"
          className="mt-0"
        >
          <AddNodeTabInRightPanel />
        </TabsContent>

        {tabs.map((tab) => (
          <TabsContent
            key={tab.id}
            value={tab.id}
            className="mt-0"
          >
            <SubTabContent
              tabId={tab.id}
              type={tab.type}
            />
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}