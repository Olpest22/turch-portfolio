import { useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import type { CaseItem } from '../data/cases';

const CANVAS_W = 1280;
const HERO_H = 760;

/** Renders a 1280px-wide concept site and scales it to the width of its container. */
export function ScaledSite({ item, full = false, interactive = false }: { item: CaseItem; full?: boolean; interactive?: boolean }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const [height, setHeight] = useState(HERO_H);

  useLayoutEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const ro = new ResizeObserver(() => {
      setScale(o.clientWidth / CANVAS_W);
      setHeight(full ? i.scrollHeight : HERO_H);
    });
    ro.observe(o);
    ro.observe(i);
    return () => ro.disconnect();
  }, [full]);

  return (
    <div ref={outer} className="relative w-full overflow-hidden" style={{ height: height * scale }}>
      <div
        ref={inner}
        className="absolute left-0 top-0 origin-top-left"
        style={{ width: CANVAS_W, transform: `scale(${scale})`, pointerEvents: interactive ? 'auto' : 'none' }}
        aria-hidden={!interactive}
        inert={!interactive}
      >
        <MiniSite item={item} full={full} />
      </div>
    </div>
  );
}

function MiniSite({ item, full }: { item: CaseItem; full: boolean }) {
  const t = item.theme;
  const vars = {
    '--s-bg': t.bg,
    '--s-surface': t.surface,
    '--s-text': t.text,
    '--s-muted': t.muted,
    '--s-accent': t.accent,
    '--s-ink': t.accentInk,
    background: t.bg,
    color: t.text,
    fontFamily: t.body,
  } as CSSProperties;
  const display: CSSProperties = {
    fontFamily: t.display,
    fontWeight: t.displayWeight,
    textTransform: t.upper ? 'uppercase' : 'none',
    letterSpacing: t.upper ? '0.01em' : '-0.01em',
  };

  return (
    <div style={vars} className="mini">
      <Hero item={item} display={display} />
      {full && (
        <>
          <section className="grid grid-cols-3 gap-6 px-16 py-16" style={{ borderTop: `1px solid color-mix(in srgb, ${t.text} 14%, transparent)` }}>
            {item.features.map(([k, v]) => (
              <div key={k}>
                <div style={{ ...display, fontSize: 30, lineHeight: 1.05 }}>{k}</div>
                <div style={{ color: t.muted, fontSize: 18, marginTop: 8 }}>{v}</div>
              </div>
            ))}
          </section>
          <section className="px-16 pb-20 pt-4">
            <h3 style={{ ...display, fontSize: 52, lineHeight: 1 }}>{item.section.title}</h3>
            <div className="mt-8 grid grid-cols-4 gap-4">
              {item.section.items.map((s, i) => (
                <div
                  key={s}
                  className="flex h-40 flex-col justify-between rounded-xl p-6"
                  style={{ background: i === 0 ? t.accent : t.surface, color: i === 0 ? t.accentInk : t.text }}
                >
                  <span style={{ fontSize: 15, opacity: 0.7 }}>{String(i + 1).padStart(2, '0')}</span>
                  <span style={{ ...display, fontSize: 26, lineHeight: 1.05 }}>{s}</span>
                </div>
              ))}
            </div>
          </section>
          <footer className="flex items-center justify-between px-16 py-8" style={{ background: t.surface, color: t.muted, fontSize: 15 }}>
            <span>
              {item.brand} · {item.domain}
            </span>
            <span>Концепт сайта · TURCH</span>
          </footer>
        </>
      )}
    </div>
  );
}

function Nav({ item, onDark }: { item: CaseItem; onDark?: boolean }) {
  const t = item.theme;
  return (
    <header className="relative z-10 flex items-center justify-between px-16 py-7" style={{ color: onDark ? '#fff' : t.text }}>
      <span style={{ fontFamily: t.display, fontWeight: t.displayWeight, fontSize: 26, textTransform: t.upper ? 'uppercase' : 'none' }}>{item.brand}</span>
      <nav className="flex gap-9" style={{ fontSize: 17, opacity: 0.85 }}>
        {item.nav.map((n) => (
          <span key={n}>{n}</span>
        ))}
      </nav>
      <span className="rounded-lg px-5 py-3" style={{ background: t.accent, color: t.accentInk, fontSize: 16, fontWeight: 600 }}>
        {item.cta}
      </span>
    </header>
  );
}

function Cta({ item, ghost }: { item: CaseItem; ghost?: string }) {
  const t = item.theme;
  return (
    <div className="mt-10 flex items-center gap-4">
      <span className="rounded-lg px-8 py-5" style={{ background: t.accent, color: t.accentInk, fontSize: 19, fontWeight: 600 }}>
        {item.cta}
      </span>
      {ghost && (
        <span className="rounded-lg px-8 py-5" style={{ border: '1.5px solid currentColor', fontSize: 19, fontWeight: 500, opacity: 0.9 }}>
          {ghost}
        </span>
      )}
    </div>
  );
}

function Hero({ item, display }: { item: CaseItem; display: CSSProperties }) {
  const t = item.theme;
  const img = (style?: CSSProperties) => <img src={item.photo} alt="" className="h-full w-full object-cover" style={style} loading="lazy" decoding="async" />;

  switch (item.layout) {
    case 'neon':
      return (
        <div className="relative" style={{ height: HERO_H }}>
          <div className="absolute inset-0">{img({ filter: 'brightness(0.24) saturate(1.3) blur(3px)', transform: 'scale(1.05)' })}</div>
          <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, ${t.bg} 10%, transparent 75%)` }} />
          <Nav item={item} onDark />
          <div className="relative px-16 pt-16" style={{ maxWidth: 1000 }}>
            <h1 className="neon-flicker" style={{ ...display, fontSize: 92, lineHeight: 0.95, color: '#FFE3EE', textShadow: `0 0 6px #fff, 0 0 18px ${t.accent}, 0 0 46px ${t.accent}, 0 0 90px ${t.accent}` }}>
              {item.headline}
            </h1>
            <p style={{ fontSize: 22, color: t.muted, marginTop: 28, maxWidth: 620 }}>{item.sub}</p>
            <Cta item={item} ghost="Примеры работ" />
          </div>
        </div>
      );
    case 'poster':
      return (
        <div className="relative flex flex-col" style={{ height: HERO_H }}>
          <Nav item={item} />
          <div className="grid flex-1 grid-cols-12">
            <div className="col-span-7 flex flex-col justify-end px-16 pb-14">
              <h1 style={{ ...display, fontSize: 96, lineHeight: 0.88 }}>{item.headline}</h1>
              <p style={{ fontSize: 21, marginTop: 22, maxWidth: 560, color: t.muted }}>{item.sub}</p>
              <Cta item={item} />
            </div>
            <div className="relative col-span-5 pb-6 pr-6">
              <div className="h-full overflow-hidden rounded-2xl">{img()}</div>
              <div className="absolute bottom-14 left-8 rounded-lg px-5 py-4" style={{ background: '#111', color: '#FFD400', fontFamily: t.display, fontSize: 22, textTransform: 'uppercase' }}>
                Свободно: 14 поверхностей
              </div>
            </div>
          </div>
        </div>
      );
    case 'split':
      return (
        <div className="relative flex flex-col" style={{ height: HERO_H }}>
          <Nav item={item} />
          <div className="grid flex-1 grid-cols-2">
            <div className="flex flex-col justify-center px-16 pb-10">
              <h1 style={{ ...display, fontSize: 80, lineHeight: 1 }}>{item.headline}</h1>
              <p style={{ fontSize: 21, marginTop: 26, color: t.muted, maxWidth: 520 }}>{item.sub}</p>
              <Cta item={item} />
            </div>
            <div className="relative pb-6 pr-6">
              <div className="h-full overflow-hidden rounded-2xl">{img()}</div>
              <div className="absolute bottom-14 left-[-48px] w-72 rounded-xl p-6 shadow-2xl" style={{ background: t.surface }}>
                <div style={{ fontSize: 15, color: t.muted }}>{item.features[0][0]}</div>
                <div style={{ ...display, fontSize: 28, marginTop: 6, lineHeight: 1.1 }}>{item.features[0][1]}</div>
              </div>
            </div>
          </div>
        </div>
      );
    case 'full':
      return (
        <div className="relative" style={{ height: HERO_H }}>
          <div className="absolute inset-0">{img()}</div>
          <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, rgb(0 0 0 / 0.45) 0%, transparent 30%, ${t.bg}F2 88%)` }} />
          <Nav item={item} onDark />
          <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-16 pb-16" style={{ color: '#fff' }}>
            <div style={{ maxWidth: 820 }}>
              <h1 style={{ ...display, fontSize: 96, lineHeight: 0.95 }}>{item.headline}</h1>
              <p style={{ fontSize: 21, marginTop: 22, color: t.muted, maxWidth: 600 }}>{item.sub}</p>
              <Cta item={item} />
            </div>
            <div className="flex flex-col gap-3">
              {item.features.map(([k, v]) => (
                <div key={k} className="w-64 rounded-xl px-5 py-4" style={{ background: `${t.surface}D9`, backdropFilter: 'blur(6px)' }}>
                  <div style={{ fontSize: 14, color: t.muted }}>{k}</div>
                  <div style={{ fontSize: 18, fontWeight: 500 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    case 'editorial':
      return (
        <div className="relative flex flex-col" style={{ height: HERO_H }}>
          <Nav item={item} />
          <div className="px-16 pt-6 text-center">
            <h1 className="mx-auto" style={{ ...display, fontSize: 76, lineHeight: 1.02, maxWidth: 1000 }}>
              {item.headline}
            </h1>
            <p className="mx-auto" style={{ fontSize: 20, marginTop: 18, color: t.muted, maxWidth: 640 }}>
              {item.sub}
            </p>
          </div>
          <div className="relative mx-16 mt-8 flex-1 overflow-hidden rounded-t-[28px]">
            {img()}
            <span className="absolute bottom-8 left-1/2 -translate-x-1/2 rounded-full px-8 py-5" style={{ background: t.accent, color: t.accentInk, fontSize: 19, fontWeight: 600 }}>
              {item.cta}
            </span>
          </div>
        </div>
      );
    case 'beforeafter':
      return <BeforeAfter item={item} display={display} />;
    case 'light':
      return (
        <div className="relative grid grid-cols-12" style={{ height: HERO_H }}>
          <div className="absolute inset-x-0 top-0 h-[60%]" style={{ background: 'linear-gradient(180deg,#fff, #E7EDF3)' }} />
          <div className="relative col-span-12">
            <Nav item={item} />
          </div>
          <div className="relative col-span-6 px-16 pt-4">
            <h1 style={{ ...display, fontSize: 88, lineHeight: 0.98 }}>{item.headline}</h1>
            <p style={{ fontSize: 21, marginTop: 24, color: t.muted, maxWidth: 520 }}>{item.sub}</p>
            <div className="mt-10 w-[520px] rounded-2xl p-7 shadow-xl" style={{ background: '#fff' }}>
              <div className="flex justify-between" style={{ fontSize: 16, color: t.muted }}>
                <span>Площадь комнаты</span>
                <span style={{ color: t.text, fontWeight: 600 }}>18 м²</span>
              </div>
              <div className="relative mt-4 h-2 rounded-full" style={{ background: '#DCE3EA' }}>
                <div className="absolute inset-y-0 left-0 w-[38%] rounded-full" style={{ background: t.accent }} />
                <div className="absolute top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border-4 bg-white" style={{ left: 'calc(38% - 12px)', borderColor: t.accent }} />
              </div>
              <div className="mt-6 flex gap-2" style={{ fontSize: 15 }}>
                {['Матовый', 'Сатин', 'Глянец'].map((f, i) => (
                  <span key={f} className="rounded-lg px-4 py-2" style={{ background: i === 2 ? t.accent : '#EEF2F6', color: i === 2 ? '#fff' : t.text }}>
                    {f}
                  </span>
                ))}
              </div>
              <div className="mt-6 rounded-lg py-4 text-center" style={{ background: t.text, color: '#fff', fontSize: 18, fontWeight: 600 }}>
                {item.cta}
              </div>
            </div>
          </div>
          <div className="relative col-span-6 pr-6 pt-4 pb-6">
            <div className="h-full overflow-hidden rounded-2xl">{img()}</div>
          </div>
        </div>
      );
  }
}

function BeforeAfter({ item, display }: { item: CaseItem; display: CSSProperties }) {
  const t = item.theme;
  const [pos, setPos] = useState(52);
  const box = useRef<HTMLDivElement>(null);
  const move = (e: PointerEvent) => {
    if (!box.current || (e.buttons !== 1 && e.type !== 'pointerdown')) return;
    const r = box.current.getBoundingClientRect();
    setPos(Math.min(96, Math.max(4, ((e.clientX - r.left) / r.width) * 100)));
  };
  return (
    <div className="relative" style={{ height: HERO_H }}>
      <Nav item={item} />
      <div className="grid grid-cols-12 gap-10 px-16 pt-6">
        <div className="col-span-5 pt-10">
          <h1 style={{ ...display, fontSize: 92, lineHeight: 0.98 }}>{item.headline}</h1>
          <p style={{ fontSize: 21, marginTop: 24, color: t.muted }}>{item.sub}</p>
          <Cta item={item} />
        </div>
        <div
          ref={box}
          className="relative col-span-7 h-[560px] cursor-ew-resize select-none overflow-hidden rounded-2xl"
          onPointerDown={move}
          onPointerMove={move}
          role="slider"
          aria-label="Сравнение до и после"
          aria-valuenow={Math.round(pos)}
          aria-valuemin={0}
          aria-valuemax={100}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') setPos((p) => Math.max(4, p - 4));
            if (e.key === 'ArrowRight') setPos((p) => Math.min(96, p + 4));
          }}
        >
          <img src={item.photo} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
          <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
            <img src={item.photo} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ filter: 'grayscale(1) sepia(0.45) contrast(0.7) brightness(0.72) blur(0.6px)' }} draggable={false} />
          </div>
          <div className="absolute inset-y-0 w-[3px]" style={{ left: `${pos}%`, background: t.accent }}>
            <div className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full" style={{ background: t.accent, color: t.accentInk, fontSize: 22, fontWeight: 700 }}>
              ↔
            </div>
          </div>
          <span className="absolute left-5 top-5 rounded-md px-3 py-1.5" style={{ background: '#000a', fontSize: 15 }}>До</span>
          <span className="absolute right-5 top-5 rounded-md px-3 py-1.5" style={{ background: '#000a', fontSize: 15 }}>После</span>
        </div>
      </div>
    </div>
  );
}
