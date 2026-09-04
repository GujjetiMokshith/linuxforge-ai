import pc from 'picocolors';
import { spinner as clackSpinner, note } from '@clack/prompts';
import { SystemInfo } from './system.js';
import { Activity } from './config.js';

// Custom RGB colors
const orange = (text: string) => `\x1b[38;2;255;165;0m${text}\x1b[39m`;
const white = (text: string) => `\x1b[37m${text}\x1b[39m`;
const grey = (text: string) => `\x1b[90m${text}\x1b[39m`;

// Helper to strip ANSI codes to get visual length
function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

// Helper to pad strings visually
function pad(str: string, length: number, fill = ' '): string {
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

export function renderDashboard(info: SystemInfo, activities: Activity[]) {
  const TOTAL_WIDTH = 80;
  const LEFT_WIDTH = 34;
  const RIGHT_WIDTH = 43; // 80 - 34 - 3 (borders)
  
  // Dashboard Title
  const title = ` linuxforge v2.0.0 `;
  const topBorder = orange(`╭${'┄'.repeat(3)}${title}${'┄'.repeat(TOTAL_WIDTH - 5 - title.length)}╮`);
  const bottomBorder = orange(`╰${'┄'.repeat(TOTAL_WIDTH - 2)}╯`);

  // Left Column Content
  const username = process.env.USER || 'User';
  const greeting = orange(`Welcome back ${username}!`);
  
  // 8-bit Alien Graphic (5 lines) in orange
  const alien = [
    orange('  ▄▄████▄▄  '),
    orange('▄██████████▄'),
    orange('██▄██████▄██'),
    orange(' ▄▀ ▄▄▄▄ ▀▄ '),
    orange('▀   ▀  ▀   ▀')
  ];

  const now = new Date();
  const timeStr = orange(`Time: ${now.toLocaleTimeString()}`);
  const osStr = orange(`OS: ${info.distribution || info.platform} ${info.distroVersion || info.release}`);
  const archStr = orange(`Arch: ${info.architecture} | ${info.cpus} CPUs`);

  const leftLines = [
    '',
    pad(`  ${greeting}`, LEFT_WIDTH),
    '',
    ...alien.map(line => pad(`         ${line}`, LEFT_WIDTH)),
    '',
    pad(`  ${timeStr}`, LEFT_WIDTH),
    pad(`  ${osStr}`, LEFT_WIDTH),
    pad(`  ${archStr}`, LEFT_WIDTH),
    ''
  ];

  // Right Column Content
  let rightLines = [
    pad(` ${orange('Recent activity')}`, RIGHT_WIDTH),
    ''
  ];

  const recentActivities = [...activities].reverse().slice(0, 3);
  if (recentActivities.length === 0) {
    rightLines.push(pad(`   ${grey('No recent activity')}`, RIGHT_WIDTH));
    rightLines.push(pad('', RIGHT_WIDTH));
    rightLines.push(pad('', RIGHT_WIDTH));
  } else {
    for (let i = 0; i < 3; i++) {
      if (recentActivities[i]) {
        const timeLog = grey(pad(timeAgo(recentActivities[i].timestamp), 8));
        let actionStr = recentActivities[i].action;
        if (actionStr.length > RIGHT_WIDTH - 15) {
          actionStr = actionStr.substring(0, RIGHT_WIDTH - 18) + '...';
        }
        rightLines.push(pad(`   ${timeLog} ${white(actionStr)}`, RIGHT_WIDTH));
      } else {
        rightLines.push(pad('', RIGHT_WIDTH));
      }
    }
  }

  rightLines.push(pad('', RIGHT_WIDTH));
  rightLines.push(pad(` ${orange('┄'.repeat(RIGHT_WIDTH - 2))}`, RIGHT_WIDTH));
  rightLines.push(pad(` ${orange('Available Commands')}`, RIGHT_WIDTH));
  rightLines.push('');
  rightLines.push(pad(`   ${white('/key')}    ${grey('Update OpenRouter API Key')}`, RIGHT_WIDTH));
  rightLines.push(pad(`   ${white('/clear')}  ${grey('Clear terminal history')}`, RIGHT_WIDTH));
  rightLines.push(pad(`   ${white('/exit')}   ${grey('Exit LinuxForge')}`, RIGHT_WIDTH));
  rightLines.push(pad('', RIGHT_WIDTH));

  // Merge Columns
  console.log();
  console.log(topBorder);
  
  const maxLines = Math.max(leftLines.length, rightLines.length);
  for (let i = 0; i < maxLines; i++) {
    const l = leftLines[i] || pad('', LEFT_WIDTH);
    const r = rightLines[i] || pad('', RIGHT_WIDTH);
    // Middle separator using dotted line
    console.log(orange('┊') + l + ' ' + r + orange('┊'));
  }
  
  console.log(bottomBorder);
  console.log(grey('─'.repeat(TOTAL_WIDTH)));
}

export function displayExplanation(explanation: string) {
  note(pc.italic(white(explanation)), 'Explanation');
}

export function displayCommand(command: string) {
  console.log(`\n  ${pc.bold(pc.green('$'))} ${pc.bold(white(command))}\n`);
}

export function createSpinner() {
  return clackSpinner();
}
