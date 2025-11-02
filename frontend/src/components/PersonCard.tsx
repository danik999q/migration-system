import React, { useEffect, useState } from 'react';
import DocumentList from './DocumentList';
import { Person, Document, api } from '../services/api';

interface PersonCardProps {
  person: Person;
  onEdit: (person: Person) => void;
  onDelete: (id: string) => void;
  onStatusChange: (personId: string, status: string) => void;
}

const statusLabel: Record<string, string> = {
  new: 'New',
  pending: 'Pending',
  processing: 'In Progress',
  approved: 'Approved',
  rejected: 'Rejected',
};

const statusClassMap: Record<string, string> = {
  pending: 'status-pending',
  approved: 'status-approved',
  rejected: 'status-rejected',
  processing: 'status-processing',
  new: 'status-new',
};

const PersonCard: React.FC<PersonCardProps> = ({ person, onEdit, onDelete, onStatusChange }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [showDocuments, setShowDocuments] = useState(false);
  const [documentsLoading, setDocumentsLoading] = useState(false);

  const loadDocuments = async () => {
    try {
      setDocumentsLoading(true);
      const data = await api.documents.getByPersonId(person.id);
      setDocuments(data);
    } catch (error) {
      console.error('Failed to load documents:', error);
      alert('Failed to load documents.');
    } finally {
      setDocumentsLoading(false);
    }
  };

  useEffect(() => {
    if (showDocuments) {
      loadDocuments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDocuments, person.id]);

  const handleStatusSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onStatusChange(person.id, event.target.value);
  };

  const handleDeletePerson = () => {
    if (window.confirm('Delete this person? This action cannot be undone.')) {
      onDelete(person.id);
    }
  };

  const handleDocumentDelete = async (documentId: string) => {
    if (!window.confirm('Delete this document?')) {
      return;
    }
    try {
      await api.documents.delete(documentId);
      await loadDocuments();
    } catch (error) {
      console.error('Failed to delete document:', error);
      alert('Failed to delete document.');
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return '';
    return new Date(value).toLocaleDateString();
  };

  const currentStatusClass = statusClassMap[person.status.toLowerCase()] ?? 'status-new';

  return (
    <div className="person-card">
      <h3>
        {person.lastName} {person.firstName} {person.middleName || ''}
      </h3>
      {person.dateOfBirth && <p>Date of birth: {formatDate(person.dateOfBirth)}</p>}
      {person.nationality && <p>Citizenship: {person.nationality}</p>}
      {person.passportNumber && <p>Passport: {person.passportNumber}</p>}
      {person.phone && <p>Phone: {person.phone}</p>}
      {person.email && <p>Email: {person.email}</p>}
      {person.address && <p>Address: {person.address}</p>}

      <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '2px solid #f3f4f6' }}>
        <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
          Status
        </label>
        <select
          value={person.status}
          onChange={handleStatusSelect}
          style={{
            padding: '12px 16px',
            border: '2px solid #e5e7eb',
            borderRadius: '12px',
            width: '100%',
            fontSize: '14px',
            fontWeight: 500,
            background: 'white',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            marginBottom: '12px',
          }}
          onFocus={(event) => {
            event.target.style.borderColor = '#6366f1';
            event.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
          }}
          onBlur={(event) => {
            event.target.style.borderColor = '#e5e7eb';
            event.target.style.boxShadow = 'none';
          }}
        >
          {Object.entries(statusLabel).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <span className={`status-badge ${currentStatusClass}`} style={{ marginTop: '8px', display: 'inline-block' }}>
          {statusLabel[person.status] ?? person.status}
        </span>
      </div>

      <div className="actions">
        <button className="btn btn-primary" onClick={() => onEdit(person)}>
          Edit
        </button>
        <button className="btn btn-secondary" onClick={() => setShowDocuments((value) => !value)}>
          {showDocuments ? 'Hide documents' : `Documents (${documents.length})`}
        </button>
        <button className="btn btn-danger" onClick={handleDeletePerson}>
          Delete
        </button>
      </div>

      {showDocuments && (
        <div
          className="documents-list"
          style={{ marginTop: '24px', paddingTop: '24px', borderTop: '2px solid #f3f4f6' }}
        >
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
