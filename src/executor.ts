import { spawn } from 'child_process';
import { confirm } from '@clack/prompts';
import pc from 'picocolors';

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  cancelled: boolean;
}

export async function executeCommand(command: string): Promise<CommandResult> {
  const shouldRun = await confirm({
    message: `Do you want to run this command?`,
    initialValue: true,
  });

  if (!shouldRun || typeof shouldRun === 'symbol') {
    return {
      stdout: '',
      stderr: '',
      exitCode: null,
      cancelled: true
    };
  }

  return new Promise((resolve) => {
    // We use bash -c to support pipes and shell builtins
    const child = spawn('bash', ['-c', command], {
      stdio: ['inherit', 'pipe', 'pipe'],
      env: process.env
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      process.stdout.write(pc.dim(data.toString()));
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      process.stderr.write(pc.red(data.toString()));
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({
        stdout,
        stderr,
        exitCode: code,
        cancelled: false
      });
    });
    
    child.on('error', (err) => {
      resolve({
        stdout,
        stderr: err.message,
        exitCode: -1,
        cancelled: false
      });
    });
  });
}
