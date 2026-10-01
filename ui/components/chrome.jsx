// The header strip, the lines under it (failing sources, alerts) and the too-small screen (UI_SPEC §4.3, §7).
import { useTheme } from '../theme/context.js';
import { paint, chip } from '../theme/paint.js';
import { Tone } from './primitives.jsx';
import { MIN_WIDTH, MIN_HEIGHT } from '../logic/layout.js';
import { readySummary, crashSummary, CRASH_CAUTION } from '../logic/managed.js';
import { truncateEnd } from '../logic/format.js';
import { GLYPHS } from '../theme/tokens.js';

export const HEADER_HEIGHT = 1;

/**
 * The master annunciator, dark when all is normal (the "dark cockpit"): WARNING for a danger alert,
 * CAUTION for a warning, a failing data source, or a process crashing repeatedly (`crashes`, from
 * crashSummary). Null when there is nothing to say.
 */
export function annunciator(errors, alerts, crashes = null) {
    const danger = alerts.filter((a) => a.level === 'danger').length;
    if (danger) return { text: ` WARNING ${danger} `, role: 'danger' };
    const crashing = crashes && crashes.count >= CRASH_CAUTION ? 1 : 0;
    const caution = alerts.length - danger + Object.keys(errors).length + crashing;
    return caution ? { text: ` CAUTION ${caution} `, role: 'warn' } : null;
}

/** `↻ worker 3 in 5m`: who crashed most in the last five minutes, amber once it lights CAUTION. */
const crashParts = (crashes) => (crashes
    ? [{ text: '   ', role: 'muted' }, { text: `↻ ${crashes.id} ${crashes.count} in 5m`, role: crashes.count >= CRASH_CAUTION ? 'warn' : 'transient' }]
    : []);

/** What the stack is doing, as `myapp ● 3/4 ready`, or what to do without one. */
function stackParts(state) {
    const { managed, stack } = state;
    const name = stack.name || 'no stack';
    if (!managed.length) return [{ text: name, role: stack.errors.length ? 'danger' : 'secondary' }];
    const ready = readySummary(managed);
    const all = managed.every((m) => m.status === 'running');
    return [
        { text: name, role: 'primary', bold: true },
        { text: '  ', role: 'muted' },
        { text: all ? '● ' : '◌ ', role: all ? 'ok' : 'warn' },
        { text: `${ready} ready`, role: 'secondary' },
    ];
}

/**
 * One line across the top: the name, the annunciator, the stack (or "system monitor") with any recent
 * crashes, and the machine on the right. The right side gives way first when the terminal is narrow.
 */
export function Header({ state, env, width, now }) {
    const theme = useTheme();
    const crashes = env.managerAvailable ? crashSummary(state.managed, now) : null;
    const lit = annunciator(state.errors, state.alerts, crashes);
    const left = [
        { text: ' StackPilot ', role: 'primary', bold: true },
        ...(lit ? [{ text: ' ', role: 'muted' }, { text: lit.text, chip: lit.role }] : []),
        { text: '   ', role: 'muted' },
        ...(env.managerAvailable ? [...stackParts(state), ...crashParts(crashes)] : [{ text: 'system monitor', role: 'secondary' }]),
    ];
    const { hostname, platform, arch } = state.meta;
    const machine = `${hostname ? `${hostname} · ` : ''}${platform} ${arch} `;
    const used = left.reduce((n, p) => n + p.text.length, 0);
    const room = width - used;
    const right = room > machine.length + 2 ? machine : '';
    return (
        <box height={HEADER_HEIGHT} width={width} backgroundColor={theme.bg.bar}>
            <text wrapMode="none">
                {left.map((p, i) => (
                    <span key={i} {...(p.chip ? chip(theme, p.chip) : paint(theme, p.role, { bold: p.bold }))}>{truncateEnd(p.text, Math.max(0, width))}</span>
                ))}
                <span>{' '.repeat(Math.max(0, room - right.length))}</span>
                <Tone role="muted">{right}</Tone>
            </text>
        </box>
    );
}

const MAX_ALERT_LINES = 2;

/** How many lines `Banners` will draw, so the dashboard can take the rest of the height. */
export function bannerCount(errors, alerts) {
    return Object.keys(errors).length + Math.min(MAX_ALERT_LINES, alerts.length);
}

/** One line per failing data source (S4) and per alert; the boxes below keep working. */
export function Banners({ errors, alerts }) {
    const theme = useTheme();
    const sources = Object.entries(errors);
    const shown = alerts.slice(0, MAX_ALERT_LINES);
    if (!sources.length && !shown.length) return null;
    return (
        <box flexDirection="column" paddingLeft={1}>
            {sources.map(([source, err]) => (
                <text key={source} {...paint(theme, 'warn')}>
                    {GLYPHS.alertWarn} {source} unavailable · {err.message} · run stackpilot doctor
                </text>
            ))}
            {shown.map((a) => (
                <text key={a.id} {...paint(theme, a.level === 'danger' ? 'danger' : 'warn')}>
                    {a.level === 'danger' ? GLYPHS.alertDanger : GLYPHS.alertWarn} {a.message}{a.id.startsWith('errored:') ? ' · L show logs' : ''}
                </text>
            ))}
        </box>
    );
}

export function TooSmall({ width, height }) {
    return (
        <box width={width} height={height} justifyContent="center" alignItems="center">
            <text>
                <Tone role="warn">
                    StackPilot needs {MIN_WIDTH}×{MIN_HEIGHT} — currently {width}×{height}
                </Tone>
            </text>
        </box>
    );
}
