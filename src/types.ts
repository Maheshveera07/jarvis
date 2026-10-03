export type AgentState = 'STANDBY' | 'LISTENING' | 'THINKING' | 'EXECUTING' | 'SPEAKING';

export interface DeviceTelemetry {
  cpu: number;
  memory: number;
  network: string;
  gpu: string;
  temperature: string;
  uptimeSeconds: number;
  processes: number;
  os: 'ANDROID' | 'WIN';
  batteryLevel: number;
  isCharging: boolean;
  networkType: string;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  sender: 'SYS' | 'JARVIS' | 'USER' | 'TOOL' | 'WARN';
  text: string;
}

export interface ToolCallData {
  id: string;
  name: string;
  args: Record<string, any>;
  riskLevel: 'LOW' | 'SENSITIVE';
  status: 'PENDING_CONFIRMATION' | 'EXECUTING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  result?: any;
}

export interface ActiveCard {
  id: string;
  title: string;
  type: 'NEWS' | 'TELEMETRY' | 'WHATSAPP' | 'CALL' | 'ALARM' | 'CALENDAR' | 'VISION' | 'GENERIC';
  timestamp: string;
  content: string;
  metadata?: Record<string, any>;
  actionUrl?: string;
  actionLabel?: string;
}
