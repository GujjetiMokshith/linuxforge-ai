<div align="center">

# LinuxForge AI

**AI-powered terminal agent that turns plain English into executed Linux commands.**

[![npm version](https://img.shields.io/npm/v/linuxforge-ai.svg?style=flat-square&color=3B82F6)](https://www.npmjs.com/package/linuxforge-ai)
[![npm downloads](https://img.shields.io/npm/dt/linuxforge-ai.svg?style=flat-square&color=3B82F6)](https://www.npmjs.com/package/linuxforge-ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)

</div>

---

## Install

```bash
npm install -g linuxforge-ai
```

Then run it:

```bash
linuxforge
```

That's it. On first launch it will walk you through API key setup and model selection.

---

## Quick Start

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   $ npm i -g linuxforge-ai                              │
│   $ linuxforge                                          │
│                                                         │
│   │ Groq API Key required                               │
│     → Open browser to get a free API key                │
│     ⌨ I already have a key — let me paste it            │
│                                                         │
│   │ Paste your Groq API Key: gsk_...                    │
│   ✔ API Key verified successfully.                      │
│                                                         │
│   │ What do you want to do?                             │
│   > install htop and check system usage                 │
│                                                         │
│   I'll install htop and display your system stats.      │
│   * sudo apt install htop -y                            │
│   * htop --batch --max-iterations=1                     │
│   ✔ Goal achieved.                                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

> **Free API key** — LinuxForge runs on [Groq](https://console.groq.com/keys) (the fastest inference engine). Creating a key takes 30 seconds and costs nothing.

---

## Commands

Inside the LinuxForge REPL, type plain English or use slash commands:

```
  linuxforge                       launch the agent
```

| Command  | What it does                                |
|----------|---------------------------------------------|
| `hello`  | Just talk — ask anything in natural language |
| `/model` | Switch to a different Groq model             |
| `/key`   | Update your API key (with browser shortcut)  |
| `/clear` | Clear screen and redraw the dashboard        |
| `/exit`  | Quit                                         |

---

## How It Works

```
  You type a goal in plain English
        │
        ▼
  LinuxForge reasons about it
        │
        ▼
  Proposes a bash command
        │
        ▼
  You approve → it executes
        │
        ▼
  Reads output → loops until done
        │
        ▼
  ✔ Goal achieved
```

- **Goal → Command → Execute → Analyze → Repeat** until the task is complete.
- Destructive commands trigger a `⚠ DANGER` safety gate with a terminal bell before execution.
- Direct questions (e.g. *"what's the best distro?"*) get answered without running commands.

---

## Features

- **Agentic loop** — proposes commands, executes, reads output, iterates automatically
- **Safety gate** — destructive commands get flagged with `⚠ DANGER` before confirmation
- **Model picker** — choose from all available Groq models, switch anytime with `/model`
- **Browser shortcut** — `/key` opens `console.groq.com/keys` directly in your browser
- **Persistent config** — API key, model, and activity history saved to `~/.config/linuxforge/config.json`
- **Clean TUI** — monochromatic + bright blue accent, no clutter, no gimmicks

---

## Configuration

LinuxForge stores its config at:

```
~/.config/linuxforge/config.json
```

You can also set the key via environment variable:

```bash
export GROQ_API_KEY=gsk_your_key_here
```

---

## License

MIT — Created by [Gujjeti Mokshith](https://github.com/GujjetiMokshith)