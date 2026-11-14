import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

process.env.BASELINE_BROWSER_MAPPING_IGNORE_OLD_DATA = 'true';
process.env.BROWSERSLIST_IGNORE_OLD_DATA = 'true';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const ideNodeModules = process.env.LOCALAPPDATA
  ? path.resolve(process.env.LOCALAPPDATA, 'Programs', 'Antigravity IDE', 'resources', 'app', 'node_modules')
  : '';

function loadPostcssPlugin(name, configArg) {
  try {
    const fn = require(name);
    return configArg ? fn(configArg) : fn();
  } catch {
    if (ideNodeModules) {
      const p = path.resolve(ideNodeModules, name);
      if (fs.existsSync(p)) {
        const fn = require(p);
        return configArg ? fn(configArg) : fn();
      }
    }
    return null;
  }
}

const tw = loadPostcssPlugin('tailwindcss', path.resolve(__dirname, 'tailwind.config.js'));
const ap = loadPostcssPlugin('autoprefixer');

export default {
  plugins: [tw, ap].filter(Boolean),
};
