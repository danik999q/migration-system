import React, { useState, useEffect } from 'react';
import { Person } from '../services/api';

interface PersonModalProps {
  person: Person | null;
  onClose: () => void;
  onSave: (personData: Omit<Person, 'id' | 'createdAt' | 'updatedAt'> | Person) => void;
}

const PersonModal: React.FC<PersonModalProps> = ({ person, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    dateOfBirth: '',
    nationality: '',
    passportNumber: '',
    phone: '',
    email: '',
    address: '',
    status: 'new',
    notes: '',
  });

  useEffect(() => {
    if (person) {
      setFormData({
        firstName: person.firstName || '',
        lastName: person.lastName || '',
        middleName: person.middleName || '',
        dateOfBirth: person.dateOfBirth || '',
        nationality: person.nationality || '',
        passportNumber: person.passportNumber || '',
        phone: person.phone || '',
        email: person.email || '',
        address: person.address || '',
        status: person.status || 'new',
        notes: person.notes || '',
      });
    }
  }, [person]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.status.trim()) {
      alert('Пожалуйста, заполните обязательные поля: Имя, Фамилия, Статус');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{person ? 'Редактировать человека' : 'Создать нового человека'}</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              Имя <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>
              Фамилия <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Отчество</label>
            <input
              type="text"
              name="middleName"
              value={formData.middleName}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Дата рождения</label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Национальность</label>
            <input
              type="text"
              name="nationality"
              value={formData.nationality}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Номер паспорта</label>
            <input
              type="text"
              name="passportNumber"
              value={formData.passportNumber}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Телефон</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Адрес</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>
              Статус <span style={{ color: 'red' }}>*</span>
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
            >
              <option value="new">Новый</option>
              <option value="pending">Ожидает</option>
              <option value="processing">В обработке</option>
              <option value="approved">Одобрен</option>
              <option value="rejected">Отклонен</option>
            </select>
          </div>

          <div className="form-group">
            <label>Заметки</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
            />
          </div>

          <div className="actions" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary">
              {person ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PersonModal;

