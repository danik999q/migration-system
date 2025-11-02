# Решение проблем с подключением к MongoDB Atlas

## Проблема: Connection Timeout

Если вы видите ошибку "Connection timeout", это означает, что Vercel не может подключиться к MongoDB Atlas.

### Проверьте следующие настройки:

#### 1. Network Access в MongoDB Atlas

**КРИТИЧЕСКИ ВАЖНО:**

1. Откройте [MongoDB Atlas Dashboard](https://cloud.mongodb.com/)
2. Перейдите в **Security** → **Network Access**
3. Убедитесь, что добавлен IP адрес: `0.0.0.0/0` с комментарием "Allow Vercel"
4. Статус должен быть **Active** (зелёная галочка)
5. Если правила нет, нажмите **"Add IP Address"** → выберите **"Allow Access from Anywhere"** или введите `0.0.0.0/0`
6. **ПОДОЖДИТЕ 1-2 минуты** после добавления правила - MongoDB Atlas применяет изменения

#### 2. Database Access в MongoDB Atlas

1. Перейдите в **Security** → **Database Access**
2. Убедитесь, что пользователь существует
3. Права должны быть **"Atlas Admin"** или **"Read and write to any database"**
4. Если пользователя нет, создайте:
   - Нажмите **"Add New Database User"**
   - Username: ваш username
   - Password: сгенерируйте надёжный пароль
   - **ВАЖНО:** Сохраните пароль, он нужен для Connection String!

#### 3. Connection String

**Формат:**
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/migration_system?retryWrites=true&w=majority
```

**Проверьте:**
- Username и password правильные
- Если в пароле есть спецсимволы, URL-encode их:
  - `@` → `%40`
  - `:` → `%3A`
  - `#` → `%23`
  - `/` → `%2F`
  - `?` → `%3F`
  - `&` → `%26`
  - `=` → `%3D`
- Имя базы данных указано в URI (перед `?`): `/migration_system`

#### 4. Переменные окружения в Vercel

1. Откройте Vercel Dashboard → ваш проект
2. Перейдите в **Settings** → **Environment Variables**
3. Убедитесь, что установлены:
   - `MONGODB_URI` - полная строка подключения
   - `MONGODB_DB_NAME` - имя базы данных (по умолчанию: `migration_system`)
   - `JWT_SECRET` - секретный ключ
   - `FRONTEND_URL` - `*` или ваш домен

4. **Проверьте формат:**
   - Нет лишних пробелов в начале/конце
   - Правильный формат URI
   - Пароль URL-encoded если нужен

5. После изменения переменных **передеплойте проект**

#### 5. Тест подключения

Попробуйте подключиться локально:

```bash
cd backend
npm install
npm run test-db
```

Если локально работает, а на Vercel нет - проблема в Network Access.

### Частые ошибки:

1. **Не добавили IP 0.0.0.0/0** в Network Access
2. **Пароль не URL-encoded** - спецсимволы вызывают ошибки
3. **Не подождали** 1-2 минуты после изменения Network Access
4. **Неправильный формат URI** - проверьте, что всё правильно скопировано
5. **Пользователь не имеет прав** - проверьте Database Access

### Дополнительная информация:

Если проблема остаётся:

1. Проверьте логи в MongoDB Atlas → **Monitoring** → **Real-Time Performance**
2. Проверьте логи в Vercel → **Functions** → **Logs**
3. Убедитесь, что кластер активен и не заморожен

