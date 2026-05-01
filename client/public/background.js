// Pulse Background Runner
// Запускается каждые 15 минут когда приложение в фоне
addEventListener('syncData', async (resolve, reject, args) => {
  try {
    const token = await CapacitorKV.get('pulse_token');
    if (!token || !token.value) return resolve();

    const server = 'https://auragram-telegram-web.hf.space';

    // Проверяем новые сообщения
    const resp = await fetch(`${server}/api/notifications/unread`, {
      headers: { 'Authorization': `Bearer ${token.value}` }
    });

    if (!resp.ok) return resolve();
    const data = await resp.json();

    if (data.messages && data.messages.length > 0) {
      for (const msg of data.messages.slice(0, 3)) {
        await CapacitorNotifications.schedule({
          notifications: [{
            title: msg.senderName || 'Pulse',
            body: msg.content || '📎 Вложение',
            id: Math.floor(Math.random() * 100000),
            schedule: { at: new Date(Date.now() + 100) },
            sound: 'notification',
            smallIcon: 'ic_stat_icon_config_sample',
            iconColor: '#7C5CFC',
            extra: { chatId: msg.chatId },
          }]
        });
      }
    }

    resolve();
  } catch (e) {
    resolve();
  }
});
