import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// PDF.js ships its worker as a separate file. We import it with `?url`
// in lib/pdfRender.js so Vite bundles it correctly — no extra config needed here.
export default defineConfig(({ command }) => ({
  // Served from https://gayanseven.github.io/DocXPDF/ on GitHub Pages, so
  // production asset URLs need the repo-name subpath; local dev stays at root.
  base: command === 'build' ? '/DocXPDF/' : '/',
  plugins: [react()],
  server: { port: 5173 },
}));
