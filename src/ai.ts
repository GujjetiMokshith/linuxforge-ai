import OpenAI from 'openai';
import { SystemInfo } from './system.js';

export interface AIResponse {
  explanation: string | null;
  command: string | null;
  answer: string | null;
  isComplete: boolean;
  is_destructive: boolean;
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
    const systemPrompt = `You are LinuxForge, an expert AI assistant that helps users manage their Linux systems.
You operate in a continuous loop: you propose a shell command to achieve the user's goal, the user executes it, and sends the output back to you. You continue this until the goal is achieved.
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
      model: 'minimax/minimax-m3:free',
      messages: this.messages,
      response_format: { type: 'json_object' }
    });

    const text = response.choices[0]?.message?.content || '{}';
    this.messages.push({
      role: 'assistant',
      content: text
    });
    
    try {
      const parsed = JSON.parse(text);
      return parsed as AIResponse;
    } catch (e) {
      // In case the model returns markdown JSON blocks
      try {
        const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
        return JSON.parse(cleanedText) as AIResponse;
      } catch (innerE) {
        throw new Error(`Failed to parse AI response as JSON: ${text}`);
      }
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
