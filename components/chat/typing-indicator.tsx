'use client'

import { motion } from 'framer-motion'

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <span>typing</span>
      <div className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0.5, y: 0 }}
            animate={{ opacity: 1, y: -2 }}
            transition={{
              repeat: Infinity,
              repeatType: 'reverse',
              duration: 0.4,
              delay: i * 0.1,
            }}
            className="inline-block"
          >
            .
          </motion.span>
        ))}
      </div>
    </div>
  )
} 