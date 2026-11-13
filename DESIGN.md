# TURCH — DESIGN.md

## Direction

- **Scene:** a night street seen through a long exposure: shop signs and car lights leave warm
  orange trails over dark chrome. Each of the 12 concepts is a lit shop window on that street.
- **Qualities:** cinematic, exact, warm light. **Anti-qualities:** purple/cyan AI gradients,
  glass cards, stock "AI" orbs.
- **User cue (overrides defaults):** dark, chrome typography, glowing orange ribbons
  (in the spirit of MotionSites "Frame Futures", original implementation).
- **Posture:** poster first screen (full-bleed WebGL ribbons, text on the calm left side),
  then an index of works with a live preview, ruled offer list, horizontal process, contact close.
- **Intentional exceptions to the slop catalog:** chrome gradient fill on display type and
  glow on the ribbons are the user's explicit brief. Used only on display type and the hero
  canvas; nowhere else.
- **Signature details:** 1) WebGL light ribbons that bend toward the pointer;
  2) chrome display type whose reflection band picks up the orange of the ribbons;
  3) the works index swaps a live mini-site (each niche has its own design) in a framed window.
- **Motion character:** heavy and smooth like light trails: long eased entrances (600 ms),
  short exits, no bouncing except the press spring from the interaction kit.
  Ambient motion: only the hero canvas and the niche marquee; both stop offscreen and under
  reduced motion.

## Type

| Role | Family | Size | Weight |
| --- | --- | --- | --- |
| display | Fira Sans Extra Condensed | clamp(56px, 9.2vw, 152px), lh 0.9 | 800 |
| h2 | Fira Sans Extra Condensed | clamp(44px, 6vw, 96px), lh 0.95 | 800 |
| h3 | Fira Sans Extra Condensed | 32px, lh 1 | 700 |
| body-lg | Onest | 20px / 1.5 | 400 |
| body | Onest | 17px / 1.55 | 400 |
| small | Onest | 15px / 1.45 | 500 |
| micro | Onest | 13px / 1.4 | 500 |
| wordmark | Russo One | 22px | 400 |

Reason: Fira Sans Extra Condensed has Cyrillic and the tall, tight proportions of light-box
sign lettering; Onest is a calm Cyrillic grotesk past the reflex list. Mini-site concepts use
their own client faces (Prata, Oswald, Jost, Russo One) — they are the "client's" brand, not ours.

## Color

| Token | Value | Use |
| --- | --- | --- |
| --c-bg | #0A0908 | page ground (warm black) |
| --c-bg-2 | #141210 | raised bands, frames |
| --c-line | rgb(237 233 227 / 0.14) | rules, frame borders |
| --c-text | #EDE9E3 | primary text |
| --c-text-2 | #A9A39B | secondary text (7.4:1 on bg) |
| --c-accent | #FF6B1A | sodium orange: primary button, active index item, focus |
| --c-accent-ink | #160A03 | text on accent |
| --chrome | gradient, see index.css | display type only |

## Spacing, radius, sizes

- Spacing scale (px): 4, 8, 12, 16, 24, 32, 48, 64, 96, 144.
- Radius: 8 (controls, chips), 16 (frames, modal). Nothing else.
- Buttons: md 48px high, padding 0 24px; lg 56px high, padding 0 32px.
- Container: max 1320px, gutter 24px (16px under 640px).

## Motion

| Token | Value |
| --- | --- |
| --m-fast | 160ms |
| --m-base | 280ms |
| --m-slow | 600ms |
| --m-ease | cubic-bezier(0.2, 0.7, 0.2, 1) |
| press/hover/focus | interaction kit (`src/kit`), focus ring = --c-accent |

Effects in use: hero WebGL ribbons (one live field per page), chrome type sheen, React Bits
SplitText (hero heading reveal), React Bits ScrollVelocity (niche marquee).
