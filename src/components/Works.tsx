import { useEffect, useRef, useState } from 'react';
import { cases, type CaseItem } from '../data/cases';
import { ScaledSite } from './MiniSite';
import { TG_URL } from '../lib/contact';

export function Works() {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState<CaseItem | null>(null);
  const item = cases[active];

  return (
    <section id="works" className="relative py-24 md:py-36" aria-labelledby="works-title">
      <div className="container-x">
        <div className="grid gap-6 md:grid-cols-12 md:items-end">
          <h2 id="works-title" className="t-h2 md:col-span-7">
            Двенадцать ниш, двенадцать разных сайтов
          </h2>
          <p className="t-body-lg text-ink-2 md:col-span-5 md:pb-2">
            Это концепты: компании вымышлены, приёмы настоящие. Выберите свою нишу и откройте сайт целиком.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-12 lg:gap-12">
          <ol className="hidden lg:col-span-5 lg:block" aria-label="Ниши">
            {cases.map((c, i) => {
              const on = i === active;
              return (
                <li key={c.id} className="rule last:border-b last:border-[var(--c-line)]">
                  <button
                    type="button"
                    className="ui-press ui-press--surface ui-press--on-dark ui-focus row-hover group flex w-full items-center gap-5 rounded-lg px-2 py-4 text-left"
                    style={{ color: on ? 'var(--c-text)' : 'var(--c-text-2)' }}
                    aria-pressed={on}
                    onMouseEnter={() => window.matchMedia('(hover: hover)').matches && setActive(i)}
                    onFocus={() => setActive(i)}
                    onClick={() => {
                      setActive(i);
                      if (!window.matchMedia('(min-width: 1024px)').matches) setOpen(c);
                    }}
                  >
                    <span className="t-micro w-6 tabular-nums" style={{ color: on ? 'var(--c-accent)' : undefined }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="flex-1">
                      <span className="block font-display text-[28px] font-bold leading-none md:text-[34px]" style={{ transition: 'color var(--m-fast) var(--m-ease)' }}>
                        {c.niche}
                      </span>
                      <span className="t-small mt-1.5 block text-ink-2">{c.device}</span>
                    </span>
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: on ? 'var(--c-accent)' : 'transparent', boxShadow: on ? 'none' : 'inset 0 0 0 1px var(--c-line)', transition: 'background var(--m-fast) var(--m-ease)' }}
                    />
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="hidden lg:col-span-7 lg:block">
            <div className="sticky top-24">
              <PreviewFrame item={item} key={item.id} />
              <div className="mt-6 flex items-center justify-between gap-6">
                <div>
                  <div className="t-h3">{item.brand}</div>
                  <div className="t-small mt-1 text-ink-2">Концепт · {item.niche}</div>
                </div>
                <button type="button" className="btn btn-ghost ui-press ui-press--on-dark ui-focus" onClick={() => setOpen(item)}>
                  Открыть сайт целиком
                </button>
              </div>
            </div>
          </div>

          <MobileRail onOpen={setOpen} />
        </div>
      </div>
      <CaseModal item={open} onClose={() => setOpen(null)} />
    </section>
  );
}

function MobileRail({ onOpen }: { onOpen: (c: CaseItem) => void }) {
  return (
    <div className="-mx-4 min-w-0 lg:hidden sm:-mx-6">
      <ul className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:px-6" style={{ scrollbarWidth: 'none' }} aria-label="Концепты по нишам">
        {cases.map((c, i) => (
          <li key={c.id} className="w-[84vw] max-w-[520px] shrink-0 snap-start">
            <button type="button" className="ui-press ui-press--surface ui-press--on-dark ui-focus block w-full rounded-2xl text-left" onClick={() => onOpen(c)}>
              <div className="frame">
                <ScaledSite item={c} />
              </div>
              <div className="mt-4 flex items-start gap-3 px-1">
                <span className="t-micro pt-1.5 tabular-nums text-accent">{String(i + 1).padStart(2, '0')}</span>
                <span>
                  <span className="block font-display text-[26px] font-bold leading-none text-ink">{c.niche}</span>
                  <span className="t-small mt-1.5 block text-ink-2">{c.device}</span>
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>
      <p className="t-small px-4 text-ink-2 sm:px-6">Листайте вбок и нажмите на концепт, чтобы открыть сайт целиком.</p>
    </div>
  );
}

function PreviewFrame({ item }: { item: CaseItem }) {
  return (
    <div className="frame swap-enter">
      <UrlBar domain={item.domain} />
      <ScaledSite item={item} />
    </div>
  );
}

function UrlBar({ domain }: { domain: string }) {
  return (
    <div className="flex h-10 items-center gap-3 border-b border-[var(--c-line)] px-4">
      <span className="t-micro rounded-md bg-[rgb(237_233_227/0.06)] px-3 py-1 text-ink-2">{domain}</span>
      <span className="t-micro ml-auto rounded-md px-2 py-0.5 text-accent" style={{ boxShadow: 'inset 0 0 0 1px rgb(255 107 26 / 0.5)' }}>
        концепт
      </span>
    </div>
  );
}

function CaseModal({ item, onClose }: { item: CaseItem | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [shown, setShown] = useState<CaseItem | null>(item);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (item) {
      setShown(item);
      if (!d.open) d.showModal();
      document.documentElement.style.overflow = 'hidden';
    } else if (d.open) {
      d.close();
    }
  }, [item]);

  const close = () => {
    document.documentElement.style.overflow = '';
    onClose();
  };

  const c = shown;
  return (
    <dialog
      ref={ref}
      className="case-modal"
      aria-labelledby="case-title"
      onClose={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) ref.current?.close();
      }}
    >
      {c && (
        <div className="flex h-full w-full items-start justify-center overflow-y-auto px-3 py-6 md:px-8 md:py-10" onClick={(e) => e.target === e.currentTarget && ref.current?.close()}>
          <div className="case-sheet w-full max-w-[1180px]" key={c.id}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 id="case-title" className="t-h3">
                  {c.brand} <span className="text-ink-2">· {c.niche}</span>
                </h3>
                <p className="t-small mt-1 text-ink-2">{c.device}</p>
              </div>
              <div className="flex items-center gap-2">
                <a className="btn btn-primary ui-press ui-focus" href={TG_URL} target="_blank" rel="noopener">
                  Хочу такой сайт
                </a>
                <button type="button" className="btn btn-ghost ui-press ui-press--on-dark ui-focus" onClick={() => ref.current?.close()} aria-label="Закрыть">
                  Закрыть
                </button>
              </div>
            </div>
            <div className="frame">
              <UrlBar domain={c.domain} />
              <ScaledSite item={c} full interactive />
            </div>
            <nav className="mt-4 grid grid-cols-2 gap-3" aria-label="Другие концепты">
              {[-1, 1].map((step) => {
                const i = (cases.findIndex((x) => x.id === c.id) + step + cases.length) % cases.length;
                return (
                  <button
                    key={step}
                    type="button"
                    className={`btn btn-ghost ui-press ui-press--on-dark ui-focus min-w-0 ${step > 0 ? 'justify-self-end' : 'justify-self-start'}`}
                    style={{ maxWidth: '100%' }}
                    onClick={() => setShown(cases[i])}
                  >
                    {step < 0 && <span aria-hidden="true">←</span>}
                    <span className="truncate">{cases[i].niche}</span>
                    {step > 0 && <span aria-hidden="true">→</span>}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </dialog>
  );
}
