# StackPilot

**A portable ops cockpit for the terminal: system monitor and process manager in one binary, for macOS and Linux.**

Made by **Piyush Yadav** ([@piyushy111](https://github.com/piyushy111))

[![CI](https://github.com/piyushy111/StackPilot/actions/workflows/ci.yml/badge.svg)](https://github.com/piyushy111/StackPilot/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Status: active](https://img.shields.io/badge/status-active-brightgreen.svg)

StackPilot shows what is using your machine, the way htop and btop do. It also starts and supervises your
project's processes, the way pm2 or foreman do. Because it does both, it can tell you that *your*
`api` is the process holding 1.2 GB and climbing, and which port it listens on.

```text
 StackPilot    myapp  ◌ 2/4 ready                                                mbp · darwin arm64
┌─ cpu ────────────────────────────────────────────────────────────── load 2.4 2.1 1.9 · up 3d 4h ─┐
│ ⠀⠀⠀⠀⠀⠀⠀⣴⣶⣶⣶⣦⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣶⣶⣶⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣤⣶⣶⣶ C0  ━━━───────  34%  C5  ━━────────  15%   │
│ ⠀⠀⠀⠀⢀⣠⣾⣿⣿⣿⣿⣿⣿⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⣿⣿⣿⣿⣿⣷⣦⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣿⣿⣿⣿⣿ C1  ━━━━━━━───  71%  C6  ━━━━━━────  63%   │
│ ⠀⣠⣴⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣄⠀⠀⠀⠀⠀⠀⠀⣴⣿⣿⣿⣿⣿⣿ C2  ━━────────  22%  C7  ━━━───────  27%   │
│ ⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣄⣀⠀⠀⠀⠀⠀⢀⣠⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣄⠀⠀⢀⣠⣾⣿⣿⣿⣿⣿⣿⣿ C3  ━─────────   9%                        │
│ CPU 95%                                               C4  ━━━━━─────  48%                        │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
┌─ mem ────────────── 16.0 GB ─┐┌─ logs · api ───────────────────────────── following ● ─ 5 lines ─┐
│ Used  ━━━━━━━━──────  9.6 GB ││  19:06:41 api listening on http://localhost:3000                 │
│ Cache ━━━───────────  3.1 GB ││  19:06:42 GET /health 200 2ms                                    │
│ Free  ━━━━━━────────  6.4 GB ││ ▎19:06:43 (node:812) DeprecationWarning: punycode                │
│ Swap  ━━────────────  256 MB ││  19:06:44 POST /login 401 9ms                                    │
└──────────────────────────────┘│  19:06:45 GET /users/42 200 11ms                                 │
┌─ stack ──────────────── 2/4 ─┐│                                                                  │
│  ● db     ready :5432        ││                                                                  │
│ ▌● api    ready :3000   12%  ││                                                                  │
│  ↻ worker retry 2 in 4s      ││                                                                  │
│  ⊘ cron   blocked by worker  ││                                                                  │
└─ s start ─ x stop ───────────┘│                                                                  │
┌─ ports ────────────────── 2 ─┐│                                                                  │
│ :3000  node  ◆api 127.0.0.1  ││                                                                  │
│ :5432  postgres   *          ││                                                                  │
│                              ││                                                                  │
│                              ││                                                                  │
└──────────────────────────────┘└─ f follow ─ / search ─ v all / one ─ PgUp older ─ PgDn newer ────┘
```

## Features

- **See the machine.** CPU history and per-core meters, memory and swap, listening ports with their
  owners, and a process table or tree with filter, sort, details, kill and renice.
- **Run the stack.**
  - Starts the processes in `stackpilot.json` (or a Procfile, or package.json scripts) in dependency order.
  - Waits for each to be ready (a port, an HTTP check or a log line) and restarts crashes with backoff.
  - Stops everything cleanly, in reverse order.
- **Follow it.** A live logs panel per process or interleaved for all of them, with pause and search.
  Logs are saved to `.stackpilot/logs/`, and each managed process shows the CPU and memory of its
  whole process tree.
- **Stay safe.** Every kill and renice goes through confirmations enforced in the engine: one key for
  your own processes, the exact name typed for system processes, and StackPilot itself and PID 1 are
  blocked. After a crash, StackPilot finds the processes it left running and offers to stop them.
- **Anywhere.** A single standalone binary, with nothing else to install on the machine. It works over SSH, on an
  EC2 box or a Raspberry Pi, and in 16-colour and no-colour terminals.

## Install

macOS and Linux, on arm64 and x64. Either way you get one standalone binary; nothing else is needed on
the machine.

```sh
npm install -g stackpilot-tui
```

```sh
curl -fsSL https://raw.githubusercontent.com/piyushy111/StackPilot/main/packaging/install.sh | sh
```

The npm package runs no install scripts: npm picks the binary for your platform through an optional
dependency. The installer puts `stackpilot` in `~/.local/bin` (set `STACKPILOT_INSTALL_DIR` to change it)
and refuses an archive whose SHA-256 doesn't match the release's `SHA256SUMS`. You can also download an
archive from the [releases page](https://github.com/piyushy111/StackPilot/releases/latest).

Every release is built in GitHub Actions from a tagged commit, with provenance you can check:

```sh
npm audit signatures
gh attestation verify stackpilot-v0.1.0-darwin-arm64.tar.gz --repo piyushy111/StackPilot
```

Then run `stackpilot` for the dashboard, or `stackpilot pm` in a project folder. `stackpilot doctor` checks the
machine if something looks wrong.

### From source

```sh
git clone https://github.com/piyushy111/StackPilot.git && cd StackPilot
./setup.sh                 # macOS, Linux, Windows WSL2   ·   PowerShell: .\setup.ps1
npm run demo               # the process manager on a demo stack
```

`setup.sh` checks and installs what's needed (Bun, dependencies, git hooks, a `stackpilot` command
linked to your checkout) and verifies everything. `./setup.sh --check` only reports. On Windows, the
full setup runs inside WSL2; Git Bash covers editing, lint and the type check.

## Commands

### Installed

| Command | What it does |
|---|---|
| `stackpilot` | The dashboard. This project's stack is shown idle; `a` starts it all, `s` starts one process |
| `stackpilot pm` | Starts this project's stack and opens the dashboard on it (`--only api,web`, `--config path`) |
| `stackpilot sm` | The system monitor only; never reads or runs a config |
| `stackpilot init` | Writes `stackpilot.json` from a Procfile, package.json scripts or a command you type |
| `stackpilot import pm2 [file]` | Converts a running pm2 or an ecosystem file into `stackpilot.json` |
| `stackpilot doctor` | Checks what StackPilot needs here and says how to fix what is missing |
| `stackpilot update` | Updates a standalone install to the latest release (checksum-verified) |

`-pm`, `--pm`, `-sm` and `--sm` also work as aliases.

### While developing (from a source checkout)

| What | With npm | With the `stackpilot` command (after `./setup.sh`) |
|---|---|---|
| The dashboard | `npm start` | `stackpilot` |
| The process manager for the project in this folder | `npm run pm` | `stackpilot pm` |
| The process manager on the demo stack | `npm run demo` | `stackpilot pm --config tests/fixtures/stack/stackpilot.json` |
| The system monitor only | `npm run sm` | `stackpilot sm` |
| Check the machine and the config | `npm run doctor` | `stackpilot doctor` |
| Write a `stackpilot.json` | `npm start -- init` | `stackpilot init` |
| The dashboard with React's development build | `npm run dev` | — |

**npm keeps the flags that come before `--` for itself.** `npm start --pm` opens the plain dashboard,
because npm took `--pm`. Put StackPilot's flags after `--`: `npm start -- pm --config stackpilot.json` or
`npm run pm -- --only api,web`. The `stackpilot` command has no such catch.

### What the process manager looks like

The process manager is part of the dashboard, not a separate screen. `stackpilot pm` opens the dashboard
with the stack starting and the **managed box** (left column) focused. While it has focus, the big
panel shows that process's **logs** instead of the process table. Keys:
- `↑↓` pick a process; `s` start, `x` stop, `r` restart, `a` start all.
- `v` shows every process's logs interleaved; `/` searches.
- `Tab` moves on to ports, then back to the process table.

Press `?` anywhere for every key.

## A stack

```json
{
  "version": 1,
  "processes": {
    "db":  { "cmd": "docker run --rm -p 5432:5432 -e POSTGRES_PASSWORD=dev postgres:16", "ready": { "port": 5432 } },
    "api": { "cmd": "npm run dev", "dependsOn": ["db"], "ready": { "http": "http://localhost:3000/health" } },
    "worker": { "cmd": "node worker.js", "dependsOn": ["api"], "restart": "always" }
  }
}
```

Every option, with its default, is in the [configuration reference](docs/CONFIG.md). A Procfile or
package.json scripts work without any config. To keep a stack running after you log out of a server,
run `stackpilot pm` inside `tmux`.

## Platforms

| | macOS 13+ (Bun's minimum) | Linux (glibc) |
|---|---|---|
| arm64 | ✓ Apple Silicon | ✓ AWS Graviton, Raspberry Pi (64-bit OS) |
| x64 | ✓ Intel | ✓ |
| Sampling | libproc through Bun's FFI; other users' processes every 5 s (macOS limits this to root) | `/proc` |

StackPilot's own footprint is about 3% of one core and 80 MB for the full dashboard.

## Documentation

| Document | What it covers |
|---|---|
| [docs/CONFIG.md](docs/CONFIG.md) | Every `stackpilot.json` option |
| [docs/PRD.md](docs/PRD.md) | What StackPilot is for, and the product decisions |
| [docs/UI_SPEC.md](docs/UI_SPEC.md) | Layout, keys, colours and every screen state |
| [docs/BUILD_PLAN.md](docs/BUILD_PLAN.md) | Architecture, the engine/UI contract, performance, distribution |
| [docs/DEV.md](docs/DEV.md) | Development commands, Linux testing on a Mac, measuring |
| [RELEASING.md](RELEASING.md) | How a release is built, rehearsed, approved and verified |

## Contributing

Issues and pull requests are welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md). Report security
problems privately, as described in [SECURITY.md](SECURITY.md).

## Author & Licence

Created by **Piyush Yadav** ([@piyushy111](https://github.com/piyushy111)).

[MIT](LICENSE) © 2026 Piyush Yadav
