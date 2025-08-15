// Query Submission Component
import React, { useState } from 'react';
import FormField from '../common/FormField';
import Button from '../common/Button';
import { Patient, ComponentProps } from '../../types';
import { FORM_VALIDATION, UI_MESSAGES } from '../../constants';
import { sanitizeInput } from '../../utils/formatters';
import icpService from '../../services/icpService';

interface QuerySubmissionProps extends ComponentProps {
  patient: Patient;
  assignedDoctorName?: string;
  onQuerySubmitted: () => void;
}

const QuerySubmission: React.FC<QuerySubmissionProps> = ({
  patient,
  assignedDoctorName,
  onQuerySubmitted,
  showMessage,
  loading,
  setLoading
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const maxLength = name === 'title' 
      ? FORM_VALIDATION.MAX_TITLE_LENGTH 
      : FORM_VALIDATION.MAX_DESCRIPTION_LENGTH;
    
    setFormData(prev => ({
      ...prev,
      [name]: sanitizeInput(value, maxLength)
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Query title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Query description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading?.(true);
    
    try {
      const result = await icpService.submitQuery(
        patient.id,
        formData.title,
        formData.description
      );
      
      if (result.success) {
        showMessage?.(UI_MESSAGES.SUCCESS.QUERY_SUBMITTED);
        setFormData({ title: '', description: '' });
        onQuerySubmitted();
      } else {
        showMessage?.(`Error: ${result.error}`);
      }
    } catch (error) {
      showMessage?.('Query submission failed. Please try again.');
    } finally {
      setLoading?.(false);
    }
  };

  if (!patient.assignedDoctorId) {
    return (
      <div className="assignment-waiting bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
          Waiting for Doctor Assignment
        </h3>
        <p className="text-yellow-700">
          Once a doctor assigns you as their patient, you'll be able to submit queries and receive personalized care.
        </p>
      </div>
    );
  }

  return (
    <div className="query-submission">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        Submit New Query
        {assignedDoctorName && (
          <span className="text-sm font-normal text-gray-600 block">
            to Dr. {assignedDoctorName}
          </span>
        )}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label="Query Title"
          name="title"
          value={formData.title}
          placeholder="Brief description of your concern"
          required
          maxLength={FORM_VALIDATION.MAX_TITLE_LENGTH}
          onChange={handleInputChange}
          error={errors.title}
        />

        <FormField
          label="Detailed Description"
          type="textarea"
          name="description"
          value={formData.description}
          placeholder="Please describe your symptoms, concerns, or questions in detail..."
          required
          rows={4}
          maxLength={FORM_VALIDATION.MAX_DESCRIPTION_LENGTH}
          onChange={handleInputChange}
          error={errors.description}
        />

        <Button
          type="submit"
          loading={loading}
          disabled={loading}
          fullWidth
        >
          {loading ? UI_MESSAGES.LOADING.SUBMITTING : 'Submit Query'}
        </Button>
      </form>
    </div>
  );
};

export default QuerySubmission;