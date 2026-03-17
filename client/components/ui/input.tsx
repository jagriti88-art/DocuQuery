"use client";

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <motion.div 
      initial={false}
      whileFocus={{ scale: 1.01 }}
      className="w-full"
    >
      <input
        type={type}
        data-slot="input"
        className={cn(
          // Base Styles
          "flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-base text-white shadow-inner transition-all duration-200 placeholder:text-slate-500 md:text-sm",
          // Glassmorphism & Effects
          "backdrop-blur-md selection:bg-purple-500/30 selection:text-white",
          // Focus States (Animated Glow)
          "outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 focus:bg-white/10",
          // File Input specific
          "file:mr-4 file:rounded-lg file:border-0 file:bg-purple-600 file:px-4 file:py-1 file:text-sm file:font-semibold file:text-white hover:file:bg-purple-700 file:transition-colors",
          // Disabled States
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    </motion.div>
  )
}

export { Input }