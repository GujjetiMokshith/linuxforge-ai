import pc from 'picocolors';
import { SystemInfo } from './system.js';
import { Activity } from './config.js';
import ora from 'ora';
import gradient from 'gradient-string';
import { highlight } from 'cli-highlight';

export function renderDashboard(info: SystemInfo, activities: Activity[], model?: string) {
  console.log();
  console.log(gradient(['#ff512f', '#dd2476'])(' LinuxForge AI '));
  console.log(pc.gray(' ─────────────────────────────────────'));
  
  const osStr = `${info.distribution || info.platform} ${info.distroVersion || info.release}`;
  const modelStr = model || 'not set';
  
  console.log(` ${pc.bold('OS:')} ${pc.cyan(osStr)}  ${pc.bold('Arch:')} ${pc.cyan(info.architecture)}  ${pc.bold('CPUs:')} ${pc.cyan(info.cpus)}`);
  console.log(` ${pc.bold('Model:')} ${pc.cyan(modelStr)}`);

  if (activities && activities.length > 0) {
    console.log();
    console.log(` ${pc.bold('Recent Activity:')}`);
    const recentActivities = [...activities].reverse().slice(0, 3);
    for (const a of recentActivities) {
      let actionStr = a.action;
      if (actionStr.length > 60) actionStr = actionStr.substring(0, 57) + '...';
      console.log(` ${pc.gray('•')} ${actionStr}`);
    }
  }

  console.log();
  console.log(` ${pc.bold('Commands:')} /key, /model, /clear, /exit`);
  console.log(pc.gray(' ─────────────────────────────────────'));
  console.log();
}

export interface ForgingSpinner {
  stop: (msg?: string) => void;
  succeed: (msg?: string) => void;
  fail: (msg?: string) => void;
}

export function startSpinner(text: string = 'Thinking...'): ForgingSpinner {
  const spinner = ora({
    text: pc.dim(text),
    color: 'cyan',
    spinner: 'dots'
  }).start();

  return {
    stop: (msg?: string) => {
      if (msg) spinner.stopAndPersist({ symbol: pc.gray('■'), text: pc.dim(msg) });
      else spinner.stop();
    },
    succeed: (msg?: string) => {
      spinner.succeed(pc.dim(msg || 'Success'));
    },
    fail: (msg?: string) => {
      spinner.fail(pc.red(msg || 'Failed'));
    }
  };
}

export async function shimmerText(text: string, durationMs: number = 0) {
  console.log(pc.green('✨ ' + text));
}

export async function displayThinking(thinking: string): Promise<void> {
  // Usually thinking is internal, we can display it dim
  const lines = thinking.split('\n');
  console.log(pc.dim('  ┌─ Thinking'));
  for (const line of lines) {
    console.log(pc.dim('  │ ' + line));
  }
  console.log(pc.dim('  └─\n'));
}

export async function typewriterPrint(text: string): Promise<void> {
  // Display text directly (instant)
  // Simple markdown-like rendering: bolding text between **, etc. is hard without a library,
  // but we can just print it nicely.
  console.log(pc.dim('Explanation:'));
  console.log(text + '\n');
}

export async function displayAnswer(answer: string): Promise<void> {
  console.log(pc.bold(pc.green('Answer:')));
  console.log(answer + '\n');
}

export function displayCommandBlock(command: string) {
  const lang = process.platform === 'win32' ? 'powershell' : 'bash';
  const highlighted = highlight(command, { language: lang, ignoreIllegals: true });
  
  console.log(pc.cyan('  ▶ Command to execute:'));
  const lines = highlighted.split('\n');
  for (const line of lines) {
    console.log('    ' + line);
  }
  console.log();
}
