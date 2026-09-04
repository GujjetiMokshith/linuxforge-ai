import * as os from 'os';
import * as fs from 'fs/promises';

export interface SystemInfo {
  platform: NodeJS.Platform;
  release: string;
  architecture: string;
  cpus: number;
  totalMemoryMB: number;
  freeMemoryMB: number;
  distribution?: string;
  distroVersion?: string;
}

export async function getSystemInfo(): Promise<SystemInfo> {
  const info: SystemInfo = {
    platform: os.platform(),
    release: os.release(),
    architecture: os.arch(),
    cpus: os.cpus().length,
    totalMemoryMB: Math.round(os.totalmem() / 1024 / 1024),
    freeMemoryMB: Math.round(os.freemem() / 1024 / 1024),
  };

  if (info.platform === 'linux') {
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
  }

  return info;
}

export function formatSystemInfoForAI(info: SystemInfo): string {
  return JSON.stringify(info, null, 2);
}
