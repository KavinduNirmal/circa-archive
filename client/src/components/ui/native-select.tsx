import * as React from "react";
import { cn } from "@/lib/utils";

function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="native-select"
      className={cn(
        "h-9 w-full rounded-none circa-sunken px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { NativeSelect };
