"use client";

import * as React from "react";
import { Tooltip as TooltipPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";
import "./tooltip.css";

function TooltipProvider({
  delayDuration = 300,
  skipDelayDuration = 200,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      skipDelayDuration={skipDelayDuration}
      {...props}
    />
  );
}

function Tooltip({
  disableHoverableContent = true,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  /*
   * A desktop label is not interactive, so it should close as soon as the
   * pointer leaves the shortcut. Radix's hoverable-content grace area can keep
   * a tooltip open when the pointer crosses it on the way to another control,
   * which reads as a stuck label on a screen whose controls sit close together.
   */
  return (
    <TooltipPrimitive.Root
      data-slot="tooltip"
      disableHoverableContent={disableHoverableContent}
      {...props}
    />
  );
}

function TooltipTrigger(
  props: React.ComponentProps<typeof TooltipPrimitive.Trigger>,
) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({
  className,
  sideOffset = 8,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "tooltip-content z-50 w-fit max-w-64 origin-(--radix-tooltip-content-transform-origin) text-[10px] leading-4 tracking-[0.03em]",
          className,
        )}
        {...props}
      >
        {children}
        {/* The arrow is stroked, not just filled, so no content border crosses its head. */}
        <TooltipPrimitive.Arrow
          className="tooltip-arrow z-50"
          width={14}
          height={7}
        >
          <svg viewBox="0 0 14 7" width={14} height={7} aria-hidden="true">
            <path className="tooltip-arrow-fill" d="M1 1 7 6.4 13 1Z" />
            <path className="tooltip-arrow-stroke" d="M1 1 7 6.4 13 1" />
          </svg>
        </TooltipPrimitive.Arrow>
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
