import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center font-semibold text-sm whitespace-nowrap transition-all duration-200 outline-none select-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-emerald-600 text-white shadow-sm hover:bg-emerald-500 hover:shadow-emerald-600/20 hover:shadow-lg dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-slate-950",
        primary:
          "bg-teal-600 text-white shadow-sm hover:bg-teal-500 hover:shadow-teal-600/20 hover:shadow-lg dark:bg-teal-500 dark:hover:bg-teal-400 dark:text-slate-950",
        emerald:
          "bg-emerald-600 text-white shadow-sm hover:bg-emerald-500 dark:bg-emerald-500 dark:text-slate-950",
        indigo:
          "bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400",
        purple:
          "bg-purple-600 text-white shadow-sm hover:bg-purple-500 dark:bg-purple-500 dark:hover:bg-purple-400",
        success:
          "bg-emerald-600 text-white shadow-sm hover:bg-emerald-500 dark:bg-emerald-500 dark:text-slate-950",
        destructive:
          "bg-rose-600 text-white shadow-sm hover:bg-rose-500 dark:bg-rose-500 dark:hover:bg-rose-400",
        danger:
          "bg-rose-600 text-white shadow-sm hover:bg-rose-500 dark:bg-rose-500 dark:hover:bg-rose-400",
        outline:
          "border border-slate-200/80 bg-white/80 text-slate-800 backdrop-blur-md hover:bg-slate-100 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:bg-slate-800",
        secondary:
          "bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-700",
        ghost:
          "text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white",
        link:
          "text-teal-600 underline-offset-4 hover:underline dark:text-teal-400",
      },
      size: {
        default: "h-10 px-4 py-2 rounded-xl gap-2",
        xs: "h-7 px-2.5 text-xs rounded-lg gap-1.5",
        sm: "h-8.5 px-3 text-xs rounded-xl gap-1.5",
        md: "h-10 px-4 py-2 rounded-xl gap-2",
        lg: "h-12 px-6 text-base rounded-2xl gap-2.5",
        icon: "size-10 rounded-xl",
        "icon-xs": "size-7 rounded-lg",
        "icon-sm": "size-8.5 rounded-xl",
        "icon-lg": "size-12 rounded-2xl",
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
}) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
