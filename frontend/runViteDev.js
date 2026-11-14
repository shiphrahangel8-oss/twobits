import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const ideNodeModules = process.env.LOCALAPPDATA
  ? path.resolve(process.env.LOCALAPPDATA, 'Programs', 'Antigravity IDE', 'resources', 'app', 'node_modules')
  : '';

async function startVite() {
  let vitePkg;
  try {
    vitePkg = await import('vite');
  } catch {
    const vitePath = path.resolve(ideNodeModules, 'vite', 'dist', 'node', 'index.js');
    vitePkg = await import(`file:///${vitePath.replace(/\\/g, '/')}`);
  }

  const server = await vitePkg.createServer({
    root: __dirname,
    configFile: path.resolve(__dirname, 'vite.config.js'),
    server: {
      port: 5173,
      host: '0.0.0.0',
    },
  });

  await server.listen();
  server.printUrls();
}

startVite().catch((err) => {
  console.error('Failed to start Vite dev server:', err);
  process.exit(1);
});
