export async function onRequest({ request, env }) {
  if (!env.API_ORIGIN) {
    return Response.json(
      { error: 'Backend is not configured. Set the Cloudflare Pages API_ORIGIN variable.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  let backend;
  try {
    backend = new URL(env.API_ORIGIN);
  } catch {
    return Response.json(
      { error: 'Cloudflare Pages API_ORIGIN must be a valid HTTPS URL.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
  if (backend.protocol !== 'https:') {
    return Response.json(
      { error: 'Cloudflare Pages API_ORIGIN must use HTTPS.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const incoming = new URL(request.url);
  backend.pathname = `${backend.pathname.replace(/\/+$/, '')}${incoming.pathname}`;
  backend.search = incoming.search;
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('content-length');

  const upstream = new Request(backend, request);
  const response = await fetch(new Request(upstream, { headers, redirect: 'manual' }));
  const resultHeaders = new Headers(response.headers);
  resultHeaders.set('Cache-Control', 'no-store');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: resultHeaders
  });
}
