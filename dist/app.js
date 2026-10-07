(() => {
  'use strict';

  const definition = (type, group, title, icon, color, fields, subtitle = 'ДЕЙСТВИЕ') => ({
    type, group, title, subtitle, icon, color, fields
  });
  const select = (key, label, options, value = options[0]) => ({ key, label, kind: 'select', options, default: value });
  const text = (key, label, value = '', help = '') => ({ key, label, kind: 'text', default: value, help });
  const number = (key, label, value = 1, min = 0, max = 100000) => ({ key, label, kind: 'number', default: value, min, max });
  const choice = (key, label, options, value = options[0]) => select(key, label, options, value);
  const event = (type, title, icon, fields) => definition(type, 'СОБЫТИЯ TELEGRAM', title, icon, '#fff0c6', fields, 'СОБЫТИЕ');
  const logic = (type, title, icon, fields) => definition(type, 'УСЛОВИЯ И ЛОГИКА', title, icon, '#e9e3ff', fields, 'ЛОГИКА');
  const condition = (type, title, icon, fields, outputs) => ({
    ...logic(type, title, icon, fields),
    outputs
  });
  const telegram = (type, title, icon, fields) => definition(type, 'TELEGRAM И СООБЩЕНИЯ', title, icon, '#dff3e5', fields);
  const economyCategories = {
    reward: 'ПИВО И ОПЫТ',
    add_coins: 'ПИВО И ОПЫТ',
    add_experience: 'ПИВО И ОПЫТ',
    remove_coins: 'ПИВО И ОПЫТ',
    daily_reward: 'ПИВО И ОПЫТ',
    set_level: 'ПРОФИЛЬ И УРОВЕНЬ',
    give_item: 'ИНВЕНТАРЬ',
    inventory_add: 'ИНВЕНТАРЬ',
    inventory_remove: 'ИНВЕНТАРЬ',
    inventory_swap: 'ИНВЕНТАРЬ',
    inventory_capacity: 'ИНВЕНТАРЬ',
    check_inventory: 'ИНВЕНТАРЬ',
    brew_product: 'ВАРКА',
    brew_timer: 'ВАРКА',
    business_upgrade: 'ПИВОВАРНЯ',
    craft_recipe: 'РЕЦЕПТЫ И КРАФТ',
    craft_materials: 'РЕЦЕПТЫ И КРАФТ',
    unlock_recipe: 'РЕЦЕПТЫ И КРАФТ',
    open_chest: 'ПРЕДМЕТЫ И НАГРАДЫ',
    grant_badge: 'ДОСТИЖЕНИЯ',
    clan_action: 'КЛАН',
    clan_join: 'КЛАН',
    clan_contribute: 'КЛАН',
    clan_rank: 'КЛАН',
    clan_quest: 'КЛАН',
    create_inventory_screen: 'ИНВЕНТАРЬ',
    create_clan_screen: 'КЛАН',
    create_recipes_screen: 'РЕЦЕПТЫ И КРАФТ',
    create_brewery_screen: 'ПИВОВАРНЯ',
    create_profile_screen: 'ПРОФИЛЬ И УРОВЕНЬ',
    create_achievements_screen: 'ДОСТИЖЕНИЯ',
    create_quests_screen: 'ДОСТИЖЕНИЯ',
    create_shop_screen: 'ПРЕДМЕТЫ И НАГРАДЫ',
    create_brew_history_screen: 'ВАРКА',
    create_leaderboard_screen: 'ПРОФИЛЬ И УРОВЕНЬ'
  };
  const economy = (type, title, icon, fields) => definition(
    type, `ИГРА ПИВОВАРА / ${economyCategories[type] || 'ПРОФИЛЬ'}`, title, icon, '#fff0c6', fields
  );
  const dataBlock = (type, title, icon, fields) => definition(type, 'ДАННЫЕ ИГРОКА / ПЕРЕМЕННЫЕ', title, icon, '#ffe7dc', fields);

  const catalog = [
    event('trigger', 'Команда бота', '⚡', [text('command', 'Команда', '/brew', 'Латинские буквы, цифры и подчёркивание; максимум 32 символа.'), text('description', 'Описание команды', 'Начать варку'), number('cooldown', 'Перезарядка, сек', 30, 0, 3600)]),
    event('callback', 'Нажатие инлайн-кнопки', '▤', [text('callbackData', 'Callback data', 'brew:start'), number('userId', 'ID пользователя (0 — любой)', 0, 0, 999999999)]),
    event('new_member', 'Новый участник чата', '＋', [text('welcome', 'Фильтр приветствия', 'Все новые участники')]),
    event('text_match', 'Сообщение содержит текст', '⌕', [text('contains', 'Искомый текст', 'пиво'), choice('matchCase', 'Учитывать регистр', ['Нет', 'Да'])]),
    event('any_message', 'Любое сообщение', '✉', [choice('chatType', 'Тип чата', ['Личный чат', 'Группа', 'Любой'])]),
    event('command_argument', 'Вызов с аргументами', '⌗', [text('command', 'Команда', '/gift'), number('argumentCount', 'Минимум аргументов', 1, 0, 20)]),
    event('reaction', 'Реакция на сообщение', '♡', [text('emoji', 'Эмодзи реакции', '🍺'), choice('reactionType', 'Действие', ['Добавлена', 'Удалена', 'Любое'])]),
    event('chat_member', 'Изменился статус участника', '♧', [choice('status', 'Новый статус', ['Вступил', 'Вышел', 'Стал администратором', 'Любой'])]),
    event('scheduled', 'Расписание / таймер', '◷', [number('interval', 'Интервал, мин', 60, 1, 10080), text('timezone', 'Часовой пояс', 'Europe/Moscow')]),
    event('user_join', 'Игрок впервые в боте', '☺', [choice('source', 'Источник', ['Любой источник', 'По ссылке-приглашению'])]),
    event('location_received', 'Игрок отправил геолокацию', '⌖', [choice('privateOnly', 'Принимать только в личке', ['Да', 'Нет']), text('variable', 'Сохранить координаты в', 'player_location')]),
    event('photo_received', 'Игрок отправил фото', '▧', [number('maxSizeMb', 'Максимальный размер, МБ', 10, 1, 50), text('variable', 'Сохранить file_id в', 'uploaded_photo')]),
    event('inline_query', 'Inline-запрос боту', '⌕', [text('query', 'Текст запроса содержит', 'рецепт'), number('minLength', 'Минимальная длина', 2, 0, 100)]),

    logic('condition', 'Проверить уровень', '◇', [number('level', 'Уровень игрока от', 5, 1, 100), choice('branch', 'Если условие', ['Выполнено → продолжить', 'Не выполнено → остановить'])]),
    logic('chance', 'Случайный шанс', '％', [{ key: 'chance', label: 'Вероятность, %', kind: 'range', min: 1, max: 100, default: 75 }]),
    logic('compare', 'Сравнить значение', '⇄', [choice('variable', 'Параметр', ['Литры пива', 'Опыт пивовара', 'Уровень', 'Количество варок']), choice('operator', 'Условие', ['Больше', 'Меньше', 'Равно', 'Не равно']), number('value', 'Сравнить с', 100)]),
    condition('if_else', 'Если / иначе: сравнить данные', '⑂', [
      text('variable', 'Ключ переменной', 'brew_count'),
      choice('valueType', 'Тип данных', ['Число', 'Текст']),
      choice('operator', 'Оператор', ['Равно', 'Не равно', 'Больше', 'Меньше', 'Содержит', 'Не содержит', 'Пустое']),
      text('value', 'С чем сравнить', '10')
    ], [{ key: 'true', label: 'ДА' }, { key: 'false', label: 'НЕТ' }]),
    condition('inventory_has_item', 'Проверить наличие предмета', '🎒', [text('itemId', 'ID предмета', 'hops', 'Точное совпадение ID в тестовом инвентаре.'), number('required', 'Минимальное количество', 1, 1, 9999)], [{ key: 'has', label: 'ЕСТЬ' }, { key: 'missing', label: 'НЕТ' }]),
    condition('inventory_find', 'Найти предмет в инвентаре', '⌕', [text('query', 'Название или часть ID', 'хмель'), number('required', 'Минимальное количество', 1, 1, 9999)], [{ key: 'found', label: 'НАЙДЕН' }, { key: 'not_found', label: 'НЕ НАЙДЕН' }]),
    condition('inventory_count', 'Сравнить количество предмета', '▤', [text('itemId', 'ID предмета', 'malt'), choice('operator', 'Условие', ['Не меньше', 'Больше', 'Равно', 'Меньше']), number('amount', 'Количество', 5, 0, 9999)], [{ key: 'match', label: 'ДА' }, { key: 'no_match', label: 'НЕТ' }]),
    condition('inventory_is_empty', 'Проверить пустой инвентарь', '▱', [choice('scope', 'Проверять', ['Весь инвентарь', 'Категорию']), choice('category', 'Категория', ['Ресурсы', 'Напитки', 'Предметы'])], [{ key: 'empty', label: 'ПУСТО' }, { key: 'not_empty', label: 'НЕ ПУСТО' }]),
    condition('wallet_has', 'Проверить запас пива или опыта', '◉', [choice('currency', 'Что проверить', ['Литры пива', 'Опыт']), number('amount', 'Нужно не меньше', 100, 0, 10000000)], [{ key: 'enough', label: 'ХВАТАЕТ' }, { key: 'insufficient', label: 'НЕ ХВАТАЕТ' }]),
    condition('recipe_known', 'Проверить открытый рецепт', '📜', [text('recipeId', 'ID рецепта', 'classic_ipa')], [{ key: 'known', label: 'ОТКРЫТ' }, { key: 'unknown', label: 'ЗАКРЫТ' }]),
    condition('achievement_unlocked', 'Проверить достижение', '✪', [text('achievementId', 'ID достижения', 'first_brew')], [{ key: 'unlocked', label: 'ПОЛУЧЕНО' }, { key: 'locked', label: 'НЕ ПОЛУЧЕНО' }]),
    condition('clan_member', 'Проверить членство в клане', '♧', [choice('membership', 'Проверять', ['В любом клане', 'В указанном клане']), text('clanId', 'ID клана', 'north_barrel')], [{ key: 'member', label: 'СОСТОИТ' }, { key: 'not_member', label: 'НЕ СОСТОИТ' }]),
    logic('switch', 'Выбор из вариантов', '⑃', [text('cases', 'Варианты через запятую', 'обычный, редкий, легендарный')]),
    logic('repeat', 'Повторить действия', '⟳', [number('count', 'Количество повторов', 3, 1, 100)]),
    logic('stop', 'Остановить механику', '■', [text('reason', 'Причина остановки', 'Механика завершена')]),
    logic('filter_user', 'Фильтр пользователя', '♙', [choice('userType', 'Кого пропустить', ['Всех игроков', 'Только администраторов', 'Не администраторов'])]),
    logic('limit', 'Ограничить число запусков', '▤', [number('maxRuns', 'Запусков за период', 5, 1, 100000), choice('period', 'Период', ['В час', 'В день', 'За всё время'])]),
    logic('rate_limit', 'Защита от спама', '⏱', [number('maxActions', 'Действий разрешено', 3, 1, 100), number('windowSeconds', 'За интервал, сек', 10, 1, 86400)]),
    logic('check_time', 'Проверить время / день недели', '◷', [text('from', 'Начало (ЧЧ:ММ)', '09:00'), text('until', 'Окончание (ЧЧ:ММ)', '22:00'), choice('days', 'Дни недели', ['Каждый день', 'Будни', 'Выходные'])]),
    logic('http_request', 'HTTP-запрос к API', '⇧', [choice('method', 'Метод', ['GET', 'POST', 'PUT', 'DELETE']), text('url', 'URL адреса', 'https://example.com/api')]),
    logic('random_choice', 'Выбрать качество напитка', '⤨', [{ key: 'choices', label: 'Варианты качества через строку', kind: 'textarea', default: 'Обычное\nКрепкое\nРедкое\nФирменное' }, text('variable', 'Сохранить сорт в', 'brew_result')]),
    logic('check_membership', 'Проверить подписку на канал пивовара', '♧', [text('chatId', 'ID канала или @username', '@pivovar_news'), choice('onFailure', 'Если не подписан', ['Остановить', 'Показать сообщение'])]),
    logic('filter_language', 'Проверить язык игрока', '文', [choice('language', 'Язык', ['Русский', 'English', 'Любой']), choice('match', 'Сравнение', ['Совпадает', 'Не совпадает'])]),

    telegram('message', 'Отправить сообщение', '↗', [text('text', 'Текст сообщения', 'Отличная варка! Забирай награду 🍻'), choice('format', 'Формат', ['Обычный текст', 'Markdown', 'HTML'])]),
    telegram('inline_keyboard', 'Создать инлайн-кнопки', '▦', [{ key: 'buttons', label: 'Кнопки: текст | callback_data', kind: 'textarea', default: '🍺 Начать | brew:start\n🎒 Инвентарь | inventory:open', help: 'Одна кнопка на строку. Callback data должна быть не длиннее 64 байт.' }, number('columns', 'Кнопок в ряду', 2, 1, 8), choice('layout', 'Расположение', ['По колонкам', 'Каждая кнопка в своей строке'])]),
    telegram('reply_keyboard', 'Создать клавиатуру меню', '⌨', [{ key: 'buttons', label: 'Названия кнопок, через запятую', kind: 'textarea', default: '🍺 Варить, 🎒 Инвентарь, 👤 Профиль' }, choice('resize', 'Размер клавиатуры', ['Автоматический', 'Обычный'])]),
    telegram('register_command', 'Создать команду бота', '/', [text('command', 'Команда без /', 'daily'), text('description', 'Описание в меню Telegram', 'Получить ежедневную награду')]),
    telegram('edit_message', 'Изменить сообщение', '✎', [text('messageId', 'ID сообщения или переменная', '{last_message_id}'), text('text', 'Новый текст', 'Обновлённое сообщение'), choice('parseMode', 'Формат', ['Обычный текст', 'Markdown', 'HTML'])]),
    telegram('delete_message', 'Удалить сообщение', '⌫', [text('messageId', 'ID сообщения', '{last_message_id}')]),
    telegram('answer_callback', 'Ответить на нажатие кнопки', '↩', [text('text', 'Всплывающий ответ', 'Готово!'), choice('alert', 'Тип ответа', ['Уведомление', 'Всплывающее окно'])]),
    telegram('send_photo', 'Отправить фото / медиа', '▧', [text('file', 'URL или file_id', 'https://example.com/image.jpg'), text('caption', 'Подпись к изображению', 'Свежая варка дня 🍻')]),
    telegram('send_poll', 'Создать опрос', '☷', [text('question', 'Вопрос', 'Какой сорт сварить следующим?'), text('options', 'Варианты через запятую', 'IPA, Пшеничное, Стаут')]),
    telegram('forward_message', 'Переслать сообщение', '⇢', [text('chatId', 'ID чата назначения', '{admin_chat_id}'), text('messageId', 'ID исходного сообщения', '{message_id}')]),
    telegram('pin_message', 'Закрепить сообщение', '⌖', [text('messageId', 'ID сообщения', '{last_message_id}'), choice('notify', 'Уведомить участников', ['Нет', 'Да'])]),
    telegram('typing', 'Показать статус «печатает…»', '✎', [number('duration', 'Длительность, сек', 2, 1, 10)]),
    telegram('notify_admin', 'Уведомить администратора', '♧', [text('text', 'Текст уведомления', 'Игрок запросил помощь'), text('chatId', 'ID чата админа', '{admin_chat_id}')]),
    telegram('deep_link', 'Создать ссылку-приглашение', '↗', [text('payload', 'Метка перехода', 'ref_campaign'), number('uses', 'Лимит использований', 0, 0, 10000)]),
    telegram('send_location', 'Отправить геолокацию', '⌖', [text('latitude', 'Широта', '55.7558'), text('longitude', 'Долгота', '37.6173')]),
    telegram('send_contact', 'Отправить контакт', '♙', [text('phone', 'Телефон', '+70000000000'), text('firstName', 'Имя', 'Поддержка')]),
    telegram('inline_url_button', 'Кнопка со ссылкой', '↗', [text('label', 'Текст кнопки', 'Открыть сайт'), text('url', 'HTTPS-ссылка', 'https://example.com')]),
    telegram('remove_keyboard', 'Убрать клавиатуру', '⌫', [choice('selective', 'Убрать только у адресата', ['Нет', 'Да'])]),
    telegram('send_invoice', 'Создать платёж Telegram', '＄', [text('title', 'Название товара', 'Премиум подписка'), number('amount', 'Цена в минимальных единицах', 100, 1, 100000000)]),
    telegram('send_document', 'Отправить файл', '⇧', [text('file', 'URL или file_id', 'https://example.com/guide.pdf'), text('caption', 'Подпись к файлу', 'Инструкция по варке')]),
    telegram('send_audio', 'Отправить аудио', '♫', [text('file', 'URL или file_id', 'https://example.com/theme.mp3'), text('title', 'Название аудио', 'Тема пивоварни')]),
    telegram('send_sticker', 'Отправить стикер', '☺', [text('fileId', 'file_id стикера', 'CAACAgIAAxkBA...')]),
    telegram('copy_message', 'Копировать сообщение', '⧉', [text('chatId', 'Чат-источник', '{chat_id}'), text('messageId', 'ID сообщения', '{message_id}')]),
    telegram('send_chat_action', 'Показать действие бота', '⋯', [choice('action', 'Статус', ['Печатает', 'Загружает фото', 'Записывает аудио', 'Выбирает стикер']), number('duration', 'Длительность, сек', 3, 1, 10)]),

    economy('reward', 'Выдать награду', '✦', [choice('reward', 'Тип награды', ['Литры пива', 'Опыт', 'Предмет']), number('amount', 'Количество', 100, 1, 100000)]),
    economy('add_coins', 'Начислить литры пива', '🍺', [number('amount', 'Объём, литров', 20, 1, 10000000), choice('reason', 'Причина', ['Награда', 'Покупка', 'Бонус', 'Другое'])]),
    economy('add_experience', 'Начислить опыт', '★', [number('amount', 'Количество опыта', 50, 1, 1000000)]),
    economy('give_item', 'Выдать предмет', '▣', [text('itemId', 'ID предмета', 'malt_box'), number('amount', 'Количество', 1, 1, 9999)]),
    economy('remove_coins', 'Списать литры пива', '⊖', [number('amount', 'Объём, литров', 5, 1, 10000000), text('reason', 'Причина списания', 'Покупка солода')]),
    economy('set_level', 'Установить уровень', '⬆', [number('level', 'Новый уровень', 2, 1, 100)]),
    economy('brew_product', 'Сварить литры напитка', '♨', [choice('quality', 'Качество', ['Обычное', 'Крепкое', 'Редкое', 'Фирменное']), number('quantity', 'Объём, литров', 20, 1, 100000)]),
    economy('daily_reward', 'Выдать бонус литрами пива', '☀', [number('amount', 'Литров пива', 5, 1, 100000), choice('streak', 'Учитывать серию дней', ['Да', 'Нет'])]),
    economy('inventory_add', 'Добавить в инвентарь', '▤', [text('item', 'Название предмета', 'Хмель'), number('quantity', 'Количество', 1, 1, 9999)]),
    economy('inventory_remove', 'Забрать предмет из инвентаря', '⊟', [text('itemId', 'ID предмета', 'malt'), number('quantity', 'Количество', 1, 1, 9999)]),
    economy('inventory_swap', 'Обменять предметы', '⇄', [text('giveItemId', 'Отдать предмет (ID)', 'hop_bundle'), number('giveQuantity', 'Количество отдаваемого', 1, 1, 9999), text('receiveItemId', 'Получить предмет (ID)', 'yeast_pack'), number('receiveQuantity', 'Количество получаемого', 1, 1, 9999)]),
    economy('inventory_capacity', 'Проверить место в складе', '▤', [number('requiredSlots', 'Нужно свободных ячеек', 1, 0, 9999), choice('ifFull', 'Если места нет', ['Остановить', 'Показать сообщение'])]),
    economy('business_upgrade', 'Улучшить пивоварню', '⌂', [choice('upgrade', 'Что улучшить', ['Скорость варки', 'Объём склада', 'Качество напитка']), number('levels', 'На сколько уровней', 1, 1, 10)]),
    economy('craft_recipe', 'Скрафтить рецепт', '⚗', [text('recipeId', 'ID рецепта', 'classic_ipa'), number('quantity', 'Порций', 1, 1, 100)]),
    economy('craft_materials', 'Проверить ингредиенты рецепта', '⚗', [text('recipeId', 'ID рецепта', 'classic_ipa'), text('ingredients', 'Нужно (ID:количество через запятую)', 'malt:2, hops:1')]),
    economy('unlock_recipe', 'Открыть рецепт', '📜', [text('recipeId', 'ID рецепта', 'amber_ale'), choice('requirement', 'Требование', ['Проверить уровень', 'Проверить предметы', 'Без требований'])]),
    economy('open_chest', 'Открыть сундук наград', '▣', [choice('rarity', 'Редкость сундука', ['Обычный', 'Редкий', 'Эпический', 'Случайный']), number('count', 'Количество сундуков', 1, 1, 100)]),
    economy('clan_action', 'Действие для клана', '♧', [choice('action', 'Действие', ['Начислить очки клана', 'Отправить объявление', 'Проверить роль']), number('amount', 'Количество очков', 10, 0, 100000)]),
    economy('clan_join', 'Вступить в клан', '♧', [text('clanId', 'ID клана или переменная', '{selected_clan}'), choice('onFailure', 'Если нельзя вступить', ['Показать причину', 'Остановить'])]),
    economy('clan_contribute', 'Внести вклад в клан', '♧', [choice('currency', 'Ресурс', ['Литры пива', 'Опыт', 'Предмет']), number('amount', 'Объём вклада', 10, 1, 1000000), text('goalId', 'ID цели клана', 'brewery_upgrade')]),
    economy('clan_rank', 'Проверить роль в клане', '♙', [choice('role', 'Требуемая роль', ['Участник', 'Модератор', 'Лидер']), choice('onFailure', 'Если роли нет', ['Остановить', 'Показать сообщение'])]),
    economy('clan_quest', 'Засчитать действие для задания клана', '⚑', [text('questId', 'ID задания', 'weekly_brew'), number('progress', 'Прогресс', 1, 1, 100000)]),
    economy('brew_timer', 'Запустить таймер варки', '◴', [number('duration', 'Время варки, мин', 60, 1, 10080), text('recipeId', 'ID рецепта', 'classic_ipa'), choice('notify', 'Уведомить по завершении', ['Да', 'Нет'])]),
    economy('grant_badge', 'Выдать достижение', '✪', [text('badgeId', 'ID достижения', 'first_brew'), text('message', 'Сообщение игроку', 'Новое достижение разблокировано!')]),
    economy('check_inventory', 'Проверить предмет в инвентаре', '▤', [text('itemId', 'ID предмета', 'hops'), number('required', 'Необходимое количество', 1, 1, 9999)]),
    economy('create_inventory_screen', 'Создать вкладку инвентаря', '🎒', [text('screenTitle', 'Название вкладки', 'Инвентарь')]),
    economy('create_clan_screen', 'Создать вкладку клана', '♧', [text('screenTitle', 'Название вкладки', 'Клан')]),
    economy('create_recipes_screen', 'Создать вкладку рецептов', '📜', [text('screenTitle', 'Название вкладки', 'Рецепты')]),
    economy('create_brewery_screen', 'Создать вкладку пивоварни', '⌂', [text('screenTitle', 'Название вкладки', 'Пивоварня')]),
    economy('create_profile_screen', 'Создать вкладку профиля', '☺', [text('screenTitle', 'Название вкладки', 'Профиль')]),
    economy('create_achievements_screen', 'Создать вкладку достижений', '✪', [text('screenTitle', 'Название вкладки', 'Достижения')]),
    economy('create_quests_screen', 'Создать вкладку заданий', '⚑', [text('screenTitle', 'Название вкладки', 'Задания')]),
    economy('create_shop_screen', 'Создать вкладку лавки', '🛒', [text('screenTitle', 'Название вкладки', 'Лавка')]),
    economy('create_brew_history_screen', 'Создать историю варок', '♨', [text('screenTitle', 'Название вкладки', 'История варок')]),
    economy('create_leaderboard_screen', 'Создать рейтинг пивоваров', '🏆', [text('screenTitle', 'Название вкладки', 'Рейтинг')]),
    dataBlock('variable', 'Изменить параметр игрока', 'ƒ', [choice('name', 'Параметр', ['Литры пива', 'Опыт пивовара', 'Уровень пивоварни']), number('delta', 'Изменение на', 10, -100000, 100000)]),
    dataBlock('set_variable', 'Записать переменную пивовара', '＝', [text('name', 'Ключ переменной', 'brew_count'), choice('valueType', 'Сохранить как', ['Число', 'Текст']), text('value', 'Значение', '1')]),
    dataBlock('get_user', 'Получить данные пивовара', '♙', [choice('property', 'Поле профиля', ['Имя', 'ID', 'Уровень', 'Литры пива', 'Опыт'])]),
    dataBlock('math', 'Вычислить значение варки', '±', [text('expression', 'Формула', '{beer} + 100'), choice('rounding', 'Округление', ['Не округлять', 'Вниз', 'Вверх', 'До целого'])]),
    dataBlock('format_text', 'Собрать текст для игрока', '¶', [text('template', 'Шаблон', 'У тебя {beer} л пива и {experience} опыта пивовара.')]),
    dataBlock('random_number', 'Случайное количество варок', '⚄', [number('min', 'От', 1, 0, 1000000), number('max', 'До', 100, 1, 1000000)]),
    dataBlock('save_user_data', 'Сохранить данные игрока', '▣', [text('key', 'Ключ базы игрока', 'last_brew'), choice('valueType', 'Сохранить как', ['Текст', 'Число']), text('value', 'Значение', '{brew_result}')]),
    dataBlock('delete_variable', 'Удалить переменную', '⌫', [text('name', 'Имя переменной', 'temporary_value')]),
    dataBlock('json_path', 'Прочитать поле JSON', '{ }', [text('json', 'JSON или переменная', '{api_response}'), text('path', 'Путь к полю', 'player.level')]),
    dataBlock('get_user_data', 'Прочитать данные игрока', '⌕', [text('key', 'Ключ базы игрока', 'last_brew'), text('default', 'Если значение отсутствует', 'нет данных')]),
    dataBlock('list_operation', 'Изменить список пивовара', '☷', [text('list', 'Имя списка', 'player_recipes'), choice('operation', 'Действие', ['Добавить в конец', 'Удалить значение', 'Очистить список']), text('value', 'Значение', 'classic_ipa')]),
    dataBlock('date_time', 'Получить дату и время', '◷', [text('format', 'Формат даты', 'DD.MM.YYYY HH:mm'), text('timezone', 'Часовой пояс', 'Europe/Moscow')]),

    logic('timer', 'Подождать', '◴', [number('seconds', 'Задержка, сек', 10, 1, 86400)]),
    logic('webhook', 'Отправить HTTP-запрос', '⇧', [choice('method', 'Метод', ['GET', 'POST', 'PUT', 'DELETE']), text('url', 'URL адреса', 'https://example.com/webhook')]),
    logic('log', 'Записать в журнал', '≡', [text('text', 'Сообщение журнала', 'Варка запущена: {user_id}')]),
    logic('wait_reply', 'Дождаться ответа игрока', '⌁', [number('timeout', 'Таймаут, сек', 60, 1, 3600), text('variable', 'Сохранить ответ в', 'player_reply')]),
    logic('random_item', 'Выбрать случайный ингредиент', '⤨', [text('items', 'ID ингредиентов через запятую', 'malt, hops, yeast')])
  ];
  const tuckedAwayLegacyTypes = new Set([
    'location_received', 'photo_received', 'inline_query', 'reaction', 'forward_message',
    'pin_message', 'send_location', 'send_contact', 'send_invoice', 'send_audio',
    'copy_message', 'send_chat_action', 'inline_url_button', 'http_request',
    'webhook', 'json_path', 'date_time', 'random_number'
  ]);

  const defaults = {
    trigger: { command: '/brew', description: 'Начать варку', cooldown: 30 },
    condition: { level: 5, branch: 'Выполнено → продолжить' },
    reward: { reward: 'Литры пива', amount: 100 },
    message: { text: 'Отличная варка! Забирай награду 🍻', format: 'Обычный текст' }
  };
  function defaultGameDatabase() {
    return {
      player: {
        name: 'Тестовый игрок',
        telegramId: '100000001',
        username: 'test_brewer',
        level: 12,
        beer: 450,
        experience: 4250,
        brews: 86
      },
      inventory: {
        capacity: 40,
        items: [
          { id: 'malt', name: 'Солод', category: 'Ресурсы', quantity: 24 },
          { id: 'hops', name: 'Хмель', category: 'Ресурсы', quantity: 12 },
          { id: 'yeast', name: 'Дрожжи', category: 'Ресурсы', quantity: 8 },
          { id: 'amber_ale', name: 'Янтарный эль', category: 'Напитки', quantity: 3 }
        ]
      },
      achievements: [
        { id: 'first_brew', name: 'Первая варка', description: 'Свари первый напиток', unlocked: true },
        { id: 'master_brewer', name: 'Мастер-пивовар', description: 'Свари 100 напитков', unlocked: false }
      ],
      recipes: [
        { id: 'amber_ale', name: 'Янтарный эль', ingredients: 'malt:2, hops:1, yeast:1', unlocked: true },
        { id: 'classic_ipa', name: 'Классическая IPA', ingredients: 'malt:2, hops:3, yeast:1', unlocked: false }
      ],
      clan: {
        id: 'north_barrel',
        name: 'Северная бочка',
        role: 'Участник',
        level: 12,
        members: 18,
        capacity: 25,
        beer: 2400,
        quests: [{ id: 'weekly_brew', name: 'Сварить напитки для клана', progress: 72, target: 100 }]
      },
      variables: [
        { key: 'last_brew', value: 'amber_ale', type: 'Текст' },
        { key: 'brew_streak', value: '4', type: 'Число' }
      ]
    };
  }
  function normalizeGameDatabase(value) {
    const fallback = defaultGameDatabase();
    if (!value || typeof value !== 'object' || Array.isArray(value)) return fallback;
    const asList = (candidate, defaults) => Array.isArray(candidate)
      ? candidate.filter(entry => entry && typeof entry === 'object' && !Array.isArray(entry))
        .slice(0, 500).map(entry => ({ ...entry }))
      : defaults;
    const numberOr = (candidate, defaultValue, min = 0, max = 1_000_000_000) => {
      const numberValue = Number(candidate);
      return Number.isFinite(numberValue) ? Math.min(max, Math.max(min, numberValue)) : defaultValue;
    };
    return {
      player: {
        name: String(value.player?.name ?? fallback.player.name).slice(0, 100),
        telegramId: String(value.player?.telegramId ?? fallback.player.telegramId).slice(0, 32),
        username: String(value.player?.username ?? fallback.player.username).replace(/^@/, '').slice(0, 32),
        level: numberOr(value.player?.level, fallback.player.level, 1, 10000),
        beer: numberOr(value.player?.beer, fallback.player.beer),
        experience: numberOr(value.player?.experience, fallback.player.experience),
        brews: numberOr(value.player?.brews, fallback.player.brews)
      },
      inventory: {
        capacity: numberOr(value.inventory?.capacity, fallback.inventory.capacity, 1, 10000),
        items: asList(value.inventory?.items, fallback.inventory.items).map(item => ({
          id: String(item.id || '').slice(0, 80),
          name: String(item.name || item.id || 'Предмет').slice(0, 100),
          category: String(item.category || 'Предметы').slice(0, 40),
          quantity: numberOr(item.quantity, 0)
        })).filter(item => item.id)
      },
      achievements: asList(value.achievements, fallback.achievements).map(item => ({
        id: String(item.id || '').slice(0, 80),
        name: String(item.name || item.id || 'Достижение').slice(0, 100),
        description: String(item.description || '').slice(0, 200),
        unlocked: Boolean(item.unlocked)
      })).filter(item => item.id),
      recipes: asList(value.recipes, fallback.recipes).map(item => ({
        id: String(item.id || '').slice(0, 80),
        name: String(item.name || item.id || 'Рецепт').slice(0, 100),
        ingredients: String(item.ingredients || '').slice(0, 500),
        unlocked: Boolean(item.unlocked)
      })).filter(item => item.id),
      clan: {
        id: String(value.clan?.id ?? fallback.clan.id).slice(0, 80),
        name: String(value.clan?.name ?? fallback.clan.name).slice(0, 100),
        role: String(value.clan?.role ?? fallback.clan.role).slice(0, 60),
        level: numberOr(value.clan?.level, fallback.clan.level, 1, 10000),
        members: numberOr(value.clan?.members, fallback.clan.members),
        capacity: numberOr(value.clan?.capacity, fallback.clan.capacity, 1, 100000),
        beer: numberOr(value.clan?.beer, fallback.clan.beer),
        quests: asList(value.clan?.quests, fallback.clan.quests).map(item => ({
          id: String(item.id || '').slice(0, 80),
          name: String(item.name || item.id || 'Задание').slice(0, 100),
          progress: numberOr(item.progress, 0),
          target: numberOr(item.target, 1, 1)
        })).filter(item => item.id)
      },
      variables: asList(value.variables, fallback.variables).map(item => ({
        key: String(item.key || '').slice(0, 80),
        value: String(item.value ?? '').slice(0, 500),
        type: item.type === 'Число' ? 'Число' : 'Текст'
      })).filter(item => item.key)
    };
  }
  function normalizeLegacyBrewTerms(project) {
    for (const node of project.nodes) {
      if (!node.values) continue;
      if (['Монеты', 'Пиво'].includes(node.values.currency)) node.values.currency = 'Литры пива';
      if (['Монеты', 'Пиво'].includes(node.values.reward)) node.values.reward = 'Литры пива';
      if (node.values.reward === 'Краски') node.values.reward = 'Предмет';
      if (node.values.variable === 'Баланс монет' || node.values.variable === 'Запас пива') node.values.variable = 'Литры пива';
      if (node.values.name === 'Баланс монет' || node.values.name === 'Запас пива') node.values.name = 'Литры пива';
      if (node.values.property === 'Баланс' || node.values.property === 'Запас пива') node.values.property = 'Литры пива';
      if (node.type === 'add_coins' && ['Начислить монеты', 'Начислить пиво'].includes(node.title)) node.title = 'Начислить литры пива';
      if (node.type === 'remove_coins' && ['Списать валюту', 'Потратить пиво'].includes(node.title)) node.title = 'Списать литры пива';
    }
  }
  function mechanicVariables(database = state.gameDatabase) {
    return [
      { key: 'player_name', label: 'Имя игрока', value: database.player.name },
      { key: 'player_id', label: 'Telegram ID', value: database.player.telegramId },
      { key: 'user_name', label: 'Имя игрока (алиас)', value: database.player.name },
      { key: 'user_id', label: 'ID игрока (алиас)', value: database.player.telegramId },
      { key: 'username', label: 'Username Telegram', value: database.player.username },
      { key: 'level', label: 'Уровень', value: database.player.level },
      { key: 'beer', label: 'Литры пива', value: database.player.beer },
      { key: 'experience', label: 'Опыт', value: database.player.experience },
      { key: 'brews', label: 'Количество варок', value: database.player.brews },
      { key: 'clan_name', label: 'Название клана', value: database.clan.name },
      { key: 'clan_id', label: 'ID клана', value: database.clan.id },
      { key: 'clan_role', label: 'Роль в клане', value: database.clan.role },
      ...database.variables.map(item => ({
        key: item.key,
        label: `${item.key} · ${item.type}`,
        value: item.type === 'Число' && Number.isFinite(Number(item.value)) ? Number(item.value) : item.value
      }))
    ];
  }
  function interpolateMechanicText(template, context) {
    const aliases = {
      'player': context.variables.player_name,
      'player.name': context.variables.player_name,
      'player_name': context.variables.player_name,
      'player.id': context.variables.player_id,
      'player_id': context.variables.player_id,
      'user_id': context.variables.player_id,
      'user.name': context.variables.player_name,
      'user_name': context.variables.player_name,
      'username': context.variables.username,
      'beer': context.beer,
      'coins': context.beer,
      'liters': context.beer,
      'experience': context.experience,
      'level': context.level,
      'brews': context.variables.brews,
      'clan': context.clan,
      'clan.name': context.clan,
      'clan_name': context.clan,
      'clan_id': context.clanId,
      'clan_role': context.variables.clan_role
    };
    return String(template)
      .replace(/\{\{\s*([^{}]+?)\s*\}\}/g, '{$1}')
      .replace(/\{([A-Za-zА-Яа-яЁё_][A-Za-zА-Яа-яЁё0-9_.-]*)\}/g, (match, key) => {
        const normalized = key.toLocaleLowerCase('en');
        if (Object.hasOwn(aliases, normalized) && aliases[normalized] !== undefined) return String(aliases[normalized]);
        if (Object.hasOwn(context.variables, key)) return String(context.variables[key]);
        return match;
      });
  }
  function interpolateNodeValues(values, context) {
    return Object.fromEntries(Object.entries(values || {}).map(([key, value]) => [
      key, typeof value === 'string' ? interpolateMechanicText(value, context) : value
    ]));
  }
  const variableTokenPattern = /^\{[A-Za-zА-Яа-яЁё_][A-Za-zА-Яа-яЁё0-9_.-]{0,79}\}$/;
  const builtinVariableKeys = new Set([
    'player', 'player.name', 'player.id', 'player_name', 'player_id', 'user.name', 'user_name', 'user_id', 'username',
    'beer', 'coins', 'liters', 'experience', 'level', 'brews', 'clan', 'clan.name',
    'clan_name', 'clan_id', 'clan_role'
  ]);
  const initial = {
    version: 1,
    schema: 'piv-mechanics/1',
    name: 'Новая механика',
    nodes: [
      { id: 'trigger-1', type: 'trigger', x: 120, y: 190, title: 'Команда бота', values: { ...defaults.trigger } },
      { id: 'condition-1', type: 'condition', x: 430, y: 155, title: 'Проверить уровень', values: { ...defaults.condition } },
      { id: 'reward-1', type: 'reward', x: 750, y: 190, title: 'Выдать награду', values: { ...defaults.reward } }
    ],
    connections: [{ from: 'trigger-1', to: 'condition-1' }, { from: 'condition-1', to: 'reward-1' }],
    gameScreens: [],
    gameDatabase: defaultGameDatabase()
  };
  const gameScreenTypes = [
    {
      type: 'inventory',
      title: 'Инвентарь',
      icon: '🎒',
      subtitle: 'Склад · 18 / 40 ячеек',
      tabs: ['Все', 'Ресурсы', 'Напитки', 'Предметы'],
      entries: ['🌾 Солод · 24 шт.', '🌿 Хмель · 12 шт.', '🍺 Янтарный эль · 3 шт.', '⚗ Дрожжи · 8 шт.'],
      actions: ['Использовать', 'Продать', 'Сортировка'],
      description: 'Экран хранилища игрока с категориями и предметами.'
    },
    {
      type: 'clan',
      title: 'Клан',
      icon: '♧',
      subtitle: 'Северная бочка · уровень 12',
      tabs: ['Обзор', 'Участники', 'Задания', 'Улучшения'],
      entries: ['♙ Участники · 18 / 25', '⚑ Еженедельное задание · 72%', '⌂ Общая пивоварня · ур. 8'],
      actions: ['Список игроков', 'Внести вклад', 'Задания клана'],
      description: 'Страница клана: состав, общие цели и улучшения.'
    },
    {
      type: 'recipes',
      title: 'Рецепты',
      icon: '📜',
      subtitle: 'Коллекция рецептов · 7 / 24 открыто',
      tabs: ['Все', 'Открытые', 'Секретные'],
      entries: ['🍺 Янтарный эль · открыт', '🌙 Ночная IPA · нужен уровень 15', '❄️ Северный лагер · клановый'],
      actions: ['Открыть рецепт', 'Сварить', 'Показать ингредиенты'],
      description: 'Коллекция рецептов, открытие и запуск варки.'
    },
    {
      type: 'brewery',
      title: 'Пивоварня',
      icon: '⌂',
      subtitle: 'Уровень 8 · очередь варки 2 / 4',
      tabs: ['Обзор', 'Оборудование', 'Очередь'],
      entries: ['♨ Медный котёл · ур. 4', '▤ Склад · 18 / 40', '◷ Варка завершится через 12 мин.'],
      actions: ['Улучшить', 'Начать варку', 'Ускорить очередь'],
      description: 'Панель пивоварни с оборудованием и очередью.'
    },
    {
      type: 'profile',
      title: 'Профиль',
      icon: '☺',
      subtitle: 'Мастер-пивовар · уровень 12',
      tabs: ['Статистика', 'Достижения', 'История'],
      entries: ['★ Опыт · 4 250 / 5 000', '♨ Сварено напитков · 86', '✪ Достижения · 14 / 30'],
      actions: ['Достижения', 'История варок', 'Настроить профиль'],
      description: 'Профиль игрока, статистика и достижения.'
    },
    {
      type: 'achievements',
      title: 'Достижения',
      icon: '✪',
      subtitle: 'Прогресс пивовара',
      tabs: ['Все', 'Получены', 'Секретные'],
      entries: [],
      actions: ['Забрать награду', 'Поделиться'],
      description: 'Список открытых и ещё не полученных достижений.'
    },
    {
      type: 'quests',
      title: 'Задания',
      icon: '⚑',
      subtitle: 'Задания пивовара',
      tabs: ['Ежедневные', 'Сезонные', 'Клановые'],
      entries: [],
      actions: ['Забрать награду', 'К заданию'],
      description: 'Журнал заданий и прогресса игрока.'
    },
    {
      type: 'shop',
      title: 'Лавка',
      icon: '🛒',
      subtitle: 'Обмен ресурсов',
      tabs: ['Напитки', 'Ингредиенты', 'Улучшения'],
      entries: [],
      actions: ['Купить за литры пива', 'Продать'],
      description: 'Игровая лавка с предметами и стоимостью в литрах пива.'
    },
    {
      type: 'brew_history',
      title: 'История варок',
      icon: '♨',
      subtitle: 'Последние партии напитков',
      tabs: ['Все', 'Успешные', 'Редкие'],
      entries: [],
      actions: ['Повторить рецепт', 'Открыть рецепт'],
      description: 'История партий и результатов варки.'
    },
    {
      type: 'leaderboard',
      title: 'Рейтинг',
      icon: '🏆',
      subtitle: 'Лучшие пивовары',
      tabs: ['Пиво', 'Опыт', 'Клан'],
      entries: [],
      actions: ['Профиль игрока', 'Мой рейтинг'],
      description: 'Рейтинг пивоваров по объёму и опыту.'
    }
  ];
  const screenBlockTypes = {
    create_inventory_screen: 'inventory',
    create_clan_screen: 'clan',
    create_recipes_screen: 'recipes',
    create_brewery_screen: 'brewery',
    create_profile_screen: 'profile',
    create_achievements_screen: 'achievements',
    create_quests_screen: 'quests',
    create_shop_screen: 'shop',
    create_brew_history_screen: 'brew_history',
    create_leaderboard_screen: 'leaderboard'
  };
  function gameScreenFromDatabase(type, database = state.gameDatabase) {
    const definition = gameScreenTypes.find(item => item.type === type);
    if (!definition) return null;
    const screen = {
      id: `screen-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      type: definition.type,
      title: definition.title,
      icon: definition.icon,
      subtitle: definition.subtitle,
      description: definition.description,
      tabs: [...definition.tabs],
      entries: [...definition.entries],
      actions: [...definition.actions]
    };
    if (type === 'inventory') {
      screen.subtitle = `Склад · ${database.inventory.items.reduce((sum, item) => sum + item.quantity, 0)} предметов / ${database.inventory.capacity} ячеек`;
      screen.entries = database.inventory.items.map(item => `${item.name} · ${item.quantity} шт.`);
    } else if (type === 'clan') {
      screen.subtitle = `${database.clan.name} · уровень ${database.clan.level}`;
      screen.entries = [
        `♧ Ваша роль · ${database.clan.role}`,
        `♙ Участники · ${database.clan.members} / ${database.clan.capacity}`,
        `🍺 Общий запас · ${database.clan.beer} л`,
        ...database.clan.quests.map(quest => `⚑ ${quest.name} · ${quest.progress} / ${quest.target}`)
      ];
    } else if (type === 'recipes') {
      screen.subtitle = `Рецепты · ${database.recipes.filter(recipe => recipe.unlocked).length} открыто / ${database.recipes.length}`;
      screen.entries = database.recipes.map(recipe => `📜 ${recipe.name} · ${recipe.unlocked ? 'открыт' : 'закрыт'} · ${recipe.ingredients || 'без ингредиентов'}`);
    } else if (type === 'profile') {
      screen.subtitle = `${database.player.name} · уровень ${database.player.level}`;
      screen.entries = [
        `♙ Telegram · @${database.player.username} · ID ${database.player.telegramId}`,
        `🍺 Запас пива · ${database.player.beer} л`,
        `★ Опыт · ${database.player.experience}`,
        `♨ Сварено напитков · ${database.player.brews}`,
        `✪ Достижения · ${database.achievements.filter(item => item.unlocked).length} / ${database.achievements.length}`
      ];
    } else if (type === 'brewery') {
      screen.subtitle = `Уровень ${database.player.level} · сварено ${database.player.brews}`;
      screen.entries = [
        `🍺 Запас пива · ${database.player.beer} л`,
        `🎒 Склад · ${database.inventory.items.length} видов / ${database.inventory.capacity} ячеек`,
        `♨ Рецептов открыто · ${database.recipes.filter(recipe => recipe.unlocked).length}`
      ];
    } else if (type === 'achievements') {
      screen.entries = database.achievements.map(item =>
        `${item.unlocked ? '✅' : '🔒'} ${item.name} · ${item.description || 'Достижение пивовара'}`);
    } else if (type === 'quests') {
      screen.entries = database.clan.quests.map(quest =>
        `⚑ ${quest.name} · ${quest.progress} / ${quest.target}`);
    } else if (type === 'shop') {
      screen.entries = database.inventory.items.slice(0, 20).map(item =>
        `🛒 ${item.name} · ${item.quantity} шт. в инвентаре`);
    } else if (type === 'brew_history') {
      screen.entries = [`♨ Сварено напитков · ${database.player.brews}`, ...database.recipes
        .filter(recipe => recipe.unlocked).map(recipe => `🍺 ${recipe.name} · рецепт открыт`)];
    } else if (type === 'leaderboard') {
      screen.entries = [
        `🏆 1. ${database.player.name || 'Пивовар'} · ${database.player.beer} л пива`,
        `★ Уровень · ${database.player.level}`,
        `♨ Варок · ${database.player.brews}`
      ];
    }
    screen.databaseManaged = true;
    return screen;
  }
  function keepDatabaseAvailable(project) {
    project.gameDatabase = normalizeGameDatabase(project.gameDatabase);
    if (!Array.isArray(project.gameScreens)) project.gameScreens = [];
  }
  const chainTemplates = [
    {
      id: 'welcome',
      title: 'Приветствие нового игрока',
      description: 'Встречает новичка, выдаёт стартовый бонус и показывает меню.',
      nodes: [
        ['new_member', { welcome: 'Все новые участники' }],
        ['daily_reward', { amount: 100, streak: 'Да' }],
        ['message', { text: 'Добро пожаловать в Пивовар! Забирай стартовое пиво и начинай варить 🍻', format: 'Обычный текст' }],
        ['inline_keyboard', { buttons: '🍺 Начать варку | brew:start\n🎒 Инвентарь | inventory:open', columns: 2, layout: 'По колонкам' }]
      ]
    },
    {
      id: 'brew',
      title: 'Случайная варка',
      description: 'Команда запускает варку, выбирает качество и сообщает результат.',
      nodes: [
        ['trigger', { command: '/brew', description: 'Начать варку', cooldown: 30 }],
        ['check_inventory', { itemId: 'hops', required: 1 }],
        ['brew_product', { quality: 'Случайное', quantity: 1 }],
        ['message', { text: 'Варка готова! Твой напиток: {brew_result} 🍺', format: 'Обычный текст' }]
      ]
    },
    {
      id: 'daily',
      title: 'Ежедневная награда',
      description: 'Ограничивает повторный запуск, начисляет бонус и подтверждает выдачу.',
      nodes: [
        ['trigger', { command: '/daily', description: 'Ежедневный бонус', cooldown: 86400 }],
        ['limit', { maxRuns: 1, period: 'В день' }],
        ['daily_reward', { amount: 150, streak: 'Да' }],
        ['message', { text: 'Ежедневный бонус зачислен! Заходи завтра за новым 🍻', format: 'Обычный текст' }]
      ]
    },
    {
      id: 'shop',
      title: 'Покупка предмета',
      description: 'Проверяет запас пива, списывает стоимость покупки и выдаёт предмет.',
      nodes: [
        ['callback', { callbackData: 'shop:buy:hops', userId: 0 }],
        ['answer_callback', { text: 'Покупка обрабатывается', alert: 'Уведомление' }],
        ['remove_coins', { amount: 50, reason: 'Покупка хмеля' }],
        ['give_item', { itemId: 'hops', amount: 1 }],
        ['message', { text: 'Покупка завершена: хмель добавлен в инвентарь.', format: 'Обычный текст' }]
      ]
    },
    {
      id: 'inventory-craft-clan',
      title: 'Инвентарь, клан и крафт',
      description: 'Проверяет материалы, крафтит сорт, записывает продукт в инвентарь и засчитывает вклад в клановый квест.',
      nodes: [
        ['trigger', { command: '/craft', description: 'Скрафтить клановый сорт', cooldown: 10 }],
        ['craft_materials', { recipeId: 'clan_amber', ingredients: 'malt:2, hops:1, yeast:1' }],
        ['craft_recipe', { recipeId: 'clan_amber', quantity: 1 }],
        ['inventory_add', { item: 'Янтарный эль', quantity: 1 }],
        ['clan_quest', { questId: 'weekly_brew', progress: 1 }],
        ['clan_contribute', { currency: 'Предмет', amount: 1, goalId: 'brewery_upgrade' }],
        ['message', { text: '⚗ Янтарный эль создан, добавлен в инвентарь и учтён в прогрессе кланового задания!', format: 'Обычный текст' }]
      ]
    },
  ];

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const elements = {
    canvas: $('#canvas-grid'), wrap: $('#canvas-wrap'), nodes: $('#nodes-layer'), wires: $('#wires-layer'), wireOverlay: $('#wires-overlay'),
    stage: $('#canvas-stage'),
    inspector: $('#inspector-content'), groups: $('#block-groups'), saveStatus: $('#save-status'),
    toast: $('#toast'), dialog: $('#sheet-dialog'), dialogContent: $('#dialog-content'), contextMenu: $('#node-context-menu'),
    emptyHint: $('#empty-hint'), importFile: $('#import-file')
  };
  let state = loadProject();
  keepDatabaseAvailable(state);
  saveProject();
  let authUser = null;
  let authConfig = { telegramConfigured: false, botUsername: '' };
  let devMode = false;
  const slashTaps = [];
  let selectedId = state.nodes[0]?.id ?? null;
  let selectedIds = new Set(selectedId ? [selectedId] : []);
  let scale = 1;
  let zoomTarget = scale;
  let zoomFrame = 0;
  const world = { originX: 1800, originY: 1300, width: 3600, height: 2600, margin: 700, growth: 1400 };
  let activeWire = null;
  let panning = null;
  let selecting = null;
  let spaceDown = false;
  let hoveredNodeId = null;
  let suppressClick = false;
  let resizingNodeId = null;
  let nodeResizeObserver = null;
  let overlayResizeObserver = null;
  let toastTimer;
  const undoStack = [];
  const redoStack = [];
  let gridSize = Number(localStorage.getItem('piv-mechanics-grid-size')) || 22;
  const minScale = 0.001;
  const maxScale = 1000;
  let snapToGrid = localStorage.getItem('piv-mechanics-snap') === 'true';
  let gridVisible = localStorage.getItem('piv-mechanics-visible') !== 'false';
  let collapsedGroups = {};
  try {
    collapsedGroups = JSON.parse(localStorage.getItem('piv-mechanics-collapsed-groups') || '{}');
  } catch (error) {
    console.warn('Не удалось восстановить свёрнутые категории блоков:', error);
  }
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const savedTheme = localStorage.getItem('piv-mechanics-theme');

  function applyTheme(theme, persist = true) {
    const normalized = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = normalized;
    const button = $('#theme-button');
    button.textContent = normalized === 'dark' ? '☀' : '☾';
    button.setAttribute('aria-label', normalized === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему');
    button.title = normalized === 'dark' ? 'Светлая тема' : 'Тёмная тема';
    document.querySelector('meta[name="theme-color"]').content = normalized === 'dark' ? '#24231f' : '#f5bc25';
    if (persist) localStorage.setItem('piv-mechanics-theme', normalized);
  }
  applyTheme(savedTheme || 'light', false);

  function loadProject() {
    try {
      const saved = localStorage.getItem('piv-mechanics-studio');
      if (!saved) return structuredClone(initial);
      const parsed = JSON.parse(saved);
      if (parsed?.version === 1 && Array.isArray(parsed.nodes) && Array.isArray(parsed.connections)) {
        if (parsed.nodes.some(node => !node?.id || !definitionFor(node.type) || !Number.isFinite(node.x) || !Number.isFinite(node.y))) {
          throw new Error('Черновик содержит неизвестные или некорректно расположенные блоки.');
        }
        const ids = new Set(parsed.nodes.map(node => node.id));
        if (parsed.connections.some(edge => !edge || !ids.has(edge.from) || !ids.has(edge.to) || edge.from === edge.to)) {
          throw new Error('Черновик содержит некорректные соединения.');
        }
        for (const node of parsed.nodes) {
          if (node.type === 'trigger') {
            if (node.title === 'Когда игрок нажал') node.title = 'Команда бота';
            if (!node.values?.command && node.values?.event?.startsWith('Команда /')) {
              node.values.command = node.values.event.slice('Команда /'.length);
            }
          }
          normalizeLegacyBrewTerms(parsed);
        }
        if (parsed.gameScreens !== undefined && (!Array.isArray(parsed.gameScreens) ||
            parsed.gameScreens.some(screen => !screen || typeof screen.id !== 'string' ||
              !gameScreenTypes.some(type => type.type === screen.type) ||
              !Array.isArray(screen.tabs) || !Array.isArray(screen.entries) || !Array.isArray(screen.actions)))) {
          throw new Error('Черновик содержит некорректный игровой экран.');
        }
        parsed.gameScreens ??= [];
        keepDatabaseAvailable(parsed);
        return parsed;
      }
    } catch (error) {
      console.warn('Не удалось загрузить локальный черновик:', error);
    }
    return structuredClone(initial);
  }

  function saveProject() {
    try {
      keepDatabaseAvailable(state);
      localStorage.setItem('piv-mechanics-studio', JSON.stringify(state));
      elements.saveStatus.textContent = 'Сохранено';
      $('.saved-dot').style.background = '#6eb78b';
    } catch (error) {
      elements.saveStatus.textContent = 'Ошибка сохранения';
      $('.saved-dot').style.background = '#cf795c';
      console.error('Не удалось сохранить черновик:', error);
    }
  }

  function checkpoint() {
    const snapshot = JSON.stringify(state);
    if (undoStack.at(-1) === snapshot) return;
    undoStack.push(snapshot);
    if (undoStack.length > 20) undoStack.shift();
    redoStack.length = 0;
  }

  function setSelection(ids, primary = ids.at(-1) ?? null) {
    selectedIds = new Set(ids.filter(id => state.nodes.some(node => node.id === id)));
    selectedId = selectedIds.has(primary) ? primary : [...selectedIds].at(-1) ?? null;
    for (const card of $$('.node-card', elements.nodes)) {
      card.classList.toggle('selected', selectedIds.has(card.dataset.nodeId));
    }
  }

  function redo() {
    const next = redoStack.pop();
    if (!next) {
      showToast('Пока нечего повторять');
      return;
    }
    undoStack.push(JSON.stringify(state));
    restoreSnapshot(next);
    showToast('Изменение повторено');
  }

  function undo() {
    const previous = undoStack.pop();
    if (!previous) {
      showToast('Пока нечего отменять');
      return;
    }
    redoStack.push(JSON.stringify(state));
    restoreSnapshot(previous);
    showToast('Последнее изменение отменено');
  }

  function restoreSnapshot(snapshot) {
    state = JSON.parse(snapshot);
    keepDatabaseAvailable(state);
    setSelection(selectedId && state.nodes.some(node => node.id === selectedId)
      ? [selectedId]
      : state.nodes.slice(0, 1).map(node => node.id));
    saveProject();
    render();
  }

  function getPortCapabilities(node) {
    const isEvent = info(node.type).subtitle === 'СОБЫТИЕ';
    return { input: !isEvent, output: node.type !== 'stop' };
  }

  function getNodeOutputs(node) {
    const outputs = info(node.type).outputs;
    return outputs?.length ? outputs : [{ key: 'next', label: 'ДАЛЕЕ' }];
  }

  function connectionError(fromId, toId, outputKey = 'next') {
    const from = nodeById(fromId);
    const to = nodeById(toId);
    if (!from || !to) return 'Не удалось найти один из блоков.';
    if (fromId === toId) return 'Блок не может соединяться сам с собой.';
    if (!getPortCapabilities(from).output) return `У блока «${from.title}» нет выхода: это конечный блок.`;
    if (!getPortCapabilities(to).input) return `Блок «${to.title}» — событие и не принимает входящие соединения.`;
    if (!getNodeOutputs(from).some(output => output.key === outputKey)) {
      return `У блока «${from.title}» нет выхода «${outputKey}».`;
    }
    if (state.connections.some(edge => edge.to === toId && edge.from !== fromId)) {
      return `У блока «${to.title}» уже занято входное соединение.`;
    }
    if (state.connections.some(edge => edge.from === fromId && (edge.outputKey || 'next') === outputKey && edge.to !== toId)) {
      return `Выход «${getNodeOutputs(from).find(output => output.key === outputKey)?.label || outputKey}» уже соединён.`;
    }
    const pending = [toId];
    const visited = new Set();
    while (pending.length) {
      const next = pending.pop();
      if (next === fromId) return 'Это соединение создаст цикл.';
      if (visited.has(next)) continue;
      visited.add(next);
      for (const edge of state.connections) {
        if (edge.from === next) pending.push(edge.to);
      }
    }
    return '';
  }

  function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => elements.toast.classList.remove('visible'), 2500);
  }

  function syncCanvasOverlays() {
    const bounds = elements.wrap.getBoundingClientRect();
    const tools = $('.canvas-tools');
    const status = $('.canvas-status');
    const toolsWidth = tools.offsetWidth;
    const toolsHeight = tools.offsetHeight;
    const statusHeight = status.offsetHeight;
    tools.style.left = `${Math.max(8, Math.min(bounds.right - toolsWidth - 12, innerWidth - toolsWidth - 8))}px`;
    tools.style.top = `${Math.max(8, Math.min(bounds.top + 12, innerHeight - toolsHeight - 8))}px`;
    status.style.left = `${Math.max(8, Math.min(bounds.left + 12, innerWidth - status.offsetWidth - 8))}px`;
    status.style.top = `${Math.max(8, Math.min(bounds.bottom - statusHeight - 12, innerHeight - statusHeight - 8))}px`;
  }

  function definitionFor(type) { return catalog.find(item => item.type === type); }
  function info(type) { return definitionFor(type) ?? catalog[0]; }
  function nodeById(id) { return state.nodes.find(node => node.id === id); }

  function nodePixelPosition(node) {
    return { x: world.originX + node.x, y: world.originY + node.y };
  }

  function syncWorldSize() {
    elements.canvas.style.width = `${world.width}px`;
    elements.canvas.style.height = `${world.height}px`;
    elements.wires.setAttribute('viewBox', `0 0 ${world.width} ${world.height}`);
    elements.stage.style.width = `${world.width * scale}px`;
    elements.stage.style.height = `${world.height * scale}px`;
  }

  function updateNodePositions() {
    for (const card of $$('.node-card', elements.nodes)) {
      const node = nodeById(card.dataset.nodeId);
      if (!node) continue;
      const point = nodePixelPosition(node);
      card.style.left = `${point.x}px`;
      card.style.top = `${point.y}px`;
    }
  }

  function ensureWorldBounds() {
    const cards = new Map($$('.node-card', elements.nodes).map(card => [card.dataset.nodeId, card]));
    if (!state.nodes.length) return;
    const extents = state.nodes.map(node => {
      const card = cards.get(node.id);
      return {
        left: world.originX + node.x,
        top: world.originY + node.y,
        right: world.originX + node.x + (card?.offsetWidth || node.width || 218),
        bottom: world.originY + node.y + (card?.offsetHeight || node.height || 140)
      };
    }).reduce((all, node) => ({
      left: Math.min(all.left, node.left),
      top: Math.min(all.top, node.top),
      right: Math.max(all.right, node.right),
      bottom: Math.max(all.bottom, node.bottom)
    }), { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity });
    let growLeft = 0;
    let growTop = 0;
    if (extents.left < world.margin) growLeft = Math.ceil((world.margin - extents.left) / world.growth) * world.growth;
    if (extents.top < world.margin) growTop = Math.ceil((world.margin - extents.top) / world.growth) * world.growth;
    if (growLeft) world.originX += growLeft;
    if (growTop) world.originY += growTop;
    world.width = Math.max(world.width + growLeft, world.originX + extents.right - extents.left + world.margin);
    world.height = Math.max(world.height + growTop, world.originY + extents.bottom - extents.top + world.margin);
    if (extents.right + growLeft > world.width - world.margin) {
      world.width += Math.ceil((extents.right + growLeft - (world.width - world.margin)) / world.growth) * world.growth;
    }
    if (extents.bottom + growTop > world.height - world.margin) {
      world.height += Math.ceil((extents.bottom + growTop - (world.height - world.margin)) / world.growth) * world.growth;
    }
    syncWorldSize();
    if (growLeft) elements.wrap.scrollLeft += growLeft * scale;
    if (growTop) elements.wrap.scrollTop += growTop * scale;
    updateNodePositions();
  }

  function renderLibrary(filter = '') {
    elements.groups.replaceChildren();
    const query = filter.trim().toLocaleLowerCase('ru');
    const groups = new Map();
    for (const block of catalog.filter(item => !tuckedAwayLegacyTypes.has(item.type) &&
      `${item.title} ${item.group} ${item.type}`.toLocaleLowerCase('ru').includes(query))) {
      if (!groups.has(block.group)) groups.set(block.group, []);
      groups.get(block.group).push(block);
    }
    for (const [name, blocks] of groups) {
      const group = document.createElement('section');
      group.className = 'block-group';
      const collapsed = !query && collapsedGroups[name] === true;
      const heading = document.createElement('button');
      heading.className = 'group-title';
      heading.type = 'button';
      heading.setAttribute('aria-expanded', String(!collapsed));
      heading.innerHTML = `<span class="group-chevron" aria-hidden="true">${collapsed ? '›' : '⌄'}</span><span class="group-name"></span><span class="group-count">${blocks.length}</span>`;
      $('.group-name', heading).textContent = name;
      heading.addEventListener('click', () => {
        collapsedGroups[name] = !collapsedGroups[name];
        localStorage.setItem('piv-mechanics-collapsed-groups', JSON.stringify(collapsedGroups));
        renderLibrary($('#block-search').value);
      });
      group.append(heading);
      const list = document.createElement('div');
      list.className = 'block-group-items';
      list.hidden = collapsed;
      for (const block of blocks) {
        const item = document.createElement('div');
        item.className = 'palette-block';
        item.draggable = true;
        item.tabIndex = 0;
        item.dataset.type = block.type;
        const icon = document.createElement('span');
        icon.className = 'palette-icon';
        icon.style.background = block.color;
        icon.textContent = block.icon;
        const title = document.createElement('span');
        title.textContent = block.title;
        item.append(icon, title);
        item.addEventListener('click', () => addNode(block.type));
        item.addEventListener('keydown', event => {
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); addNode(block.type); }
        });
        item.addEventListener('dragstart', event => event.dataTransfer.setData('text/plain', block.type));
        list.append(item);
      }
      group.append(list);
      elements.groups.append(group);
    }
    if (!elements.groups.children.length) {
      const empty = document.createElement('p');
      empty.className = 'field-help';
      empty.textContent = 'Блоков не найдено.';
      elements.groups.append(empty);
    }
  }

  function render() {
    $('#project-title').textContent = state.name || 'Новая механика';
    $('#breadcrumb-title').textContent = state.name || 'Новая механика';
    elements.nodes.replaceChildren();
    elements.emptyHint.hidden = state.nodes.length !== 0;
    for (const node of state.nodes) {
      const definition = info(node.type);
      const card = document.createElement('article');
      card.className = `node-card${selectedIds.has(node.id) || node.id === selectedId ? ' selected' : ''}${node.collapsed ? ' collapsed' : ''}`;
      card.dataset.nodeId = node.id;
      const point = nodePixelPosition(node);
      card.style.left = `${point.x}px`;
      card.style.top = `${point.y}px`;
      if (node.width) card.style.width = `${node.width}px`;
      if (node.height) card.style.height = `${node.height}px`;
      card.setAttribute('aria-label', definition.title);

      const header = document.createElement('div');
      header.className = 'node-head';
      const icon = document.createElement('span');
      icon.className = 'node-icon';
      icon.style.background = definition.color;
      icon.textContent = definition.icon;
      const titleGroup = document.createElement('span');
      titleGroup.className = 'node-title';
      const title = document.createElement('strong');
      title.textContent = node.title || definition.title;
      const subtitle = document.createElement('small');
      subtitle.textContent = definition.subtitle;
      titleGroup.append(title, subtitle);
      const dots = document.createElement('span');
      dots.className = 'node-dots';
      dots.textContent = '···';
      header.append(icon, titleGroup, dots);

      const body = document.createElement('div');
      body.className = 'node-body';
      for (const field of definition.fields.slice(0, 2)) {
        const row = document.createElement('div');
        row.className = 'node-parameter';
        const label = document.createElement('span');
        label.textContent = field.label;
        const value = document.createElement('strong');
        value.className = 'mini-value';
        const current = node.values?.[field.key] ?? field.default ?? field.options?.[0] ?? '';
        value.textContent = field.kind === 'range' ? `${current}%` : String(current).slice(0, 22);
        row.append(label, value);
        body.append(row);
      }
      const input = document.createElement('button');
      input.className = 'node-port input';
      input.type = 'button';
      input.dataset.port = 'input';
      input.dataset.portType = 'flow';
      input.disabled = !getPortCapabilities(node).input;
      input.setAttribute('aria-label', `Вход блока «${definition.title}»`);
      const outputs = document.createElement('div');
      outputs.className = `node-outputs${info(node.type).outputs ? ' branched' : ''}`;
      for (const outputDefinition of getNodeOutputs(node)) {
        const output = document.createElement('button');
        output.className = `node-port output${info(node.type).outputs ? ' branch-output' : ''}`;
        output.type = 'button';
        output.dataset.port = 'output';
        output.dataset.portKey = outputDefinition.key;
        output.dataset.portType = 'flow';
        output.disabled = !getPortCapabilities(node).output;
        output.setAttribute('aria-label', `Выход «${outputDefinition.label}» блока «${definition.title}»`);
        if (info(node.type).outputs) {
          const row = document.createElement('span');
          row.className = `branch-output-row branch-output-${outputDefinition.key}`;
          const label = document.createElement('span');
          label.className = 'branch-output-label';
          label.textContent = outputDefinition.label;
          row.append(label, output);
          outputs.append(row);
        } else {
          outputs.append(output);
        }
      }
      card.append(input, header, body, outputs);
      card.addEventListener('pointerdown', handleNodePointerDown);
      card.addEventListener('click', event => {
        if (event.target.closest('.node-port')) return;
        if (suppressClick) { suppressClick = false; return; }
        if (event.ctrlKey || event.metaKey) {
          const next = new Set(selectedIds);
          if (next.has(node.id)) next.delete(node.id);
          else next.add(node.id);
          setSelection([...next]);
        } else {
          setSelection([node.id]);
          renderInspector();
        }
        if (window.innerWidth <= 780) $('.inspector-panel').classList.add('mobile-open');
      });
      card.addEventListener('contextmenu', event => {
        event.preventDefault();
        event.stopPropagation();
        setSelection([node.id]);
        renderInspector();
        openContextMenu(event.clientX, event.clientY, [
          { label: '✎  Редактировать блок', action: () => { setSelection([node.id]); render(); focusInspector(); } },
          { label: '⧉  Дублировать блок', action: () => duplicateNode(node.id) },
          { label: '⌖  Приблизить к блоку', action: () => zoomToNode(node.id) },
          { label: node.collapsed ? '▱  Развернуть блок' : '▰  Свернуть блок', action: () => toggleNodeCollapsed(node.id) },
          { separator: true },
          { label: '⌫  Удалить блок', danger: true, action: () => deleteNode(node.id) }
        ], node.title || info(node.type).title);
      });
      card.addEventListener('pointerenter', () => { hoveredNodeId = node.id; });
      card.addEventListener('pointerleave', () => { if (hoveredNodeId === node.id) hoveredNodeId = null; });
      card.addEventListener('pointerup', () => {
        if (resizingNodeId !== node.id) return;
        resizingNodeId = null;
        node.width = card.offsetWidth;
        node.height = card.offsetHeight;
        ensureWorldBounds();
        saveProject();
        renderWires();
      });
      for (const port of $$('.node-port', card)) port.addEventListener('pointerdown', handlePortPointerDown);
      elements.nodes.append(card);
    }
    ensureWorldBounds();
    renderInspector();
    renderWires();
    observeCardResizing();
    $('#node-count').textContent = `${state.nodes.length} ${plural(state.nodes.length, 'блок', 'блока', 'блоков')}`;
    $('#connection-count').textContent = `${state.connections.length} ${plural(state.connections.length, 'связь', 'связи', 'связей')}`;
    $('#test-badge').hidden = !state.nodes.length;
    elements.canvas.style.transform = `scale(${scale})`;
    elements.canvas.classList.toggle('grid-hidden', !gridVisible);
    updateGridControls();
  }

  function plural(number, one, few, many) {
    const n = Math.abs(number) % 100;
    if (n > 10 && n < 20) return many;
    const last = n % 10;
    return last === 1 ? one : last > 1 && last < 5 ? few : many;
  }

  function renderInspector() {
    elements.inspector.replaceChildren();
    if (selectedIds.size > 1) {
      const summary = document.createElement('div');
      summary.className = 'selection-summary';
      summary.innerHTML = `<strong>${selectedIds.size} блока выбрано</strong><span>ЛКМ по пустому месту — рамка; Ctrl+ЛКМ добавляет к выделению. Можно выровнять или удалить выбранные блоки.</span>`;
      const align = document.createElement('button');
      align.className = 'action-button';
      align.type = 'button';
      align.textContent = 'Выровнять по сетке';
      align.addEventListener('click', alignNodesToGrid);
      const remove = document.createElement('button');
      remove.className = 'delete-node-button';
      remove.type = 'button';
      remove.textContent = `Удалить выбранные (${selectedIds.size})`;
      remove.addEventListener('click', deleteSelectedNodes);
      elements.inspector.append(summary, align, remove);
      return;
    }
    const node = nodeById(selectedId);
    if (!node) {
      const empty = document.createElement('div');
      empty.className = 'inspector-empty';
      empty.innerHTML = '<span>⌘</span><strong>Выбери блок на схеме</strong><span>Здесь появятся его параметры и настройки соединений.</span>';
      elements.inspector.append(empty);
      return;
    }
    const definition = info(node.type);
    const summary = document.createElement('div');
    summary.className = 'selected-summary';
    const icon = document.createElement('span');
    icon.className = 'palette-icon';
    icon.style.background = definition.color;
    icon.textContent = definition.icon;
    const description = document.createElement('div');
    const name = document.createElement('strong');
    name.textContent = node.title || definition.title;
    const type = document.createElement('small');
    type.textContent = `${definition.subtitle} · ID: ${node.id}`;
    description.append(name, type);
    summary.append(icon, description);
    elements.inspector.append(summary);
    const notice = document.createElement('p');
    notice.className = 'inspector-notice';
    notice.textContent = 'Настрой параметры ниже: изменения сохраняются сразу, поле ввода остаётся активным.';
    elements.inspector.append(notice);

    const config = document.createElement('section');
    config.className = 'form-section';
    const heading = document.createElement('h3');
    heading.textContent = `${definition.fields.length} параметров`;
    config.append(heading);
    for (const field of definition.fields) {
      const row = document.createElement('div');
      row.className = 'field-row';
      const label = document.createElement('label');
      label.textContent = field.label;
      const control = document.createElement(field.kind === 'select' ? 'select' : field.kind === 'textarea' ? 'textarea' : 'input');
      control.id = `field-${node.id}-${field.key}`;
      label.htmlFor = control.id;
      if (field.kind === 'select') {
        for (const optionText of field.options) {
          const option = document.createElement('option');
          option.value = optionText;
          option.textContent = optionText;
          control.append(option);
        }
      } else if (field.kind !== 'textarea') {
        control.type = field.kind === 'range' ? 'range' : field.kind === 'number' ? 'text' : field.kind;
        if (field.kind === 'number') control.inputMode = 'decimal';
        if (field.min !== undefined) control.min = String(field.min);
        if (field.max !== undefined) control.max = String(field.max);
        if (field.kind === 'number') control.step = '1';
      }
      control.value = node.values?.[field.key] ?? field.default ?? field.options?.[0] ?? '';
      if (field.kind === 'text' || field.kind === 'textarea') control.placeholder = field.default || '';
      if (field.kind === 'range') {
        label.textContent = `${field.label}: ${control.value}%`;
        control.addEventListener('input', () => { label.textContent = `${field.label}: ${control.value}%`; });
      }
      let fieldChanged = false;
      const updateField = () => {
        const numberToken = field.kind === 'number' && variableTokenPattern.test(control.value.trim());
        if (field.kind === 'number' && !numberToken) {
          const numeric = Number(control.value);
          if (control.value.trim() === '' || !Number.isFinite(numeric) ||
              numeric < (field.min ?? -Infinity) || numeric > (field.max ?? Infinity)) return;
        }
        if (!fieldChanged) {
          checkpoint();
          fieldChanged = true;
        }
        if (!node.values) node.values = {};
        node.values[field.key] = field.kind === 'number' && !numberToken || field.kind === 'range'
          ? Number(control.value) : control.value;
        if (field.key === 'screenTitle' && node.values.screenId) {
          const screen = state.gameScreens.find(item => item.id === node.values.screenId);
          if (screen) screen.title = String(control.value).trim() || definition.title;
        }
        saveProject();
        const card = $(`[data-node-id="${CSS.escape(node.id)}"]`, elements.nodes);
        if (card) {
          const index = definition.fields.indexOf(field);
          const preview = $$('.node-parameter', card)[index];
          if (preview) {
            const value = $('.mini-value', preview);
            value.textContent = field.kind === 'range' ? `${control.value}%` : String(control.value).slice(0, 22);
            value.title = String(control.value);
          }
        }
      };
      control.addEventListener(field.kind === 'select' ? 'change' : 'input', updateField);
      row.append(label, control);
      if (field.kind === 'text' || field.kind === 'textarea' || field.kind === 'number') {
        const variableTools = document.createElement('div');
        variableTools.className = 'variable-insert-tools';
        const variableSelect = document.createElement('select');
        variableSelect.setAttribute('aria-label', 'Переменная для вставки');
        const prompt = document.createElement('option');
        prompt.value = '';
        prompt.textContent = 'Вставить переменную…';
        variableSelect.append(prompt);
        for (const variable of mechanicVariables()) {
          const option = document.createElement('option');
          option.value = variable.key;
          option.textContent = `{${variable.key}} — ${variable.label}`;
          variableSelect.append(option);
        }
        const insert = document.createElement('button');
        insert.type = 'button';
        insert.className = 'action-button';
        insert.textContent = 'Вставить';
        insert.addEventListener('click', () => {
          if (!variableSelect.value) {
            showToast('Сначала выбери переменную');
            return;
          }
          const token = `{${variableSelect.value}}`;
          const start = field.kind === 'number' ? 0 : control.selectionStart ?? control.value.length;
          const end = field.kind === 'number' ? control.value.length : control.selectionEnd ?? start;
          control.setRangeText(token, start, end, 'end');
          control.dispatchEvent(new Event('input', { bubbles: true }));
          variableSelect.value = '';
          control.focus();
        });
        variableTools.append(variableSelect, insert);
        row.append(variableTools);
      }
      const hint = field.help || (field.kind === 'number' || field.kind === 'range'
        ? `Допустимое значение: от ${field.min ?? 0} до ${field.max ?? 100000}${field.kind === 'number' ? '; числовая переменная {имя} заменит текущее значение' : ''}.`
        : field.kind === 'textarea'
          ? 'Для списка значений вводи каждый пункт с новой строки.'
          : field.kind === 'select'
            ? 'Выбери одно из доступных значений.'
            : 'Подставь данные в формате {имя_переменной}, например {player_name} или {beer}.');
      if (hint) {
        const help = document.createElement('small');
        help.className = 'field-help';
        help.textContent = hint;
        row.append(help);
      }
      config.append(row);
    }
    const nameSection = document.createElement('section');
    nameSection.className = 'form-section';
    const nameHeading = document.createElement('h3');
    nameHeading.textContent = 'Название';
    const nameRow = document.createElement('div');
    nameRow.className = 'field-row';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.maxLength = 48;
    nameInput.value = node.title || definition.title;
    nameInput.setAttribute('aria-label', 'Название блока');
    nameInput.addEventListener('change', () => {
      checkpoint();
      node.title = nameInput.value.trim() || definition.title;
      saveProject();
      render();
    });
    nameRow.append(nameInput);
    nameSection.append(nameHeading, nameRow);
    const resetButton = document.createElement('button');
    resetButton.className = 'reset-node-button';
    resetButton.type = 'button';
    resetButton.textContent = 'Сбросить параметры по умолчанию';
    resetButton.addEventListener('click', () => {
      checkpoint();
      const screenId = node.values?.screenId;
      node.values = Object.fromEntries(definition.fields.map(field => [field.key, field.default ?? field.options?.[0] ?? '']));
      if (screenId) {
        node.values.screenId = screenId;
        const screen = state.gameScreens.find(item => item.id === screenId);
        if (screen && node.values.screenTitle) screen.title = node.values.screenTitle;
      }
      saveProject();
      render();
    });
    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-node-button';
    deleteButton.type = 'button';
    deleteButton.textContent = 'Удалить блок';
    deleteButton.addEventListener('click', () => deleteNode(node.id));
    elements.inspector.append(config);
    if (node.values?.screenId) {
      const screenButton = document.createElement('button');
      screenButton.type = 'button';
      screenButton.className = 'action-button';
      screenButton.textContent = 'Настроить созданную вкладку';
      screenButton.addEventListener('click', () => editGameScreen(node.values.screenId));
      elements.inspector.append(screenButton);
    }
    elements.inspector.append(resetButton, nameSection, deleteButton);
    const appearance = document.createElement('section');
    appearance.className = 'form-section';
    const appearanceHeading = document.createElement('h3');
    appearanceHeading.textContent = 'Вид и размер';
    appearance.append(appearanceHeading);
    const sizeGrid = document.createElement('div');
    sizeGrid.className = 'node-size-grid';
    for (const [key, label, fallback, min, max] of [
      ['width', 'Ширина', 218, 190, 640],
      ['height', 'Высота', 140, 100, 560]
    ]) {
      const row = document.createElement('div');
      row.className = 'field-row';
      const fieldLabel = document.createElement('label');
      fieldLabel.textContent = `${label}, px`;
      const input = document.createElement('input');
      input.type = 'number';
      input.min = String(min);
      input.max = String(max);
      input.step = '1';
      input.value = String(node[key] ?? $(`[data-node-id="${CSS.escape(node.id)}"]`, elements.nodes)?.[key === 'width' ? 'offsetWidth' : 'offsetHeight'] ?? fallback);
      input.addEventListener('change', () => {
        if (!input.validity.valid || input.value === '') {
          input.value = String(node[key] ?? fallback);
          return;
        }
        checkpoint();
        node[key] = Number(input.value);
        const card = $(`[data-node-id="${CSS.escape(node.id)}"]`, elements.nodes);
        if (card) card.style[key] = `${node[key]}px`;
        ensureWorldBounds();
        renderWires();
        saveProject();
      });
      row.append(fieldLabel, input);
      sizeGrid.append(row);
    }
    const collapseToggle = document.createElement('button');
    collapseToggle.className = 'action-button collapse-node-button';
    collapseToggle.type = 'button';
    collapseToggle.textContent = node.collapsed ? '▱ Развернуть блок' : '▰ Свернуть до строки';
    collapseToggle.addEventListener('click', () => toggleNodeCollapsed(node.id));
    appearance.append(sizeGrid, collapseToggle);
    elements.inspector.append(appearance);
  }

  function toggleNodeCollapsed(id) {
    const node = nodeById(id);
    if (!node) return;
    checkpoint();
    node.collapsed = !node.collapsed;
    saveProject();
    render();
  }

  function portPosition(nodeId, portName, portKey = 'next') {
    const card = $(`[data-node-id="${CSS.escape(nodeId)}"]`, elements.nodes);
    if (!card) return null;
    const node = nodeById(nodeId);
    const port = portName === 'output'
      ? $(`.node-port.output[data-port-key="${CSS.escape(portKey)}"]`, card)
      : $('.node-port.input', card);
    if (!port) return null;
    const cardRect = card.getBoundingClientRect();
    const portRect = port.getBoundingClientRect();
    return {
      x: world.originX + node.x + (portRect.left + portRect.width / 2 - cardRect.left) / scale,
      y: world.originY + node.y + (portRect.top + portRect.height / 2 - cardRect.top) / scale
    };
  }

  function renderWires() {
    elements.wires.replaceChildren();
    elements.wires.setAttribute('viewBox', `0 0 ${elements.canvas.offsetWidth} ${elements.canvas.offsetHeight}`);
    elements.wireOverlay.replaceChildren();
    elements.wireOverlay.setAttribute('viewBox', `0 0 ${world.width} ${world.height}`);
    for (const connection of state.connections) {
      const from = portPosition(connection.from, 'output', connection.outputKey || 'next');
      const to = portPosition(connection.to, 'input');
      if (!from || !to) continue;
      const path = bezier(from, to);
      const hitLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      hitLine.setAttribute('d', path);
      hitLine.setAttribute('class', 'wire-hit');
      hitLine.dataset.from = connection.from;
      hitLine.dataset.to = connection.to;
      hitLine.addEventListener('dblclick', event => {
        event.preventDefault();
        event.stopPropagation();
        removeConnection(connection.from, connection.to);
      });
      hitLine.addEventListener('contextmenu', event => {
        event.preventDefault();
        event.stopPropagation();
        openContextMenu(event.clientX, event.clientY, [
          { label: '⌫  Удалить связь', danger: true, action: () => removeConnection(connection.from, connection.to) }
        ], 'Соединение блоков');
      });
      elements.wires.append(hitLine);
      for (const [className, width] of [['wire-shadow', 5], ['wire-path', 2.4], ['wire-flow', 1.2]]) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        line.setAttribute('d', path);
        line.setAttribute('class', className);
        line.setAttribute('stroke-width', String(width));
        elements.wires.append(line);
      }
      const measure = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      measure.setAttribute('d', path);
      measure.setAttribute('visibility', 'hidden');
      elements.wireOverlay.append(measure);
      const totalLength = measure.getTotalLength();
      const step = Math.max(2, Math.min(5, totalLength / 160));
      const blockers = state.nodes.filter(node => node.id !== connection.from && node.id !== connection.to)
        .map(node => {
          const card = $(`[data-node-id="${CSS.escape(node.id)}"]`, elements.nodes);
          const point = nodePixelPosition(node);
          return {
            left: point.x,
            top: point.y,
            right: point.x + (card?.offsetWidth ?? node.width ?? 218),
            bottom: point.y + (card?.offsetHeight ?? (node.collapsed ? 40 : node.height ?? 140))
          };
        });
      let hiddenSegment = [];
      const flushHiddenSegment = () => {
        if (hiddenSegment.length > 1) {
          const hiddenPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          hiddenPath.setAttribute('d', hiddenSegment.map((point, index) =>
            `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' '));
          hiddenPath.setAttribute('class', 'wire-obscured');
          elements.wireOverlay.append(hiddenPath);
        }
        hiddenSegment = [];
      };
      for (let distance = 0; distance <= totalLength; distance += step) {
        const point = measure.getPointAtLength(Math.min(distance, totalLength));
        const obscured = blockers.some(blocker =>
          point.x > blocker.left + 1 && point.x < blocker.right - 1 &&
          point.y > blocker.top + 1 && point.y < blocker.bottom - 1);
        if (obscured) hiddenSegment.push(point);
        else flushHiddenSegment();
      }
      flushHiddenSegment();
      measure.remove();
    }
    if (activeWire) {
      const start = portPosition(activeWire.from, 'output', activeWire.outputKey);
      if (start && activeWire.pointer) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        line.setAttribute('d', bezier(start, activeWire.pointer));
        line.setAttribute('class', 'wire-temp');
        elements.wires.append(line);
      }
    }
  }

  function observeCardResizing() {
    if (!window.ResizeObserver) return;
    if (!nodeResizeObserver) {
      nodeResizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          const card = entry.target;
          if (resizingNodeId !== card.dataset.nodeId) continue;
          const node = nodeById(card.dataset.nodeId);
          if (node) renderWires();
        }
      });
    }
    nodeResizeObserver.disconnect();
    $$('.node-card', elements.nodes).forEach(card => nodeResizeObserver.observe(card));
  }

  elements.nodes.addEventListener('dblclick', event => {
    const card = event.target.closest('.node-card');
    if (!card || event.target.closest('.node-port')) return;
    event.preventDefault();
    zoomToNode(card.dataset.nodeId);
  });

  function bezier(from, to) {
    const direction = to.x >= from.x ? 1 : -1;
    const bend = Math.max(55, Math.abs(to.x - from.x) * 0.45);
    return `M ${from.x} ${from.y} C ${from.x + bend * direction} ${from.y}, ${to.x - bend * direction} ${to.y}, ${to.x} ${to.y}`;
  }

  function removeConnection(from, to) {
    checkpoint();
    state.connections = state.connections.filter(edge => edge.from !== from || edge.to !== to);
    saveProject();
    render();
    showToast('Связь удалена');
  }

  function openContextMenu(x, y, items, title = '') {
    elements.contextMenu.replaceChildren();
    if (title) {
      const heading = document.createElement('div');
      heading.className = 'context-menu-title';
      heading.textContent = title;
      elements.contextMenu.append(heading);
    }
    for (const item of items) {
      if (item.separator) {
        const separator = document.createElement('div');
        separator.className = 'context-menu-separator';
        elements.contextMenu.append(separator);
        continue;
      }
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `context-menu-item${item.danger ? ' danger' : ''}`;
      button.setAttribute('role', 'menuitem');
      button.textContent = item.label;
      button.addEventListener('click', () => {
        elements.contextMenu.hidden = true;
        item.action();
      });
      elements.contextMenu.append(button);
    }
    elements.contextMenu.hidden = false;
    const bounds = elements.contextMenu.getBoundingClientRect();
    elements.contextMenu.style.left = `${Math.max(8, Math.min(x, innerWidth - bounds.width - 8))}px`;
    elements.contextMenu.style.top = `${Math.max(8, Math.min(y, innerHeight - bounds.height - 8))}px`;
  }

  function focusInspector() {
    const panel = $('.inspector-panel');
    if (window.innerWidth <= 780) panel.classList.add('mobile-open');
    panel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    $('.inspector-content input, .inspector-content select, .inspector-content textarea')?.focus({ preventScroll: true });
  }

  function duplicateNode(id) {
    const source = nodeById(id);
    if (!source) return;
    checkpoint();
    const duplicate = {
      ...JSON.parse(JSON.stringify(source)),
      id: `${source.type}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
      x: source.x + 70,
      y: source.y + 70,
      title: `${source.title || info(source.type).title} — копия`
    };
    state.nodes.push(duplicate);
    setSelection([duplicate.id]);
    saveProject();
    render();
    showToast('Блок скопирован');
  }

  function zoomToNode(id) {
    const node = nodeById(id);
    const card = $(`[data-node-id="${CSS.escape(id)}"]`, elements.nodes);
    if (!node || !card) return;
    setSelection([node.id]);
    const targetScale = Math.max(scale, 1.15);
    render();
    const selectedCard = $(`[data-node-id="${CSS.escape(id)}"]`, elements.nodes);
    const point = nodePixelPosition(node);
    animateViewport(
      targetScale,
      (point.x + selectedCard.offsetWidth / 2) * targetScale - elements.wrap.clientWidth / 2,
      (point.y + selectedCard.offsetHeight / 2) * targetScale - elements.wrap.clientHeight / 2
    );
  }

  function addNode(type, position) {
    const definition = info(type);
    checkpoint();
    const sameType = state.nodes.filter(node => node.type === type).length + 1;
    const node = {
      id: `${type}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
      type,
      x: position?.x ?? (elements.wrap.scrollLeft + elements.wrap.clientWidth / 2) / scale - world.originX,
      y: position?.y ?? (elements.wrap.scrollTop + elements.wrap.clientHeight / 2) / scale - world.originY,
      title: sameType > 1 ? `${definition.title} ${sameType}` : definition.title,
      values: Object.fromEntries(definition.fields.map(field => [field.key, field.default ?? field.options?.[0] ?? '']))
    };
    const screenType = screenBlockTypes[type];
    if (screenType) {
      const screen = gameScreenFromDatabase(screenType);
      if (screen) {
        screen.title = node.values.screenTitle || screen.title;
        node.values.screenId = screen.id;
        state.gameScreens ??= [];
        state.gameScreens.push(screen);
      }
    }
    state.nodes.push(node);
    setSelection([node.id]);
    saveProject();
    render();
    if (screenType) showToast(`Создана вкладка «${node.values.screenTitle}» с данными из базы игры`);
    if (position?.centered) {
      const card = $(`[data-node-id="${CSS.escape(node.id)}"]`, elements.nodes);
      if (card) {
        const x = node.x - card.offsetWidth / 2;
        const y = node.y - card.offsetHeight / 2;
        node.x = snapToGrid ? Math.round((world.originX + x) / gridSize) * gridSize - world.originX : x;
        node.y = snapToGrid ? Math.round((world.originY + y) / gridSize) * gridSize - world.originY : y;
        ensureWorldBounds();
        saveProject();
        render();
      }
    }
    if (window.innerWidth <= 780) {
      setView('editor');
      $('.inspector-panel').classList.add('mobile-open');
    }
  }

  function openTemplates() {
    showDialog('<h2>Цепочки блоков</h2><p>Готовые сценарии из соединённых блоков. Игровые экраны и вкладки — отдельные сущности в разделе «Экраны».</p>');
    const list = document.createElement('div');
    list.className = 'template-list';
    for (const template of chainTemplates) {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'template-card';
      const title = document.createElement('strong');
      title.textContent = template.title;
      const description = document.createElement('span');
      description.textContent = template.description;
      const footer = document.createElement('small');
      footer.textContent = `${template.nodes.length} блока · линейная цепочка`;
      card.append(title, description, footer);
      card.addEventListener('click', () => addTemplate(template));
      list.append(card);
    }
    elements.dialogContent.append(list);
  }

  function addTemplate(template) {
    checkpoint();
    const centerX = (elements.wrap.scrollLeft + elements.wrap.clientWidth / 2) / scale - world.originX;
    const centerY = (elements.wrap.scrollTop + elements.wrap.clientHeight / 2) / scale - world.originY;
    const gap = 270;
    const startX = centerX - ((template.nodes.length - 1) * gap + 218) / 2;
    const startY = centerY - 70;
    const added = template.nodes.map(([type, values], index) => {
      const block = info(type);
      const id = `${type}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
      return {
        id,
        type,
        x: startX + index * gap,
        y: startY,
        title: block.title,
        values: {
          ...Object.fromEntries(block.fields.map(field => [field.key, field.default ?? field.options?.[0] ?? ''])),
          ...values
        }
      };
    });
    state.nodes.push(...added);
    state.connections.push(...added.slice(1).map((node, index) => ({ from: added[index].id, to: node.id })));
    setSelection([added[0].id]);
    saveProject();
    render();
    elements.dialog.close();
    const centerNode = added[Math.floor(added.length / 2)];
    const point = nodePixelPosition(centerNode);
    elements.wrap.scrollTo({
      left: Math.max(0, (point.x + 109) * scale - elements.wrap.clientWidth / 2),
      top: Math.max(0, (point.y + 70) * scale - elements.wrap.clientHeight / 2),
      behavior: reducedMotion ? 'auto' : 'smooth'
    });
    if (window.innerWidth <= 780) $('.inspector-panel').classList.add('mobile-open');
    showToast(`Добавлена цепочка «${template.title}»`);
  }

  function openGameScreens() {
    state.gameScreens ??= [];
    showDialog('<h2>Игровые экраны</h2><p>Самостоятельные вкладки и страницы приложения. Добавление экрана не создаёт узлы и связи на холсте; экземпляры сохраняются внутри проекта .piv.</p>');
    elements.dialog.classList.add('game-screens-dialog');
    const manager = document.createElement('div');
    manager.className = 'game-screen-manager';
    const library = document.createElement('section');
    library.className = 'game-screen-library';
    const libraryHeading = document.createElement('h3');
    libraryHeading.textContent = 'Добавить экран';
    library.append(libraryHeading);
    const available = document.createElement('div');
    available.className = 'game-screen-available';
    for (const definition of gameScreenTypes) {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'game-screen-choice';
      const icon = document.createElement('span');
      icon.className = 'game-screen-choice-icon';
      icon.textContent = definition.icon;
      const copy = document.createElement('span');
      const title = document.createElement('strong');
      title.textContent = definition.title;
      const description = document.createElement('small');
      description.textContent = definition.description;
      copy.append(title, description);
      const add = document.createElement('span');
      add.className = 'game-screen-add';
      add.textContent = '+';
      card.append(icon, copy, add);
      card.addEventListener('click', () => {
        addGameScreen(definition.type);
        openGameScreens();
      });
      available.append(card);
    }
    library.append(available);
    const right = document.createElement('div');
    right.className = 'game-screen-right';
    const instancesSection = document.createElement('section');
    instancesSection.className = 'game-screen-instances';
    const instancesHeading = document.createElement('h3');
    instancesHeading.textContent = `Экземпляры в проекте · ${state.gameScreens.length}`;
    instancesSection.append(instancesHeading);
    const databaseCard = document.createElement('article');
    databaseCard.className = 'game-screen-instance game-database-instance';
    const databaseIcon = document.createElement('span');
    databaseIcon.className = 'game-screen-instance-icon';
    databaseIcon.textContent = '▤';
    const databaseCopy = document.createElement('div');
    databaseCopy.className = 'game-screen-instance-copy';
    const databaseTitle = document.createElement('strong');
    databaseTitle.textContent = 'Игровая база данных';
    const databaseDescription = document.createElement('small');
    databaseDescription.textContent = 'Системное окно проекта · всегда восстанавливается · сохраняется в .piv';
    databaseCopy.append(databaseTitle, databaseDescription);
    const databaseEdit = document.createElement('button');
    databaseEdit.type = 'button';
    databaseEdit.className = 'action-button';
    databaseEdit.textContent = 'Открыть';
    databaseEdit.addEventListener('click', openGameDatabase);
    databaseCard.append(databaseIcon, databaseCopy, databaseEdit);
    instancesSection.append(databaseCard);
    if (!state.gameScreens.length) {
      const empty = document.createElement('p');
      empty.className = 'game-screen-empty';
      empty.textContent = 'Пока нет экранов. Добавь инвентарь, клан или другой раздел приложения.';
      instancesSection.append(empty);
    } else {
      for (const screen of state.gameScreens) {
        const row = document.createElement('article');
        row.className = 'game-screen-instance';
        const icon = document.createElement('span');
        icon.className = 'game-screen-instance-icon';
        icon.textContent = screen.icon;
        const copy = document.createElement('div');
        copy.className = 'game-screen-instance-copy';
        const title = document.createElement('strong');
        title.textContent = screen.title;
        const metadata = document.createElement('small');
        metadata.textContent = `${screen.type} · ${screen.tabs.length} вкладки · ${screen.entries.length} карточки`;
        copy.append(title, metadata);
        const edit = document.createElement('button');
        edit.type = 'button';
        edit.className = 'action-button';
        edit.textContent = 'Настроить';
        edit.addEventListener('click', () => editGameScreen(screen.id));
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'action-button';
        remove.textContent = 'Удалить';
        remove.addEventListener('click', () => {
          checkpoint();
          state.gameScreens = state.gameScreens.filter(item => item.id !== screen.id);
          saveProject();
          openGameScreens();
          showToast(`Экран «${screen.title}» удалён из проекта`);
        });
        row.append(icon, copy, edit, remove);
        instancesSection.append(row);
      }
    }
    right.append(instancesSection);
    manager.append(library, right);
    elements.dialogContent.append(manager);
    if (state.gameScreens.length) {
      const previewHeading = document.createElement('h3');
      previewHeading.className = 'game-screen-preview-heading';
      previewHeading.textContent = 'Предпросмотр вкладок приложения';
      const preview = document.createElement('div');
      preview.className = 'game-screen-preview-host';
      renderGameScreenPreview(preview, state.gameScreens);
      right.append(previewHeading, preview);
    }
  }

  function openGameDatabase() {
    keepDatabaseAvailable(state);
    const database = state.gameDatabase;
    showDialog('<h2>Данные тестового бота</h2><p>Синтетический профиль, инвентарь, рецепты, достижения и клан для проверки механик. Эти данные сохраняются в проекте и .piv, но не читают и не меняют аккаунты оригинального Пивовара.</p>');
    elements.dialog.classList.add('game-database-dialog');
    const form = document.createElement('div');
    form.className = 'game-database-form';
    const fields = {};
    const addField = (section, labelText, key, value, multiline = false, rows = 4) => {
      const label = document.createElement('label');
      label.className = 'field-row';
      label.textContent = labelText;
      const control = document.createElement(multiline ? 'textarea' : 'input');
      if (!multiline) control.type = 'number';
      if (multiline) control.rows = rows;
      control.value = String(value);
      control.setAttribute('aria-label', labelText);
      fields[key] = control;
      label.append(control);
      section.append(label);
    };
    const addTextField = (section, labelText, key, value) => {
      const label = document.createElement('label');
      label.className = 'field-row';
      label.textContent = labelText;
      const control = document.createElement('input');
      control.type = 'text';
      control.value = String(value);
      control.setAttribute('aria-label', labelText);
      fields[key] = control;
      label.append(control);
      section.append(label);
    };
    const addSection = (title, className = '') => {
      const section = document.createElement('section');
      section.className = `game-database-section ${className}`.trim();
      const heading = document.createElement('h3');
      heading.textContent = title;
      section.append(heading);
      form.append(section);
      return section;
    };
    const playerSection = addSection('Профиль тестового игрока');
    addTextField(playerSection, 'Имя игрока в Telegram', 'player.name', database.player.name);
    addTextField(playerSection, 'Telegram ID', 'player.telegramId', database.player.telegramId);
    addTextField(playerSection, 'Username без @', 'player.username', database.player.username);
    addField(playerSection, 'Уровень пивовара', 'player.level', database.player.level);
    addField(playerSection, 'Запас пива, литров', 'player.beer', database.player.beer);
    addField(playerSection, 'Опыт', 'player.experience', database.player.experience);
    addField(playerSection, 'Сварено напитков', 'player.brews', database.player.brews);
    const inventorySection = addSection('Предметы инвентаря', 'database-wide');
    addField(inventorySection, 'Вместимость склада', 'inventory.capacity', database.inventory.capacity);
    addField(inventorySection, 'ID | название | категория | количество · одна запись на строку', 'inventory.items',
      database.inventory.items.map(item => [item.id, item.name, item.category, item.quantity].join(' | ')).join('\n'), true, 6);
    const achievementsSection = addSection('Достижения · ID | название | описание | открыто');
    addField(achievementsSection, 'Одна запись на строку · открыто: да / нет', 'achievements',
      database.achievements.map(item => [item.id, item.name, item.description, item.unlocked ? 'да' : 'нет'].join(' | ')).join('\n'), true, 5);
    const recipesSection = addSection('Рецепты · ID | название | ингредиенты | открыто');
    addField(recipesSection, 'Ингредиенты указывай как ID:количество через запятую', 'recipes',
      database.recipes.map(item => [item.id, item.name, item.ingredients, item.unlocked ? 'да' : 'нет'].join(' | ')).join('\n'), true, 5);
    const clanSection = addSection('Клан игрока');
    addTextField(clanSection, 'ID клана', 'clan.id', database.clan.id);
    addTextField(clanSection, 'Название клана', 'clan.name', database.clan.name);
    addTextField(clanSection, 'Роль игрока', 'clan.role', database.clan.role);
    addField(clanSection, 'Уровень клана', 'clan.level', database.clan.level);
    addField(clanSection, 'Участников', 'clan.members', database.clan.members);
    addField(clanSection, 'Вместимость клана', 'clan.capacity', database.clan.capacity);
    addField(clanSection, 'Запас пива клана, литров', 'clan.beer', database.clan.beer);
    addField(clanSection, 'Задания · ID | название | прогресс | цель', 'clan.quests',
      database.clan.quests.map(item => [item.id, item.name, item.progress, item.target].join(' | ')).join('\n'), true, 4);
    const variablesSection = addSection('Пользовательские переменные');
    const variableRows = database.variables.map(item => ({ ...item }));
    const variableList = document.createElement('div');
    variableList.className = 'database-variable-list';
    const renderVariableRows = () => {
      variableList.replaceChildren();
      if (!variableRows.length) {
        const empty = document.createElement('p');
        empty.className = 'field-help';
        empty.textContent = 'Пока переменных нет. Создай переменную — например, brew_count = 3.';
        variableList.append(empty);
      }
      variableRows.forEach((variable, index) => {
        const row = document.createElement('div');
        row.className = 'database-variable-row';
        const key = document.createElement('input');
        key.type = 'text';
        key.maxLength = 80;
        key.value = variable.key;
        key.placeholder = 'имя_переменной';
        key.setAttribute('aria-label', `Имя переменной ${index + 1}`);
        key.addEventListener('input', () => { variable.key = key.value.trim(); });
        const type = document.createElement('select');
        for (const typeName of ['Текст', 'Число']) {
          const option = document.createElement('option');
          option.value = typeName;
          option.textContent = typeName;
          type.append(option);
        }
        type.value = variable.type;
        type.setAttribute('aria-label', `Тип переменной ${index + 1}`);
        const value = document.createElement('input');
        value.type = variable.type === 'Число' ? 'number' : 'text';
        value.step = 'any';
        value.value = variable.value;
        value.placeholder = 'Значение';
        value.setAttribute('aria-label', `Значение переменной ${index + 1}`);
        value.addEventListener('input', () => { variable.value = value.value; });
        type.addEventListener('change', () => {
          variable.type = type.value;
          value.type = type.value === 'Число' ? 'number' : 'text';
          if (type.value === 'Число' && value.value && !Number.isFinite(Number(value.value))) value.value = '';
          variable.value = value.value;
        });
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'action-button';
        remove.textContent = 'Удалить';
        remove.setAttribute('aria-label', `Удалить переменную ${variable.key || index + 1}`);
        remove.addEventListener('click', () => {
          variableRows.splice(index, 1);
          renderVariableRows();
        });
        row.append(key, type, value, remove);
        variableList.append(row);
      });
    };
    renderVariableRows();
    const addVariable = document.createElement('button');
    addVariable.type = 'button';
    addVariable.className = 'action-button';
    addVariable.textContent = '+ Добавить переменную';
    addVariable.addEventListener('click', () => {
      variableRows.push({ key: '', value: '', type: 'Текст' });
      renderVariableRows();
      variableList.lastElementChild?.querySelector('input')?.focus();
    });
    const variableHelp = document.createElement('p');
    variableHelp.className = 'field-help';
    variableHelp.textContent = 'Имена без пробелов: {brew_count}. Системные переменные: {player_name}, {player_id}, {username}, {level}, {beer}, {experience}, {brews}, {clan_name}, {clan_id}, {clan_role}; также доступны алиасы {user_name} и {user_id}.';
    variablesSection.append(variableList, addVariable, variableHelp);
    elements.dialogContent.append(form);
    const actions = document.createElement('div');
    actions.className = 'dialog-actions';
    const save = document.createElement('button');
    save.type = 'button';
    save.className = 'action-button primary';
    save.textContent = 'Сохранить базу';
    save.addEventListener('click', () => {
      const numberValue = key => Number(fields[key].value);
      if (['player.level', 'player.beer', 'player.experience', 'player.brews', 'inventory.capacity',
        'clan.level', 'clan.members', 'clan.capacity', 'clan.beer'].some(key =>
        !Number.isFinite(numberValue(key)) || numberValue(key) < 0)) {
        showToast('Числовые поля должны содержать значения не меньше нуля');
        return;
      }
      const validVariableKey = /^[A-Za-zА-Яа-яЁё_][A-Za-zА-Яа-яЁё0-9_-]{0,79}$/;
      const seenVariableKeys = new Set();
      for (const variable of variableRows) {
        if (!validVariableKey.test(variable.key)) {
          showToast(`Недопустимое имя переменной: «${variable.key || '(пусто)'}»`);
          return;
        }
        if (builtinVariableKeys.has(variable.key.toLocaleLowerCase('en'))) {
          showToast(`Имя «${variable.key}» зарезервировано системной переменной`);
          return;
        }
        if (seenVariableKeys.has(variable.key)) {
          showToast(`Переменная «${variable.key}» добавлена дважды`);
          return;
        }
        if (variable.type === 'Число' &&
            (String(variable.value).trim() === '' || !Number.isFinite(Number(variable.value)))) {
          showToast(`Значение «${variable.key}» должно быть числом`);
          return;
        }
        seenVariableKeys.add(variable.key);
      }
      const parseRows = (key, mapper) => fields[key].value.split(/\r?\n/)
        .map(line => line.split('|').map(value => value.trim()))
        .filter(parts => parts.some(Boolean))
        .map(mapper);
      const unlocked = value => ['да', 'true', '1', 'открыто'].includes(String(value || '').toLocaleLowerCase('ru'));
      const parseCount = value => Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
      checkpoint();
      state.gameDatabase = normalizeGameDatabase({
        player: {
          name: fields['player.name'].value.trim(),
          telegramId: fields['player.telegramId'].value.trim(),
          username: fields['player.username'].value.trim().replace(/^@/, ''),
          level: numberValue('player.level'),
          beer: numberValue('player.beer'),
          experience: numberValue('player.experience'),
          brews: numberValue('player.brews')
        },
        inventory: {
          capacity: numberValue('inventory.capacity'),
          items: parseRows('inventory.items', ([id, name, category, quantity]) => ({
            id, name, category, quantity: parseCount(quantity)
          }))
        },
        achievements: parseRows('achievements', ([id, name, description, status]) => ({
          id, name, description, unlocked: unlocked(status)
        })),
        recipes: parseRows('recipes', ([id, name, ingredients, status]) => ({
          id, name, ingredients, unlocked: unlocked(status)
        })),
        clan: {
          id: fields['clan.id'].value.trim(),
          name: fields['clan.name'].value.trim(),
          role: fields['clan.role'].value.trim(),
          level: numberValue('clan.level'),
          members: numberValue('clan.members'),
          capacity: numberValue('clan.capacity'),
          beer: numberValue('clan.beer'),
          quests: parseRows('clan.quests', ([id, name, progress, target]) => ({
            id, name, progress: parseCount(progress), target: parseCount(target)
          }))
        },
        variables: variableRows.map(variable => ({
          key: variable.key,
          value: variable.type === 'Число' ? String(Number(variable.value)) : variable.value,
          type: variable.type
        }))
      });
      for (const screen of state.gameScreens) {
        if (!screen.databaseManaged) continue;
        const updated = gameScreenFromDatabase(screen.type);
        if (updated) Object.assign(screen, updated, { id: screen.id, title: screen.title, icon: screen.icon });
      }
      saveProject();
      showToast('Данные тестового бота и связанные вкладки сохранены');
      openGameDatabase();
    });
    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'action-button';
    reset.textContent = 'Восстановить базу по умолчанию';
    reset.addEventListener('click', () => {
      checkpoint();
      state.gameDatabase = defaultGameDatabase();
      for (const screen of state.gameScreens) {
        if (!screen.databaseManaged) continue;
        const updated = gameScreenFromDatabase(screen.type);
        if (updated) Object.assign(screen, updated, { id: screen.id, title: screen.title, icon: screen.icon });
      }
      saveProject();
      openGameDatabase();
      showToast('База пивовара восстановлена');
    });
    actions.append(save, reset);
    elements.dialogContent.append(actions);
  }

  function addGameScreen(type) {
    const screen = gameScreenFromDatabase(type);
    if (!screen) return;
    checkpoint();
    state.gameScreens ??= [];
    state.gameScreens.push(screen);
    saveProject();
    showToast(`Экземпляр экрана «${screen.title}» добавлен`);
  }

  function editGameScreen(id) {
    const screen = state.gameScreens.find(item => item.id === id);
    if (!screen) return;
    showDialog(`<h2>Настройка экрана</h2><p>Это самостоятельная вкладка приложения. Её состав и оформление не связаны с цепочкой блоков.</p>`);
    const form = document.createElement('div');
    form.className = 'game-screen-edit-form';
    const fields = [
      ['Название вкладки', 'title', screen.title],
      ['Подзаголовок', 'subtitle', screen.subtitle],
      ['Вкладки внутри экрана · по одной на строку', 'tabs', screen.tabs.join('\n')],
      ['Карточки и строки данных · по одной на строку', 'entries', screen.entries.join('\n')],
      ['Кнопки действий · по одной на строку', 'actions', screen.actions.join('\n')]
    ];
    const inputs = {};
    for (const [labelText, key, value] of fields) {
      const label = document.createElement('label');
      label.className = 'field-row';
      label.textContent = labelText;
      const input = document.createElement(key === 'title' || key === 'subtitle' ? 'input' : 'textarea');
      input.value = value;
      input.maxLength = key === 'title' || key === 'subtitle' ? 100 : 1200;
      input.rows = key === 'title' || key === 'subtitle' ? 1 : 4;
      input.setAttribute('aria-label', labelText);
      inputs[key] = input;
      label.append(input);
      form.append(label);
    }
    const actions = document.createElement('div');
    actions.className = 'dialog-actions';
    const save = document.createElement('button');
    save.type = 'button';
    save.className = 'action-button primary';
    save.textContent = 'Сохранить экран';
    save.addEventListener('click', () => {
      const title = inputs.title.value.trim();
      if (!title) {
        showToast('Название вкладки не может быть пустым');
        inputs.title.focus();
        return;
      }
      checkpoint();
      screen.title = title.slice(0, 100);
      screen.subtitle = inputs.subtitle.value.trim().slice(0, 100);
      screen.tabs = inputs.tabs.value.split('\n').map(value => value.trim()).filter(Boolean).slice(0, 12);
      screen.entries = inputs.entries.value.split('\n').map(value => value.trim()).filter(Boolean).slice(0, 30);
      screen.actions = inputs.actions.value.split('\n').map(value => value.trim()).filter(Boolean).slice(0, 12);
      saveProject();
      openGameScreens();
      showToast('Экран приложения сохранён');
    });
    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'action-button';
    cancel.textContent = 'Назад';
    cancel.addEventListener('click', openGameScreens);
    actions.append(save, cancel);
    form.append(actions);
    elements.dialogContent.append(form);
  }

  function renderGameScreenPreview(container, screens) {
    container.replaceChildren();
    const device = document.createElement('section');
    device.className = 'game-app-preview';
    const status = document.createElement('div');
    status.className = 'game-app-status';
    status.innerHTML = '<span>9:41</span><span>●●● ◉</span>';
    const appHeader = document.createElement('header');
    appHeader.className = 'game-app-header';
    const brand = document.createElement('span');
    brand.className = 'game-app-brand';
    brand.textContent = 'П';
    const brandCopy = document.createElement('span');
    brandCopy.innerHTML = '<strong>пивовар</strong><small>ИГРОВОЕ ПРИЛОЖЕНИЕ · ДЕМО</small>';
    appHeader.append(brand, brandCopy);
    const tabBar = document.createElement('nav');
    tabBar.className = 'game-app-tabs';
    tabBar.setAttribute('aria-label', 'Вкладки игрового приложения');
    const content = document.createElement('div');
    content.className = 'game-app-content';
    let selectedId = screens[0]?.id;
    let selectedTab = '';
    const actionResult = document.createElement('div');
    actionResult.className = 'game-app-result';
    const render = () => {
      tabBar.replaceChildren();
      content.replaceChildren();
      const screen = screens.find(item => item.id === selectedId) || screens[0];
      if (!screen) return;
      selectedId = screen.id;
      for (const item of screens) {
        const tab = document.createElement('button');
        tab.type = 'button';
        tab.className = `game-app-tab${item.id === screen.id ? ' active' : ''}`;
        tab.textContent = `${item.icon} ${item.title}`;
        tab.setAttribute('aria-pressed', String(item.id === screen.id));
        tab.addEventListener('click', () => {
          selectedId = item.id;
          selectedTab = '';
          actionResult.textContent = '';
          render();
        });
        tabBar.append(tab);
      }
      const title = document.createElement('h3');
      title.textContent = screen.title;
      const subtitle = document.createElement('p');
      subtitle.className = 'game-app-subtitle';
      subtitle.textContent = screen.subtitle;
      content.append(title, subtitle);
      if (screen.tabs.length) {
        const innerTabs = document.createElement('div');
        innerTabs.className = 'game-app-inner-tabs';
        for (const tabName of screen.tabs) {
          const tab = document.createElement('button');
          tab.type = 'button';
          tab.className = `game-app-inner-tab${(selectedTab || screen.tabs[0]) === tabName ? ' active' : ''}`;
          tab.textContent = tabName;
          tab.addEventListener('click', () => {
            selectedTab = tabName;
            render();
          });
          innerTabs.append(tab);
        }
        content.append(innerTabs);
      }
      const entries = document.createElement('div');
      entries.className = 'game-app-entries';
      for (const entry of screen.entries) {
        const row = document.createElement('div');
        row.className = 'game-app-entry';
        row.textContent = entry;
        entries.append(row);
      }
      content.append(entries);
      const buttons = document.createElement('div');
      buttons.className = 'game-app-actions';
      for (const action of screen.actions) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = action;
        button.addEventListener('click', () => {
          actionResult.textContent = `Демо: «${action}» на экране «${screen.title}». Боевые данные не изменяются.`;
        });
        buttons.append(button);
      }
      content.append(buttons, actionResult);
    };
    device.append(status, appHeader, tabBar, content);
    container.append(device);
    render();
  }

  function deleteNode(id) {
    checkpoint();
    state.nodes = state.nodes.filter(node => node.id !== id);
    state.connections = state.connections.filter(edge => edge.from !== id && edge.to !== id);
    const remainingSelection = [...selectedIds].filter(selected => selected !== id && state.nodes.some(node => node.id === selected));
    setSelection(remainingSelection.length ? remainingSelection : state.nodes.slice(-1).map(node => node.id));
    saveProject();
    render();
    showToast('Блок удалён');
  }

  function deleteSelectedNodes() {
    const removed = new Set(selectedIds);
    if (!removed.size) return;
    checkpoint();
    state.nodes = state.nodes.filter(node => !removed.has(node.id));
    state.connections = state.connections.filter(edge => !removed.has(edge.from) && !removed.has(edge.to));
    setSelection(state.nodes.slice(-1).map(node => node.id));
    saveProject();
    render();
    showToast('Выбранные блоки удалены');
  }

  function alignNodesToGrid() {
    const targets = selectedIds.size > 1
      ? state.nodes.filter(node => selectedIds.has(node.id))
      : state.nodes;
    if (!targets.length) return;
    checkpoint();
    for (const node of targets) {
      node.x = Math.round((world.originX + node.x) / gridSize) * gridSize - world.originX;
      node.y = Math.round((world.originY + node.y) / gridSize) * gridSize - world.originY;
    }
    saveProject();
    render();
    showToast('Блоки выровнены по сетке');
  }

  function selectInRectangle(start, end, additive = false) {
    const rect = {
      left: Math.min(start.x, end.x),
      top: Math.min(start.y, end.y),
      right: Math.max(start.x, end.x),
      bottom: Math.max(start.y, end.y)
    };
    const ids = state.nodes.filter(node => {
      const card = $(`[data-node-id="${CSS.escape(node.id)}"]`, elements.nodes);
      const pos = nodePixelPosition(node);
      const width = card?.offsetWidth ?? node.width ?? 218;
      const height = card?.offsetHeight ?? (node.collapsed ? 40 : node.height ?? 140);
      return pos.x < rect.right && pos.x + width > rect.left &&
        pos.y < rect.bottom && pos.y + height > rect.top;
    }).map(node => node.id);
    setSelection(additive ? [...selectedIds, ...ids] : ids);
    render();
  }

  function beginSelection(event) {
    if (event.button !== 0 || event.pointerType !== 'mouse' || spaceDown) return;
    const onNode = Boolean(event.target.closest('.node-card'));
    const onNodePort = Boolean(event.target.closest('.node-port'));
    const additive = event.ctrlKey || event.metaKey;
    const onControl = Boolean(event.target.closest('button, input, textarea, select, .canvas-tools, .wire-hit, .wire-path, .wire-flow'));
    if (onNodePort || (onControl && !(additive && onNode)) || (onNode && !additive)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const start = canvasWorldPoint(event.clientX, event.clientY);
    const selectionBox = document.createElement('div');
    selectionBox.className = 'selection-box';
    elements.canvas.append(selectionBox);
    selecting = {
      pointerId: event.pointerId, start, current: start, element: selectionBox,
      moved: false, additive, clickNodeId: onNode ? event.target.closest('.node-card').dataset.nodeId : null
    };
    elements.wrap.setPointerCapture(event.pointerId);
  }

  function handleNodePointerDown(event) {
    if (event.button !== 0 || spaceDown) return;
    const card = event.currentTarget;
    const node = nodeById(card.dataset.nodeId);
    if (!node) return;
    if (event.target.closest('.node-port')) return;
    const rect = card.getBoundingClientRect();
    const inResizeCorner = event.target === card && event.clientX > rect.right - 20 && event.clientY > rect.bottom - 20;
    if (inResizeCorner) {
      checkpoint();
      resizingNodeId = node.id;
      event.stopPropagation();
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const movingIds = selectedIds.has(node.id) && selectedIds.size > 1 ? [...selectedIds] : [node.id];
    if (!selectedIds.has(node.id) || selectedIds.size === 1) setSelection([node.id]);
    let moved = false;
    let historyCaptured = false;
    const start = {
      x: event.clientX,
      y: event.clientY,
      nodes: movingIds.map(id => {
        const moving = nodeById(id);
        return moving && { id, x: moving.x, y: moving.y };
      }).filter(Boolean)
    };
    card.setPointerCapture(event.pointerId);
    const move = moveEvent => {
      const distance = Math.abs(moveEvent.clientX - start.x) + Math.abs(moveEvent.clientY - start.y);
      if (distance <= 3 && !moved) return;
      if (distance > 3) {
        moved = true;
        if (!historyCaptured) {
          checkpoint();
          historyCaptured = true;
        }
      }
      const dx = (moveEvent.clientX - start.x) / scale;
      const dy = (moveEvent.clientY - start.y) / scale;
      for (const origin of start.nodes) {
        const moving = nodeById(origin.id);
        if (!moving) continue;
        moving.x = snapToGrid
          ? Math.round((world.originX + origin.x + dx) / gridSize) * gridSize - world.originX
          : origin.x + dx;
        moving.y = snapToGrid
          ? Math.round((world.originY + origin.y + dy) / gridSize) * gridSize - world.originY
          : origin.y + dy;
      }
      ensureWorldBounds();
      renderWires();
    };
    const up = () => {
      card.removeEventListener('pointermove', move);
      card.removeEventListener('pointerup', up);
      if (moved) {
        suppressClick = true;
        setTimeout(() => { suppressClick = false; }, 100);
      }
      if (moved) saveProject();
      renderWires();
    };
    card.addEventListener('pointermove', move);
    card.addEventListener('pointerup', up, { once: true });
  }

  function handlePortPointerDown(event) {
    if (event.currentTarget.dataset.port !== 'output' || event.currentTarget.disabled) return;
    event.preventDefault();
    const nodeId = event.currentTarget.closest('.node-card').dataset.nodeId;
    activeWire = {
      from: nodeId,
      outputKey: event.currentTarget.dataset.portKey || 'next',
      pointerId: event.pointerId,
      pointer: canvasWorldPoint(event.clientX, event.clientY)
    };
    document.addEventListener('pointermove', moveActiveWire);
  }

  function handlePortPointerUp(event) {
    if (!activeWire || event.pointerId !== activeWire.pointerId) return;
    const target = document.elementFromPoint(event.clientX, event.clientY);
    const input = target?.closest?.('.node-port.input');
    const to = input?.closest('.node-card')?.dataset.nodeId;
    if (to) {
      const error = connectionError(activeWire.from, to, activeWire.outputKey);
      if (error) showToast(error);
      else if (!state.connections.some(edge => edge.from === activeWire.from && edge.to === to)) {
        checkpoint();
        state.connections.push({ from: activeWire.from, to, ...(activeWire.outputKey !== 'next' ? { outputKey: activeWire.outputKey } : {}) });
        saveProject();
        showToast('Связь добавлена');
      }
    }
    activeWire = null;
    document.removeEventListener('pointermove', moveActiveWire);
    render();
  }

  function canvasPoint(clientX, clientY) {
    const rect = elements.canvas.getBoundingClientRect();
    return { x: (clientX - rect.left) / scale - world.originX, y: (clientY - rect.top) / scale - world.originY };
  }
  function canvasWorldPoint(clientX, clientY) {
    const point = canvasPoint(clientX, clientY);
    return { x: point.x + world.originX, y: point.y + world.originY };
  }
  function moveActiveWire(event) {
    if (activeWire && event.pointerId === activeWire.pointerId) {
      activeWire.pointer = canvasWorldPoint(event.clientX, event.clientY);
      renderWires();
    }
  }

  function setView(view) {
    document.body.dataset.view = view;
    $$('.dock-item').forEach(item => item.classList.toggle('active', item.dataset.view === view));
    $('.inspector-panel').classList.remove('mobile-open');
    if (view === 'test') { openTest(); return; }
    if (view === 'files') { openFiles(); return; }
    if (view === 'settings') { openSettings(); return; }
    if (window.innerWidth <= 780) $('.library-panel').classList.remove('mobile-open');
  }

  function evaluateCondition(node, context) {
    const values = node.values || {};
    if (node.type === 'if_else') {
      const left = context.variables[String(values.variable || '')];
      const right = String(values.value ?? '');
      const operator = String(values.operator || 'Равно');
      let matches = false;
      if (values.valueType === 'Число') {
        const leftNumber = Number(left);
        const rightNumber = Number(right);
        if (operator === 'Пустое') {
          matches = left === undefined || left === null || left === '';
        } else if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
          matches = {
            'Равно': leftNumber === rightNumber,
            'Не равно': leftNumber !== rightNumber,
            'Больше': leftNumber > rightNumber,
            'Меньше': leftNumber < rightNumber,
            'Содержит': false,
            'Не содержит': false,
            'Пустое': false
          }[operator] ?? false;
        } else {
          matches = operator === 'Не равно';
        }
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
      const count = context.inventory[String(values.itemId || '')] || 0;
      const required = Number(values.required || 1);
      return { key: count >= required ? 'has' : 'missing', detail: `${values.itemId || 'предмет'}: ${count} / ${required}` };
    }
    if (node.type === 'inventory_find') {
      const query = String(values.query || '').trim().toLocaleLowerCase('ru');
      const aliases = {
        malt: 'солод malt',
        hops: 'хмель hops',
        yeast: 'дрожжи yeast',
        hop_bundle: 'набор хмеля hop bundle',
        yeast_pack: 'набор дрожжей yeast pack',
        test_reward: 'тестовая награда предмет'
      };
      const match = Object.entries(context.inventory).find(([item, count]) =>
        query && (aliases[item] || item).toLocaleLowerCase('ru').includes(query) &&
          count >= Number(values.required || 1));
      return { key: match ? 'found' : 'not_found', detail: match ? `${match[0]} × ${match[1]}` : `«${query || 'пустой запрос'}» не найден` };
    }
    if (node.type === 'inventory_count') {
      const count = context.inventory[String(values.itemId || '')] || 0;
      const target = Number(values.amount || 0);
      const matches = {
        'Не меньше': count >= target,
        'Больше': count > target,
        'Равно': count === target,
        'Меньше': count < target
      }[values.operator] ?? false;
      return { key: matches ? 'match' : 'no_match', detail: `${values.itemId || 'предмет'}: ${count} ${values.operator || '≥'} ${target}` };
    }
    if (node.type === 'inventory_is_empty') {
      const resources = new Set(['malt', 'hops', 'yeast']);
      const beverages = new Set(['amber_ale', 'ipa', 'stout', 'wheat_beer', 'lager']);
      const labels = { malt: 'солод', hops: 'хмель', yeast: 'дрожжи' };
      const items = Object.entries(context.inventory).filter(([item, count]) => {
        if (Number(count) <= 0) return false;
        if (values.scope !== 'Категорию') return true;
        if (values.category === 'Ресурсы') return resources.has(item);
        if (values.category === 'Напитки') return beverages.has(item);
        if (values.category === 'Предметы') return !resources.has(item) && !beverages.has(item);
        return (labels[item] || item).toLocaleLowerCase('ru').includes(String(values.category || '').toLocaleLowerCase('ru'));
      });
      const empty = items.length === 0;
      return { key: empty ? 'empty' : 'not_empty', detail: empty ? 'инвентарь пуст' : `предметов: ${items.length}` };
    }
    if (node.type === 'wallet_has') {
      const balance = values.currency === 'Опыт' ? context.experience : context.beer;
      const required = Number(values.amount || 0);
      return { key: balance >= required ? 'enough' : 'insufficient', detail: `${values.currency === 'Опыт' ? 'Опыт' : 'Литры пива'}: ${balance} / ${required}` };
    }
    if (node.type === 'recipe_known') {
      const known = context.recipes.has(String(values.recipeId || ''));
      return { key: known ? 'known' : 'unknown', detail: `${values.recipeId || 'рецепт'} ${known ? 'открыт' : 'не открыт'}` };
    }
    if (node.type === 'achievement_unlocked') {
      const unlocked = context.achievements.has(String(values.achievementId || ''));
      return { key: unlocked ? 'unlocked' : 'locked', detail: `${values.achievementId || 'достижение'} ${unlocked ? 'получено' : 'не получено'}` };
    }
    if (node.type === 'clan_member') {
      const member = Boolean(context.clan) &&
        (values.membership !== 'В указанном клане' || context.clanId === String(values.clanId || ''));
      return { key: member ? 'member' : 'not_member', detail: member ? `состоит в клане ${context.clan}` : 'не состоит в указанном клане' };
    }
    return null;
  }

  function nextConnection(node, context) {
    const outgoing = state.connections.filter(edge => edge.from === node.id);
    const outputs = info(node.type).outputs;
    if (outputs?.length) {
      const result = evaluateCondition(node, context);
      if (result) {
        context.lastCondition = result;
        return outgoing.find(edge => edge.outputKey === result.key);
      }
      return null;
    }
    return outgoing.find(edge => !edge.outputKey || edge.outputKey === 'next') || outgoing[0];
  }

  function validateMechanic() {
    const errors = [];
    const warnings = [];
    const triggers = state.nodes.filter(node => definitionFor(node.type)?.subtitle === 'СОБЫТИЕ');
    if (!triggers.length) errors.push('Добавь блок-событие: команду, callback или другой триггер.');
    if (triggers.length > 1) warnings.push('В механике несколько событий. Локальный симулятор запускает первое.');
    const ids = new Set(state.nodes.map(node => node.id));
    for (const edge of state.connections) {
      if (!ids.has(edge.from) || !ids.has(edge.to)) errors.push('Есть связь с удалённым блоком.');
      if (edge.from === edge.to) errors.push('Блок не может соединяться сам с собой.');
      if (ids.has(edge.from) && ids.has(edge.to)) {
        const incompatibility = connectionError(edge.from, edge.to, edge.outputKey || 'next');
        if (incompatibility) errors.push(`Некорректное соединение: ${incompatibility}`);
      }
    }
    for (const node of state.nodes) {
      if (node.type === 'trigger' || node.type === 'register_command') {
        const command = String(node.values?.command ?? '').replace(/^\/+/, '');
        if (!/^[a-zA-Z0-9_]{1,32}$/.test(command)) errors.push(`Команда «${node.title}»: разрешены латинские буквы, цифры и _, максимум 32 символа.`);
      }
      if (node.type === 'inline_keyboard') {
        const rows = String(node.values?.buttons ?? '').split('\n').filter(row => row.trim());
        for (const [index, row] of rows.entries()) {
          const [label, callbackData] = row.split('|').map(value => value.trim());
          if (!label || !callbackData) errors.push(`Инлайн-кнопка ${index + 1}: укажи «текст | callback_data».`);
          else if (new TextEncoder().encode(callbackData).length > 64) errors.push(`Инлайн-кнопка ${index + 1}: callback_data превышает лимит Telegram в 64 байта.`);
        }
      }
      if (node.type === 'message' && String(node.values?.text ?? '').length > 4096) {
        errors.push(`Сообщение «${node.title}» превышает лимит Telegram в 4096 символов.`);
      }
    }
    const outgoing = new Map();
    for (const edge of state.connections) {
      const source = nodeById(edge.from);
      const key = edge.outputKey || 'next';
      const route = `${edge.from}:${key}`;
      const count = (outgoing.get(route) ?? 0) + 1;
      outgoing.set(route, count);
      if (count > 1) errors.push(`У блока «${source?.title || edge.from}» повторно подключён выход «${key}».`);
      if (info(source?.type).outputs?.length && !info(source.type).outputs.some(output => output.key === key)) {
        errors.push(`Соединение использует неизвестную ветку «${key}» блока «${source.title}».`);
      }
    }
    const visited = new Set();
    const active = new Set();
    function hasCycle(id) {
      if (active.has(id)) return true;
      if (visited.has(id)) return false;
      active.add(id);
      for (const edge of state.connections.filter(item => item.from === id)) {
        if (hasCycle(edge.to)) return true;
      }
      active.delete(id);
      visited.add(id);
      return false;
    }
    if (state.nodes.some(node => hasCycle(node.id))) errors.push('В схеме есть цикл; циклы пока не поддерживаются локальным тестом.');
    const reachable = new Set();
    const pending = triggers.map(trigger => trigger.id);
    while (pending.length) {
      const id = pending.pop();
      if (reachable.has(id)) continue;
      reachable.add(id);
      for (const edge of state.connections.filter(item => item.from === id)) pending.push(edge.to);
    }
    const isolated = state.nodes.filter(node => !reachable.has(node.id));
    if (isolated.length) warnings.push(`${isolated.length} блок(а) не подключены к первому событию и не попадут в эту симуляцию.`);
    return { errors, warnings };
  }

  function openTest() {
    const validation = validateMechanic();
    showDialog('<h2>Тест механики</h2><p>Интерактивная песочница в стиле Telegram. Награды и игровые данные только демонстрационные.</p>');
    if (validation.errors.length) {
      const errors = document.createElement('div');
      errors.className = 'test-results';
      errors.textContent = validation.errors.join('\n');
      elements.dialogContent.append(errors);
      return;
    }
    const chat = document.createElement('section');
    chat.className = 'preview-chat';
    chat.setAttribute('aria-label', 'Тестовый чат Telegram');
    const chatHead = document.createElement('header');
    chatHead.className = 'preview-chat-head';
    chatHead.innerHTML = '<span class="preview-chat-avatar">П</span><span><strong>Пивовар · тест</strong><small><span class="preview-status-dot"></span> Песочница · сообщения можно повторять до /end</small></span>';
    const messages = document.createElement('div');
    messages.className = 'preview-messages';
    messages.setAttribute('aria-live', 'polite');
    const inputRow = document.createElement('form');
    inputRow.className = 'preview-input-row';
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Напиши сообщение боту…';
    input.setAttribute('aria-label', 'Сообщение тестовому боту');
    const sendButton = document.createElement('button');
    sendButton.type = 'submit';
    sendButton.className = 'preview-send';
    sendButton.textContent = '➤';
    sendButton.setAttribute('aria-label', 'Отправить сообщение');
    inputRow.append(input, sendButton);
    chat.append(chatHead, messages, inputRow);
    elements.dialogContent.append(chat);
    const warnings = document.createElement('p');
    warnings.className = 'preview-footnote';
    warnings.textContent = validation.warnings.join(' · ') || 'Команды и inline-кнопки работают в этом диалоге как в тест-боте.';
    elements.dialogContent.append(warnings);
    const gameData = normalizeGameDatabase(state.gameDatabase);
    const context = {
      inventory: Object.fromEntries(gameData.inventory.items.map(item => [item.id, item.quantity])),
      recipes: new Set(gameData.recipes.filter(recipe => recipe.unlocked).map(recipe => recipe.id)),
      achievements: new Set(gameData.achievements.filter(item => item.unlocked).map(item => item.id)),
      variables: Object.fromEntries(mechanicVariables(gameData).map(item => [item.key, item.value])),
      customVariables: Object.fromEntries(gameData.variables.map(item => [
        item.key, item.type === 'Число' && Number.isFinite(Number(item.value)) ? Number(item.value) : item.value
      ])),
      beer: gameData.player.beer,
      experience: gameData.player.experience,
      level: gameData.player.level,
      clan: gameData.clan.name,
      clanId: gameData.clan.id,
      clanProgress: 0,
      active: true,
      input,
      sendButton
    };
    const pushBubble = (text, kind = 'bot') => {
      const bubble = document.createElement('article');
      bubble.className = `preview-bubble ${kind}`;
      const content = document.createElement('div');
      content.className = 'preview-bubble-text';
      content.textContent = text;
      bubble.append(content);
      messages.append(bubble);
      messages.scrollTop = messages.scrollHeight;
      return bubble;
    };
    const report = text => {
      const note = document.createElement('div');
      note.className = 'preview-system-note';
      note.textContent = text;
      messages.append(note);
      messages.scrollTop = messages.scrollHeight;
    };
    const renderButtons = (node, bubble) => {
      const rows = String(node.values?.buttons || '').split('\n')
        .map(row => row.split('|').map(value => value.trim()))
        .filter(([label, data]) => label && data);
      if (!rows.length) return;
      const layout = document.createElement('div');
      layout.className = 'preview-inline-keyboard';
      for (const [label, callbackData] of rows.slice(0, 24)) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'preview-inline-button';
        button.textContent = interpolateMechanicText(label, context);
        button.addEventListener('click', () => {
          if (!context.active) return;
          bubble.querySelector('.preview-bubble-text').textContent =
            `✓ ${interpolateMechanicText(label, context)}`;
          layout.remove();
          const callback = state.nodes.find(item => item.type === 'callback' &&
            String(item.values?.callbackData || '') === callbackData);
          if (callback) {
            report(`callback_query: ${callbackData}`);
          context.onFirstMessage = text => {
              bubble.querySelector('.preview-bubble-text').textContent = text;
              return bubble;
          };
          void runPreviewEvent(callback, context, pushBubble, report, renderButtons);
          } else {
            report(`callback ${callbackData} принято; подключи блок «Нажатие инлайн-кнопки» с таким callback_data.`);
          }
        });
        layout.append(button);
      }
      bubble.append(layout);
    };
    const trigger = state.nodes.find(node => node.type === 'trigger') ||
      state.nodes.find(node => definitionFor(node.type)?.subtitle === 'СОБЫТИЕ');
    if (!trigger) {
      report('Добавь блок-событие, чтобы запустить тестовый чат.');
      input.disabled = true;
    } else {
      pushBubble(`Тест «${state.name}» запущен. Напиши ${trigger.type === 'trigger' ? trigger.values?.command || '/start' : 'сообщение'} или нажми кнопку. Цикл теста остановится по /end.`);
      void runPreviewEvent(trigger, context, pushBubble, report, renderButtons);
    }
    inputRow.addEventListener('submit', event => {
      event.preventDefault();
      const text = input.value.trim();
      if (!text || !context.active) return;
      input.value = '';
      pushBubble(text, 'player');
      if (text.toLowerCase() === '/end') {
        context.active = false;
        input.disabled = true;
        sendButton.disabled = true;
        report('Тест остановлен командой /end.');
        return;
      }
      if (text === '/start' || text === '/menu') {
        pushBubble('Тестовая механика продолжает ждать команды. Для остановки отправь /end.');
        return;
      }
      const command = text.match(/^\/([a-z0-9_]+)/i)?.[1]?.toLowerCase();
      const eventNode = command
        ? state.nodes.find(node => node.type === 'trigger' &&
          String(node.values?.command || '').replace(/^\/+/, '').toLowerCase() === command)
        : state.nodes.find(node => node.type === 'text_match' &&
          text.toLowerCase().includes(String(node.values?.contains || '').toLowerCase())) ||
          state.nodes.find(node => node.type === 'any_message');
      if (eventNode) {
        report(`Новое событие: ${eventNode.title}`);
        void runPreviewEvent(eventNode, context, pushBubble, report, renderButtons);
      } else {
        const root = state.nodes.find(node => node.type === 'trigger');
        if (root) {
          report('Повтор цикла механики');
          void runPreviewEvent(root, context, pushBubble, report, renderButtons);
        }
      }
    });
    const actions = document.createElement('div');
    actions.className = 'dialog-actions';
    const stop = document.createElement('button');
    stop.type = 'button';
    stop.className = 'action-button';
    stop.textContent = '■ Остановить тест (/end)';
    stop.addEventListener('click', () => {
      if (!context.active) return;
      context.active = false;
      input.disabled = true;
      sendButton.disabled = true;
      report('Тест остановлен.');
    });
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'action-button primary';
    close.textContent = 'Закрыть';
    close.addEventListener('click', () => elements.dialog.close());
    actions.append(stop, close);
    elements.dialogContent.append(actions);
  }

  async function runPreviewEvent(eventNode, context, pushBubble, report, renderButtons) {
    const visited = new Set([eventNode.id]);
    let edge = state.connections.find(connection => connection.from === eventNode.id);
    let node = edge && nodeById(edge.to);
    let steps = 0;
    while (node && steps++ < 200 && !visited.has(node.id)) {
      if (!context.active) return;
      node = { ...node, values: interpolateNodeValues(node.values, context) };
      visited.add(node.id);
      const values = node.values || {};
      let branchResult = null;
      if (info(node.type).outputs?.length) {
        branchResult = evaluateCondition(node, context);
        if (branchResult) report(`Условие «${node.title}»: ${branchResult.detail} · ветка ${info(node.type).outputs.find(output => output.key === branchResult.key)?.label || branchResult.key}.`);
      } else if (screenBlockTypes[node.type]) {
        const screen = state.gameScreens.find(item => item.id === values.screenId);
        report(screen
          ? `Вкладка «${screen.title}» создана из базы игры: ${screen.entries.length} записей доступны в демонстрации.`
          : `Вкладка «${values.screenTitle || node.title}» не найдена. Создай её повторно через блок экранов Пивовара.`);
      } else if (node.type === 'message') {
        const text = interpolateMechanicText(values.text || '', context);
        if (context.onFirstMessage) {
          const edit = context.onFirstMessage;
          delete context.onFirstMessage;
          edit(text);
        } else pushBubble(text);
      } else if (node.type === 'inline_keyboard') {
        const bubble = pushBubble(interpolateMechanicText(node.title || 'Выбери действие:', context));
        renderButtons(node, bubble);
      } else if (node.type === 'check_inventory' || node.type === 'inventory_capacity') {
        const item = values.itemId || '';
        const hasItems = (context.inventory[item] || 0) >= Number(values.required || 1);
        report(node.type === 'inventory_capacity'
          ? `Склад тест-игрока: есть свободное место · нужно ${values.requiredSlots || 0} ячеек.`
          : `Инвентарь: ${item} × ${context.inventory[item] || 0}; ${hasItems ? 'достаточно' : 'не хватает'}.`);
      } else if (node.type === 'inventory_add') {
        const item = String(values.item || 'item').toLowerCase().replace(/\s+/g, '_');
        context.inventory[item] = (context.inventory[item] || 0) + Number(values.quantity || 1);
        report(`Тестовый инвентарь: +${values.quantity || 1} ${values.item || item}.`);
      } else if (node.type === 'inventory_remove') {
        const item = String(values.itemId || 'item');
        const count = Number(values.quantity || 1);
        context.inventory[item] = Math.max(0, (context.inventory[item] || 0) - count);
        report(`Тестовый инвентарь: −${count} ${item}.`);
      } else if (node.type === 'inventory_swap') {
        const give = String(values.giveItemId || 'item');
        const receive = String(values.receiveItemId || 'item');
        context.inventory[give] = Math.max(0, (context.inventory[give] || 0) - Number(values.giveQuantity || 1));
        context.inventory[receive] = (context.inventory[receive] || 0) + Number(values.receiveQuantity || 1);
        report(`Тестовый обмен: ${give} → ${receive}.`);
      } else if (node.type === 'craft_materials') {
        const ingredients = String(values.ingredients || '').split(',')
          .map(entry => entry.trim().split(':'))
          .filter(([id, quantity]) => id && Number.isFinite(Number(quantity)));
        const missing = ingredients.filter(([id, quantity]) => (context.inventory[id] || 0) < Number(quantity));
        if (missing.length) {
          report(`Не хватает тестовых ингредиентов: ${missing.map(([id, quantity]) => `${id} × ${quantity}`).join(', ')}.`);
          return;
        }
        for (const [id, quantity] of ingredients) context.inventory[id] -= Number(quantity);
        report(`Ингредиенты рецепта ${values.recipeId || ''} проверены и списаны только в тестовой песочнице.`);
      } else if (node.type === 'craft_recipe') {
        context.recipes.add(String(values.recipeId || 'recipe'));
        report(`Тестовый крафт: создан рецепт ${values.recipeId || 'рецепт'} × ${values.quantity || 1}.`);
      } else if (node.type === 'unlock_recipe') {
        context.recipes.add(String(values.recipeId || 'recipe'));
        report(`Тестовый профиль: открыт рецепт ${values.recipeId || 'recipe'}.`);
      } else if (node.type === 'grant_badge') {
        const achievementId = String(values.badgeId || 'first_brew');
        context.achievements.add(achievementId);
        report(`Тестовый профиль: получено достижение «${achievementId}».`);
      } else if (node.type === 'clan_quest') {
        context.clanProgress += Number(values.progress || 1);
        report(`Тестовый клан «${context.clan}»: прогресс задания ${context.clanProgress} · реальные очки не начисляются.`);
      } else if (node.type === 'clan_contribute') {
        context.clanProgress += Number(values.amount || 0);
        report(`Тестовый вклад «${values.currency || 'ресурс'}»: прогресс клана ${context.clanProgress}; игровые ресурсы не списываются.`);
      } else if (node.type === 'clan_action') {
        context.clanProgress += Number(values.amount || 0);
        report(`Тестовый клан «${context.clan}»: ${node.title} · прогресс ${context.clanProgress}.`);
      } else if (node.type === 'clan_rank' || node.type === 'clan_join') {
        report(`Тестовый клан «${context.clan}»: проверка ${node.title} пройдена.`);
      } else if (node.type === 'stop') {
        report(`Механика остановлена: ${values.reason || node.title}.`);
        context.active = false;
        context.input.disabled = true;
        context.sendButton.disabled = true;
        return;
      } else if (node.type === 'add_coins' || node.type === 'reward' || node.type === 'daily_reward') {
        if (node.type === 'reward' && values.reward === 'Опыт') {
          context.experience += Number(values.amount || 0);
          report(`Тестовый профиль: +${values.amount || 0} опыта · всего ${context.experience}. В игру ничего не записано.`);
        } else if (node.type === 'reward' && values.reward === 'Предмет') {
          context.inventory.test_reward = (context.inventory.test_reward || 0) + Number(values.amount || 0);
          report(`Тестовый инвентарь: выдан тестовый предмет × ${values.amount || 0}.`);
        } else {
          context.beer += Number(values.amount || 0);
          report(`Тестовый запас: +${values.amount || 0} л пива · всего ${context.beer} л. В настоящую игру ничего не записано.`);
        }
      } else if (node.type === 'add_experience') {
        context.experience += Number(values.amount || 0);
        report(`Тестовый опыт: +${values.amount || 0} · всего ${context.experience}.`);
      } else if (node.type === 'give_item') {
        const item = String(values.itemId || 'item');
        context.inventory[item] = (context.inventory[item] || 0) + Number(values.amount || 1);
        report(`Тестовый инвентарь: ${item} × ${context.inventory[item]}.`);
      } else if (node.type === 'remove_coins') {
        context.beer = Math.max(0, context.beer - Number(values.amount || 0));
        report(`Тестовый запас: −${values.amount || 0} л пива · всего ${context.beer} л.`);
      } else if (node.type === 'get_user_data') {
        report(`Данные игрока «${values.key || 'value'}»: ${context.variables[String(values.key || '')] ?? values.default ?? 'нет данных'}.`);
      } else if (node.type === 'save_user_data' || node.type === 'set_variable') {
        const key = String(values.key || values.name || 'variable');
        const rawValue = String(values.value ?? '');
        const numericValue = Number(rawValue);
        const value = values.valueType === 'Число' && Number.isFinite(numericValue) ? numericValue : rawValue;
        context.variables[key] = value;
        context.customVariables[key] = value;
        report(`В тестовой базе игрока сохранено: ${key} = ${value}.`);
      } else if (node.type === 'format_text') {
        pushBubble(interpolateMechanicText(values.template || '', context));
      } else if (node.type === 'delete_variable') {
        delete context.variables[String(values.name || '')];
        report(`Тестовая переменная «${values.name || ''}» удалена.`);
      } else if (node.type === 'open_chest') {
        report(`Сундук ${values.rarity || 'обычный'} открыт в песочнице; настоящие награды не выдаются.`);
      } else if (node.type === 'brew_product') {
        report(`Сварено в тесте: ${values.quantity || 1} л (${values.quality || 'обычное качество'}).`);
      } else if (node.type === 'business_upgrade') {
        report(`Улучшение «${values.upgrade || 'пивоварня'}» × ${values.levels || 1} проверено в песочнице.`);
      } else if (node.type === 'grant_badge') {
        report(`Достижение «${values.badgeId || 'badge'}» отмечено в песочнице.`);
      } else if (node.type === 'chance') {
        report(`Тестовый шанс ${values.chance || 0}%: демонстрационный бросок ${Math.floor(Math.random() * 100) + 1}.`);
      } else if (node.type === 'timer' || node.type === 'wait_reply') {
        report(`${node.title}: ожидание в локальном предпросмотре пропущено.`);
      } else if (node.type !== 'callback' && node.type !== 'trigger') {
        report(`Предпросмотр: «${node.title || info(node.type).title}» · реальные данные не меняются.`);
      }
      const next = branchResult
        ? state.connections.find(connection => connection.from === node.id && connection.outputKey === branchResult.key)
        : nextConnection(node, context);
      node = next ? nodeById(next.to) : null;
    }
    if (steps >= 200) report('Симуляция остановлена после 200 блоков.');
  }

  function openFiles() {
    showDialog('<h2>Файлы проекта</h2><p>Сохрани механику в файл .piv или загрузи проект, чтобы продолжить работу на другом устройстве. Старые JSON-проекты тоже поддерживаются.</p>');
    const nameLabel = document.createElement('label');
    nameLabel.className = 'field-row module-name-field';
    nameLabel.textContent = 'Название механики';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.maxLength = 100;
    nameInput.value = state.name || 'Новая механика';
    nameInput.setAttribute('aria-label', 'Название механики');
    nameInput.addEventListener('change', () => {
      const name = nameInput.value.trim();
      if (!name) {
        nameInput.value = state.name || 'Новая механика';
        return;
      }
      checkpoint();
      state.name = name;
      saveProject();
      render();
    });
    nameLabel.append(nameInput);
    elements.dialogContent.append(nameLabel);
    const drop = document.createElement('label');
    drop.className = 'file-drop';
    drop.htmlFor = 'import-file';
    drop.innerHTML = '<span class="file-drop-icon">⇧</span><strong>Загрузить модуль .piv</strong><span>Перетащи файл сюда или нажми, чтобы выбрать (.piv или старый .json)</span>';
    drop.addEventListener('dragover', event => { event.preventDefault(); drop.style.borderColor = '#d8a811'; });
    drop.addEventListener('dragleave', () => { drop.style.borderColor = ''; });
    drop.addEventListener('drop', event => {
      event.preventDefault();
      const file = event.dataTransfer.files[0];
      if (file) importProjectFile(file);
    });
    elements.dialogContent.append(drop);
    const actions = document.createElement('div');
    actions.className = 'dialog-actions';
    const exportButton = document.createElement('button');
    exportButton.type = 'button';
    exportButton.className = 'action-button primary';
    exportButton.textContent = '↓ Скачать проект';
    exportButton.addEventListener('click', exportProject);
    if (authUser && !devMode) {
      const quickSendButton = document.createElement('button');
      quickSendButton.type = 'button';
      quickSendButton.className = 'action-button primary';
      quickSendButton.textContent = '➤ Быстро отправить в мой Telegram';
      quickSendButton.addEventListener('click', async () => {
        quickSendButton.disabled = true;
        quickSendButton.textContent = 'Отправляем в личку…';
        try {
          const response = await fetch('/api/mechanics/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: state.name || 'Механика', module: { ...state, schema: 'piv-mechanics/1' } })
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || 'Не удалось отправить тест в Telegram.');
          quickSendButton.textContent = '✓ Отправлено';
          showToast('Тест отправлен в личный чат Telegram');
        } catch (error) {
          quickSendButton.disabled = false;
          quickSendButton.textContent = '➤ Быстро отправить в мой Telegram';
          showToast(error.message);
        }
      });
      const publishButton = document.createElement('button');
      publishButton.type = 'button';
      publishButton.className = 'action-button primary';
      publishButton.textContent = '⚡ Активировать в Telegram';
      publishButton.addEventListener('click', async () => {
        const telegramWindow = window.open('about:blank', '_blank');
        publishButton.disabled = true;
        publishButton.textContent = 'Сохраняем…';
        try {
          const response = await fetch('/api/mechanics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: state.name || 'Механика',
              module: { ...state, schema: 'piv-mechanics/1' }
            })
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || 'Не удалось сохранить механику.');
          const activateLink = result.activateLink || result.botLink;
          if (activateLink) {
            if (telegramWindow) {
              telegramWindow.location.href = activateLink;
            } else {
              const link = document.createElement('a');
              link.href = activateLink;
              link.target = '_blank';
              link.rel = 'noopener noreferrer';
              link.className = 'action-button';
              link.textContent = '⚡ Запустить механику в Telegram';
              elements.dialogContent.append(link);
            }
            try { await navigator.clipboard.writeText(activateLink); } catch (error) {
              console.info('Не удалось скопировать ссылку в буфер обмена:', error);
            }
            showToast('Тест механики запускается в Telegram');
          } else {
            telegramWindow?.close();
            showToast('Механика сохранена. Тест-бот не настроен на сервере.');
          }
          publishButton.textContent = '⚡ Активировать новую версию';
        } catch (error) {
          telegramWindow?.close();
          publishButton.disabled = false;
          publishButton.textContent = '⚡ Активировать в Telegram';
          showToast(`Не удалось опубликовать тест-механику: ${error.message}`);
        }
      });
      actions.append(quickSendButton, publishButton);
    }
    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'action-button';
    closeButton.textContent = 'Закрыть';
    closeButton.addEventListener('click', () => elements.dialog.close());
    actions.append(exportButton, closeButton);
    elements.dialogContent.append(actions);
    if (authUser && !devMode) {
      const savedModules = document.createElement('section');
      savedModules.className = 'saved-modules';
      const heading = document.createElement('h3');
      heading.textContent = 'Мои модули в тест-боте';
      savedModules.append(heading);
      const list = document.createElement('div');
      list.className = 'saved-module-list';
      list.textContent = 'Загружаем…';
      savedModules.append(list);
      elements.dialogContent.append(savedModules);
      void renderSavedModules(list);
    }
  }

  async function renderSavedModules(list) {
    try {
      const response = await fetch('/api/mechanics');
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Не удалось загрузить модули.');
      list.replaceChildren();
      if (!result.modules.length) {
        list.textContent = 'Пока нет сохранённых модулей.';
        return;
      }
      for (const module of result.modules) {
        const row = document.createElement('div');
        row.className = 'saved-module-row';
        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = 100;
        input.value = module.title;
        input.setAttribute('aria-label', `Имя модуля ${module.title}`);
        const save = document.createElement('button');
        save.type = 'button';
        save.className = 'action-button';
        save.textContent = 'Переименовать';
        save.addEventListener('click', async () => {
          try {
            const update = await fetch(`/api/mechanics/${encodeURIComponent(module.id)}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title: input.value.trim() })
            });
            const body = await update.json();
            if (!update.ok) throw new Error(body.error || 'Не удалось переименовать модуль.');
            module.title = body.title;
            input.value = body.title;
            showToast('Название модуля обновлено');
          } catch (error) {
            showToast(error.message);
          }
        });
        row.append(input, save);
        list.append(row);
      }
    } catch (error) {
      list.textContent = error.message;
    }
  }

  function showDialog(markup) {
    elements.dialog.classList.remove('game-screens-dialog');
    elements.dialog.classList.remove('game-database-dialog');
    elements.dialogContent.replaceChildren();
    const template = document.createElement('template');
    template.innerHTML = markup;
    elements.dialogContent.append(template.content);
    if (!elements.dialog.open) elements.dialog.showModal();
  }

  function exportProject() {
    const portableProject = { ...state, schema: 'piv-mechanics/1' };
    const data = new Blob([JSON.stringify(portableProject, null, 2)], { type: 'application/vnd.piv.mechanic+json' });
    const url = URL.createObjectURL(data);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${(state.name || 'mechanic').toLowerCase().replace(/[^a-zа-я0-9-]+/gi, '-')}.piv`;
    anchor.hidden = true;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('Модуль .piv скачан');
  }

  async function importProjectFile(file) {
    try {
      const parsed = JSON.parse(await file.text());
      if (parsed?.version !== 1 || (parsed.schema && parsed.schema !== 'piv-mechanics/1') ||
          !Array.isArray(parsed.nodes) || !Array.isArray(parsed.connections)) {
        throw new Error('Неверный формат файла. Нужен модуль .piv или совместимый JSON-проект.');
      }
      if (parsed.gameScreens !== undefined && (!Array.isArray(parsed.gameScreens) ||
          parsed.gameScreens.length > 100 || parsed.gameScreens.some(screen =>
            !screen || typeof screen.id !== 'string' || typeof screen.title !== 'string' ||
            !gameScreenTypes.some(type => type.type === screen.type) ||
            !['tabs', 'entries', 'actions'].every(key =>
              Array.isArray(screen[key]) && screen[key].every(value => typeof value === 'string'))))) {
        throw new Error('Файл содержит некорректные игровые экраны.');
      }
      const ids = new Set(parsed.nodes.map(node => node.id));
      if (parsed.nodes.some(node => !node.id || !definitionFor(node.type) || !Number.isFinite(node.x) || !Number.isFinite(node.y)) ||
          parsed.connections.some(edge => !ids.has(edge.from) || !ids.has(edge.to) || edge.from === edge.to)) {
        throw new Error('В проекте есть неизвестные блоки или связи');
      }
      checkpoint();
      state = { ...parsed, schema: 'piv-mechanics/1' };
      normalizeLegacyBrewTerms(state);
      keepDatabaseAvailable(state);
      setSelection(state.nodes.slice(0, 1).map(node => node.id));
      saveProject();
      render();
      elements.dialog.close();
      showToast(file.name.toLowerCase().endsWith('.piv') ? 'Модуль .piv загружен' : 'Совместимый JSON-проект загружен');
    } catch (error) {
      showToast(`Не удалось загрузить проект: ${error.message}`);
    }
  }

  function openSettings() {
    showDialog('<h2>Настройки мастерской</h2><p>Локальные параметры редактора. Изменения проекта сохраняются в этом браузере.</p>');
    const settings = [
      ['Показывать сетку', 'Отображает точки на рабочем поле.', gridVisible, 'grid'],
      ['Привязка блоков к сетке', 'При перетаскивании координаты блоков округляются к шагу сетки.', snapToGrid, 'snap']
    ];
    for (const [title, description, enabled, settingKey] of settings) {
      const row = document.createElement('div');
      row.className = 'settings-card';
      const copy = document.createElement('div');
      const strong = document.createElement('strong');
      strong.textContent = title;
      const small = document.createElement('small');
      small.textContent = description;
      copy.append(strong, small);
      const toggle = document.createElement('button');
      toggle.className = 'toggle';
      toggle.type = 'button';
      toggle.setAttribute('role', 'switch');
      toggle.setAttribute('aria-checked', String(enabled));
      toggle.setAttribute('aria-label', title);
      toggle.addEventListener('click', () => {
        const next = toggle.getAttribute('aria-checked') !== 'true';
        toggle.setAttribute('aria-checked', String(next));
        if (settingKey === 'grid') {
          gridVisible = next;
          localStorage.setItem('piv-mechanics-visible', String(next));
          updateGridControls();
          gridStatus.textContent = `Сетка ${gridVisible ? 'показана' : 'скрыта'} · привязка ${snapToGrid ? 'включена' : 'выключена'} · шаг ${gridSize} px. Переключатели сетки находятся в правом верхнем углу холста.`;
        } else if (settingKey === 'snap') {
          snapToGrid = next;
          localStorage.setItem('piv-mechanics-snap', String(next));
          updateGridControls();
          gridStatus.textContent = `Сетка ${gridVisible ? 'показана' : 'скрыта'} · привязка ${snapToGrid ? 'включена' : 'выключена'} · шаг ${gridSize} px. Переключатели сетки находятся в правом верхнем углу холста.`;
        }
      });
      row.append(copy, toggle);
      elements.dialogContent.append(row);
    }
    const gridControl = document.createElement('div');
    gridControl.className = 'settings-card grid-size-setting';
    const gridCopy = document.createElement('div');
    gridCopy.innerHTML = '<strong>Шаг сетки</strong><small>Интервал между точками и привязкой блоков.</small>';
    const gridSizeInput = document.createElement('input');
    gridSizeInput.type = 'range';
    gridSizeInput.min = '12';
    gridSizeInput.max = '64';
    gridSizeInput.step = '2';
    gridSizeInput.value = String(gridSize);
    gridSizeInput.setAttribute('aria-label', 'Размер шага сетки');
    const gridSizeValue = document.createElement('output');
    gridSizeValue.className = 'grid-size-value';
    gridSizeValue.textContent = `${gridSize} px`;
    gridSizeInput.addEventListener('input', () => {
      gridSize = Number(gridSizeInput.value);
      localStorage.setItem('piv-mechanics-grid-size', String(gridSize));
      elements.canvas.style.backgroundSize = `${gridSize}px ${gridSize}px`;
      gridSizeValue.textContent = `${gridSize} px`;
      gridStatus.textContent = `Сетка ${gridVisible ? 'показана' : 'скрыта'} · привязка ${snapToGrid ? 'включена' : 'выключена'} · шаг ${gridSize} px. Переключатели сетки находятся в правом верхнем углу холста.`;
    });
    gridControl.append(gridCopy, gridSizeInput, gridSizeValue);
    elements.dialogContent.append(gridControl);
    const gridStatus = document.createElement('p');
    gridStatus.className = 'field-help';
    gridStatus.textContent = `Сетка ${gridVisible ? 'показана' : 'скрыта'} · привязка ${snapToGrid ? 'включена' : 'выключена'} · шаг ${gridSize} px. Переключатели сетки находятся в правом верхнем углу холста.`;
    elements.dialogContent.append(gridStatus);
    const themeSection = document.createElement('div');
    themeSection.className = 'theme-setting';
    const themeLabel = document.createElement('strong');
    themeLabel.textContent = 'Оформление';
    const themeControls = document.createElement('div');
    themeControls.className = 'theme-options';
    for (const [theme, label] of [['light', '☀ Светлая'], ['dark', '☾ Тёмная']]) {
      const option = document.createElement('button');
      option.className = `action-button${document.documentElement.dataset.theme === theme ? ' selected' : ''}`;
      option.type = 'button';
      option.textContent = label;
      option.addEventListener('click', () => {
        applyTheme(theme);
        $$('.theme-options .action-button', themeSection).forEach(item => item.classList.toggle('selected', item === option));
      });
      themeControls.append(option);
    }
    themeSection.append(themeLabel, themeControls);
    elements.dialogContent.append(themeSection);
    const note = document.createElement('p');
    note.style.marginTop = '18px';
    note.textContent = 'Для входа через Telegram настрой Login Widget и укажи публичный HTTPS-адрес сайта в PUBLIC_ORIGIN. Чтобы получить быстрый тест в личку, заранее нажми Start у тест-бота.';
    elements.dialogContent.append(note);
  }

  function openHelp() {
    showDialog('<h2>Помощь по мастерской</h2><p>Собирай механику из событий, логики и действий. Соединяй выход предыдущего блока со входом следующего.</p>');
    const groups = [
      ['Блоки', 'ЛКМ — выбрать и открыть настройки. Перетаскивай блок за шапку; новый блок центрируется там, где его отпустили. Ctrl+ЛКМ по блоку или рамка по холсту добавляют элементы к выделению. ПКМ открывает контекстное меню.'],
      ['Холст', 'Колесо — приближение/отдаление к курсору. Средняя кнопка — панорамирование. Alt+колесо — горизонтальный сдвиг. Двойной клик по блоку приближает к нему; двойной по линии удаляет связь.'],
      ['Сетка', 'В правом верхнем углу холста: вписать схему, включить привязку при перетаскивании, выровнять блоки по сетке, показать/скрыть сетку. Размер шага настраивается в «Настройки».'],
      ['История и клавиши', 'Ctrl+Z — отменить. Ctrl+Alt+Z — повторить. Delete/Insert — удалить блок под курсором или выбранные. Ctrl+K — поиск блока.'],
      ['Тестирование', 'Кнопка «Тестировать» проверяет граф и запускает только локальную симуляцию. Для реального запуска в Telegram потребуется отдельный серверный адаптер; токен бота в браузер добавлять нельзя.']
    ];
    for (const [title, description] of groups) {
      const row = document.createElement('section');
      row.className = 'help-section';
      const heading = document.createElement('strong');
      heading.textContent = title;
      const text = document.createElement('p');
      text.textContent = description;
      row.append(heading, text);
      elements.dialogContent.append(row);
    }
    const close = document.createElement('button');
    close.className = 'action-button primary';
    close.type = 'button';
    close.textContent = 'Понятно';
    close.addEventListener('click', () => elements.dialog.close());
    elements.dialogContent.append(close);
  }

  function login() {
    if (!authUser) {
      $('#auth-gate').hidden = false;
      return;
    }
    showDialog('<h2>Профиль</h2><p>Данные активного аккаунта мастерской.</p>');
    const profile = document.createElement('section');
    profile.className = 'account-profile';
    const avatar = document.createElement('div');
    avatar.className = 'account-avatar';
    const initials = `${authUser.first_name?.[0] || ''}${authUser.last_name?.[0] || ''}` || 'П';
    avatar.textContent = initials.toLocaleUpperCase('ru');
    if (authUser.photo_url) {
      try {
        const photo = new URL(authUser.photo_url);
        if (photo.protocol === 'https:' && ['t.me', 'telegram.org'].includes(photo.hostname)) {
          const image = document.createElement('img');
          image.src = photo.href;
          image.alt = '';
          image.referrerPolicy = 'no-referrer';
          image.addEventListener('error', () => image.remove(), { once: true });
          avatar.replaceChildren(image);
        }
      } catch (error) {
        console.warn('Не удалось прочитать фото Telegram-профиля:', error);
      }
    }
    const details = document.createElement('div');
    details.className = 'account-profile-details';
    const fullName = [authUser.first_name, authUser.last_name].filter(Boolean).join(' ') || 'Пользователь Telegram';
    const name = document.createElement('strong');
    name.textContent = fullName;
    const username = document.createElement('span');
    username.textContent = authUser.username ? `@${authUser.username}` : 'Имя пользователя Telegram не указано';
    details.append(name, username);
    profile.append(avatar, details);
    elements.dialogContent.append(profile);
    const info = document.createElement('dl');
    info.className = 'account-profile-info';
    const fields = [
      ['Способ входа', devMode ? 'Локальный режим разработчика' : 'Telegram'],
      ...(!devMode && authUser.id ? [['Telegram ID', authUser.id]] : [])
    ];
    for (const [label, value] of fields) {
      const row = document.createElement('div');
      const term = document.createElement('dt');
      term.textContent = label;
      const description = document.createElement('dd');
      description.textContent = value;
      row.append(term, description);
      info.append(row);
    }
    elements.dialogContent.append(info);
    const status = document.createElement('p');
    status.className = 'account-status';
    status.setAttribute('role', 'status');
    elements.dialogContent.append(status);
    const logout = document.createElement('button');
    logout.className = 'action-button account-logout';
    logout.type = 'button';
    logout.textContent = 'Выйти';
    logout.addEventListener('click', async () => {
      logout.disabled = true;
      logout.textContent = 'Выходим…';
      status.textContent = '';
      try {
        if (!devMode) {
          const response = await fetch('/api/auth/logout', { method: 'POST' });
          if (!response.ok) {
            const result = await response.json();
            throw new Error(result.error || 'Не удалось завершить сеанс Telegram.');
          }
        }
        sessionStorage.removeItem('piv-dev-mode');
        authUser = null;
        devMode = false;
        lockWorkspace();
        elements.dialog.close();
        $('#auth-gate').hidden = false;
        showTelegramLogin();
      } catch (error) {
        status.textContent = error.message || 'Не удалось выйти. Попробуй ещё раз.';
        logout.disabled = false;
        logout.textContent = 'Выйти из аккаунта';
      }
    });
    elements.dialogContent.append(logout);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
  }

  function lockWorkspace() {
    $('#app-shell').inert = true;
    $('#app-shell').setAttribute('aria-hidden', 'true');
    $('#login-button').querySelector('.login-label').textContent = 'Войти через Telegram';
    $('#login-button').querySelector('.telegram-mark').textContent = '➤';
    $('#login-button').querySelector('.telegram-mark').classList.remove('profile-avatar-mark');
    $('#login-button').setAttribute('aria-label', 'Войти через Telegram');
  }

  function unlockWorkspace(user, isDev = false) {
    authUser = user;
    devMode = isDev;
    $('#auth-gate').hidden = true;
    $('#app-shell').inert = false;
    $('#app-shell').setAttribute('aria-hidden', 'false');
    $('#login-button').querySelector('.login-label').textContent =
      isDev ? 'DEV · локально' : (user.username ? `@${user.username}` : user.first_name);
    $('#login-button').querySelector('.telegram-mark').textContent = isDev
      ? 'D'
      : `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toLocaleUpperCase('ru') || 'П';
    $('#login-button').querySelector('.telegram-mark').classList.add('profile-avatar-mark');
    $('#login-button').setAttribute('aria-label', isDev ? 'Профиль разработчика' : 'Профиль Telegram');
    if (isDev) showToast('Локальный режим разработчика включён');
  }

  async function readApiJson(response) {
    const body = await response.text();
    try {
      return JSON.parse(body);
    } catch {
      throw new Error(`API вернул пустой или не-JSON ответ (HTTP ${response.status}). Проверь маршрут /api и настройки Worker.`);
    }
  }

  function showTelegramLogin() {
    const slot = $('#telegram-login-slot');
    const status = $('#auth-status');
    slot.replaceChildren();
    if (!authConfig.telegramConfigured) {
      status.textContent = 'Telegram-вход не настроен: серверу нужны username и токен отдельного бота.';
      return;
    }
    status.textContent = 'Войди в Telegram, чтобы продолжить.';
    window.onTelegramAuth = async user => {
      status.textContent = 'Проверяем подпись Telegram…';
      try {
        const response = await fetch('/api/auth/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user)
        });
        const result = await readApiJson(response);
        if (!response.ok) throw new Error(result.error || 'Не удалось подтвердить Telegram-вход.');
        unlockWorkspace(result.user);
      } catch (error) {
        status.textContent = error.message;
      }
    };
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.dataset.telegramLogin = authConfig.botUsername;
    script.dataset.size = 'large';
    script.dataset.userpic = 'false';
    script.dataset.requestAccess = 'write';
    script.dataset.onauth = 'onTelegramAuth(user)';
    slot.append(script);
  }

  async function initAuth() {
    if (sessionStorage.getItem('piv-dev-mode') === 'true') {
      unlockWorkspace({ first_name: 'Developer' }, true);
      return;
    }
    lockWorkspace();
    try {
      const configResponse = await fetch('/api/config');
      authConfig = await readApiJson(configResponse);
      if (!configResponse.ok) throw new Error(authConfig.error || `Ошибка API: HTTP ${configResponse.status}.`);
      if (!authConfig.telegramConfigured) {
        showTelegramLogin();
        return;
      }
      const sessionResponse = await fetch('/api/auth/me');
      if (sessionResponse.ok) {
        const session = await sessionResponse.json();
        unlockWorkspace(session.user);
        return;
      }
      showTelegramLogin();
    } catch (error) {
      $('#auth-status').textContent = `Сервер входа недоступен: ${error.message}`;
    }
  }

  document.addEventListener('keydown', event => {
    if (event.key !== '/' || event.repeat) return;
    const now = Date.now();
    slashTaps.push(now);
    while (slashTaps.length && now - slashTaps[0] > 1600) slashTaps.shift();
    if (slashTaps.length < 3) return;
    slashTaps.length = 0;
    if (authUser && !devMode) return;
    sessionStorage.setItem('piv-dev-mode', 'true');
    unlockWorkspace({ first_name: 'Developer' }, true);
  }, true);

  function setScale(next) {
    zoomTarget = Math.min(maxScale, Math.max(minScale, next));
    applyScale(zoomTarget);
  }
  function updateGridControls() {
    const gridButton = $('#grid-button');
    const snapButton = $('#snap-button');
    elements.canvas.classList.toggle('grid-hidden', !gridVisible);
    gridButton.setAttribute('aria-pressed', String(gridVisible));
    gridButton.title = gridVisible ? 'Скрыть сетку' : 'Показать сетку';
    gridButton.setAttribute('aria-label', gridButton.title);
    snapButton.setAttribute('aria-pressed', String(snapToGrid));
    snapButton.title = snapToGrid ? 'Выключить привязку к сетке' : 'Включить привязку к сетке';
    snapButton.setAttribute('aria-label', snapButton.title);
    elements.canvas.style.backgroundSize = `${gridSize}px ${gridSize}px`;
  }
  function applyScale(next) {
    scale = Math.min(maxScale, Math.max(minScale, next));
    const percentage = scale < 0.01 ? (scale * 100).toFixed(1) : String(Math.round(scale * 100));
    $('#zoom-label').textContent = `${percentage}%`;
    elements.canvas.style.transform = `scale(${scale})`;
    syncWorldSize();
    renderWires();
  }
  function animateViewport(nextScale, nextLeft, nextTop) {
    const targetScale = Math.min(maxScale, Math.max(minScale, nextScale));
    zoomTarget = targetScale;
    if (zoomFrame) cancelAnimationFrame(zoomFrame);
    const start = { scale, left: elements.wrap.scrollLeft, top: elements.wrap.scrollTop };
    const target = { scale: targetScale, left: Math.max(0, nextLeft), top: Math.max(0, nextTop) };
    if (reducedMotion) {
      setScale(target.scale);
      elements.wrap.scrollTo(target.left, target.top);
      return;
    }
    const startTime = performance.now();
    const duration = 240;
    const step = now => {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      applyScale(start.scale + (target.scale - start.scale) * eased);
      elements.wrap.scrollLeft = start.left + (target.left - start.left) * eased;
      elements.wrap.scrollTop = start.top + (target.top - start.top) * eased;
      if (progress < 1) zoomFrame = requestAnimationFrame(step);
      else {
        zoomFrame = 0;
        zoomTarget = scale;
      }
    };
    zoomFrame = requestAnimationFrame(step);
  }
  function zoomAround(delta, clientX, clientY) {
    const rect = elements.wrap.getBoundingClientRect();
    const x = Math.max(0, Math.min(elements.wrap.clientWidth, clientX - rect.left));
    const y = Math.max(0, Math.min(elements.wrap.clientHeight, clientY - rect.top));
    const anchorX = (elements.wrap.scrollLeft + x) / scale;
    const anchorY = (elements.wrap.scrollTop + y) / scale;
    const targetScale = Math.min(maxScale, Math.max(minScale, zoomTarget * Math.exp(-delta * .001)));
    animateViewport(targetScale, anchorX * targetScale - x, anchorY * targetScale - y);
  }
  function zoomBy(delta) {
    const rect = elements.wrap.getBoundingClientRect();
    zoomAround(delta, rect.left + rect.width / 2, rect.top + rect.height / 2);
  }
  function fitNodes() {
    if (!state.nodes.length) {
      animateViewport(1, 0, 0);
      return;
    }
    const nodes = $$('.node-card', elements.nodes);
    const bounds = nodes.reduce((box, card) => {
      const node = nodeById(card.dataset.nodeId);
      return {
        left: Math.min(box.left, node.x),
        top: Math.min(box.top, node.y),
        right: Math.max(box.right, node.x + card.offsetWidth),
        bottom: Math.max(box.bottom, node.y + card.offsetHeight)
      };
    }, { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity });
    const graphWidth = bounds.right - bounds.left + 64;
    const graphHeight = bounds.bottom - bounds.top + 64;
    const fit = Math.min(1, (elements.wrap.clientWidth - 24) / graphWidth, (elements.wrap.clientHeight - 95) / graphHeight);
    const targetScale = Math.min(maxScale, Math.max(minScale, fit));
    animateViewport(
      targetScale,
      (world.originX + bounds.left) * targetScale - 24,
      (world.originY + bounds.top) * targetScale - 24
    );
  }

  function resizeWorkspacePanel(event) {
    const handle = event.currentTarget;
    if (event.button !== 0) return;
    event.preventDefault();
    const side = handle.dataset.resize;
    const property = side === 'library' ? '--library-width' : '--inspector-width';
    const current = Number.parseFloat(getComputedStyle($('.workspace')).getPropertyValue(property)) ||
      (side === 'library' ? $('.library-panel').getBoundingClientRect().width : $('.inspector-panel').getBoundingClientRect().width);
    const startX = event.clientX;
    handle.classList.add('dragging');
    handle.setPointerCapture(event.pointerId);
    const move = moveEvent => {
      const sign = side === 'library' ? 1 : -1;
      const min = side === 'library' ? 170 : 210;
      const max = side === 'library' ? 390 : 440;
      const width = Math.max(min, Math.min(max, current + sign * (moveEvent.clientX - startX)));
      $('.workspace').style.setProperty(property, `${width}px`);
      syncCanvasOverlays();
    };
    const up = () => {
      handle.classList.remove('dragging');
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', up);
      localStorage.setItem(property, getComputedStyle($('.workspace')).getPropertyValue(property).trim());
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', up, { once: true });
    handle.addEventListener('pointercancel', up, { once: true });
  }

  $('#block-search').addEventListener('input', event => renderLibrary(event.target.value));
  $('#run-button').addEventListener('click', openTest);
  $('#login-button').addEventListener('click', login);
  $('#theme-button').addEventListener('click', () => {
    applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  });
  $('#dialog-close').addEventListener('click', () => elements.dialog.close());
  $('#undo-button').addEventListener('click', () => {
    undo();
  });
  $('#redo-button').addEventListener('click', redo);
  $('#zoom-in').addEventListener('click', () => zoomBy(-90));
  $('#zoom-out').addEventListener('click', () => zoomBy(90));
  $('#templates-button').addEventListener('click', openTemplates);
  $('#game-screens-button').addEventListener('click', openGameScreens);
  $('#game-database-button').addEventListener('click', openGameDatabase);
  $('#fit-button').addEventListener('click', () => {
    fitNodes();
  });
  $('#grid-button').addEventListener('click', event => {
    gridVisible = !gridVisible;
    localStorage.setItem('piv-mechanics-visible', String(gridVisible));
    updateGridControls();
  });
  $('#snap-button').addEventListener('click', () => {
    snapToGrid = !snapToGrid;
    localStorage.setItem('piv-mechanics-snap', String(snapToGrid));
    updateGridControls();
    showToast(snapToGrid ? 'Привязка к сетке включена' : 'Привязка к сетке выключена');
  });
  $('#align-grid-button').addEventListener('click', alignNodesToGrid);
  $('.help-button').addEventListener('click', openHelp);
  $('#show-library').addEventListener('click', () => {
    $('.workspace').classList.remove('library-collapsed');
    localStorage.setItem('piv-mechanics-library-collapsed', 'false');
    $('.library-panel').setAttribute('aria-hidden', 'false');
    $('.library-resize').setAttribute('aria-hidden', 'false');
    $('#collapse-library').textContent = '‹';
    $('#collapse-library').title = 'Свернуть блоки';
    $('#collapse-library').setAttribute('aria-label', 'Свернуть блоки');
  });
  $('#collapse-library').addEventListener('click', event => {
    if (window.innerWidth <= 780) {
      $('.library-panel').classList.toggle('mobile-open');
      return;
    }
    const collapsed = $('.workspace').classList.toggle('library-collapsed');
    localStorage.setItem('piv-mechanics-library-collapsed', String(collapsed));
    $('.library-panel').setAttribute('aria-hidden', String(collapsed));
    $('.library-resize').setAttribute('aria-hidden', String(collapsed));
    event.currentTarget.textContent = collapsed ? '›' : '‹';
    event.currentTarget.title = collapsed ? 'Развернуть блоки' : 'Свернуть блоки';
    event.currentTarget.setAttribute('aria-label', event.currentTarget.title);
  });
  $('#close-inspector').addEventListener('click', () => {
    if (window.innerWidth <= 780) $('.inspector-panel').classList.remove('mobile-open');
    else showToast('Выбери блок, чтобы открыть его параметры');
  });
  elements.importFile.addEventListener('change', event => {
    const file = event.target.files?.[0];
    if (file) importProjectFile(file);
    event.target.value = '';
  });
  $$('.dock-item').forEach(item => item.addEventListener('click', () => setView(item.dataset.view)));
  document.addEventListener('pointerup', handlePortPointerUp);
  elements.canvas.addEventListener('dragover', event => event.preventDefault());
  elements.canvas.addEventListener('drop', event => {
    event.preventDefault();
    const type = event.dataTransfer.getData('text/plain');
    if (!catalog.some(block => block.type === type)) return;
    const point = canvasPoint(event.clientX, event.clientY);
    addNode(type, { x: point.x, y: point.y, centered: true });
  });
  elements.wrap.addEventListener('pointerdown', event => {
    const isMiddleButton = event.button === 1;
    const isLeftButton = event.button === 0;
    const onNode = Boolean(event.target.closest('.node-card'));
    const onControl = Boolean(event.target.closest('button, input, textarea, select, .canvas-tools, .wire-hit, .wire-path, .wire-flow'));
    if (panning || (!isMiddleButton && (!isLeftButton || !spaceDown || (onNode && !spaceDown) || onControl))) return;
    event.preventDefault();
    panning = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, left: elements.wrap.scrollLeft, top: elements.wrap.scrollTop };
    elements.wrap.classList.add('panning');
    elements.wrap.setPointerCapture(event.pointerId);
  }, true);
  elements.wrap.addEventListener('pointerdown', beginSelection, true);
  elements.wrap.addEventListener('pointermove', event => {
    if (selecting?.pointerId === event.pointerId) {
      const current = canvasWorldPoint(event.clientX, event.clientY);
      selecting.current = current;
      selecting.moved ||= Math.abs(current.x - selecting.start.x) + Math.abs(current.y - selecting.start.y) > 8;
      const left = Math.min(selecting.start.x, current.x);
      const top = Math.min(selecting.start.y, current.y);
      selecting.element.style.left = `${left}px`;
      selecting.element.style.top = `${top}px`;
      selecting.element.style.width = `${Math.abs(current.x - selecting.start.x)}px`;
      selecting.element.style.height = `${Math.abs(current.y - selecting.start.y)}px`;
      return;
    }
    if (!panning || panning.pointerId !== event.pointerId) return;
    elements.wrap.scrollLeft = panning.left - (event.clientX - panning.x);
    elements.wrap.scrollTop = panning.top - (event.clientY - panning.y);
  });
  const endPan = event => {
    if (selecting && (event.pointerId === undefined || event.pointerId === selecting.pointerId)) {
      const selection = selecting;
      selecting = null;
      selection.element.remove();
      if (selection.moved) selectInRectangle(selection.start, selection.current, selection.additive);
      else if (selection.clickNodeId) {
        const next = new Set(selectedIds);
        if (next.has(selection.clickNodeId)) next.delete(selection.clickNodeId);
        else next.add(selection.clickNodeId);
        setSelection([...next]);
        render();
      } else if (!selection.additive) {
        setSelection([]);
        renderInspector();
      }
      return;
    }
    if (!panning || (event.pointerId !== undefined && event.pointerId !== panning.pointerId)) return;
    panning = null;
    elements.wrap.classList.remove('panning');
  };
  elements.wrap.addEventListener('pointerup', endPan);
  elements.wrap.addEventListener('pointercancel', endPan);
  elements.wrap.addEventListener('contextmenu', event => {
    if (event.button !== 2) return;
    event.preventDefault();
    if (event.target.closest('.node-card, .wire-hit')) return;
    openContextMenu(event.clientX, event.clientY, [
      { label: '▦  Открыть библиотеку блоков', action: () => {
        const wasCollapsed = $('.workspace').classList.contains('library-collapsed');
        $('.workspace').classList.remove('library-collapsed');
        localStorage.setItem('piv-mechanics-library-collapsed', 'false');
        $('.library-panel').setAttribute('aria-hidden', 'false');
        $('.library-resize').setAttribute('aria-hidden', 'false');
        if (wasCollapsed) {
          $('#collapse-library').textContent = '‹';
          $('#collapse-library').title = 'Свернуть блоки';
          $('#collapse-library').setAttribute('aria-label', 'Свернуть блоки');
        }
        if (window.innerWidth <= 780) $('.library-panel').classList.add('mobile-open');
        $('#block-search').focus();
      } },
      { label: '⌗  Вписать схему в окно', action: fitNodes },
      { label: '▤  Выровнять блоки по сетке', action: alignNodesToGrid },
      { label: '☑  Выделить все блоки', action: () => { setSelection(state.nodes.map(node => node.id)); render(); } }
    ], 'Рабочая область');
  });
  elements.wrap.addEventListener('wheel', event => {
    if (event.altKey) {
      event.preventDefault();
      elements.wrap.scrollLeft += event.deltaY || event.deltaX;
      return;
    }
    event.preventDefault();
    zoomAround(event.deltaY, event.clientX, event.clientY);
  }, { passive: false });
  elements.wrap.addEventListener('scroll', syncCanvasOverlays, { passive: true });
  window.addEventListener('resize', () => {
    if (window.innerWidth <= 780 && $('.workspace').classList.contains('library-collapsed')) {
      $('.workspace').classList.remove('library-collapsed');
      localStorage.setItem('piv-mechanics-library-collapsed', 'false');
      $('.library-panel').setAttribute('aria-hidden', 'false');
      $('.library-resize').setAttribute('aria-hidden', 'false');
      $('#collapse-library').textContent = '‹';
      $('#collapse-library').title = 'Свернуть блоки';
      $('#collapse-library').setAttribute('aria-label', 'Свернуть блоки');
    }
    syncCanvasOverlays();
  });
  for (const handle of $$('.panel-resize')) handle.addEventListener('pointerdown', resizeWorkspacePanel);
  for (const property of ['--library-width', '--inspector-width']) {
    const stored = localStorage.getItem(property);
    if (stored) $('.workspace').style.setProperty(property, stored);
  }
  elements.nodes.addEventListener('contextmenu', event => {
    if (!event.target.closest('.node-card')) return;
    event.preventDefault();
  });
  document.addEventListener('pointerdown', event => {
    if (!event.target.closest('#node-context-menu')) elements.contextMenu.hidden = true;
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('#node-context-menu')) elements.contextMenu.hidden = true;
  });
  document.addEventListener('keydown', event => {
    const editing = event.target.closest('input, textarea, select, [contenteditable="true"]');
    if ((event.ctrlKey || event.metaKey) && !editing && !elements.dialog.open &&
        event.key.toLowerCase() === 'z') {
      event.preventDefault();
      if (event.altKey) redo();
      else undo();
      return;
    }
    if (event.code === 'Space' && !event.target.closest('input, textarea, select, button')) {
      event.preventDefault();
      spaceDown = true;
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      $('#block-search').focus();
      setView('editor');
      if (window.innerWidth <= 780) $('.library-panel').classList.add('mobile-open');
    }
    if ((event.key === 'Delete' || event.key === 'Insert') && !editing && !elements.dialog.open) {
      const id = hoveredNodeId || selectedId;
      if (id) {
        event.preventDefault();
        if (selectedIds.size > 1 && selectedIds.has(id)) deleteSelectedNodes();
        else deleteNode(id);
      }
    }
    if (event.key === 'Escape' && elements.dialog.open) elements.dialog.close();
    if (event.key === 'Escape') elements.contextMenu.hidden = true;
  });
  document.addEventListener('keyup', event => { if (event.code === 'Space') spaceDown = false; });
  window.addEventListener('blur', () => { spaceDown = false; endPan({}); });

  if (localStorage.getItem('piv-mechanics-library-collapsed') === 'true' && window.innerWidth > 780) {
    $('.workspace').classList.add('library-collapsed');
    $('.library-panel').setAttribute('aria-hidden', 'true');
    $('.library-resize').setAttribute('aria-hidden', 'true');
    $('#collapse-library').textContent = '›';
    $('#collapse-library').title = 'Развернуть блоки';
    $('#collapse-library').setAttribute('aria-label', 'Развернуть блоки');
  }
  renderLibrary();
  syncWorldSize();
  render();
  updateGridControls();
  syncCanvasOverlays();
  if (window.ResizeObserver) {
    overlayResizeObserver = new ResizeObserver(syncCanvasOverlays);
    overlayResizeObserver.observe(elements.wrap);
  }
  requestAnimationFrame(fitNodes);
  void initAuth();
})();
