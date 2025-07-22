import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const commonButtonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#34495E] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#34495E] text-white shadow hover:bg-[#34495E]/90",
        destructive: "bg-red-500 text-white shadow-sm hover:bg-red-500/90",
        outline: "border border-[#34495E] bg-transparent text-[#34495E] shadow-sm hover:bg-[#34495E] hover:text-white",
        secondary: "bg-gray-100 text-gray-900 shadow-sm hover:bg-gray-200",
        ghost: "hover:bg-gray-100 hover:text-gray-900",
        link: "text-[#34495E] underline-offset-4 hover:underline",
        success: "bg-green-500 text-white shadow-sm hover:bg-green-500/90",
        warning: "bg-orange-500 text-white shadow-sm hover:bg-orange-500/90",
        info: "bg-blue-500 text-white shadow-sm hover:bg-blue-500/90",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface CommonButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof commonButtonVariants> {
  asChild?: boolean
}

const CommonButton = React.forwardRef<HTMLButtonElement, CommonButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(commonButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
CommonButton.displayName = "CommonButton"

export { CommonButton, commonButtonVariants } 