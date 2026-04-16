import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border border-transparent bg-[#1C1C1E] text-white hover:bg-[#2c2c2e]",
        secondary: "border border-transparent bg-[#F5F5F5] text-[#1C1C1E] hover:bg-[#e8e8e8]",
        outline: "text-[#1C1C1E] border border-[#E5E5EA]",
        destructive: "border border-transparent bg-[#E53E3E] text-white hover:bg-[#c53030]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
