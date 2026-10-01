const HELP = `stackpilot — system monitor and process manager for your terminal

Usage
  stackpilot                     Dashboard: this machine, plus this project's stack (idle until you start it)
  stackpilot sm                  System monitor (aliases: -sm, --sm)
  stackpilot pm                  Start this project's stack and open the process manager (-pm, --pm)
  stackpilot init                Create stackpilot.json from a Procfile or package.json scripts
  stackpilot import pm2 [file]   Convert a pm2 setup into stackpilot.json
  stackpilot doctor              Check this system, the terminal and the config
  stackpilot update [--check]    Update a standalone install to the latest release

Options
  --config <path>     Use this stackpilot.json instead of searching for one
  --only <a,b>        pm: start only these processes
  --interval <ms>     Refresh interval (250-60000, default 1000)
  --force             init/import: replace an existing stackpilot.json
  -y, --yes           init: take the defaults; import: agree to read a .js ecosystem file
  --no-color          Plain output (NO_COLOR is also respected)
  -h, --help          Show this help
  -v, --version       Show the version

Developer
  stackpilot sm --dump [--ticks N]   Print N JSON snapshots and exit (no UI)

Docs: https://github.com/PiyushY111/StackPilot  ·  config: https://github.com/PiyushY111/StackPilot/blob/main/docs/CONFIG.md
`;

/** @param {any} _parsed @param {{ stdout: { write: (s: string) => void } }} io */
function help(_parsed, io) {
    io.stdout.write(HELP);
    return 0;
}

module.exports = { help, HELP };
