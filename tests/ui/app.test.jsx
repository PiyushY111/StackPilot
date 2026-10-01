// Frame tests for the glass-cockpit dashboard against UI_SPEC v3 (§4–§7).
import { afterEach, expect, test } from 'bun:test';
import { PALETTE } from '../../ui/theme/tokens.js';
import { setup, teardown, frame, keys, press, colorOf, allColors, managedEntry, PROCS } from './helpers.jsx';

afterEach(teardown);

const BRAILLE = /[⠁-⣿]/;

// ---------- boxes (§4.1) ----------

test('the dashboard shows the cpu, mem, ports and proc boxes', async () => {
    const { ui } = await setup();
    const out = await frame(ui);
    for (const title of ['cpu', 'mem', 'ports', 'proc']) expect(out).toMatch(new RegExp(`┌─ ${title} `));
    expect(out).toContain('load 1.2 1.4 1.1');
    expect(out).toContain('up 3d 4h');
});

test('cpu box: braille history graph, total, and a gradient meter per core', async () => {
    const { ui } = await setup();
    const out = await frame(ui);
    expect(out).toMatch(BRAILLE);
    expect(out).toContain('CPU 42%');
    for (const core of ['C0', 'C1', 'C2', 'C3']) expect(out).toContain(core);
    expect(out).toContain('80%');
    // An 80% core meter shows every gradient color, ending in red (UI_SPEC §3.2).
    const colors = allColors(ui);
    for (const c of [PALETTE.green, PALETTE.yellow, PALETTE.amber, PALETTE.red]) expect(colors.has(c)).toBe(true);
});

test('mem box: used, cache, free and swap meters with sizes', async () => {
    const { ui } = await setup();
    const out = await frame(ui);
    for (const label of ['Used', 'Cache', 'Free', 'Swap']) expect(out).toContain(label);
    expect(out).toContain('8.2 GB');
    expect(out).toContain('3.1 GB');
});

test('S1: before the first sample the cpu title says sampling… and figures show —', async () => {
    const { ui } = await setup({ system: null, procs: null });
    const out = await frame(ui);
    expect(out).toContain('sampling…');
    expect(out).toContain('—');
});

test('the focused box shows its keys in the bottom border, plus ? help and q quit', async () => {
    const { ui } = await setup();
    const out = await frame(ui);
    expect(out).toContain('↑↓ select');
    expect(out).toContain('x kill');
    expect(out).toContain('? help');
    expect(out).toContain('q quit');
});

test('Tab moves focus proc → managed → ports; each border shows its keys', async () => {
    const { ui, store } = await setup();
    expect(await press(ui, 'tab')).toContain('s start');
    expect(store.getState().ui.focus).toBe('managed');
    const out = await press(ui, 'tab');
    expect(store.getState().ui.focus).toBe('ports');
    expect(out).toContain('x kill owner');
    await press(ui, 'tab');
    expect(store.getState().ui.focus).toBe('proc');
});

test('? opens the help generated from the keymap; Esc closes it', async () => {
    const { ui } = await setup();
    const help = await keys(ui, '?');
    expect(help).toMatch(/┌─ keys ─/);
    expect(help).toContain('r renice');
    expect(help).toContain('Everywhere');
    expect(await press(ui, 'escape')).not.toMatch(/┌─ keys ─/);
});

test('S9: a terminal below 60×16 shows the size message', async () => {
    const { ui } = await setup({ width: 50, height: 14 });
    expect(await frame(ui)).toContain('StackPilot needs 60×16 — currently 50×14');
});

test('S4 and alerts: problems appear as lines above the boxes while everything keeps working', async () => {
    const { ui, store } = await setup();
    store.reportError('ports', new Error('ss not found on this system'));
    store.addAlert({ id: 'leak:api', level: 'warn', source: 'managed:api', message: 'api memory keeps rising (possible leak)' });
    const out = await frame(ui);
    expect(out).toContain('ports unavailable · ss not found on this system');
    expect(out).toContain('api memory keeps rising');
    expect(out).toContain('node');
});

// ---------- proc table (§6.1) ----------

test('proc lists processes by CPU with sort and count in its title', async () => {
    const { ui } = await setup();
    const out = await frame(ui);
    expect(out).toContain('sort: cpu ↓');
    expect(out).toContain('6 processes');
    expect(out).toContain('PID');
    expect(out.indexOf('Chrome Helper')).toBeLessThan(out.indexOf('node'));
});

test('CPU% and memory figures stay white until they need a look (the dark cockpit)', async () => {
    const { ui } = await setup();
    await frame(ui);
    expect(colorOf(ui, '58.4')).toBe(PALETTE.amber); // 50–75 %: the high band
    expect(colorOf(ui, '12.1')).toBe(PALETTE.text); // < 25 %: normal is quiet
    expect(colorOf(ui, '1.2 GB')).toBe(PALETTE.amber); // between the memory warn and danger thresholds
    expect(colorOf(ui, '412 MB')).toBe(PALETTE.text);
});

test('s cycles the sort key and S reverses it', async () => {
    const { ui } = await setup();
    expect(await keys(ui, 's')).toContain('sort: mem ↓');
    expect(await keys(ui, 'S')).toContain('sort: mem ↑');
});

test('/ filters live, ⏎ keeps the filter, Esc clears it; S6 when nothing matches', async () => {
    const { ui, store } = await setup();
    await keys(ui, '/node');
    await press(ui, 'enter');
    expect(await frame(ui)).toContain('filter: node');
    expect(store.getState().processes.map((p) => p.pid)).toEqual([812]);
    await keys(ui, '/e');
    const out = await press(ui, 'enter');
    expect(out).toContain('No processes match "nodee" · Esc to clear');
    await press(ui, 'escape');
    expect(store.getState().ui.filterQuery).toBe('');
});

test('the selection stays on the same process across refreshes, and ↓ moves it', async () => {
    const { ui, store, actions } = await setup();
    actions.select(812);
    store.setProcesses(PROCS.map((p) => (p.pid === 812 ? { ...p, cpu: 99 } : p)));
    await frame(ui);
    expect(store.getState().ui.selectedPid).toBe(812);
    await press(ui, 'down');
    expect(store.getState().ui.selectedPid).not.toBe(812);
});

test('breakpoints: compact hides User, wide adds Command', async () => {
    const compact = await setup({ width: 80, height: 24 });
    expect(await frame(compact.ui)).not.toContain('User');
    await teardown();
    const wide = await setup({ width: 160, height: 50 });
    expect(await frame(wide.ui)).toContain('Command');
});

test('t switches to the tree with guide lines, and folding works', async () => {
    const { ui, store, actions } = await setup();
    let out = await keys(ui, 't');
    expect(store.getState().ui.monitorView).toBe('tree');
    expect(out).toMatch(/[├└]─/);
    actions.select(300);
    out = await press(ui, 'left');
    expect(store.getState().ui.collapsedPids).toEqual([300]);
    expect(out).toContain('▸');
});

test('⏎ opens the detail drawer with the parent chain; Esc closes it', async () => {
    const { ui, actions } = await setup();
    actions.select(812);
    const out = await press(ui, 'enter');
    expect(out).toContain(' details ');
    expect(out).toContain('launchd › Terminal › zsh › node');
    expect(await press(ui, 'escape')).not.toContain(' details ');
});

// ---------- ports (§6.3) ----------

test('ports box lists listeners with the managed badge and the partial notice (S5)', async () => {
    const ports = { items: [{ port: 3000, address: '127.0.0.1', proto: 'tcp', pid: 812, name: 'node', managedId: null }], partial: true };
    const { ui, store } = await setup({ ports });
    store.upsertManaged({ id: 'api', pid: 812 });
    const out = await frame(ui);
    expect(out).toContain(':3000');
    expect(out).toContain('◆api');
    expect(out).toContain('yours only · sudo for all');
});

test('⏎ on a port jumps to its owner in proc', async () => {
    const ports = { items: [{ port: 3000, address: '127.0.0.1', proto: 'tcp', pid: 812, name: 'node' }], partial: false };
    const { ui, store, actions } = await setup({ ports });
    actions.setFocus('ports');
    await press(ui, 'enter');
    expect(store.getState().ui.focus).toBe('proc');
    expect(store.getState().ui.selectedPid).toBe(812);
});

test('kill by port signals the owner you confirmed, and refuses if the port changed hands meanwhile', async () => {
    const ports = { items: [{ port: 3000, address: '127.0.0.1', proto: 'tcp', pid: 812, name: 'node' }], partial: false };
    const { ui, store, actions, signals } = await setup({ ports });
    actions.setFocus('ports');
    expect(await keys(ui, 'x')).toContain('node · pid 812 · alice');
    await keys(ui, 'y');
    expect(signals).toEqual([['kill', 812, 'SIGTERM']]);
    await keys(ui, 'x');
    store.setPorts({ items: [{ port: 3000, address: '127.0.0.1', proto: 'tcp', pid: 300, name: 'Terminal' }], partial: false });
    const out = await keys(ui, 'y');
    expect(signals).toEqual([['kill', 812, 'SIGTERM']]);
    expect(out).toContain('changed since you confirmed');
});

// ---------- safety dialogs (§6.4) ----------

test('own process: one-key confirm, then a toast (S11)', async () => {
    const { ui, actions, signals } = await setup();
    actions.select(812);
    const dialog = await keys(ui, 'x');
    expect(dialog).toContain('Stop process?');
    expect(dialog).toContain('node · pid 812 · alice');
    const out = await keys(ui, 'y');
    expect(signals).toEqual([['kill', 812, 'SIGTERM']]);
    expect(out).toContain('Sent SIGTERM to node (812)');
});

test('system process: only the exact typed name confirms', async () => {
    const { ui, actions, signals } = await setup();
    actions.select(99);
    expect(await keys(ui, 'X')).toContain('Kill a system process');
    await keys(ui, 'windowserver');
    await press(ui, 'enter');
    expect(signals).toEqual([]);
    for (let i = 0; i < 'windowserver'.length; i++) await press(ui, 'backspace');
    await keys(ui, 'WindowServer');
    await press(ui, 'enter');
    expect(signals).toEqual([['kill', 99, 'SIGKILL']]);
});

test('blocked process: no way to confirm', async () => {
    const { ui, actions, signals } = await setup();
    actions.select(1);
    const out = await keys(ui, 'x');
    expect(out).toContain("Can't do that");
    expect(out).toContain('pid 1 (launchd) is protected');
    await keys(ui, 'y');
    await press(ui, 'enter');
    expect(signals).toEqual([]);
});

test('Esc always cancels a dialog without signalling', async () => {
    const { ui, actions, signals } = await setup();
    actions.select(812);
    await keys(ui, 'x');
    expect(await press(ui, 'escape')).not.toContain('Stop process?');
    expect(signals).toEqual([]);
});

test('renice: prefilled value, success, and a readable error toast (S10)', async () => {
    const { ui, actions, signals } = await setup();
    actions.select(812);
    expect(await keys(ui, 'r')).toContain('Change priority');
    await press(ui, 'backspace');
    await keys(ui, '10');
    await press(ui, 'enter');
    await frame(ui);
    expect(signals).toEqual([['renice', 812, 10]]);
    await keys(ui, 'r');
    await press(ui, 'backspace');
    await keys(ui, '-5');
    await press(ui, 'enter');
    await new Promise((r) => setTimeout(r, 10));
    expect(await frame(ui)).toContain('needs sudo');
});

test('a managed process offers stop via manager (M3) or kill anyway', async () => {
    const { ui, store, actions } = await setup();
    store.upsertManaged({ id: 'api', pid: 812 });
    actions.select(812);
    const out = await keys(ui, 'x');
    expect(out).toContain('api is managed by StackPilot');
    expect(out).toContain('kill anyway');
});

// ---------- colors (§3) ----------

test('S14: with NO_COLOR nothing uses palette colors and graphs fall back to blocks', async () => {
    const { ui } = await setup({ depth: 'none' });
    const out = await frame(ui);
    expect(out).toContain('node');
    expect(out).not.toMatch(BRAILLE);
    const palette = new Set(Object.values(PALETTE));
    expect([...allColors(ui)].filter((c) => palette.has(c))).toEqual([]);
});

test('truecolor paints the app background black; 256-color leaves it to the terminal', async () => {
    // RGBA: a painted black background is opaque; an unpainted one is transparent (the terminal's own).
    const bgAt = (ui) => ui.captureSpans().lines[1].spans[0].bg.toInts();
    const tc = await setup({ depth: 'truecolor' });
    await frame(tc.ui);
    const bgTrue = bgAt(tc.ui);
    await teardown();
    const c256 = await setup({ depth: '256' });
    await frame(c256.ui);
    expect(bgTrue).toEqual([0, 0, 0, 255]);
    expect(bgAt(c256.ui)[3]).toBe(0);
});

test('q quits', async () => {
    const { ui, quits } = await setup();
    await keys(ui, 'q');
    await new Promise((r) => setTimeout(r, 5));
    expect(quits()).toBe(1);
});

// ---------- header strip and annunciator (§4.3) ----------

/** Background color (hex) of the first span containing `needle`. */
function bgOf(ui, needle) {
    for (const line of ui.captureSpans().lines) {
        const span = line.spans.find((s) => s.text.includes(needle));
        if (span) return `#${span.bg.toInts().slice(0, 3).map((n) => Math.round(n).toString(16).padStart(2, '0')).join('')}`;
    }
    return null;
}

test('the header names the app, the stack and its readiness, and the machine', async () => {
    const { ui } = await setup({
        stack: { name: 'myapp', errors: [], scripts: null },
        managed: [managedEntry('db', { status: 'running', pid: 900 }), managedEntry('api', { status: 'starting', pid: 901, startedAt: Date.now() })],
    });
    const top = (await frame(ui)).split('\n')[0];
    expect(top).toContain('StackPilot');
    expect(top).toContain('myapp');
    expect(top).toContain('1/2 ready');
    expect(top).toContain('mbp · darwin arm64');
});

test('the system monitor header says so instead of naming a stack', async () => {
    const { ui } = await setup({ env: { managerAvailable: false } });
    expect((await frame(ui)).split('\n')[0]).toContain('system monitor');
});

test('the annunciator is dark when all is normal, CAUTION for a warning and WARNING for danger', async () => {
    const { ui, store } = await setup();
    const top = async () => (await frame(ui)).split('\n')[0];
    expect(await top()).not.toMatch(/CAUTION|WARNING/);
    store.addAlert({ id: 'leak:api', level: 'warn', message: 'api memory keeps growing' });
    expect(await top()).toContain(' CAUTION 1 ');
    expect(bgOf(ui, 'CAUTION')).toBe(PALETTE.amber);
    store.addAlert({ id: 'errored:worker', level: 'danger', message: 'worker errored' });
    expect(await top()).toContain(' WARNING 1 ');
    expect(bgOf(ui, 'WARNING')).toBe(PALETTE.red);
});

test('only the focused box lights its title, and key hints are cyan', async () => {
    const { ui } = await setup();
    await frame(ui);
    expect(bgOf(ui, ' proc ')).toBe(PALETTE.magenta);
    expect(colorOf(ui, ' mem ')).toBe(PALETTE.text);
    expect(colorOf(ui, '↑↓')).toBe(PALETTE.cyan);
});
