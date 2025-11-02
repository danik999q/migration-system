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

### Вариант 2: Supabase PostgreSQL

**Подробная инструкция:** См. файл [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

**ВАЖНО:** Для Vercel используйте Connection Pooler (Supavisor), а не прямой доступ к базе, так как Vercel не поддерживает IPv6, который использует Supabase для прямых подключений.

**Быстрая настройка:**
1. Перейдите на [supabase.com](https://supabase.com) и создайте проект
2. Перейдите в Settings → Database → Connection Pooling
3. Скопируйте Connection String (используйте режим "Transaction")
4. В Vercel добавьте переменную `DATABASE_URL` со значением connection string из Connection Pooler
5. В Supabase SQL Editor выполните SQL скрипт из `SUPABASE_SETUP.md` для создания таблиц

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
   - `DATABASE_URL` = строка подключения к PostgreSQL (для Neon: connection string из дашборда, для Supabase: Connection Pooler URI)
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
vercel env add DATABASE_URL
vercel env add FRONTEND_URL
```

## Важные замечания

⚠️ **Важно:**

1. **DATABASE_URL** - обязательно настройте перед деплоем
   - Для Neon PostgreSQL: используйте connection string из дашборда Neon
   - Для Supabase: **используйте Connection Pooler URI** (не прямой доступ!), так как Vercel не поддерживает IPv6
   - Формат: `postgresql://user:password@host:port/database` или `postgres://user:password@host:port/database`
   - **КРИТИЧЕСКИ ВАЖНО:** Замените все placeholder значения (xxxxx, [YOUR-PASSWORD]) на реальные!

2. **Сетевая безопасность** - для продакшена рекомендуется:
   - Использовать Connection Pooler для Supabase (поддерживает IPv4)
   - Использовать переменные окружения для всех секретов
   - Включить SSL/TLS подключения (включено по умолчанию)

3. **⚠️ ВРЕМЕННОЕ ХРАНИЛИЩЕ ФАЙЛОВ** - критическое ограничение:
   - Загруженные файлы сохраняются в `/tmp/uploads` (Vercel serverless functions)
   - **Файлы удаляются при каждом холодном старте функции и между запросами!**
   - **Текущая реализация НЕ подходит для продакшена** - файлы будут теряться
   - **Рекомендуется немедленно мигрировать на внешнее хранилище:**
     - Vercel Blob Storage (нативная интеграция)
     - AWS S3 (надежно и масштабируемо)
     - Cloudinary (бесплатный тариф для изображений)
   - **Без миграции файлового хранилища система не готова к продакшену!**

4. **Serverless Functions** - функции имеют ограничения:
   - Максимальное время выполнения: 30 секунд (на бесплатном плане)
   - Память: до 1024 MB
   - `/tmp` очищается между запросами

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
   - Neon PostgreSQL (рекомендуется) или Supabase PostgreSQL
   - Настройте резервное копирование
   - Включите мониторинг
   - Для Supabase используйте Connection Pooler (IPv4 совместимость с Vercel)

2. **⚠️ Хранилище файлов** - ОБЯЗАТЕЛЬНО перед продакшеном:
   - **Текущая реализация использует `/tmp/uploads`, что НЕ ПОДХОДИТ для продакшена**
   - Файлы удаляются при каждом холодном старте и между запросами
   - **Немедленно мигрируйте на одно из решений:**
     - Vercel Blob Storage (нативная интеграция, рекомендуется)
     - AWS S3 (надежно и масштабируемо)
     - Cloudinary (бесплатный тариф для изображений)
   - Без миграции файлового хранилища система НЕ готова к использованию

3. **Кеширование**:
   - Vercel KV (Redis)

4. **Безопасность**:
   - Используйте переменные окружения для всех секретов
   - Регулярно обновляйте зависимости
   - Настройте правильный CORS (FRONTEND_URL)
