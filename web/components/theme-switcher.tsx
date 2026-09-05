"use client";

import { useEffect, useState } from "react";
import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ThemeSwitcher = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const ICON_SIZE = 16;

  const icon =
    theme === "light" ? (
      <Sun
        size={ICON_SIZE}
        className="text-muted-foreground"
      />
    ) : theme === "dark" ? (
      <Moon
        size={ICON_SIZE}
        className="text-muted-foreground"
      />
    ) : (
      <Laptop
        size={ICON_SIZE}
        className="text-muted-foreground"
      />
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
        >
          {icon}

          <span className="sr-only">
            Change theme
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="w-32"
      >
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={setTheme}
        >
          <DropdownMenuRadioItem value="light">
            <Sun
              size={ICON_SIZE}
              className="text-muted-foreground"
            />
            <span>Light</span>
          </DropdownMenuRadioItem>

          <DropdownMenuRadioItem value="dark">
            <Moon
              size={ICON_SIZE}
              className="text-muted-foreground"
            />
            <span>Dark</span>
          </DropdownMenuRadioItem>

          <DropdownMenuRadioItem value="system">
            <Laptop
              size={ICON_SIZE}
              className="text-muted-foreground"
            />
            <span>System</span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export { ThemeSwitcher };