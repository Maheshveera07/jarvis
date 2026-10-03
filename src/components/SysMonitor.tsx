import React from 'react';
import { motion } from 'framer-motion';
import { DeviceTelemetry } from '../types';

interface SysMonitorProps {
  telemetry: DeviceTelemetry;
  onToggleOs: () => void;
}

export const SysMonitor: React.FC<SysMonitorProps> = ({ telemetry, onToggleOs }) => {
  const formatUptime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -28 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="w-full flex flex-col justify-between h-full text-xs font-mono select-none"
    >
      {/* Top Header */}
      <div>
        <div className="flex items-center space-x-1.5 pb-3 border-b border-[#083344] text-[#00f0ff] font-bold tracking-wider">
          <span className="text-[#00e5ff]">❖</span>
          <span>SYS MONITOR</span>
        </div>

        {/* Telemetry Metrics */}
        <div className="mt-3 space-y-3">
          {/* CPU Metric */}
          <div>
            <div className="flex justify-between items-center text-[#26e6e6] text-[11px] mb-1">
              <span>CPU</span>
              <motion.span
                key={telemetry.cpu}
                initial={{ opacity: 0.6 }}
                animate={{ opacity: 1 }}
                className="font-bold text-[#00f0ff]"
              >
                {telemetry.cpu}%
              </motion.span>
            </div>
            <div className="w-full bg-[#021822] h-1.5 rounded-full overflow-hidden border border-[#083344]">
              <motion.div
                className="bg-[#00e5ff] h-full shadow-[0_0_8px_#00e5ff]"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.max(5, telemetry.cpu))}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* MEM Metric (Red/Pink highlight just like screenshot) */}
          <div>
            <div className="flex justify-between items-center text-[#26e6e6] text-[11px] mb-1">
              <span>MEM</span>
              <motion.span
                key={telemetry.memory}
                initial={{ opacity: 0.6 }}
                animate={{ opacity: 1 }}
                className="font-bold text-[#f43f5e]"
              >
                {telemetry.memory}%
              </motion.span>
            </div>
            <div className="w-full bg-[#021822] h-1.5 rounded-full overflow-hidden border border-[#083344]">
              <motion.div
                className="bg-[#f43f5e] h-full shadow-[0_0_8px_#f43f5e]"
                initial={{ width: 0 }}
                animate={{ width: `${telemetry.memory}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* NET Metric */}
          <div className="flex justify-between items-center py-0.5 text-[11px]">
            <span className="text-[#155e75]">NET</span>
            <span className="text-[#00ffcc] font-semibold">{telemetry.network}</span>
          </div>

          {/* GPU Metric */}
          <div className="flex justify-between items-center py-0.5 text-[11px]">
            <span className="text-[#155e75]">GPU</span>
            <span className="text-[#ff9900] font-semibold">{telemetry.gpu}</span>
          </div>

          {/* TMP Metric */}
          <div className="flex justify-between items-center py-0.5 text-[11px]">
            <span className="text-[#155e75]">TMP</span>
            <span className="text-[#26e6e6]">{telemetry.temperature}</span>
          </div>

          {/* Battery Status (Essential Android Agent Metric) */}
          <div className="flex justify-between items-center py-0.5 text-[11px] border-t border-[#083344]/50 pt-1.5">
            <span className="text-[#155e75]">BATTERY</span>
            <span className={`font-semibold ${telemetry.batteryLevel < 20 ? 'text-[#f43f5e]' : 'text-[#00ffcc]'}`}>
              {telemetry.batteryLevel}% {telemetry.isCharging ? '⚡' : ''}
            </span>
          </div>
        </div>

        {/* System Stats Block */}
        <div className="mt-4 pt-3 border-t border-[#083344] space-y-1 text-[11px]">
          <div className="flex justify-between">
            <span className="text-[#155e75]">UP</span>
            <span className="text-[#ffaa00] font-semibold">{formatUptime(telemetry.uptimeSeconds)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#155e75]">PROC</span>
            <span className="text-[#00e5ff]">{telemetry.processes}</span>
          </div>
          <div className="flex justify-between items-center cursor-pointer hover:text-[#00f0ff]" onClick={onToggleOs}>
            <span className="text-[#155e75]">OS</span>
            <span className="text-[#ffaa00] font-bold border border-[#083344] px-1.5 py-0.5 rounded text-[10px] hover:border-[#00e5ff] transition-colors">
              {telemetry.os}
            </span>
          </div>
        </div>
      </div>

      {/* Lower Left Status Badges (Matches screenshot bottom-left) */}
      <div className="mt-6 pt-3 border-t border-[#083344] space-y-2">
        <div className="border border-[#144e59] bg-[#021822]/80 p-2 text-center rounded-xs shadow-[0_0_10px_rgba(0,240,255,0.05)]">
          <div className="text-[10px] text-[#155e75] tracking-widest font-semibold uppercase">AI CORE</div>
          <div className="text-[#00ffcc] font-bold text-xs tracking-wider">ACTIVE</div>
        </div>

        <div className="border border-[#144e59] bg-[#021822]/80 p-2 text-center rounded-xs shadow-[0_0_10px_rgba(0,240,255,0.05)]">
          <div className="text-[10px] text-[#155e75] tracking-widest font-semibold uppercase">SEC</div>
          <div className="text-[#26e6e6] font-bold text-xs tracking-wider">CLEARED</div>
        </div>

        <div className="border border-[#144e59] bg-[#021822]/80 p-2 text-center rounded-xs shadow-[0_0_10px_rgba(0,240,255,0.05)]">
          <div className="text-[10px] text-[#155e75] tracking-widest font-semibold uppercase">PROTOCOL</div>
          <div className="text-[#00e5ff] font-bold text-xs tracking-wider">MARK LV</div>
        </div>
      </div>
    </motion.div>
  );
};
