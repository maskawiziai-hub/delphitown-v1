// ============================================================================
// CitizenForm Component - Create new citizens
// ============================================================================

import React, { useState } from 'react';
import { CitizenType, WorkerType, CreateCitizenInput, Citizen } from '../../types';
import * as citizenService from '../../services/citizenService';

interface CitizenFormProps {
  onCitizenCreated?: (citizen: Citizen) => void;
  onError?: (error: string) => void;
  isLoading?: boolean;
}

export const CitizenForm: React.FC<CitizenFormProps> = ({
  onCitizenCreated,
  onError,
  isLoading: externalLoading,
}) => {
  const [formData, setFormData] = useState<CreateCitizenInput>({
    name: '',
    citizen_type: 'human',
    worker_type: 'collectibles_hunter',
  });

  const [isLoading, setIsLoading] = useState(externalLoading || false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const CITIZEN_TYPES: CitizenType[] = ['human', 'bot', 'hybrid'];
  const WORKER_TYPES: WorkerType[] = [
    'collectibles_hunter',
    'gta6_content_creator',
    'osrs_farmer',
    'dropshipping_scout',
    'lofi_producer',
    'pixel_artist',
    'pod_designer',
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
    setSuccess(null);
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('Citizen name is required');
      return false;
    }

    if (formData.name.length < 2 || formData.name.length > 50) {
      setError('Citizen name must be between 2 and 50 characters');
      return false;
    }

    if (!formData.citizen_type) {
      setError('Citizen type is required');
      return false;
    }

    if (!formData.worker_type) {
      setError('Worker type is required');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const newCitizen = await citizenService.createCitizen(formData);

      setSuccess(`✓ Citizen "${newCitizen.name}" created successfully`);

      // Reset form
      setFormData({
        name: '',
        citizen_type: 'human',
        worker_type: 'collectibles_hunter',
      });

      // Trigger callback
      if (onCitizenCreated) {
        onCitizenCreated(newCitizen);
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create citizen';
      setError(errorMessage);

      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={e => void handleSubmit(e)} className="citizen-form">
      <fieldset disabled={isLoading}>
        <div className="form-group">
          <label htmlFor="name">Citizen Name</label>
          <input
            id="name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="e.g., Alice, Bot-7, Hybrid-X"
            maxLength={50}
            required
          />
          <small>{formData.name.length}/50 characters</small>
        </div>

        <div className="form-group">
          <label htmlFor="citizen_type">Citizen Type</label>
          <select
            id="citizen_type"
            name="citizen_type"
            value={formData.citizen_type}
            onChange={handleInputChange}
            required
          >
            <option value="">Select citizen type...</option>
            {CITIZEN_TYPES.map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
          <small>Human = real player | Bot = AI-controlled | Hybrid = both</small>
        </div>

        <div className="form-group">
          <label htmlFor="worker_type">Worker Type</label>
          <select
            id="worker_type"
            name="worker_type"
            value={formData.worker_type}
            onChange={handleInputChange}
            required
          >
            <option value="">Select worker type...</option>
            {WORKER_TYPES.map(type => (
              <option key={type} value={type}>
                {type
                  .replace(/_/g, ' ')
                  .split(' ')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ')}
              </option>
            ))}
          </select>
          <small>Determines the kind of tasks this citizen can perform</small>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <button
          type="submit"
          disabled={isLoading}
          className="submit-button"
        >
          {isLoading ? 'Creating citizen...' : 'Create Citizen'}
        </button>
      </fieldset>
    </form>
  );
};

export default CitizenForm;
