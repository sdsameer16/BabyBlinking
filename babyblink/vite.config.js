import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // To add only specific polyfills, add them here. If no option is passed, adds all polyfills
      include: ['buffer', 'process', 'util', 'stream'],
      // To exclude specific polyfills, add them to this list.
      exclude: [
        'http', // Excludes the polyfill for `http` and `node:http`.
      ],
      // Whether to polyfill specific globals.
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
    })
  ],
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['simple-peer', 'buffer', 'process']
  }

    ,
    // Dev server proxy to avoid CORS when calling the deployed backend during local development
    server: {
      proxy: {
        // Proxy any /api requests to the deployed backend so browser treats them as same-origin
        '/api': {
          target: 'https://babyblinking.onrender.com',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api/, '/api')
        }
      }
    }

})
