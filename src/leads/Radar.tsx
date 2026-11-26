import { useCallback, useEffect, useMemo, useState } from 'react';
import { NICHES } from '@/lib/niches';
import { openRadar, type RadarFile } from './vault';
import { CopyBtn, copyText } from './ui';

/* Lead radar: a ready list of Threads posts where someone asks for a website.
   GitHub Actions collects and scores posts every 30 minutes (ops/threads/radar) and publishes the list
   encrypted; it is decrypted here with the key from the password. Marks (answered / hidden) stay in this browser. */

export type RadarItem = {
  id: string; url: string; user: string; ts: string; text: string; score: number;
  level: 'hot' | 'maybe'; why: string[]; niche: string; reply: string; replies?: string | number; found: string;
};
type Payload = { updated: string; read: number; new: number; runs: number; items: RadarItem[] };
type Mark = 'done' | 'hidden';

const URL_ = import.meta.env.VITE_RADAR_URL || `${import.meta.env.BASE_URL}radar.enc`;
const MARKS = 'turch-radar-marks';
const ring = { boxShadow: 'inset 0 0 0 1px var(--line)' };

const loadMarks = (): Record<string, Mark> => {
  try { return JSON.parse(localStorage.getItem(MARKS) || '{}'); } catch { return {}; }
};
function ago(iso: string) {
  const m = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000));
  if (m < 60) return `${m} мин назад`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} ч назад`;
  return `${Math.round(h / 24)} дн назад`;
}

/** Count of fresh hot items nobody has handled yet, for the tab badge. */
export function useRadar(vaultKey: CryptoKey) {
  const [data, setData] = useState<Payload | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    setBusy(true);
    try {
      const r = await fetch(`${URL_}?t=${Date.now()}`, { cache: 'no-store' });
      if (r.status === 404) { setErr('Радар ещё ни разу не запускался. Первый список появится в течение получаса после включения.'); return; }
      if (!r.ok) throw new Error(String(r.status));
      const file = (await r.json()) as RadarFile;
      setData(JSON.parse(await openRadar(vaultKey, file)));
      setErr('');
    } catch {
      setErr('Не получилось открыть список радара. Проверьте интернет; если повторяется, ключи радара не совпадают с паролем.');
    } finally {
      setBusy(false);
    }
  }, [vaultKey]);
  useEffect(() => {
    void load();
    const t = window.setInterval(() => void load(), 5 * 60_000);
    return () => window.clearInterval(t);
  }, [load]);
  return { data, err, busy, load };
}

type Filter = 'new' | 'done' | 'hidden';

export default function Radar({ radar }: { radar: ReturnType<typeof useRadar> }) {
  const { data, err, busy, load } = radar;
  const [marks, setMarks] = useState(loadMarks);
  const [filter, setFilter] = useState<Filter>('new');
  const [hotOnly, setHotOnly] = useState(false);
  useEffect(() => { try { localStorage.setItem(MARKS, JSON.stringify(marks)); } catch { /* per-browser convenience */ } }, [marks]);
  const mark = (id: string, m: Mark | null) => setMarks((x) => { const n = { ...x }; if (m) n[id] = m; else delete n[id]; return n; });

  const items = data?.items ?? [];
  const list = useMemo(() => items.filter((i) => {
    const m = marks[i.id];
    if (filter === 'new' ? m : m !== filter) return false;
    return !hotOnly || i.level === 'hot';
  }), [items, marks, filter, hotOnly]);
  const count = (f: Filter) => items.filter((i) => (f === 'new' ? !marks[i.id] : marks[i.id] === f)).length;

  return (
    <section className="mt-8" aria-labelledby="radar-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="radar-title" className="h3 m-0">Радар Threads</h2>
          <p className="mb-0 mt-2 max-w-[640px] text-[15px] text-tx-2">
            Каждые 30 минут радар читает свежие посты и оставляет те, где человек ищет, кто сделает сайт. Ответ уже готов: скопируйте его и откройте пост.
          </p>
        </div>
        <div className="flex items-center gap-3 text-[14px] text-tx-3">
          {data && <span>Обновлён {ago(data.updated)} · прочитано {data.read} постов</span>}
          <button type="button" className="btn btn-b ui-press ui-press--on-dark ui-focus h-[38px] px-3.5 text-[14px]" onClick={() => void load()} disabled={busy}>
            {busy ? 'Обновляю…' : 'Обновить'}
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {([['new', 'Новые'], ['done', 'Ответил'], ['hidden', 'Скрытые']] as [Filter, string][]).map(([k, t]) => (
          <button
            key={k}
            type="button"
            aria-pressed={filter === k}
            className={`ui-press ui-focus h-[38px] rounded-full px-4 text-[15px] font-medium ${filter === k ? 'bg-tx text-bg' : 'text-tx-2'}`}
            onClick={() => setFilter(k)}
          >
            {t} <span className={filter === k ? 'text-bg/60' : 'text-tx-3'}>{count(k)}</span>
          </button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-[15px] text-tx-2">
          <input type="checkbox" className="size-[18px]" checked={hotOnly} onChange={(e) => setHotOnly(e.target.checked)} />
          Только явные запросы
        </label>
      </div>

      {err && <p className="mb-0 mt-4 text-[15px] text-tx-2" role="status">{err}</p>}

      {list.length ? (
        <ul className="m-0 mt-4 grid list-none gap-2.5 p-0">
          {list.map((i) => (
            <li key={i.id} className="grid gap-3 rounded-[16px] bg-bg-2 p-4 md:p-5" style={ring}>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-tx-3">
                <span className={`rounded-full px-2.5 py-0.5 text-[13px] font-semibold ${i.level === 'hot' ? 'bg-[rgb(255_107_26/0.16)] text-[#ffb48a]' : 'bg-[rgb(244_241_234/0.08)] text-tx-2'}`}>
                  {i.level === 'hot' ? 'Явный запрос' : 'Возможно'}
                </span>
                <span className="font-medium text-tx-2">@{i.user}</span>
                <span>{ago(i.ts)}</span>
                {i.replies ? <span>ответов: {i.replies}</span> : <span className="text-[#9be3b4]">ещё без ответов</span>}
                {i.niche && NICHES[i.niche] && <span>{NICHES[i.niche].label}</span>}
              </div>
              <p className="m-0 line-clamp-6 whitespace-pre-wrap text-[16px] leading-relaxed [overflow-wrap:anywhere]">{i.text}</p>
              <p className="m-0 text-[13px] text-tx-3">Почему в списке: {i.why.join(', ')}</p>
              <div className="rounded-[12px] bg-bg p-3.5 text-[15px] leading-relaxed text-tx-2" style={ring}>
                <div className="mb-1 text-[13px] text-tx-3">Ответ</div>
                <p className="m-0 whitespace-pre-wrap [overflow-wrap:anywhere]">{i.reply}</p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <a
                  className="btn btn-a ui-press ui-focus h-[44px] px-4 text-[15px]"
                  href={i.url}
                  target="_blank"
                  rel="noopener"
                  title="Ответ скопируется, вставьте его под постом"
                  onClick={() => void copyText(i.reply)}
                >
                  Открыть пост (ответ скопирован)
                </a>
                <CopyBtn text={i.reply} label="Скопировать ответ" />
                {marks[i.id] ? (
                  <button type="button" className="btn btn-b ui-press ui-press--on-dark ui-focus h-[44px] px-4 text-[15px]" onClick={() => mark(i.id, null)}>Вернуть в новые</button>
                ) : (
                  <>
                    <button type="button" className="btn btn-b ui-press ui-press--on-dark ui-focus h-[44px] px-4 text-[15px]" onClick={() => mark(i.id, 'done')}>Ответил ✓</button>
                    <button type="button" className="btn btn-b ui-press ui-press--on-dark ui-focus h-[44px] px-4 text-[15px]" onClick={() => mark(i.id, 'hidden')}>Не подходит</button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        !err && (
          <div className="mt-4 rounded-[16px] p-8 text-center text-[16px] text-tx-2" style={{ boxShadow: 'inset 0 0 0 1px var(--line)' }}>
            {!data ? 'Загружаю…' : filter === 'new' ? 'Новых запросов пока нет. Радар проверит Threads снова в течение получаса.' : 'Здесь пусто.'}
          </div>
        )
      )}
    </section>
  );
}

export const freshCount = (data: Payload | null) => {
  const marks = loadMarks();
  return (data?.items ?? []).filter((i) => !marks[i.id]).length;
};
