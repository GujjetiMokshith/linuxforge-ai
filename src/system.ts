import * as os from 'os';
import * as fs from 'fs/promises';
import { execSync } from 'child_process';

export interface SystemInfo {
  platform: NodeJS.Platform;
  release: string;
  architecture: string;
  cpus: number;
  totalMemoryMB: number;
  freeMemoryMB: number;
  shell: string;
  distribution?: string;
  distroVersion?: string;
  username?: string;
}

export async function getSystemInfo(): Promise<SystemInfo> {
  const platform = os.platform();
  
  const info: SystemInfo = {
    platform,
    release: os.release(),
    architecture: os.arch(),
    cpus: os.cpus().length,
    totalMemoryMB: Math.round(os.totalmem() / 1024 / 1024),
    freeMemoryMB: Math.round(os.freemem() / 1024 / 1024),
    shell: platform === 'win32' ? 'PowerShell' : 'bash',
    username: process.env.USER || os.userInfo().username,
  };

  if (platform === 'linux') {
    try {
      const osRelease = await fs.readFile('/etc/os-release', 'utf-8');
      const lines = osRelease.split('\n');
      for (const line of lines) {
        if (line.startsWith('PRETTY_NAME=')) {
          info.distribution = line.split('=')[1].replace(/"/g, '').trim();
        } else if (line.startsWith('VERSION_ID=')) {
          info.distroVersion = line.split('=')[1].replace(/"/g, '').trim();
        }
      }
    } catch (error) {
      // Ignore if /etc/os-release doesn't exist or is unreadable
    }
  } else if (platform === 'win32') {
    try {
      const caption = execSync('powershell -NoProfile -Command "(Get-CimInstance Win32_OperatingSystem).Caption"', { encoding: 'utf-8' }).trim();
      if (caption) {
        info.distribution = caption;
      }
    } catch (error) {
      info.distribution = 'Windows';
    }
  }

  return info;
}
