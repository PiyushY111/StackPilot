// Design tokens (UI_SPEC §3). This is the ONLY file with color values; components use semantic tokens.

/**
 * The glass cockpit (UI_SPEC §3.1): avionics display colors on a black screen. Each hue has one job,
 * as on a flight deck: white reads, green is normal, amber is caution, red is warning, cyan is what you
 * chose, magenta is what is active. Surfaces are cool, near-neutral greys, like an unlit display bezel.
 */
export const PALETTE = Object.freeze({
    base: '#000000',
    mantle: '#0e1013',
    surface0: '#1a1e23',
    surface1: '#2b3138',
    overlay0: '#6f7983',
    subtext: '#a7afb8',
    text: '#e6e8ea',
    green: '#5bd983',
    yellow: '#e2d65c',
    amber: '#ffaa33',
    red: '#ff5c5c',
    cyan: '#4fd1e8',
    magenta: '#f06be6',
});

/** Meaning → palette name (UI_SPEC §3.2). Color carries meaning, never decoration. */
export const SEMANTIC = Object.freeze({
    fg: { primary: 'text', secondary: 'subtext', muted: 'overlay0', inverse: 'base' },
    state: { ok: 'green', warn: 'amber', danger: 'red', transient: 'yellow', inactive: 'overlay0', info: 'cyan' },
    // focus: the active box and row. select: what you set (keys, sort, filter). managed: your processes.
    accent: { focus: 'magenta', select: 'cyan', managed: 'cyan' },
    // Gauge bands, low to high (ui/logic/charts.js GRADIENT_BANDS).
    gauge: { low: 'green', mid: 'yellow', high: 'amber', max: 'red' },
    bg: { app: 'base', bar: 'mantle', selected: 'surface0' },
    border: { idle: 'surface1', focus: 'magenta' },
});

/** Every status has a glyph, so color is never the only signal (UI_SPEC §3.4). */
export const STATUS_GLYPHS = Object.freeze({
    running: { glyph: '●', state: 'ok' },
    starting: { glyph: '◌', state: 'warn' },
    unready: { glyph: '◍', state: 'warn' },
    restarting: { glyph: '↻', state: 'transient' },
    crashed: { glyph: '✕', state: 'danger' },
    errored: { glyph: '✕', state: 'danger' },
    blocked: { glyph: '⊘', state: 'inactive' },
    stopping: { glyph: '◌', state: 'inactive' },
    stopped: { glyph: '○', state: 'inactive' },
    exited: { glyph: '○', state: 'inactive' },
    idle: { glyph: '○', state: 'inactive' },
});

export const GLYPHS = Object.freeze({
    managed: '◆',
    alertWarn: '▲',
    alertDanger: '■',
    info: 'ℹ',
    selection: '▌',
    stderr: '▎',
    folded: '▸',
    expanded: '▾',
    sortDesc: '↓',
    sortAsc: '↑',
});
