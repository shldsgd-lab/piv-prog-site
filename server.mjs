import { createHmac, createHash, timingSafeEqual, randomBytes } from 'node:crypto';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sendQuickTest, startTelegramBot } from './telegram-bot.mjs';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)));
try {
  const envFile = await readFile(resolve(root, '.env'), 'utf8');
  for (const line of envFile.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)?\s*$/);
    if (!match || Object.hasOwn(process.env, match[1])) continue;
    let value = (match[2] || '').trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    } else {
      value = value.replace(/\s+#.*$/, '').trim();
    }
    process.env[match[1]] = value.replace(/\\n/g, '\n');
  }
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
const storePath = resolve(root, 'data', 'modules.json');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8' };
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || '127.0.0.1';
const botToken = process.env.TELEGRAM_BOT_TOKEN || '';
const botUsername = (process.env.TELEGRAM_BOT_USERNAME || '').replace(/^@/, '');
const publicOrigin = process.env.PUBLIC_ORIGIN || '';
let store = { modules: [] };
try {
  store = JSON.parse(await readFile(storePath, 'utf8'));
  if (!Array.isArray(store.modules)) store = { modules: [] };
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

function authSecret() {
  if (!botToken) throw new Error('TELEGRAM_BOT_TOKEN is not configured');
  return createHash('sha256').update(botToken).digest();
}

function verifyTelegramLogin(payload) {
  if (!botToken || !payload || typeof payload !== 'object' || typeof payload.hash !== 'string') return null;
  const { hash, ...fields } = payload;
  if (!/^[a-f0-9]{64}$/i.test(hash)) return null;
  const authDate = Number(fields.auth_date);
  if (!Number.isFinite(authDate) || Math.abs(Date.now() / 1000 - authDate) > 86400) return null;
  const checkString = Object.keys(fields).sort().map(key => `${key}=${fields[key]}`).join('\n');
  const expected = createHmac('sha256', authSecret()).update(checkString).digest();
  const supplied = Buffer.from(hash, 'hex');
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;
  if (!/^\d+$/.test(String(fields.id || ''))) return null;
  return {
    id: String(fields.id),
    first_name: String(fields.first_name || 'Игрок').slice(0, 64),
    last_name: String(fields.last_name || '').slice(0, 64),
    username: String(fields.username || '').slice(0, 64),
    photo_url: String(fields.photo_url || '').slice(0, 2048)
  };
}

function makeCookie(user) {
  const token = Buffer.from(JSON.stringify({ user, exp: Date.now() + 7 * 86400000 })).toString('base64url');
  const signature = createHmac('sha256', authSecret()).update(token).digest('base64url');
  return `${token}.${signature}`;
}

function getSession(request) {
  const raw = request.headers.cookie?.split(';').map(part => part.trim()).find(part => part.startsWith('piv_session='))?.slice('piv_session='.length);
  if (!raw || !botToken) return null;
  const [token, signature] = raw.split('.');
  if (!token || !signature) return null;
  const expected = createHmac('sha256', authSecret()).update(token).digest();
  let supplied;
  try { supplied = Buffer.from(signature, 'base64url'); } catch { return null; }
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;
  try {
    const session = JSON.parse(Buffer.from(token, 'base64url').toString());
    return session.exp > Date.now() ? session.user : null;
  } catch { return null; }
}

async function readBody(request, maxBytes = 2_000_000) {
  const chunks = [];
  let length = 0;
  for await (const chunk of request) {
    length += chunk.length;
    if (length > maxBytes) throw new Error('Request is too large');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function persistStore() {
  await mkdir(resolve(root, 'data'), { recursive: true });
  await writeFile(storePath, JSON.stringify(store, null, 2), { mode: 0o600 });
}

function sendJson(response, status, value, extraHeaders = {}) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extraHeaders });
  response.end(JSON.stringify(value));
}

function validModule(value) {
  if (value?.version !== 1 || value.schema !== 'piv-mechanics/1' || !Array.isArray(value.nodes) ||
      !Array.isArray(value.connections) || value.nodes.length > 500 || value.connections.length > 2000) return false;
  if (value.gameDatabase !== undefined) {
    const database = value.gameDatabase;
    const collections = [
      database?.inventory?.items,
      database?.achievements,
      database?.recipes,
      database?.clan?.quests,
      database?.variables
    ];
    if (!database || typeof database !== 'object' || Array.isArray(database) ||
        collections.some(list => !Array.isArray(list) || list.length > 500) ||
        Buffer.byteLength(JSON.stringify(database), 'utf8') > 500_000) return false;
  }
  const ids = new Set();
  for (const node of value.nodes) {
    if (!node || typeof node.id !== 'string' || ids.has(node.id) || typeof node.type !== 'string' ||
        !Number.isFinite(node.x) || !Number.isFinite(node.y) || node.id.length > 128) return false;
    ids.add(node.id);
  }
  return value.connections.every(edge => edge && ids.has(edge.from) && ids.has(edge.to) && edge.from !== edge.to);
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || '/', 'http://localhost');
  if (url.pathname.startsWith('/api/')) {
    try {
      if (request.method === 'GET' && url.pathname === '/api/config') {
        sendJson(response, 200, { telegramConfigured: Boolean(botToken && botUsername), botUsername });
        return;
      }
      if (request.method === 'POST' && url.pathname === '/api/auth/telegram') {
        const payload = await readBody(request, 16_384);
        const user = verifyTelegramLogin(payload);
        if (!user) {
          sendJson(response, 401, { error: 'Не удалось подтвердить вход Telegram.' });
          return;
        }
        const secure = publicOrigin.startsWith('https://') ? '; Secure' : '';
        sendJson(response, 200, { user }, {
          'Set-Cookie': `piv_session=${makeCookie(user)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${secure}`
        });
        return;
      }
      if (request.method === 'GET' && url.pathname === '/api/auth/me') {
        const user = getSession(request);
        sendJson(response, user ? 200 : 401, user ? { user } : { error: 'Требуется вход через Telegram.' });
        return;
      }
      if (request.method === 'POST' && url.pathname === '/api/auth/logout') {
        sendJson(response, 200, { ok: true }, { 'Set-Cookie': 'piv_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0' });
        return;
      }
      const user = getSession(request);
      if (!user) {
        sendJson(response, 401, { error: 'Требуется вход через Telegram.' });
        return;
      }
      if (request.method === 'GET' && url.pathname === '/api/mechanics') {
        sendJson(response, 200, { modules: store.modules.filter(item => item.ownerId === user.id).map(({ id, title, createdAt }) => ({ id, title, createdAt })) });
        return;
      }
      const mechanicMatch = url.pathname.match(/^\/api\/mechanics\/([A-Za-z0-9_-]+)$/);
      if (request.method === 'PATCH' && mechanicMatch) {
        const item = store.modules.find(module => module.id === mechanicMatch[1] && module.ownerId === user.id);
        if (!item) {
          sendJson(response, 404, { error: 'Механика не найдена.' });
          return;
        }
        const body = await readBody(request, 16_384);
        const title = String(body.title || '').trim();
        if (!title || title.length > 100) {
          sendJson(response, 400, { error: 'Название должно содержать от 1 до 100 символов.' });
          return;
        }
        item.title = title;
        item.module.name = title;
        await persistStore();
        sendJson(response, 200, { id: item.id, title: item.title });
        return;
      }
      if (request.method === 'POST' && url.pathname === '/api/mechanics/send') {
        if (!botToken || !botUsername) {
          sendJson(response, 503, { error: 'Тест-бот не настроен.' });
          return;
        }
        const body = await readBody(request);
        if (!validModule(body.module)) {
          sendJson(response, 400, { error: 'Файл механики имеет некорректный формат.' });
          return;
        }
        const title = String(body.title || body.module.name || 'Механика').trim();
        if (!title || title.length > 100) {
          sendJson(response, 400, { error: 'Название должно содержать от 1 до 100 символов.' });
          return;
        }
        const item = {
          id: randomBytes(10).toString('base64url'),
          ownerId: user.id,
          ownerName: user.username ? `@${user.username}` : user.first_name,
          title,
          createdAt: new Date().toISOString(),
          module: { ...body.module, name: title }
        };
        store.modules.push(item);
        await persistStore();
        try {
          const delivery = await sendQuickTest(botToken, user.id, item);
          sendJson(response, 200, { id: item.id, title: item.title, messageId: delivery.message_id });
        } catch (error) {
          store.modules = store.modules.filter(module => module.id !== item.id);
          await persistStore();
          console.error('Quick test DM failed:', error.message);
          sendJson(response, 409, { error: `Не удалось отправить в личку. Сначала нажми Start в @${botUsername}, затем повтори отправку.` });
        }
        return;
      }
      if (request.method === 'POST' && url.pathname === '/api/mechanics') {
        const body = await readBody(request);
        if (!validModule(body.module)) {
          sendJson(response, 400, { error: 'Файл механики имеет некорректный формат.' });
          return;
        }
        const title = String(body.title || body.module.name || 'Механика').trim();
        if (!title || title.length > 100) {
          sendJson(response, 400, { error: 'Название должно содержать от 1 до 100 символов.' });
          return;
        }
        const module = {
          id: randomBytes(10).toString('base64url'),
          ownerId: user.id,
          ownerName: user.username ? `@${user.username}` : user.first_name,
          title,
          module: { ...body.module, name: title },
          createdAt: new Date().toISOString()
        };
        store.modules.push(module);
        await persistStore();
        const activateLink = botUsername ? `https://t.me/${botUsername}?start=activate_${module.id}` : null;
        sendJson(response, 201, { id: module.id, title: module.title, botLink: activateLink, activateLink });
        return;
      }
      sendJson(response, 404, { error: 'API endpoint not found.' });
      return;
    } catch (error) {
      console.error('API request failed:', error);
      sendJson(response, error.message === 'Request is too large' ? 413 : 400, { error: error.message || 'Request failed.' });
      return;
    }
  }

  const pathname = url.pathname;
  let requested;
  try {
    requested = pathname === '/' ? 'index.html' : decodeURIComponent(pathname.slice(1));
  } catch {
    response.writeHead(400).end('Bad request');
    return;
  }
  if (!['index.html', 'app.js', 'styles.css'].includes(requested)) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
    return;
  }
  const file = resolve(root, requested);
  try {
    const data = await readFile(file);
    response.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(data);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
  }
});

server.listen(port, host, () => {
  console.log(`Пивовар — мастерская механик: http://localhost:${port}`);
  if (!botToken || !botUsername) console.warn('Telegram вход/бот не активны: задайте TELEGRAM_BOT_TOKEN и TELEGRAM_BOT_USERNAME.');
});

if (botToken && botUsername) {
  startTelegramBot({
    token: botToken,
    username: botUsername,
    store,
    persist: persistStore
  });
}
