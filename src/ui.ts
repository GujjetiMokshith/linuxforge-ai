import pc from 'picocolors';
import { SystemInfo } from './system.js';
import { Activity } from './config.js';
import ora, { Ora } from 'ora';
import { highlight } from 'cli-highlight';

// Strict Monochromatic Palette Accented by Bright Blue (#3B82F6)
export const colors = {
  brightBlue: (text: string) => `\x1b[38;2;59;130;246m${text}\x1b[0m`,
  white: (text: string) => `\x1b[38;2;255;255;255m${text}\x1b[0m`,
  boldWhite: (text: string) => `\x1b[1;37m${text}\x1b[0m`,
  lightGray: (text: string) => `\x1b[38;2;220;220;220m${text}\x1b[0m`,
  mutedGray: (text: string) => `\x1b[38;2;136;136;136m${text}\x1b[0m`,
  darkBorder: (text: string) => `\x1b[38;2;45;45;52m${text}\x1b[0m`,
  redDot: '\x1b[38;2;255;95;86m●\x1b[0m',
  yellowDot: '\x1b[38;2;255;189;46m●\x1b[0m',
  greenDot: '\x1b[38;2;39;201;63m●\x1b[0m',
};

// Helper to strip ANSI codes to get visual length
export function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

// Helper to pad strings visually
export function pad(str: string, length: number, fill = ' '): string {
  const visualLen = stripAnsi(str).length;
  if (visualLen >= length) return str;
  return str + fill.repeat(length - visualLen);
}

// Format relative time
function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─────────────────────────────────────────────────────────────
// 1. Unified Dashboard (Monochromatic & Bright Blue)
// ─────────────────────────────────────────────────────────────
export function renderDashboard(info: SystemInfo, activities: Activity[], model?: string) {
  const TOTAL_WIDTH = 80;
  const LEFT_WIDTH = 34;
  const RIGHT_WIDTH = 43; // 80 - 34 - 3 (borders)
  
  // Dashboard Title
  const title = ` linuxforge v2.0.0 `;
  const topBorder = colors.brightBlue(`╭${'─'.repeat(3)}${colors.boldWhite(title)}${colors.brightBlue('─'.repeat(TOTAL_WIDTH - 5 - stripAnsi(title).length))}╮`);
  const bottomBorder = colors.brightBlue(`╰${'─'.repeat(TOTAL_WIDTH - 2)}╯`);

  // Left Column Content
  const username = process.env.USER || 'User';
  const greeting = `${colors.brightBlue('Welcome back')} ${colors.boldWhite(username + '!')}`;
  
  // 8-bit Alien Graphic in bright blue
  const alien = [
    colors.brightBlue('  ▄▄████▄▄  '),
    colors.brightBlue('▄██████████▄'),
    colors.brightBlue('██▄██████▄██'),
    colors.brightBlue(' ▄▀ ▄▄▄▄ ▀▄ '),
    colors.brightBlue('▀   ▀  ▀   ▀')
  ];

  const now = new Date();
  const timeStr = `${colors.mutedGray('Time: ')}${colors.white(now.toLocaleTimeString())}`;
  const osStr = `${colors.mutedGray('OS: ')}${colors.white(`${info.distribution || info.platform} ${info.distroVersion || info.release}`)}`;
  const archStr = `${colors.mutedGray('Arch: ')}${colors.white(`${info.architecture} | ${info.cpus} CPUs`)}`;

  // Truncate model name for display
  const modelDisplay = model
    ? (model.length > 25 ? model.substring(0, 22) + '...' : model)
    : 'not set';
  const modelStr = `${colors.mutedGray('Model: ')}${colors.brightBlue(modelDisplay)}`;

  const leftLines = [
    '',
    pad(`  ${greeting}`, LEFT_WIDTH),
    '',
    ...alien.map(line => pad(`         ${line}`, LEFT_WIDTH)),
    '',
    pad(`  ${timeStr}`, LEFT_WIDTH),
    pad(`  ${osStr}`, LEFT_WIDTH),
    pad(`  ${archStr}`, LEFT_WIDTH),
    pad(`  ${modelStr}`, LEFT_WIDTH),
    ''
  ];

  // Right Column Content
  let rightLines = [
    pad(` ${colors.brightBlue('Recent activity')}`, RIGHT_WIDTH),
    ''
  ];

  const recentActivities = [...activities].reverse().slice(0, 3);
  if (recentActivities.length === 0) {
    rightLines.push(pad(`   ${colors.mutedGray('No recent activity')}`, RIGHT_WIDTH));
    rightLines.push(pad('', RIGHT_WIDTH));
    rightLines.push(pad('', RIGHT_WIDTH));
  } else {
    for (let i = 0; i < 3; i++) {
      if (recentActivities[i]) {
        const timeLog = colors.mutedGray(pad(timeAgo(recentActivities[i].timestamp), 8));
        let actionStr = recentActivities[i].action;
        if (actionStr.length > RIGHT_WIDTH - 15) {
          actionStr = actionStr.substring(0, RIGHT_WIDTH - 18) + '...';
        }
        rightLines.push(pad(`   ${timeLog} ${colors.white(actionStr)}`, RIGHT_WIDTH));
      } else {
        rightLines.push(pad('', RIGHT_WIDTH));
      }
    }
  }

  rightLines.push(pad('', RIGHT_WIDTH));
  rightLines.push(pad(` ${colors.darkBorder('─'.repeat(RIGHT_WIDTH - 2))}`, RIGHT_WIDTH));
  rightLines.push(pad(` ${colors.brightBlue('Available Commands')}`, RIGHT_WIDTH));
  rightLines.push('');
  rightLines.push(pad(`   ${colors.boldWhite('/key')}    ${colors.mutedGray('Update Groq API Key')}`, RIGHT_WIDTH));
  rightLines.push(pad(`   ${colors.boldWhite('/model')}  ${colors.mutedGray('Switch AI model')}`, RIGHT_WIDTH));
  rightLines.push(pad(`   ${colors.boldWhite('/clear')}  ${colors.mutedGray('Clear terminal history')}`, RIGHT_WIDTH));
  rightLines.push(pad(`   ${colors.boldWhite('/exit')}   ${colors.mutedGray('Exit LinuxForge')}`, RIGHT_WIDTH));
  rightLines.push(pad('', RIGHT_WIDTH));

  // Merge Columns
  console.log();
  console.log(topBorder);
  
  const maxLines = Math.max(leftLines.length, rightLines.length);
  for (let i = 0; i < maxLines; i++) {
    const l = leftLines[i] || pad('', LEFT_WIDTH);
    const r = rightLines[i] || pad('', RIGHT_WIDTH);
    console.log(colors.brightBlue('│') + l + ' ' + r + colors.brightBlue('│'));
  }
  
  console.log(bottomBorder);
}

// ─────────────────────────────────────────────────────────────
// 2. Modern Agentic Monochromatic & Bright Blue UI System
// ─────────────────────────────────────────────────────────────

/**
 * Task Header Section
 * Renders the goal with a bright blue vertical accent and actual model name.
 */
export function renderTaskHeader(goal: string, model?: string) {
  const TOTAL_WIDTH = 78;
  const leftSide = `  ${colors.brightBlue('│')} ${colors.boldWhite('# ' + goal)}`;
  const rightSide = model ? colors.mutedGray(model) : '';
  const leftLen = stripAnsi(leftSide).length;
  const rightLen = stripAnsi(rightSide).length;
  const spacing = Math.max(2, TOTAL_WIDTH - leftLen - rightLen);
  
  console.log();
  console.log(`${leftSide}${' '.repeat(spacing)}${rightSide}`);
  console.log();
}

/**
 * User Input Block
 * Visual container with bright blue vertical left accent.
 */
export function renderUserInputBlock(input: string) {
  console.log(`  ${colors.brightBlue('│')}  ${colors.white(input)}`);
  console.log();
}

/**
 * AI Execution & Thinking Log
 */

// Narrative Text: natural language thoughts rendered in plain white text
export function displayNarrative(text: string) {
  const lines = text.split('\n');
  for (const line of lines) {
    console.log(`  ${colors.brightBlue('│')} ${colors.white(line)}`);
  }
}

// Thinking Log: rendered in muted gray
export async function displayThinking(thinking: string): Promise<void> {
  console.log(`  ${colors.brightBlue('│')} ${colors.mutedGray('~ Thinking...')}`);
  const lines = thinking.split('\n');
  for (const line of lines) {
    if (line.trim()) {
      console.log(`  ${colors.brightBlue('│')}   ${colors.mutedGray(line)}`);
    }
  }
}

// Command Executions: prefixed with gray asterisk `*`
export function displayCommandAction(command: string, matchesOrStatus?: string) {
  const suffix = matchesOrStatus ? ` ${colors.mutedGray('(' + matchesOrStatus + ')')}` : '';
  console.log(`  ${colors.brightBlue('│')} ${colors.mutedGray('*')} ${colors.lightGray(command)}${suffix}`);
}

// File Read / Inspect Executions: indented slightly, prefixed with arrow
export function displayFileAction(action: string, filePath: string) {
  console.log(`  ${colors.brightBlue('│')}   ${colors.mutedGray('→')} ${colors.mutedGray(action + ' ' + filePath)}`);
}

// Current Action Status: ongoing action state
export function displayActionStatus(status: string) {
  console.log(`  ${colors.brightBlue('│')} ${colors.white('~ ' + status)}`);
}

// Agent Badge / Footer: hollow/filled blue square followed by LinuxForge and model
export function displayAgentBadge(model: string) {
  console.log(`  ${colors.brightBlue('▣')}  ${colors.white('LinuxForge')}  ${colors.mutedGray('·')}  ${colors.lightGray(model)}`);
  console.log();
}

// Goal Achieved: clean modern state with blue accent and agent badge
export async function displayGoalAchieved(message: string = 'Goal achieved successfully', model?: string): Promise<void> {
  console.log(`  ${colors.brightBlue('│')} ${colors.brightBlue('✔')}  ${colors.white(message)}\n`);
}

// Answer: plain narrative text followed by badge
export async function displayAnswer(answer: string, model?: string): Promise<void> {
  displayNarrative(answer);
  console.log();
}

/**
 * Active Input Panel
 */
export function renderActiveInputPanel(model: string) {
  console.log(`  ${colors.brightBlue('│')}`);
  console.log(`  ${colors.brightBlue('│')}  ${colors.boldWhite('█')}`);
  console.log(`  ${colors.brightBlue('│')}`);
  console.log(`  ${colors.brightBlue('LinuxForge')}  ${colors.mutedGray('·')}  ${colors.lightGray(model)}`);
  console.log();
}

/**
 * Status Bar (Actual commands available in LinuxForge)
 */
export function renderBottomStatusBar() {
  const shortcuts = [
    `${colors.boldWhite('/model')} ${colors.mutedGray('switch model')}`,
    `${colors.boldWhite('/key')} ${colors.mutedGray('api key')}`,
    `${colors.boldWhite('/clear')} ${colors.mutedGray('clear')}`,
    `${colors.boldWhite('/exit')} ${colors.mutedGray('exit')}`,
  ].join('   ');
  
  console.log(`  ${shortcuts}`);
  console.log();
}

// Agent Spinner: sleek blue dot spinner for modern TUI
export interface AgentSpinner {
  update: (text: string) => void;
  stop: (msg?: string) => void;
  succeed: (msg?: string) => void;
  fail: (msg?: string) => void;
}

export function startAgentSpinner(text: string = 'Forging...'): AgentSpinner {
  const spinner = ora({
    text: `${colors.white('~ ' + text)}`,
    prefixText: `  ${colors.brightBlue('│')}`,
    spinner: 'dots',
    color: 'blue'
  }).start();

  return {
    update: (newText: string) => {
      spinner.text = `${colors.white('~ ' + newText)}`;
    },
    stop: (msg?: string) => {
      spinner.stop();
      if (msg) console.log(`  ${colors.brightBlue('│')} ${colors.white('~ ' + msg)}`);
    },
    succeed: (msg?: string) => {
      spinner.stop();
      if (msg) console.log(`  ${colors.brightBlue('│')} ${colors.white('~ ' + msg)}`);
    },
    fail: (msg?: string) => {
      spinner.stop();
      console.log(`  ${colors.brightBlue('│')} ${colors.mutedGray('* Failed: ' + (msg || 'Error'))}`);
    }
  };
}

// Optional window header helper
export function renderWindowHeader(title: string) {
  const shortTitle = title.length > 50 ? title.substring(0, 47) + '...' : title;
  console.log();
  console.log(`  ${colors.brightBlue('📁')} ${colors.boldWhite('LinuxForge')} ${colors.mutedGray('|')} ${colors.lightGray(shortTitle)}`);
  console.log();
}

// ─────────────────────────────────────────────────────────────
// Backwards Compatibility Aliases
// ─────────────────────────────────────────────────────────────
export interface ForgingSpinner {
  stop: (msg?: string) => void;
  succeed: (msg?: string) => void;
  fail: (msg?: string) => void;
}

export function startForgingSpinner(): ForgingSpinner {
  const s = startAgentSpinner('Forging command...');
  return {
    stop: s.stop,
    succeed: s.succeed,
    fail: s.fail,
  };
}

export async function typewriterPrint(text: string): Promise<void> {
  displayNarrative(text);
}

export async function shimmerText(text: string, durationMs: number = 2000): Promise<void> {
  await displayGoalAchieved(text.replace(/^[✨\s]+/, ''));
}

export function displayCommandBlock(command: string) {
  displayCommandAction(command);
}
