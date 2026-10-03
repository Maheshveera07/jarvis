import React, { useState, useEffect } from 'react';
import { Send, Play } from 'lucide-react';
import { AgentState } from '../types';

interface CommandInputProps {
  onSendCommand: (cmd: string) => void;
  onInterrupt: () => void;
  onToggleMic: () => void;
  isMicActive: boolean;
  agentState: AgentState;
}

export const CommandInput: React.FC<CommandInputProps> = ({
  onSendCommand,
  onInterrupt,
  onToggleMic,
  isMicActive,
  agentState,
}) => {
  const [inputVal, setInputVal] = useState('');

  // Global ESC key listener for emergency interruption
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onInterrupt();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onInterrupt]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      onSendCommand(inputVal.trim());
      setInputVal('');
    }
  };

  return (
    <div className="w-full flex flex-col font-mono text-xs select-none space-y-2">
      {/* Header */}
      <div className="flex items-center space-x-1.5 text-[#00f0ff] font-bold tracking-wider text-[11px]">
        <span className="text-[#00e5ff]">▸</span>
        <span>COMMAND INPUT</span>
      </div>

      {/* Input Form with inline play/send button */}
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Type a command or question..."
          className="w-full bg-[#02141c]/90 border border-[#144e59] text-[#26e6e6] placeholder-[#155e75] px-3 py-2 pr-9 rounded-xs text-[11px] focus:outline-none focus:border-[#00e5ff] shadow-[inset_0_0_10px_rgba(0,240,255,0.05)] transition-colors"
        />
        <button
          type="submit"
          className="absolute right-1 text-[#00e5ff] hover:text-white p-1 rounded transition-colors"
          title="Send command"
        >
          <Play className="w-3.5 h-3.5 fill-[#00e5ff]" />
        </button>
      </form>

      {/* Big Crimson INTERRUPT [ESC] Button (Exact match from screenshot) */}
      <button
        type="button"
        onClick={onInterrupt}
        className="w-full py-2.5 px-3 bg-[#1e070e] hover:bg-[#320d18] border border-[#f43f5e]/80 text-[#f43f5e] font-bold rounded-xs tracking-wider flex items-center justify-center space-x-2 shadow-[0_0_12px_rgba(244,63,94,0.18)] hover:shadow-[0_0_20px_rgba(244,63,94,0.35)] transition-all active:scale-[0.99] text-xs"
      >
        <span className="text-sm">✋</span>
        <span>INTERRUPT</span>
        <span className="text-[10px] text-[#f43f5e]/70">[ESC]</span>
      </button>

      {/* Big Neon MICROPHONE ACTIVE / TAP TO SPEAK Button (Exact match from screenshot) */}
      <button
        type="button"
        onClick={onToggleMic}
        className={`w-full py-2.5 px-3 border font-bold rounded-xs tracking-wider flex items-center justify-center space-x-2 transition-all active:scale-[0.99] text-xs ${
          isMicActive
            ? 'bg-[#02241b] border-[#00ffaa] text-[#00ffaa] shadow-[0_0_16px_rgba(0,255,170,0.3)] animate-pulse'
            : 'bg-[#021822] hover:bg-[#032332] border-[#00e5ff] text-[#00e5ff] shadow-[0_0_12px_rgba(0,240,255,0.15)]'
        }`}
      >
        <span className="text-sm">🎙️</span>
        <span>{isMicActive ? 'MICROPHONE ACTIVE' : 'TAP TO SPEAK'}</span>
      </button>
    </div>
  );
};
