import http from 'http';
import { URL } from 'url';

let expressLib = null;
let corsLib = null;

try {
  const expMod = await import('express');
  expressLib = expMod.default || expMod;
  const corsMod = await import('cors');
  corsLib = corsMod.default || corsMod;
} catch {
  expressLib = null;
}

export function createRouter() {
  if (expressLib) {
    return expressLib.Router();
  }

  const routes = [];
  const register = (method, pathPattern, ...handlers) => {
    const paramNames = [];
    const regexPath = pathPattern.replace(/:([a-zA-Z0-9_]+)/g, (_, paramName) => {
      paramNames.push(paramName);
      return '([^/]+)';
    });
    const regex = new RegExp(`^${regexPath}/?$`);
    routes.push({ method: method.toUpperCase(), pathPattern, regex, paramNames, handlers });
  };

  return {
    _isFallbackRouter: true,
    routes,
    get: (p, ...h) => register('GET', p, ...h),
    post: (p, ...h) => register('POST', p, ...h),
    patch: (p, ...h) => register('PATCH', p, ...h),
    put: (p, ...h) => register('PUT', p, ...h),
    delete: (p, ...h) => register('DELETE', p, ...h),
  };
}

export function createApp() {
  if (expressLib) {
    const app = expressLib();
    if (corsLib) {
      app.use(
        corsLib({
          origin: '*',
          methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
          allowedHeaders: ['Content-Type', 'Authorization'],
        })
      );
    }
    app.use(expressLib.json({ limit: '5mb' }));
    return app;
  }

  const mountedRouters = [];
  const directRoutes = createRouter();

  async function dispatchRequest({ method = 'GET', url = '/', headers = {}, body = {} }) {
    const parsedUrl = new URL(url, 'http://localhost');
    const pathname = parsedUrl.pathname;
    const query = Object.fromEntries(parsedUrl.searchParams.entries());

    let statusCode = 200;
    let responseData = null;

    const req = {
      method: method.toUpperCase(),
      url,
      headers: Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])),
      query,
      body: body || {},
      params: {},
    };

    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(obj) {
        responseData = obj;
        return this;
      },
    };

    const candidates = [];
    for (const m of mountedRouters) {
      if (pathname.startsWith(m.prefix)) {
        const subPath = pathname.slice(m.prefix.length) || '/';
        candidates.push({ subPath, routes: m.router.routes });
      }
    }
    candidates.push({ subPath: pathname, routes: directRoutes.routes });

    for (const cand of candidates) {
      for (const rt of cand.routes) {
        if (rt.method !== req.method) continue;
        const match = cand.subPath.match(rt.regex);
        if (match) {
          req.params = {};
          rt.paramNames.forEach((name, idx) => {
            req.params[name] = decodeURIComponent(match[idx + 1]);
          });

          let idx = 0;
          const next = async (err) => {
            if (err) {
              statusCode = 500;
              responseData = { error: err.message || 'Server error' };
              return;
            }
            const handler = rt.handlers[idx++];
            if (!handler) return;
            try {
              await handler(req, res, next);
            } catch (e) {
              statusCode = 500;
              responseData = { error: e.message || 'Server error' };
            }
          };
          await next();
          return { status: statusCode, data: responseData };
        }
      }
    }

    return { status: 404, data: { error: `Route ${req.method} ${pathname} not found` } };
  }

  const app = {
    use(prefixOrFn, maybeRouter) {
      if (typeof prefixOrFn === 'string' && maybeRouter && maybeRouter._isFallbackRouter) {
        mountedRouters.push({ prefix: prefixOrFn.replace(/\/$/, ''), router: maybeRouter });
      }
    },
    get: (p, ...h) => directRoutes.get(p, ...h),
    post: (p, ...h) => directRoutes.post(p, ...h),
    patch: (p, ...h) => directRoutes.patch(p, ...h),
    inject: dispatchRequest,
    listen(port, cb) {
      const server = http.createServer(async (req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          return res.end();
        }

        let body = {};
        if (['POST', 'PATCH', 'PUT'].includes(req.method)) {
          try {
            const chunks = [];
            for await (const chunk of req) chunks.push(chunk);
            const raw = Buffer.concat(chunks).toString('utf8');
            body = raw ? JSON.parse(raw) : {};
          } catch {
            body = {};
          }
        }

        const result = await dispatchRequest({
          method: req.method,
          url: req.url,
          headers: req.headers,
          body,
        });

        res.statusCode = result.status;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(result.data));
      });

      return server.listen(port, cb);
    },
  };

  return app;
}
