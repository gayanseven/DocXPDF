import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// PDF.js ships its worker as a separate file. We import it with `?url`
// in lib/pdfRender.js so Vite bundles it correctly — no extra config needed here.
export default defineConfig(() => ({
  // Only GitHub Pages serves this app from a /DocXPDF/ subpath — the deploy
  // workflow sets GITHUB_PAGES=true for that build. Every other host
  // (Vercel, local dev, `vite preview`) serves from the domain root.
  base: process.env.GITHUB_PAGES === 'true' ? '/DocXPDF/' : '/',
  plugins: [react()],
  server: { port: 5173 },
}));
