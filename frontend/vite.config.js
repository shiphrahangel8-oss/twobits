import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

process.env.BASELINE_BROWSER_MAPPING_IGNORE_OLD_DATA = 'true';
process.env.BROWSERSLIST_IGNORE_OLD_DATA = 'true';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ideNodeModules = process.env.LOCALAPPDATA
  ? path.resolve(process.env.LOCALAPPDATA, 'Programs', 'Antigravity IDE', 'resources', 'app', 'node_modules')
  : '';

function resolvePkg(pkg) {
  const localPath = path.resolve(__dirname, 'node_modules', pkg);
  if (fs.existsSync(localPath)) return localPath;
  if (ideNodeModules) {
    const idePath = path.resolve(ideNodeModules, pkg);
    if (fs.existsSync(idePath)) return idePath;
  }
  return pkg;
}

export default {
  resolve: {
    alias: {
      axios: fs.existsSync(path.resolve(__dirname, 'node_modules/axios'))
        ? path.resolve(__dirname, 'node_modules/axios')
        : path.resolve(__dirname, 'src/vendor/axios.js'),
      'react-router-dom': fs.existsSync(path.resolve(__dirname, 'node_modules/react-router-dom'))
        ? path.resolve(__dirname, 'node_modules/react-router-dom')
        : path.resolve(__dirname, 'src/vendor/react-router-dom.jsx'),
      react: resolvePkg('react'),
      'react-dom': resolvePkg('react-dom'),
      'lucide-react': resolvePkg('lucide-react'),
    },
  },
  esbuild: {
    jsx: 'automatic',
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
};
