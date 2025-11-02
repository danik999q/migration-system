import React, { useEffect, useMemo, useState } from 'react';
import { api, User } from '../services/api';
import '../index.css';
import { useToast } from './ToastProvider';
import { useTranslation } from './LanguageProvider';

type Role = 'user' | 'admin';

const UsersManagement: React.FC = () => {
  const { showToast } = useToast();
  const { t, language } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalAdmins = useMemo(() => users.filter((user) => user.role === 'admin').length, [users]);
  const roleLabel = useMemo(
    () => ({
      user: t('users.roleUser'),
      admin: t('users.roleAdmin'),
    }),
    [t]
  );

  useEffect(() => {
    void loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.users.getAll();
      setUsers(data);
      setError(null);
    } catch (err: unknown) {
      console.error('Failed to load users:', err);
      let message = t('users.loadFailed');
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { error?: string } } };
        message = axiosError.response?.data?.error ?? message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: Role) => {
    try {
      await api.users.updateRole(userId, newRole);
      setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, role: newRole } : user)));
      showToast({ type: 'success', message: t('toast.userRoleUpdated') });
    } catch (err: unknown) {
      console.error('Failed to update user role:', err);
      let message = t('toast.userRoleFailed');
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { error?: string } } };
        message = axiosError.response?.data?.error ?? message;
      }
      showToast({ type: 'error', message });
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="empty-state">
          <div className="spinner" />
          <h3>{t('users.loadingTitle')}</h3>
          <p>{t('users.loadingMessage')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="empty-state">
          <h3>{t('users.errorTitle')}</h3>
          <p style={{ marginBottom: '16px' }}>{error}</p>
          <button type="button" className="btn btn-primary" onClick={() => void loadUsers()}>
            {t('users.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container users-section">
      <header className="users-header" aria-live="polite">
        <h1>{t('users.title')}</h1>
        <div className="users-header__actions">
          <span className="users-counter">
            {t('users.counter', { total: users.length, admins: totalAdmins })}
          </span>
          <button type="button" className="btn btn-secondary" onClick={() => void loadUsers()}>
            {t('users.refresh')}
          </button>
        </div>
      </header>

      {users.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>👥</div>
          <h3>{t('users.emptyTitle')}</h3>
          <p>{t('users.emptyMessage')}</p>
        </div>
      ) : (
        <div className="users-grid">
          {users.map((user) => (
            <article key={user.id} className="user-card card">
              <div className="user-card__header">
                <h3>{user.username}</h3>
                <p className="user-card__meta">{t('users.id', { id: user.id })}</p>
                {user.createdAt && (
                  <p className="user-card__meta">
                    {t('users.createdAt', {
                      date: new Date(user.createdAt).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-GB'),
                    })}
                  </p>
                )}
              </div>

              <div className="user-role">
                <span className="user-role__label">{t('users.roleLabel')}</span>
                <span className={`user-role-badge user-role-badge--${user.role}`}>
                  {roleLabel[user.role as Role] ?? user.role}
                </span>
              </div>

              <div className="user-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleRoleChange(user.id, 'user')}
                  disabled={user.role === 'user'}
                >
                  {t('users.makeUser')}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleRoleChange(user.id, 'admin')}
                  disabled={user.role === 'admin'}
                >
                  {t('users.makeAdmin')}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default UsersManagement;
