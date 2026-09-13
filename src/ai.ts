import OpenAI from 'openai';
import { SystemInfo } from './system.js';

export interface AIResponse {
  explanation: string | null;
  command: string | null;
  answer: string | null;
  isComplete: boolean;
  is_destructive: boolean;
  thinking?: string;
}

export class AIAgent {
  private openai: OpenAI;
  private messages: any[] = [];
  
  constructor(apiKey: string) {
    this.openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey,
      defaultHeaders: {
        'HTTP-Referer': 'https://linuxforge.ai',
        'X-Title': 'LinuxForge',
      }
    });
  }

  public startSession(systemInfo: SystemInfo, goal: string) {
    const systemPrompt = `You are LinuxForge, an expert AI assistant created by Gujjeti Mokshith that helps users manage their Linux systems.
You operate in a continuous loop: you propose a shell command to achieve the user's goal, the user executes it, and sends the output back to you. You continue this until the goal is achieved.
The user's username is: ${systemInfo.username || process.env.USER || 'User'}. You should address them by their name when appropriate in your answers.
Your primary objective is: "${goal}"

System Specifications (JSON):
${JSON.stringify(systemInfo, null, 2)}

Instructions:
1. Analyze the user's goal and the system specifications.
2. Determine if a shell command is needed. If you just need to directly answer a question (e.g., "what is 5+5"), provide your response in the "answer" field, leave "command" and "explanation" null, and set "isComplete" to true.
3. If a shell command is needed, provide a brief explanation of what you are doing in "explanation" and the exact bash shell command in "command".
4. If the goal is fully achieved after reviewing command output, you can provide a final summary in the "answer" field and set "isComplete" to true.
5. Do NOT suggest interactive commands that require TTY input (like 'vi' or interactive prompts) unless you can pass flags to automate them (e.g., -y).
6. Evaluate if the command modifies system files, deletes data, or requires root privileges (like sudo or rm -rf). If it does, set "is_destructive" to true.
7. You MUST respond with a valid JSON object matching the following structure exactly:
{
  "explanation": "string | null",
  "command": "string | null",
  "answer": "string | null",
  "isComplete": boolean,
  "is_destructive": boolean
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

    const response = await this.openai.chat.completions.create({
      model: 'nvidia/nemotron-3.5-lightning:free', //Changed Model 
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
      // If we completely fail to parse JSON (e.g., model truncated output),
      // we gracefully return the raw text as thinking so the user can see it,
      // and let the loop prompt the AI again.
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
  const openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey,
    defaultHeaders: {
      'HTTP-Referer': 'https://linuxforge.ai',
      'X-Title': 'LinuxForge',
    }
  });

  try {
    await openai.models.list();
    return true;
  } catch (error) {
    return false;
  }
}
