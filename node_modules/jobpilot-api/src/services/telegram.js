const base = () => `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
export const enabled = () => !!process.env.TELEGRAM_BOT_TOKEN;

const post = (method, body) =>
  fetch(`${base()}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

export async function send(chatId, text, buttons) {
  if (!enabled() || !chatId) return;
  await post('sendMessage', {
    chat_id: chatId,
    text,
    reply_markup: buttons ? { inline_keyboard: [buttons] } : undefined,
  });
}

export const answer = (id, text) => enabled() && post('answerCallbackQuery', { callback_query_id: id, text });

// Long-polling loop so no public webhook URL is needed during development.
export async function poll(onUpdate) {
  if (!enabled()) return console.log('Telegram disabled (no TELEGRAM_BOT_TOKEN)');
  let offset = 0;
  for (;;) {
    try {
      const r = await fetch(`${base()}/getUpdates?timeout=30&offset=${offset}`);
      const d = await r.json();
      for (const u of d.result || []) {
        offset = u.update_id + 1;
        await onUpdate(u);
      }
    } catch (e) {
      console.error('telegram poll error:', e.message);
      await new Promise((res) => setTimeout(res, 5000));
    }
  }
}
