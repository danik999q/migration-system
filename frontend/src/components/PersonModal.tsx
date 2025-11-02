import React, { useEffect, useMemo, useState } from 'react';
import { Person } from '../services/api';
import { useToast } from './ToastProvider';
import { useTranslation } from './LanguageProvider';

interface PersonModalProps {
  person: Person | null;
  onClose: () => void;
  onSave: (personData: Omit<Person, 'id' | 'createdAt' | 'updatedAt'> | Person) => void;
}

type FormState = {
  firstName: string;
  lastName: string;
  middleName: string;
  dateOfBirth: string;
  nationality: string;
  passportNumber: string;
  phone: string;
  email: string;
  address: string;
  status: Person['status'];
  notes: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const emptyForm: FormState = {
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
};

const PersonModal: React.FC<PersonModalProps> = ({ person, onClose, onSave }) => {
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [formData, setFormData] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<keyof FormState, boolean>>({
    firstName: false,
    lastName: false,
    middleName: false,
    dateOfBirth: false,
    nationality: false,
    passportNumber: false,
    phone: false,
    email: false,
    address: false,
    status: false,
    notes: false,
  });

  useEffect(() => {
    if (person) {
      setFormData({
        firstName: person.firstName ?? '',
        lastName: person.lastName ?? '',
        middleName: person.middleName ?? '',
        dateOfBirth: person.dateOfBirth ?? '',
        nationality: person.nationality ?? '',
        passportNumber: person.passportNumber ?? '',
        phone: person.phone ?? '',
        email: person.email ?? '',
        address: person.address ?? '',
        status: (person.status as Person['status']) ?? 'new',
        notes: person.notes ?? '',
      });
    } else {
      setFormData(emptyForm);
    }
    setErrors({});
    setTouched({
      firstName: false,
      lastName: false,
      middleName: false,
      dateOfBirth: false,
      nationality: false,
      passportNumber: false,
      phone: false,
      email: false,
      address: false,
      status: false,
      notes: false,
    });
  }, [person]);

  const validate = (data: FormState): FormErrors => {
    const nextErrors: FormErrors = {};

    if (!data.firstName.trim()) {
      nextErrors.firstName = t('forms.firstNameRequired');
    }

    if (!data.lastName.trim()) {
      nextErrors.lastName = t('forms.lastNameRequired');
    }

    if (!data.status) {
      nextErrors.status = t('forms.statusRequired');
    }

    if (data.email && !/^[\w.!#$%&'*+/=?^`{|}~-]+@[\w-]+(\.[\w-]+)+$/.test(data.email)) {
      nextErrors.email = t('forms.emailInvalid');
    }

    if (data.phone && data.phone.replace(/\D/g, '').length < 10) {
      nextErrors.phone = t('forms.phoneInvalid');
    }

    if (data.passportNumber && data.passportNumber.length < 5) {
      nextErrors.passportNumber = t('forms.passportInvalid');
    }

    return nextErrors;
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  useEffect(() => {
    setErrors(validate(formData));
  }, [formData]);

  const fieldError = (field: keyof FormState) => (touched[field] ? errors[field] : undefined);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const currentErrors = validate(formData);
    if (Object.keys(currentErrors).length > 0) {
      setErrors(currentErrors);
      setTouched((prev) => {
        const next = { ...prev };
        (Object.keys(currentErrors) as Array<keyof FormState>).forEach((key) => {
          next[key] = true;
        });
        return next;
      });
      showToast({ type: 'error', message: t('forms.saveError') });
      return;
    }

    onSave(formData);
  };

  const statusOptions = useMemo(
    () => [
      { value: 'new', label: t('status.new') },
      { value: 'pending', label: t('status.pending') },
      { value: 'processing', label: t('status.processing') },
      { value: 'approved', label: t('status.approved') },
      { value: 'rejected', label: t('status.rejected') },
    ],
    [t]
  );

  const modalTitle = person ? t('forms.editPersonTitle') : t('forms.createPersonTitle');
  const primaryButton = person ? t('forms.save') : t('forms.create');
  const phonePlaceholder = t('forms.phonePlaceholder');
  const firstNamePlaceholder = t('forms.firstNamePlaceholder');
  const lastNamePlaceholder = t('forms.lastNamePlaceholder');
  const nationalityPlaceholder = t('forms.nationalityPlaceholder');
  const addressPlaceholder = t('forms.addressPlaceholder');
  const middleNamePlaceholder = t('forms.middleNamePlaceholder');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>{modalTitle}</h2>
          <button className="close-btn" type="button" onClick={onClose} aria-label={t('forms.cancel')}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label>
              {t('forms.firstName')} <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder={firstNamePlaceholder}
            />
            {fieldError('firstName') && <span className="form-error">{fieldError('firstName')}</span>}
          </div>

          <div className="form-group">
            <label>
              {t('forms.lastName')} <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder={lastNamePlaceholder}
            />
            {fieldError('lastName') && <span className="form-error">{fieldError('lastName')}</span>}
          </div>

          <div className="form-group">
            <label>{t('forms.middleName')}</label>
            <input
              type="text"
              name="middleName"
              value={formData.middleName}
              onChange={handleChange}
              placeholder={middleNamePlaceholder}
            />
          </div>

          <div className="form-group">
            <label>{t('forms.dateOfBirth')}</label>
            <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>{t('forms.nationality')}</label>
            <input
              type="text"
              name="nationality"
              value={formData.nationality}
              onChange={handleChange}
              placeholder={nationalityPlaceholder}
            />
          </div>

          <div className="form-group">
            <label>{t('forms.passport')}</label>
            <input
              type="text"
              name="passportNumber"
              value={formData.passportNumber}
              onChange={handleChange}
              placeholder="AA1234567"
            />
            {fieldError('passportNumber') && (
              <span className="form-error">{fieldError('passportNumber')}</span>
            )}
          </div>

          <div className="form-group">
            <label>{t('forms.phone')}</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder={phonePlaceholder}
            />
            {fieldError('phone') && <span className="form-error">{fieldError('phone')}</span>}
          </div>

          <div className="form-group">
            <label>{t('forms.email')}</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="user@example.com"
            />
            {fieldError('email') && <span className="form-error">{fieldError('email')}</span>}
          </div>

          <div className="form-group">
            <label>{t('forms.address')}</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder={addressPlaceholder}
            />
          </div>

          <div className="form-group">
            <label>
              {t('forms.status')} <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select name="status" value={formData.status} onChange={handleChange}>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {fieldError('status') && <span className="form-error">{fieldError('status')}</span>}
          </div>

          <div className="form-group">
            <label>{t('forms.notes')}</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder={t('forms.notesPlaceholder')}
            />
          </div>

          <div className="actions" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {t('forms.cancel')}
            </button>
            <button type="submit" className="btn btn-primary">
              {primaryButton}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PersonModal;
