import Groq from 'groq-sdk';
import { SystemInfo } from './system.js';
import * as os from 'os';

export interface AIResponse {
  explanation: string | null;
  command: string | null;
  answer: string | null;
  isComplete: boolean;
  is_destructive: boolean;
  thinking?: string;
}

export interface GroqModel {
  id: string;
  owned_by: string;
}

export class AIAgent {
  private groq: Groq;
  private messages: Groq.Chat.ChatCompletionMessageParam[] = [];
  private model: string;
  
  constructor(apiKey: string, model: string) {
    this.groq = new Groq({ apiKey });
    this.model = model;
  }

  private getShellType(): string {
    const platform = os.platform();
    if (platform === 'win32') return 'PowerShell';
    return 'bash';
  }

  public startSession(systemInfo: SystemInfo, goal: string) {
    // Reset conversation history for each new goal to prevent unbounded growth
    this.messages = [];

    const shell = this.getShellType();
    const isWindows = systemInfo.platform === 'win32';

    const systemPrompt = `You are LinuxForge, an expert AI agent created by Gujjeti Mokshith. You are a COMMAND EXECUTION AGENT, not a chatbot.
You operate in a continuous agentic loop: you propose a shell command, the user's terminal executes it, the output is sent back to you, and you analyze it to decide the next step. You repeat this cycle until the goal is fully achieved.

The user's system shell is: ${shell}
The user's OS platform is: ${systemInfo.platform} (${isWindows ? 'Windows' : 'Linux/macOS'})
The user's username is: ${systemInfo.username || process.env.USER || 'User'}

Your primary objective is: "${goal}"

System Specifications:
${JSON.stringify(systemInfo, null, 2)}

CRITICAL RULES — YOU MUST FOLLOW THESE:

1. YOU ARE AN AGENT, NOT A CHATBOT. Your job is to RUN COMMANDS to accomplish goals. Do NOT just describe what commands could be run — actually provide them in the "command" field so they get executed.

2. ALWAYS PREFER COMMANDS OVER ANSWERS. If a goal can be accomplished or investigated by running a command, you MUST provide a command. Only use "answer" (without a command) for pure arithmetic or trivia that cannot be resolved by running anything (e.g. "what is 5+5", "who invented Linux").

3. When the user asks about their system (e.g. "tell me about my OS", "what GPU do I have", "how much disk space"), you MUST run diagnostic commands to gather REAL data. Do NOT answer from the system specs alone — run commands like ${isWindows ? '"systeminfo", "Get-ComputerInfo", "Get-WmiObject", "wmic"' : '"uname -a", "lsb_release -a", "lscpu", "free -h", "df -h"'}.

4. Write commands for ${shell}. ${isWindows ? 'Use PowerShell syntax (e.g. Get-Process, Get-ChildItem). Do NOT use bash/Linux commands.' : 'Use bash syntax. Do NOT use PowerShell commands.'} 

5. Do NOT suggest interactive commands that require TTY input (like 'vi', 'nano', or interactive prompts). You MUST pass flags to automate them (e.g. -y, --yes, --noconfirm, -Force). ${!isWindows ? 'For Arch Linux (pacman, yay, paru), always use --noconfirm.' : ''}

6. Evaluate if the command modifies system files, deletes data, or requires elevated privileges (${isWindows ? 'Run as Administrator' : 'sudo, rm -rf'}). If so, set "is_destructive" to true.

7. Do NOT set "isComplete" to true until the goal is FULLY accomplished and you have VERIFIED the result by examining command output. Do not prematurely mark goals as complete.

8. You MUST respond with ONLY a valid JSON object — no markdown, no explanation outside the JSON:
{
  "explanation": "Brief description of what this command does and why (string or null)",
  "command": "The exact ${shell} command to execute (string or null)",
  "answer": "Direct answer ONLY for pure knowledge questions with no possible command (string or null)",
  "isComplete": false,
  "is_destructive": false
}`;

    this.messages.push({
      role: 'system',
      content: systemPrompt
    });
  }

  public async sendMessage(message: string): Promise<AIResponse> {
    this.messages.push({
      role: 'user',
      content: message
    });

    const response = await this.groq.chat.completions.create({
      model: this.model,
      messages: this.messages,
      response_format: { type: 'json_object' }
    });

    const text = response.choices[0]?.message?.content || '{}';
    this.messages.push({
      role: 'assistant',
      content: text
    });
    
    try {
      let parsed: AIResponse;
      let thinking = "";

      // Some models emit reasoning text before the JSON payload
      const startIndex = text.indexOf('{');
      const endIndex = text.lastIndexOf('}');

      if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        thinking = text.substring(0, startIndex).replace(/```json\n?|\n?```/g, '').trim();
        const jsonSubstring = text.substring(startIndex, endIndex + 1);
        parsed = JSON.parse(jsonSubstring) as AIResponse;
      } else {
        const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
        parsed = JSON.parse(cleanedText) as AIResponse;
      }

      if (thinking) {
        parsed.thinking = thinking;
      }
      return parsed;
    } catch (e) {
      // If JSON parsing fails entirely (e.g., model truncated output),
      // return a graceful fallback so the loop can retry
      return {
        explanation: null,
        command: null,
        answer: "⚠️ The AI's response was truncated or invalid. Asking it to continue...",
        isComplete: false,
        is_destructive: false,
        thinking: text.replace(/```json\n?|\n?```/g, '').trim()
      };
    }
  }
}

export async function verifyKey(apiKey: string): Promise<boolean> {
  const groq = new Groq({ apiKey });
  try {
    await groq.models.list();
    return true;
  } catch (error) {
    return false;
  }
}

export async function fetchModels(apiKey: string): Promise<GroqModel[]> {
  const groq = new Groq({ apiKey });
  try {
    const response = await groq.models.list();
    // Filter to only chat/text models and sort alphabetically
    const models = (response.data || [])
      .filter((m: any) => m.id && !m.id.includes('whisper') && !m.id.includes('distil') && !m.id.includes('tool-use'))
      .map((m: any) => ({ id: m.id, owned_by: m.owned_by || 'unknown' }))
      .sort((a: GroqModel, b: GroqModel) => a.id.localeCompare(b.id));
    return models;
  } catch (error) {
    return [];
  }
}
