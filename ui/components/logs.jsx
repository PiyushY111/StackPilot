// The logs panel (UI_SPEC §6.7): the big right-hand panel while the managed box has focus. Follows new
// output, pauses when scrolled back (counting what arrived), searches, and can interleave all processes.
import { Box } from './box.jsx';
import { Tone } from './primitives.jsx';
import { StackDrawer } from './overlays.jsx';
import { highlightParts, sanitizeLine } from '../logic/logs.js';
import { formatClock, formatCount, padEnd, truncateEnd } from '../logic/format.js';
import { GLYPHS } from '../theme/tokens.js';

const INNER = 4;
const CLOCK_WIDTH = 9; // "14:02:11 "
const MAX_ID_WIDTH = 10;
const DRAWER_SHARE = 0.4; // as the proc box's drawer
const MIN_DRAWER = 30; // the details need this much to fit their rows and key line
const MIN_LOGS = 24; // with less left for the logs, the details take the whole panel instead

function logInfo({ view, follow, filter, searching }) {
    const parts = follow
        ? [{ text: 'following ●', role: 'ok' }]
        : [{ text: `paused · ${formatCount(view.newCount)} new`, role: 'warn' }];
    const count = filter
        ? `${formatCount(view.total)} match${view.total === 1 ? '' : 'es'}`
        : `${formatCount(view.total)} line${view.total === 1 ? '' : 's'}`;
    parts.push({ text: ' ─ ', role: 'faint' }, { text: count, role: 'muted' });
    if (filter || searching) {
        parts.push({ text: ' ─ ', role: 'faint' }, { text: `/${filter}${searching ? '█' : ' ×'}`, role: 'select' });
    }
    return parts;
}

function LogLine({ line, filter, idWidth, width }) {
    const system = line.stream === 'system';
    const marker = line.stream === 'stderr' ? GLYPHS.stderr : ' ';
    const prefix = idWidth ? `${padEnd(line.id, idWidth)} ` : '';
    const room = Math.max(1, width - 1 - CLOCK_WIDTH - prefix.length);
    const text = truncateEnd(sanitizeLine(line.text), room);
    return (
        <text wrapMode="none">
            <Tone role="transient">{marker}</Tone>
            <Tone role="muted">{formatClock(line.ts)} </Tone>
            {prefix ? <Tone role="managed">{prefix}</Tone> : null}
            {system
                ? <Tone role="muted">{text}</Tone>
                : highlightParts(text, filter).map((p, i) => <Tone key={i} role={p.match ? 'select' : 'primary'} bold={p.match}>{p.text}</Tone>)}
        </text>
    );
}

function emptyText({ entry, view, filter }) {
    if (!entry) return 'Nothing is managed yet · a start the stack · n add a process';
    if (view.error) return view.error;
    if (filter) return `No lines match "${filter}" · Esc to clear`;
    return entry.status === 'idle' ? `${entry.id} has not started · s start it` : `No output from ${entry.id} yet`;
}

/**
 * @param {{ state: any, view: any, entry: any, scope: 'one'|'all', searching: boolean, layout: { width: number, height: number },
 *           hints: any[], details?: boolean, now?: number }} props
 *   `details`: show the selected process's drawer beside the logs (UI_SPEC §6.8).
 */
export function LogsBox({ state, view, entry, scope, searching, layout, hints, details = false, now = Date.now() }) {
    const { logFilter, logFollow } = state.ui;
    const share = Math.floor(layout.width * DRAWER_SHARE);
    const room = layout.width - INNER;
    const drawerWidth = !details || !entry ? 0 : room - MIN_DRAWER >= MIN_LOGS ? Math.max(share, MIN_DRAWER) : room;
    const width = layout.width - INNER - drawerWidth;
    const idWidth = scope === 'all' ? Math.min(MAX_ID_WIDTH, Math.max(...state.managed.map((m) => m.id.length), 1)) : 0;
    const title = scope === 'all' ? 'logs · all' : entry ? `logs · ${entry.id}` : 'logs';
    const borderHints = searching ? [{ label: '⏎ keep', action: 'k' }, { label: 'Esc clear', action: 'c' }] : hints;
    const status = state.ui.toast || { message: '? help  q quit', role: 'muted' };
    return (
        <Box title={title} info={logInfo({ view, follow: logFollow, filter: logFilter, searching })} hints={borderHints} status={status} focused lit={false} width={layout.width} height={layout.height}>
            <box flexDirection="row" height={layout.height - 2}>
                {width > 0 ? <box width={width} flexDirection="column">
                    {view.lines.length
                        ? view.lines.map((l) => <LogLine key={`${l.id}:${l.seq}`} line={l} filter={logFilter} idWidth={idWidth} width={width} />)
                        : <text wrapMode="none"><Tone role={view.error ? 'danger' : 'muted'}>{truncateEnd(emptyText({ entry, view, filter: logFilter }), width)}</Tone></text>}
                </box> : null}
                {drawerWidth ? <StackDrawer entry={entry} ports={state.ports.items} now={now} width={drawerWidth} height={layout.height - 2} /> : null}
            </box>
        </Box>
    );
}
