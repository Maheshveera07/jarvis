import React, { useState } from 'react';
import { X, Copy, Check, Download, FileCode, Smartphone } from 'lucide-react';

interface AndroidCodeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidCodeExportModal: React.FC<AndroidCodeExportModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'service' | 'main' | 'accessibility' | 'gemini' | 'manifest'>('service');
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

        // Begin audio stream & wake-phrase inspection
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

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // Inspect active window when user requests "What does this screen say?"
    }

    override fun onInterrupt() {}

    /**
     * Traverses the active window hierarchy and returns structured semantic text
     */
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

    /**
     * Locates a clickable UI element by text or content description (e.g. "Send" button in WhatsApp)
     */
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
        return performGlobalAction(action) // GLOBAL_ACTION_BACK, GLOBAL_ACTION_HOME, etc.
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

    suspend fun processUserSpeech(transcript: String): AgentResponse {
        val chat = generativeModel.startChat()
        val response = chat.sendMessage(transcript)
        
        // Inspect for function calls
        response.functionCalls.firstOrNull()?.let { call ->
            return AgentResponse.ToolExecution(call.name, call.args)
        }

        return AgentResponse.SpokenAnswer(response.text ?: "Understood, sir.")
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

    private val requiredPermissions = arrayOf(
        Manifest.permission.RECORD_AUDIO,
        Manifest.permission.CALL_PHONE,
        Manifest.permission.SEND_SMS,
        Manifest.permission.READ_CONTACTS
    )

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

    <!-- Essential Android Agent Permissions -->
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

        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Persistent Voice Foreground Service -->
        <service
            android:name=".services.JarvisForegroundService"
            android:foregroundServiceType="microphone"
            android:exported="false" />

        <!-- UI Node Automation Accessibility Service -->
        <service
            android:name=".accessibility.JarvisAccessibilityService"
            android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE"
            android:exported="true">
            <intent-filter>
                <action android:name="android.accessibilityservice.AccessibilityService" />
            </intent-filter>
            <meta-data
                android:name="android.accessibilityservice"
                android:resource="@xml/accessibility_service_config" />
        </service>
    </application>
</manifest>`,
    },
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippets[activeTab].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const active = codeSnippets[activeTab];
    const blob = new Blob([active.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = active.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 font-mono select-none">
      <div className="w-full max-w-4xl h-[85vh] border border-[#00e5ff] bg-[#02141c] rounded-xs shadow-[0_0_40px_rgba(0,240,255,0.25)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#083344] bg-[#010e14]">
          <div className="flex items-center space-x-2 text-[#00f0ff]">
            <Smartphone className="w-5 h-5 text-[#00e5ff]" />
            <span className="font-bold tracking-wider text-xs sm:text-sm uppercase">
              ANDROID NATIVE KOTLIN & JETPACK COMPOSE COMPANION SOURCE
            </span>
          </div>
          <button onClick={onClose} className="text-[#155e75] hover:text-[#f43f5e] p-1 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-[#083344] bg-[#021822] overflow-x-auto text-xs">
          {Object.entries(codeSnippets).map(([key, data]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`px-4 py-2.5 whitespace-nowrap transition-colors border-r border-[#083344] flex items-center space-x-1.5 ${
                activeTab === key
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
            <span>{codeSnippets[activeTab].desc}</span>
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
            <code>{codeSnippets[activeTab].code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
