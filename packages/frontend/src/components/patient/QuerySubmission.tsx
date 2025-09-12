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
    query: '',
    bloodGlucose: '',
    bloodPressure: '',
    heartRate: '',
    temperature: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [response, setResponse] = useState<any>(null);

  const handleInputChange = (field: string, value: string) => {
    const maxLength = field === 'query' ? 1000 : 50;
    
    setFormData(prev => ({
      ...prev,
      [field]: field === 'query' ? value.substring(0, maxLength) : value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.query.trim()) {
      newErrors.query = 'Medical query is required';
    }

    if (formData.query.trim().length < 10) {
      newErrors.query = 'Please provide more details (at least 10 characters)';
    }

    // Validate vital signs if provided
    if (formData.bloodGlucose && (isNaN(Number(formData.bloodGlucose)) || Number(formData.bloodGlucose) < 0)) {
      newErrors.bloodGlucose = 'Please enter a valid blood glucose value';
    }

    if (formData.heartRate && (isNaN(Number(formData.heartRate)) || Number(formData.heartRate) < 30 || Number(formData.heartRate) > 300)) {
      newErrors.heartRate = 'Please enter a valid heart rate (30-300 BPM)';
    }

    if (formData.temperature && (isNaN(Number(formData.temperature)) || Number(formData.temperature) < 30 || Number(formData.temperature) > 50)) {
      newErrors.temperature = 'Please enter a valid temperature (30-50°C)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading?.(true);
    setResponse(null);
    
    try {
      // Prepare vital signs data
      const vitalSigns = {
        bloodGlucose: formData.bloodGlucose ? parseFloat(formData.bloodGlucose) : null,
        bloodPressure: formData.bloodPressure || null,
        heartRate: formData.heartRate ? parseInt(formData.heartRate) : null,
        temperature: formData.temperature ? parseFloat(formData.temperature) : null,
      };

      // Remove null values
      const cleanVitalSigns = Object.fromEntries(
        Object.entries(vitalSigns).filter(([_, value]) => value !== null)
      );

      const result = await icpService.processMedicalQuery(
        patient.id,
        formData.query.trim(),
        Object.keys(cleanVitalSigns).length > 0 ? cleanVitalSigns : null
      );

      if (result.success) {
        setResponse(result.data);
        showMessage?.('🎉 Query processed successfully! AI analysis completed.', 'success');
        onQuerySubmitted();
      } else {
        showMessage?.(result.error || 'Failed to process query');
      }
    } catch (error) {
      console.error('Query processing error:', error);
      showMessage?.('An error occurred while processing your query');
    } finally {
      setLoading?.(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Query Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Medical Query</h3>
        <FormField
          label="Describe your symptoms, concerns, or questions"
          name="query"
          type="textarea"
          value={formData.query}
          onChange={(e) => handleInputChange('query', e.target.value)}
          placeholder="I've been feeling more tired lately and my morning blood sugars are higher than usual. Should I be concerned?"
          error={errors.query}
          required
        />
        <p className="text-sm text-gray-500 mt-1">
          {formData.query.length}/1000 characters • Minimum 10 characters required
        </p>
      </div>

      {/* Vital Signs Section */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Vital Signs (Optional)</h3>
        <p className="text-sm text-gray-600 mb-4">
          Adding your current vital signs helps provide more accurate medical guidance
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Blood Glucose (mg/dL)"
            name="bloodGlucose"
            type="number"
            value={formData.bloodGlucose}
            onChange={(e) => handleInputChange('bloodGlucose', e.target.value)}
            placeholder="e.g., 120"
            error={errors.bloodGlucose}
          />
          
          <FormField
            label="Blood Pressure"
            name="bloodPressure"
            value={formData.bloodPressure}
            onChange={(e) => handleInputChange('bloodPressure', e.target.value)}
            placeholder="e.g., 120/80"
            error={errors.bloodPressure}
          />
          
          <FormField
            label="Heart Rate (BPM)"
            name="heartRate"
            type="number"
            value={formData.heartRate}
            onChange={(e) => handleInputChange('heartRate', e.target.value)}
            placeholder="e.g., 72"
            error={errors.heartRate}
          />
          
          <FormField
            label="Temperature (°C)"
            name="temperature"
            type="number"
            step="0.1"
            value={formData.temperature}
            onChange={(e) => handleInputChange('temperature', e.target.value)}
            placeholder="e.g., 37.0"
            error={errors.temperature}
          />
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        loading={loading}
        disabled={!formData.query.trim() || formData.query.trim().length < 10}
        className="w-full"
      >
        Get Medical Guidance
      </Button>

      {/* Response Display */}
      {response && (
        <div className="bg-green-50 rounded-lg border border-green-200 p-6">
          <h3 className="text-lg font-medium text-green-900 mb-4">
            🤖 AI Medical Guidance
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-4 text-sm">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                response.urgency === 'HIGH' ? 'bg-red-100 text-red-800' :
                response.urgency === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {response.urgency} Priority
              </span>
              <span className="text-gray-600">
                Safety Score: {response.safetyScore}%
              </span>
              {response.requiresReview && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Doctor Review Required
                </span>
              )}
            </div>
            
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-gray-800">
                {response.content}
              </div>
            </div>
            
            {response.requiresReview && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  📋 This query has been flagged for doctor review. A medical professional will validate the AI response before final approval.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuerySubmission;