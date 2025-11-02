# Настройка Neon PostgreSQL

Neon — это serverless PostgreSQL база данных, оптимизированная для Vercel. Она полностью совместима с PostgreSQL и не имеет проблем с IPv6.

## Шаг 1: Создание проекта Neon

1. Перейдите на [neon.tech](https://neon.tech)
2. Зарегистрируйтесь или войдите в аккаунт
3. Нажмите "Create a project"
4. Заполните:
   - **Project name**: название проекта (например, "migration-system")
   - **Region**: выберите ближайший регион
   - **PostgreSQL version**: оставьте по умолчанию (15 или 16)
5. Нажмите "Create project"
6. Подождите 10-20 секунд, пока проект создается

## Шаг 2: Получение Connection String

1. После создания проекта вы автоматически увидите **Connection string**
2. Скопируйте строку подключения — она будет в формате:
   ```
   postgresql://[username]:[password]@[hostname]/[database]?sslmode=require
   ```
   ИЛИ (более короткая версия):
   ```
   postgres://[username]:[password]@[hostname]/[database]?sslmode=require
   ```

3. **Пример реального connection string:**
   ```
   postgresql://neondb_owner:npg_abc123XYZ@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

4. **КРИТИЧЕСКИ ВАЖНО:**
   - Neon автоматически генерирует безопасный пароль
   - Пароль уже URL-encoded, если нужен
   - Connection string уже содержит `sslmode=require` для безопасного подключения

5. **Если нужно показать пароль:**
   - Нажмите "Show password" рядом с connection string
   - Пароль будет автоматически скопирован

## Шаг 3: Создание таблиц

В Neon перейдите в **SQL Editor** и выполните следующий SQL:

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

В Vercel Dashboard → Settings → Environment Variables:

### Если переменная DATABASE_URL уже существует:

1. Найдите переменную `DATABASE_URL` в списке
2. Нажмите на неё для редактирования
3. Замените значение на connection string от Neon:
   ```
   postgresql://[username]:[password]@[hostname]/[database]?sslmode=require
   ```
4. Выберите окружения (Production, Preview, Development) где нужно применить
5. Сохраните изменения

### Если переменной DATABASE_URL нет:

1. Нажмите "Add New" → "Environment Variable"
2. Имя: `DATABASE_URL`
3. Значение: connection string от Neon
4. Выберите окружения (Production, Preview, Development)
5. Сохраните

### Другие переменные:

Убедитесь, что также установлены:
```
JWT_SECRET=ваш-длинный-случайный-ключ-минимум-32-символа
FRONTEND_URL=*
```

**Важно:** 
- Скопируйте **полный** connection string из Neon (он уже содержит все нужные параметры)
- Neon автоматически URL-encodит пароль, если нужно
- Connection string уже содержит `?sslmode=require` для SSL
- После изменения переменных **передеплойте проект**

## Шаг 5: Передеплой

После обновления кода и переменных окружения, передеплойте проект в Vercel.

## Преимущества Neon

✅ **Работает с Vercel из коробки** — нет проблем с IPv6  
✅ **Автоматическое масштабирование** — scale-to-zero когда не используется  
✅ **Быстрое создание** — проект создается за 10-20 секунд  
✅ **Ветки баз данных** — можно создавать изолированные копии для тестирования  
✅ **Бесплатный план** — достаточен для большинства проектов  
✅ **Стандартный PostgreSQL** — полная совместимость с PostgreSQL

## Troubleshooting

### Если получаете ошибку подключения:

1. **Проверьте connection string:**
   - Убедитесь, что скопировали **полный** connection string из Neon
   - Connection string должен начинаться с `postgresql://` или `postgres://`
   - Убедитесь, что содержит `?sslmode=require`

2. **Проверьте переменные окружения в Vercel:**
   - Убедитесь, что `DATABASE_URL` установлен правильно
   - После изменения переменных передеплойте проект

3. **Проверьте проект Neon:**
   - Убедитесь, что проект **активен** (не приостановлен)
   - Проект не должен быть удален

4. **Проверьте таблицы:**
   - Убедитесь, что выполнили SQL скрипт для создания таблиц
   - Проверьте в SQL Editor, что таблицы существуют

## Интеграция с Vercel (опционально)

Neon можно интегрировать с Vercel через Vercel Marketplace:

1. Перейдите в Vercel Dashboard → ваш проект
2. Нажмите "Add Integration" → найдите "Neon"
3. Следуйте инструкциям для автоматической настройки

Это автоматически создаст переменную `DATABASE_URL` в Vercel.

