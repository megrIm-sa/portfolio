# Game Developer Portfolio (GitHub Pages)

Простой статический сайт-портфолио с разделами:

- About me
- Проекты
- Новости из Telegram-канала `t.me/megrIm_games`

## Стек

- HTML5
- CSS3
- Vanilla JavaScript

Выбран, потому что GitHub Pages отлично хостит статические сайты без сборки и серверной части.

## Запуск локально

Откройте `index.html` в браузере.

## Публикация на GitHub Pages

1. Создайте репозиторий на GitHub.
2. Загрузите файлы проекта в ветку `main`.
3. Откройте настройки репозитория: `Settings -> Pages`.
4. В `Build and deployment` выберите:
   - `Source`: `Deploy from a branch`
   - `Branch`: `main` и папку `/ (root)`
5. Сохраните настройки и дождитесь публикации.

## Важная заметка по новостям Telegram

Сайт читает новости из локального файла `news.json`, который обновляется через GitHub Actions каждые 30 минут.

Это стабильнее, чем клиентские CORS-запросы из браузера.

### Как работает обновление

- Workflow: `.github/workflows/update-news.yml`
- Скрипт: `scripts/update_news.py`
- Приоритет источников:
  1. Telegram RSS (`rsshub.rssforever.com` -> `rsshub.app`)
  2. Fallback на X/Twitter (`rsshub...` и `nitter`)

Если обновление прошло успешно, workflow автоматически коммитит новый `news.json`.

## Скриншоты проектов

Для каждой игры есть отдельная папка:

- `assets/projects/death-warrant/`
- `assets/projects/symbionts/`
- `assets/projects/hack-the-hacker/`

Карусель автоматически ищет изображения с именами `1..6` и расширениями:
`.jpg`, `.jpeg`, `.png`, `.webp` (например `1.jpg`, `2.png`, `3.webp`).
