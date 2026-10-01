# Changelog

All notable changes to StackPilot are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **Breaking: the project is StackPilot, at [piyushy111/StackPilot](https://github.com/piyushy111/StackPilot).**
  The command is `stackpilot`, the npm package is `stackpilot-tui` (platform packages `stackpilot-tui-<os>-<arch>`),
  release archives are `stackpilot-v<version>-<os>-<arch>.tar.gz`, and Homebrew installs with
  `brew install piyushy111/tap/stackpilot`. The old names are no longer read: rename `kestrel.json` to
  `stackpilot.json` and `.kestrel/` to `.stackpilot/`, use `STACKPILOT_*` instead of `KESTREL_*` environment
  variables, and run `stackpilot` instead of `kestrel`.
- The dashboard has a new look (the glass cockpit, `docs/UI_SPEC.md` §3): white text while all is normal,
  green/amber/red for state, cyan for what you chose, magenta for what is active, square displays and
  tape gauges, and a header strip with a master CAUTION/WARNING annunciator.

### Added

- `⏎` in the stack box opens the details of a process: readiness, dependencies, ports, restart policy,
  recent crashes, and its memory over the last ten minutes. `p` shows it in the process table.
- A process the leak detector suspects is marked `▲ leak?` in the stack box.
- The header shows repeated crashes (`↻ worker 3 in 5m`) and lights CAUTION at three in five minutes.

### Fixed

- `stackpilot update` checks again that the downloaded binary reports exactly the release's version before
  installing it.
- The release build's smoke test expected the binary to report the old name and failed on every build.

### Removed

- The website (`website/`).

## [0.1.1] - 2026-09-29

### Fixed

- **npm package pages.** Every package now has a README written for npm: `stackpilot-tui` covers install,
  commands, keys, stacks, verification and troubleshooting, and each `stackpilot-tui-<os>-<arch>` package
  explains what it is and that `stackpilot-tui` installs it. In 0.1.0 the platform packages had no README
  and `stackpilot-tui` showed the pre-release repository README.
- `stackpilot --help` links to the documentation online instead of `docs/` paths that only exist in a
  source checkout.

## [0.1.0] - 2026-09-29

The first preview release, for macOS and Linux on arm64 and x64.

### Added

- **Dashboard** (`stackpilot`, `stackpilot sm`): a btop-style view with a braille CPU graph and per-core
  gradient meters, memory and swap meters, listening TCP ports, and a process table and tree with
  filter, sort, a details drawer, kill and renice.
- **Process manager** (`stackpilot pm`):
  - Starts a stack from `stackpilot.json`, a Procfile or package.json scripts, in dependency order.
  - Readiness checks (port, HTTP, log line) and restart policies with backoff and `maxRestarts`.
  - Env files, saved and rotated logs, a searchable live logs panel, and ad-hoc processes.
  - Resource use summed per process tree, and a memory-leak hint.
- **Safety:** tiered confirmations for kill and renice (own, managed, other users' and system
  processes; StackPilot itself and PID 1 are blocked), enforced in the core.
- **Crash recovery:** after a hard kill, the next start finds the processes left running (verified by
  start time) and offers to stop them before starting the stack again.
- **Commands:** `stackpilot init` (writes `stackpilot.json` from what the project has), `stackpilot import pm2`,
  `stackpilot doctor` (checks the machine, terminal and config) and `stackpilot update` (checksum-verified
  self-update for standalone installs).
- **Native macOS sampling** through Bun's FFI (libproc and Mach), and a `/proc` sampler on Linux that
  reads one file per process per tick.
- **Install:** `npm install -g stackpilot-tui` (a launcher plus one standalone binary per platform, no
  install scripts, published with npm provenance), a checksum-verifying `curl | sh` installer, and
  release archives with `SHA256SUMS` and GitHub build attestations.

[Unreleased]: https://github.com/piyushy111/StackPilot/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/piyushy111/StackPilot/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/piyushy111/StackPilot/releases/tag/v0.1.0
