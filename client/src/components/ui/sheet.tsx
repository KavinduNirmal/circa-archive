"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Dialog as SheetPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

/**
 * A drawer, following shadcn's Sheet contract on top of Radix Dialog.
 *
 * The project page's header is a client island; the drawer is where the whole
 * navigation goes below 900px. Radix supplies the focus trap, the Escape key,
 * the scroll lock, and the return of focus to the trigger, which is the part of
 * a mobile menu that is usually missing.
 */
function Sheet(props: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger(props: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose(props: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal(props: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-[rgb(4_5_7_/_72%)] backdrop-blur-[2px] data-[state=closed]:opacity-0 data-[state=open]:opacity-100",
        className,
      )}
      {...props}
    />
  );
}

function SheetContent({
  className,
  children,
  side = "right",
  title,
  description,
  closeLabel,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left";
  title: string;
  description?: string;
  closeLabel: string;
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        data-side={side}
        className={cn("fixed z-50 flex flex-col gap-0 outline-none", className)}
        {...props}
      >
        <SheetPrimitive.Title data-slot="sheet-title" className="sr-only">
          {title}
        </SheetPrimitive.Title>
        {description ? (
          <SheetPrimitive.Description data-slot="sheet-description" className="sr-only">
            {description}
          </SheetPrimitive.Description>
        ) : null}
        {children}
        <SheetPrimitive.Close data-slot="sheet-close" className="sheet-close" aria-label={closeLabel}>
          <X aria-hidden="true" size={18} />
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

export { Sheet, SheetClose, SheetContent, SheetTrigger };
