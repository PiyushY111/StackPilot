# Changelog

All notable changes to StackPilot are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-10-01

The first release, for macOS and Linux on arm64 and x64.

### Added

- **Dashboard** (`stackpilot`, `stackpilot sm`): a glass-cockpit view with a braille CPU graph and a gauge
  per core, memory and swap gauges, listening TCP ports, and a process table and tree with filter, sort,
  a details drawer, kill and renice. A header strip shows the stack's readiness, recent crashes, and a
  master CAUTION/WARNING annunciator that stays dark while everything is normal.
- **Process manager** (`stackpilot pm`):
  - Starts a stack from `stackpilot.json`, a Procfile or package.json scripts, in dependency order.
  - Readiness checks (port, HTTP, log line) and restart policies with backoff and `maxRestarts`.
  - Env files, saved and rotated logs, a searchable live logs panel, and ad-hoc processes.
  - Resource use summed per process tree, and a memory-leak hint (`▲ leak?`).
  - A details panel per process (`⏎`): readiness, dependencies, ports, restart policy, recent crashes,
    and its memory over the last ten minutes.
- **Safety:** tiered confirmations for kill and renice (own, managed, other users' and system
  processes; StackPilot itself and PID 1 are blocked), enforced in the core.
- **Crash recovery:** after a hard kill, the next start finds the processes left running (verified by
  start time) and offers to stop them before starting the stack again.
- **Commands:** `stackpilot init` (writes `stackpilot.json` from what the project has), `stackpilot import pm2`,
  `stackpilot doctor` (checks the machine, terminal and config) and `stackpilot update` (checksum- and
  version-verified self-update for standalone installs).
- **Native macOS sampling** through Bun's FFI (libproc and Mach), and a `/proc` sampler on Linux that
  reads one file per process per tick.
- **Install:** `npm install -g stackpilot-tui` (a launcher plus one standalone binary per platform, no
  install scripts, published with npm provenance), a checksum-verifying `curl | sh` installer, and
  release archives with `SHA256SUMS` and GitHub build attestations.

[Unreleased]: https://github.com/PiyushY111/StackPilot/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/PiyushY111/StackPilot/releases/tag/v0.1.0
