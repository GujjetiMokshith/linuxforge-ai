#!/usr/bin/env tsx

import { Command } from 'commander';
import { getSystemInfo } from './src/system.js';
import { displayHeader, displayExplanation, displayCommand, finishSession, createSpinner } from './src/ui.js';
import { AIAgent } from './src/ai.js';
import { executeCommand } from './src/executor.js';
import { isCancel, cancel } from '@clack/prompts';
import pc from 'picocolors';

const program = new Command();

program
  .name('linuxforge')
  .description('AI agent for making Linux easier')
  .argument('<goal>', 'The goal you want to achieve (e.g. "install spotify")')
  .option('-k, --key <key>', 'OpenRouter API Key (can also be set via OPENROUTER_API_KEY env var)')
  .action(async (goal: string, options: { key?: string }) => {
    const apiKey = options.key || process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      console.error(pc.red('Error: OpenRouter API Key is required. Set OPENROUTER_API_KEY environment variable or pass --key.'));
      process.exit(1);
    }

    try {
      const sysInfo = await getSystemInfo();
      displayHeader(sysInfo);

      const agent = new AIAgent(apiKey);
      agent.startSession(sysInfo, goal);

      let currentMessage = `Please suggest the first step to achieve: ${goal}`;
      let isComplete = false;

      while (!isComplete) {
        const s = createSpinner();
        s.start('Thinking...');
        
        let response;
        try {
          response = await agent.sendMessage(currentMessage);
        } catch (error: any) {
          s.stop('Failed to get response from AI');
          console.error(pc.red(error.message));
          break;
        }
        s.stop('Response received');

        if (response.explanation) {
          displayExplanation(response.explanation);
        }

        if (response.isComplete) {
          isComplete = true;
          finishSession('Goal achieved successfully!');
          break;
        }

        if (response.command) {
          displayCommand(response.command);
          
          const result = await executeCommand(response.command);
          
          if (result.cancelled) {
            cancel('Operation cancelled by user.');
            process.exit(0);
          }

          let output = result.stdout;
          if (result.stderr) {
            output += `\n[STDERR]:\n${result.stderr}`;
          }

          // Truncate output if it's too long
          const MAX_OUTPUT_LENGTH = 2000;
          if (output.length > MAX_OUTPUT_LENGTH) {
            output = output.substring(0, MAX_OUTPUT_LENGTH) + '\n...[TRUNCATED]';
          }

          currentMessage = `Command executed with exit code ${result.exitCode}.\nOutput:\n${output}\n\nPlease suggest the next step or indicate if the goal is complete.`;
        } else {
          // If no command but not complete, just ask what's next
          currentMessage = "No command provided. What's next?";
        }
      }
    } catch (error: any) {
      console.error(pc.red(`\nAn error occurred: ${error.message}`));
      process.exit(1);
    }
  });

program.parse(process.argv);
