import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type Language = 'ru' | 'en';

interface TranslationDictionary {
  [key: string]: string | TranslationDictionary;
}

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LANGUAGE_STORAGE_KEY = 'migration-app-language';

const translations: Record<Language, TranslationDictionary> = {
  ru: {
    header: {
      title: 'Система управления миграцией',
      people: 'Люди',
      users: 'Пользователи',
      logout: 'Выйти',
      themeToggleLight: 'Переключить на тёмную тему',
      themeToggleDark: 'Переключить на светлую тему',
      language: 'Язык',
    },
    search: {
      placeholder: 'Поиск по имени, фамилии, номеру паспорта или email…',
      addPerson: 'Добавить человека',
    },
    empty: {
      loadingTitle: 'Загружаем данные…',
      loadingMessage: 'Пожалуйста, подождите, мы уже получаем список людей.',
      notFoundTitle: 'Ничего не найдено',
      notFoundMessage: 'Попробуйте уточнить запрос — поиск работает по имени, фамилии, паспорту и email.',
      noDataTitle: 'Пока нет данных',
      noDataMessage: 'Добавьте первую запись, чтобы начать вести базу клиентов.',
    },
    auth: {
      checkingTitle: 'Проверяем доступ…',
      checkingMessage: 'Готовим окружение и проверяем токен авторизации.',
      loggedOut: 'Вы вышли из аккаунта.',
      loginTitle: 'Вход в систему',
      registerTitle: 'Создание аккаунта',
      username: 'Имя пользователя',
      password: 'Пароль',
      loginButton: 'Войти',
      registerButton: 'Зарегистрироваться',
      processing: 'Обрабатываем…',
      toggleToLogin: 'Уже есть аккаунт? Войти',
      toggleToRegister: 'Нет аккаунта? Создать',
      usernameRequired: 'Введите имя пользователя.',
      usernameShort: 'Имя пользователя должно быть не короче 3 символов.',
      passwordRequired: 'Введите пароль.',
      passwordShort: 'Пароль должен быть не короче 6 символов.',
      registerSuccess: 'Аккаунт создан. Добро пожаловать!',
      loginSuccess: 'Вы вошли в систему.',
      manyAttempts: 'Слишком много попыток. Повторите через {minutes} минут.',
      timeout: 'Сервер долго отвечает. Попробуйте ещё раз чуть позже.',
      serverError: 'На сервере произошла ошибка. Мы уже разбираемся.',
      aborted: 'Время ожидания истекло. Проверьте соединение и повторите.',
      unknown: 'Не удалось завершить запрос. Попробуйте ещё раз.',
      unexpected: 'Произошла неизвестная ошибка.',
    },
    toast: {
      loadPeopleFailed: 'Не удалось загрузить список людей. Попробуйте обновить страницу.',
      personCreated: 'Человек добавлен в список.',
      personUpdated: 'Данные человека обновлены.',
      personDeleted: 'Запись удалена.',
      personSaveFailed: 'Не удалось сохранить данные. Попробуйте ещё раз.',
      personDeleteFailed: 'Не удалось удалить запись. Попробуйте ещё раз.',
      statusUpdated: 'Статус обновлён.',
      statusFailed: 'Не удалось обновить статус. Попробуйте ещё раз.',
      documentsLoadFailed: 'Документы не загрузились. Попробуйте ещё раз.',
      documentUploaded: 'Документ загружен.',
      documentDeleted: 'Документ удалён.',
      documentUploadFailed: 'Не получилось загрузить документ. Попробуйте ещё раз.',
      documentPreviewFailed: 'Предпросмотр не открылся. Попробуйте ещё раз.',
      documentDeleteFailed: 'Удалить документ не получилось. Попробуйте ещё раз.',
      documentDownloadStart: 'Загрузка началась.',
      documentDownloadFailed: 'Не получилось скачать документ. Попробуйте ещё раз.',
      userRoleUpdated: 'Роль пользователя обновлена.',
      userRoleFailed: 'Не удалось обновить роль пользователя.',
      imagePreviewFailed: 'Не удалось открыть изображение.',
    },
    confirm: {
      deletePerson: 'Удалить этого человека? Действие нельзя отменить.',
      deleteDocument: 'Удалить этот документ? Действие нельзя отменить.',
      deleteRecord: 'Удалить эту запись? Действие нельзя отменить.',
    },
    status: {
      new: 'Новый',
      pending: 'Ожидание',
      processing: 'В обработке',
      approved: 'Одобрен',
      rejected: 'Отклонён',
    },
    documents: {
      sectionTitle: 'Загрузите документ',
      sectionSubtitle: 'PDF, DOC(X) или изображение — не более 10 МБ.',
      button: 'Выбрать файл',
      hint: 'Перетащите файл в область загрузки или воспользуйтесь кнопкой.',
      uploading: ' Загружаем…',
      emptyTitle: 'Документов пока нет',
      emptyMessage: 'Добавьте первый файл или перетащите его выше.',
      open: 'Открыть',
      download: 'Скачать',
      delete: 'Удалить',
      loadingTitle: 'Загружаем документы…',
      loadingMessage: 'Ещё пара секунд — и список файлов будет готов.',
      fileTooLarge: 'Размер файла не должен превышать 10 МБ.',
      imageLoading: 'Загрузка изображения…',
      previewAlt: 'Предпросмотр документа',
      dropTitle: 'Загрузка изображения…',
    },
    forms: {
      firstName: 'Имя',
      lastName: 'Фамилия',
      middleName: 'Отчество',
      dateOfBirth: 'Дата рождения',
      nationality: 'Гражданство',
      passport: 'Номер паспорта',
      phone: 'Телефон',
      email: 'Email',
      address: 'Адрес',
      status: 'Статус',
      notes: 'Примечания',
      firstNameRequired: 'Укажите имя.',
      lastNameRequired: 'Укажите фамилию.',
      statusRequired: 'Выберите статус.',
      emailInvalid: 'Введите корректный email.',
      phoneInvalid: 'Телефон должен содержать не менее 10 цифр.',
      passportInvalid: 'Номер паспорта слишком короткий.',
      notesPlaceholder: 'Дополнительные детали — например, серия документов или комментарии по кейсу',
      firstNamePlaceholder: 'Например, Иван',
      lastNamePlaceholder: 'Например, Петров',
      middleNamePlaceholder: 'Если есть',
      nationalityPlaceholder: 'Например, Казахстан',
      phonePlaceholder: '+7 (999) 123-45-67',
      addressPlaceholder: 'Страна, город, улица',
      saveError: 'Исправьте ошибки в форме, чтобы продолжить.',
      cancel: 'Отмена',
      save: 'Сохранить',
      create: 'Добавить',
      editPersonTitle: 'Редактирование человека',
      createPersonTitle: 'Новый человек',
    },
    users: {
      title: 'Управление пользователями',
      counter: 'Всего: {total} · Администраторов: {admins}',
      refresh: 'Обновить список',
      loadingTitle: 'Загружаем пользователей…',
      loadingMessage: 'Подождите секунду — подтягиваем список из базы.',
      loadFailed: 'Не удалось загрузить пользователей. Попробуйте ещё раз.',
      errorTitle: 'Не получилось загрузить пользователей',
      emptyTitle: 'Пользователи ещё не добавлены',
      emptyMessage: 'Создайте первый аккаунт через форму регистрации или API.',
      roleLabel: 'Текущая роль:',
      roleUser: 'Пользователь',
      roleAdmin: 'Администратор',
      makeUser: 'Сделать пользователем',
      makeAdmin: 'Сделать администратором',
      retry: 'Повторить попытку',
      id: 'ID: {id}',
      createdAt: 'Создан: {date}',
    },
    personCard: {
      edit: 'Редактировать',
      toggleDocuments: 'Документы ({count})',
      hideDocuments: 'Скрыть документы',
      delete: 'Удалить',
    },
  },
  en: {
    header: {
      title: 'Migration Management System',
      people: 'People',
      users: 'Users',
      logout: 'Sign out',
      themeToggleLight: 'Switch to dark theme',
      themeToggleDark: 'Switch to light theme',
      language: 'Language',
    },
    search: {
      placeholder: 'Search by name, surname, passport number or email…',
      addPerson: 'Add person',
    },
    empty: {
      loadingTitle: 'Loading data…',
      loadingMessage: 'Fetching the people list, please wait a moment.',
      notFoundTitle: 'Nothing found',
      notFoundMessage: 'Try refining your query — we search by name, surname, passport and email.',
      noDataTitle: 'No records yet',
      noDataMessage: 'Add the first record to start building the client database.',
    },
    auth: {
      checkingTitle: 'Checking access…',
      checkingMessage: 'Preparing environment and validating the auth token.',
      loggedOut: 'You signed out.',
      loginTitle: 'Sign in',
      registerTitle: 'Create account',
      username: 'Username',
      password: 'Password',
      loginButton: 'Sign in',
      registerButton: 'Register',
      processing: 'Processing…',
      toggleToLogin: 'Already have an account? Sign in',
      toggleToRegister: "Don't have an account? Create one",
      usernameRequired: 'Enter a username.',
      usernameShort: 'Username must be at least 3 characters long.',
      passwordRequired: 'Enter a password.',
      passwordShort: 'Password must be at least 6 characters long.',
      registerSuccess: 'Account created. Welcome!',
      loginSuccess: 'Signed in successfully.',
      manyAttempts: 'Too many attempts. Try again in {minutes} minutes.',
      timeout: 'Server takes too long to respond. Please try again later.',
      serverError: 'Server error. We are already on it.',
      aborted: 'Request timed out. Check your connection and retry.',
      unknown: 'Request failed. Please try again.',
      unexpected: 'Unexpected error occurred.',
    },
    toast: {
      loadPeopleFailed: 'Could not load people list. Please refresh the page.',
      personCreated: 'Person added to the list.',
      personUpdated: 'Person details updated.',
      personDeleted: 'Record deleted.',
      personSaveFailed: 'Could not save data. Please try again.',
      personDeleteFailed: 'Could not delete the record. Please try again.',
      statusUpdated: 'Status updated.',
      statusFailed: 'Could not update the status. Please try again.',
      documentsLoadFailed: 'Documents failed to load. Please try again.',
      documentUploaded: 'Document uploaded.',
      documentDeleted: 'Document deleted.',
      documentUploadFailed: 'Failed to upload document. Please try again.',
      documentPreviewFailed: 'Could not open document preview. Please try again.',
      documentDeleteFailed: 'Failed to delete document. Please try again.',
      documentDownloadStart: 'Download started.',
      documentDownloadFailed: 'Failed to download document. Please try again.',
      userRoleUpdated: 'User role updated.',
      userRoleFailed: 'Failed to update user role.',
      imagePreviewFailed: 'Failed to open image preview.',
    },
    confirm: {
      deletePerson: 'Delete this person? This action cannot be undone.',
      deleteDocument: 'Delete this document? This action cannot be undone.',
      deleteRecord: 'Delete this record? This action cannot be undone.',
    },
    status: {
      new: 'New',
      pending: 'Pending',
      processing: 'Processing',
      approved: 'Approved',
      rejected: 'Rejected',
    },
    documents: {
      sectionTitle: 'Upload a document',
      sectionSubtitle: 'PDF, DOC(X) or image — up to 10 MB.',
      button: 'Choose file',
      hint: 'Drag & drop a file here or use the button.',
      uploading: ' Uploading…',
      emptyTitle: 'No documents yet',
      emptyMessage: 'Add the first file or drop it above.',
      open: 'Open',
      download: 'Download',
      delete: 'Delete',
      loadingTitle: 'Loading documents…',
      loadingMessage: 'Just a moment — fetching the file list.',
      fileTooLarge: 'File size must not exceed 10 MB.',
      imageLoading: 'Loading image…',
      previewAlt: 'Document preview',
      dropTitle: 'Loading image…',
    },
    forms: {
      firstName: 'First name',
      lastName: 'Last name',
      middleName: 'Middle name',
      dateOfBirth: 'Date of birth',
      nationality: 'Nationality',
      passport: 'Passport number',
      phone: 'Phone',
      email: 'Email',
      address: 'Address',
      status: 'Status',
      notes: 'Notes',
      firstNameRequired: 'Please enter a first name.',
      lastNameRequired: 'Please enter a last name.',
      statusRequired: 'Please select a status.',
      emailInvalid: 'Enter a valid email address.',
      phoneInvalid: 'Phone number must contain at least 10 digits.',
      passportInvalid: 'Passport number is too short.',
      notesPlaceholder: 'Additional details — e.g. document series or case notes',
      firstNamePlaceholder: 'e.g., John',
      lastNamePlaceholder: 'e.g., Smith',
      middleNamePlaceholder: 'Optional',
      nationalityPlaceholder: 'e.g., Canada',
      phonePlaceholder: '+1 (555) 123-4567',
      addressPlaceholder: 'Country, city, street',
      saveError: 'Fix the form errors to continue.',
      cancel: 'Cancel',
      save: 'Save',
      create: 'Add',
      editPersonTitle: 'Edit person',
      createPersonTitle: 'New person',
    },
    users: {
      title: 'User management',
      counter: 'Total: {total} · Admins: {admins}',
      refresh: 'Refresh list',
      loadingTitle: 'Loading users…',
      loadingMessage: 'Hold on — fetching the list from the database.',
      loadFailed: 'Failed to load users. Please try again.',
      errorTitle: 'Failed to load users',
      emptyTitle: 'No users yet',
      emptyMessage: 'Create an account via registration form or API.',
      roleLabel: 'Current role:',
      roleUser: 'User',
      roleAdmin: 'Administrator',
      makeUser: 'Set as user',
      makeAdmin: 'Set as admin',
      retry: 'Retry',
      id: 'ID: {id}',
      createdAt: 'Created: {date}',
    },
    personCard: {
      edit: 'Edit',
      toggleDocuments: 'Documents ({count})',
      hideDocuments: 'Hide documents',
      delete: 'Delete',
    },
  },
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const findTranslation = (key: string, language: Language): string | undefined => {
  return key.split('.').reduce<string | TranslationDictionary | undefined>((acc, segment) => {
    if (typeof acc === 'string' || acc === undefined) {
      return acc as string | undefined;
    }
    return acc[segment as keyof TranslationDictionary];
  }, translations[language]) as string | undefined;
};

const normalizePlaceholders = (template: string, params?: Record<string, string | number>) => {
  if (!params) {
    return template;
  }
  return Object.entries(params).reduce((acc, [key, value]) => acc.replace(`{${key}}`, String(value)), template);
};

const getInitialLanguage = (): Language => {
  if (typeof window === 'undefined') {
    return 'ru';
  }
  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored === 'ru' || stored === 'en') {
    return stored;
  }
  const browserLang = window.navigator.language.slice(0, 2).toLowerCase();
  return browserLang === 'en' ? 'en' : 'ru';
};

export const LanguageProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const translation = findTranslation(key, language);
      if (translation) {
        return normalizePlaceholders(translation, params);
      }
      return key;
    },
    [language]
  );

  const value = useMemo<LanguageContextValue>(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new ReferenceError('useTranslation must be used within LanguageProvider');
  }
  return context;
};
