import React from 'react';
import { MicOff, Lock, RefreshCw, X, MessageSquare, ExternalLink, Sparkles, Volume2 } from 'lucide-react';

interface MicPermissionRecoveryToastProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  onActivateNeuralVoice?: () => void;
  onFocusInput?: () => void;
}

export const MicPermissionRecoveryToast: React.FC<MicPermissionRecoveryToastProps> = ({
  isOpen,
  onClose,
  onRetry,
  onActivateNeuralVoice,
  onFocusInput,
}) => {
  if (!isOpen) return null;

  const handleOpenStandalone = () => {
    try {
      window.open(window.location.href, '_blank');
    } catch {
      // Fallback
    }
  };

  return (
    <aside
      aria-label="Microphone permission recovery"
      className="fixed bottom-14 right-4 sm:right-6 max-w-lg w-[calc(100vw-2rem)] z-50 animate-in fade-in slide-in-from-bottom-5 duration-300 select-none"
    >
      <div className="relative rounded-xs border-2 border-[#ffaa00] bg-[#02131b]/98 backdrop-blur-md p-4 shadow-[0_0_35px_rgba(255,170,0,0.35)] text-left font-mono">
        {/* Glow accent bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#ffaa00] to-transparent" />

        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[#144e59] pb-2.5 mb-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-xs bg-[#241300] border border-[#ffaa00] text-[#ffaa00] animate-pulse">
              <MicOff className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#ffaa00] tracking-wider uppercase flex items-center gap-1.5">
                <span>VOICE INPUT RESTRICTION</span>
                <span className="text-[10px] bg-[#ffaa00]/20 text-[#ffaa00] px-1 py-0.2 rounded font-mono">
                  IFRAME / PERMISSION
                </span>
              </h3>
              <p className="text-[10px] text-[#26e6e6]/90 tracking-wide">
                Chrome limits SpeechRecognition inside embedded preview frames
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#155e75] hover:text-[#00f0ff] p-1 rounded-xs hover:bg-[#04202c] transition-colors cursor-pointer"
            title="Dismiss guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Explanation for why it happens when permission is already allowed */}
        <div className="mb-3.5 p-2 bg-[#041d28] border border-[#0d4a57] rounded-xs text-[11px] text-[#99f6e4] space-y-1">
          <div className="flex items-center space-x-1.5 text-[#00ffcc] font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-[#00ffcc]" />
            <span>Already granted microphone permission?</span>
          </div>
          <p className="text-[10.5px] text-[#94a3b8] leading-relaxed">
            Chromium security blocks the browser's cloud <code className="text-[#00f0ff]">webkitSpeechRecognition</code> engine inside third-party <code className="text-[#00f0ff]">&lt;iframe&gt;</code> embeds even when mic permission is granted.
          </p>
        </div>

        {/* Action Options */}
        <div className="space-y-2 mb-3">
          {onActivateNeuralVoice && (
            <button
              onClick={() => {
                onActivateNeuralVoice();
                onClose();
              }}
              className="w-full px-3 py-2 bg-gradient-to-r from-[#024059] to-[#046a7a] hover:from-[#035272] hover:to-[#058498] border border-[#00f0ff] text-[#00f0ff] font-bold text-xs rounded-xs flex items-center justify-between transition-all shadow-[0_0_15px_rgba(0,240,255,0.2)] cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <Volume2 className="w-4 h-4 text-[#00ffcc]" />
                <span className="tracking-wide">USE NEURAL AUDIO RECORDING (DIRECT MIC)</span>
              </div>
              <span className="text-[10px] bg-[#00f0ff]/20 text-[#00ffcc] px-1.5 py-0.5 rounded font-mono">
                RECOMMENDED
              </span>
            </button>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={handleOpenStandalone}
              className="px-3 py-2 bg-[#03202e] hover:bg-[#06334a] border border-[#144e59] hover:border-[#00e5ff] text-[#26e6e6] hover:text-[#00f0ff] text-xs font-semibold rounded-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#00e5ff]" />
              <span>OPEN IN DIRECT TAB</span>
            </button>

            <button
              onClick={onRetry}
              className="px-3 py-2 bg-[#ffaa00] hover:bg-[#ffbb22] text-black font-bold text-xs rounded-xs flex items-center justify-center space-x-1.5 transition-all shadow-[0_0_10px_rgba(255,170,0,0.3)] cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>RETRY SPEECH API</span>
            </button>
          </div>
        </div>

        {/* Footer Text Input Switch */}
        <div className="pt-2 border-t border-[#083344] flex items-center justify-between text-[11px] text-[#64748b]">
          <span>Or proceed without voice:</span>
          <button
            onClick={() => {
              onClose();
              if (onFocusInput) onFocusInput();
            }}
            className="text-[#26e6e6] hover:text-[#00f0ff] flex items-center space-x-1 underline cursor-pointer"
          >
            <MessageSquare className="w-3 h-3" />
            <span>Switch to Command Input</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
