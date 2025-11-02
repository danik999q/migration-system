import React, { useState, useEffect } from 'react';
import { api, Person } from './services/api';
import { authService } from './services/auth';
import PersonCard from './components/PersonCard';
import PersonModal from './components/PersonModal';
import Login from './components/Login';
import UsersManagement from './components/UsersManagement';
import './index.css';

const App: React.FC = () => {
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

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = authService.isAuthenticated();
      const admin = authService.isAdmin();
      setIsAuthenticated(authenticated);
      setIsAdmin(admin);
      setCheckingAuth(false);
      if (authenticated) {
        loadPeople();
      }
    };
    checkAuth();
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    setIsAdmin(authService.isAdmin());
    loadPeople();
  };

  const handleLogout = () => {
    authService.removeToken();
    setIsAuthenticated(false);
    setPeople([]);
    setFilteredPeople([]);
  };

  useEffect(() => {
    const filtered = people.filter(
      (person) =>
        person.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.passportNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPeople(filtered);
  }, [searchTerm, people]);

  const loadPeople = async () => {
    try {
      setLoading(true);
      const data = await api.people.getAll();
      setPeople(data);
      setFilteredPeople(data);
    } catch (error) {
      console.error('Ошибка загрузки людей:', error);
    } finally {
      setLoading(false);
    }
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
      } else {
        await api.people.create(personData as Omit<Person, 'id' | 'createdAt' | 'updatedAt'>);
      }
      setIsModalOpen(false);
      setSelectedPerson(null);
      await loadPeople();
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert('Ошибка сохранения данных');
    }
  };

  const handleDeletePerson = async (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этого человека?')) {
      try {
        await api.people.delete(id);
        await loadPeople();
      } catch (error) {
        console.error('Ошибка удаления:', error);
        alert('Ошибка удаления');
      }
    }
  };

  const handleStatusChange = async (personId: string, newStatus: string) => {
    try {
      await api.status.update(personId, newStatus);
      await loadPeople();
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
      alert('Ошибка обновления статуса');
    }
  };

  if (checkingAuth) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div>Загрузка...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div>
      <div className="header">
        <div className="container">
          <h1 style={{ margin: 0, fontSize: '28px', letterSpacing: '-0.5px' }}>Система управления мигрантами</h1>
          <div className="header-actions">
            <div className="header-nav">
              <button
                onClick={() => setCurrentPage('people')}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: currentPage === 'people' 
                    ? 'rgba(255, 255, 255, 0.3)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  transition: 'all 0.2s',
                }}
              >
                Люди
              </button>
              {isAdmin && (
                <button
                  onClick={() => setCurrentPage('users')}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: currentPage === 'users' 
                      ? 'rgba(255, 255, 255, 0.3)' 
                      : 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    transition: 'all 0.2s',
                  }}
                >
                  Пользователи
                </button>
              )}
            </div>
            <button 
              className="btn btn-secondary" 
              onClick={handleLogout}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              Выйти
            </button>
          </div>
        </div>
      </div>

      {currentPage === 'users' ? (
        <UsersManagement />
      ) : (
        <div className="container">
          <div className="search-and-create" style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '32px',
            gap: '16px',
            flexWrap: 'wrap',
          }}>
            <div className="search-bar" style={{ flex: 1, minWidth: '300px' }}>
              <input
                type="text"
                placeholder="🔍 Поиск по имени, фамилии, паспорту или email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              className="btn btn-primary" 
              onClick={handleCreatePerson}
              style={{
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ fontSize: '18px', marginRight: '8px' }}>+</span>
              Создать человека
            </button>
          </div>

        {loading ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '80px 40px',
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Загрузка данных...</div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Пожалуйста, подождите</div>
          </div>
        ) : filteredPeople.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '80px 40px',
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          }}>
            <div style={{ fontSize: '64px', marginBottom: '24px' }}>{searchTerm ? '🔍' : '👤'}</div>
            <div style={{ fontSize: '20px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
              {searchTerm ? 'Ничего не найдено' : 'Список пуст'}
            </div>
            <div style={{ fontSize: '15px', color: '#6b7280', marginBottom: '24px' }}>
              {searchTerm ? 'Попробуйте изменить параметры поиска' : 'Создайте первого человека, чтобы начать работу'}
            </div>
            {!searchTerm && (
              <button className="btn btn-primary" onClick={handleCreatePerson}>
                <span style={{ fontSize: '18px', marginRight: '8px' }}>+</span>
                Создать первого человека
              </button>
            )}
          </div>
        ) : (
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
        )}

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
        </div>
      )}
    </div>
  );
};

export default App;

