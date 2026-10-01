// `stackpilot sm`: the interactive Monitor, or `--dump` for headless JSON snapshots.
const { createStackPilot } = require('../../core');
const { monitor } = require('./interactive');

const DEFAULT_INTERVAL_MS = 1000;
const TOP_PROCESSES = 10;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** One compact, JSON-safe snapshot of the store. */
function snapshot(state, tick) {
    return {
        tick,
        at: Date.now(),
        meta: state.meta,
        system: state.system,
        history: state.history,
        processCount: state.processes.length,
        topProcesses: state.processes.slice(0, TOP_PROCESSES),
        ports: state.ports,
        errors: state.errors,
    };
}

async function dump({ ticks, intervalMs }, io) {
    const stackpilot = createStackPilot({ intervalMs });
    try {
        for (let tick = 1; tick <= ticks; tick++) {
            await stackpilot.tick();
            io.stdout.write(`${JSON.stringify(snapshot(stackpilot.store.getState(), tick))}\n`);
            if (tick < ticks) await sleep(intervalMs);
        }
    } finally {
        await stackpilot.stop();
    }
    return 0;
}

/** @param {{ options: any }} parsed @param {{ stdout: any, stderr: any }} io */
async function sm(parsed, io) {
    const { dump: isDump, ticks } = parsed.options;
    const intervalMs = parsed.options.intervalMs ?? DEFAULT_INTERVAL_MS;
    if (isDump) return dump({ ticks, intervalMs }, io);
    return monitor(parsed, io);
}

module.exports = { sm, snapshot };
