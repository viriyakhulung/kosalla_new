import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/110 dark:hover:bg-primary/110 shadow-md hover:shadow-lg active:shadow-sm",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/90 dark:bg-secondary/80 dark:hover:bg-secondary/90 shadow-md hover:shadow-lg active:shadow-sm",
        accent:
          "bg-accent text-accent-foreground hover:bg-accent/90 dark:bg-accent/80 dark:hover:bg-accent/90 shadow-md hover:shadow-lg active:shadow-sm",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/40 dark:focus-visible:ring-destructive/50 dark:bg-destructive shadow-md hover:shadow-lg active:shadow-sm",
        success:
          "bg-success text-white hover:bg-success/90 shadow-md hover:shadow-lg active:shadow-sm",
        outline:
          "border border-primary/30 bg-background text-foreground hover:bg-primary/10 dark:hover:bg-primary/20 dark:bg-slate-900/50 dark:border-primary/50 shadow-sm hover:shadow-md active:shadow-none",
        ghost:
          "text-foreground hover:bg-primary/10 dark:hover:bg-primary/20 active:bg-primary/20",
        link: "text-primary underline-offset-4 hover:underline dark:text-primary",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 text-xs has-[>svg]:px-2.5",
        lg: "h-12 rounded-lg px-6 text-base has-[>svg]:px-4",
        xl: "h-14 rounded-lg px-8 text-lg has-[>svg]:px-5",
        icon: "size-10",
        "icon-sm": "size-8",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
