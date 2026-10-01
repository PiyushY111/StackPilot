import cli from '@/generated/cli.json';

/** "stackpilot 0.1.1" (captured from the real CLI --version) → "0.1.1". */
export const VERSION = cli.version.replace(/^(?:kestrel|stackpilot)\s+/, '');

export const SITE = {
    name: 'StackPilot',
    url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://stackpilot.vercel.app',
    tagline: 'A system monitor and a process manager in one terminal app, for macOS and Linux.',
    description:
        'StackPilot shows what is using your machine, the way htop and btop do, and starts and supervises your project’s processes, the way pm2 or foreman do. One binary for macOS and Linux.',
    repo: 'https://github.com/piyushy111/StackPilot',
    npm: 'https://www.npmjs.com/package/stackpilot',
} as const;

export const LINKS = {
    changelog: `${SITE.repo}/blob/main/CHANGELOG.md`,
    security: `${SITE.repo}/blob/main/SECURITY.md`,
    license: `${SITE.repo}/blob/main/LICENSE`,
    issues: `${SITE.repo}/issues`,
    releases: `${SITE.repo}/releases/latest`,
} as const;

export const INSTALL = {
    npm: 'npm install -g stackpilot',
    npx: 'npx stackpilot',
    curl: 'curl -fsSL https://raw.githubusercontent.com/piyushy111/StackPilot/main/packaging/install.sh | sh',
} as const;
