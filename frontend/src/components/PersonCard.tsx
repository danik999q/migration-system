import React, { useEffect, useMemo, useState } from 'react';
import DocumentList from './DocumentList';
import { Person, Document, api } from '../services/api';
import { useToast } from './ToastProvider';
import { useTranslation } from './LanguageProvider';
import { authService } from '../services/auth';

interface PersonCardProps {
  person: Person;
  onEdit: (person: Person) => void;
  onDelete: (id: string) => void;
  onStatusChange: (personId: string, status: string) => void;
}

const statusClassMap: Record<string, string> = {
  pending: 'status-pending',
  approved: 'status-approved',
  rejected: 'status-rejected',
  processing: 'status-processing',
  new: 'status-new',
};

type DetailKey = 'dateOfBirth' | 'nationality' | 'passportNumber' | 'phone' | 'email' | 'address';

const detailIcons: Record<DetailKey, string> = {
  dateOfBirth: '🎂',
  nationality: '🛂',
  passportNumber: '🛃',
  phone: '📞',
  email: '✉️',
  address: '📍',
};

const statusProgressMap: Record<string, number> = {
  new: 10,
  pending: 35,
  processing: 65,
  approved: 100,
  rejected: 100,
};

const PersonCard: React.FC<PersonCardProps> = ({ person, onEdit, onDelete, onStatusChange }) => {
  const { showToast } = useToast();
  const { t, language } = useTranslation();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [showDocuments, setShowDocuments] = useState(false);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const isAdmin = authService.isAdmin();

  useEffect(() => {
    if (showDocuments) {
      void loadDocuments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDocuments, person.id]);

  const loadDocuments = async () => {
    try {
      setDocumentsLoading(true);
      const data = await api.documents.getByPersonId(person.id);
      setDocuments(data);
    } catch (error) {
      console.error('Failed to load documents:', error);
      showToast({ type: 'error', message: t('toast.documentsLoadFailed') });
    } finally {
      setDocumentsLoading(false);
    }
  };

  const handleStatusSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onStatusChange(person.id, event.target.value);
  };

  const handleDeletePerson = () => {
    if (window.confirm(t('confirm.deletePerson'))) {
      onDelete(person.id);
    }
  };

  const handleDocumentDelete = async (documentId: string) => {
    if (!window.confirm(t('confirm.deleteDocument'))) {
      return;
    }

    try {
      await api.documents.delete(documentId);
      await loadDocuments();
      showToast({ type: 'success', message: t('toast.documentDeleted') });
    } catch (error) {
      console.error('Failed to delete document:', error);
      showToast({ type: 'error', message: t('toast.documentDeleteFailed') });
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return '';
    return new Date(value).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-GB');
  };

  const normalizedStatus = person.status.toLowerCase();
  const currentStatusClass = statusClassMap[normalizedStatus] ?? 'status-new';
  const statusProgress = statusProgressMap[normalizedStatus] ?? 0;

  const statusLabels = useMemo(
    () => ({
      new: t('status.new'),
      pending: t('status.pending'),
      processing: t('status.processing'),
      approved: t('status.approved'),
      rejected: t('status.rejected'),
    }),
    [t]
  );

  const statusKey = useMemo(
    () => (normalizedStatus in statusLabels
      ? (normalizedStatus as keyof typeof statusLabels)
      : undefined),
    [normalizedStatus, statusLabels]
  );

  const details = useMemo(
    () =>
      [
        person.dateOfBirth && {
          key: 'dateOfBirth' as DetailKey,
          label: t('forms.dateOfBirth'),
          value: formatDate(person.dateOfBirth),
        },
        person.nationality && {
          key: 'nationality' as DetailKey,
          label: t('forms.nationality'),
          value: person.nationality,
        },
        person.passportNumber && {
          key: 'passportNumber' as DetailKey,
          label: t('forms.passport'),
          value: person.passportNumber,
        },
        person.phone && {
          key: 'phone' as DetailKey,
          label: t('forms.phone'),
          value: person.phone,
        },
        person.email && {
          key: 'email' as DetailKey,
          label: t('forms.email'),
          value: person.email,
        },
        person.address && {
          key: 'address' as DetailKey,
          label: t('forms.address'),
          value: person.address,
        },
      ].filter(Boolean) as Array<{ key: DetailKey; label: string; value: string }> ,
    [person.address, person.dateOfBirth, person.email, person.nationality, person.passportNumber, person.phone, t]
  );

  const documentToggleLabel = showDocuments
    ? t('personCard.hideDocuments')
    : t('personCard.toggleDocuments', { count: documents.length });

  return (
    <div className="person-card">
      <h3>
        {person.lastName} {person.firstName} {person.middleName || ''}
      </h3>

      {details.length > 0 && (
        <dl className="person-details">
          {details.map((detail) => (
            <div className="person-field" key={detail.key}>
              <dt className="person-field-label">{detail.label}</dt>
              <dd className="person-field-value">
                <span aria-hidden="true" className="person-field-icon">
                  {detailIcons[detail.key]}
                </span>
                <span>{detail.value}</span>
              </dd>
            </div>
          ))}
        </dl>
      )}

      <div className="person-status">
        <label className="person-status-label" htmlFor={`status-${person.id}`}>
          {t('forms.status')}
        </label>
        {isAdmin ? (
          <select
            id={`status-${person.id}`}
            className="person-status-select"
            value={normalizedStatus}
            onChange={handleStatusSelect}
          >
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        ) : (
          <div className="person-status-select" style={{ cursor: 'default', opacity: 0.7 }}>
            {statusKey ? statusLabels[statusKey] : person.status}
          </div>
        )}
        <div className="person-status-progress">
          <div className="person-status-progress-bar" style={{ width: `${statusProgress}%` }} />
        </div>
        <span className={`status-badge ${currentStatusClass}`}>
          {statusKey ? statusLabels[statusKey] : person.status}
        </span>
      </div>

      <div className="actions">
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => onEdit(person)}>
            {t('personCard.edit')}
          </button>
        )}
        <button className="btn btn-secondary" onClick={() => setShowDocuments((value) => !value)}>
          {documentToggleLabel}
        </button>
        {isAdmin && (
          <button className="btn btn-danger" onClick={handleDeletePerson}>
            {t('personCard.delete')}
          </button>
        )}
      </div>

      {showDocuments && (
        <div className="documents-list person-documents">
          <DocumentList
            personId={person.id}
            documents={documents}
            loading={documentsLoading}
            onDelete={handleDocumentDelete}
            onReload={loadDocuments}
          />
        </div>
      )}
    </div>
  );
};

export default PersonCard;
