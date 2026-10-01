#!/usr/bin/env node
// Generates the npm packages from the release binaries (the esbuild/Biome pattern):
//   stackpilot-tui                  the `stackpilot` launcher; one optionalDependency per platform
//   stackpilot-tui-<os>-<arch>      the standalone binary, restricted with os/cpu so npm picks one
//
//   node scripts/npm-packages.js <dir with stackpilot-<os>-<arch> binaries> <out dir>
//
// Every package has the same version and no install scripts. All four platforms must be present:
// publishing a partial set would break `npm i -g stackpilot-tui` on the missing ones.
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const root = require('../package.json');
const TARGETS = Object.freeze(['darwin-arm64', 'darwin-x64', 'linux-x64', 'linux-arm64']);

const common = () => ({
    version: root.version,
    license: root.license,
    repository: root.repository,
    homepage: root.homepage,
    bugs: root.bugs,
});

const NPM_DIR = path.join(ROOT, 'packaging', 'npm');
const PLATFORMS = Object.freeze({
    'darwin-arm64': 'macOS on Apple Silicon (arm64)',
    'darwin-x64': 'macOS on Intel (x64)',
    'linux-x64': 'Linux on x64',
    'linux-arm64': 'Linux on arm64',
});
const REQUIREMENTS = Object.freeze({
    darwin: 'macOS 13 (Ventura) or newer.',
    linux: 'A glibc-based distribution (Debian, Ubuntu, Fedora, Amazon Linux and most others). musl-based ones such as Alpine are not supported.',
});

/** packaging/npm/platform-README.md filled in for one target; fails on a placeholder left unfilled. */
function platformReadme(target, binary) {
    const packages = [
        '| Package | Platform |',
        '|---|---|',
        ...TARGETS.map((t) => {
            const name = `stackpilot-tui-${t}`;
            return t === target ? `| **${name}** (this package) | **${PLATFORMS[t]}** |` : `| [${name}](https://www.npmjs.com/package/${name}) | ${PLATFORMS[t]} |`;
        }),
    ].join('\n');
    const values = {
        name: `stackpilot-tui-${target}`,
        platform: PLATFORMS[target],
        requirements: REQUIREMENTS[target.split('-')[0]],
        size: `${Math.max(1, Math.round(fs.statSync(binary).size / 1048576))} MB`,
        packages,
    };
    const text = fs.readFileSync(path.join(NPM_DIR, 'platform-README.md'), 'utf-8')
        .replace(/\{\{(\w+)\}\}/g, (match, key) => values[key] ?? match);
    const left = text.match(/\{\{\w+\}\}/);
    if (left) throw new Error(`platform-README.md: no value for ${left[0]}`);
    return text;
}

function writePackage(dir, manifest, files) {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`);
    fs.copyFileSync(path.join(ROOT, 'LICENSE'), path.join(dir, 'LICENSE'));
    for (const [from, to, mode] of files) {
        fs.mkdirSync(path.dirname(path.join(dir, to)), { recursive: true });
        fs.copyFileSync(from, path.join(dir, to));
        if (mode) fs.chmodSync(path.join(dir, to), mode);
    }
}

/** @param {{ binaries: string, out: string }} dirs */
function generate({ binaries, out }) {
    const missing = TARGETS.filter((t) => !fs.existsSync(path.join(binaries, `stackpilot-${t}`)));
    if (missing.length) throw new Error(`missing ${missing.map((t) => `stackpilot-${t}`).join(', ')} in ${binaries}`);
    fs.rmSync(out, { recursive: true, force: true });
    for (const target of TARGETS) {
        const [os, cpu] = target.split('-');
        writePackage(path.join(out, `stackpilot-tui-${target}`), {
            name: `stackpilot-tui-${target}`,
            description: `The stackpilot binary for ${target} (installed by stackpilot-tui)`,
            ...common(),
            os: [os],
            cpu: [cpu],
            files: ['bin/stackpilot', 'README.md', 'LICENSE'],
        }, [[path.join(binaries, `stackpilot-${target}`), 'bin/stackpilot', 0o755]]);
        const binary = path.join(binaries, `stackpilot-${target}`);
        fs.writeFileSync(path.join(out, `stackpilot-tui-${target}`, 'README.md'), platformReadme(target, binary));
    }
    writePackage(path.join(out, 'stackpilot-tui'), {
        name: 'stackpilot-tui',
        description: root.description,
        ...common(),
        keywords: root.keywords,
        bin: { stackpilot: 'bin/stackpilot.js' },
        files: ['bin/stackpilot.js', 'README.md', 'LICENSE'],
        engines: { node: '>=18' },
        os: root.os,
        optionalDependencies: Object.fromEntries(TARGETS.map((t) => [`stackpilot-tui-${t}`, root.version])),
    }, [
        [path.join(NPM_DIR, 'launcher.js'), 'bin/stackpilot.js', 0o755],
        // The npm README, written for people installing the package (the repository README is for contributors).
        [path.join(NPM_DIR, 'README.md'), 'README.md'],
    ]);
    return TARGETS.map((t) => `stackpilot-tui-${t}`).concat('stackpilot-tui');
}

if (require.main === module) {
    const [binaries, out] = process.argv.slice(2);
    if (!binaries || !out) {
        process.stderr.write('usage: node scripts/npm-packages.js <binaries dir> <out dir>\n');
        process.exit(2);
    }
    try {
        for (const name of generate({ binaries: path.resolve(binaries), out: path.resolve(out) })) process.stdout.write(`${name}\n`);
    } catch (err) {
        process.stderr.write(`npm-packages: ${err.message}\n`);
        process.exit(1);
    }
}

module.exports = { generate, TARGETS };
