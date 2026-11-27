import { defineConfig, type Plugin } from 'vite';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/* Personal first screens: pitches/<slug>/pitch.json → dist/p/<slug>/ = the niche demo with the lead's data
   injected as window.__PITCH__ (read by src/shared/brand.ts). See pitches/README.md. */
function pitches(): Plugin {
  return {
    name: 'pitches',
    apply: 'build',
    closeBundle() {
      const root = r('./pitches');
      if (!existsSync(root)) return;
      const site = process.env.VITE_SITE_URL || '';
      for (const slug of readdirSync(root)) {
        const dir = `${root}/${slug}`;
        if (!existsSync(`${dir}/pitch.json`)) continue;
        const cfg = { ...JSON.parse(readFileSync(`${dir}/pitch.json`, 'utf8')), slug };
        const src = r(`./dist/${cfg.demo}/index.html`);
        if (!existsSync(src)) { console.warn(`pitch ${slug}: no demo "${cfg.demo}"`); continue; }
        const title = `${cfg.brand} — первый экран сайта`;
        const og = existsSync(`${dir}/shot-d.png`) ? `<meta property="og:image" content="${site}p/${slug}/shot-d.png" />` : '';
        const head = `<title>${esc(title)}</title>\n    <meta name="robots" content="noindex, nofollow" />\n    <meta property="og:title" content="${esc(title)}" />${og}\n    <script>window.__PITCH__=${JSON.stringify(cfg).replace(/</g, '\\u003c')}</script>`;
        const html = readFileSync(src, 'utf8').replace(/<title>[\s\S]*?<\/title>/, head);
        const out = r(`./dist/p/${slug}`);
        mkdirSync(out, { recursive: true });
        writeFileSync(`${out}/index.html`, html);
        for (const f of readdirSync(dir)) if (f !== 'pitch.json' && !f.startsWith('src-')) copyFileSync(`${dir}/${f}`, `${out}/${f}`);
      }
    },
  };
}

export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react(), tailwindcss(), pitches()],
  resolve: { alias: { '@': r('./src') } },
  build: {
    chunkSizeWarningLimit: 1600,
    rolldownOptions: {
      input: {
        main: r('./index.html'),
        remont: r('./remont/index.html'),
        potolki: r('./potolki/index.html'),
        mebel: r('./mebel/index.html'),
        link: r('./link/index.html'),
        leads: r('./leads/index.html'),
        vyveski: r('./vyveski/index.html'),
        kuzov: r('./kuzov/index.html'),
        kuhni: r('./kuhni/index.html'),
        tipografiya: r('./tipografiya/index.html'),
      },
    },
  },
});
