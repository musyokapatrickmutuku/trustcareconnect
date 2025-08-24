// Query Submission Component
import React, { useState } from 'react';
import FormField from '../common/FormField';
import Button from '../common/Button';
import { Patient, ComponentProps } from '../../types';
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

  const handleInputChange = (field: string, value: string) => {
    const maxLength = field === 'title' ? 100 : 500;
    
    setFormData(prev => ({
      ...prev,
      [field]: value.substring(0, maxLength)
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (!patient.assignedDoctorId) {
      showMessage?.('You must be assigned to a doctor before submitting queries.');
      return;
    }

    setLoading?.(true);
    try {
      const result = await icpService.submitQuery(
        patient.id,
        formData.title.trim(),
        formData.description.trim()
      );

      if (result.success) {
        showMessage?.('🎉 Query submitted successfully! Your query has been processed by our AI system and sent to your doctor for review. Keep an eye on your notifications for updates on the progress.', 'success');
        setFormData({ title: '', description: '' });
        onQuerySubmitted();
      } else {
        showMessage?.(result.error || 'Failed to submit query');
      }
    } catch (error) {
      console.error('Query submission error:', error);
      showMessage?.('An error occurred while submitting your query');
    } finally {
      setLoading?.(false);
    }
  };

  return (
    <div className="space-y-4">
      <FormField
        label="Query Title"
        name="title"
        value={formData.title}
        onChange={(e) => handleInputChange('title', e.target.value)}
        placeholder="Brief title for your medical question"
        error={errors.title}
        required
      />

      <FormField
        label="Description"
        name="description"
        type="textarea"
        value={formData.description}
        onChange={(e) => handleInputChange('description', e.target.value)}
        placeholder="Describe your symptoms, concerns, or questions in detail..."
        error={errors.description}
        required
      />

      <Button
        onClick={handleSubmit}
        loading={loading}
        disabled={!formData.title.trim() || !formData.description.trim()}
        className="w-full"
      >
        Submit Query
      </Button>

      {!patient.assignedDoctorId && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            ⚠️ You need to be assigned to a doctor before you can submit queries.
          </p>
        </div>
      )}
    </div>
  );
};

export default QuerySubmission;