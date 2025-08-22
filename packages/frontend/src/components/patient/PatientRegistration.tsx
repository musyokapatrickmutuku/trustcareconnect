// Patient Registration Component
import React, { useState } from 'react';
import FormField from '../common/FormField';
import Button from '../common/Button';
import { Patient, ComponentProps } from '../../types';
import { MEDICAL_CONDITIONS, FORM_VALIDATION, UI_MESSAGES } from '../../constants';
import { validateEmail, sanitizeInput } from '../../utils/formatters';
import icpService from '../../services/icpService';

interface PatientRegistrationProps extends ComponentProps {
  onRegistrationSuccess: (patient: Patient) => void;
}

const PatientRegistration: React.FC<PatientRegistrationProps> = ({
  onRegistrationSuccess,
  showMessage,
  loading,
  setLoading
}) => {
  const [formData, setFormData] = useState({
    name: '',
    condition: '',
    email: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const maxLength = FORM_VALIDATION[`MAX_${name.toUpperCase()}_LENGTH` as keyof typeof FORM_VALIDATION] || 100;
    const maxLengthNum = typeof maxLength === 'number' ? maxLength : 100;
    
    setFormData(prev => ({
      ...prev,
      [name]: sanitizeInput(value, maxLengthNum)
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.condition) {
      newErrors.condition = 'Medical condition is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
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
      const result = await icpService.registerPatient(
        formData.name,
        formData.condition,
        formData.email
      );
      
      if (result.success && result.data) {
        const patientResult = await icpService.getPatient(result.data);
        if (patientResult.success && patientResult.data) {
          onRegistrationSuccess(patientResult.data);
          showMessage?.(UI_MESSAGES.SUCCESS.PATIENT_REGISTERED);
          // Reset form
          setFormData({ name: '', condition: '', email: '' });
        }
      } else {
        showMessage?.(`Error: ${result.error}`);
      }
    } catch (error) {
      showMessage?.('Registration failed. Please try again.');
    } finally {
      setLoading?.(false);
    }
  };

  return (
    <div className="patient-registration max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Patient Registration</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label="Full Name"
          name="name"
          value={formData.name}
          placeholder="Enter your full name"
          required
          maxLength={FORM_VALIDATION.MAX_NAME_LENGTH}
          onChange={handleInputChange}
          error={errors.name}
        />

        <FormField
          label="Medical Condition"
          type="select"
          name="condition"
          value={formData.condition}
          placeholder="Select your primary condition"
          required
          options={[...MEDICAL_CONDITIONS]}
          onChange={handleInputChange}
          error={errors.condition}
        />

        <FormField
          label="Email Address"
          type="email"
          name="email"
          value={formData.email}
          placeholder="Enter your email address"
          required
          maxLength={FORM_VALIDATION.MAX_EMAIL_LENGTH}
          onChange={handleInputChange}
          error={errors.email}
        />

        <Button
          type="submit"
          loading={loading}
          disabled={loading}
          fullWidth
          className="mt-6"
        >
          {loading ? UI_MESSAGES.LOADING.REGISTERING : 'Register as Patient'}
        </Button>
      </form>
    </div>
  );
};

export default PatientRegistration;