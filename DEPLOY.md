# Инструкция по деплою на Vercel

## Подготовка

1. Убедитесь, что у вас есть аккаунт на Vercel: https://vercel.com

2. Установите Vercel CLI (опционально):
```bash
npm i -g vercel
```

## Настройка базы данных

### Вариант 1: Neon PostgreSQL (Рекомендуется для Vercel)

Neon — это serverless PostgreSQL, оптимизированная для Vercel. Не имеет проблем с IPv6 и работает из коробки.

**Подробная инструкция:** См. файл [NEON_SETUP.md](./NEON_SETUP.md)

**Быстрая настройка:**
1. Перейдите на [neon.tech](https://neon.tech) и создайте проект
2. Скопируйте connection string из Neon
3. В Vercel добавьте переменную `DATABASE_URL` со значением connection string
4. В Neon SQL Editor выполните SQL скрипт из `NEON_SETUP.md` для создания таблиц

### Вариант 2: MongoDB Atlas

1. Перейдите на https://www.mongodb.com/cloud/atlas
2. Создайте бесплатный аккаунт (M0 Free Tier)
3. Создайте новый кластер (выберите бесплатный тариф M0)
4. Настройте доступ:
   - Перейдите в "Network Access"
   - Добавьте IP адрес: `0.0.0.0/0` (для доступа из любой точки, или укажите IP Vercel)
5. Создайте пользователя базы данных:
   - Перейдите в "Database Access"
   - Нажмите "Add New Database User"
   - Укажите username и password (сохраните их!)
6. Получите строку подключения:
   - Перейдите в "Database" → "Connect"
   - Выберите "Connect your application"
   - Скопируйте connection string
   - Замените `<password>` на ваш пароль: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`

### Вариант 2: Другой MongoDB хостинг

Используйте любую MongoDB совместимую базу данных (MongoDB Atlas, MongoDB Compass, локальный MongoDB и т.д.)

## Шаги деплоя через GitHub

### 1. Подготовка репозитория

1. Загрузите проект на GitHub

2. Убедитесь, что все файлы добавлены:
   - `api/` - папка с API routes
   - `frontend/` - папка с React приложением
   - `vercel.json` - конфигурация Vercel

### 2. Деплой через веб-интерфейс Vercel

1. Перейдите на https://vercel.com и авторизуйтесь

2. Нажмите "Add New Project"

3. Импортируйте ваш GitHub репозиторий

4. Настройте проект:
   - **Framework Preset**: Other
   - **Root Directory**: `.` (корень проекта)
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Output Directory**: `frontend/dist`
   - **Install Command**: `npm install && cd api && npm install && cd ../frontend && npm install`

5. Перейдите в раздел "Environment Variables" и добавьте:
   - `JWT_SECRET` = длинный случайный ключ (минимум 32 символа, например: `openssl rand -base64 32`)
   - `MONGODB_URI` = строка подключения к MongoDB (например: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/migration_system?retryWrites=true&w=majority`)
   - `MONGODB_DB_NAME` = имя базы данных (по умолчанию: `migration_system`)
   - `FRONTEND_URL` = `*` (разрешить все домены) или укажите ваш домен Vercel после деплоя (например: `https://migration-system.vercel.app`)
   
   **⚠️ ВАЖНО:** 
   - Локально используется `http://localhost:3000`
   - В Vercel нужно указать `*` или реальный домен Vercel
   - Не используйте `http://localhost:3000` в Vercel!

6. Нажмите "Deploy"

### 3. Деплой через Vercel CLI

1. Войдите в Vercel:
```bash
vercel login
```

2. Задеплойте проект:
```bash
vercel
```

3. При первом деплое укажите:
   - Link to existing project? → No
   - Project name → ваш проект
   - Directory → `.`

4. Добавьте переменные окружения:
```bash
vercel env add JWT_SECRET
vercel env add MONGODB_URI
vercel env add MONGODB_DB_NAME
vercel env add FRONTEND_URL
```

## Важные замечания

⚠️ **Важно:**

1. **MongoDB URI** - обязательно настройте перед деплоем
   - Формат: `mongodb+srv://username:password@cluster.xxxxx.mongodb.net/database_name?retryWrites=true&w=majority`
   - Замените `username`, `password`, `cluster.xxxxx` и `database_name` на ваши значения

2. **Сетевая безопасность** - для продакшена рекомендуется:
   - Ограничить доступ по IP в MongoDB Atlas
   - Использовать переменные окружения для секретов
   - Включить SSL/TLS подключения

3. **Файловое хранилище** - `/tmp` очищается при каждом холодном старте функции
   - Загруженные файлы не сохраняются между деплоями
   - **Рекомендуется** использовать внешнее хранилище:
     - Vercel Blob Storage
     - AWS S3
     - Cloudinary

4. **Serverless Functions** - функции имеют ограничения:
   - Максимальное время выполнения: 30 секунд (на бесплатном плане)
   - Память: до 1024 MB

## После деплоя

1. Откройте ваш сайт по адресу от Vercel
2. Зарегистрируйтесь с новым аккаунтом
3. Начните использовать систему

## Генерация JWT_SECRET

Для генерации безопасного ключа используйте:
```bash
# Linux/Mac:
openssl rand -base64 32

# Windows PowerShell:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

## Рекомендации для продакшена

Для реального использования рекомендуется:

1. **База данных**: 
   - MongoDB Atlas (бесплатный тариф M0 для начала)
   - Настройте резервное копирование
   - Включите мониторинг

2. **Хранилище файлов**:
   - Vercel Blob Storage (нативная интеграция)
   - AWS S3 (надежно и масштабируемо)
   - Cloudinary (бесплатный тариф для изображений)

3. **Кеширование**:
   - Vercel KV (Redis)

4. **Безопасность**:
   - Ограничьте доступ к MongoDB по IP
   - Используйте переменные окружения для всех секретов
   - Регулярно обновляйте зависимости
