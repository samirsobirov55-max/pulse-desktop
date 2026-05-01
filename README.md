# ⚡ Pulse Messenger — Desktop & Mobile

Нативное приложение на базе Electron + React.
Подключается к вашему Pulse серверу на Hugging Face Spaces.

## 🚀 Быстрый старт (GitHub Actions)

```bash
# 1. Загрузить на GitHub
git init
git add .
git commit -m "Pulse Desktop v1.0"
git remote add origin https://github.com/ВАШ_НИК/pulse-desktop.git
git push -u origin main
```

Через ~10 минут в **Actions → Artifacts** появятся готовые файлы:
- `Pulse-Windows` → установщик .exe
- `Pulse-Linux`   → .AppImage
- `Pulse-Android` → .apk

## 📦 Создать релиз
```bash
git tag v1.0.0
git push origin v1.0.0
```

## ✨ Возможности
- 📨 Нативные уведомления о новых сообщениях
- 📞 Уведомление о звонке с кнопками **Принять / Отклонить** прямо в трее
- 🔔 Звуки: рингтон, гудок, пинг сообщения
- 🖥️ Работает в фоне (трей)
- 🔐 Все разрешения предоставляются автоматически
- 📱 APK для Android через Capacitor
