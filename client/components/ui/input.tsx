"use client";

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <motion.div 
        whileTap={{ scale: 0.995 }} // Subtle press effect
        className="w-full"
      >
        <input
          type={type}
          ref={ref}
          className={cn(
            "flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-base text-white transition-all duration-200 placeholder:text-slate-500 md:text-sm",
            "backdrop-blur-md focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 focus:bg-white/10 outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />
      </motion.div>
    )
  }
)
Input.displayName = "Input"

export { Input }