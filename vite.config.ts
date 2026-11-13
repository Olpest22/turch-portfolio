import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': r('./src') } },
  build: {
    chunkSizeWarningLimit: 1600,
    rolldownOptions: {
      input: {
        main: r('./index.html'),
        remont: r('./remont/index.html'),
        potolki: r('./potolki/index.html'),
        mebel: r('./mebel/index.html'),
      },
    },
  },
});
