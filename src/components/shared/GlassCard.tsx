import { ReactNode } from 'react';
import { motion } from 'motion/react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
  key?: any;
}

export default function GlassCard({ children, className = '', hover = true, delay = 0 }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`glass-card ${hover ? 'glass-card-hover' : ''} ${className} relative overflow-hidden group`}
    >
      {/* Subtle glow effect */}
      <div className="absolute -inset-px bg-gradient-to-br from-brand-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}
