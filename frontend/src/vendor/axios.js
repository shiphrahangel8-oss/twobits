/**
 * Standards-compliant Axios client implementation backed by Fetch API
 * Supports axios.create(), interceptors.request.use(), .get(), .post(), .patch(), .put(), .delete()
 * and throws err.response = { status, data } on non-2xx responses.
 */
function createInstance(defaultConfig = {}) {
  const requestInterceptors = [];

  async function request(method, url, dataOrConfig = {}, extraConfig = {}) {
    let config = {
      baseURL: defaultConfig.baseURL || '',
      headers: { ...(defaultConfig.headers || {}) },
      method: method.toUpperCase(),
      url,
      params: undefined,
      data: undefined,
    };

    if (['GET', 'DELETE'].includes(config.method)) {
      config = { ...config, ...(dataOrConfig || {}) };
    } else {
      config = { ...config, ...(extraConfig || {}), data: dataOrConfig };
    }

    for (const fn of requestInterceptors) {
      config = (await fn(config)) || config;
    }

    const base = (config.baseURL || '').replace(/\/$/, '');
    const path = config.url.startsWith('http')
      ? config.url
      : `${base}${config.url.startsWith('/') ? '' : '/'}${config.url}`;

    const urlObj = new URL(path, window.location.origin);
    if (config.params && typeof config.params === 'object') {
      Object.entries(config.params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          urlObj.searchParams.set(k, String(v));
        }
      });
    }

    const fetchOptions = {
      method: config.method,
      headers: config.headers,
    };

    if (config.data !== undefined && !['GET', 'HEAD'].includes(config.method)) {
      fetchOptions.body = JSON.stringify(config.data);
    }

    const response = await fetch(urlObj.toString(), fetchOptions);
    let parsed = null;
    const text = await response.text();
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = text;
    }

    if (!response.ok) {
      const error = new Error(parsed?.error || `Request failed with status code ${response.status}`);
      error.response = {
        status: response.status,
        data: parsed,
      };
      throw error;
    }

    return {
      status: response.status,
      data: parsed,
      headers: response.headers,
    };
  }

  return {
    interceptors: {
      request: {
        use(fn) {
          requestInterceptors.push(fn);
        },
      },
    },
    get: (url, cfg) => request('GET', url, cfg),
    delete: (url, cfg) => request('DELETE', url, cfg),
    post: (url, data, cfg) => request('POST', url, data, cfg),
    put: (url, data, cfg) => request('PUT', url, data, cfg),
    patch: (url, data, cfg) => request('PATCH', url, data, cfg),
  };
}

const axios = {
  create: createInstance,
  ...createInstance(),
};

export default axios;
