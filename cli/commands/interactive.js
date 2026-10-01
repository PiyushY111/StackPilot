// Launches the interactive dashboard (`stackpilot`, `stackpilot sm`) after the checks the
// UI needs: a Bun runtime (OpenTUI's native core) and a real terminal.
const { createStackPilot } = require('../../core');
const { loadStack } = require('../../core/config');

function checkEnvironment(io) {
    if (!process.versions.bun) {
        return 'The interactive UI needs the StackPilot binary (or Bun ≥ 1.3).\nHeadless snapshot instead: stackpilot sm --dump\n';
    }
    if (!io.stdout.isTTY) {
        return 'StackPilot needs an interactive terminal. For scripts and pipes use: stackpilot sm --dump\n';
    }
    return null;
}

/**
 * @param {{ managerAvailable: boolean, focus?: string, startStack?: { only?: string[] } | null }} mode
 * @param {{ options: any }} parsed
 * @param {{ stdout: any, stderr: any, cwd: string, env: Record<string, any> }} io
 * @param {import('../../core/config').StackResult | null} [stack]  already loaded (pm) or loaded here (dashboard)
 */
async function runUi(mode, parsed, io, stack = undefined) {
    const problem = checkEnvironment(io);
    if (problem) {
        io.stderr.write(problem);
        return 1;
    }
    const loaded = !mode.managerAvailable ? null : stack !== undefined ? stack : loadStackQuietly(parsed, io.cwd);
    const stackpilot = createStackPilot({ intervalMs: parsed.options.intervalMs ?? undefined, stack: loaded, cwd: io.cwd });
    if (mode.focus) stackpilot.actions.setFocus(mode.focus);
    if (mode.startStack) {
        stackpilot.actions.startStack(mode.startStack).then((res) => {
            if (!res.ok) stackpilot.actions.notify('danger', res.error);
        });
    }
    // NODE_ENV must be decided at PROCESS START, never here: Bun picks the JSX transform (jsx vs
    // jsxDEV) at startup, so flipping React to production mid-run crashes with "jsxDEV is not a
    // function". `npm start` and the release build set NODE_ENV=production up front.
    // A literal specifier, so `bun build --compile` bundles the UI. It is imported lazily: JSX and
    // OpenTUI only load under Bun, after the checks above (never in the Node test run).
    // @ts-expect-error -- the UI is JSX, outside the type-checked core
    const { runInteractive } = await import('../../ui/main.jsx');
    return runInteractive({
        stackpilot,
        env: { managerAvailable: mode.managerAvailable },
        colorEnv: io.env,
        noColor: parsed.options.noColor,
    });
}

/** Plain `stackpilot` shows whatever stack is here; an unreadable one just means "no stack" (pm reports it). */
function loadStackQuietly(parsed, cwd) {
    if (parsed.options.config) return loadStack({ cwd, configPath: parsed.options.config });
    try {
        return loadStack({ cwd });
    } catch {
        return null;
    }
}

// `stackpilot` shows the stack idle (a starts it); `stackpilot sm` is the pure system monitor.
const dashboard = (parsed, io) => runUi({ managerAvailable: true }, parsed, io);
const monitor = (parsed, io) => runUi({ managerAvailable: false }, parsed, io);

module.exports = { dashboard, monitor, runUi, checkEnvironment };
