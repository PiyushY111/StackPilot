# StackPilot — Technical Design

| | |
|---|---|
| **Covers** | StackPilot 0.1 |
| **Companion docs** | [PRD.md](PRD.md) (what the product does) · [UI_SPEC.md](UI_SPEC.md) (the interface) · [CONFIG.md](CONFIG.md) (`stackpilot.json`) |

---

## 1. Summary

StackPilot is one binary with three layers:

- a **CLI** that decides what to run,
- a **core** engine that samples the OS, supervises processes, and owns all state,
- a **UI** that renders that state and sends user intent back through a fixed set of actions.

The core never imports UI code, and the UI never touches the OS. Everything specific to macOS or Linux
sits behind one **platform adapter** interface, so the rest of the core is the same on every OS.

## 2. Architecture principles

1. **Ports and adapters.** The core depends on interfaces (platform, clock, spawn, filesystem) rather than concrete implementations, so every module can be tested with fakes.
2. **One store, one direction.** `OS → platform → sampler → store → UI`, and `UI → actions → core modules → store`. The UI subscribes to the store and calls actions; nothing else crosses the boundary.
3. **Immutable state.** Every store update replaces objects rather than mutating them, so the UI can compare by reference and skip unchanged renders.
4. **Pure logic separate from I/O.** Parsers, graph ordering, backoff, leak detection, and view derivation are pure functions tested with fixtures. I/O modules stay thin.
5. **Fail soft, report loudly.** No error from the OS or a child process may crash StackPilot. Every failure becomes a store event with a readable message.
6. **No shell unless the user wrote the command.** StackPilot's own calls (`ps`, `lsof`, `ss`) use `execFile` with argument arrays; renice uses the `setpriority` syscall directly (`os.setPriority`), so it works on minimal images without the `renice` binary. Only commands from the user's config run through a shell (§10).

## 3. Technology stack

| Layer | Choice | Rationale |
|---|---|---|
| Language | JavaScript with **JSDoc types**, checked by `tsc -p tsconfig.core.json` (`strict`) | Type safety without a build step; the core stays readable. TypeScript is pinned to **6.0.3**, the last JavaScript-based compiler, because the TypeScript 7 native compiler's JSDoc checking is less mature |
| Runtime (shipped) | **Bun ≥1.3**, compiled with `bun build --compile` into one binary | OpenTUI requires Bun (or Node ≥26.4). Compiling bundles the runtime, so users need nothing installed |
| Runtime (core tests) | Node ≥20 `node:test` **and** `bun test` | The core must run on both. This guards against relying on anything only one runtime has |
| UI | OpenTUI 0.5.x + React 19, **exact versions pinned** | Terminal renderer with flexbox layout. Pre-1.0, so pinning is essential |
| Core module format | CommonJS | Bun loads it alongside the ESM UI, and Node runs the core tests without a build |
| Argument parsing | `util.parseArgs` (built in) plus an alias pre-pass | No extra dependency. The pre-pass rewrites `-pm` to `pm` and so on |
| Config validation | Hand-written validator (`core/config/schema.js`) | Errors point at exact paths such as `processes.api.ready.port`. No dependency |
| Dependencies policy | Runtime dependencies are limited to OpenTUI + React | Every added dependency is supply-chain risk and binary size |

## 4. Data flow

```
                ┌──────────────────── stackpilot binary ───────────────────────┐
  argv ──▶ cli/ ─┤                                                            │
                │   core/                                                     │
                │   ┌────────────┐ snapshot ┌──────────┐  state/events        │
   macOS/Linux ◀┼──▶│ platform/  │─────────▶│ sampler/ │────────┐             │
   libproc,     │   │ darwin|lin │          │ history  │        ▼             │
   /proc, ss    │   └────────────┘          └──────────┘   ┌─────────┐        │
                │   ┌────────────┐  spawn/exit/logs        │ store/  │───────▶┼──▶ ui/ (OpenTUI)
   child procs ◀┼──▶│ supervisor │────────────────────────▶│         │        │      │
                │   │ + stack/   │                         └─────────┘        │      │
                │   └────────────┘                              ▲             │      │
                │   ┌────────────┐                              │             │      │
                │   │ config/    │ stackpilot.json│Procfile│package.json│pm2  │      │
                │   └────────────┘                              │             │      │
                │   ┌────────────┐          ┌──────────┐        │             │      │
                │   │ sysControl │◀─────────│ actions/ │◀───────┼─────────────┼──────┘ user intent
                │   └────────────┘          └──────────┘                      │
                └─────────────────────────────────────────────────────────────┘
```

## 5. Repository structure

```
stackpilot/
├── cli/
│   ├── index.js              # entry: alias pre-pass, parseArgs, dispatch
│   ├── args.js               # alias table + validation (pure)
│   ├── prompt.js · release.js  # interactive prompts; release assets, versions, install method
│   └── commands/             # interactive, pm, sm, init, import, doctor, update, help, version
├── core/
│   ├── platform/
│   │   ├── index.js          # picks darwin|linux, exposes the PlatformAdapter
│   │   ├── types.js          # JSDoc typedefs: ProcessInfo, MemoryInfo, PortInfo…
│   │   ├── darwin.js         # adapter: native sampling, with ps/vm_stat/sysctl/lsof as the fallback
│   │   ├── darwinNative.js · darwinFfi.js · darwinParsers.js   # libproc/Mach via Bun's FFI; parsers
│   │   ├── linux.js · linuxParsers.js   # /proc, ss (fallback /proc/net/tcp); pure parsers
│   │   ├── net.js            # shared address parsing / IPv6 formatting
│   │   └── errors.js         # PlatformError
│   ├── sampler/              # index.js (tick loop, cadence), cpu.js (deltas), ring.js, leak.js (pure)
│   ├── config/               # index.js (discovery), schema.js, procfile.js, packageJson.js, pm2.js, dotenv.js, save.js
│   ├── stack/                # graph.js (waves, cycles; pure), orchestrator.js, session.js
│   ├── processManager/       # index.js (facade), supervisor.js (one per process), backoff, env, groups,
│   │                         # logBuffer, logFile, readiness, runState
│   ├── systemControl/        # index.js (kill/renice), policy.js (safety tiers; pure)
│   ├── store/                # index.js (Store), state.js, types.js (the contract), selectors.js
│   ├── actions/index.js      # the only API the UI may call
│   ├── names.js              # shared process-name rule
│   └── index.js              # composition root: createStackPilot()
├── ui/
│   ├── main.jsx · App.jsx    # renderer setup; the app shell
│   ├── screens/Dashboard.jsx # the one screen
│   ├── components/           # box (displays, gauges, graphs), chrome (header), tables, managed, logs,
│   │                         # overlays (dialogs, drawers, help), stackOverlays, primitives
│   ├── logic/                # pure: layout, charts, format, dialog, logs, managed, appState
│   ├── theme/                # tokens.js (the only colors), capabilities.js, paint.js, context.js
│   ├── hooks/                # useStore, useLayout
│   ├── keymap.js             # every key; also renders the border hints and help
│   └── commands.js · managedCommands.js   # key → action
├── packaging/
│   ├── install.sh            # curl | sh installer
│   └── npm/                  # the stackpilot-tui launcher and the package READMEs
├── scripts/                  # build, npm packages, release notes, Homebrew formula, benchmarks, e2e
├── tests/
│   ├── unit/ · integration/ · ui/
│   └── fixtures/             # captured darwin/linux output, and the demo stack
├── .github/workflows/        # ci.yml, release.yml, codeql.yml, scorecard.yml
└── docs/                     # PRD.md, BUILD_PLAN.md, UI_SPEC.md, CONFIG.md, DEV.md
```

## 6. The store contract

The store is the only interface between the core and the UI. The authoritative definition is
`core/store/types.js`, and `tests/unit/contract.test.js` takes a snapshot of every key, event and action
name, so any change to the contract has to be deliberate.

### 6.1 State shape

```js
state = {
  meta:     { version: '0.1.0', platform: 'darwin', arch: 'arm64', hostname: 'mbp', isRoot: false,
              startedAt: 1759050000000, configPath: '/repo/stackpilot.json' | null,
              configSource: 'stackpilot.json' | 'Procfile' | 'package.json' | null },
  settings: { thresholds: { cpu: [50, 80], memMB: [500, 1500] } },
  system:   { cpuPercent: 42.3, cores: [12.1, 80.4, …], load: [1.2, 1.4, 1.1], memUsedMB: 8213,
              memTotalMB: 16384, memCachedMB: 3174, swapUsedMB: 0, swapTotalMB: 2048, uptimeSec: 134221 },
  history:  { cpu: [/* last 240 samples */], mem: [/* last 240 samples */] },
  processes: [ { pid, ppid, name, command, user, cpu, memMB, state, startedAt,
                 managedId: 'api' | null, level: 'ok'|'warn'|'danger' } ],   // derived view
  topConsumers: [ /* top 5 by CPU, unaffected by the filter */ ],
  ports:    { items: [ { port: 3000, address: '127.0.0.1', proto: 'tcp', pid, name, managedId } ],
              partial: true,            // some owners were hidden (not root)
              updatedAt: 1759050000000 },
  managed:  [ { id: 'api', cmd, cwd, status, pid, startedAt, restartCount, exitCode, signal, nextRestartAt,
                restart: 'on-failure', ready: { kind: 'port', target: 3000, ok: true } | null,
                blockedBy: [], resources: { cpu: 18.2, memMB: 412, procCount: 4 },
                memHistory: [/* 1 sample per 5 s, 10 min */], leakSuspect: false,
                crashTimes: [/* when it crashed, last 20 */], dependsOn: ['db'], logCount: 1932 } ],
  stack:    { name, source, path, errors, warnings, scripts, phase: 'idle'|'starting'|'running'|'stopping'|'stopped',
              stopProgress: { api: 'stopping' | 'stopped' } },
  orphans:  [ { id, pid, pgid, startedAt } ],   // children a previous StackPilot left running
  alerts:   [ { id, level: 'warn'|'danger', source: 'managed:api', message, at } ],
  ui:       { screen: 'dashboard', monitorView: 'table'|'tree', focus: 'proc'|'managed'|'ports',
              selectedPid, sortBy: 'cpu', sortDir: 'desc', filterQuery: '', collapsedPids: [],
              selectedManagedId, logFilter: '', logFollow: true, toast: { level, message, at } | null },
  errors:   { ports: { message, at } },   // one entry per failing data source; absent when healthy
}
```

- `stack.errors` holds an invalid config's problems (nothing is registered then). `stack.scripts` lists
  package.json candidates for the first-run picker. `stack.stopProgress` drives the quit progress.
- `processes` is always **already filtered, sorted, and tagged** (with `managedId` and `level`). Consumers never re-derive it.
- Log lines are **not** kept in state (too large and too frequent). The UI reads them through `actions.getLogs(id, { from, limit, filter })` and is notified by `managed:log` events.

### 6.2 Events

| Event | Payload | When |
|---|---|---|
| `change` | full state | Every commit. The UI's single subscription point |
| `stats:update` / `processes:update` / `ports:update` | slice | After each sample of that source |
| `managed:status` | `{ id, from, to }` | Every state-machine transition (§8.4), and `to: 'removed'` when a process is removed from the manager |
| `managed:log` | `{ id, line: { seq, ts, stream, text } }` | Each output line. The entry's `logCount` reaches the store in batches (every 250 ms), so chatty processes don't flood the UI |
| `managed:ready` | `{ id, kind, elapsedMs }` | Readiness check passed |
| `alert` | alert object | Threshold crossed, leak suspected, or process errored |
| `collector:error` | `{ source, message }` | A platform call failed (only that source is skipped for the tick; it isn't fatal) |
| `ui:update` | `ui` slice | Any UI state change |
| `managed:started` / `managed:crashed` / `managed:restarting` / `managed:killed` | entry / `{ id, exitCode, signal }` / `{ id, attempt, delayMs }` / `{ id }` | Lifecycle steps |

### 6.3 Actions (the only calls the UI may make)

Every action returns `{ ok, data, error }` (or a Promise of one) and **never throws**. Failures also carry
a stable `code` (e.g. `ECONFIRM`, `EBLOCKED`, `EPERM`), so the UI can tell "open the confirm dialog"
apart from "show an error".

| Group | Actions |
|---|---|
| Navigation | `setScreen`, `setFocus`, `setMonitorView`, `select(pid)`, `moveSelection(delta)`, `toggleCollapse(pid)`, `selectManaged(id)` |
| View | `sortBy(key)`, `filter(query)`, `setLogFilter(q)`, `setLogFollow(bool)`, `dismissToast()`, `notify(level, message)` |
| System | `classifyTarget(pid) → {tier, reason}`, `describeProcess(pid) → {process, parents, nice}`, `kill(pid, signal, confirmation)`, `renice(pid, nice, confirmation)`, `killPort(port, confirmation)` |
| Stack | `startStack({ only })`, `stopStack()`, `adoptScripts(names, { save })`, `start(id)`, `stop(id)`, `restart(id)`, `addAdHoc(name, cmd)`, `saveAdHoc(id)`, `stopOrphans()`, `dismissOrphans()` |
| Logs | `getLogs(id, { from, limit, filter })`, `revealEnv(id)` |
| Lifecycle | `quit()`: stops the stack gracefully, then resolves |

`kill` and `renice` require a `confirmation` token that matches the tier returned by `classifyTarget`
(§8.6). A UI bug therefore can't skip the confirmation step. The token also carries the **pid the user
was shown**: `killPort` refuses (`ECHANGED`) if the port's owner changed between opening the dialog and
confirming.

## 7. Platform adapter

### 7.1 Interface

```js
/** @typedef {Object} PlatformAdapter
 *  @property {() => Promise<ProcessInfo[]>} listProcesses   // pid, ppid, name, command, user, state, cpuTicks|cpuPercent, rssKB, startedAt
 *  @property {() => Promise<MemoryInfo>}    memory          // totalMB, usedMB, swapUsedMB
 *  @property {() => Promise<PortInfo[]>}    listeningPorts  // + { partial: boolean }
 *  @property {() => CpuTimes[]}             cpuTimes        // per core
 *  @property {() => number[]}               loadAverage     // os.loadavg()
 */
```

The CPU calculation is shared: the sampler works out busy% from the difference between two ticks of
cumulative per-core times.

### 7.2 macOS (`darwin.js`)

| Data | Source | Notes |
|---|---|---|
| Processes | `libproc` (`proc_listpids`, `proc_pidinfo`) through Bun's FFI (`darwinNative.js`, `darwinFfi.js`) | A native sample of ~600 processes costs about 1 ms. macOS only gives an unprivileged process the CPU, memory and start time of its **own** processes, so other users' processes get theirs from a trimmed `ps` every 5 s. As root, everything is native |
| Memory | Mach `host_statistics64` + `sysctl` | used = (anonymous − purgeable + wired + occupied by compressor) × page size, which is Activity Monitor's "Memory Used" |
| Ports | libproc socket info | Only the user's own processes unless root |
| Fallback | `ps`, `vm_stat`, `sysctl`, `lsof -Fpcn` via `execFile` | Under Node (tests), if the native self-check fails (a struct layout changed), or with `STACKPILOT_NATIVE=0` |

Struct layouts come from the SDK; `scripts/darwin-offsets.c` regenerates them.

### 7.3 Linux (`linux.js`)

| Data | Source | Notes |
|---|---|---|
| Processes | `/proc/[pid]/stat` per tick; `/proc/[pid]/status` (Uid) and `/proc/[pid]/cmdline` once per process | **Don't use `ps %cpu`: on Linux it's a lifetime average.** CPU% comes from the change in `utime + stime` between ticks, divided by `CLK_TCK` (read once via `getconf CLK_TCK`, default 100). A process that exits mid-read is skipped |
| CPU | `/proc/stat` | Cheaper than `os.cpus()` |
| Users | `/etc/passwd`, parsed once into a uid → name map | Unknown uids are shown as numbers |
| Memory | `/proc/meminfo` | used = MemTotal − MemAvailable |
| Ports | `ss -ltnpH` (probed once), falling back to `/proc/net/tcp{,6}` + inode → pid mapping | Minimal images may not have `ss`. Socket owners are cached |

### 7.4 How often each source is sampled

| Source | Default interval | Why |
|---|---|---|
| CPU, memory, processes | 1 s (`monitor.intervalMs`) | Main refresh |
| Ports | 5 s, or 1 s while the ports box has focus | Listing sockets is the slowest source |
| Managed memory history | 5 s | Feeds the leak detector; 10 minutes = 120 samples |
| Other users' processes (macOS, not root) | 5 s | A trimmed `ps`; see §7.2 |

A tick is skipped if the previous one is still running (the `inFlight` guard), so slow calls never pile up.

## 8. Core modules

### 8.1 Sampler and history
- Keeps the previous CPU times for the machine and for each process, and emits deltas. Per-process state is dropped when the PID disappears.
- Fixed-size ring buffers: system CPU and memory hold 240 samples (4 minutes of graph), and each managed process's memory holds 120 samples. Updates return new arrays, so no copy is ever shared.

### 8.2 Config

The full reference for `stackpilot.json` is [CONFIG.md](CONFIG.md). Implementation notes:

- Process names must match `^[A-Za-z0-9._-]{1,64}$`. A `ready` object must contain exactly one of `port`, `http`, or `log`.
- The validator collects **all** errors with their paths (`processes.api.dependsOn[0]: unknown process "dbb"`) instead of stopping at the first.
- **Procfile** → `{ name: { cmd } }` with default settings. **package.json** → one entry per selected script as `npm run <script>`. With a lockfile present, the matching runner is used instead (`pnpm`, `yarn`, `bun`).
- `cwd` resolves from the config file's folder. `envFile` resolves from the process's `cwd`, because a `.env` file usually sits next to the app it configures.
- **pm2**: `autorestart: true` maps to `restart: "always"`, since pm2 restarts on *any* exit. Env is **not** imported from `pm2 jlist`, because it contains the daemon's entire environment and copying it could leak unrelated secrets; env *is* imported from ecosystem files, where the user declared it. For `ecosystem.config.js` the file has to be run to be read, which is what pm2 does too, so StackPilot asks first.
- **dotenv**: `KEY=VALUE`, quoted values, `#` comments, `export ` prefix. No variable interpolation.
- Writes (`save.js`: `init`, `import pm2`, `w` in the UI, the script picker) are validated before they happen, so StackPilot never saves a config it could not load again.

### 8.3 Stack orchestration
- `graph.js` does a Kahn topological sort. It returns start order in "waves" (processes with no dependency between them start in parallel) and reports cycles as a path, e.g. `api → worker → api`.
- **Start:** each wave starts once every dependency is `running`, meaning its ready check has passed or it has none. If a dependency is `errored` or `unready`, its dependents are marked `blocked` with the reason.
- **Settled** means `running` or `exited` (ok) versus `unready`, `errored`, crashed for good, or `stopped` (failed). A crash that is immediately followed by a restart still counts as settling. A blocked process starts by itself once all its dependencies are healthy again. `startStack({ only })` adds each selected process's dependencies.
- **Stop:** reverse wave order, with processes in the same wave stopped in parallel. Ad-hoc processes stop first.
- **Session** (`session.js`): registers the config's processes as `idle`, owns the stack state (§6.1) and the orphan flow. **Starting waits until the orphan question is answered**, because a new db would otherwise race the left-over one for its port. The wait ends after 5 s if no process list arrives.

### 8.4 Supervisor state machine

```
 idle ──start──▶ starting ──ready ok / no check──▶ running
                   │   └──ready timeout──▶ unready (keeps running, dependents blocked)
                   │
      exit≠0 or unexpected exit (per restart policy)
                   ▼
              restarting ──backoff delay──▶ starting
                   │
      restarts > maxRestarts
                   ▼
               errored ──manual start──▶ starting
 any ──stop──▶ stopping ──exit / SIGKILL after stopTimeoutMs──▶ stopped
 dependency failed ──▶ blocked ──dependency recovers──▶ starting
```

- One `Supervisor` per process (`supervisor.js`; `index.js` is the manager facade). Each child gets its own process group (`detached: true`) and signals go to the whole group. Operations are serialized per process, the backoff streak resets after 30 s of stable running, and the stop escalates to SIGKILL after the grace period.
- **Termination is detected on `close`, not `exit`.** On Linux, `exit` can arrive before the last stdout/stderr chunk, which would log a crash before the output that explains it. StackPilot waits for `close` (streams drained), but stops waiting 1 s after `exit` in case a background grandchild keeps the pipe open.
- **Leftover processes are cleaned up.** When a managed command's main process exits, anything it left running in its process group (e.g. `server &` in a wrapper script) gets SIGTERM, then SIGKILL after the grace period, so it can't be orphaned while holding a port. The pgid is forgotten once the group is empty, so a reused pid is never signalled. Commands that daemonize themselves (fork and exit) aren't supported, which is the same as pm2 and systemd `Type=simple`.
- Restart policies (`on-failure`, `always`, `never`); `maxRestarts` consecutive crashes → `errored` plus a danger alert; each crash's time is kept (`crashTimes`, the last 20) for the UI's crash history.
- Readiness probes (`readiness.js`): TCP connect to 127.0.0.1 then ::1; HTTP GET with a 2 s timeout where 2xx/3xx passes, every 500 ms until `timeoutMs`; or a regex tested against each output line.
- Env merging (`env.js`): inherited < `envFile` < inline `env`. A missing *explicit* envFile is `errored` with a log line; the default `.env` is optional.
- **Logs:** the in-memory buffer is append-only with amortized trimming, and log-only updates reach the store every 250 ms instead of per line. Saved logs (`logFile.js`) are appended as `ISO-timestamp stream text` to `.stackpilot/logs/<id>.log` (mode 0600, directory 0700), rotate at 10 MB keeping `.1` to `.3`, are flushed every 250 ms and synchronously on shutdown.
- **Run state** (`runState.js`): `.stackpilot/run.json` records `{ stackpilotPid, children: [{ id, pid, pgid, startedAt }] }`. It is rewritten atomically (0600) whenever the set of live children changes, and removed when none are left. On the next start, entries whose PID is alive **and** has a matching start time (±3 s) count as orphans; the start time guards against an unrelated process that reused the PID. If the recorded StackPilot is still alive, nothing counts as an orphan and a warning says another StackPilot manages the stack. Stopping orphans re-verifies each one first, and signals a whole group only when the pid is its group leader.
- **Known limits:** a single stop (`x`, `r`) resolves once the main process has exited, while anything it left in its group is still being swept; a full quit escalates at once. The last-resort `process.on('exit')` cleanup can only send SIGTERM, because a synchronous exit handler can't wait; quit, SIGTERM and SIGHUP all take the graceful path.

### 8.5 Resource link and leak detector
- **Resource link** (a pure selector): build a `ppid → children` map from the process snapshot, walk the tree from each managed root PID, and sum CPU and RSS. It also tags every process in the tree with `managedId`, which the process table shows as the `◆` badge.
- **Leak detector** (`leak.js`, pure): linear regression over the last 120 memory samples (10 minutes). It flags a process when **all** of these hold: slope ≥ 1 MB/min, R² ≥ 0.8, total growth ≥ 20%, and at least 120 samples collected. The flag clears after 60 s without the conditions holding, so it doesn't flicker. Advisory only.

### 8.6 Safety policy (`policy.js`, pure)

| Tier | Condition | Required confirmation |
|---|---|---|
| `blocked` | PID ≤ 1, StackPilot's own PID, or StackPilot's parent shell | none; the action is refused with the reason |
| `managed` | PID belongs to a managed process tree | one key. The UI offers "stop via manager" instead, so auto-restart doesn't just bring it back |
| `own` | process user = current user | one key (`y`) |
| `system` | a different user, or root | type the process name exactly |

### 8.7 CLI
- The alias pre-pass maps `-pm`/`--pm` → `pm` and `-sm`/`--sm` → `sm` **before** `util.parseArgs`, so `-p -m` style bundling can't happen.
- Exit codes: `0` normal, `1` runtime error, `2` usage or config error. That makes `stackpilot pm` and `stackpilot doctor` usable in scripts and CI.
- Non-TTY (piped output or CI): interactive commands print a clear error and suggest `stackpilot doctor`.

## 9. Failure modes

| Failure | Behavior |
|---|---|
| A data source (`ps`, `lsof`, `ss`, libproc) missing or failing | That source shows an inline warning ("ports unavailable: `ss` not found") and lights CAUTION, while everything else keeps working. `doctor` explains the fix |
| Hundreds of processes exit between reads (Linux `/proc` races) | Missing `/proc/[pid]` entries are skipped silently. They're expected, not errors |
| Managed process never becomes ready | Status `unready`, dependents `blocked`, and an alert with its logs one key away |
| Crash loop | Backoff grows to 30 s, then `errored` after `maxRestarts`, raising a danger alert. Nothing restarts forever |
| StackPilot receives SIGHUP (SSH dropped) or SIGTERM | Graceful stack shutdown, log flush, then exit |
| StackPilot is SIGKILLed or crashes | Children survive, since they have their own groups. `run.json` lets the next start detect and offer to stop them |
| Invalid `stackpilot.json` | `pm` refuses to start and prints every validation error with its path. `sm` isn't affected |
| Terminal smaller than 60×16 | A "terminal too small" message; sampling continues |
| Log disk full or write error | One warning toast, and the file sink for that process is disabled; in-memory logs continue |

## 10. Security model

| Surface | Control |
|---|---|
| Config commands | Run through the user's shell **only** when the user types `stackpilot pm` or starts a process. `stackpilot` and `stackpilot sm` never run anything from a config on their own. This is the same trust level as `npm run` |
| StackPilot's own OS calls | `execFile` with argument arrays and no shell. PIDs, signals, and nice values are validated |
| Kill and renice | Tiered policy with confirmation tokens enforced in the core (§8.6), not only in the UI |
| Child output | Untrusted: the UI strips escape and control sequences before drawing it |
| Secrets | Env values masked in the UI. `.stackpilot/` files are 0600/0700. `stackpilot init` offers to add `.stackpilot/` to `.gitignore`. Env values are never logged |
| pm2 ecosystem `.js` | Runs only after an explicit prompt. `pm2 jlist` (plain data) is preferred |
| Releases | Checksums (`SHA256SUMS`) plus GitHub build attestations and npm provenance. The installer and `stackpilot update` refuse an archive whose checksum doesn't match, and `update` also checks the new binary reports the release's version. The installer never uses sudo on its own |
| Telemetry | None. The network is used only for readiness checks you configure and when you run `stackpilot update` |
| Supply chain | Two runtime dependencies, pinned. `bun install --frozen-lockfile` in CI. Dependabot on |

## 11. Quality: testing and performance

| Layer | What | Tooling |
|---|---|---|
| Unit | Parsers against fixture strings for **both** OSes, schema validator, graph, backoff, leak detector, policy, selectors, alias pre-pass, the contract snapshot | `node:test` (+ `bun test` to confirm it runs on both) |
| Integration | Supervisor and stack with real child processes (`scripts/fixture-server.js`): crash, restart, backoff, readiness, dependsOn order, graceful stop, log rotation, orphans | `node:test` |
| UI | The real App against a real store: every state in UI_SPEC §7, keys, dialogs, colors | OpenTUI test renderer via `bun test` |
| E2E | `stackpilot pm` on the demo stack in a real pseudo-terminal: ready in order → `q` → `y` → nothing left running, run state cleared | `scripts/e2e/pm-e2e.sh` (Python PTY driver with a minimal screen emulator) |
| Types | `tsc` with `checkJs` over `core/` and `cli/` | CI gate |
| Coverage | **≥ 80%** on `core/` and `cli/` | `--experimental-test-coverage` |

**Performance** (`scripts/bench.js` for the engine, children included; `scripts/bench-ui.jsx` for the UI
per frame). CI fails above a **regression guard** of 4% CPU and 120 MB; the budgets are the goals.

| Metric | Budget | Current (macOS arm64, ~600 processes, 1 s refresh) |
|---|---|---|
| Time to first frame | < 300 ms | 68 ms median, 220 ms cold |
| StackPilot's own CPU, full dashboard, children included | < 1% of one core | **3.1–3.4%** (the UI itself ~1%) |
| Engine alone | < 1% | 1.45–2.08% on macOS, 2.7% in a Linux container |
| RSS, interactive | < 80 MB | ~76–80 MB |
| One UI frame | — | ~3.1 ms of CPU; 0.2 ms when nothing changed |

What limits the rest: a native sample costs ~2 ms in a tight loop but ~6–7 ms when it runs once a
second (cold caches, efficiency cores), and each UI frame makes ~45 real text updates inside OpenTUI's
native text buffer. Getting under 1% needs structural changes (sampling less while nothing is on
screen, or a longer default interval), not micro-optimisations.

When measuring the interactive UI, always set `NODE_ENV=production` at process start (as `npm start`
and the release build do), and count the processes StackPilot spawns: `process.cpuUsage()` and
`ps -o time` see only StackPilot itself. [DEV.md](DEV.md) has the method.

## 12. Distribution and release engineering

The step-by-step process is in [RELEASING.md](../RELEASING.md).

| Step | Detail |
|---|---|
| Trigger | Pushing a tag `vX.Y.Z` on `main`. The tag must equal `v` + the `package.json` version, and `CHANGELOG.md` must have a dated section for it, which becomes the release notes (`scripts/release-notes.js`) |
| Build matrix | `macos-15` → darwin-arm64 · `macos-15-intel` → darwin-x64 · `ubuntu-24.04` → linux-x64 · `ubuntu-24.04-arm` → linux-arm64. Builds must be **native**: cross-compiling can't resolve OpenTUI's per-platform native package |
| Command | `bun build cli/index.js --compile --target=bun-<os>-<arch> --define process.env.NODE_ENV="production"` (`scripts/build.js`), then a smoke test of the binary on its own runner |
| Artifacts | `stackpilot-v<version>-<os>-<arch>.tar.gz`, `SHA256SUMS`, `install.sh`, and build attestations (`actions/attest-build-provenance`) |
| Channels | GitHub Release (source of truth) · npm: `stackpilot-tui` (launcher) plus `stackpilot-tui-<os>-<arch>` packages installed through `optionalDependencies` with `os`/`cpu` fields (the esbuild/Biome pattern), published with provenance · Homebrew: `scripts/homebrew-formula.js` writes the formula for the `piyushy111/homebrew-tap` repository |
| Installer | POSIX `sh` with `set -eu`. Detects `uname -s`/`-m`, downloads the archive and `SHA256SUMS`, checks with `shasum -a 256` or `sha256sum`, installs to `$STACKPILOT_INSTALL_DIR` or `~/.local/bin`, and prints a PATH hint. It never uses sudo |
| macOS signing | Bun signs arm64 binaries ad hoc. Notarization isn't needed for curl, npm or brew installs, which don't trigger Gatekeeper |
