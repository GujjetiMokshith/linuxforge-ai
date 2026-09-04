#!/usr/bin/env tsx

import { Command } from 'commander';
import { getSystemInfo } from './src/system.js';
import { renderDashboard, displayExplanation, displayCommand, createSpinner } from './src/ui.js';
import { AIAgent, verifyKey } from './src/ai.js';
import { executeCommand } from './src/executor.js';
import { readConfig, writeConfig, addActivity } from './src/config.js';
import { text, isCancel, cancel, note, spinner as clackSpinner } from '@clack/prompts';
import pc from 'picocolors';

const program = new Command();

program
  .name('linuxforge')
  .description('AI agent for making Linux easier')
  .action(async () => {
    try {
      let config = await readConfig();
      let apiKey = process.env.OPENROUTER_API_KEY || config.openRouterApiKey;

      console.clear();

      // Key Verification Loop
      while (true) {
        if (!apiKey) {
          const inputKey = await text({
            message: 'Please enter your OpenRouter API Key (sk-or-...):',
            placeholder: 'sk-or-...',
          });

          if (isCancel(inputKey)) {
            cancel('Operation cancelled.');
            process.exit(0);
          }
          apiKey = inputKey as string;
        }

        const s = clackSpinner();
        s.start('Verifying API Key...');
        const isValid = await verifyKey(apiKey);
        
        if (isValid) {
          s.stop('API Key verified successfully.');
          config.openRouterApiKey = apiKey;
          await writeConfig(config);
          break;
        } else {
          s.stop('Invalid API Key. Please try again.');
          apiKey = undefined; // Force prompt again
        }
      }

      // Render Dashboard
      const sysInfo = await getSystemInfo();
      console.clear();
      renderDashboard(sysInfo, config.activities);

      let agent = new AIAgent(apiKey!);
      
      // Set solid block cursor
      process.stdout.write('\x1b[2 q');

      // REPL Loop
      while (true) {
        const goal = await text({
          message: pc.white('> '),
          placeholder: pc.gray('Ask LinuxForge... (e.g. "install spotify")'),
        });

        if (isCancel(goal)) {
          // Reset cursor on exit
          process.stdout.write('\x1b[0 q');
          cancel('Goodbye!');
          process.exit(0);
        }

        const goalStr = goal as string;
        
        if (goalStr.trim() === '/exit') {
          process.stdout.write('\x1b[0 q');
          process.exit(0);
        }
        
        if (goalStr.trim() === '/clear') {
          console.clear();
          renderDashboard(sysInfo, config.activities);
          continue;
        }
        
        if (goalStr.trim() === '/key') {
          const inputKey = await text({
            message: 'Please enter your new OpenRouter API Key:',
            placeholder: 'sk-or-...',
          });
          
          if (!isCancel(inputKey) && inputKey) {
            const s = clackSpinner();
            s.start('Verifying new API Key...');
            const isValid = await verifyKey(inputKey as string);
            
            if (isValid) {
              s.stop('API Key updated and verified successfully.');
              apiKey = inputKey as string;
              config.openRouterApiKey = apiKey;
              await writeConfig(config);
              agent = new AIAgent(apiKey);
            } else {
              s.stop('Invalid API Key. Update failed.');
            }
          }
          continue;
        }

        if (!goalStr.trim()) continue;

        agent.startSession(sysInfo, goalStr);
        let currentMessage = `Please suggest the first step to achieve: ${goalStr}`;
        let isComplete = false;

        await addActivity(`Goal: ${goalStr}`);

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
            note(pc.green('Goal achieved successfully!'));
            break;
          }

          if (response.command) {
            displayCommand(response.command);
            
            const result = await executeCommand(response.command);
            
            if (result.cancelled) {
              note(pc.yellow('Operation cancelled by user.'));
              break;
            }

            await addActivity(`Ran: ${response.command}`);
            // Update activities in memory to immediately reflect on next clear
            config = await readConfig(); 

            let output = result.stdout;
            if (result.stderr) {
              output += `\n[STDERR]:\n${result.stderr}`;
            }

            const MAX_OUTPUT_LENGTH = 2000;
            if (output.length > MAX_OUTPUT_LENGTH) {
              output = output.substring(0, MAX_OUTPUT_LENGTH) + '\n...[TRUNCATED]';
            }

            currentMessage = `Command executed with exit code ${result.exitCode}.\nOutput:\n${output}\n\nPlease suggest the next step or indicate if the goal is complete.`;
          } else {
            currentMessage = "No command provided. What's next?";
          }
        }
      }
    } catch (error: any) {
      process.stdout.write('\x1b[0 q');
      console.error(pc.red(`\nAn error occurred: ${error.message}`));
      process.exit(1);
    }
  });

program.parse(process.argv);
