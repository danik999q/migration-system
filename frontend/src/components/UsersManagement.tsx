import React, { useState, useEffect } from 'react';
import { api, User } from '../services/api';
import '../index.css';

const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.users.getAll();
      setUsers(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка загрузки пользователей');
      console.error('Ошибка загрузки пользователей:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
    try {
      await api.users.updateRole(userId, newRole);
      setUsers(users.map(user => user.id === userId ? { ...user, role: newRole } : user));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Ошибка обновления роли');
      console.error('Ошибка обновления роли:', err);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div className="spinner" />
        <p>Загрузка пользователей...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: 'var(--error)', marginBottom: '20px' }}>{error}</p>
        <button onClick={loadUsers} className="btn-primary">
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="users-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--gray-900)' }}>
          Управление пользователями
        </h1>
        <button onClick={loadUsers} className="btn btn-secondary">
          Обновить
        </button>
      </div>

      <div className="users-grid" style={{ 
        display: 'grid', 
        gap: '20px',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))'
      }}>
        {users.map((user) => (
          <div
            key={user.id}
            className="user-card card"
            style={{
              borderRadius: '16px',
              padding: '24px',
            }}
          >
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: 600, 
                color: 'var(--text-primary)',
                marginBottom: '8px'
              }}>
                {user.username}
              </h3>
              <p style={{ 
                fontSize: '14px', 
                color: 'var(--text-secondary)',
                marginBottom: '12px'
              }}>
                ID: {user.id}
              </p>
              {user.createdAt && (
                <p style={{ 
                  fontSize: '14px', 
                  color: 'var(--text-secondary)'
                }}>
                  Создан: {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                </p>
              )}
            </div>

            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              padding: '12px',
              background: 'var(--bg-secondary)',
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <span style={{ 
                fontSize: '14px', 
                fontWeight: 500,
                color: 'var(--text-secondary)'
              }}>
                Роль:
              </span>
              <span
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  background: user.role === 'admin' 
                    ? 'linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%)'
                    : 'var(--bg-tertiary)',
                  color: user.role === 'admin' ? 'white' : 'var(--text-secondary)',
                }}
              >
                {user.role === 'admin' ? 'Администратор' : 'Пользователь'}
              </span>
            </div>

            <div className="user-actions" style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => handleRoleChange(user.id, 'admin')}
                disabled={user.role === 'admin'}
                className="btn"
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: user.role === 'admin' ? 'not-allowed' : 'pointer',
                  background: user.role === 'admin' 
                    ? 'var(--bg-tertiary)' 
                    : 'linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%)',
                  color: user.role === 'admin' ? 'var(--text-secondary)' : 'white',
                  opacity: user.role === 'admin' ? 0.5 : 1,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (user.role !== 'admin') {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (user.role !== 'admin') {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                Сделать админом
              </button>
              <button
                onClick={() => handleRoleChange(user.id, 'user')}
                disabled={user.role === 'user'}
                className="btn btn-secondary"
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: user.role === 'user' ? 'not-allowed' : 'pointer',
                  background: user.role === 'user' 
                    ? 'var(--bg-tertiary)' 
                    : 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  opacity: user.role === 'user' ? 0.5 : 1,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (user.role !== 'user') {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (user.role !== 'user') {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                Убрать админ
              </button>
            </div>
          </div>
        ))}
      </div>

      {users.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          color: 'var(--text-secondary)'
        }}>
          <p style={{ fontSize: '18px' }}>Пользователи не найдены</p>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;

