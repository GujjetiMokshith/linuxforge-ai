import boxen from 'boxen';
import pc from 'picocolors';
import { intro, outro, spinner as clackSpinner, note } from '@clack/prompts';
import { SystemInfo } from './system.js';

export function displayHeader(info: SystemInfo) {
  const osName = info.distribution || info.platform;
  const osVersion = info.distroVersion || info.release;
  
  const content = [
    pc.bold(pc.cyan('LinuxForge AI')),
    pc.gray('-----------------------'),
    `${pc.bold('OS:')}   ${osName} ${osVersion}`,
    `${pc.bold('Arch:')} ${info.architecture}`,
    `${pc.bold('CPU:')}  ${info.cpus} cores`,
    `${pc.bold('RAM:')}  ${info.totalMemoryMB} MB (${info.freeMemoryMB} MB free)`
  ].join('\n');

  console.log(
    boxen(content, {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
    })
  );
  
  intro(pc.bgCyan(pc.black(' LinuxForge ')));
}

export function displayExplanation(explanation: string) {
  note(pc.italic(pc.white(explanation)), 'Explanation');
}

export function displayCommand(command: string) {
  console.log(`\n  ${pc.bold(pc.green('$'))} ${pc.bold(pc.white(command))}\n`);
}

export function finishSession(message: string = 'Done!') {
  outro(pc.green(message));
}

export function createSpinner() {
  return clackSpinner();
}
