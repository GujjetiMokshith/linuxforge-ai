#!/usr/bin/env node

import { Command } from 'commander';
import { getSystemInfo } from './src/system.js';
import {
  renderDashboard,
  renderTaskHeader,
  renderUserInputBlock,
  displayNarrative,
  displayThinking,
  displayCommandAction,
  displayFileAction,
  displayActionStatus,
  displayAgentBadge,
  displayGoalAchieved,
  displayAnswer,
  renderActiveInputPanel,
  renderBottomStatusBar,
  startAgentSpinner,
  colors
} from './src/ui.js';
import { AIAgent, verifyKey, fetchModels } from './src/ai.js';
import { executeCommand } from './src/executor.js';
import { readConfig, writeConfig, addActivity } from './src/config.js';
import { text, isCancel, cancel, confirm, select } from '@clack/prompts';
import pc from 'picocolors';

const program = new Command();

program
  .name('linuxforge')
  .description('AI agent for making Linux easier')
  .action(async () => {
    try {
      let config = await readConfig();
      let apiKey = process.env.GROQ_API_KEY || config.groqApiKey;

      console.clear();

      // ── Key Verification Loop ──
      while (true) {
        if (!apiKey) {
          const inputKey = await text({
            message: `  ${colors.brightBlue('│')} Please enter your Groq API Key:`,
            placeholder: 'gsk_...',
          });

          if (isCancel(inputKey)) {
            console.log(colors.mutedGray('\n  * Operation cancelled.'));
            process.exit(0);
          }
          apiKey = inputKey as string;
        }

        const s = startAgentSpinner('Verifying API Key...');
        const isValid = await verifyKey(apiKey);
        
        if (isValid) {
          s.succeed('API Key verified successfully.');
          config.groqApiKey = apiKey;
          await writeConfig(config);
          break;
        } else {
          s.fail('Invalid API Key. Please try again.');
          apiKey = undefined; // Force prompt again
        }
      }

      // ── Model Selection ──
      let selectedModel = config.selectedModel;
      
      if (!selectedModel) {
        const s = startAgentSpinner('Fetching available models from Groq...');
        const models = await fetchModels(apiKey!);
        s.succeed(`Found ${models.length} models.`);

        if (models.length === 0) {
          console.error(colors.mutedGray('  * No models available. Please check your API key permissions.'));
          process.exit(1);
        }

        const modelChoice = await select({
          message: `${colors.brightBlue('│')} Select an AI model:`,
          options: models.map(m => ({
            value: m.id,
            label: m.id,
            hint: m.owned_by,
          })),
        });

        if (isCancel(modelChoice)) {
          console.log(colors.mutedGray('\n  * Operation cancelled.'));
          process.exit(0);
        }

        selectedModel = modelChoice as string;
        config.selectedModel = selectedModel;
        await writeConfig(config);
        console.log(`\n  ${colors.brightBlue('▣')}  ${colors.white('Model set to:')} ${colors.brightBlue(selectedModel)}\n`);
      }

      // ── Render Dashboard ──
      const sysInfo = await getSystemInfo();
      console.clear();
      renderDashboard(sysInfo, config.activities, selectedModel);

      let agent = new AIAgent(apiKey!, selectedModel);
      
      // Set solid block cursor
      process.stdout.write('\x1b[2 q');

      // ── REPL Loop ──
      while (true) {
        const goal = await text({
          message: `${colors.brightBlue('LinuxForge')} ${colors.mutedGray('·')} ${colors.mutedGray(selectedModel!)}`,
          placeholder: 'Ask... (e.g. "install spotify")',
        });

        if (isCancel(goal)) {
          // Reset cursor on exit
          process.stdout.write('\x1b[0 q');
          console.log(colors.mutedGray('\n  * Goodbye!\n'));
          process.exit(0);
        }

        const goalStr = goal as string;
        
        if (goalStr.trim() === '/exit') {
          process.stdout.write('\x1b[0 q');
          process.exit(0);
        }
        
        if (goalStr.trim() === '/clear') {
          console.clear();
          renderDashboard(sysInfo, config.activities, selectedModel);
          continue;
        }
        
        if (goalStr.trim() === '/key') {
          const inputKey = await text({
            message: `  ${colors.brightBlue('│')} Please enter your new Groq API Key:`,
            placeholder: 'gsk_...',
          });
          
          if (!isCancel(inputKey) && inputKey) {
            const s = startAgentSpinner('Verifying new API Key...');
            const isValid = await verifyKey(inputKey as string);
            
            if (isValid) {
              s.succeed('API Key updated and verified successfully.');
              apiKey = inputKey as string;
              config.groqApiKey = apiKey;
              await writeConfig(config);
              agent = new AIAgent(apiKey, selectedModel!);
            } else {
              s.fail('Invalid API Key. Update failed.');
            }
          }
          continue;
        }

        if (goalStr.trim() === '/model') {
          const s = startAgentSpinner('Fetching available models from Groq...');
          const models = await fetchModels(apiKey!);
          s.succeed(`Found ${models.length} models.`);

          if (models.length === 0) {
            console.log(colors.mutedGray('  * No models available.'));
            continue;
          }

          const modelChoice = await select({
            message: `${colors.brightBlue('│')} Select an AI model:`,
            options: models.map(m => ({
              value: m.id,
              label: m.id,
              hint: m.owned_by,
            })),
          });

          if (!isCancel(modelChoice)) {
            selectedModel = modelChoice as string;
            config.selectedModel = selectedModel;
            await writeConfig(config);
            agent = new AIAgent(apiKey!, selectedModel);
            console.log(`\n  ${colors.brightBlue('▣')}  ${colors.white('Model switched to:')} ${colors.brightBlue(selectedModel)}\n`);
          }
          continue;
        }

        if (!goalStr.trim()) continue;

        // Removed redundant header echoing

        agent.startSession(sysInfo, goalStr);
        let currentMessage = `Please suggest the first step to achieve: ${goalStr}`;
        let isComplete = false;
        let stepCount = 0;

        await addActivity(`Goal: ${goalStr}`);

        while (!isComplete) {
          stepCount++;
          const spinnerStatus = stepCount === 1 ? 'Formulating plan...' : 'Analyzing output...';
          const s = startAgentSpinner(spinnerStatus);
          
          let response;
          try {
            response = await agent.sendMessage(currentMessage);
          } catch (error: any) {
            s.fail('Failed to get response from AI');
            console.error(pc.red(error.message));
            break;
          }
          s.stop();

          if (response.thinking) {
            await displayThinking(response.thinking);
          }

          if (response.explanation) {
            displayNarrative(response.explanation);
          }
          
          if (response.answer) {
            await displayAnswer(response.answer, selectedModel);
          }

          if (response.isComplete) {
            isComplete = true;
            await displayGoalAchieved('Goal achieved successfully');
            break;
          }

          if (response.command) {
            displayCommandAction(response.command);
            
            // Execution Gate
            let shouldRun;
            if (response.is_destructive) {
              process.stdout.write('\x07');
              console.log(`\n  \x1b[48;2;180;30;30m\x1b[37m ⚠ DANGER: This command modifies system files. \x1b[0m\n`);
              shouldRun = await confirm({
                message: `Execute this destructive command?`,
                initialValue: false,
              });
            } else {
              shouldRun = await confirm({
                message: `Execute this command?`,
                initialValue: true,
              });
            }

            if (!shouldRun || isCancel(shouldRun)) {
              console.log(`  ${colors.brightBlue('│')} ${colors.mutedGray('* Operation cancelled by user.')}`);
              break;
            }

            const result = await executeCommand(response.command);
            console.log(`  ${colors.brightBlue('│')} ${colors.mutedGray('(exit code ' + result.exitCode + ')')}`);

            await addActivity(`Ran: ${response.command}`);
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
