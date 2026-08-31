"use client";

import * as React from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AnimatedButtonProps = ButtonProps & {
  icon?: React.ReactNode;
  loading?: boolean;
  loadingIcon?: React.ReactNode;
};

export function AnimatedButton({
  icon,
  loading = false,
  loadingIcon,
  children,
  className,
  disabled,
  ...props
}: AnimatedButtonProps) {
  const targetIcon = loading ? loadingIcon : icon;

  const [displayedIcon, setDisplayedIcon] =
    React.useState<React.ReactNode>(targetIcon);

  const [isAnimating, setIsAnimating] = React.useState(false);

  React.useEffect(() => {
    if (targetIcon === displayedIcon) return;

    setIsAnimating(true);

    const timeout = setTimeout(() => {
      setDisplayedIcon(targetIcon);
    }, 120);

    return () => clearTimeout(timeout);
  }, [targetIcon, displayedIcon]);

  const handleAnimationEnd = () => {
    setIsAnimating(false);
  };

  return (
    <Button
      {...props}
      disabled={disabled || loading}
      className={cn(
        "transition-transform active:scale-[0.97]",
        className,
      )}
    >
      {displayedIcon && (
        <span
          onAnimationEnd={handleAnimationEnd}
          className={cn(
            "inline-flex items-center justify-center",
            isAnimating && "animate-button-icon",
          )}
        >
          {displayedIcon}
        </span>
      )}

      {children}
    </Button>
  );
}