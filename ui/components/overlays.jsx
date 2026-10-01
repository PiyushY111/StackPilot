// Floating panels: safety dialogs, the detail drawers and the help overlay (UI_SPEC §6.2, §6.4, §6.8).
import { useTheme } from '../theme/context.js';
import { Tone } from './primitives.jsx';
import { canSubmit } from '../logic/dialog.js';
import { formatDuration, formatMem, padEnd, truncateEnd, truncateMiddle } from '../logic/format.js';
import { memTrend, readyTarget, recentCrashes } from '../logic/managed.js';
import { sparkline } from '../logic/charts.js';
import { GLYPHS, STATUS_GLYPHS } from '../theme/tokens.js';

const DIALOG_WIDTH = 52;

export function Panel({ title, borderRole = 'focus', width, height, children, left, top }) {
    const theme = useTheme();
    const border = borderRole === 'danger' ? theme.state.danger : theme.border.focus;
    return (
        <box
            position="absolute"
            left={left}
            top={top}
            width={width}
            height={height}
            zIndex={10}
            border
            borderStyle="single"
            borderColor={border}
            title={` ${title} `}
            titleColor={border}
            backgroundColor={theme.bg.bar}
            flexDirection="column"
            paddingLeft={1}
            paddingRight={1}
        >
            {children}
        </box>
    );
}

export const Line = ({ children }) => <text wrapMode="none">{children}</text>;
export const Blank = () => <text> </text>;

/** A line of keys, e.g. `y stop   Esc cancel`: each key in cyan (what you can press), its word secondary. */
export function Keys({ text }) {
    const items = text.split(/\s{2,}/).filter(Boolean);
    return (
        <Line>
            {items.map((item, i) => {
                const [key, ...rest] = item.split(' ');
                return (
                    <span key={i}>
                        {i > 0 ? <Tone role="muted">{'   '}</Tone> : null}
                        <Tone role="select" bold>{key}</Tone>
                        {rest.length ? <Tone role="secondary"> {rest.join(' ')}</Tone> : null}
                    </span>
                );
            })}
        </Line>
    );
}

function dialogTitle(d) {
    if (d.kind === 'blocked') return "Can't do that";
    if (d.kind === 'renice') return 'Change priority';
    if (d.kind === 'managed') return `${d.managedId || d.name} is managed by StackPilot`;
    if (d.kind === 'typeName') return 'Kill a system process';
    return d.signal === 'SIGKILL' ? 'Force kill process?' : 'Stop process?';
}

function DialogBody({ d }) {
    const who = `${d.name} · pid ${d.pid} · ${d.user}`;
    const input = (
        <Line>
            <Tone role="focus">&gt; </Tone>
            <Tone role="primary">{d.typed}</Tone>
            <Tone role="focus">█</Tone>
        </Line>
    );
    switch (d.kind) {
        case 'blocked':
            return <Line><Tone role="primary">{d.reason}</Tone></Line>;
        case 'renice':
            return (
                <>
                    <Line><Tone role="primary">{who}</Tone></Line>
                    <Line><Tone role="secondary">Nice value (-20 highest … 20 lowest):</Tone></Line>
                    {input}
                    <Line><Tone role="muted">Raising priority (lower values) usually needs sudo.</Tone></Line>
                </>
            );
        case 'managed':
            return (
                <>
                    <Line><Tone role="primary">{who}</Tone></Line>
                    <Line><Tone role="secondary">Killing it will trigger auto-restart.</Tone></Line>
                    <Line><Tone role="secondary">m stops it cleanly through the manager.</Tone></Line>
                </>
            );
        case 'typeName':
            return (
                <>
                    <Line><Tone role="danger">! </Tone><Tone role="primary">{who}</Tone></Line>
                    <Line><Tone role="secondary">It belongs to another user; this can affect the whole system.</Tone></Line>
                    <Line><Tone role="secondary">Type the name to confirm:</Tone></Line>
                    {input}
                </>
            );
        default:
            return (
                <>
                    <Line><Tone role="primary">{who}</Tone></Line>
                    <Line><Tone role="secondary">Sends {d.signal}{d.signal === 'SIGTERM' ? ' (X for SIGKILL)' : ''}.</Tone></Line>
                </>
            );
    }
}

function dialogKeys(d) {
    if (d.kind === 'blocked') return 'Esc ok';
    if (d.kind === 'renice') return canSubmit(d) ? '⏎ apply   Esc cancel' : 'Esc cancel';
    if (d.kind === 'typeName') return canSubmit(d) ? '⏎ kill   Esc cancel' : 'Esc cancel';
    if (d.kind === 'managed') return 'm stop via manager   y kill anyway   Esc';
    return `y ${d.signal === 'SIGKILL' ? 'kill' : 'stop'}   Esc cancel`;
}

export function Dialog({ dialog, width, height }) {
    const w = Math.min(DIALOG_WIDTH, width - 4);
    const h = dialog.kind === 'typeName' ? 9 : 8;
    return (
        <Panel
            title={dialogTitle(dialog)}
            borderRole={dialog.kind === 'renice' || dialog.kind === 'blocked' ? 'focus' : 'danger'}
            width={w}
            height={h}
            left={Math.max(0, Math.floor((width - w) / 2))}
            top={Math.max(0, Math.floor((height - h) / 2))}
        >
            <DialogBody d={dialog} />
            <Blank />
            <Keys text={dialogKeys(dialog)} />
        </Panel>
    );
}

export function Drawer({ info, width, height }) {
    const theme = useTheme();
    if (!info) return null;
    const { process: p, parents, nice } = info;
    const chain = [...parents.map((x) => x.name), p.name].join(' › ');
    const uptime = p.startedAt ? formatDuration((Date.now() - p.startedAt) / 1000) : '—';
    return (
        <box width={width} height={height} border borderStyle="single" borderColor={theme.border.idle} title=" details " flexDirection="column" paddingLeft={1} paddingRight={1}>
            <Line><Tone role="primary" bold>{p.name}</Tone></Line>
            <Line><Tone role="secondary">pid {p.pid} · {p.user} · {p.state}</Tone></Line>
            <Blank />
            <Line><Tone role="muted">command </Tone><Tone role="primary">{truncateMiddle(p.command, width - 12)}</Tone></Line>
            <Line><Tone role="muted">parents</Tone></Line>
            <Line><Tone role="primary">{chain}</Tone></Line>
            <Line><Tone role="muted">running </Tone><Tone role="primary">{uptime}</Tone></Line>
            <Line><Tone role="muted">nice    </Tone><Tone role="primary">{nice ?? '—'}</Tone></Line>
            <Blank />
            <Keys text="x kill   r renice   Esc close" />
        </box>
    );
}

const LABEL = 8; // "restart " — the label column of the stack drawer

/** A labelled row: `ready   :3000 http ✓`, value parts as [text, role]. */
const Field = ({ label, parts, room }) => {
    let left = room - LABEL;
    return (
        <Line>
            <Tone role="muted">{padEnd(label, LABEL)}</Tone>
            {parts.map(([text, role], i) => {
                const shown = truncateEnd(text, Math.max(0, left));
                left -= shown.length;
                return <Tone key={i} role={role}>{shown}</Tone>;
            })}
        </Line>
    );
};

const signed = (mb) => `${mb >= 0 ? '+' : '−'}${formatMem(Math.abs(mb))}`;

/** The rows of the stack drawer, top first, each a React line. Pure apart from the clock in `now`. */
function stackDetailRows(m, ports, now, room) {
    const glyph = STATUS_GLYPHS[m.status] || STATUS_GLYPHS.idle;
    const statusText = `${glyph.glyph} ${m.status}`;
    const live = m.pid !== null;
    const own = ports.filter((p) => p.managedId === m.id).map((p) => `:${p.port}`);
    const recent = recentCrashes(m, now);
    const lastCrash = m.crashTimes?.length ? m.crashTimes[m.crashTimes.length - 1] : null;
    const exit = m.signal || (m.exitCode !== null ? `exit ${m.exitCode}` : null);
    const trend = memTrend(m.memHistory);
    const memRole = m.leakSuspect ? 'warn' : 'primary';
    const rows = [
        <Line key="name">
            <Tone role="primary" bold>{padEnd(truncateEnd(m.id, room - statusText.length - 1), room - statusText.length)}</Tone>
            <Tone role={glyph.state}>{statusText}</Tone>
        </Line>,
        <Line key="pid">
            <Tone role={live ? 'secondary' : 'muted'}>
                {live ? truncateEnd(`pid ${m.pid} · up ${formatDuration((now - m.startedAt) / 1000)}`, room) : 'not running'}
            </Tone>
        </Line>,
        <Blank key="b1" />,
        <Field key="ready" label="ready" room={room} parts={m.ready
            ? [[`${readyTarget(m.ready) || m.ready.target} ${m.ready.kind} `, 'primary'], [m.ready.ok ? '✓' : '…', m.ready.ok ? 'ok' : 'warn']]
            : [['no check', 'muted']]} />,
        <Field key="needs" label="needs" room={room} parts={[[m.dependsOn.length ? m.dependsOn.join(', ') : '—', m.dependsOn.length ? 'primary' : 'muted']]} />,
        <Field key="port" label="port" room={room} parts={[[own.length ? own.join(' ') : '—', own.length ? 'primary' : 'muted']]} />,
        <Field key="restart" label="restart" room={room} parts={[[m.restart, 'primary']]} />,
        <Field key="crashes" label="crashes" room={room} parts={lastCrash === null
            ? [['none', 'muted']]
            : [[`${recent} in 5m`, recent ? 'transient' : 'primary'], [exit ? ` · last ${exit}` : '', 'secondary']]} />,
        ...(lastCrash === null ? [] : [<Field key="ago" label="" room={room} parts={[[`${formatDuration((now - lastCrash) / 1000)} ago`, 'muted']]} />]),
        <Blank key="b2" />,
        <Field key="mem" label="memory" room={room} parts={[
            [m.resources ? formatMem(m.resources.memMB) : '—', memRole],
            [m.leakSuspect ? ` ${GLYPHS.alertWarn} leak?` : '', 'warn'],
        ]} />,
        ...(trend ? [<Line key="spark"><Tone role={m.leakSuspect ? 'warn' : 'ok'}>{sparkline(m.memHistory.map((s) => s.value), room)}</Tone></Line>] : []),
        <Line key="trend">
            <Tone role={trend && m.leakSuspect ? 'warn' : 'muted'}>
                {truncateEnd(trend ? `${signed(trend.deltaMB)} in ${trend.minutes} min` : m.pid !== null ? 'collecting… (first minute)' : 'no samples while stopped', room)}
            </Tone>
        </Line>,
    ];
    return rows;
}

/**
 * The stack drawer (UI_SPEC §6.8): what one managed process is, how it is checked, how it has behaved,
 * and its memory over the last ten minutes. Rows that don't fit go from the bottom; the keys stay.
 */
export function StackDrawer({ entry, ports, now, width, height }) {
    const theme = useTheme();
    const room = Math.max(1, width - 4);
    const rows = stackDetailRows(entry, ports, now, room);
    const space = Math.max(0, height - 2 - 1);
    const shown = rows.length > space ? rows.slice(0, space) : [...rows, <Blank key="gap" />].slice(0, space);
    return (
        <box width={width} height={height} border borderStyle="single" borderColor={theme.border.idle} title=" details " flexDirection="column" paddingLeft={1} paddingRight={1}>
            {shown}
            <Keys text="p show in proc   Esc close" />
        </box>
    );
}

export function HelpOverlay({ groups, width, height }) {
    const w = Math.min(72, width - 4);
    const rows = groups.reduce((n, g) => n + g.entries.length + 2, 0);
    const h = Math.min(height - 2, rows + 3);
    return (
        <Panel title="keys" width={w} height={h} left={Math.floor((width - w) / 2)} top={1}>
            {groups.map((g) => (
                <box key={g.title} flexDirection="column">
                    <Line><Tone role="primary" bold>{g.title}</Tone></Line>
                    {g.entries.map((e) => {
                        const [key, ...rest] = e.label.split(' ');
                        return (
                            <Line key={e.action + e.label}>
                                <Tone role="select" bold>  {key}</Tone>
                                <Tone role="secondary">{rest.length ? ` ${rest.join(' ')}` : ''}</Tone>
                            </Line>
                        );
                    })}
                    <Blank />
                </box>
            ))}
        </Panel>
    );
}
