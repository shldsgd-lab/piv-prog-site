function jsonError(status, error) {
  return Response.json({ error }, {
    status,
    headers: { 'Cache-Control': 'no-store' }
  });
}

export default {
  async fetch(request, env) {
    const incoming = new URL(request.url);
    if (!incoming.pathname.startsWith('/api/')) {
      return env.ASSETS.fetch(request);
    }

    if (!env.API_ORIGIN) {
      return jsonError(503, 'Worker API_ORIGIN is not configured.');
    }

    let backend;
    try {
      backend = new URL(env.API_ORIGIN);
    } catch {
      return jsonError(500, 'Worker API_ORIGIN must be a valid HTTPS URL.');
    }
    if (backend.protocol !== 'https:') {
      return jsonError(500, 'Worker API_ORIGIN must use HTTPS.');
    }

    backend.pathname = `${backend.pathname.replace(/\/+$/, '')}${incoming.pathname}`;
    backend.search = incoming.search;

    const headers = new Headers(request.headers);
    headers.delete('host');
    headers.delete('content-length');
    const method = request.method.toUpperCase();
    const options = {
      method,
      headers,
      redirect: 'manual'
    };
    if (method !== 'GET' && method !== 'HEAD') options.body = request.body;

    try {
      const upstream = await fetch(new Request(backend, options));
      const responseHeaders = new Headers(upstream.headers);
      responseHeaders.set('Cache-Control', 'no-store');
      return new Response(upstream.body, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers: responseHeaders
      });
    } catch (error) {
      console.error('Worker API proxy request failed:', error);
      return jsonError(502, 'Не удалось подключиться к API-серверу. Проверь API_ORIGIN и доступность backend.');
    }
  }
};
