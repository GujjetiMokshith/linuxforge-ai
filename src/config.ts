import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export interface Activity {
  timestamp: string; // ISO string
  action: string;
}

export interface Config {
  openRouterApiKey?: string;
  activities: Activity[];
}

function getConfigPath(): string {
  const home = os.homedir();
  return path.join(home, '.config', 'linuxforge', 'config.json');
}

export async function readConfig(): Promise<Config> {
  const configPath = getConfigPath();
  try {
    const data = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(data) as Config;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return { activities: [] };
    }
    throw error;
  }
}

export async function writeConfig(config: Config): Promise<void> {
  const configPath = getConfigPath();
  const dir = path.dirname(configPath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
}

export async function addActivity(action: string): Promise<void> {
  const config = await readConfig();
  config.activities.push({
    timestamp: new Date().toISOString(),
    action
  });
  // Keep only the last 10 activities
  if (config.activities.length > 10) {
    config.activities = config.activities.slice(-10);
  }
  await writeConfig(config);
}
