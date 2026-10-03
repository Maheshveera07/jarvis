import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { ActivityLogEntry } from '../types';

interface ActivityLogProps {
  logs: ActivityLogEntry[];
  onClearLogs?: () => void;
}

const logContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
};

const logItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 9,
    filter: 'blur(1.5px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.28,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.15 },
  },
};

export const ActivityLog: React.FC<ActivityLogProps> = ({ logs, onClearLogs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getSenderColor = (sender: ActivityLogEntry['sender']) => {
    switch (sender) {
      case 'SYS':
        return 'text-[#00ffcc] font-bold';
      case 'JARVIS':
        return 'text-[#00f0ff] font-bold';
      case 'USER':
        return 'text-[#ffaa00] font-bold';
      case 'TOOL':
        return 'text-[#c084fc] font-semibold';
      case 'WARN':
        return 'text-[#f43f5e] font-bold';
      default:
        return 'text-[#26e6e6]';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 28 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="w-full flex flex-col h-[230px] lg:h-[260px] border border-[#144e59] bg-[#02141c]/90 rounded-xs shadow-[inset_0_0_15px_rgba(0,240,255,0.04)] font-mono text-xs select-text"
    >
      {/* Activity Log Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#083344] bg-[#010e14]/60">
        <div className="flex items-center space-x-1.5 text-[#00f0ff] font-bold tracking-wider text-[11px]">
          <span className="text-[#00e5ff]">▸</span>
          <span>ACTIVITY LOG</span>
        </div>
        {onClearLogs && (
          <button
            onClick={onClearLogs}
            className="text-[10px] text-[#155e75] hover:text-[#00f0ff] uppercase transition-colors"
          >
            CLEAR
          </button>
        )}
      </div>

      {/* Log Feed with Staggered Children */}
      <motion.div
        ref={scrollRef}
        variants={logContainerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 p-3 overflow-y-auto space-y-2.5 text-[11px] leading-relaxed text-[#26e6e6]"
      >
        <AnimatePresence initial={false}>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              variants={logItemVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              layout="position"
              className="break-words"
            >
              <span className={getSenderColor(log.sender)}>{log.sender}: </span>
              <span className="text-[#99f6e4]/90 whitespace-pre-wrap">{log.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
