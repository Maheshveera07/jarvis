import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

const app = express();
app.use(express.json({ limit: '25mb' }));

// Initialize GoogleGenAI SDK
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Tool declarations for JARVIS Agent
const toolsDeclarations: FunctionDeclaration[] = [
  {
    name: 'get_battery_status',
    description: 'Get current Android phone battery percentage, health, and charging status.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        detail: {
          type: Type.STRING,
          description: 'Optional detail request: "percentage" or "full_report"',
        },
      },
    },
  },
  {
    name: 'send_message',
    description: 'Send or draft a message to a contact via WhatsApp or SMS. Flagged as SENSITIVE: requires user confirmation unless verified.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        recipient: {
          type: Type.STRING,
          description: 'Name of the contact or phone number, e.g. "Mom", "Rahul", "Priya"',
        },
        message: {
          type: Type.STRING,
          description: 'The exact content of the message to be sent',
        },
        platform: {
          type: Type.STRING,
          description: 'Messaging platform to use: "whatsapp" or "sms"',
        },
      },
      required: ['recipient', 'message'],
    },
  },
  {
    name: 'make_call',
    description: 'Place a voice call to a contact or phone number. Flagged as SENSITIVE: requires confirmation if direct call.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        recipient: {
          type: Type.STRING,
          description: 'Name of the contact or phone number to call',
        },
      },
      required: ['recipient'],
    },
  },
  {
    name: 'open_app',
    description: 'Launch an installed application on the Android device, such as YouTube, Spotify, Maps, Chrome, Camera, WhatsApp, Settings.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        appName: {
          type: Type.STRING,
          description: 'Name of the application to open, e.g. "YouTube", "Chrome", "Google Maps", "Spotify"',
        },
      },
      required: ['appName'],
    },
  },
  {
    name: 'set_alarm',
    description: 'Create an alarm or countdown timer on the Android device.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        time: {
          type: Type.STRING,
          description: 'Time for the alarm, e.g. "06:00 AM", "7:30 PM", or "in 20 minutes"',
        },
        label: {
          type: Type.STRING,
          description: 'Label or reminder note for the alarm, e.g. "Morning workout", "Study"',
        },
      },
      required: ['time'],
    },
  },
  {
    name: 'create_calendar_event',
    description: 'Create a calendar event or reminder in the Android calendar.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: 'Event title, e.g. "Team Sync", "Dentist Appointment"',
        },
        dateTime: {
          type: Type.STRING,
          description: 'Date and time of the event, e.g. "Tomorrow at 4 PM"',
        },
      },
      required: ['title', 'dateTime'],
    },
  },
  {
    name: 'read_notifications',
    description: 'Inspect and summarize recent incoming status bar notifications from Android apps (WhatsApp, Gmail, Messages, etc.).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        filter: {
          type: Type.STRING,
          description: 'Optional filter, e.g. "whatsapp", "urgent", or "all"',
        },
      },
    },
  },
  {
    name: 'search_web',
    description: 'Search the internet for real-time information, news, weather, or facts.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: 'Search query terms',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'navigate_device',
    description: 'Perform system accessibility actions: go home, go back, open recents, or capture screenshot.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: {
          type: Type.STRING,
          description: 'Action to perform: "home", "back", "recents", "screenshot"',
        },
      },
      required: ['action'],
    },
  },
  {
    name: 'control_media',
    description: 'Control media playback or volume on the Android device.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        command: {
          type: Type.STRING,
          description: 'Media command: "play", "pause", "next", "previous", "volume_up", "volume_down", "mute"',
        },
      },
      required: ['command'],
    },
  },
];

const JARVIS_SYSTEM_INSTRUCTION = `
You are JARVIS Mark LV, an advanced, highly capable, voice-first Android AI Agent and personal copilot inspired by Stark Industries cybernetic interfaces.
You have direct bridge connections to the user's Android phone hardware, system services, intents, accessibility node tree, and telephony layer.

CRITICAL OPERATIONAL RULES:
1. VOICE-FIRST RESPONSE STYLE:
   - Your responses will be spoken aloud to the user via Text-To-Speech (TTS).
   - Keep normal responses concise, crisp, natural, and confident.
   - Do NOT provide giant walls of text or markdown tables unless explicitly asked.
   - Address the user courteously (e.g. "Sir", or natural conversational tone).

2. MULTILINGUAL & CODE-SWITCHING CAPABILITY:
   - You natively understand and communicate in English, Hindi (हिन्दी), Telugu (తెలుగు), and mixed colloquial speech (e.g. "Hinglish", "Tenglish", "Rahul ki WhatsApp lo message pampinchu", "Rahul ko message bhejo").
   - ALWAYS respond in the same language or dialect the user used.
   - If the user switches languages mid-conversation, seamlessly switch with them without mentioning it.

3. TOOL CALLING DISCIPLINE:
   - When the user asks for a device action (calling, messaging, battery, alarm, app launch, search, notifications, screenshot, etc.), CALL THE CORRESPONDING TOOL.
   - For multi-step tasks (e.g., "Check my battery and open YouTube"), invoke the tools necessary or plan the steps cleanly.
   - Never say "I have sent the message" if the tool has not been executed.
   - For sensitive actions like sending a message, money, or placing a call: formulate the tool arguments accurately so the system can verify before dispatching.

4. AMBIGUITY RESOLUTION:
   - If a request is ambiguous (e.g. "Call Rahul" when there could be multiple Rahuls), ask a concise clarifying question instead of guessing.

5. ACTIVE STATUS & SENSE OF PRESENCE:
   - You are online, sharp, and constantly monitoring system telemetry.
`;

// Endpoint: Main conversational agent with tool calling
app.post('/api/agent/chat', async (req, res) => {
  try {
    const { messages, deviceState, toolResult } = req.body;

    // Build context
    const telemetryContext = deviceState
      ? `[Current Phone Telemetry: Battery ${deviceState.batteryLevel || 84}%, Charging: ${deviceState.isCharging ? 'Yes' : 'No'}, Network: ${deviceState.network || '5G/Wi-Fi'}, Time: ${deviceState.currentTime || new Date().toLocaleTimeString()}, Active App: ${deviceState.activeApp || 'JARVIS HUD'}]`
      : '';

    // Convert conversation messages to Gemini format
    const contents: any[] = [];

    if (telemetryContext) {
      contents.push({
        role: 'user',
        parts: [{ text: `System Telemetry Update: ${telemetryContext}` }],
      });
      contents.push({
        role: 'model',
        parts: [{ text: 'Telemetry integrated into Mark LV core.' }],
      });
    }

    if (Array.isArray(messages)) {
      for (const msg of messages) {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }
    }

    // If there is an immediate tool result from previous turn, inject it
    if (toolResult) {
      contents.push({
        role: 'user',
        parts: [
          {
            text: `[TOOL EXECUTION RESULT]: ${JSON.stringify(toolResult)}`,
          },
        ],
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contents.length > 0 ? contents : 'Hello JARVIS, report status.',
      config: {
        systemInstruction: JARVIS_SYSTEM_INSTRUCTION,
        temperature: 0.7,
        tools: [{ functionDeclarations: toolsDeclarations }],
      },
    });

    const candidate = response.candidates?.[0];
    const text = response.text || '';
    const functionCalls = response.functionCalls || [];

    res.json({
      success: true,
      text: text.trim(),
      functionCalls: functionCalls.map((fc) => ({
        id: fc.id || Math.random().toString(36).substring(7),
        name: fc.name,
        args: fc.args,
      })),
    });
  } catch (error: any) {
    console.error('Agent chat error:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'An internal error occurred in JARVIS AI Core.',
    });
  }
});

// Endpoint: Multimodal Vision / Screenshot / Screen Analysis
app.post('/api/agent/vision', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/png', prompt = 'Analyze this screen and describe key elements, text, or actions.' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'No image data provided' });
    }

    // Clean base64 prefix if present
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: mimeType,
              },
            },
            {
              text: `${JARVIS_SYSTEM_INSTRUCTION}\n\nTask: ${prompt}\nFormat your analysis concisely for voice delivery, identifying buttons, visible text, or important details.`,
            },
          ],
        },
      ],
    });

    res.json({
      success: true,
      text: response.text || 'Screen analysis complete.',
    });
  } catch (error: any) {
    console.error('Vision analysis error:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to analyze visual data.',
    });
  }
});

// Endpoint: Audio Transcription Fallback (when iframe policy blocks browser Web Speech API)
app.post('/api/agent/transcribe', async (req, res) => {
  try {
    const { audioBase64, mimeType = 'audio/webm' } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ success: false, error: 'No audio data provided' });
    }

    const cleanBase64 = audioBase64.replace(/^data:audio\/[a-z0-9-]+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: mimeType,
              },
            },
            {
              text: 'Transcribe this voice audio accurately. Transcribe speech in English, Hindi, or Telugu. Output ONLY the raw transcribed text with no quotation marks, preamble, or commentary.',
            },
          ],
        },
      ],
    });

    const transcription = response.text?.trim() || '';

    res.json({
      success: true,
      text: transcription,
    });
  } catch (error: any) {
    console.error('Audio transcription error:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to transcribe audio.',
    });
  }
});

// Endpoint: Real-time News & Information Feed
app.post('/api/agent/news', async (req, res) => {
  try {
    const { category = 'world news and technology headlines today' } = req.body;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Provide the top 3-4 latest breaking news headlines and concise summaries for: ${category}. Format with title, brief 2-sentence summary, and source attribution. Keep it clean and authoritative.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    res.json({
      success: true,
      text: response.text || 'News feed updated.',
    });
  } catch (error: any) {
    console.error('News fetch error:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to fetch news feed.',
    });
  }
});

// Server setup: Vite in development, static in production
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`JARVIS Core online at http://0.0.0.0:${PORT}`);
  });
}

startServer();
