import { randomBytes } from 'node:crypto';

const apiRoot = token => `https://api.telegram.org/bot${token}`;
const maxUploadBytes = 1_000_000;

function botRequest(token, method, body) {
  return fetch(`${apiRoot(token)}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).then(async response => {
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.description || `Telegram API ${response.status}`);
    return result.result;
  });
}

export async function sendQuickTest(token, chatId, item) {
  return botRequest(token, 'sendMessage', {
    chat_id: chatId,
    text: `🧪 Новая тестовая версия «${item.title}» отправлена в твою песочницу.\nНастоящие игровые данные и награды не используются.`,
    reply_markup: {
      inline_keyboard: [
        [{ text: '▶️ Запустить тест', callback_data: `test:${item.id}` }],
        [{ text: '📚 Мои механики', callback_data: 'menu:mine' }]
      ]
    }
  });
}
function userName(user) {
  return [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Игрок';
}

function mainMenu() {
  return {
    inline_keyboard: [
      [{ text: '🧪 Мои механики', callback_data: 'menu:mine' }],
      [{ text: '📥 Импортировать .piv', callback_data: 'menu:import' }],
      [{ text: '❔ Помощь', callback_data: 'menu:help' }]
    ]
  };
}

function getModule(store, id) {
  return store.modules.find(item => item.id === id);
}

function validModule(module) {
  if (module?.version !== 1 || module.schema !== 'piv-mechanics/1' ||
      !Array.isArray(module.nodes) || !Array.isArray(module.connections) ||
      module.nodes.length > 500 || module.connections.length > 2000) return false;
  const ids = new Set();
  for (const node of module.nodes) {
    if (!node || typeof node.id !== 'string' || ids.has(node.id) ||
        typeof node.type !== 'string' || !Number.isFinite(node.x) ||
        !Number.isFinite(node.y)) return false;
    ids.add(node.id);
  }
  return module.connections.every(edge => edge && ids.has(edge.from) &&
    ids.has(edge.to) && edge.from !== edge.to);
}

function moduleKeyboard(modules, ownerId) {
  const keyboard = [];
  for (const item of modules) {
    keyboard.push([{ text: `🧪 ${item.title.slice(0, 48)}`, callback_data: `test:${item.id}` }]);
    keyboard.push([
      { text: '🔗 Ссылка другу', callback_data: `share:${item.id}` },
      { text: '🗑 Удалить', callback_data: `delete:${item.id}` }
    ]);
  }
  keyboard.push([{ text: '⬅️ Меню', callback_data: 'menu:home' }]);
  return { inline_keyboard: keyboard };
}

function conditionResult(node, sandbox) {
  const values = node.values || {};
  if (node.type === 'if_else') {
    const left = sandbox.variables[String(values.variable || '')];
    const right = String(values.value ?? '');
    const operator = String(values.operator || 'Равно');
    let matches;
    if (values.valueType === 'Число') {
      const leftNumber = Number(left);
      const rightNumber = Number(right);
      matches = operator === 'Пустое'
        ? left === undefined || left === null || left === ''
        : Number.isFinite(leftNumber) && Number.isFinite(rightNumber)
        ? ({
            'Равно': leftNumber === rightNumber,
            'Не равно': leftNumber !== rightNumber,
            'Больше': leftNumber > rightNumber,
            'Меньше': leftNumber < rightNumber,
            'Содержит': false,
            'Не содержит': false,
            'Пустое': false
          }[operator] ?? false)
        : operator === 'Не равно';
    } else {
      const leftText = String(left ?? '');
      const needle = right.toLocaleLowerCase('ru');
      const haystack = leftText.toLocaleLowerCase('ru');
      matches = {
        'Равно': leftText === right,
        'Не равно': leftText !== right,
        'Больше': false,
        'Меньше': false,
        'Содержит': haystack.includes(needle),
        'Не содержит': !haystack.includes(needle),
        'Пустое': leftText.length === 0
      }[operator] ?? false;
    }
    return { key: matches ? 'true' : 'false', detail: `${values.variable || 'переменная'} ${operator} ${right}` };
  }
  if (node.type === 'inventory_has_item') {
    const count = sandbox.inventory[String(values.itemId || '')] || 0;
    const required = Number(values.required || 1);
    return { key: count >= required ? 'has' : 'missing', detail: `${values.itemId || 'предмет'}: ${count} / ${required}` };
  }
  if (node.type === 'inventory_find') {
    const aliases = { malt: 'солод malt', hops: 'хмель hops', yeast: 'дрожжи yeast', hop_bundle: 'набор хмеля hop bundle', yeast_pack: 'набор дрожжей yeast pack', test_reward: 'тестовая награда предмет' };
    const query = String(values.query || '').trim().toLocaleLowerCase('ru');
    const found = Object.entries(sandbox.inventory).find(([item, count]) =>
      query && (aliases[item] || item).toLocaleLowerCase('ru').includes(query) &&
        count >= Number(values.required || 1));
    return { key: found ? 'found' : 'not_found', detail: found ? `${found[0]} × ${found[1]}` : `«${query || 'пустой запрос'}» не найден` };
  }
  if (node.type === 'inventory_count') {
    const count = sandbox.inventory[String(values.itemId || '')] || 0;
    const amount = Number(values.amount || 0);
    const matches = {
      'Не меньше': count >= amount,
      'Больше': count > amount,
      'Равно': count === amount,
      'Меньше': count < amount
    }[values.operator] ?? false;
    return { key: matches ? 'match' : 'no_match', detail: `${values.itemId || 'предмет'}: ${count} ${values.operator || '≥'} ${amount}` };
  }
  if (node.type === 'inventory_is_empty') {
    const resources = new Set(['malt', 'hops', 'yeast']);
    const beverages = new Set(['amber_ale', 'ipa', 'stout', 'wheat_beer', 'lager']);
    const labels = { malt: 'солод', hops: 'хмель', yeast: 'дрожжи' };
    const hasItems = Object.entries(sandbox.inventory).some(([item, count]) => {
      if (Number(count) <= 0) return false;
      if (values.scope !== 'Категорию') return true;
      if (values.category === 'Ресурсы') return resources.has(item);
      if (values.category === 'Напитки') return beverages.has(item);
      if (values.category === 'Предметы') return !resources.has(item) && !beverages.has(item);
      return (labels[item] || item).toLocaleLowerCase('ru')
        .includes(String(values.category || '').toLocaleLowerCase('ru'));
    });
    const empty = !hasItems;
    return { key: empty ? 'empty' : 'not_empty', detail: empty ? 'инвентарь пуст' : 'в инвентаре есть предметы' };
  }
  if (node.type === 'wallet_has') {
    const balance = values.currency === 'Опыт' ? sandbox.experience : sandbox.beer;
    const amount = Number(values.amount || 0);
    const label = values.currency === 'Опыт' ? 'Опыт' : 'Литры пива';
    return { key: balance >= amount ? 'enough' : 'insufficient', detail: `${label}: ${balance} / ${amount}` };
  }
  if (node.type === 'recipe_known') {
    const known = sandbox.recipes.has(String(values.recipeId || ''));
    return { key: known ? 'known' : 'unknown', detail: `${values.recipeId || 'рецепт'} ${known ? 'открыт' : 'не открыт'}` };
  }
  if (node.type === 'achievement_unlocked') {
    const unlocked = sandbox.achievements.has(String(values.achievementId || ''));
    return { key: unlocked ? 'unlocked' : 'locked', detail: `${values.achievementId || 'достижение'} ${unlocked ? 'получено' : 'не получено'}` };
  }
  if (node.type === 'clan_member') {
    const member = Boolean(sandbox.clan) &&
      (values.membership !== 'В указанном клане' || sandbox.clanId === String(values.clanId || ''));
    return { key: member ? 'member' : 'not_member', detail: member ? `состоит в клане ${sandbox.clan}` : 'не состоит в указанном клане' };
  }
  return null;
}

function interpolateBotText(template, sandbox) {
  const builtins = {
    player: sandbox.playerName,
    'player.name': sandbox.playerName,
    player_name: sandbox.playerName,
    'player.id': sandbox.playerId,
    player_id: sandbox.playerId,
    user_id: sandbox.playerId,
    'user.name': sandbox.playerName,
    user_name: sandbox.playerName,
    username: sandbox.username,
    beer: sandbox.beer,
    coins: sandbox.beer,
    liters: sandbox.beer,
    experience: sandbox.experience,
    level: sandbox.level,
    brews: sandbox.brews,
    clan: sandbox.clan,
    'clan.name': sandbox.clan,
    clan_name: sandbox.clan,
    clan_id: sandbox.clanId,
    clan_role: sandbox.clanRole
  };
  return String(template)
    .replace(/\{\{\s*([^{}]+?)\s*\}\}/g, '{$1}')
    .replace(/\{([A-Za-zА-Яа-яЁё_][A-Za-zА-Яа-яЁё0-9_.-]*)\}/g, (match, key) => {
      if (Object.hasOwn(builtins, key.toLocaleLowerCase('en'))) return String(builtins[key.toLocaleLowerCase('en')] ?? '');
      return Object.hasOwn(sandbox.variables, key) ? String(sandbox.variables[key]) : match;
    });
}
function interpolateBotValues(values, sandbox) {
  return Object.fromEntries(Object.entries(values || {}).map(([key, value]) => [
    key, typeof value === 'string' ? interpolateBotText(value, sandbox) : value
  ]));
}

function messageKeyboard(node, chatId, callbackTokens, moduleId, sandbox) {
  const buttons = String(node.values?.buttons || '').split('\n')
    .map(row => row.split('|').map(part => part.trim()))
    .filter(([label, data]) => label && data)
    .slice(0, 20);
  const columns = Math.max(1, Math.min(8, Number(node.values?.columns) || 1));
  const rows = [];
  for (let index = 0; index < buttons.length; index += columns) {
    rows.push(buttons.slice(index, index + columns).map(([text, callback_data]) => {
      for (const [key, entry] of callbackTokens) {
        if (entry.expiresAt < Date.now()) callbackTokens.delete(key);
      }
      const token = randomBytes(6).toString('base64url');
      callbackTokens.set(token, { chatId: String(chatId), moduleId, callbackData: callback_data, expiresAt: Date.now() + 30 * 60_000 });
      return { text: interpolateBotText(text, sandbox).slice(0, 64), callback_data: `c:${token}` };
    }));
  }
  return rows.length ? { inline_keyboard: rows } : undefined;
}

function nodeMessage(node, sandbox) {
  const raw = String(node.values?.text || node.values?.message || node.values?.welcome || node.title || 'Действие механики');
  return interpolateBotText(raw, sandbox).slice(0, 4000);
}

function createSandbox(module) {
  const database = module?.gameDatabase;
  const defaultInventory = { malt: 3, hops: 2, yeast: 2, hop_bundle: 1 };
  const inventoryItems = Array.isArray(database?.inventory?.items) ? database.inventory.items : null;
  const inventory = inventoryItems
    ? Object.fromEntries(inventoryItems.filter(item => item && typeof item.id === 'string')
      .map(item => [item.id, Math.max(0, Number(item.quantity) || 0)]))
    : defaultInventory;
  const recipes = Array.isArray(database?.recipes)
    ? database.recipes.filter(recipe => recipe?.unlocked).map(recipe => String(recipe.id))
    : [];
  const beer = Number(database?.player?.beer);
  const experience = Number(database?.player?.experience);
  const sandbox = {
    inventory,
    beer: Number.isFinite(beer) ? Math.max(0, beer) : 450,
    experience: Number.isFinite(experience) ? Math.max(0, experience) : 125,
    playerName: String(database?.player?.name || 'Тестовый игрок'),
    playerId: String(database?.player?.telegramId || '100000001'),
    username: String(database?.player?.username || 'test_brewer').replace(/^@/, ''),
    level: Math.max(1, Number(database?.player?.level) || 1),
    brews: Math.max(0, Number(database?.player?.brews) || 0),
    recipes: new Set(recipes),
    achievements: new Set(Array.isArray(database?.achievements)
      ? database.achievements.filter(item => item?.unlocked).map(item => String(item.id))
      : []),
    variables: {},
    clan: String(database?.clan?.name || 'Северная бочка'),
    clanId: String(database?.clan?.id || 'north_barrel'),
    clanRole: String(database?.clan?.role || 'Участник'),
    clanProgress: 0
  };
  for (const key of ['player_name', 'player_id', 'user_name', 'user_id', 'username', 'level', 'beer', 'experience',
    'brews', 'clan_name', 'clan_id', 'clan_role']) {
    const builtin = {
      player_name: sandbox.playerName,
      player_id: sandbox.playerId,
      user_name: sandbox.playerName,
      user_id: sandbox.playerId,
      username: sandbox.username,
      level: sandbox.level,
      beer: sandbox.beer,
      experience: sandbox.experience,
      brews: sandbox.brews,
      clan_name: sandbox.clan,
      clan_id: sandbox.clanId,
      clan_role: sandbox.clanRole
    };
    sandbox.variables[key] = builtin[key];
  }
  if (Array.isArray(database?.variables)) {
    for (const item of database.variables) {
      if (!item || typeof item.key !== 'string') continue;
      sandbox.variables[item.key] = item.type === 'Число' && Number.isFinite(Number(item.value))
        ? Number(item.value) : String(item.value ?? '');
    }
  }
  return sandbox;
}

export function startTelegramBot({ token, username, store, persist }) {
  let offset = 0;
  const uploads = new Set();
  const activeTests = new Map();
  const callbackTokens = new Map();
  const sandboxStates = new Map();

  function clearTest(chatKey) {
    activeTests.delete(chatKey);
    sandboxStates.delete(chatKey);
    for (const [key, callback] of callbackTokens) {
      if (callback.chatId === chatKey) callbackTokens.delete(key);
    }
  }

  async function send(chatId, text, replyMarkup) {
    return botRequest(token, 'sendMessage', {
      chat_id: chatId,
      text: String(text).slice(0, 4096),
      ...(replyMarkup ? { reply_markup: replyMarkup } : {})
    });
  }

  async function editMessage(chatId, messageId, text, replyMarkup) {
    return botRequest(token, 'editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text: String(text).slice(0, 4096),
      ...(replyMarkup ? { reply_markup: replyMarkup } : {})
    });
  }

  async function showMenu(chatId, user) {
    await send(chatId, `🍺 Пивовар — тестовая мастерская\n\nПривет, ${userName(user)}! Здесь можно хранить несколько .piv-механик, проверять их в изолированном тесте и приглашать друзей по ссылке. Награды и игровые данные не затрагиваются.`, mainMenu());
  }

  async function showModules(chatId, userId) {
    const own = store.modules.filter(item => item.ownerId === String(userId));
    if (!own.length) {
      await send(chatId, 'Пока нет загруженных механик. Нажми «Импортировать .piv» и отправь файл сюда.', {
        inline_keyboard: [[{ text: '📥 Импортировать .piv', callback_data: 'menu:import' }], [{ text: '⬅️ Меню', callback_data: 'menu:home' }]]
      });
      return;
    }
    await send(chatId, `Твои механики (${own.length}). Выбери тест или создай ссылку для друга:`, moduleKeyboard(own, userId));
  }

  async function downloadModule(document) {
    if (!document.file_name?.toLowerCase().endsWith('.piv')) throw new Error('Пришли именно файл с расширением .piv.');
    if (document.file_size > maxUploadBytes) throw new Error('Размер .piv должен быть не больше 1 МБ.');
    const file = await botRequest(token, 'getFile', { file_id: document.file_id });
    const response = await fetch(`${apiRoot(token).replace('/bot', '/file/bot')}/${file.file_path}`);
    if (!response.ok) throw new Error('Telegram не смог передать файл.');
    const text = await response.text();
    if (Buffer.byteLength(text, 'utf8') > maxUploadBytes) throw new Error('Размер .piv должен быть не больше 1 МБ.');
    const module = JSON.parse(text);
    if (!validModule(module)) throw new Error('Файл не похож на корректный модуль Пивовара .piv.');
    return module;
  }

  async function saveUploadedModule(message) {
    const user = message.from;
    try {
      const module = await downloadModule(message.document);
      const id = randomBytes(10).toString('base64url');
      store.modules.push({
        id,
        ownerId: String(user.id),
        ownerName: userName(user),
        title: String(module.name || message.document.file_name.replace(/\.piv$/i, '') || 'Механика').slice(0, 100),
        createdAt: new Date().toISOString(),
        module
      });
      await persist();
      await send(message.chat.id, `✅ «${module.name || message.document.file_name}» добавлена в твои механики.`, {
        inline_keyboard: [
          [{ text: '🧪 Проверить', callback_data: `test:${id}` }],
          [{ text: '🔗 Пригласить друга', callback_data: `share:${id}` }],
          [{ text: '📚 Мои механики', callback_data: 'menu:mine' }]
        ]
      });
    } catch (error) {
      console.error('PIV upload failed:', error);
      await send(message.chat.id, `Не получилось импортировать: ${error.message}`);
    } finally {
      uploads.delete(String(user.id));
    }
  }

  async function runMechanic(chatId, item, startId, options = {}) {
    const chatKey = String(chatId);
    const existingSession = activeTests.get(chatKey);
    const isNewSession = options.forceNew || !existingSession || existingSession.itemId !== item.id ||
      Date.now() - existingSession.lastActivity > 30 * 60_000;
    const rootEvent = item.module.nodes.find(node => node.type === 'trigger') ||
      item.module.nodes.find(node => ['command_argument', 'callback', 'any_message'].includes(node.type));
    const session = isNewSession
      ? { itemId: item.id, title: item.title, eventNodeId: rootEvent?.id, startedAt: Date.now(), lastActivity: Date.now(), replyMarkup: null }
      : existingSession;
    for (const [key, callback] of callbackTokens) {
      if (callback.chatId === chatKey) callbackTokens.delete(key);
    }
    session.lastActivity = Date.now();
    session.replyMarkup = null;
    activeTests.set(chatKey, session);
    if (isNewSession) {
      sandboxStates.set(chatKey, createSandbox(item.module));
    }
    const sandbox = sandboxStates.get(chatKey);
    const module = item.module;
    const eventNode = startId
      ? module.nodes.find(node => node.id === startId)
      : module.nodes.find(node => ['trigger', 'command_argument', 'callback', 'any_message'].includes(node.type));
    if (!eventNode) {
      clearTest(chatKey);
      await send(chatId, 'В этой схеме не найдено поддерживаемое событие. Открой механику в конструкторе и добавь событие.');
      return;
    }
    if (isNewSession) {
      const initialText = `🧪 Тест «${item.title}» запущен.\nТолько команды механики и /end. Все изменения изолированы в песочнице.`;
      const initial = await send(chatId, initialText);
      session.messageId = initial.message_id;
      session.lastText = initialText;
    }
    if (options.editMessageId) session.messageId = options.editMessageId;
    const warnings = new Set();
    const activity = [];
    if (module.connections.some(edge => {
      const source = module.nodes.find(node => node.id === edge.from);
      return module.connections.filter(other => other.from === edge.from &&
        (other.outputKey || 'next') === (edge.outputKey || 'next')).length > 1 &&
        !conditionResult(source || {}, sandbox);
    })) {
      warnings.add('Ветвление без блока условия: в тесте выполнена первая ветка.');
    }
    let stopped = false;
    const visited = new Set([eventNode.id]);
    let nodeId = module.connections.find(edge => edge.from === eventNode.id)?.to;
    let actionCount = 0;
    while (nodeId && actionCount < 50 && !visited.has(nodeId)) {
      visited.add(nodeId);
      const sourceNode = module.nodes.find(candidate => candidate.id === nodeId);
      if (!sourceNode) break;
      const node = { ...sourceNode, values: interpolateBotValues(sourceNode.values, sandbox) };
      const branchResult = conditionResult(node, sandbox);
      if (node.type.startsWith('create_') && node.values?.screenId) {
        const screen = module.gameScreens?.find(item => item.id === node.values.screenId);
        activity.push(screen
          ? `📱 Вкладка «${screen.title}» добавлена в проект (${screen.entries.length} записей).`
          : `📱 Вкладка «${node.values.screenTitle || node.title}» не найдена в данных проекта.`);
      } else if (node.type === 'message') {
        activity.push(nodeMessage(node, sandbox));
      } else if (node.type === 'format_text') {
        activity.push(interpolateBotText(node.values?.template || '', sandbox));
      }
      else if (node.type === 'inline_keyboard') {
        const keyboard = messageKeyboard(node, chatId, callbackTokens, item.id, sandbox);
        activity.push(interpolateBotText(node.title || 'Выбери действие:', sandbox));
        session.replyMarkup = keyboard || null;
      } else if (node.type === 'stop') {
        activity.push(`⏹ Механика остановлена: ${node.values?.reason || 'по условию'}.`);
        clearTest(chatKey);
        stopped = true;
        break;
      } else if (node.type === 'check_inventory') {
        const itemId = String(node.values?.itemId || '');
        const count = sandbox.inventory[itemId] || 0;
        activity.push(`🎒 Тестовый инвентарь: ${itemId} × ${count}; требуется ${node.values?.required || 1}.`);
      } else if (branchResult) {
        activity.push(`◇ Условие «${node.title}»: ${branchResult.detail} · выбрана ветка ${branchResult.key}.`);
      } else if (node.type === 'inventory_add') {
        const itemId = String(node.values?.item || 'item').trim().toLowerCase().replace(/\s+/g, '_');
        const quantity = Number(node.values?.quantity || 1);
        sandbox.inventory[itemId] = (sandbox.inventory[itemId] || 0) + quantity;
        activity.push(`🎒 Песочница: в инвентарь добавлено ${itemId} × ${quantity}.`);
      } else if (node.type === 'inventory_remove') {
        const itemId = String(node.values?.itemId || 'item');
        const quantity = Number(node.values?.quantity || 1);
        if ((sandbox.inventory[itemId] || 0) < quantity) {
          activity.push(`🎒 Не хватает ${itemId} в тестовом инвентаре; удаление пропущено.`);
          break;
        }
        sandbox.inventory[itemId] = Math.max(0, (sandbox.inventory[itemId] || 0) - quantity);
        activity.push(`🎒 Песочница: из инвентаря убрано ${itemId} × ${quantity}.`);
      } else if (node.type === 'inventory_swap') {
        const giveId = String(node.values?.giveItemId || 'item');
        const getId = String(node.values?.receiveItemId || 'item');
        const giveCount = Number(node.values?.giveQuantity || 1);
        const getCount = Number(node.values?.receiveQuantity || 1);
        if ((sandbox.inventory[giveId] || 0) < giveCount) {
          activity.push(`🔄 Обмен отменён: в тестовом инвентаре недостаточно ${giveId}.`);
          break;
        }
        sandbox.inventory[giveId] = Math.max(0, (sandbox.inventory[giveId] || 0) - giveCount);
        sandbox.inventory[getId] = (sandbox.inventory[getId] || 0) + getCount;
        activity.push(`🔄 Песочница: обмен выполнен — ${giveId} × ${giveCount} на ${getId} × ${getCount}.`);
      } else if (node.type === 'inventory_capacity') {
        activity.push(`🎒 Песочница: проверка места для ${node.values?.requiredSlots || 0} ячеек выполнена.`);
      } else if (node.type === 'craft_materials') {
        const required = String(node.values?.ingredients || '').split(',')
          .map(entry => entry.trim().split(':'))
          .filter(([id, quantity]) => id && Number.isFinite(Number(quantity)));
        const missing = required.filter(([id, quantity]) => (sandbox.inventory[id] || 0) < Number(quantity));
        if (missing.length) {
          activity.push(`⚗ Не хватает тестовых ингредиентов: ${missing.map(([id, quantity]) => `${id} × ${quantity}`).join(', ')}.`);
          break;
        }
        for (const [id, quantity] of required) sandbox.inventory[id] -= Number(quantity);
        activity.push(`⚗ Ингредиенты рецепта ${node.values?.recipeId || ''} проверены и списаны только в песочнице.`);
      } else if (node.type === 'craft_recipe') {
        sandbox.recipes.add(String(node.values?.recipeId || 'recipe'));
        activity.push(`⚗ В песочнице создан рецепт ${node.values?.recipeId || 'recipe'} × ${node.values?.quantity || 1}.`);
      } else if (node.type === 'unlock_recipe') {
        sandbox.recipes.add(String(node.values?.recipeId || 'recipe'));
        activity.push(`📜 В тестовом профиле открыт рецепт ${node.values?.recipeId || 'recipe'}.`);
      } else if (node.type === 'grant_badge') {
        const achievementId = String(node.values?.badgeId || 'first_brew');
        sandbox.achievements.add(achievementId);
        activity.push(`✪ В тестовом профиле получено достижение «${achievementId}».`);
      } else if (node.type === 'clan_quest' || node.type === 'clan_action') {
        sandbox.clanProgress += Number(node.values?.progress || node.values?.amount || 1);
        activity.push(`♧ Клан «${sandbox.clan}» · тестовый прогресс ${sandbox.clanProgress}. Игровые очки не начислялись.`);
      } else if (node.type === 'clan_rank' || node.type === 'clan_join') {
        activity.push(`♧ Песочница: проверка клана «${sandbox.clan}» пройдена.`);
      } else if (node.type === 'clan_contribute') {
        sandbox.clanProgress += Number(node.values?.amount || 0);
        activity.push(`♧ Вклад записан в песочницу. Прогресс клана: ${sandbox.clanProgress}; реальные ресурсы не списаны.`);
      } else if (node.type === 'give_item') {
        const itemId = String(node.values?.itemId || 'item');
        const amount = Number(node.values?.amount || 1);
        sandbox.inventory[itemId] = (sandbox.inventory[itemId] || 0) + amount;
        activity.push(`🎒 Песочница: выдано ${itemId} × ${amount}.`);
      } else if (node.type === 'brew_product') {
        activity.push(`♨ В песочнице сварено ${node.values?.quantity || 1} л (${node.values?.quality || 'обычное качество'}).`);
      } else if (node.type === 'business_upgrade') {
        activity.push(`⌂ Улучшение «${node.values?.upgrade || 'пивоварня'}» × ${node.values?.levels || 1} проверено в песочнице.`);
      } else if (node.type === 'get_user_data') {
        const key = String(node.values?.key || 'value');
        activity.push(`📦 Данные игрока «${key}»: ${sandbox.variables[key] ?? node.values?.default ?? 'нет данных'}.`);
      } else if (node.type === 'set_variable' || node.type === 'save_user_data') {
        const key = String(node.values?.key || node.values?.name || 'variable');
        const rawValue = String(node.values?.value ?? '');
        const numberValue = Number(rawValue);
        const value = node.values?.valueType === 'Число' && Number.isFinite(numberValue)
          ? numberValue : rawValue;
        sandbox.variables[key] = value;
        activity.push(`📦 В тестовой базе игрока сохранено: ${key} = ${value}.`);
      } else if (node.type === 'delete_variable') {
        delete sandbox.variables[String(node.values?.name || '')];
        activity.push(`📦 Тестовая переменная «${node.values?.name || ''}» удалена.`);
      } else if (node.type === 'add_coins' || node.type === 'add_experience' || node.type === 'reward') {
        if (node.type === 'add_experience' || node.values?.reward === 'Опыт') sandbox.experience += Number(node.values?.amount || 0);
        else if (node.values?.reward === 'Предмет') {
          sandbox.inventory.test_reward = (sandbox.inventory.test_reward || 0) + Number(node.values?.amount || 0);
        } else sandbox.beer += Number(node.values?.amount || 0);
        activity.push(`🧪 Тестовый профиль изменён блоком «${node.title}». Запас ${sandbox.beer} л пива; ${sandbox.experience} опыта. В настоящую игру ничего не записано.`);
      } else if (node.type === 'remove_coins') {
        sandbox.beer = Math.max(0, sandbox.beer - Number(node.values?.amount || 0));
        activity.push(`🧪 Только песочница: осталось ${sandbox.beer} л тестового пива.`);
      } else if (node.type === 'daily_reward') {
        sandbox.beer += Number(node.values?.amount || 0);
        activity.push(`☀ Только песочница: тестовый бонус +${node.values?.amount || 0} л пива; запас ${sandbox.beer} л.`);
      } else if (node.type === 'open_chest') {
        activity.push(`▣ Сундук ${node.values?.rarity || 'обычный'} открыт в тестовом режиме; реальные предметы не выданы.`);
      } else if (node.type === 'grant_badge') {
        activity.push(`✪ Достижение «${node.values?.badgeId || 'badge'}» отмечено в песочнице.`);
      } else if (['register_command', 'reply_keyboard'].includes(node.type)) {
        warnings.add(`Блок «${node.title}» показан в тесте, но не меняет настройки бота.`);
      } else {
        warnings.add(`Блок «${node.title}» пока отображается как предпросмотр.`);
      }
      const outgoing = module.connections.filter(edge => edge.from === nodeId);
      const next = branchResult
        ? outgoing.find(edge => edge.outputKey === branchResult.key)
        : outgoing.find(edge => !edge.outputKey || edge.outputKey === 'next') || outgoing[0];
      nodeId = next?.to;
      actionCount += 1;
    }
    if (nodeId && actionCount >= 50) warnings.add('Один проход ограничен 50 действиями для защиты от случайного спама.');
    for (const warning of warnings) activity.push(`ℹ️ ${warning}`);
    if (!activity.length) activity.push('Команда обработана; дополнительных действий в этой ветке нет.');
    const active = !stopped && activeTests.has(chatKey);
    const header = active
      ? `🧪 Тест «${item.title}» активен · отправляй команды механики или /end.`
      : `⏹ Тест «${item.title}» завершён.`;
    const content = `${header}\n\n${activity.join('\n')}`.slice(0, 4096);
    if (content !== session.lastText) {
      await editMessage(chatId, session.messageId, content,
        active ? (session.replyMarkup || { inline_keyboard: [] }) : { inline_keyboard: [] });
      session.lastText = content;
    }
  }

  async function handleMessage(message) {
    if (!message?.from || message.chat?.type !== 'private') return;
    const userId = String(message.from.id);
    const text = message.text || '';
    if (/^\/end(?:@\w+)?(?:\s|$)/i.test(text)) {
      const chatKey = String(message.chat.id);
      const session = activeTests.get(chatKey);
      const stopped = Boolean(session);
      clearTest(chatKey);
      if (session?.messageId) {
        await editMessage(message.chat.id, session.messageId,
          `⏹ Тест «${session.title || 'механики'}» остановлен командой /end.`,
          { inline_keyboard: [] });
      } else {
        await send(message.chat.id, stopped
          ? '⏹ Тест остановлен.'
          : 'Сейчас нет активного теста. Отправь /menu, чтобы открыть управление.', mainMenu());
      }
      return;
    }
    const chatKey = String(message.chat.id);
    const currentSession = activeTests.get(chatKey);
    if (currentSession && Date.now() - currentSession.lastActivity <= 30 * 60_000) {
      const activeModule = getModule(store, currentSession.itemId);
      if (!activeModule) {
        clearTest(chatKey);
        return;
      }
      const commandName = text.match(/^\/([A-Za-z0-9_]{1,32})(?:@\w+)?/i)?.[1]?.toLowerCase();
      const matchingTrigger = commandName && activeModule.module.nodes.find(node =>
        ['trigger', 'command_argument'].includes(node.type) &&
        String(node.values?.command || '').replace(/^\/+/, '').toLowerCase() === commandName);
      if (matchingTrigger) return runMechanic(message.chat.id, activeModule, matchingTrigger.id);
      return;
    } else if (currentSession) {
      clearTest(chatKey);
    }
    const start = text.match(/^\/start(?:@\w+)?(?:\s+(play|activate)_([A-Za-z0-9_-]{8,40}))?/);
    if (start) {
      const mode = start[1];
      const sharedId = start[2];
      const shared = sharedId && getModule(store, sharedId);
      if (!shared) {
        await showMenu(message.chat.id, message.from);
        return;
      }
      if (mode === 'activate') {
        await runMechanic(message.chat.id, shared, undefined, { forceNew: true });
        return;
      }
      await send(message.chat.id, `Тебя пригласили протестировать «${shared.title}» от ${shared.ownerName || 'друга'}.\nТест безопасный: механика не получает доступ к твоему аккаунту или игровым данным.`, {
        inline_keyboard: [
          [{ text: '▶️ Запустить тест', callback_data: `test:${shared.id}` }],
          [{ text: '📚 Открыть мои механики', callback_data: 'menu:mine' }]
        ]
      });
      return;
    }
    if (/^\/(?:menu|start|help)(?:@\w+)?(?:\s|$)/.test(text)) {
      await showMenu(message.chat.id, message.from);
      return;
    }
    if (message.document) {
      if (uploads.has(userId)) {
        await saveUploadedModule(message);
        return;
      }
      await send(message.chat.id, 'Сначала выбери «Импортировать .piv» в меню, потом отправь файл.', mainMenu());
      return;
    }
    const command = text.match(/^\/([A-Za-z0-9_]{1,32})(?:@\w+)?/i)?.[1]?.toLowerCase();
    const own = store.modules.filter(item => item.ownerId === userId);
    const candidates = own.filter(item => item.module.nodes.some(node =>
      node.type === 'trigger' && String(node.values?.command || '').replace(/^\/+/, '').toLowerCase() === command));
    if (command && candidates.length === 1) {
      await runMechanic(message.chat.id, candidates[0]);
      return;
    }
    if (command && candidates.length > 1) {
      await send(message.chat.id, 'Эта команда есть в нескольких тестовых механиках. Выбери нужную:', moduleKeyboard(candidates, userId));
      return;
    }
    await send(message.chat.id, 'Я принимаю тестовые .piv-механики и команды из них. Начни с меню или импортируй модуль.', mainMenu());
  }

  async function handleCallback(query) {
    const data = String(query.data || '');
    const chatId = query.message?.chat?.id;
    const userId = String(query.from.id);
    await botRequest(token, 'answerCallbackQuery', { callback_query_id: query.id });
    if (!chatId) return;
    if (data === 'test:end') {
      clearTest(String(chatId));
      try {
        await editMessage(chatId, query.message.message_id, '⏹ Тест остановлен. Чтобы запустить снова, открой «Мои механики».');
      } catch (error) {
        console.error('Could not update stopped-test message:', error.message);
        await send(chatId, '⏹ Тест остановлен.');
      }
      return;
    }
    if (data === 'menu:home') return showMenu(chatId, query.from);
    if (data === 'menu:mine') return showModules(chatId, userId);
    if (data === 'menu:help') return send(chatId, `Управление:\n• «Мои механики» — выбрать и протестировать несколько .piv.\n• «Импортировать .piv» — загрузить файл размером до 1 МБ.\n• «Ссылка другу» — пригласить друга в приватный безопасный тест.\n• Во время теста отправляй команды/сообщения, чтобы повторить механику; остановка — /end.\n\nСообщения и inline-кнопки работают в песочнице. Запас пива, инвентарь, крафт и клановый прогресс синтетические и не меняют игру.`, mainMenu());
    if (data === 'menu:import') {
      uploads.add(userId);
      return send(chatId, 'Отправь сюда файл механики с расширением .piv (до 1 МБ). Для отмены нажми «Меню».', {
        inline_keyboard: [[{ text: 'Отмена', callback_data: 'menu:home' }]]
      });
    }
    const callbackToken = data.match(/^c:([A-Za-z0-9_-]+)$/)?.[1];
    if (callbackToken) {
      const callback = callbackTokens.get(callbackToken);
      callbackTokens.delete(callbackToken);
      const activeSession = activeTests.get(String(chatId));
      if (!callback || callback.expiresAt < Date.now() || callback.chatId !== String(chatId) ||
          activeSession?.itemId !== callback.moduleId) {
        await send(chatId, 'Срок действия тестовой кнопки истёк. Запусти механику ещё раз.');
        return;
      }
      const activeModule = getModule(store, activeSession.itemId);
      const trigger = activeModule?.module.nodes.find(node =>
        node.type === 'callback' &&
        String(node.values?.callbackData || '') === callback.callbackData);
      if (activeModule && trigger) return runMechanic(chatId, activeModule, trigger.id, {
        editMessageId: query.message.message_id
      });
      await send(chatId, `Тестовая кнопка нажата: ${callback.callbackData}. Добавь событие «Нажатие инлайн-кнопки» с такими callback data, чтобы связать её с действием.`);
      return;
    }
    const [action, id] = data.split(':');
    const item = getModule(store, id);
    if (!item) return send(chatId, 'Механика не найдена или больше не доступна.');
    if (action === 'test') return runMechanic(chatId, item, undefined, { forceNew: true });
    if (action === 'share') {
      if (item.ownerId !== userId) return send(chatId, 'Ссылкой может поделиться только автор механики.');
      const link = `https://t.me/${username}?start=play_${item.id}`;
      return send(chatId, `Отправь другу эту ссылку, чтобы он прошёл отдельный безопасный тест:\n${link}`, {
        inline_keyboard: [[{ text: '📚 Мои механики', callback_data: 'menu:mine' }]]
      });
    }
    if (action === 'delete') {
      if (item.ownerId !== userId) return send(chatId, 'Удалить механику может только её автор.');
      store.modules = store.modules.filter(module => module.id !== id);
      await persist();
      return send(chatId, 'Механика удалена.', mainMenu());
    }
    if (action === 'run') {
      if (item.ownerId !== userId) return send(chatId, 'Этот тест недоступен.');
      return runMechanic(chatId, item, undefined, { forceNew: true });
    }
  }

  async function processUpdate(update) {
    try {
      if (update.message) await handleMessage(update.message);
      if (update.callback_query) await handleCallback(update.callback_query);
    } catch (error) {
      console.error(`Telegram update ${update.update_id} failed:`, error);
      const chatId = update.message?.chat?.id || update.callback_query?.message?.chat?.id;
      if (chatId) {
        try { await send(chatId, 'Произошла ошибка при обработке. Попробуй снова через /menu.'); } catch (sendError) {
          console.error('Telegram error notification failed:', sendError);
        }
      }
    }
  }

  async function poll() {
    while (true) {
      try {
        const updates = await botRequest(token, 'getUpdates', {
          offset,
          timeout: 25,
          allowed_updates: ['message', 'callback_query']
        });
        for (const update of updates) {
          offset = update.update_id + 1;
          await processUpdate(update);
        }
      } catch (error) {
        console.error('Telegram long polling failed; retrying in 3 seconds:', error.message);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
  }

  console.log(`Telegram test bot @${username} is starting (private-chat sandbox).`);
  void (async () => {
    try {
      const webhook = await botRequest(token, 'getWebhookInfo', {});
      if (webhook.url) {
        console.error('Telegram test bot is not polling because a webhook is configured. Use a dedicated bot without a webhook.');
        return;
      }
      await botRequest(token, 'setMyCommands', {
        commands: [
          { command: 'start', description: 'Открыть главное меню' },
          { command: 'menu', description: 'Механики и тесты' },
          { command: 'help', description: 'Помощь по боту' }
        ]
      });
      void poll();
    } catch (error) {
      console.error('Could not initialize Telegram test bot:', error.message);
    }
  })();
}
