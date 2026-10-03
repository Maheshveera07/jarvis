import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ActiveCard } from '../types';
import { ExternalLink, X } from 'lucide-react';

interface ToolDisplayCardProps {
  card: ActiveCard | null;
  onDismiss: () => void;
}

export const ToolDisplayCard: React.FC<ToolDisplayCardProps> = ({ card, onDismiss }) => {
  return (
    <AnimatePresence mode="wait">
      {card && (
        <motion.div
          key={card.id || card.title}
          initial={{ opacity: 0, y: 22, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 14, scale: 0.98 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-4xl mx-auto border border-[#144e59] bg-[#01141c]/95 rounded-xs p-3 font-mono text-xs shadow-[0_0_25px_rgba(0,240,255,0.08)] select-text transition-all"
        >
          {/* Card Header (Matches screenshot format: ❖ NEWS — TOP WORLD NEWS TODAY   12:15:26 DISMISS X) */}
          <div className="flex items-center justify-between border-b border-[#083344] pb-2 mb-2 text-[#00f0ff]">
            <div className="flex items-center space-x-2 font-bold tracking-wider text-[11px] sm:text-xs truncate">
              <span className="text-[#00e5ff]">❖</span>
              <span className="truncate uppercase">{card.title}</span>
            </div>
            <div className="flex items-center space-x-3 text-[10px] text-[#155e75]">
              <span>{card.timestamp}</span>
              <button
                onClick={onDismiss}
                className="flex items-center space-x-1 text-[#26e6e6] hover:text-[#f43f5e] transition-colors cursor-pointer"
              >
                <span>DISMISS</span>
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Card Body Content */}
          <div className="max-h-[160px] sm:max-h-[190px] overflow-y-auto pr-1 text-[#26e6e6] text-[11px] leading-relaxed whitespace-pre-wrap">
            {card.content}
          </div>

          {/* Optional Card Action Button (e.g. Open WhatsApp, Call Phone, Open Link) */}
          {card.actionUrl && (
            <div className="mt-3 pt-2 border-t border-[#083344] flex justify-end">
              <a
                href={card.actionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#022837] hover:bg-[#033b52] border border-[#00e5ff] text-[#00f0ff] rounded-xs font-bold text-[10px] uppercase tracking-wider transition-all"
              >
                <span>{card.actionLabel || 'EXECUTE INTENT'}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
