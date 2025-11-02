import React, { useEffect, useMemo, useState } from 'react';
import { api, Person } from './services/api';
import { authService } from './services/auth';
import PersonCard from './components/PersonCard';
import PersonModal from './components/PersonModal';
import Login from './components/Login';
import UsersManagement from './components/UsersManagement';
import { useToast } from './components/ToastProvider';
import { Language, useTranslation } from './components/LanguageProvider';
import './index.css';

type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'migration-app-theme';

const LANGUAGE_OPTIONS: Array<{ value: Language; label: string }> = [
  { value: 'ru', label: 'RU' },
  { value: 'en', label: 'EN' },
];

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const App: React.FC = () => {
  const { showToast } = useToast();
  const { t, language, setLanguage } = useTranslation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [people, setPeople] = useState<Person[]>([]);
  const [filteredPeople, setFilteredPeople] = useState<Person[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<'people' | 'users'>('people');
  const [isAdmin, setIsAdmin] = useState(false);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    const initialTheme = getInitialTheme();
    setTheme(initialTheme);
    document.body.setAttribute('data-theme', initialTheme);
  }, []);

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = authService.isAuthenticated();
      const admin = authService.isAdmin();
      setIsAuthenticated(authenticated);
      setIsAdmin(admin);
      setCheckingAuth(false);
      if (authenticated) {
        await loadPeople();
      }
    };

    void checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const normalizedFilter = searchTerm.trim().toLowerCase();
    if (!normalizedFilter) {
      setFilteredPeople(people);
      return;
    }

    const nextFiltered = people.filter((person) =>
      [person.firstName, person.lastName, person.middleName, person.passportNumber, person.email]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedFilter))
    );

    setFilteredPeople(nextFiltered);
  }, [people, searchTerm]);

  const loadPeople = async () => {
    try {
      setLoading(true);
      const data = await api.people.getAll();
      setPeople(data);
      setFilteredPeople(data);
    } catch (error) {
      console.error('Failed to load people:', error);
      showToast({ type: 'error', message: t('toast.loadPeopleFailed') });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
    setIsAdmin(authService.isAdmin());
    void loadPeople();
  };

  const handleLogout = () => {
    authService.removeToken();
    setIsAuthenticated(false);
    setPeople([]);
    setFilteredPeople([]);
    showToast({ type: 'info', message: t('auth.loggedOut') });
  };

  const handleCreatePerson = () => {
    setSelectedPerson(null);
    setIsModalOpen(true);
  };

  const handleEditPerson = (person: Person) => {
    setSelectedPerson(person);
    setIsModalOpen(true);
  };

  const handleSavePerson = async (personData: Omit<Person, 'id' | 'createdAt' | 'updatedAt'> | Person) => {
    try {
      if (selectedPerson) {
        await api.people.update(selectedPerson.id, personData as Partial<Person>);
        showToast({ type: 'success', message: t('toast.personUpdated') });
      } else {
        await api.people.create(personData as Omit<Person, 'id' | 'createdAt' | 'updatedAt'>);
        showToast({ type: 'success', message: t('toast.personCreated') });
      }
      setIsModalOpen(false);
      setSelectedPerson(null);
      await loadPeople();
    } catch (error) {
      console.error('Failed to save person:', error);
      showToast({ type: 'error', message: t('toast.personSaveFailed') });
    }
  };

  const handleDeletePerson = async (id: string) => {
    const confirmed = window.confirm(t('confirm.deleteRecord'));
    if (!confirmed) {
      return;
    }

    try {
      await api.people.delete(id);
      showToast({ type: 'success', message: t('toast.personDeleted') });
      await loadPeople();
    } catch (error) {
      console.error('Failed to delete person:', error);
      showToast({ type: 'error', message: t('toast.personDeleteFailed') });
    }
  };

  const handleStatusChange = async (personId: string, newStatus: string) => {
    try {
      await api.status.update(personId, newStatus);
      await loadPeople();
      showToast({ type: 'success', message: t('toast.statusUpdated') });
    } catch (error) {
      console.error('Failed to update status:', error);
      showToast({ type: 'error', message: t('toast.statusFailed') });
    }
  };

  const themeLabel = useMemo(
    () => t(theme === 'light' ? 'header.themeToggleLight' : 'header.themeToggleDark'),
    [theme, t]
  );
  const themeIcon = theme === 'light' ? '🌙' : '☀️';

  const renderPeople = () => {
    if (loading) {
      return (
        <div className="empty-state">
          <div className="spinner" />
          <h3>{t('empty.loadingTitle')}</h3>
          <p>{t('empty.loadingMessage')}</p>
        </div>
      );
    }

    if (filteredPeople.length === 0) {
      const icon = searchTerm ? '🔍' : '📭';
      const title = searchTerm ? t('empty.notFoundTitle') : t('empty.noDataTitle');
      const message = searchTerm ? t('empty.notFoundMessage') : t('empty.noDataMessage');
      return (
        <div className="empty-state">
          <div style={{ fontSize: '3.3rem', marginBottom: '16px' }}>{icon}</div>
          <h3>{title}</h3>
          <p>{message}</p>
          {!searchTerm && isAdmin && (
            <button className="btn btn-primary" onClick={handleCreatePerson}>
              <span style={{ fontSize: '1.25rem' }}>+</span>
              {t('search.addPerson')}
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="grid">
        {filteredPeople.map((person) => (
          <PersonCard
            key={person.id}
            person={person}
            onEdit={handleEditPerson}
            onDelete={handleDeletePerson}
            onStatusChange={handleStatusChange}
          />
        ))}
      </div>
    );
  };

  if (checkingAuth) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="empty-state" style={{ maxWidth: 360 }}>
          <div className="spinner" />
          <h3>{t('auth.checkingTitle')}</h3>
          <p>{t('auth.checkingMessage')}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div>
      <header className="header">
        <div className="container">
          <h1>{t('header.title')}</h1>
          <div className="header-actions">
            <nav className="header-nav" aria-label="main navigation">
              <button
                type="button"
                onClick={() => setCurrentPage('people')}
                className={`header-nav-button${currentPage === 'people' ? ' active' : ''}`}
              >
                {t('header.people')}
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setCurrentPage('users')}
                  className={`header-nav-button${currentPage === 'users' ? ' active' : ''}`}
                >
                  {t('header.users')}
                </button>
              )}
            </nav>
            <div className="header-controls">
              <label className="language-select__label" htmlFor="language-select">
                {t('header.language')}
              </label>
              <select
                id="language-select"
                className="language-select"
                value={language}
                onChange={(event) => setLanguage(event.target.value as Language)}
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="theme-toggle"
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                aria-label={themeLabel}
                title={themeLabel}
              >
                {themeIcon}
              </button>
              <button type="button" className="btn logout-button" onClick={handleLogout}>
                {t('header.logout')}
              </button>
            </div>
          </div>
        </div>
      </header>

      {currentPage === 'users' ? (
        <UsersManagement />
      ) : (
        <main className="container">
          <section className="search-and-create">
            <div className="search-bar">
              <input
                className="search-input"
                type="text"
                placeholder={t('search.placeholder')}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <div className="search-actions">
              <button type="button" className="btn btn-primary" onClick={handleCreatePerson}>
                <span style={{ fontSize: '1.25rem' }}>+</span>
                {t('search.addPerson')}
              </button>
            </div>
          </section>

          {renderPeople()}

          {isModalOpen && (
            <PersonModal
              person={selectedPerson}
              onClose={() => {
                setIsModalOpen(false);
                setSelectedPerson(null);
              }}
              onSave={handleSavePerson}
            />
          )}
        </main>
      )}
    </div>
  );
};

export default App;

