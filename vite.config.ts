import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        html2canvas: 'html2canvas-pro',
        // Vite 6 externalizes node builtins; force browser buffer polyfill for client build
        buffer: path.resolve(__dirname, 'node_modules/buffer'),
      },
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('OrgChartWizardPage')) return 'feature-orgchart';
            if (id.includes('RoleProfileModal') || id.includes('RoleProfilePdfDocument')) return 'feature-roleprofile';
            if (id.includes('EvidenceDrawer')) return 'feature-evidencedrawer';
            if (id.includes('node_modules')) {
              if (id.includes('lucide-react')) return 'vendor-icons';
              if (id.includes('framer-motion')) return 'vendor-motion';
              if (id.includes('jspdf') || id.includes('html2pdf') || id.includes('html2canvas')) return 'vendor-pdf';
              if (id.includes('react-dom') || id.includes('react')) return 'vendor-react';
              return 'vendor-core';
            }
          }
        }
      }
    },
    server: {
      host: '127.0.0.1',
      hmr: {
        host: '127.0.0.1',
        port: process.env.PORT ? parseInt(process.env.PORT, 10) + 20000 : 24678
      },
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: ['**/data/**', '**/db.json']
      },
    },
  };
});
