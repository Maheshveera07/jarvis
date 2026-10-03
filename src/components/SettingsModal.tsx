import React, { useState } from 'react';
import {
  X,
  Mic,
  Sliders,
  Smartphone,
  Copy,
  Check,
  Download,
  FileCode,
  Volume2,
  Globe,
  Radio,
  EyeOff,
  Zap,
  Pin,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isVoiceOnlyMode: boolean;
  onToggleVoiceOnly: (enabled: boolean) => void;
  selectedLocale: string;
  onSelectLocale: (locale: string) => void;
  languagePriority: 'auto' | 'en-US' | 'hi-IN' | 'te-IN';
  onSelectLanguagePriority: (priority: 'auto' | 'en-US' | 'hi-IN' | 'te-IN') => void;
  speechRate: number;
  onSelectSpeechRate: (rate: number) => void;
  initialTab?: 'settings' | 'android';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isVoiceOnlyMode,
  onToggleVoiceOnly,
  selectedLocale,
  onSelectLocale,
  languagePriority,
  onSelectLanguagePriority,
  speechRate,
  onSelectSpeechRate,
  initialTab = 'settings',
}) => {
  const [modalTab, setModalTab] = useState<'settings' | 'android'>(initialTab);
  const [activeCodeTab, setActiveCodeTab] = useState<'service' | 'main' | 'accessibility' | 'gemini' | 'manifest'>('service');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const codeSnippets: Record<string, { filename: string; code: string; desc: string }> = {
    service: {
      filename: 'JarvisForegroundService.kt',
      desc: 'Foreground Service maintaining microphone session & audio pipeline',
      code: `package com.jarvis.ai.services

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.jarvis.ai.voice.SpeechRecognizerManager

class JarvisForegroundService : Service() {

    private lateinit var speechManager: SpeechRecognizerManager
    private val CHANNEL_ID = "jarvis_voice_channel"
    private val NOTIF_ID = 1001

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        speechManager = SpeechRecognizerManager(this)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = buildForegroundNotification()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                NOTIF_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
            )
        } else {
            startForeground(NOTIF_ID, notification)
        }

        // Begin audio stream & persistent background listening
        speechManager.startListening()

        return START_STICKY
    }

    private fun buildForegroundNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("JARVIS Mark LV")
            .setContentText("Autonomous voice copilot listening...")
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "JARVIS Voice Core",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    override fun onDestroy() {
        speechManager.stopListening()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}`,
    },
    accessibility: {
      filename: 'JarvisAccessibilityService.kt',
      desc: 'Android Accessibility Service for semantic UI node traversal and WhatsApp auto-send',
      code: `package com.jarvis.ai.accessibility

import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

class JarvisAccessibilityService : AccessibilityService() {

    companion object {
        var instance: JarvisAccessibilityService? = null
            private set
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {}

    override fun onInterrupt() {}

    fun inspectActiveScreenText(): String {
        val root = rootInActiveWindow ?: return "Active screen inaccessible."
        val builder = StringBuilder()
        traverseNodes(root, builder)
        return builder.toString()
    }

    private fun traverseNodes(node: AccessibilityNodeInfo, builder: StringBuilder) {
        if (node.text != null && node.text.isNotEmpty()) {
            builder.append(node.text).append(" ")
        }
        if (node.contentDescription != null && node.contentDescription.isNotEmpty()) {
            builder.append("[").append(node.contentDescription).append("] ")
        }
        for (i in 0 until node.childCount) {
            node.getChild(i)?.let { traverseNodes(it, builder) }
        }
    }

    fun clickElementWithLabel(label: String): Boolean {
        val root = rootInActiveWindow ?: return false
        val list = root.findAccessibilityNodeInfosByText(label)
        for (node in list) {
            if (node.isClickable) {
                return node.performAction(AccessibilityNodeInfo.ACTION_CLICK)
            }
            node.parent?.let { parent ->
                if (parent.isClickable) {
                    return parent.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                }
            }
        }
        return false
    }

    fun performSystemNavigation(action: Int): Boolean {
        return performGlobalAction(action)
    }

    override fun onDestroy() {
        instance = null
        super.onDestroy()
    }
}`,
    },
    gemini: {
      filename: 'GeminiAgentEngine.kt',
      desc: 'Gemini 2.5/3.8 Flash structured function calling & intent planner',
      code: `package com.jarvis.ai.ai

import com.google.ai.client.generativeai.GenerativeModel
import com.google.ai.client.generativeai.type.FunctionDeclaration
import com.google.ai.client.generativeai.type.Schema
import com.google.ai.client.generativeai.type.Tool

class GeminiAgentEngine(apiKey: String) {

    private val batteryTool = FunctionDeclaration(
        name = "get_battery_status",
        description = "Get Android phone battery percentage and charging state",
        parameters = emptyList()
    )

    private val sendMessageTool = FunctionDeclaration(
        name = "send_message",
        description = "Send message via WhatsApp or SMS",
        parameters = listOf(
            Schema.str("recipient", "Contact name or phone number"),
            Schema.str("message", "Text content"),
            Schema.str("platform", "whatsapp or sms")
        )
    )

    private val generativeModel = GenerativeModel(
        modelName = "gemini-2.5-flash",
        apiKey = apiKey,
        tools = listOf(Tool(listOf(batteryTool, sendMessageTool))),
        systemInstruction = "You are JARVIS, a voice-first Android AI copilot. Respond concisely in the user's spoken language (English, Hindi, or Telugu)."
    )

    suspend fun processUserSpeech(transcript: String): String {
        val chat = generativeModel.startChat()
        val response = chat.sendMessage(transcript)
        return response.text ?: "Understood, sir."
    }
}`,
    },
    main: {
      filename: 'MainActivity.kt',
      desc: 'Jetpack Compose Voice HUD & Permission Orchestrator',
      code: `package com.jarvis.ai

import android.Manifest
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.*
import com.jarvis.ai.ui.screens.MainAgentScreen

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                MainAgentScreen()
            }
        }
    }
}`,
    },
    manifest: {
      filename: 'AndroidManifest.xml',
      desc: 'Production permissions and service declarations',
      code: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.jarvis.ai">

    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MICROPHONE" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.CALL_PHONE" />
    <uses-permission android:name="android.permission.SEND_SMS" />
    <uses-permission android:name="android.permission.READ_CONTACTS" />
    <uses-permission android:name="android.permission.SET_ALARM" />
    <uses-permission android:name="android.permission.QUERY_ALL_PACKAGES" />

    <application
        android:name=".JarvisApplication"
        android:label="JARVIS"
        android:theme="@style/Theme.Jarvis">
        <!-- Persistent Voice Foreground Service -->
        <service
            android:name=".services.JarvisForegroundService"
            android:foregroundServiceType="microphone"
            android:exported="false" />
    </application>
</manifest>`,
    },
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippets[activeCodeTab].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const active = codeSnippets[activeCodeTab];
    const blob = new Blob([active.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = active.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 font-mono select-none">
      <div className="w-full max-w-4xl max-h-[90vh] border border-[#00e5ff] bg-[#02141c] rounded-xs shadow-[0_0_40px_rgba(0,240,255,0.25)] flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#083344] bg-[#010e14]">
          <div className="flex items-center space-x-2 text-[#00f0ff]">
            <Sliders className="w-5 h-5 text-[#00e5ff]" />
            <span className="font-bold tracking-wider text-xs sm:text-sm uppercase">
              JARVIS MARK LV — SYSTEM CONFIGURATION
            </span>
          </div>
          <button onClick={onClose} className="text-[#155e75] hover:text-[#f43f5e] p-1 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Tabs (Settings vs Android Source) */}
        <div className="flex border-b border-[#083344] bg-[#021822] text-xs">
          <button
            onClick={() => setModalTab('settings')}
            className={`flex-1 py-3 text-center font-bold tracking-wider transition-colors flex items-center justify-center space-x-2 border-r border-[#083344] ${
              modalTab === 'settings'
                ? 'bg-[#022837] text-[#00f0ff] border-b-2 border-b-[#00e5ff]'
                : 'text-[#155e75] hover:text-[#26e6e6]'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>VOICE & OPERATING MODES</span>
          </button>

          <button
            onClick={() => setModalTab('android')}
            className={`flex-1 py-3 text-center font-bold tracking-wider transition-colors flex items-center justify-center space-x-2 ${
              modalTab === 'android'
                ? 'bg-[#022837] text-[#00f0ff] border-b-2 border-b-[#00e5ff]'
                : 'text-[#155e75] hover:text-[#26e6e6]'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>ANDROID KOTLIN SOURCE CODE</span>
          </button>
        </div>

        {/* Tab Content 1: Settings & High-Visibility Voice-Only Mode Toggle */}
        {modalTab === 'settings' && (
          <div className="flex-1 p-5 overflow-y-auto space-y-6 text-xs text-[#26e6e6]">
            {/* ============================================================== */}
            {/* HIGH-VISIBILITY 'VOICE-ONLY' TOGGLE SWITCH (User requirement)   */}
            {/* ============================================================== */}
            <div
              className={`p-5 rounded-xs border-2 transition-all duration-300 ${
                isVoiceOnlyMode
                  ? 'border-[#00ffcc] bg-[#022b28]/80 shadow-[0_0_25px_rgba(0,255,204,0.35)]'
                  : 'border-[#144e59] bg-[#011620] hover:border-[#00e5ff]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center space-x-2">
                    <Radio className={`w-5 h-5 ${isVoiceOnlyMode ? 'text-[#00ffcc] animate-pulse' : 'text-[#155e75]'}`} />
                    <span className="text-sm font-bold tracking-widest uppercase text-white">
                      VOICE-ONLY INTERACTION MODE
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        isVoiceOnlyMode
                          ? 'bg-[#00ffcc] text-black shadow-[0_0_10px_#00ffcc]'
                          : 'bg-[#083344] text-[#155e75]'
                      }`}
                    >
                      {isVoiceOnlyMode ? 'ACTIVE' : 'STANDBY'}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                    Hides all graphical UI elements, sidebars, and terminal monitors. Forces the system into a{' '}
                    <strong className="text-[#00e5ff]">persistent background listening state</strong> so you can talk
                    to JARVIS continuously without touching the phone or screen.
                  </p>

                  <div className="flex items-center space-x-3 text-[10px] text-[#155e75] pt-1">
                    <span className="flex items-center space-x-1">
                      <EyeOff className="w-3 h-3" />
                      <span>Zero UI Distractions</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Zap className="w-3 h-3" />
                      <span>Persistent Audio Capture</span>
                    </span>
                    <span>•</span>
                    <span>Press [ESC] to Exit</span>
                  </div>
                </div>

                {/* Prominent High-Visibility Cyberpunk Toggle Switch */}
                <div className="flex items-center sm:justify-end">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isVoiceOnlyMode}
                    onClick={() => onToggleVoiceOnly(!isVoiceOnlyMode)}
                    className={`relative inline-flex h-9 w-20 flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none ${
                      isVoiceOnlyMode
                        ? 'bg-[#00ffcc] border-[#00ffcc] shadow-[0_0_18px_#00ffcc]'
                        : 'bg-[#021822] border-[#144e59]'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-[#010c12] shadow-lg ring-0 transition duration-200 ease-in-out flex items-center justify-center font-bold text-[9px] ${
                        isVoiceOnlyMode ? 'translate-x-11 text-[#00ffcc]' : 'translate-x-1 text-[#155e75]'
                      }`}
                    >
                      {isVoiceOnlyMode ? 'ON' : 'OFF'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* DEDICATED LANGUAGE PRIORITY (SPEECH RECOGNITION PIN) */}
            <div
              className={`p-4 rounded-xs border transition-all ${
                languagePriority !== 'auto'
                  ? 'border-[#ffaa00] bg-[#1a1202]/80 shadow-[0_0_15px_rgba(255,170,0,0.2)]'
                  : 'border-[#144e59] bg-[#021822]/70'
              } space-y-3`}
            >
              <div className="flex items-center justify-between border-b border-[#083344] pb-2">
                <div className="flex items-center space-x-2 text-[#00f0ff] font-bold text-xs tracking-wider">
                  <Pin
                    className={`w-4 h-4 ${
                      languagePriority !== 'auto' ? 'text-[#ffaa00] animate-bounce' : 'text-[#00e5ff]'
                    }`}
                  />
                  <span className="uppercase">SPEECH RECOGNITION LANGUAGE PRIORITY</span>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                    languagePriority !== 'auto'
                      ? 'bg-[#ffaa00] text-black shadow-[0_0_8px_#ffaa00]'
                      : 'bg-[#083344] text-[#26e6e6]'
                  }`}
                >
                  {languagePriority !== 'auto' ? 'PINNED OVERRIDE' : 'AUTO DETECTION'}
                </span>
              </div>

              <div>
                <label className="block text-[11px] text-[#155e75] font-semibold mb-1">
                  MANUAL LANGUAGE PIN (OVERRIDING 'AUTO' DETECTION)
                </label>
                <select
                  value={languagePriority}
                  onChange={(e) => onSelectLanguagePriority(e.target.value as any)}
                  className={`w-full bg-[#010e14] border ${
                    languagePriority !== 'auto'
                      ? 'border-[#ffaa00] text-[#ffaa00]'
                      : 'border-[#144e59] text-[#26e6e6]'
                  } px-3 py-2.5 rounded-xs text-[11px] font-bold focus:outline-none focus:border-[#00e5ff]`}
                >
                  <option value="auto">Auto (Dynamic Code-Switching & Multi-Language Detection)</option>
                  <option value="en-US">📌 Pinned: English (en-US / India)</option>
                  <option value="hi-IN">📌 Pinned: Hindi (हिन्दी - hi-IN)</option>
                  <option value="te-IN">📌 Pinned: Telugu (తెలుగు - te-IN)</option>
                </select>
                <div className="mt-1.5 flex items-start space-x-2 text-[10px] text-[#94a3b8] leading-relaxed">
                  <span>ℹ</span>
                  <span>
                    {languagePriority === 'auto'
                      ? "The speech engine dynamically shifts acoustic models between English, Hindi, and Telugu based on user speech."
                      : languagePriority === 'te-IN'
                      ? "Pinned strictly to Telugu (తెలుగు). SpeechRecognizer will transcribe native Telugu phonemes directly without English phonetic bias."
                      : languagePriority === 'hi-IN'
                      ? "Pinned strictly to Hindi (हिन्दी). SpeechRecognizer will transcribe native Hindi Devanagari script directly."
                      : "Pinned strictly to English. SpeechRecognizer will optimize for standard English vocabulary."}
                  </span>
                </div>
              </div>
            </div>

            {/* General Multilingual Voice Engine Configuration */}
            <div className="border border-[#144e59] bg-[#021822]/70 p-4 rounded-xs space-y-4">
              <div className="flex items-center space-x-2 text-[#00f0ff] font-bold text-xs tracking-wider border-b border-[#083344] pb-2">
                <Globe className="w-4 h-4 text-[#00e5ff]" />
                <span>VOICE SYNTHESIS & OUTPUT CONFIGURATION</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-[#155e75] font-semibold mb-1">
                    PRIMARY LANGUAGE SELECTION
                  </label>
                  <select
                    value={selectedLocale}
                    onChange={(e) => onSelectLocale(e.target.value)}
                    className="w-full bg-[#010e14] border border-[#144e59] text-[#26e6e6] px-3 py-2 rounded-xs text-[11px] focus:outline-none focus:border-[#00e5ff]"
                  >
                    <option value="auto">Auto-Detect (English, Hindi, Telugu)</option>
                    <option value="en-US">English (US/India)</option>
                    <option value="hi-IN">Hindi (हिन्दी)</option>
                    <option value="te-IN">Telugu (తెలుగు)</option>
                  </select>
                  <span className="text-[10px] text-[#155e75] mt-1 block">
                    Automatic code-switching is active when Auto-Detect is enabled.
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] text-[#155e75] font-semibold mb-1">
                    TTS SPEECH RATE
                  </label>
                  <select
                    value={speechRate}
                    onChange={(e) => onSelectSpeechRate(parseFloat(e.target.value))}
                    className="w-full bg-[#010e14] border border-[#144e59] text-[#26e6e6] px-3 py-2 rounded-xs text-[11px] focus:outline-none focus:border-[#00e5ff]"
                  >
                    <option value="0.95">Deliberate (0.95x)</option>
                    <option value="1.05">Balanced JARVIS (1.05x)</option>
                    <option value="1.2">Fast Tactical (1.20x)</option>
                  </select>
                  <span className="text-[10px] text-[#155e75] mt-1 block">
                    Controls synthesized audio output cadence.
                  </span>
                </div>
              </div>
            </div>

            {/* Android Integration Summary */}
            <div className="border border-[#144e59] bg-[#021822]/70 p-4 rounded-xs space-y-2">
              <div className="flex items-center space-x-2 text-[#00f0ff] font-bold text-xs tracking-wider border-b border-[#083344] pb-2">
                <Smartphone className="w-4 h-4 text-[#00e5ff]" />
                <span>DEVICE HARDWARE INTEROP CHANNELS</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-[#26e6e6]">
                <div className="p-2 border border-[#083344] bg-[#010e14] rounded-xs">
                  <div className="text-[#155e75]">TELEPHONY</div>
                  <div className="text-[#00ffcc] font-bold">READY (CALL/SMS)</div>
                </div>
                <div className="p-2 border border-[#083344] bg-[#010e14] rounded-xs">
                  <div className="text-[#155e75]">WHATSAPP</div>
                  <div className="text-[#00ffcc] font-bold">DEEP LINK & A11Y</div>
                </div>
                <div className="p-2 border border-[#083344] bg-[#010e14] rounded-xs">
                  <div className="text-[#155e75]">BATTERY API</div>
                  <div className="text-[#00ffcc] font-bold">SYNCHRONIZED</div>
                </div>
                <div className="p-2 border border-[#083344] bg-[#010e14] rounded-xs">
                  <div className="text-[#155e75]">CALENDAR/CLOCK</div>
                  <div className="text-[#00ffcc] font-bold">INTENT BRIDGED</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 2: Android Native Source Code */}
        {modalTab === 'android' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Code Tabs Bar */}
            <div className="flex border-b border-[#083344] bg-[#021822] overflow-x-auto text-xs">
              {Object.entries(codeSnippets).map(([key, data]) => (
                <button
                  key={key}
                  onClick={() => setActiveCodeTab(key as any)}
                  className={`px-4 py-2.5 whitespace-nowrap transition-colors border-r border-[#083344] flex items-center space-x-1.5 ${
                    activeCodeTab === key
                      ? 'bg-[#022837] text-[#00f0ff] border-b-2 border-b-[#00e5ff] font-bold'
                      : 'text-[#155e75] hover:text-[#26e6e6]'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>{data.filename}</span>
                </button>
              ))}
            </div>

            {/* Description & Action Bar */}
            <div className="p-3 bg-[#01141c] border-b border-[#083344] flex items-center justify-between text-xs">
              <div className="text-[#26e6e6] text-[11px] truncate mr-2">
                <span className="text-[#155e75]">MODULE: </span>
                <span>{codeSnippets[activeCodeTab].desc}</span>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 bg-[#021822] hover:bg-[#032b3d] border border-[#144e59] text-[#26e6e6] hover:text-[#00f0ff] rounded-xs text-[11px] flex items-center space-x-1 transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-[#00ffcc]" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'COPIED' : 'COPY'}</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="px-2.5 py-1 bg-[#022837] hover:bg-[#033b52] border border-[#00e5ff] text-[#00f0ff] rounded-xs text-[11px] font-bold flex items-center space-x-1 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  <span>DOWNLOAD</span>
                </button>
              </div>
            </div>

            {/* Code Viewer */}
            <div className="flex-1 p-4 overflow-y-auto bg-[#010c12] text-[#26e6e6] text-xs font-mono select-text leading-relaxed">
              <pre className="text-[11px]">
                <code>{codeSnippets[activeCodeTab].code}</code>
              </pre>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 bg-[#010e14] border-t border-[#083344] flex items-center justify-between text-xs">
          <span className="text-[#155e75] text-[10px]">
            JARVIS Mark LV Production Voice Agent & Telemetry System
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#022837] hover:bg-[#033b52] border border-[#00e5ff] text-[#00f0ff] rounded-xs font-bold text-xs tracking-wider transition-colors"
          >
            DONE
          </button>
        </div>
      </div>
    </div>
  );
};
