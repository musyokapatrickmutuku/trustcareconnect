// Reusable Form Field Component
import React from 'react';

interface FormFieldProps {
  label: string;
  type?: 'text' | 'email' | 'textarea' | 'select' | 'date' | 'number' | 'password' | 'tel';
  name: string;
  value?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  options?: string[];
  rows?: number;
  maxLength?: number;
  autoComplete?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  error?: string;
  className?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  type = 'text',
  name,
  value,
  placeholder,
  required = false,
  disabled = false,
  options = [],
  rows = 4,
  maxLength,
  autoComplete,
  onChange,
  error,
  className = ''
}) => {
  const baseInputClasses = `w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
    disabled ? 'bg-gray-100 cursor-not-allowed' : ''
  } ${error ? 'border-red-500' : ''}`;

  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <textarea
            name={name}
            value={value}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            rows={rows}
            maxLength={maxLength}
            onChange={onChange}
            className={baseInputClasses}
          />
        );
      
      case 'select':
        return (
          <select
            name={name}
            value={value}
            required={required}
            disabled={disabled}
            onChange={onChange}
            className={baseInputClasses}
          >
            <option value="">{placeholder || `Select ${label}`}</option>
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      
      default:
        return (
          <input
            type={type}
            name={name}
            value={value}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            maxLength={maxLength}
            autoComplete={autoComplete}
            onChange={onChange}
            className={baseInputClasses}
          />
        );
    }
  };

  return (
    <div className={`form-group ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderInput()}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {maxLength && (
        <p className="mt-1 text-xs text-gray-500">
          {value?.length || 0}/{maxLength} characters
        </p>
      )}
    </div>
  );
};

export default FormField;