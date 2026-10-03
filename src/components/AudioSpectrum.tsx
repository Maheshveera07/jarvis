import React, { useEffect, useState } from 'react';
import { AgentState } from '../types';

interface AudioSpectrumProps {
  state: AgentState;
  audioLevel: number;
}

export const AudioSpectrum: React.FC<AudioSpectrumProps> = ({ state, audioLevel }) => {
  const barCount = 36;
  const [heights, setHeights] = useState<number[]>(() => new Array(barCount).fill(4));

  useEffect(() => {
    let animId: number;

    const updateBars = () => {
      const isLive = state === 'SPEAKING' || state === 'LISTENING';
      const baseMultiplier = isLive ? (audioLevel > 0 ? audioLevel : 0.6) : 0.08;

      setHeights(
        Array.from({ length: barCount }, (_, i) => {
          // Bell curve distribution toward center
          const distFromCenter = Math.abs(i - barCount / 2) / (barCount / 2);
          const bell = Math.max(0.15, 1 - distFromCenter * 0.7);

          if (isLive) {
            const jitter = Math.random() * 0.6 + 0.4;
            const h = Math.round(bell * jitter * baseMultiplier * 28) + 3;
            return Math.min(32, Math.max(3, h));
          } else {
            // Idle gentle wave
            const wave = Math.sin(Date.now() * 0.003 + i * 0.25) * 0.5 + 0.5;
            return Math.max(2, Math.round(wave * 5 + 2));
          }
        })
      );

      animId = requestAnimationFrame(updateBars);
    };

    animId = requestAnimationFrame(updateBars);
    return () => cancelAnimationFrame(animId);
  }, [state, audioLevel]);

  return (
    <div className="w-full flex items-end justify-center gap-[2.5px] h-9 px-4 my-1 select-none">
      {heights.map((h, idx) => {
        const isSpeaking = state === 'SPEAKING';
        const isListening = state === 'LISTENING';
        const barColor = isSpeaking
          ? 'bg-[#00e5ff] shadow-[0_0_6px_#00e5ff]'
          : isListening
          ? 'bg-[#00ffcc] shadow-[0_0_6px_#00ffcc]'
          : 'bg-[#0891b2] opacity-60';

        return (
          <div
            key={idx}
            className={`w-[4px] sm:w-[5px] transition-all duration-75 rounded-t-sm ${barColor}`}
            style={{ height: `${h}px` }}
          />
        );
      })}
    </div>
  );
};
