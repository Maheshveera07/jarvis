import React from 'react';
import { ToolCallData } from '../types';
import { AlertTriangle, Check, X } from 'lucide-react';

interface ActionConfirmationModalProps {
  toolCall: ToolCallData | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ActionConfirmationModal: React.FC<ActionConfirmationModalProps> = ({
  toolCall,
  onConfirm,
  onCancel,
}) => {
  if (!toolCall) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 font-mono select-none">
      <div className="w-full max-w-md border-2 border-[#ff9900] bg-[#02141c] p-5 rounded-xs shadow-[0_0_30px_rgba(255,153,0,0.3)]">
        {/* Header */}
        <div className="flex items-center space-x-2 text-[#ff9900] pb-3 border-b border-[#3b2403]">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-bounce" />
          <span className="text-xs font-bold tracking-widest uppercase">
            SECURITY PROTOCOL: SENSITIVE ACTION AUTHORIZATION
          </span>
        </div>

        {/* Action Details */}
        <div className="py-4 space-y-3 text-xs text-[#26e6e6]">
          <div className="text-[11px] text-[#ffaa00]">
            JARVIS is requesting confirmation before executing:
          </div>

          <div className="bg-[#031d27] border border-[#144e59] p-3 rounded-xs space-y-1.5 text-[11px]">
            <div>
              <span className="text-[#155e75]">TOOL: </span>
              <span className="text-[#00ffcc] font-bold">{toolCall.name}</span>
            </div>
            {Object.entries(toolCall.args).map(([k, v]) => (
              <div key={k} className="truncate">
                <span className="text-[#155e75]">{k.toUpperCase()}: </span>
                <span className="text-white font-medium">{String(v)}</span>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-[#94a3b8] italic">
            You can say "Yes, proceed" or click Authorize to dispatch this Android intent.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#083344]">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-[#1e070e] hover:bg-[#320d18] border border-[#f43f5e] text-[#f43f5e] text-xs font-bold rounded-xs tracking-wider flex items-center space-x-1.5 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>ABORT</span>
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-[#022837] hover:bg-[#033b52] border border-[#ff9900] text-[#ffaa00] text-xs font-bold rounded-xs tracking-wider flex items-center space-x-1.5 shadow-[0_0_15px_rgba(255,153,0,0.25)] transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>AUTHORIZE ACTION</span>
          </button>
        </div>
      </div>
    </div>
  );
};
