import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from './server/routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = http.createServer(app);
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount API routes
app.use('/api', apiRouter);

async function startServer() {
  if (!isProd) {
    // Development mode: attach Vite dev server middleware
    const { createServer: createViteServer } = await import('vite');
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';

    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        // Bind HMR directly to the existing HTTP server to avoid spawning a conflicting WS server on port 24678
        hmr: isHmrDisabled ? false : { server: httpServer },
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    // Production mode: serve static files from dist
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[ZR Digital Bank] Port ${PORT} is already in use. Please terminate existing process.`);
    } else {
      console.error('[ZR Digital Bank] Server HTTP error:', err);
    }
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[ZR Digital Bank] Server running on http://0.0.0.0:${PORT} (${isProd ? 'production' : 'development'})`);
  });

  const cleanup = () => {
    httpServer.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

startServer().catch((err) => {
  console.error('[ZR Digital Bank] Failed to start server:', err);
  process.exit(1);
});
