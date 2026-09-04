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
  return new Promise((resolve) => {
    // We use bash -c to support pipes and shell builtins
    const child = spawn('bash', ['-c', command], {
      stdio: ['inherit', 'pipe', 'pipe'],
      env: process.env
    });

    let stdout = '';
    let stderr = '';
    
    // To make output stream nicely in the UI, we'll prefix lines
    let stdoutBuffer = '';
    let stderrBuffer = '';

    child.stdout?.on('data', (data) => {
      const chunk = data.toString();
      stdout += chunk;
      
      // Stream with border
      const lines = chunk.split('\n');
      for (let i = 0; i < lines.length; i++) {
        stdoutBuffer += lines[i];
        if (i < lines.length - 1) {
          process.stdout.write(pc.dim('  │ ') + pc.dim(stdoutBuffer) + '\n');
          stdoutBuffer = '';
        }
      }
    });

    child.stderr?.on('data', (data) => {
      const chunk = data.toString();
      stderr += chunk;
      
      const lines = chunk.split('\n');
      for (let i = 0; i < lines.length; i++) {
        stderrBuffer += lines[i];
        if (i < lines.length - 1) {
          process.stderr.write(pc.red('  │ ') + pc.red(stderrBuffer) + '\n');
          stderrBuffer = '';
        }
      }
    });

    child.on('close', (code) => {
      // Flush remaining buffers
      if (stdoutBuffer) process.stdout.write(pc.dim('  │ ') + pc.dim(stdoutBuffer) + '\n');
      if (stderrBuffer) process.stderr.write(pc.red('  │ ') + pc.red(stderrBuffer) + '\n');
      
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
