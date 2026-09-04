<div align="center">
  <h1>LinuxForge AI 🚀</h1>
  <p><strong>Your Intelligent, Kinetic Terminal Assistant for Linux</strong></p>
  
  [![npm version](https://img.shields.io/npm/v/linuxforge-ai.svg?style=flat-square)](https://www.npmjs.com/package/linuxforge-ai)
  [![npm downloads](https://img.shields.io/npm/dt/linuxforge-ai.svg?style=flat-square)](https://www.npmjs.com/package/linuxforge-ai)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
</div>

LinuxForge is an expert AI assistant framework designed specifically to make managing Linux easier. It operates directly in your terminal, transforming natural language goals into precise bash commands, executing them, and automatically analyzing the output in a continuous loop until your goal is fully achieved.

Featuring a gorgeous, kinetic Terminal User Interface (TUI) powered by OpenRouter and the MiniMax-M3 model.

---

## ✨ Features

- **Continuous REPL Loop**: Talk to LinuxForge interactively. It proposes commands, runs them, and reads the output automatically.
- **Kinetic "Magical" TUI**: 
  - 🔄 **Multi-stage Forging Spinner**: Watch the AI "Smelt Logic" and "Forge Commands" in real-time.
  - ⌨️ **Typewriter Stream Reveal**: AI explanations stream organically character-by-character.
  - 🌈 **Syntax Highlighting**: Command blocks are beautifully syntax-highlighted and visually isolated.
  - 🎇 **Pulse Animations**: Shimmering terminal animations celebrate your completed goals.
- **Safe Execution Gate**: The AI actively evaluates commands. If a command is flagged as destructive (e.g., modifies system files, deletes data), the interface alerts you with a terminal bell and a pulsing red `⚠ DANGER` warning.
- **Conversational Intelligence**: Ask it direct questions (e.g. "what is the best Linux distro?") and it will answer cleanly without proposing shell commands.
- **State Persistence**: Your API keys and activity history are saved locally to `~/.config/linuxforge/config.json`.

## 📦 Installation

Install globally via npm:

```bash
npm install -g linuxforge-ai
```

## 🚀 Usage

Start the REPL loop simply by running:

```bash
linuxforge
```

### Commands inside LinuxForge:
- **Natural Language**: Just type what you want to do (e.g. `install spotify`, `update my packages`, `what is 5+5`).
- `/key`: Update your OpenRouter API Key on the fly.
- `/clear`: Clear the terminal and redraw the dashboard.
- `/exit`: Exit the application and restore your terminal cursor.

## 🛠️ Configuration
On your first run, LinuxForge will prompt you for an **OpenRouter API Key**. It automatically validates the key and saves it locally.

## 📝 License
MIT License. Created by Gujjeti Mokshith.