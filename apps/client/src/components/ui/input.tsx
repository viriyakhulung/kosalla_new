import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        /* Base styles */
        "w-full min-w-0 rounded-lg border bg-background px-4 py-2.5 text-sm font-medium transition-all duration-200 outline-none",
        /* Border and colors */
        "border-border bg-background/80 text-foreground placeholder:text-muted-foreground",
        "dark:border-border dark:bg-slate-950/50",
        /* File input styling */
        "file:text-foreground file:inline-flex file:border-0 file:bg-transparent file:text-xs file:font-semibold",
        /* Selection styling */
        "selection:bg-primary selection:text-primary-foreground",
        /* Hover state */
        "hover:border-primary/50 hover:bg-background dark:hover:border-primary/40",
        /* Focus state - professional ring */
        "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:bg-background dark:focus-visible:border-primary dark:focus-visible:ring-primary/40",
        /* Disabled state */
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted",
        /* Invalid/error state */
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
