# StackPilot — UI & Interaction Spec

| | |
|---|---|
| **Covers** | StackPilot 0.1 |
| **Implements** | [PRD.md](PRD.md) §5.3 and §6 · the UI layer of [BUILD_PLAN.md](BUILD_PLAN.md) |

---

## 1. Design goals

1. **A glass cockpit for your machine.** StackPilot borrows the conventions of avionics displays, which are built to be read at a glance under load: boxed displays with their names in the border, braille history graphs and tape gauges, and one fixed meaning per color. It still works like the tools developers know (htop's dense process table, vim/less keys). `stackpilot` opens straight into the dashboard; there's no separate home screen.
2. **The dark cockpit.** When everything is normal, the screen is quiet: white text, green gauges, no lit annunciators. Color appears on a *number* or a *title* only when it needs a look. Gauges and graphs still show the whole gradient, so load reads as length and color at once: color stays on the instruments and off the labels.
3. **Still meaningful.** Each color has one job (§3.1), and every status also has a glyph. Nothing is decoration only.
4. **Planned.** Every box, state, key, and color is specified here before it's built.

## 2. Principles → rules

| Principle | Rule in StackPilot |
|---|---|
| **Jakob's law** (users expect your product to work like the ones they know) | A familiar monitor layout, as in btop (cpu across the top; mem and ports on the left; proc on the right), htop/vim/less keys, and `/` to filter |
| **Pre-attentive processing** | Load is shown as color and length at once (gradient meters), so hot spots are visible before any number is read |
| **Gestalt: common region** | Each subsystem lives in its own titled box, and related numbers stay inside it |
| **Hick's law** | The focused box shows **at most five** keys in its bottom border. `?` shows everything |
| **Recognition over recall** | Sort, filter, view, and counts are always visible in the proc box title |
| **Stable spatial memory** | Boxes never move. Row order is stable between refreshes, and the selection persists |
| **Error tolerance** | Destructive actions are tiered (§6.4). Nothing irreversible happens on a single key |

## 3. Design tokens

### 3.1 Palette (avionics colors on black)

The background and surfaces are black and cool, near-neutral greys, like an unlit display bezel. Each hue has
**one job**, following the color code of glass-cockpit displays. **Components never use hex values directly;
they use semantic tokens** (`ui/theme/tokens.js`, the only file with colors).

| Token | Hex | Job |
|---|---|---|
| `base` | `#000000` | App background: pure black (truecolor only); text on lit chips |
| `mantle` | `#0e1013` | The header strip, dialog backgrounds |
| `surface0` | `#1a1e23` | Selected row background |
| `surface1` | `#2b3138` | Box borders (unfocused), empty gauge cells |
| `overlay0` | `#6f7983` | Muted text: labels, units, hints (4.7:1 on black) |
| `subtext` | `#a7afb8` | Secondary text |
| `text` | `#e6e8ea` | **White: what you read.** Titles, names, values while normal |
| `green` | `#5bd983` | **Normal.** Running, ready, the low gauge band |
| `yellow` | `#e2d65c` | Transitional: restarting, stderr marks, the second gauge band |
| `amber` | `#ffaa33` | **Caution.** Starting/unready, crossed warn thresholds, the high band, `CAUTION` |
| `red` | `#ff5c5c` | **Warning.** Crashed/errored, crossed danger thresholds, the max band, `WARNING`, kill dialogs |
| `cyan` | `#4fd1e8` | **What you chose.** Keys in hints and dialogs, the sort column, filters, search matches, `◆managed` (yours) |
| `magenta` | `#f06be6` | **What is active.** The focused box (border and lit title), the selection bar and selected name |

When `COLORTERM` is absent and `TERM` says 256color, OpenTUI downsamples truecolor itself.

### 3.2 Gauges, readouts and titles

A value from 0–100% falls in one of four bands: under 25% `green`, 25–50% `yellow`, 50–75% `amber`, 75% and
above `red`. **Gauges** (`━━━━────`, a heavy rule over a light one, so the fill reads as length without color)
color **each filled cell by that cell's own position**, so a 90% gauge shows every band in order. The same
bands color the CPU graph (each row by its height), per-core meters, memory meters and the inline per-process
CPU meter.

**Readouts** (the numbers beside gauges, the CPU% and memory columns, `CPU nn%`) follow the dark cockpit:
white while normal, `amber` in the high band or past the memory warn threshold, `red` at max or past danger.

**Titles** are white. The focused box lights its title as a magenta chip (black text on magenta) and its
border in magenta; every other border is `surface1`. Only one title is lit at a time: the logs panel, which
follows the focused stack box, lights its border but not its title.

### 3.3 Color-depth fallbacks

| Terminal | Behavior |
|---|---|
| Truecolor (`COLORTERM=truecolor\|24bit`) | Full palette, with the app background painted |
| 256 colors (`TERM` contains `256color`) | OpenTUI downsamples. The app background is **not** painted |
| 16 colors / others | Best effort: OpenTUI still emits truecolor, which almost every modern terminal renders |
| No color (`NO_COLOR`, `--no-color`, `TERM=dumb`) | StackPilot resolves every token to "no color" (OpenTUI ignores `NO_COLOR`). Meaning is carried by dim, bold, underline, reverse video, and glyphs. **Graphs switch to block characters** (`▁▂▃▄▅▆▇█`) so they stay readable |

### 3.4 Status glyphs (color is never the only signal)

| Status | Glyph | Token |
|---|---|---|
| running | `●` | state.ok |
| starting | `◌` | state.warn |
| unready | `◍` | state.warn |
| restarting | `↻` | state.transient |
| errored / crashed | `✕` | state.danger |
| blocked | `⊘` | state.inactive |
| idle / stopped / exited | `○` | state.inactive |
| Managed badge | `◆name` | accent.managed |
| Alert | `▲` warn / `■` danger | state.* |

## 4. Layout

### 4.1 Boxes

Below the header strip (§4.3), at 92×24:

```
 StackPilot    myapp  ◌ 2/4 ready                                        mbp · darwin arm64
┌─ cpu ────────────────────────────────────────────────────── load 1.2 1.4 1.1 · up 3d 4h ─┐
│⣀⣠⣤⣶⣿⣷⣦⣤⣀⣀⣠⣴⣾⣿⣷⣶⣤⣀⣀⣠⣤⣶⣿⣷⣦⣤⣀⣀⣠⣴⣾⣿⣷⣶⣤⣀⣀⣠⣤⣶⣿⣷⣦⣤⣀⣀⣠⣴⣾⣿⣷⣶  C0  ━───  12%  C3  ────   5%   │
│⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿  C1  ━━━─  80%                  │
│ CPU 42%                                                   C2  ━───  30%                  │
└──────────────────────────────────────────────────────────────────────────────────────────┘
┌─ mem ──────── 16.0 GB ─┐┌─ proc ───────────────── filter: — ─ sort: cpu ↓ ─ 6 processes ─┐
│ Used  ━━━━────  8.2 GB ││       PID Program    User          Cpu%↓           Mem State   │
│ Cache ━━──────  3.1 GB ││ ▌     401 Chrome He… alice          58.4 ━━──   1.2 GB running │
│ Free  ━━━━────  7.8 GB ││       812 node  ◆api alice          12.1 ────   412 MB running │
│ Swap  ────────    0 MB ││        99 WindowSer… _windowserver   5.2 ────   180 MB running │
└────────────────────────┘│                                                                │
┌─ stack ────────── 2/4 ─┐│                                                                │
│  ● db     ready :5432  ││                                                                │
│  ● api    ready :3000  ││                                                                │
│  ↻ worker retry 2 in…  ││                                                                │
│  ⊘ cron   blocked by…  ││                                                                │
└────────────────────────┘│                                                                │
┌─ ports ──────────── 2 ─┐│                                                                │
│ :3000  node ◆api 127.0 ││                                                                │
│ :5432  pos… *          ││                                                                │
└────────────────────────┘└─ ↑↓ select ─ / filter ─ s sort ─ x kill ─ ⏎ info ──────────────┘
```

| Box | Content |
|---|---|
| **cpu** (full width) | A braille graph of total CPU over the last 4 minutes (240 samples, 2 per character), per-core meters in columns on the right, `CPU nn%` under the graph. The title's right side shows load, uptime and the refresh interval |
| **mem** (left) | Meters for Used, Cache, Free and Swap, each with its size |
| **ports** (left, below mem) | TCP listeners: `:port name ◆managed address`. The title shows the count. It notes when owners are partial (not root) |
| **proc** (right, the rest of the height) | The process table or tree. The title shows filter, sort and the visible/total count |
| **stack** (the managed box; left column between mem and ports) | The stack, one line per process (§6.5). It grows with the stack, up to half the left column, and ports always keeps 3 rows; with no room for a single row it is left out. `stackpilot pm` opens with it focused; `stackpilot sm` has no stack box |

**Key hints sit in the focused box's bottom border**, keys in cyan: at most five, generated from the keymap,
keeping only whole hints that fit. Toasts appear in the right part of the big panel's bottom border and win
over hints when space is short. More cores than meter slots end in `+N more`.

**While the stack box has focus, the big panel shows logs** (§6.7) instead of the process table; `Tab`
on to ports (or `Esc`) brings the table back:

```
┌─ stack ────────── 2/4 ─┐│  14:02:11 api listening on http://localhost:3000               │
│  ● db     ready :5432  ││  14:02:12 GET /health 200 2ms                                  │
│ ▌● api    ready :3000  ││ ▎14:02:13 (node:812) DeprecationWarning: punycode              │
│  ↻ worker retry 2 in…  ││  14:02:14 POST /login 401 9ms                                  │
│  ⊘ cron   blocked by…  ││  14:02:15 GET /users/42 200 11ms                               │
└─ s start ─ x stop ─────┘│                                                                │
```

### 4.2 Breakpoints

| Width | Changes |
|---|---|
| < 60 cols or < 16 rows | A centered message: `StackPilot needs 60×16 — currently 52×14` |
| 60–99 (compact) | cpu box 5 rows high with short (4-cell) core meters in up to 3 columns, so an 8-core machine shows every core; the left column is 26 wide; proc hides User and State |
| 100–139 (standard) | As §4.1 |
| ≥ 140 (wide) | Up to 3 core-meter columns; proc adds Command |

### 4.3 Header strip and annunciator

One row across the top, on `mantle`:

- **Left:** `StackPilot`, then the **master annunciator**, then the stack: its name and `● 3/4 ready` (green
  when every process runs, amber `◌` otherwise), `no stack`, or `system monitor` in `stackpilot sm`.
- **Annunciator:** dark when all is normal. A danger alert lights ` WARNING n ` (black on red); otherwise any
  warn alert, failing data source or **crash loop** lights ` CAUTION n ` (black on amber). Without color both
  are reverse video. The alert lines under the header (§7, S4) say what each alert is.
- **Crash history:** after the stack, `↻ worker 3 in 5m` names the process that crashed most in the last five
  minutes (from each entry's `crashTimes`, recorded by the supervisor). Yellow below 3; at 3 or more it is
  amber and adds 1 to CAUTION, before the supervisor gives up and raises its `errored:` WARNING. It clears
  by itself five minutes after the last crash.
- **Right:** `hostname · platform arch`, dropped first when the row is too narrow.

## 5. Navigation and keys

- There's one screen, the **dashboard**. `stackpilot pm` opens it with the stack box focused and the stack
  starting; plain `stackpilot` shows the stack `idle` (nothing runs until you press `a` or `s`).
- **`Tab`** moves focus proc → stack → ports. Keys act on the focused box.
- `stackpilot sm` is the same dashboard without the stack box (Tab: proc → ports).

| Context | Border keys (≤ 5) | More (help only) |
|---|---|---|
| proc · table | `↑↓ select` `/ filter` `s sort` `x kill` `⏎ info` | `S` reverse, `X` SIGKILL, `r` renice, `t` tree, `PgUp/PgDn/Home/End`, `⇥` next box |
| proc · tree | `↑↓ select` `←→ fold` `/ filter` `x kill` `t flat` | as table |
| ports | `x kill owner` `⏎ jump` `↑↓ select` `/ filter` `⇥ next box`: the box is narrow, so the border shows as many as fit, most useful first | — |
| stack (its own border) | `s start` `x stop` `r restart` `a start all` | `↑↓` select, `X` stop all, `⏎` details (or pick scripts), `p` show in proc, `n` new process, `e` env, `w` save to stackpilot.json |
| stack (logs panel border) | `f follow` `/ search` `v all / one` `PgUp older` `PgDn newer` | `g`/`Home` oldest, `G`/`End` newest |
| detail drawer | `x kill` `r renice` `Esc close` | — |
| Everywhere | — | `?` help, `q`/`Ctrl+C` quit (asks first while processes run, S12), `Esc` back/close, `L` logs of the failed process (not in `sm`) |

Arrows and `j`/`k` both move the selection, which is why kill is `x`, not `k`.

## 6. Panels in detail

### 6.1 Process table
- Columns: `PID` (muted, right-aligned) · `Program` (with `◆managed` badge; the badge takes at most half the column) · `User` · `Cpu%` (a readout, §3.2) + a 4-cell inline gauge · `Mem` (white, amber or red by the memory thresholds) · `State` · `Command` (wide only, paths cut in the middle).
- The selected row gets a `surface0` background and a `▌` bar in magenta. Without color: reverse video.
- **Tree** (`t`): `├─` `└─` `│` guides in muted text; `▾` expanded, `▸` folded (`←→`).
- Empty filter result (S6): `No processes match "nodee" · Esc to clear`.

### 6.2 Detail drawer (`⏎`)
Opens at 40% width on the right of the proc box, showing name, pid/user/state, command, parent chain
(`launchd › Terminal › zsh › node`), running time and nice value.

### 6.3 Ports
`⏎` jumps to the owning process in proc (the filter is cleared). `x` kills the owner through the safety
dialogs. **The confirmation carries the pid shown**, and the core refuses if the port changed owner in the
meantime. When not root: `ℹ your processes only · sudo for all`.

### 6.4 Safety dialogs (tiers from BUILD_PLAN §8.6)

| Tier | Dialog |
|---|---|
| own | `Stop process?` · name · pid · user · `y stop  Esc cancel` |
| system | `Kill a system process` · warning · **type the exact name** · `⏎ kill` only once it matches |
| managed | `api is managed by StackPilot` · auto-restart warning · `m stop via manager` (a clean stop, no restart) · `y kill anyway` |
| blocked | `Can't do that` · reason · `Esc ok` (no confirm option) |
| renice | `Change priority` · prefilled with the current nice value · range -20…20 checked |

Dialogs float in the center with a `mantle` background. The border is red for kill dialogs and magenta for
the others; each key in the dialog's key line is cyan. `Esc` always cancels.

### 6.5 Stack box (managed)
- One line per process: selection bar, status glyph (§3.4), name, what the status means, and CPU for a live
  process: `ready :3000` (the port, or an http check's port), `ready` (log check), `up 2m 5s` (no check),
  `starting 4s`, `not ready :3000`, `retry 3 in 4s`, `crashed (exit 1)`, `errored (exit 2)`,
  `blocked by db, cache`, `stopping…`, `stopped`, `exited (exit 0)`, `idle`. Errors are red, `unready` and
  `blocked` amber, `restarting` yellow; the rest is secondary text.
- A process the leak detector suspects (`leakSuspect`, `core/sampler/leak.js`) ends its row with `▲ leak?` in
  amber. The mark takes room from the status label first, then the cpu column. It is advisory: nothing is
  stopped, and the store's `leak:<id>` alert lights CAUTION.
- The title is `stack`, with the running count (`3/4`); the header strip names the stack (§4.3).
- Empty states: no stack (S2) → `No stack here` · `stackpilot init · n add a process`. Invalid config (S3) →
  `✕ config has N problems` and the first problems with their paths (`stackpilot pm` prints all of them and
  exits 2). A fresh package.json project → `package.json: N scripts` · `⏎ pick the ones to run`.

### 6.6 Stack dialogs

| Dialog | Content |
|---|---|
| Quit (S12) | `Stop N running processes and quit?` · `y stop and quit  Esc cancel`; then `Stopping the stack` lists each process (`◌ stopping…` → `✓ stopped`) in stop order until StackPilot exits. Quitting with nothing running doesn't ask |
| Left running (S13) | Shown first on start when a previous StackPilot was killed hard: `N processes from a previous StackPilot are still running`, each with its pid · `s stop them  Esc leave them running`. The stack waits for the answer |
| New process (`n`) | `name: command`, or just a command (the name is derived) · `⏎ start`. `w` later saves it to stackpilot.json |
| Environment (`e`) | The variables the stack adds (envFile + inline), values masked `••••••••` until `r` |
| Script picker | package.json scripts with checkboxes, long-running ones (`dev`, `start`, `watch`…) preselected · `␣ toggle  ⏎ start  w start + save`. Opens by itself in `stackpilot pm` |

### 6.7 Logs panel
- The selected process's output, newest at the bottom: `HH:MM:SS text`. A yellow `▎` marks stderr; StackPilot's
  own lines (`[stackpilot] …`) are muted. `v` interleaves every process by time with a name column.
- **Following** (`following ●`) shows the newest lines. `PgUp`/`g` pause it: the view stays put while new
  lines arrive and the title counts them (`paused · 12 new`). `PgDn` past the newest line, `G` or `f`
  follow again. Selecting another process follows its output.
- **Search** (`/`): substring or `/regex/`, case-insensitive. The title shows `/query` and the match count,
  and matches are highlighted in cyan. `⏎` keeps the search, and `Esc` clears it (a second `Esc` goes back
  to proc). An invalid pattern shows its error instead of lines.
- Output is shown as plain text: color codes and terminal control sequences are removed, so a child can't
  move the cursor, retitle the terminal or break the layout. Saved log files keep the original bytes.

### 6.8 Stack details (`⏎` in the stack box)
- Opens beside the logs, at 40% of the big panel and at least 30 columns (the whole panel when that would
  leave the logs under 24), with an idle-grey border. It follows the selection (`↑↓`); `Esc` closes it, as does leaving the stack box.
- Rows, top first: the name and `● status`; `pid · up 2m` (or `not running`); `ready` (target, kind, `✓` when
  ready), `needs` (dependsOn), `port` (listeners linked to it), `restart` (policy); `crashes` (`n in 5m ·
  last exit 1`, then how long ago); `memory` (now, amber with `▲ leak?` when suspected), a one-row sparkline
  of the last 10 minutes averaged to the width, and the change (`+180 MB in 10 min`). The sparkline and
  change wait for a minute of samples (`collecting… (first minute)`): two points are not a trend.
- Rows that don't fit go from the bottom; the key line (`p show in proc   Esc close`) always stays.

## 7. States (each has a UI test)

| # | State | Presentation |
|---|---|---|
| S1 | First sample pending | Figures show `—`, graphs are empty, and the cpu title says `sampling…` |
| S4 | A data source failed | A warn line at the top: `ports unavailable · ss not found · run stackpilot doctor`. Other boxes keep working |
| S5 | Ports partial | Info line in the ports box |
| S6 | Filter has no matches | Message in the proc box |
| S9 | Terminal too small | Centered size message |
| S10/S11 | Action failed / succeeded | A toast in the proc border (danger 6 s / muted 3 s) |
| S14 | No color | Attributes, glyphs and block-character graphs only |
| S2 | No stack here | Stack box empty state (§6.5) |
| S3 | Invalid config | Stack box lists the problems; `stackpilot pm` prints them and exits 2 |
| S7 | A managed process restarting | `↻ retry 3 in 4s` in the stack box, and `↻ name n in 5m` in the header (§4.3) |
| S8 | A process gave up (`maxRestarts`) | Danger line at the top: `api stopped after 11 crashes (last exit 1) · see its logs · L show logs` |
| S12 | Quit with processes running | Quit dialog, then the stop progress (§6.6) |
| S13 | Processes left by a previous session | The left-running dialog (§6.6) |

## 8. Motion and refresh
Values update in place once per tick. Nothing flashes or blinks, and nothing animates: a starting process
shows `◌ starting 4s`, counting up each tick. The several store commits of one tick are coalesced into a
single render. New log lines reach the screen within 250 ms, in batches.

## 9. Formatting rules

| Value | Rule | Examples |
|---|---|---|
| CPU % | 1 decimal place, right-aligned | `  3.1` ` 58.4` |
| Memory | Under 1024 MB → integer MB, otherwise 1 decimal in GB | `90 MB` `1.2 GB` |
| Durations | The two largest units | `45s` `12m 3s` `3h 4m` `3d 4h` |
| Unknown | Em dash, muted | `—` |
| Truncation | Names cut at the end, paths in the middle | `Chrome Helper (Rend…` `~/code/…/server` |

## 10. Accessibility
Glyph + label on every status. Text contrast of at least 4.5:1 against `base` (tested). `NO_COLOR` is
respected. Everything works from the keyboard. Nothing blinks.

## 11. Review checklist (every UI change)
- [ ] Semantic tokens only, with no hex values in components.
- [ ] Every ranged figure has a gauge or graph; its readout stays white unless it needs a look.
- [ ] Each color is used only for its job (§3.1); titles stay white and only the focused one is lit.
- [ ] The focused box shows 5 or fewer border keys, taken from `keymap.js`.
- [ ] Row order and selection stay stable across refreshes.
- [ ] Compact, standard and wide are checked, plus the too-small state and no-color.
- [ ] Destructive actions go through the matching safety dialog tier.
