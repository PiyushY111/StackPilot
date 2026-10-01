# Security policy

StackPilot can signal processes, runs the commands in a project's config, and replaces its own binary
when updating, so security reports are taken seriously.

## Supported versions

StackPilot is before 1.0. Fixes go into the latest release and `main`; older versions are not patched.

## Reporting a vulnerability

**Please don't open a public issue.** Report it privately through GitHub:
[Report a vulnerability](https://github.com/PiyushY111/StackPilot/security/advisories/new).

Include what you found, how to reproduce it (the StackPilot version and `stackpilot doctor` output help),
and what an attacker could achieve. You can expect:

- an acknowledgement within 7 days (StackPilot has a small maintainer team, so this is best effort);
- an assessment and a plan, or questions, after that;
- a fix and a coordinated disclosure, crediting you unless you prefer otherwise.

## What counts

In scope, for example:
- signalling or renicing a process the safety policy should have blocked or required confirmation for;
- child-process output reaching the terminal as control sequences (it must be shown as plain text);
- `stackpilot update` or `packaging/install.sh` installing a binary that doesn't match the release checksum;
- stopping a "left-over" process that StackPilot did not start (a reused pid);
- secrets from `.env` files ending up somewhere other than the managed process and its log file.

Working as designed:
- **Commands in `stackpilot.json`, a Procfile or package.json run with your privileges** when you start
  the stack. That is the same trust model as `npm run`. Review configs from untrusted repositories
  before running `stackpilot pm`. Plain `stackpilot` never starts anything on its own, and `stackpilot sm` never
  reads the config.
- `stackpilot import pm2` executes a `.js` ecosystem file (as pm2 does), but only after you confirm.
- Saved logs contain whatever your processes print. They are owner-only (0600) under `.stackpilot/`.

## How updates are verified

`stackpilot update` and the installer download over HTTPS from GitHub Releases and check each archive's
SHA-256 against the release's `SHA256SUMS` before installing. The update also runs the new binary once
and checks its version before replacing the old one. Because the checksum file comes from the same
release, this protects against corrupted or tampered downloads in transit. To authenticate the release
itself, every archive has a GitHub build attestation and every npm package has npm provenance, both
linking it to the workflow run and commit that built it:

```sh
gh attestation verify stackpilot-v<version>-<os>-<arch>.tar.gz --repo PiyushY111/StackPilot
npm audit signatures            # in a project with stackpilot-tui installed
```
