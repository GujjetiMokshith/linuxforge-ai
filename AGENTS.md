# LinuxForge AI — Agent & Architecture Guidelines

## Visual & UI Design System: Monochromatic & Bright Blue Aesthetic

Always enforce and maintain the **Monochromatic and Bright Blue (`#3B82F6`)** design system across all terminal interactions, dashboard views, spinners, headers, logs, and notifications.

### 1. Palette Specifications
- **Bright Blue Accent (`#3B82F6` / `\x1b[38;2;59;130;246m`)**:
  - Left vertical indicator bars (`│`).
  - Terminal dashboard outer borders (`╭┄`, `╰┄`, `┊`).
  - 8-bit ASCII alien mascot.
  - Section title accents (`Recent activity`, `Available Commands`, `LinuxForge`).
  - Agent badge square (`▣`) and completion checkmark (`✔`).
  - Active spinner dots (`ora` blue).
- **Pure / Bold White (`\x1b[38;2;255;255;255m` / `\x1b[1;37m`)**:
  - Primary narrative explanation and thoughts.
  - Section titles (`# <task-title>`).
  - User prompt text.
  - Slash command names (`/model`, `/key`, `/clear`, `/exit`).
- **Light Gray (`\x1b[38;2;220;220;220m`)**:
  - Executed command strings (`* <command>`).
  - Output stream lines.
- **Muted Gray (`\x1b[38;2;136;136;136m`)**:
  - Action markers (`*`, `→`, `~`).
  - Sub-action paths and file inspections (`→ Read <path>`).
  - Timestamps, model identifiers, and exit codes `(exit 0)`.
  - Slash command descriptions.
- **Dark Charcoal Border (`\x1b[38;2;45;45;52m`)**:
  - Internal dividers and horizontal rules.

### 2. Interaction Principles
- **No Gimmicky Delays**: Avoid character-by-character typewriter pauses. Explanations and thoughts render instantly and cleanly.
- **No Nonexistent Modes**: Never include synthetic placeholders like "Build" mode, "OpenCode Zen", or fake dollar costs. Display only authentic LinuxForge state and active Groq model names.
- **Consistent Left Accent**: Every task, prompt, and execution block uses the bright blue `│` border.
- **Safety Gate**: Destructive commands alert with terminal bell `\x07` and a high-contrast danger badge before user confirmation.
