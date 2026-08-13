import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// PDF.js ships its worker as a separate file. We import it with `?url`
// in lib/pdfRender.js so Vite bundles it correctly — no extra config needed here.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});
