# Переход на Supabase PostgreSQL

## Преимущества Supabase:
- ✅ Не требует настройки Network Access
- ✅ Быстрое подключение
- ✅ Бесплатный тариф
- ✅ Простая интеграция с Vercel
- ✅ Автоматические резервные копии

## Шаг 1: Создание проекта Supabase

1. Перейдите на https://supabase.com
2. Создайте аккаунт (бесплатно)
3. Нажмите "New Project"
4. Заполните:
   - **Name**: migration-system
   - **Database Password**: создайте надежный пароль (сохраните!)
   - **Region**: выберите ближайший к вам
5. Нажмите "Create new project"
6. Подождите 2-3 минуты, пока проект создается

## Шаг 2: Получение Connection String

**ВАЖНО:** Убедитесь, что проект Supabase полностью создан и активен!

### Для Vercel (ОБЯЗАТЕЛЬНО): Используйте Connection Pooler (Supavisor)

**КРИТИЧЕСКИ ВАЖНО:** Vercel не поддерживает IPv6, а Supabase использует IPv6 для прямых подключений. Нужно использовать **Connection Pooler (Supavisor)**, который поддерживает IPv4!

1. В проекте Supabase перейдите в **Settings** → **Database**
2. Найдите секцию **Connection string**
3. **ОБЯЗАТЕЛЬНО выберите вкладку "Connection pooling"** (НЕ Session mode!)
4. Выберите режим: **Transaction mode** или **Session mode** (оба работают с pooler)
5. Скопируйте строку подключения — она должна быть в формате:
   ```
   postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
   ИЛИ
   ```
   postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
   
   **Hostname должен содержать `.pooler.supabase.com`** (НЕ `db.*.supabase.co`!)

6. **НЕ используйте прямое подключение** (`db.xxxxx.supabase.co`) — оно не работает с Vercel из-за IPv6!

6. **КРИТИЧЕСКИ ВАЖНО:**
   - Замените `[YOUR-PASSWORD]` на ваш **реальный пароль** из Supabase
   - Если в пароле есть спецсимволы, **URL-encode их**:
     - `@` → `%40`
     - `:` → `%3A`
     - `#` → `%23`
     - `/` → `%2F`
     - `?` → `%3F`
     - `&` → `%26`
     - `=` → `%3D`
     - пробел → `%20`
   
7. **Проверьте формат:**
   - Должен начинаться с `postgresql://` или `postgres://`
   - Должен содержать реальный hostname (не `xxxxx` или `example`)
   - Hostname должен быть либо `*.pooler.supabase.com` либо `db.*.supabase.co`
   - Пароль должен быть URL-encoded если нужен

8. **Если получаете ENOTFOUND ошибку:**
   - **ГЛАВНАЯ ПРИЧИНА:** Используется прямое подключение (`db.*.supabase.co`) вместо Connection Pooler
   - **РЕШЕНИЕ:** Обязательно используйте Connection Pooler (hostname с `.pooler.supabase.com`)
   - Проверьте, что проект Supabase **активен** (не приостановлен)
   - Убедитесь, что проект полностью создан (подождите 2-3 минуты после создания)
   - Попробуйте обновить connection string в Supabase Dashboard

**Почему ENOTFOUND?**
- Supabase использует IPv6 для прямых подключений (`db.*.supabase.co`)
- Vercel не поддерживает IPv6 для PostgreSQL подключений
- **Решение:** Используйте Connection Pooler (`.pooler.supabase.com`), который поддерживает IPv4

## Шаг 3: Создание таблиц

В Supabase перейдите в **SQL Editor** и выполните следующий SQL:

```sql
-- Создание таблицы users
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Создание таблицы people
CREATE TABLE IF NOT EXISTS people (
  id VARCHAR(255) PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  middle_name VARCHAR(255),
  date_of_birth VARCHAR(255),
  nationality VARCHAR(255),
  passport_number VARCHAR(255),
  phone VARCHAR(255),
  email VARCHAR(255),
  address TEXT,
  status VARCHAR(255) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Создание таблицы documents
CREATE TABLE IF NOT EXISTS documents (
  id VARCHAR(255) PRIMARY KEY,
  person_id VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(255) NOT NULL,
  size BIGINT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE
);

-- Создание индексов
CREATE INDEX IF NOT EXISTS idx_people_person_id ON documents(person_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_people_status ON people(status);
```

## Шаг 4: Настройка переменных окружения в Vercel

**ОБЯЗАТЕЛЬНО:** Используйте Connection Pooler для Vercel!

В Vercel Dashboard → Settings → Environment Variables добавьте:

**Connection Pooler (ОБЯЗАТЕЛЬНО для Vercel):**
```
DATABASE_URL=postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
```

ИЛИ без параметра:
```
DATABASE_URL=postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
```

**Другие переменные:**
```
JWT_SECRET=ваш-длинный-случайный-ключ-минимум-32-символа
FRONTEND_URL=*
```

**Важно:** 
- **НЕ используйте прямое подключение** (`db.*.supabase.co`) — оно не работает с Vercel!
- Hostname должен содержать `.pooler.supabase.com` (НЕ `db.*.supabase.co`)
- Замените `[YOUR-PASSWORD]` на реальный пароль из Supabase
- Если в пароле есть спецсимволы, URL-encode их
- После изменения переменных **передеплойте проект**

## Шаг 5: Передеплой

После обновления кода и переменных окружения, передеплойте проект в Vercel.

