import pc from 'picocolors';
import { SystemInfo } from './system.js';
import { Activity } from './config.js';
import ora, { Ora } from 'ora';
import { highlight } from 'cli-highlight';
import * as readline from 'readline';

const grey = (text: string) => `\x1b[90m${text}\x1b[39m`;

function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

function pad(str: string, length: number, fill = ' '): string {
  const visualLen = stripAnsi(str).length;
  if (visualLen >= length) return str;
  return str + fill.repeat(length - visualLen);
}

function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function renderDashboard(info: SystemInfo, activities: Activity[]) {
  const TOTAL_WIDTH = 80;
  const LEFT_WIDTH = 34;
  const RIGHT_WIDTH = 43; // 80 - 34 - 3 (borders)
  
  const title = ` LinuxForge v2.0.0 `;
  const topBorder = grey(`╭╌╌${title}${'╌'.repeat(TOTAL_WIDTH - 5 - title.length)}╮`);
  const bottomBorder = grey(`╰${'╌'.repeat(TOTAL_WIDTH - 2)}╯`);

  const username = process.env.USER || 'User';
  
  const leftLines = [
    `  Welcome back ${username}!`,
    `  OS: ${info.distribution || info.platform} ${info.distroVersion || info.release} | ${info.architecture}`,
    `  Model: OpenRouter`, // Assuming standard for now
    `  Dir: ${process.cwd()}`
  ];

  let rightLines = [
    ` Recent Activity`
  ];

  const recentActivities = [...activities].reverse().slice(0, 2);
  if (recentActivities.length === 0) {
    rightLines.push(grey('  No recent activity'));
    rightLines.push('');
  } else {
    for (let i = 0; i < 2; i++) {
      if (recentActivities[i]) {
        const timeLog = grey(pad(timeAgo(recentActivities[i].timestamp), 7));
        let actionStr = recentActivities[i].action;
        if (actionStr.length > RIGHT_WIDTH - 15) {
          actionStr = actionStr.substring(0, RIGHT_WIDTH - 18) + '...';
        }
        rightLines.push(` ${timeLog} ${actionStr}`);
      } else {
        rightLines.push('');
      }
    }
  }

  rightLines.push(grey('  ... /help for commands'));

  console.log();
  console.log(topBorder);
  
  const maxLines = Math.max(leftLines.length, rightLines.length);
  for (let i = 0; i < maxLines; i++) {
    const l = pad(leftLines[i] || '', LEFT_WIDTH);
    const r = pad(rightLines[i] || '', RIGHT_WIDTH);
    console.log(grey('┆') + l + grey(' ┆ ') + r + grey('┆'));
  }
  
  console.log(bottomBorder);
  console.log();
}

export function startForgingSpinner(): Ora {
  // Silent minimal spinner that completely disappears on stop
  return ora({
    text: pc.dim('Thinking...'),
    spinner: 'dots',
    color: 'gray'
  }).start();
}

export async function typewriterPrint(text: string): Promise<void> {
  const lines = text.split('\n');
  for (let l = 0; l < lines.length; l++) {
    process.stdout.write('  ');
    const line = lines[l];
    for (let i = 0; i < line.length; i++) {
      process.stdout.write(pc.white(line[i]));
      const delay = Math.floor(Math.random() * 15) + 5; // Fast typing
      await new Promise(r => setTimeout(r, delay));
    }
    console.log();
  }
  console.log(); // extra newline for padding
}

export async function displayAnswer(answer: string): Promise<void> {
  // Use same typewriter for answer, no noisy headers
  await typewriterPrint(answer);
}

export function displayCommandBlock(command: string) {
  const highlighted = highlight(command, { language: 'bash', ignoreIllegals: true });
  console.log(`  ${pc.dim('$')} ${highlighted}\n`);
}

export function inlineConfirm(message: string, defaultYes = true): Promise<boolean> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const prompt = defaultYes ? '[Y/n]' : '[y/N]';
    rl.question(`  ${message} ${pc.dim(prompt)} `, (answer) => {
      rl.close();
      const cleaned = answer.trim().toLowerCase();
      if (cleaned === '') {
        resolve(defaultYes);
      } else {
        resolve(cleaned === 'y' || cleaned === 'yes');
      }
    });
  });
}
