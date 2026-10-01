# {{name}}

**The `stackpilot` binary for {{platform}}, installed for you by [stackpilot-tui](https://www.npmjs.com/package/stackpilot-tui).**

[![npm version](https://img.shields.io/npm/v/{{name}}.svg)](https://www.npmjs.com/package/{{name}})
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/piyushy111/StackPilot/blob/main/LICENSE)

> **You don't need to install this package yourself.** Install StackPilot with
>
> ```sh
> npm install -g stackpilot-tui
> ```
>
> and npm adds this package automatically on {{platform}}.

## What StackPilot is

[StackPilot](https://github.com/piyushy111/StackPilot) is a system monitor and a process manager in one
terminal app, for macOS and Linux. It shows what is using your machine, the way htop and btop do, and
it starts and supervises your project's processes, the way pm2 or foreman do. The full documentation is
on the [stackpilot-tui](https://www.npmjs.com/package/stackpilot-tui) page.

## What this package contains

| File | |
|---|---|
| `bin/stackpilot` | The standalone executable ({{size}}): the Bun runtime, StackPilot and its terminal UI compiled into one file |
| `README.md`, `LICENSE` | This file and the MIT licence |

It has no dependencies and no install scripts: nothing runs while npm installs it.

## How it gets installed

`stackpilot-tui` lists one package per platform as an `optionalDependency`. Each declares its `os` and
`cpu`, so npm installs only the one that matches the machine and skips the rest:

{{packages}}

When you run `stackpilot`, the launcher in `stackpilot-tui` finds this binary and runs it with your terminal
attached, passing through the arguments, signals and exit code.

## Requirements

- {{requirements}}
- Node.js 18 or newer, only for the `stackpilot-tui` launcher; the binary itself doesn't use Node.

## Versioning

This package is published together with `stackpilot-tui` and always has exactly the same version, which
`stackpilot-tui` pins. Mixing versions is not supported; update with `npm install -g stackpilot-tui@latest`.

## Verifying it

Every release is built by GitHub Actions from a tagged commit of
[piyushy111/StackPilot](https://github.com/piyushy111/StackPilot) and published with
[npm provenance](https://docs.npmjs.com/generating-provenance-statements), which this page links to.
Check an install with `npm audit signatures`.

## Without npm

The same binary is attached to every [GitHub release](https://github.com/piyushy111/StackPilot/releases/latest)
with a `SHA256SUMS` file and build attestations, and installs with a checksum-verifying script:

```sh
curl -fsSL https://raw.githubusercontent.com/piyushy111/StackPilot/main/packaging/install.sh | sh
```

## Links

- StackPilot on npm: https://www.npmjs.com/package/stackpilot-tui
- Source and issues: https://github.com/piyushy111/StackPilot
- Changelog: https://github.com/piyushy111/StackPilot/blob/main/CHANGELOG.md
- Security policy: https://github.com/piyushy111/StackPilot/blob/main/SECURITY.md

## License

[MIT](https://github.com/piyushy111/StackPilot/blob/main/LICENSE) © 2026 Piyush Yadav
