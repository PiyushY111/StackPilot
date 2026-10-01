# StackPilot

**htop and pm2 in one terminal app: see what is using your machine, and run your project's processes, from one screen.**

[![npm](https://img.shields.io/npm/v/stackpilot-tui.svg)](https://www.npmjs.com/package/stackpilot-tui)
[![CI](https://github.com/piyushy111/StackPilot/actions/workflows/ci.yml/badge.svg)](https://github.com/piyushy111/StackPilot/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Platforms: macOS · Linux](https://img.shields.io/badge/platforms-macOS%20%C2%B7%20Linux-lightgrey.svg)

StackPilot shows what is using your machine, the way htop and btop do. It also starts and supervises your
project's processes, the way pm2 or foreman do. Because it does both, it can tell you that *your* `api` is
the process holding 1.2 GB and climbing, and which port it listens on. It is one standalone binary for
macOS and Linux, with nothing else to install.

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

- [Why StackPilot](#why-stackpilot)
- [Install](#install)
- [Quick start](#quick-start)
- [The dashboard](#the-dashboard)
- [Running a stack](#running-a-stack)
- [Keys](#keys)
- [Commands and options](#commands-and-options)
- [Platforms and footprint](#platforms-and-footprint)
- [Troubleshooting](#troubleshooting)
- [Privacy and security](#privacy-and-security)
- [Building from source](#building-from-source)
- [Documentation](#documentation)
- [Contributing](#contributing) · [License](#license)

## Why StackPilot

Running a project usually means several terminal tabs (api, web, worker, a database), a system monitor in
another, and `lsof -i :3000` when a port is stuck. A crash in one tab goes unnoticed, and a memory leak shows
up only once the machine starts swapping.

StackPilot puts all of that on one screen:

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

| | htop | btop | pm2 | foreman / overmind | **StackPilot** |
|---|---|---|---|---|---|
| System monitor | ✔ | ✔ | basic | ✘ | ✔ |
| Process tree and ports | tree only | tree only | ✘ | ✘ | ✔ |
| Start a whole stack in order | ✘ | ✘ | ✔ | ✔ | ✔ |
| Readiness checks | ✘ | ✘ | partial | ✘ | ✔ |
| Resource use per managed app | ✘ | ✘ | ✔ | ✘ | ✔ (whole process tree) |
| Runtime needed | none | none | Node | Ruby / Go | **none** |

## Install

macOS 13+ and Linux (glibc), on arm64 and x64.

**npm** (installs the `stackpilot` command; no install scripts run):

```sh
npm install -g stackpilot-tui
```

**Without npm** (a checksum-verifying installer, into `~/.local/bin`; set `STACKPILOT_INSTALL_DIR` to change it):

```sh
curl -fsSL https://raw.githubusercontent.com/piyushy111/StackPilot/main/packaging/install.sh | sh
```

Or download an archive from the [releases page](https://github.com/piyushy111/StackPilot/releases/latest).
Every release is built in GitHub Actions from a tagged commit, and you can check where it came from:

```sh
npm audit signatures                                   # an npm install
gh attestation verify stackpilot-v<version>-<os>-<arch>.tar.gz --repo piyushy111/StackPilot
```

To update: `npm install -g stackpilot-tui@latest`, or `stackpilot update` for a curl install.

## Quick start

```sh
stackpilot              # the dashboard: this machine, plus this folder's stack (idle until you start it)
cd my-project
stackpilot init         # writes stackpilot.json from a Procfile or package.json scripts
stackpilot pm           # starts the stack and opens the dashboard on it
```

Press `?` anywhere for every key, and `q` to quit (with a stack running, StackPilot asks first and stops
it cleanly). `stackpilot doctor` checks the machine, the terminal and the config if something looks wrong.

## The dashboard

There is one screen, laid out like a cockpit: each box is a display, and colour means one thing everywhere.

| Box | What it shows |
|---|---|
| **header** | The stack and how many processes are ready, recent crashes, the machine, and the `CAUTION`/`WARNING` light |
| **cpu** | Total CPU over the last 4 minutes, load, uptime, and a gauge per core |
| **mem** | Used, cache, free and swap |
| **stack** | Your processes: status, readiness, CPU, and `▲ leak?` when memory keeps climbing |
| **ports** | TCP listeners and the process that owns each (`◆api` marks one of your stack's processes) |
| **proc** | Every process, as a table or a tree. While the stack box has focus, this panel shows the selected process's **logs** instead |

| Colour | Means |
|---|---|
| White | Normal values and names: the screen is quiet while all is well |
| Green · amber · red | Normal · caution · warning |
| Cyan | What you chose: keys, the sort column, filters, search matches, your processes |
| Magenta | What is active: the focused box and the selected row |

Every status also has a glyph (`●` running, `↻` restarting, `✕` crashed, `⊘` blocked…), so nothing depends
on colour alone, and `NO_COLOR` / `--no-color` are respected.

**Process details.** In the stack box, `⏎` opens the details of a process beside its logs: how it is checked
for readiness, what it depends on, its ports and restart policy, its recent crashes, and its memory over the
last ten minutes:

```text
 StackPilot   CAUTION 1    myapp  ◌ 2/4 ready   ↻ worker 3 in 5m                 mbp · darwin arm64
┌─ cpu ────────────────────────────────────────────────────────────── load 2.4 2.1 1.9 · up 3d 4h ─┐
│ ⠀⠀⠀⠀⠀⠀⠀⣤⣤⣤⣤⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣤⣤⣤⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣤⣤⣤⣤ C0  ━━━───────  34%  C5  ━━────────  15%   │
│ ⠀⠀⠀⠀⢀⣠⣾⣿⣿⣿⣿⣿⣷⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⣿⣿⣿⣿⣿⣶⣄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣿⣿⣿⣿⣿ C1  ━━━━━━━───  71%  C6  ━━━━━━────  63%   │
│ ⠀⣠⣴⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣦⣄⠀⠀⠀⠀⠀⠀⠀⣴⣿⣿⣿⣿⣿⣿ C2  ━━────────  22%  C7  ━━━───────  27%   │
│ ⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⣀⠀⠀⠀⠀⠀⠀⢀⣠⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⡀⠀⠀⢀⣠⣾⣿⣿⣿⣿⣿⣿⣿ C3  ━─────────   9%                        │
│ CPU 90%                                               C4  ━━━━━─────  48%                        │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
┌─ mem ────────────── 16.0 GB ─┐┌─ logs · api ───────────────────────────── following ● ─ 6 lines ─┐
│ Used  ━━━━━━━━──────  9.6 GB ││  14:02:11 api listening on http:/…┌─ details ──────────────────┐ │
│ Cache ━━━───────────  3.1 GB ││  14:02:12 GET /health 200 2ms     │ api              ● running │ │
│ Free  ━━━━━━────────  6.4 GB ││  14:02:14 GET /users 200 18ms     │ pid 9812 · up 1h 2m        │ │
│ Swap  ━━────────────  256 MB ││  14:02:15 POST /login 401 9ms     │                            │ │
└──────────────────────────────┘│ ▎14:02:17 (node) DeprecationWarni…│ ready   :3000 http ✓       │ │
┌─ stack ──────────────── 2/4 ─┐│  14:02:18 GET /users/42 200 11ms  │ needs   db                 │ │
│  ● db     ready :5432    3%  ││                                   │ port    :3000              │ │
│ ▌● api    ready :3… ▲ leak?  ││                                   │ restart on-failure         │ │
│  ↻ worker retry 3 in 4s      ││                                   │ crashes none               │ │
│  ⊘ cron   blocked by worker  ││                                   │                            │ │
└─ s start ─ x stop ───────────┘│                                   │ memory  412 MB ▲ leak?     │ │
┌─ ports ────────────────── 2 ─┐│                                   │ ▁▁▂▂▂▂▃▃▃▃▄▄▅▅▅▅▆▆▆▆▆▇▇███ │ │
│ :3000  node  ◆api 127.0.0.1  ││                                   │ +173 MB in 10 min          │ │
│ :5432  postg… ◆db *          ││                                   │                            │ │
│                              ││                                   │ p show in proc   Esc close │ │
│                              ││                                   └────────────────────────────┘ │
└──────────────────────────────┘└─ f follow ─ / search ─ v all / one ─ PgUp older ─ PgDn newer ────┘
```

## Running a stack

A stack is the set of processes a project needs, described in `stackpilot.json`:

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

- **Where it comes from:** `--config`, then `stackpilot.json` in this folder or any parent, then a `Procfile`,
  then package.json scripts (you pick which to run). A pm2 setup converts with `stackpilot import pm2`.
- **Order:** `dependsOn` sets the start order; a process starts once everything it depends on is ready.
- **Ready:** a port, an HTTP URL or a log line (`"log": "listening on"`).
- **Restarts:** `on-failure` (the default), `always` or `never`, with backoff and a `maxRestarts` limit.
- **Environment:** `env` and `envFile`; values are masked in the UI until you reveal them.
- **Checked:** an invalid config is reported with every problem and its path, and `stackpilot pm` exits with
  code 2, so the same check works in CI.

Every option and its default is in the [configuration reference](docs/CONFIG.md). To keep a stack running
after you log out of a server, run `stackpilot pm` inside `tmux`.

## Keys

| Where | Keys |
|---|---|
| Everywhere | `Tab` next box · `?` help · `Esc` back · `q` quit · `L` logs of a failed process |
| Process table | `↑↓` select · `/` filter · `s` sort (`S` reverse) · `t` tree · `⏎` details · `x` kill (`X` force) · `r` renice |
| Process tree | `←→` fold · and the table's keys |
| Ports | `↑↓` select · `⏎` jump to the owner · `x` kill the owner · `/` filter |
| Stack | `↑↓` select · `⏎` details · `p` show in the process table · `s` start · `x` stop · `r` restart · `a` start all · `X` stop all · `n` new process · `e` env · `w` save to `stackpilot.json` |
| Logs | `f` follow · `/` search · `v` all processes or one · `PgUp`/`PgDn` scroll · `g`/`G` oldest/newest |

The focused box shows its most useful keys in its bottom border, and the help screen is generated from the
same key map, so it always matches what the keys do. Arrows and `j`/`k` both move, which is why kill is `x`.

## Commands and options

| Command | What it does |
|---|---|
| `stackpilot` | The dashboard. This folder's stack is shown idle; `a` starts it all, `s` starts one process |
| `stackpilot pm` | Starts this folder's stack and opens the dashboard on it |
| `stackpilot sm` | The system monitor only; never reads or runs a config |
| `stackpilot init` | Writes `stackpilot.json` from a Procfile, package.json scripts or a command you type |
| `stackpilot import pm2 [file]` | Converts a running pm2, or a pm2 ecosystem file, into `stackpilot.json` |
| `stackpilot doctor` | Checks what StackPilot needs here and says how to fix what is missing |
| `stackpilot update [--check]` | Updates a standalone install to the latest release (checksum- and version-verified) |

| Option | Meaning |
|---|---|
| `--config <path>` | Use this `stackpilot.json` instead of searching for one |
| `--only <a,b>` | `pm`: start only these processes (and what they depend on) |
| `--interval <ms>` | Refresh interval, 250 to 60000 (default 1000) |
| `--force` | `init`, `import`: replace an existing `stackpilot.json` |
| `-y`, `--yes` | `init`: take the defaults; `import`: agree to read a `.js` ecosystem file |
| `--no-color` | Plain output (`NO_COLOR` is respected too) |
| `-h`, `--help` · `-v`, `--version` | Help and version |

`-pm`, `--pm`, `-sm` and `--sm` also work. `stackpilot sm --dump --ticks N` prints N JSON snapshots and
exits, which is handy for scripts.

## Platforms and footprint

| | macOS 13 or newer | Linux (glibc) |
|---|---|---|
| **arm64** | Apple Silicon | AWS Graviton, Raspberry Pi (64-bit OS) |
| **x64** | Intel Macs | most servers and desktops |
| **Sampling** | Native (libproc); other users' processes every 5 s, since macOS limits those to root | `/proc` |

The full dashboard uses about 3% of one core and 80 MB. Windows works through WSL2; musl-based
distributions such as Alpine aren't supported yet.

## Troubleshooting

- **Something looks wrong:** run `stackpilot doctor`. It checks the platform, sampling, ports, the terminal
  and your config, and says how to fix each problem. Include its output when you
  [open an issue](https://github.com/piyushy111/StackPilot/issues/new/choose).
- **Other users' processes show no CPU or memory on macOS, or ports have no owner:** macOS only shares
  those with root. Run StackPilot with `sudo` to see everything.
- **`stackpilot-tui-<platform> is not installed`:** npm skipped the platform package because optional
  dependencies were turned off. Reinstall with `npm install -g stackpilot-tui --include=optional`.
- **The terminal is too small:** StackPilot needs at least 60×16 and is best at 100×30 or larger.

## Privacy and security

StackPilot sends no telemetry and has no analytics. It uses the network only for the readiness checks you
configure and when you run `stackpilot update`. Commands in a stack config run with your privileges when you
start the stack, the same trust model as `npm run`; plain `stackpilot` never starts anything by itself, and
`stackpilot sm` never reads a config. Saved logs are readable only by you. Report security problems privately,
as described in [SECURITY.md](SECURITY.md).

## Building from source

```sh
git clone https://github.com/piyushy111/StackPilot.git && cd StackPilot
./setup.sh                 # macOS, Linux, Windows WSL2   ·   PowerShell: .\setup.ps1
npm run demo               # the process manager on a demo stack
```

`setup.sh` checks and installs what's needed (Bun, dependencies, git hooks, and a `stackpilot` command linked
to your checkout), then runs lint, the type check and the tests. From a checkout:

| What | Command |
|---|---|
| The dashboard | `npm start` |
| The process manager for this folder / on the demo stack | `npm run pm` / `npm run demo` |
| The system monitor only | `npm run sm` |
| Tests | `npm test`, `npm run test:bun`, `npm run test:ui` |
| A standalone binary for this machine | `npm run build` (into `dist/`) |

npm keeps the flags that come before `--` for itself, so pass StackPilot's flags after it:
`npm run pm -- --only api,web`. [docs/DEV.md](docs/DEV.md) has every development command.

## Documentation

| Document | What it covers |
|---|---|
| [docs/CONFIG.md](docs/CONFIG.md) | Every `stackpilot.json` option, with its default |
| [docs/UI_SPEC.md](docs/UI_SPEC.md) | The interface: layout, colours, keys and every screen state |
| [docs/PRD.md](docs/PRD.md) | What StackPilot is for, its requirements, and the product decisions |
| [docs/BUILD_PLAN.md](docs/BUILD_PLAN.md) | The technical design: architecture, the engine/UI contract, performance, releases |
| [docs/DEV.md](docs/DEV.md) | Development commands, Linux testing on a Mac, measuring performance |
| [CHANGELOG.md](CHANGELOG.md) | What changed in each release |
| [RELEASING.md](RELEASING.md) | How a release is built, rehearsed, approved and verified |

## Contributing

Issues and pull requests are welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md), and please follow the
[Code of Conduct](CODE_OF_CONDUCT.md).

## License

Created by **Piyush Yadav** ([@piyushy111](https://github.com/piyushy111)). [MIT](LICENSE) © 2026 Piyush Yadav.
