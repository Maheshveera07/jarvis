import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Settings,
  Grid,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Smartphone,
  ExternalLink,
  ShieldAlert,
  Radio,
  Pin,
} from 'lucide-react';
import { HologramFace3D } from './components/HologramFace3D';
import { AudioSpectrum } from './components/AudioSpectrum';
import { SysMonitor } from './components/SysMonitor';
import { ActivityLog } from './components/ActivityLog';
import { FileUpload } from './components/FileUpload';
import { CommandInput } from './components/CommandInput';
import { ToolDisplayCard } from './components/ToolDisplayCard';
import { ActionConfirmationModal } from './components/ActionConfirmationModal';
import { SettingsModal } from './components/SettingsModal';
import { MicPermissionRecoveryToast } from './components/MicPermissionRecoveryToast';
import {
  AgentState,
  DeviceTelemetry,
  ActivityLogEntry,
  ToolCallData,
  ActiveCard,
} from './types';

export default function App() {
  // Agent State
  const [agentState, setAgentState] = useState<AgentState>('STANDBY');
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [isVoiceOnlyMode, setIsVoiceOnlyMode] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isAnalyzingVision, setIsAnalyzingVision] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<'settings' | 'android'>('settings');
  const [showMicRecoveryToast, setShowMicRecoveryToast] = useState<boolean>(false);
  const [pendingToolCall, setPendingToolCall] = useState<ToolCallData | null>(null);

  // Voice Engine Settings
  const [selectedLocale, setSelectedLocale] = useState<string>('auto');
  const [languagePriority, setLanguagePriority] = useState<'auto' | 'en-US' | 'hi-IN' | 'te-IN'>('auto');
  const [speechRate, setSpeechRate] = useState<number>(1.05);

  // Time & Date (Matching 12:15:36 Sat 03 Oct 2026 in screenshot)
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  // Device Telemetry (Matches left sidebar in screenshot)
  const [telemetry, setTelemetry] = useState<DeviceTelemetry>({
    cpu: 12,
    memory: 88,
    network: '1KB/s',
    gpu: 'N/A',
    temperature: '38°C',
    uptimeSeconds: 2692, // 44:52
    processes: 256,
    os: 'ANDROID',
    batteryLevel: 88,
    isCharging: false,
    networkType: '5G / Wi-Fi',
  });

  // Activity Log Stream (Initial text closely matching user screenshot)
  const [logs, setLogs] = useState<ActivityLogEntry[]>([
    {
      id: '1',
      timestamp: '12:15:00',
      sender: 'SYS',
      text: 'JARVIS online.',
    },
    {
      id: '2',
      timestamp: '12:15:02',
      sender: 'JARVIS',
      text: "Good afternoon, sir, it is 12 15 right now and I am fetching today's news for you. I remember earlier today, we struggled with opening WhatsApp chats and closing high memory applications due to some technical issues. Please let me know how else I can help.",
    },
  ]);

  // Center Tool Display Card (Initial card matches news card in screenshot)
  const [activeCard, setActiveCard] = useState<ActiveCard | null>({
    id: 'news-init',
    title: 'NEWS — TOP WORLD NEWS TODAY',
    type: 'NEWS',
    timestamp: '12:15:26',
    content: `Latest news: top world news today\n\n1. World News - Latest and Breaking Coverage - Yahoo News [Yahoo]\n   The latest world news and headlines from Yahoo News and international publishers, breaking stories, ongoing events, and coverage\n   https://www.yahoo.com/news/world/\n\n2. Latest World News [India.com]\n   Get latest & breaking international news from US, UK, Europe, UAE and rest of the world including current affairs, politics, business, enter\n   https://www.india.com/news/world/\n\n3. World's biggest spiderweb discovered inside 'Sulfur Cave' [Dailymotion on MSN]\n   Scientists may have found the world's largest spider web, a colossal structure stretching 1,140 square feet inside 'Sulfur ...`,
    actionUrl: 'https://news.google.com',
    actionLabel: 'OPEN WORLD NEWS',
  });

  // Conversation history for Gemini multi-turn context
  const conversationHistoryRef = useRef<{ role: 'user' | 'assistant'; content: string }[]>([
    {
      role: 'assistant',
      content:
        "Good afternoon, sir, it is 12 15 right now and I am fetching today's news for you.",
    },
  ]);

  // Refs for Speech Recognition, AudioContext, and SpeechSynthesis
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const isSpeakingRef = useRef<boolean>(false);
  const isVoiceOnlyRef = useRef<boolean>(false);
  const isMicActiveRef = useRef<boolean>(false);
  const languagePriorityRef = useRef<'auto' | 'en-US' | 'hi-IN' | 'te-IN'>('auto');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const isRecordingNeuralRef = useRef<boolean>(false);
  const useNeuralVoiceRef = useRef<boolean>(false);

  useEffect(() => {
    isVoiceOnlyRef.current = isVoiceOnlyMode;
  }, [isVoiceOnlyMode]);

  useEffect(() => {
    isMicActiveRef.current = isMicActive;
  }, [isMicActive]);

  useEffect(() => {
    languagePriorityRef.current = languagePriority;
  }, [languagePriority]);

  // Clock Update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-GB', { hour12: false }));
      setCurrentDate(
        now.toLocaleDateString('en-GB', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Telemetry simulation & real battery fetch
  useEffect(() => {
    // Attempt real battery API if supported in browser/mobile
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setTelemetry((prev) => ({
          ...prev,
          batteryLevel: Math.round(battery.level * 100),
          isCharging: battery.charging,
        }));
        battery.addEventListener('levelchange', () => {
          setTelemetry((prev) => ({
            ...prev,
            batteryLevel: Math.round(battery.level * 100),
          }));
        });
        battery.addEventListener('chargingchange', () => {
          setTelemetry((prev) => ({
            ...prev,
            isCharging: battery.charging,
          }));
        });
      }).catch(() => {});
    }

    // Uptime and subtle CPU jitter simulation
    const telemetryInterval = setInterval(() => {
      setTelemetry((prev) => {
        const cpuJitter = Math.min(
          95,
          Math.max(8, prev.cpu + Math.floor(Math.random() * 5 - 2))
        );
        const memJitter = Math.min(
          92,
          Math.max(75, prev.memory + (Math.random() > 0.7 ? 1 : Math.random() < 0.3 ? -1 : 0))
        );
        return {
          ...prev,
          uptimeSeconds: prev.uptimeSeconds + 1,
          cpu: cpuJitter,
          memory: memJitter,
          network: `${Math.floor(Math.random() * 12 + 1)}KB/s`,
        };
      });
    }, 1500);

    return () => clearInterval(telemetryInterval);
  }, []);

  // Keyboard shortcut listener: F4 to mute, F11 for fullscreen
  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      if (e.key === 'F4') {
        e.preventDefault();
        setIsMuted((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, []);

  // Cleanup all audio and speech streams on component unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      if (microphoneStreamRef.current) {
        microphoneStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Helper to add activity log entry
  const appendLog = useCallback((sender: ActivityLogEntry['sender'], text: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-GB', { hour12: false });
    setLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        timestamp: timeStr,
        sender,
        text,
      },
    ]);
  }, []);

  // Text-To-Speech with Multilingual Locale Matching
  const speakText = useCallback(
    (text: string) => {
      if (isMuted || !('speechSynthesis' in window)) {
        return;
      }

      window.speechSynthesis.cancel();

      // Language detection for voice locale (honoring languagePriority pin if selectedLocale is auto)
      let locale = selectedLocale !== 'auto'
        ? selectedLocale
        : languagePriorityRef.current !== 'auto'
        ? languagePriorityRef.current
        : 'en-US';

      if (selectedLocale === 'auto' && languagePriorityRef.current === 'auto') {
        const isHindi = /[\u0900-\u097F]/.test(text) || /\b(namaste|bhai|karo|kahiye|aap|mera|mujhe|hai)\b/i.test(text);
        const isTelugu = /[\u0C00-\u0C7F]/.test(text) || /\b(namaskaram|cheyyi|pampinchu|enti|ela|unna|undi|ra)\b/i.test(text);

        if (isTelugu) {
          locale = 'te-IN';
        } else if (isHindi) {
          locale = 'hi-IN';
        }
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = locale;
      utterance.rate = speechRate || 1.05;
      utterance.pitch = 0.95; // Confident, slightly deeper JARVIS AI tone

      // Pick preferred voice if available
      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find(
        (v) => v.lang.startsWith(locale.slice(0, 2)) || (locale.startsWith('en') && v.name.toLowerCase().includes('english'))
      );
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onstart = () => {
        isSpeakingRef.current = true;
        setAgentState('SPEAKING');
      };

      utterance.onend = () => {
        isSpeakingRef.current = false;
        // In Voice-Only mode, instantly return to listening state!
        if (isVoiceOnlyRef.current) {
          setAgentState('LISTENING');
          if (recognitionRef.current && isMicActiveRef.current) {
            try {
              recognitionRef.current.start();
            } catch {
              // already running or restarting
            }
          }
        } else {
          setAgentState('STANDBY');
        }
      };

      utterance.onerror = () => {
        isSpeakingRef.current = false;
        setAgentState(isVoiceOnlyRef.current ? 'LISTENING' : 'STANDBY');
      };

      window.speechSynthesis.speak(utterance);
    },
    [isMuted, selectedLocale, speechRate]
  );

  // Execute an Android / System tool call
  const executeToolCall = useCallback(
    async (toolCall: ToolCallData) => {
      const { name, args } = toolCall;
      appendLog('TOOL', `Executing ${name}(${JSON.stringify(args)})`);
      setAgentState('EXECUTING');

      const nowStr = new Date().toLocaleTimeString('en-GB', { hour12: false });
      let resultPayload: any = { success: true };

      try {
        switch (name) {
          case 'get_battery_status': {
            const level = telemetry.batteryLevel;
            const charging = telemetry.isCharging;
            resultPayload = {
              batteryLevel: level,
              isCharging: charging,
              status: charging ? 'Charging on AC/Fast Charger' : 'Discharging',
            };
            setActiveCard({
              id: 'tool-battery',
              title: 'TELEMETRY — BATTERY STATUS',
              type: 'TELEMETRY',
              timestamp: nowStr,
              content: `Battery Percentage: ${level}%\nCharging: ${charging ? 'Yes (⚡)' : 'No'}\nHealth: Good (38°C)\nPower Profile: Autonomous Balanced`,
            });
            break;
          }

          case 'send_message': {
            const { recipient, message, platform = 'whatsapp' } = args;
            const isWhatsApp = platform.toLowerCase() === 'whatsapp';
            const deepLink = isWhatsApp
              ? `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`
              : `sms:?body=${encodeURIComponent(message)}`;

            resultPayload = {
              success: true,
              recipient,
              message,
              platform,
              dispatchStatus: 'Intent dispatched to communication layer',
            };

            setActiveCard({
              id: 'tool-msg',
              title: `COMMUNICATION — ${platform.toUpperCase()} DISPATCHED`,
              type: 'WHATSAPP',
              timestamp: nowStr,
              content: `Platform: ${platform.toUpperCase()}\nRecipient: ${recipient}\nMessage: "${message}"\nStatus: Pre-filled intent triggered successfully.`,
              actionUrl: deepLink,
              actionLabel: `OPEN ${platform.toUpperCase()}`,
            });
            break;
          }

          case 'make_call': {
            const { recipient } = args;
            const telUrl = `tel:${encodeURIComponent(recipient)}`;
            resultPayload = {
              success: true,
              recipient,
              status: 'Telephony dialer invoked',
            };

            setActiveCard({
              id: 'tool-call',
              title: `TELEPHONY — CALLING ${recipient.toUpperCase()}`,
              type: 'CALL',
              timestamp: nowStr,
              content: `Placing voice call to: ${recipient}\nIntent: android.intent.action.CALL\nStatus: Telephony line connected.`,
              actionUrl: telUrl,
              actionLabel: 'OPEN PHONE DIALER',
            });
            break;
          }

          case 'open_app': {
            const { appName } = args;
            const appLinks: Record<string, string> = {
              youtube: 'https://youtube.com',
              spotify: 'https://open.spotify.com',
              chrome: 'https://google.com',
              maps: 'https://maps.google.com',
              whatsapp: 'https://web.whatsapp.com',
            };
            const targetUrl = appLinks[appName.toLowerCase()] || `https://www.google.com/search?q=${encodeURIComponent(appName)}`;

            resultPayload = { success: true, app: appName, status: 'Launched' };
            setActiveCard({
              id: 'tool-app',
              title: `SYSTEM — APPLICATION LAUNCH: ${appName.toUpperCase()}`,
              type: 'GENERIC',
              timestamp: nowStr,
              content: `Launching Android package for: ${appName}\nIntent: android.intent.category.LAUNCHER\nProcess ID: 257 (Active)`,
              actionUrl: targetUrl,
              actionLabel: `OPEN ${appName.toUpperCase()}`,
            });
            break;
          }

          case 'set_alarm': {
            const { time, label = 'Alarm' } = args;
            resultPayload = { success: true, time, label };
            setActiveCard({
              id: 'tool-alarm',
              title: `CLOCK — ALARM SCHEDULED: ${time}`,
              type: 'ALARM',
              timestamp: nowStr,
              content: `Alarm Set For: ${time}\nLabel: "${label}"\nScheduler: Android AlarmClock Intent\nStatus: Active in system clock.`,
            });
            break;
          }

          case 'create_calendar_event': {
            const { title, dateTime } = args;
            const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}`;
            resultPayload = { success: true, title, dateTime };
            setActiveCard({
              id: 'tool-cal',
              title: `CALENDAR — EVENT CREATED: ${title.toUpperCase()}`,
              type: 'CALENDAR',
              timestamp: nowStr,
              content: `Event: ${title}\nSchedule: ${dateTime}\nProvider: Android CalendarContract\nStatus: Synced.`,
              actionUrl: gcalUrl,
              actionLabel: 'VIEW IN GOOGLE CALENDAR',
            });
            break;
          }

          case 'search_web': {
            const { query } = args;
            const res = await fetch('/api/agent/news', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ category: query }),
            });
            const data = await res.json();
            const textResult = data.text || `Search results for: ${query}`;
            resultPayload = { success: true, query, data: textResult };

            setActiveCard({
              id: 'tool-search',
              title: `SEARCH — ${query.toUpperCase()}`,
              type: 'GENERIC',
              timestamp: nowStr,
              content: textResult,
              actionUrl: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
              actionLabel: 'SEARCH WEB IN BROWSER',
            });
            break;
          }

          case 'navigate_device': {
            const { action } = args;
            resultPayload = { success: true, action, status: 'Executed' };
            setActiveCard({
              id: 'tool-nav',
              title: `ACCESSIBILITY — ${action.toUpperCase()}`,
              type: 'GENERIC',
              timestamp: nowStr,
              content: `Dispatched global accessibility action: GLOBAL_ACTION_${action.toUpperCase()}\nStatus: Verified on active window.`,
            });
            break;
          }

          case 'read_notifications': {
            resultPayload = {
              success: true,
              notifications: [
                { app: 'WhatsApp', sender: 'Rahul', text: "Hey, are you joining the meeting?" },
                { app: 'Gmail', sender: 'Google Cloud', text: 'Billing report for October is ready' },
              ],
            };
            setActiveCard({
              id: 'tool-notifs',
              title: 'NOTIFICATIONS — DIGEST (2 NEW)',
              type: 'GENERIC',
              timestamp: nowStr,
              content: `Incoming Status Bar Notifications:\n\n1. WhatsApp [Rahul]:\n   "Hey, are you joining the meeting?" (5m ago)\n\n2. Gmail [Google Cloud]:\n   "Billing report for October is ready" (22m ago)`,
            });
            break;
          }

          default:
            resultPayload = { success: true, info: 'Action dispatched' };
            break;
        }

        // Return tool result to Gemini for spoken response
        const chatRes = await fetch('/api/agent/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: conversationHistoryRef.current,
            deviceState: telemetry,
            toolResult: resultPayload,
          }),
        });

        const chatData = await chatRes.json();
        const spokenResponse = chatData.text || 'Action complete, sir.';

        appendLog('JARVIS', spokenResponse);
        conversationHistoryRef.current.push({ role: 'assistant', content: spokenResponse });
        speakText(spokenResponse);
      } catch (err: any) {
        console.error('Tool execution error:', err);
        const errMsg = `I encountered an issue executing ${name}: ${err?.message || 'Unknown error'}`;
        appendLog('WARN', errMsg);
        speakText(errMsg);
      }
    },
    [telemetry, appendLog, speakText]
  );

  // Main input processor: sends speech/text to Gemini Agent Core
  const processUserInput = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      appendLog('USER', text);
      conversationHistoryRef.current.push({ role: 'user', content: text });
      setAgentState('THINKING');

      try {
        const response = await fetch('/api/agent/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: conversationHistoryRef.current,
            deviceState: telemetry,
          }),
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to communicate with JARVIS AI Core');
        }

        // Handle Function/Tool Calls
        if (data.functionCalls && data.functionCalls.length > 0) {
          const firstCall = data.functionCalls[0];
          const isSensitive = ['send_message', 'make_call'].includes(firstCall.name);

          const toolData: ToolCallData = {
            id: firstCall.id,
            name: firstCall.name,
            args: firstCall.args || {},
            riskLevel: isSensitive ? 'SENSITIVE' : 'LOW',
            status: isSensitive ? 'PENDING_CONFIRMATION' : 'EXECUTING',
          };

          if (isSensitive) {
            setPendingToolCall(toolData);
            setAgentState('STANDBY');
            const alertText = `Authorization requested for ${toolData.name}. Please confirm to proceed, sir.`;
            appendLog('JARVIS', alertText);
            speakText(alertText);
            return;
          } else {
            await executeToolCall(toolData);
            return;
          }
        }

        // Conversational Text Response
        const reply = data.text || 'Acknowledged, sir.';
        appendLog('JARVIS', reply);
        conversationHistoryRef.current.push({ role: 'assistant', content: reply });
        speakText(reply);
      } catch (error: any) {
        console.error('Process error:', error);
        const failText = `AI Core error: ${error?.message || 'Connection lost'}`;
        appendLog('WARN', failText);
        speakText("I am having trouble reaching the core network right now, sir.");
        setAgentState('STANDBY');
      }
    },
    [telemetry, appendLog, speakText, executeToolCall]
  );

  // Direct Neural Audio Recording Engine (Works in sandboxed iframes where Web Speech API is blocked)
  const startNeuralRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      microphoneStreamRef.current = stream;

      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioCtx;
      }
      const audioCtx = audioContextRef.current;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateMicLevel = () => {
        if (analyserRef.current && isMicActiveRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setAudioLevel(Math.min(1.0, avg / 85));
          requestAnimationFrame(updateMicLevel);
        }
      };
      requestAnimationFrame(updateMicLevel);

      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
        else if (MediaRecorder.isTypeSupported('audio/ogg')) mimeType = 'audio/ogg';
        else mimeType = '';
      }

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
        if (audioBlob.size > 600) {
          setAgentState('THINKING');
          appendLog('SYS', 'Transcribing spoken audio via Neural AI Core...');

          const reader = new FileReader();
          reader.onloadend = async () => {
            try {
              const base64Audio = reader.result as string;
              const res = await fetch('/api/agent/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  audioBase64: base64Audio,
                  mimeType: mimeType || 'audio/webm',
                }),
              });
              const data = await res.json();
              if (data.success && data.text?.trim()) {
                const transcribed = data.text.trim();
                appendLog('USER', transcribed);
                processUserInput(transcribed);
              } else {
                appendLog('WARN', 'No audible speech detected. Reverting to standby.');
                setAgentState('STANDBY');
              }
            } catch (err: any) {
              appendLog('WARN', 'Voice transcription service timed out.');
              setAgentState('STANDBY');
            }
          };
          reader.readAsDataURL(audioBlob);
        } else {
          setAgentState('STANDBY');
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(250);
      isRecordingNeuralRef.current = true;
      setIsMicActive(true);
      setShowMicRecoveryToast(false);
      setAgentState('LISTENING');
      appendLog('SYS', '🎙️ Neural Audio Recording active. Speak now (tap mic again to send)...');
    } catch (err) {
      setShowMicRecoveryToast(true);
      appendLog('WARN', 'Microphone capture error. Please ensure microphone access is permitted.');
    }
  }, [appendLog, processUserInput]);

  // Speech Recognition & Microphone Toggle Setup
  const toggleMicrophone = useCallback(() => {
    if (isMicActive) {
      // If currently recording via Neural MediaRecorder
      if (isRecordingNeuralRef.current && mediaRecorderRef.current) {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
        isRecordingNeuralRef.current = false;
        setIsMicActive(false);
        setAgentState('THINKING');
        return;
      }

      // If currently listening via SpeechRecognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      if (microphoneStreamRef.current) {
        microphoneStreamRef.current.getTracks().forEach((t) => t.stop());
        microphoneStreamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      setIsMicActive(false);
      setAgentState('STANDBY');
      setAudioLevel(0);
      appendLog('SYS', 'Microphone standby.');
      return;
    }

    // If Neural Voice Mode was activated due to browser iframe policy
    if (useNeuralVoiceRef.current) {
      startNeuralRecording();
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Automatic fallback to Neural Audio Recording if Web Speech API is absent
      useNeuralVoiceRef.current = true;
      startNeuralRecording();
      return;
    }

      // Initialize Web Audio API Analyser safely without duplicate contexts
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && !microphoneStreamRef.current) {
        navigator.mediaDevices
          .getUserMedia({ audio: true })
          .then((stream) => {
            microphoneStreamRef.current = stream;
            if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              audioContextRef.current = audioCtx;
            }
            const audioCtx = audioContextRef.current;
            if (audioCtx.state === 'suspended') {
              audioCtx.resume().catch(() => {});
            }
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 64;
            source.connect(analyser);
            analyserRef.current = analyser;

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const updateMicLevel = () => {
              if (analyserRef.current && isMicActiveRef.current) {
                analyserRef.current.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                  sum += dataArray[i];
                }
                const avg = sum / dataArray.length;
                setAudioLevel(Math.min(1.0, avg / 85));
                requestAnimationFrame(updateMicLevel);
              }
            };
            requestAnimationFrame(updateMicLevel);
          })
          .catch(() => {
            // Permission denied or media stream unavailable - present recovery UI
            setShowMicRecoveryToast(true);
            appendLog('WARN', 'Microphone stream blocked by browser. Presenting permission recovery instructions.');
          });
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      // Honor pinned Language Priority for speech recognition engine
      const pinned = languagePriorityRef.current;
      recognition.lang = pinned === 'auto' ? 'en-US' : pinned;

      recognition.onstart = () => {
        setIsMicActive(true);
        setShowMicRecoveryToast(false); // Automatically dismiss recovery guide when audio starts
        setAgentState('LISTENING');
        const langLabel =
          pinned === 'auto'
            ? 'Auto-Detect'
            : pinned === 'te-IN'
            ? 'Telugu [PINNED]'
            : pinned === 'hi-IN'
            ? 'Hindi [PINNED]'
            : 'English [PINNED]';
        appendLog('SYS', `Microphone active. Listening [${langLabel}]...`);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript.trim()) {
          const cleanSpeech = finalTranscript.trim();

          // Check for spoken interruption commands: "Stop", "Cancel", "Wait"
          if (/\b(stop|cancel|wait|don't do that|abort)\b/i.test(cleanSpeech)) {
            handleInterrupt();
            return;
          }

          // Check if user is confirming pending sensitive action
          if (pendingToolCall && /\b(yes|confirm|proceed|ok|send it)\b/i.test(cleanSpeech)) {
            const call = pendingToolCall;
            setPendingToolCall(null);
            executeToolCall(call);
            return;
          }

          processUserInput(cleanSpeech);
        }
      };

      recognition.onerror = (event: any) => {
        // Handle denied permission cleanly and activate the non-intrusive recovery toast
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          useNeuralVoiceRef.current = true;
          setIsMicActive(false);
          setIsVoiceOnlyMode(false);
          setAgentState('STANDBY');
          setShowMicRecoveryToast(true);
          appendLog(
            'WARN',
            'Browser SpeechRecognition blocked by iframe policy. Direct Neural Audio Recording is available.'
          );
          return;
        }

        // Ignore normal silence timeouts
        if (event.error === 'no-speech') {
          return;
        }

        // For other transient errors in voice-only mode, only restart if active and not denied
        if (isVoiceOnlyRef.current && isMicActiveRef.current) {
          setTimeout(() => {
            if (isVoiceOnlyRef.current && isMicActiveRef.current) {
              try {
                recognition.start();
              } catch {}
            }
          }, 400);
        } else {
          setIsMicActive(false);
          setAgentState('STANDBY');
        }
      };

      recognition.onend = () => {
        // Persistent background listening in voice-only mode or active mic
        if (isVoiceOnlyRef.current || isMicActiveRef.current) {
          setTimeout(() => {
            if (isVoiceOnlyRef.current || isMicActiveRef.current) {
              try {
                recognition.start();
              } catch {}
            }
          }, 150);
        } else {
          setIsMicActive(false);
          setAgentState('STANDBY');
        }
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch (err) {
        setIsMicActive(false);
        setAgentState('STANDBY');
      }
    },
    [isMicActive, pendingToolCall, appendLog, processUserInput, executeToolCall, startNeuralRecording]
  );

  // Voice-Only Mode Toggle with persistent background listening
  const handleToggleVoiceOnly = useCallback(
    (enabled: boolean) => {
      setIsVoiceOnlyMode(enabled);
      if (enabled) {
        appendLog('SYS', 'VOICE-ONLY MODE ENGAGED. UI minimized, persistent background listening active.');
        speakText('Voice-only mode engaged, sir. All UI elements minimized. Listening continuously.');
        if (!isMicActiveRef.current) {
          toggleMicrophone();
        }
      } else {
        appendLog('SYS', 'Restoring standard Mark LV visual terminal view.');
        speakText('Restoring Mark LV visual terminal, sir.');
      }
    },
    [appendLog, speakText, toggleMicrophone]
  );

  // Dedicated Language Priority Selector (Overrides auto-detection for speech recognition engine)
  const handleSelectLanguagePriority = useCallback(
    (priority: 'auto' | 'en-US' | 'hi-IN' | 'te-IN') => {
      setLanguagePriority(priority);
      languagePriorityRef.current = priority;
      const label =
        priority === 'auto'
          ? 'Auto-Detect (Dynamic Code-Switching)'
          : priority === 'te-IN'
          ? 'Telugu (తెలుగు) [PINNED]'
          : priority === 'hi-IN'
          ? 'Hindi (हिन्दी) [PINNED]'
          : 'English (US / India) [PINNED]';
      appendLog('SYS', `Speech Recognition language priority pinned to: ${label}`);

      // If microphone is currently active, cycle the recognition instance to apply the new pinned acoustic model
      if (isMicActiveRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    },
    [appendLog]
  );

  // Emergency Interruption Handler ([ESC] / Button / Voice)
  const handleInterrupt = useCallback(() => {
    window.speechSynthesis.cancel();
    const wasSpeaking = isSpeakingRef.current;
    isSpeakingRef.current = false;
    setPendingToolCall(null);
    if (isVoiceOnlyRef.current) {
      if (!wasSpeaking) {
        setIsVoiceOnlyMode(false);
        setAgentState('STANDBY');
        appendLog('SYS', 'Voice-only mode exited. Restoring Mark LV terminal.');
        return;
      }
    }
    setAgentState(isVoiceOnlyRef.current ? 'LISTENING' : 'STANDBY');
    appendLog('WARN', 'INTERRUPT TRIGGERED: All actions halted.');
  }, [appendLog]);

  // Multimodal Vision / File Upload Inspector
  const handleFileAnalyzed = async (fileData: { name: string; type: string; base64?: string; content?: string }) => {
    setIsAnalyzingVision(true);
    appendLog('SYS', `Analyzing uploaded file/screenshot: ${fileData.name}`);
    setAgentState('THINKING');

    try {
      if (fileData.base64) {
        const res = await fetch('/api/agent/vision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: fileData.base64,
            mimeType: fileData.type,
            prompt: 'Inspect this screen/image and detail what is visible, any key buttons, text, or actionable elements.',
          }),
        });

        const data = await res.json();
        const analysis = data.text || 'Visual analysis complete.';

        setActiveCard({
          id: 'vision-res',
          title: `SCREEN INSPECTION — ${fileData.name.toUpperCase()}`,
          type: 'VISION',
          timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
          content: analysis,
        });

        appendLog('JARVIS', analysis);
        speakText(analysis);
      } else if (fileData.content) {
        // Text / log file analysis
        processUserInput(`Please review this uploaded file (${fileData.name}):\n${fileData.content.substring(0, 1500)}`);
      }
    } catch (err: any) {
      console.error('Vision analysis error:', err);
      appendLog('WARN', `Failed to analyze visual data: ${err?.message}`);
    } finally {
      setIsAnalyzingVision(false);
    }
  };

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#010c12] text-[#26e6e6] font-mono flex flex-col justify-between overflow-x-hidden">
      {/* Subtle Holographic Scanlines Overlay */}
      <div className="scanlines fixed inset-0 pointer-events-none z-40 opacity-70" />

      {/* ============================================================== */}
      {/* TOP STATUS BAR (Matches top bar in user image)                   */}
      {/* ============================================================== */}
      <header className="relative z-30 w-full px-4 py-2.5 border-b border-[#083344] bg-[#010e14]/90 backdrop-blur-md flex items-center justify-between">
        {/* Left: App Mark & Quick Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <span className="text-xs sm:text-sm font-bold text-[#00f0ff] tracking-wider">
            JARVIS — MARK LV
          </span>

          <span className="text-[11px] text-[#ffaa00] border border-[#144e59] px-1.5 py-0.5 rounded-xs tracking-wider font-semibold">
            MARK LV
          </span>

          {/* Quick Voice-Only Mode Toggle Indicator in Header */}
          <button
            onClick={() => handleToggleVoiceOnly(!isVoiceOnlyMode)}
            className={`px-2 py-1 rounded-xs border text-[10px] sm:text-[11px] font-bold tracking-wider flex items-center space-x-1.5 transition-all ${
              isVoiceOnlyMode
                ? 'bg-[#00ffcc] text-black border-[#00ffcc] shadow-[0_0_15px_#00ffcc] animate-pulse'
                : 'bg-[#021822] hover:bg-[#022837] border-[#144e59] text-[#26e6e6] hover:border-[#00e5ff] hover:text-[#00f0ff]'
            }`}
            title="Toggle High-Visibility Voice-Only Mode"
          >
            <Radio className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isVoiceOnlyMode ? 'VOICE-ONLY ACTIVE' : 'VOICE-ONLY'}</span>
            <span className="sm:hidden">{isVoiceOnlyMode ? 'VOICE ON' : 'VOICE'}</span>
          </button>

          <button
            onClick={() => {
              setSettingsInitialTab('settings');
              setShowSettingsModal(true);
            }}
            className="p-1 rounded-xs border border-[#144e59] bg-[#021822] hover:border-[#00e5ff] text-[#26e6e6] hover:text-[#00f0ff] transition-colors"
            title="System Settings & Voice Configuration"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          {!isVoiceOnlyMode && (
            <button
              onClick={() => {
                setActiveCard({
                  id: 'apps-grid',
                  title: 'ANDROID TOOLS & APP SHORTCUTS',
                  type: 'GENERIC',
                  timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
                  content: `Installed Tool Interops:\n\n• Telephony (Call & SMS)\n• WhatsApp Automation (Deep link + Accessibility auto-send)\n• Battery & Telemetry Manager\n• Google Maps & Chrome Navigation\n• System Alarm & CalendarContract\n• Screen Reader & Accessibility Tree\n• YouTube / Spotify Media Player`,
                });
              }}
              className="p-1 rounded-xs border border-[#144e59] bg-[#021822] hover:border-[#00e5ff] text-[#26e6e6] hover:text-[#00f0ff] transition-colors"
              title="Android Tools Grid"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Center: Title & Subtitle */}
        <div className="hidden md:flex flex-col items-center">
          <h1 className="text-base sm:text-lg font-bold text-[#00f0ff] tracking-widest hud-glow-cyan">
            JARVIS
          </h1>
          <span className="text-[10px] text-[#26e6e6]/80 tracking-wider">
            {isVoiceOnlyMode ? 'Voice-Only Persistent Mode' : 'A Friendly Assistant'}
          </span>
        </div>

        {/* Right: Clock & Date */}
        <div className="text-right">
          <div className="text-sm sm:text-base font-bold text-[#00f0ff] tracking-widest">
            {currentTime || '12:15:36'}
          </div>
          <div className="text-[10px] text-[#155e75] tracking-wider">
            {currentDate || 'Sat 03 Oct 2026'}
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* MAIN THREE-COLUMN WORKSPACE (Left Monitor, Center Face, Right Logs) */}
      {/* In Voice-Only Mode: Left and Right panels hide completely!     */}
      {/* ============================================================== */}
      <main className="relative z-20 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 sm:p-4 max-w-[1720px] mx-auto w-full">
        {/* LEFT COLUMN: SYS MONITOR (Hidden in Voice-Only Mode) */}
        {!isVoiceOnlyMode && (
          <div className="lg:col-span-2 h-full flex flex-col border border-[#144e59] bg-[#01141c]/80 p-3 rounded-xs shadow-[0_0_15px_rgba(0,240,255,0.04)]">
            <SysMonitor
              telemetry={telemetry}
              onToggleOs={() => {
                setTelemetry((prev) => ({
                  ...prev,
                  os: prev.os === 'ANDROID' ? 'WIN' : 'ANDROID',
                }));
                appendLog('SYS', `Operating mode toggled: ${telemetry.os === 'ANDROID' ? 'WIN' : 'ANDROID'}`);
              }}
            />
          </div>
        )}

        {/* CENTER COLUMN: 3D HOLOGRAPHIC FACE & ACTIVE TOOL CARDS */}
        {/* Expands to span 12 columns in Voice-Only Mode */}
        <div
          className={`flex flex-col justify-between items-center ${
            isVoiceOnlyMode ? 'lg:col-span-12 py-6' : 'lg:col-span-7 space-y-2'
          }`}
        >
          {/* High-Visibility Banner in Voice-Only Mode */}
          {isVoiceOnlyMode && (
            <div className="w-full max-w-2xl mx-auto mb-3 p-3 bg-[#022b28]/90 border-2 border-[#00ffcc] rounded-full shadow-[0_0_30px_rgba(0,255,204,0.35)] flex items-center justify-between text-xs animate-pulse">
              <div className="flex items-center space-x-2.5 text-[#00ffcc] font-bold tracking-widest pl-2">
                <span className="w-3 h-3 rounded-full bg-[#00ffcc] shadow-[0_0_10px_#00ffcc]" />
                <span className="text-[11px] sm:text-xs">VOICE-ONLY PERSISTENT LISTENING ENGAGED</span>
              </div>
              <button
                onClick={() => handleToggleVoiceOnly(false)}
                className="px-3.5 py-1.5 bg-[#1e070e] hover:bg-[#380e1a] border border-[#f43f5e] text-[#f43f5e] hover:text-white font-bold rounded-full text-[10px] tracking-wider transition-all shadow-[0_0_12px_rgba(244,63,94,0.3)] cursor-pointer"
              >
                EXIT VOICE-ONLY [ESC]
              </button>
            </div>
          )}

          {/* Top Stage: 3D Wireframe Low-Poly Face */}
          <div className="w-full flex-1 flex flex-col items-center justify-center relative">
            <HologramFace3D state={agentState} audioLevel={audioLevel} />

            {/* Audio Waveform Spectrum Bars */}
            <AudioSpectrum state={agentState} audioLevel={audioLevel} />
          </div>

          {/* Bottom Stage: Active Tool Output Card */}
          <div className="w-full pt-2">
            <ToolDisplayCard card={activeCard} onDismiss={() => setActiveCard(null)} />
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVITY LOG, FILE UPLOAD & COMMAND INPUT (Hidden in Voice-Only Mode) */}
        {!isVoiceOnlyMode && (
          <div className="lg:col-span-3 flex flex-col justify-between space-y-3">
            {/* Activity Log Terminal */}
            <ActivityLog logs={logs} onClearLogs={() => setLogs([])} />

            {/* File Upload / Screenshot Inspector */}
            <FileUpload onFileAnalyzed={handleFileAnalyzed} isAnalyzing={isAnalyzingVision} />

            {/* Command Input & Big Action Buttons */}
            <CommandInput
              onSendCommand={processUserInput}
              onInterrupt={handleInterrupt}
              onToggleMic={toggleMicrophone}
              isMicActive={isMicActive}
              agentState={agentState}
            />
          </div>
        )}
      </main>

      {/* ============================================================== */}
      {/* BOTTOM FOOTER BAR (Matches [F4] Mute • [F11] Fullscreen & info) */}
      {/* ============================================================== */}
      <footer className="relative z-30 w-full px-4 py-2 border-t border-[#083344] bg-[#010e14]/90 text-[10px] text-[#155e75] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="flex items-center space-x-1 hover:text-[#00f0ff] transition-colors"
          >
            {isMuted ? <VolumeX className="w-3 h-3 text-[#f43f5e]" /> : <Volume2 className="w-3 h-3 text-[#00ffcc]" />}
            <span>[F4] {isMuted ? 'UNMUTE' : 'MUTE'}</span>
          </button>

          <span>•</span>

          <button
            onClick={toggleFullscreen}
            className="flex items-center space-x-1 hover:text-[#00f0ff] transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            <span>[F11] FULLSCREEN</span>
          </button>

          <span>•</span>

          <span
            className={`font-semibold flex items-center space-x-1 ${
              languagePriority !== 'auto' ? 'text-[#ffaa00]' : 'text-[#00ffaa]'
            }`}
          >
            {languagePriority !== 'auto' && <Pin className="w-2.5 h-2.5 text-[#ffaa00]" />}
            <span>
              {languagePriority === 'auto'
                ? 'LANG: AUTO (EN / HI / TE)'
                : `LANG: PINNED ${
                    languagePriority === 'te-IN'
                      ? 'TELUGU'
                      : languagePriority === 'hi-IN'
                      ? 'HINDI'
                      : 'ENGLISH'
                  }`}
            </span>
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setSettingsInitialTab('android');
              setShowSettingsModal(true);
            }}
            className="flex items-center space-x-1 text-[#00f0ff] hover:text-white transition-colors"
          >
            <Smartphone className="w-3 h-3" />
            <span className="underline">EXPORT ANDROID KOTLIN SOURCE</span>
          </button>

          <span>•</span>

          <span className="text-[#26e6e6]/60">By FatihMakes / JARVIS Mark LV</span>
        </div>
      </footer>

      {/* Security Action Confirmation Modal (for sensitive calls, SMS, WhatsApp) */}
      <ActionConfirmationModal
        toolCall={pendingToolCall}
        onConfirm={() => {
          if (pendingToolCall) {
            const call = pendingToolCall;
            setPendingToolCall(null);
            executeToolCall(call);
          }
        }}
        onCancel={() => {
          setPendingToolCall(null);
          appendLog('SYS', 'Operation aborted by user.');
        }}
      />

      {/* Unified System Settings & Android Kotlin Source Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        isVoiceOnlyMode={isVoiceOnlyMode}
        onToggleVoiceOnly={handleToggleVoiceOnly}
        selectedLocale={selectedLocale}
        onSelectLocale={setSelectedLocale}
        languagePriority={languagePriority}
        onSelectLanguagePriority={handleSelectLanguagePriority}
        speechRate={speechRate}
        onSelectSpeechRate={setSpeechRate}
        initialTab={settingsInitialTab}
      />

      {/* Non-intrusive Microphone Permission Recovery Notification */}
      <MicPermissionRecoveryToast
        isOpen={showMicRecoveryToast}
        onClose={() => setShowMicRecoveryToast(false)}
        onRetry={() => {
          setShowMicRecoveryToast(false);
          useNeuralVoiceRef.current = false;
          toggleMicrophone();
        }}
        onActivateNeuralVoice={() => {
          setShowMicRecoveryToast(false);
          useNeuralVoiceRef.current = true;
          startNeuralRecording();
        }}
        onFocusInput={() => {
          const inputEl = document.querySelector('input[type="text"]') as HTMLInputElement | null;
          if (inputEl) {
            inputEl.focus();
          }
        }}
      />
    </div>
  );
}
