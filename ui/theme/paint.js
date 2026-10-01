// Turns a semantic role into span props. In no-color mode meaning moves from color to attributes
// (dim for quiet, bold for attention), so nothing depends on color alone (UI_SPEC §3.3, §10).
import { TextAttributes } from '@opentui/core';

const ROLE_PATHS = {
    primary: ['fg', 'primary'],
    secondary: ['fg', 'secondary'],
    muted: ['fg', 'muted'],
    ok: ['state', 'ok'],
    warn: ['state', 'warn'],
    danger: ['state', 'danger'],
    transient: ['state', 'transient'],
    inactive: ['state', 'inactive'],
    info: ['state', 'info'],
    focus: ['accent', 'focus'],
    select: ['accent', 'select'],
    managed: ['accent', 'managed'],
    gaugeLow: ['gauge', 'low'],
    gaugeMid: ['gauge', 'mid'],
    gaugeHigh: ['gauge', 'high'],
    gaugeMax: ['gauge', 'max'],
    faint: ['border', 'idle'],
};

const MONO_ATTRIBUTES = {
    muted: TextAttributes.DIM,
    inactive: TextAttributes.DIM,
    warn: TextAttributes.BOLD,
    danger: TextAttributes.BOLD | TextAttributes.UNDERLINE,
    focus: TextAttributes.BOLD,
    gaugeHigh: TextAttributes.BOLD,
    gaugeMax: TextAttributes.BOLD,
    faint: TextAttributes.DIM,
};

/**
 * @param {ReturnType<import('./capabilities.js').resolveTheme>} theme
 * @param {keyof typeof ROLE_PATHS} role
 * @param {{ bold?: boolean }} [options]
 */
export function paint(theme, role, { bold = false } = {}) {
    const [group, token] = ROLE_PATHS[role];
    const base = bold ? TextAttributes.BOLD : TextAttributes.NONE;
    if (theme.mono) return { fg: undefined, attributes: base | (MONO_ATTRIBUTES[role] ?? TextAttributes.NONE) };
    return { fg: theme[group][token], attributes: base };
}

/**
 * A lit chip: black text on the role's color, like an annunciator or the active display's title.
 * Reverse video without color.
 */
export function chip(theme, role) {
    if (theme.mono) return { fg: undefined, bg: undefined, attributes: TextAttributes.BOLD | TextAttributes.INVERSE };
    const [group, token] = ROLE_PATHS[role];
    return { fg: theme.fg.inverse, bg: theme[group][token], attributes: TextAttributes.BOLD };
}

/** Role for a VALUE at a threshold level: normal values stay neutral. */
export const valueRole = (level) => (level === 'danger' ? 'danger' : level === 'warn' ? 'warn' : 'primary');

/** Role for a status CARRIER (glyph, meter): ok is green. */
export const carrierRole = (level) => (level === 'danger' ? 'danger' : level === 'warn' ? 'warn' : 'ok');

/** Background/attributes for the selected row: surface color, or reverse video without color. */
export function selectedRow(theme) {
    return theme.mono ? { bg: undefined, attributes: TextAttributes.INVERSE } : { bg: theme.bg.selected, attributes: TextAttributes.NONE };
}

/** Gauge band (ui/logic/charts.gradientLevel) → role: green → yellow → amber → red (UI_SPEC §3.2). */
const GRADIENT_ROLES = { low: 'gaugeLow', mid: 'gaugeMid', high: 'gaugeHigh', max: 'gaugeMax', empty: 'faint' };
export const gradientRole = (level) => GRADIENT_ROLES[level] || 'primary';

/** Threshold level (core selectors.thresholdLevel) → role, for memory figures: quiet until it crosses one. */
export const thresholdRole = valueRole;

/**
 * A percentage READOUT (the number beside a gauge): white while normal, amber in the high band, red at max.
 * The gauge already shows the whole gradient; the dark cockpit lights a number only when it needs a look.
 */
export const readoutRole = (level) => (level === 'max' ? 'danger' : level === 'high' ? 'warn' : 'primary');
