# stackpilot-tui

**htop and pm2 in one terminal app: see what is using your machine, and run your project's processes, from one screen. For macOS and Linux.**

[![npm version](https://img.shields.io/npm/v/stackpilot-tui.svg)](https://www.npmjs.com/package/stackpilot-tui)
[![npm downloads](https://img.shields.io/npm/dm/stackpilot-tui.svg)](https://www.npmjs.com/package/stackpilot-tui)
[![CI](https://github.com/piyushy111/StackPilot/actions/workflows/ci.yml/badge.svg)](https://github.com/piyushy111/StackPilot/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/piyushy111/StackPilot/blob/main/LICENSE)

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

## Contents

- [Features](#features)
- [Install](#install)
- [Quick start](#quick-start)
- [Commands and options](#commands-and-options)
- [Running a stack](#running-a-stack)
- [Keys](#keys)
- [How this package works](#how-this-package-works)
- [Verifying what you installed](#verifying-what-you-installed)
- [Updating and uninstalling](#updating-and-uninstalling)
- [Troubleshooting](#troubleshooting)
- [Privacy](#privacy)
- [Links](#links)

## Features

- **See the machine.** CPU history and a gauge per core, memory and swap, listening ports with the process
  that owns each, and a process table or tree with filter, sort, details, kill and renice.
- **Run the stack.** Starts the processes in `stackpilot.json` (or a Procfile, or package.json scripts) in
  dependency order, waits until each is ready (a port, an HTTP check or a log line), restarts crashes with
  backoff, and stops everything cleanly in reverse order.
- **Follow it.** A live logs panel per process, or all of them interleaved, with pause and search. Logs are
  also saved to `.stackpilot/logs/`. Each managed process shows the CPU and memory of its whole process tree.
- **Notice trouble early.** A header line lights `CAUTION` or `WARNING` only when something needs a look:
  a process that keeps crashing (`↻ worker 3 in 5m`), a failing data source, or a process whose memory keeps
  climbing (`▲ leak?`).
- **Stay safe.** Every kill and renice goes through confirmations enforced in the engine: one key for your own
  processes, the exact name typed for system processes, and StackPilot itself and PID 1 are blocked. After a
  crash, StackPilot finds the processes it left running and offers to stop them.
- **Anywhere.** One binary. It works over SSH, on an EC2 box or a Raspberry Pi, and in 256-colour, 16-colour
  and no-colour terminals.

## Install

```sh
npm install -g stackpilot-tui
```

That installs the `stackpilot` command. You can also try it without installing:

```sh
npx stackpilot-tui
```

**Supported platforms**

| | macOS 13 or newer | Linux with glibc |
|---|---|---|
| **arm64** | Apple Silicon | AWS Graviton, Raspberry Pi (64-bit OS) |
| **x64** | Intel Macs | most servers and desktops |

Node.js 18 or newer is needed only to launch the binary; StackPilot itself does not run on Node. Windows is
not supported (use WSL2), and neither are musl-based distributions such as Alpine.

**Without npm**, the same binary installs with a checksum-verifying script:

```sh
curl -fsSL https://raw.githubusercontent.com/piyushy111/StackPilot/main/packaging/install.sh | sh
```

## Quick start

```sh
stackpilot              # the dashboard: this machine, plus this folder's stack (idle until you start it)
stackpilot sm           # the system monitor only
cd my-project
stackpilot init         # writes stackpilot.json from a Procfile or package.json scripts
stackpilot pm           # starts the stack and opens the process manager
stackpilot doctor       # checks the machine, the terminal and the config
```

Press `?` anywhere in the app to see every key.

## Commands and options

| Command | What it does |
|---|---|
| `stackpilot` | The dashboard. The project's stack is shown idle; `a` starts it all, `s` starts one process |
| `stackpilot pm` | Starts the project's stack and opens the dashboard on it (aliases `-pm`, `--pm`) |
| `stackpilot sm` | The system monitor only; never reads or runs a config (aliases `-sm`, `--sm`) |
| `stackpilot init` | Writes `stackpilot.json` from a Procfile, package.json scripts or a command you type |
| `stackpilot import pm2 [file]` | Converts a running pm2, or a pm2 ecosystem file, into `stackpilot.json` |
| `stackpilot doctor` | Checks what StackPilot needs on this machine and says how to fix what is missing |
| `stackpilot update [--check]` | Updates a standalone (curl) install; for an npm install it prints the npm command |

| Option | Meaning |
|---|---|
| `--config <path>` | Use this `stackpilot.json` instead of searching for one |
| `--only <a,b>` | `pm`: start only these processes |
| `--interval <ms>` | Refresh interval, 250 to 60000 (default 1000) |
| `--force` | `init`, `import`: replace an existing `stackpilot.json` |
| `-y`, `--yes` | `init`: take the defaults; `import`: agree to read a `.js` ecosystem file |
| `--no-color` | Plain output; the `NO_COLOR` environment variable is respected too |
| `-h`, `--help` / `-v`, `--version` | Help and version |

`stackpilot sm --dump --ticks N` prints N JSON snapshots and exits, which is handy for scripts.

## Running a stack

A stack is the set of processes a project needs, described in `stackpilot.json`:

```json
{
  "version": 1,
  "processes": {
    "db": {
      "cmd": "docker run --rm -p 5432:5432 -e POSTGRES_PASSWORD=dev postgres:16",
      "ready": { "port": 5432 }
    },
    "api": {
      "cmd": "npm run dev",
      "dependsOn": ["db"],
      "ready": { "http": "http://localhost:3000/health" }
    },
    "worker": { "cmd": "node worker.js", "dependsOn": ["api"], "restart": "always" }
  }
}
```

- StackPilot looks for `--config`, then `stackpilot.json` in this folder or any parent, then a `Procfile`,
  then package.json scripts (you choose which to run).
- `dependsOn` sets the start order; a process starts once everything it depends on is ready.
- `ready` is a port, an HTTP URL or a log line (`"log": "listening on"`).
- `restart` is `on-failure` (the default), `always` or `never`, with backoff and a `maxRestarts` limit.
- `env` and `envFile` set environment variables; values are masked in the UI until you reveal them.
- An invalid config is reported with every problem and its path, and `stackpilot pm` exits with code 2,
  so the same check works in CI.

Every option and its default: [configuration reference](https://github.com/piyushy111/StackPilot/blob/main/docs/CONFIG.md).
To keep a stack running after you log out of a server, run `stackpilot pm` inside `tmux`.

## Keys

| Where | Keys |
|---|---|
| Everywhere | `Tab` next box · `?` help · `Esc` back · `q` quit · `L` logs of a failed process |
| Process table | `↑↓` select · `/` filter · `s` sort (`S` reverse) · `t` tree · `⏎` details · `x` kill (`X` force) · `r` renice |
| Process tree | `←→` fold · and the table's keys |
| Ports | `↑↓` select · `⏎` jump to the owner · `x` kill the owner · `/` filter |
| Stack | `↑↓` select · `⏎` details · `p` show in the process table · `s` start · `x` stop · `r` restart · `a` start all · `X` stop all · `n` new process · `e` env · `w` save to `stackpilot.json` |
| Logs | `f` follow · `/` search · `v` all processes or one · `PgUp`/`PgDn` scroll · `g`/`G` oldest/newest |

The help screen (`?`) is generated from the key bindings, so it always matches what the keys do.

## How this package works

`stackpilot-tui` is a small launcher. The program itself is a standalone binary, published as one package
per platform:

| Package | Platform |
|---|---|
| [`stackpilot-tui-darwin-arm64`](https://www.npmjs.com/package/stackpilot-tui-darwin-arm64) | macOS, Apple Silicon |
| [`stackpilot-tui-darwin-x64`](https://www.npmjs.com/package/stackpilot-tui-darwin-x64) | macOS, Intel |
| [`stackpilot-tui-linux-arm64`](https://www.npmjs.com/package/stackpilot-tui-linux-arm64) | Linux, arm64 |
| [`stackpilot-tui-linux-x64`](https://www.npmjs.com/package/stackpilot-tui-linux-x64) | Linux, x64 |

They are `optionalDependencies` with `os` and `cpu` fields, so npm downloads only the one for your
machine (a 27 to 39 MB download, 72 to 97 MB on disk). **No install scripts run**: nothing executes during `npm install`. When you run
`stackpilot`, the launcher finds the binary for your platform and runs it with your terminal attached,
passing through arguments, signals and the exit code. All five packages always have the same version.

## Verifying what you installed

Every release is built by GitHub Actions from a tagged commit of
[piyushy111/StackPilot](https://github.com/piyushy111/StackPilot), and published with
[npm provenance](https://docs.npmjs.com/generating-provenance-statements): the npm page of each package
links to the exact workflow run and commit it came from. To check the signatures and provenance of an
install:

```sh
npm audit signatures        # in a project that depends on stackpilot-tui
```

The release archives on GitHub carry build attestations too
(`gh attestation verify <archive> --repo piyushy111/StackPilot`).

## Updating and uninstalling

```sh
npm install -g stackpilot-tui@latest     # update
npm uninstall -g stackpilot-tui          # uninstall
```

A project's saved logs and run state live in its `.stackpilot/` folder (`stackpilot init` offers to add it to
`.gitignore`); delete that folder to remove them.

## Troubleshooting

**`stackpilot: stackpilot-tui-<platform> is not installed`.** npm skipped the platform package. That happens
when optional dependencies are turned off (`--omit=optional`, `--no-optional`, or `omit=optional` in
`.npmrc`), or on a platform without a build. Reinstall with optional dependencies enabled:
`npm install -g stackpilot-tui --include=optional`.

**`EBADPLATFORM` on Windows, or a binary that won't start on Alpine.** StackPilot supports macOS and
glibc-based Linux on arm64 and x64. On Windows, install it inside WSL2; on Alpine (musl), use a
glibc-based image such as Debian slim.

**Other users' processes show no CPU or memory on macOS.** macOS only shares those figures with root.
StackPilot samples them every 5 seconds from `ps`; run it with `sudo` to see everything.

**Anything else.** Run `stackpilot doctor`: it checks the runtime, sampling, ports, the terminal and your
config, and says how to fix each problem. When you
[open an issue](https://github.com/piyushy111/StackPilot/issues/new/choose), include its output.

## Privacy

StackPilot sends no telemetry and has no analytics. It uses the network only for the readiness checks you
configure (a port or an HTTP URL, usually on localhost) and when you run `stackpilot update`, which asks
GitHub for the latest release.

## Links

- Source and issues: https://github.com/piyushy111/StackPilot
- Changelog: https://github.com/piyushy111/StackPilot/blob/main/CHANGELOG.md
- Configuration reference: https://github.com/piyushy111/StackPilot/blob/main/docs/CONFIG.md
- Security policy: https://github.com/piyushy111/StackPilot/blob/main/SECURITY.md
- Contributing: https://github.com/piyushy111/StackPilot/blob/main/CONTRIBUTING.md

## License

[MIT](https://github.com/piyushy111/StackPilot/blob/main/LICENSE) © 2026 Piyush Yadav
