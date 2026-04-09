import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import net from 'net';
import { initDatabase } from './backend/db/database.js';
import cardRoutes from './backend/routes/cardRoutes.js';
import userRoutes from './backend/routes/userRoutes.js';
import groupRoutes from './backend/routes/groupRoutes.js';

const LISTEN_HOST = process.env.APP_HOST ?? '0.0.0.0';
const VITE_HOST = process.env.VITE_DEV_HOST ?? process.env.HOST ?? '127.0.0.1';
const DISPLAY_HOST = process.env.PUBLIC_DEV_HOST ?? (LISTEN_HOST === '0.0.0.0' ? '127.0.0.1' : LISTEN_HOST);
const DESIRED_PORT = readPort(process.env.PORT, 3000);
const DESIRED_HMR_PORT = readPort(process.env.VITE_HMR_PORT, 24678);
const PORT_SEARCH_LIMIT = Number(process.env.PORT_SEARCH_LIMIT ?? 20);

function readPort(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

async function ensureAvailablePort(
  preferred: number,
  host: string,
  label: string,
  envVar: string,
  maxAttempts = PORT_SEARCH_LIMIT,
) {
  if (preferred === 0) return 0;
  const startingPort = preferred > 0 ? preferred : fallbackPort();
  let port = startingPort;

  for (let attempt = 0; attempt <= maxAttempts; attempt += 1) {
    const isFree = await canBindPort(port, host);
    if (isFree) {
      if (port !== startingPort) {
        console.warn(`[${label}] Port ${startingPort} is busy on ${host}. Using ${port} instead (override via ${envVar}).`);
      }
      return port;
    }
    port += 1;
  }

  throw new Error(`[${label}] Unable to find a free port starting at ${startingPort}. Increase ${envVar} or free a port.`);
}

function fallbackPort() {
  return 3000;
}

function canBindPort(port: number, host: string) {
  return new Promise<boolean>((resolve, reject) => {
    const tester = net.createServer();
    tester.unref();

    const closeServer = () => {
      if (tester.listening) {
        tester.close();
      }
    };

    tester.once('error', (error: NodeJS.ErrnoException) => {
      closeServer();
      if (error.code === 'EADDRINUSE') {
        resolve(false);
        return;
      }
      reject(error);
    });

    tester.once('listening', () => {
      closeServer();
      resolve(true);
    });

    tester.listen(port, host);
  });
}

async function startServer() {
  const app = express();
  const serverPort =
    DESIRED_PORT === 0 ? 0 : await ensureAvailablePort(DESIRED_PORT, LISTEN_HOST, 'API server', 'PORT');

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Initialize Database
  initDatabase();

  // API Routes
  app.use('/api/cards', cardRoutes);
  app.use('/api/groups', groupRoutes);
  app.use('/api', userRoutes);

  // Vite Middleware
  if (process.env.NODE_ENV !== 'production') {
    const hmrPort =
      DESIRED_HMR_PORT === 0
        ? undefined
        : await ensureAvailablePort(DESIRED_HMR_PORT, VITE_HOST, 'Vite HMR', 'VITE_HMR_PORT');
    const hmrOptions: { host: string; port?: number; clientPort?: number } = { host: VITE_HOST };
    if (typeof hmrPort === 'number' && hmrPort > 0) {
      hmrOptions.port = hmrPort;
      hmrOptions.clientPort = hmrPort;
    }

    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: VITE_HOST,
        hmr: hmrOptions,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const serverInstance = app.listen(serverPort, LISTEN_HOST, () => {
    const address = serverInstance.address();
    const activePort = typeof address === 'object' && address ? address.port : serverPort;
    console.log(`Server running on http://${DISPLAY_HOST}:${activePort}`);
  });

  serverInstance.on('error', (error: NodeJS.ErrnoException) => {
    console.error(`[API server] ${error.message}`);
    process.exit(1);
  });
}

startServer().catch(error => {
  console.error(error);
  process.exit(1);
});
