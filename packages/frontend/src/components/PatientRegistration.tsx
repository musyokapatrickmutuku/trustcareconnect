import React, { useState } from 'react';
import { Formik, Form, Field, FieldArray, ErrorMessage, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import { ComponentProps } from '../types';
import Button from './common/Button';
import LoadingSpinner from './common/LoadingSpinner';
import trustCareAPI from '../api/trustcare';

interface PatientRegistrationProps extends ComponentProps {
  onRegistrationComplete?: (patientId: string) => void;
  onCancel?: () => void;
  initialStep?: number;
}

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

interface MedicalCondition {
  condition: string;
  diagnosedDate: string;
  status: 'active' | 'resolved' | 'chronic';
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  prescribedBy: string;
}

interface PatientRegistrationValues {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  ssn: string;
  
  // Address Information
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  
  // Emergency Contacts
  emergencyContacts: EmergencyContact[];
  
  // Insurance Information
  insuranceProvider: string;
  insurancePolicyNumber: string;
  insuranceGroupNumber: string;
  
  // Medical Information
  bloodType: string;
  height: string;
  weight: string;
  allergies: string[];
  medicalConditions: MedicalCondition[];
  currentMedications: Medication[];
  surgicalHistory: string;
  familyHistory: string;
  
  // Lifestyle Information
  smokingStatus: string;
  alcoholConsumption: string;
  exerciseFrequency: string;
  dietaryRestrictions: string;
  
  // Consent and Agreements
  hipaaConsent: boolean;
  treatmentConsent: boolean;
  communicationPreferences: string[];
  marketingConsent: boolean;
}

// Multi-step validation schemas
const personalInfoSchema = Yup.object({
  firstName: Yup.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must not exceed 50 characters')
    .matches(/^[A-Za-z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes')
    .required('First name is required'),
  
  lastName: Yup.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must not exceed 50 characters')
    .matches(/^[A-Za-z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes')
    .required('Last name is required'),
  
  email: Yup.string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  
  phone: Yup.string()
    .matches(/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number')
    .required('Phone number is required'),
  
  dateOfBirth: Yup.date()
    .max(new Date(), 'Date of birth cannot be in the future')
    .min(new Date('1900-01-01'), 'Please enter a valid date of birth')
    .required('Date of birth is required'),
  
  gender: Yup.string()
    .oneOf(['male', 'female', 'other', 'prefer-not-to-say'], 'Please select a gender')
    .required('Gender is required'),
  
  ssn: Yup.string()
    .matches(/^\d{3}-\d{2}-\d{4}$/, 'SSN must be in format XXX-XX-XXXX')
    .required('Social Security Number is required')
});

const addressSchema = Yup.object({
  street: Yup.string().required('Street address is required'),
  city: Yup.string().required('City is required'),
  state: Yup.string().required('State is required'),
  zipCode: Yup.string()
    .matches(/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code')
    .required('ZIP code is required'),
  country: Yup.string().required('Country is required')
});

const emergencyContactSchema = Yup.object({
  emergencyContacts: Yup.array().of(
    Yup.object({
      name: Yup.string().required('Contact name is required'),
      relationship: Yup.string().required('Relationship is required'),
      phone: Yup.string()
        .matches(/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number')
        .required('Phone number is required'),
      email: Yup.string().email('Please enter a valid email address')
    })
  ).min(1, 'At least one emergency contact is required')
});

const medicalInfoSchema = Yup.object({
  bloodType: Yup.string()
    .oneOf(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'], 'Please select a valid blood type'),
  
  height: Yup.string()
    .matches(/^\d+'\s*\d+"?$|^\d+\s*(cm|in)$/, 'Please enter height in format like 5\'10" or 170cm')
    .required('Height is required'),
  
  weight: Yup.number()
    .positive('Weight must be a positive number')
    .max(1000, 'Please enter a valid weight')
    .required('Weight is required'),
  
  allergies: Yup.array().of(Yup.string()),
  
  medicalConditions: Yup.array().of(
    Yup.object({
      condition: Yup.string().required('Condition name is required'),
      diagnosedDate: Yup.string().required('Diagnosed date is required'),
      status: Yup.string()
        .oneOf(['active', 'resolved', 'chronic'], 'Please select a valid status')
        .required('Status is required')
    })
  ),
  
  currentMedications: Yup.array().of(
    Yup.object({
      name: Yup.string().required('Medication name is required'),
      dosage: Yup.string().required('Dosage is required'),
      frequency: Yup.string().required('Frequency is required'),
      prescribedBy: Yup.string().required('Prescribing doctor is required')
    })
  )
});

const consentSchema = Yup.object({
  hipaaConsent: Yup.boolean()
    .oneOf([true], 'HIPAA consent is required')
    .required('HIPAA consent is required'),
  
  treatmentConsent: Yup.boolean()
    .oneOf([true], 'Treatment consent is required')
    .required('Treatment consent is required'),
  
  communicationPreferences: Yup.array()
    .of(Yup.string())
    .min(1, 'Please select at least one communication preference')
});

const PatientRegistration: React.FC<PatientRegistrationProps> = ({
  onRegistrationComplete,
  onCancel,
  initialStep = 0,
  showMessage,
  loading,
  setLoading
}) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [formData, setFormData] = useState<Partial<PatientRegistrationValues>>({});

  const steps = [
    { title: 'Personal Information', schema: personalInfoSchema },
    { title: 'Address & Contact', schema: addressSchema },
    { title: 'Emergency Contacts', schema: emergencyContactSchema },
    { title: 'Medical Information', schema: medicalInfoSchema },
    { title: 'Consent & Preferences', schema: consentSchema }
  ];

  const initialValues: PatientRegistrationValues = {
    // Personal Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    ssn: '',
    
    // Address Information
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    
    // Emergency Contacts
    emergencyContacts: [{
      name: '',
      relationship: '',
      phone: '',
      email: ''
    }],
    
    // Insurance Information
    insuranceProvider: '',
    insurancePolicyNumber: '',
    insuranceGroupNumber: '',
    
    // Medical Information
    bloodType: '',
    height: '',
    weight: '',
    allergies: [],
    medicalConditions: [],
    currentMedications: [],
    surgicalHistory: '',
    familyHistory: '',
    
    // Lifestyle Information
    smokingStatus: '',
    alcoholConsumption: '',
    exerciseFrequency: '',
    dietaryRestrictions: '',
    
    // Consent and Agreements
    hipaaConsent: false,
    treatmentConsent: false,
    communicationPreferences: [],
    marketingConsent: false,
    
    ...formData
  };

  const relationships = [
    'Spouse', 'Parent', 'Child', 'Sibling', 'Grandparent', 'Friend', 'Other'
  ];

  const smokingOptions = [
    'Never smoked', 'Former smoker', 'Current smoker (less than 1 pack/day)', 
    'Current smoker (1+ packs/day)', 'Occasional smoker'
  ];

  const alcoholOptions = [
    'Never', 'Rarely (few times per year)', 'Occasionally (few times per month)', 
    'Regularly (few times per week)', 'Daily'
  ];

  const exerciseOptions = [
    'Sedentary (little to no exercise)', 'Light (1-2 times per week)', 
    'Moderate (3-4 times per week)', 'Active (5+ times per week)', 'Very active (daily intense exercise)'
  ];

  const communicationOptions = [
    { value: 'email', label: 'Email notifications' },
    { value: 'sms', label: 'SMS/Text messages' },
    { value: 'phone', label: 'Phone calls' },
    { value: 'portal', label: 'Patient portal notifications' }
  ];

  const handleNext = async (values: PatientRegistrationValues) => {
    setFormData(prev => ({ ...prev, ...values }));
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      await handleSubmit(values);
    }
  };

  const handlePrevious = (values: PatientRegistrationValues) => {
    setFormData(prev => ({ ...prev, ...values }));
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (values: PatientRegistrationValues) => {
    setLoading?.(true);
    try {
      const patientData = {
        ...values,
        fullName: `${values.firstName} ${values.lastName}`,
        address: {
          street: values.street,
          city: values.city,
          state: values.state,
          zipCode: values.zipCode,
          country: values.country
        },
        registrationDate: new Date().toISOString()
      };

      const result = await trustCareAPI.registerPatient(
        patientData.fullName,
        Array.isArray(patientData.medicalConditions) 
          ? patientData.medicalConditions.join(', ') 
          : (patientData.medicalConditions || ''),
        patientData.email
      );
      
      if (result.success && result.data) {
        showMessage?.('✅ Registration completed successfully! Welcome to TrustCareConnect.', 'success');
        onRegistrationComplete?.(result.data.id);
      } else {
        showMessage?.(result.error || 'Registration failed. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Registration error:', error);
      showMessage?.('An error occurred during registration. Please try again.', 'error');
    } finally {
      setLoading?.(false);
    }
  };

  const formatSSN = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length >= 9) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`;
    } else if (digits.length >= 5) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
    } else if (digits.length >= 3) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    }
    return digits;
  };

  const renderStep = (values: PatientRegistrationValues, setFieldValue: any, errors: any, touched: any) => {
    switch (currentStep) {
      case 0: // Personal Information
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <Field
                  name="firstName"
                  placeholder="Enter your first name"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.firstName && touched.firstName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <ErrorMessage name="firstName" component="div" className="mt-1 text-sm text-red-600" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <Field
                  name="lastName"
                  placeholder="Enter your last name"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.lastName && touched.lastName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <ErrorMessage name="lastName" component="div" className="mt-1 text-sm text-red-600" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <Field
                  name="email"
                  type="email"
                  placeholder="your.email@example.com"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email && touched.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <ErrorMessage name="email" component="div" className="mt-1 text-sm text-red-600" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <Field
                  name="phone"
                  placeholder="(555) 123-4567"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.phone && touched.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <ErrorMessage name="phone" component="div" className="mt-1 text-sm text-red-600" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <Field
                  name="dateOfBirth"
                  type="date"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.dateOfBirth && touched.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <ErrorMessage name="dateOfBirth" component="div" className="mt-1 text-sm text-red-600" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender <span className="text-red-500">*</span>
                </label>
                <Field
                  as="select"
                  name="gender"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.gender && touched.gender ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </Field>
                <ErrorMessage name="gender" component="div" className="mt-1 text-sm text-red-600" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Social Security Number <span className="text-red-500">*</span>
                </label>
                <Field name="ssn">
                  {({ field }: any) => (
                    <input
                      {...field}
                      placeholder="XXX-XX-XXXX"
                      value={formatSSN(field.value)}
                      onChange={(e) => setFieldValue('ssn', formatSSN(e.target.value))}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.ssn && touched.ssn ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  )}
                </Field>
                <ErrorMessage name="ssn" component="div" className="mt-1 text-sm text-red-600" />
              </div>
            </div>
          </div>
        );

      case 1: // Address & Contact
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Street Address <span className="text-red-500">*</span>
              </label>
              <Field
                name="street"
                placeholder="123 Main Street, Apt 4B"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.street && touched.street ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <ErrorMessage name="street" component="div" className="mt-1 text-sm text-red-600" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City <span className="text-red-500">*</span>
                </label>
                <Field
                  name="city"
                  placeholder="City name"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.city && touched.city ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <ErrorMessage name="city" component="div" className="mt-1 text-sm text-red-600" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State <span className="text-red-500">*</span>
                </label>
                <Field
                  name="state"
                  placeholder="State"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.state && touched.state ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <ErrorMessage name="state" component="div" className="mt-1 text-sm text-red-600" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP Code <span className="text-red-500">*</span>
                </label>
                <Field
                  name="zipCode"
                  placeholder="12345"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.zipCode && touched.zipCode ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <ErrorMessage name="zipCode" component="div" className="mt-1 text-sm text-red-600" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country <span className="text-red-500">*</span>
                </label>
                <Field
                  name="country"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.country && touched.country ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <ErrorMessage name="country" component="div" className="mt-1 text-sm text-red-600" />
              </div>
            </div>

            {/* Insurance Information */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Insurance Information (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Insurance Provider
                  </label>
                  <Field
                    name="insuranceProvider"
                    placeholder="e.g., Blue Cross Blue Shield"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Policy Number
                  </label>
                  <Field
                    name="insurancePolicyNumber"
                    placeholder="Policy number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Group Number
                  </label>
                  <Field
                    name="insuranceGroupNumber"
                    placeholder="Group number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 2: // Emergency Contacts
        return (
          <div className="space-y-6">
            <FieldArray name="emergencyContacts">
              {({ push, remove }) => (
                <div>
                  {values.emergencyContacts.map((_, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold text-gray-800">
                          Emergency Contact {index + 1}
                        </h4>
                        {values.emergencyContacts.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => remove(index)}
                            className="bg-red-500 hover:bg-red-600 text-sm px-3 py-1"
                          >
                            Remove
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name <span className="text-red-500">*</span>
                          </label>
                          <Field
                            name={`emergencyContacts.${index}.name`}
                            placeholder="Full name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <ErrorMessage name={`emergencyContacts.${index}.name`} component="div" className="mt-1 text-sm text-red-600" />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Relationship <span className="text-red-500">*</span>
                          </label>
                          <Field
                            as="select"
                            name={`emergencyContacts.${index}.relationship`}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select relationship</option>
                            {relationships.map(rel => (
                              <option key={rel} value={rel}>{rel}</option>
                            ))}
                          </Field>
                          <ErrorMessage name={`emergencyContacts.${index}.relationship`} component="div" className="mt-1 text-sm text-red-600" />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number <span className="text-red-500">*</span>
                          </label>
                          <Field
                            name={`emergencyContacts.${index}.phone`}
                            placeholder="(555) 123-4567"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <ErrorMessage name={`emergencyContacts.${index}.phone`} component="div" className="mt-1 text-sm text-red-600" />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email (Optional)
                          </label>
                          <Field
                            name={`emergencyContacts.${index}.email`}
                            type="email"
                            placeholder="email@example.com"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <ErrorMessage name={`emergencyContacts.${index}.email`} component="div" className="mt-1 text-sm text-red-600" />
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    onClick={() => push({ name: '', relationship: '', phone: '', email: '' })}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    Add Another Emergency Contact
                  </Button>
                </div>
              )}
            </FieldArray>
          </div>
        );

      case 3: // Medical Information
        return (
          <div className="space-y-6">
            {/* Basic Medical Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Blood Type
                </label>
                <Field
                  as="select"
                  name="bloodType"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select blood type</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="unknown">Unknown</option>
                </Field>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height <span className="text-red-500">*</span>
                </label>
                <Field
                  name="height"
                  placeholder="5'10&quot; or 178cm"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.height && touched.height ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <ErrorMessage name="height" component="div" className="mt-1 text-sm text-red-600" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight (lbs) <span className="text-red-500">*</span>
                </label>
                <Field
                  name="weight"
                  type="number"
                  placeholder="150"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.weight && touched.weight ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <ErrorMessage name="weight" component="div" className="mt-1 text-sm text-red-600" />
              </div>
            </div>

            {/* Allergies */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Known Allergies
              </label>
              <FieldArray name="allergies">
                {({ push, remove }) => (
                  <div>
                    {values.allergies.map((_, index) => (
                      <div key={index} className="flex items-center space-x-2 mb-2">
                        <Field
                          name={`allergies.${index}`}
                          placeholder="Enter allergy"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <Button
                          type="button"
                          onClick={() => remove(index)}
                          className="bg-red-500 hover:bg-red-600 text-sm px-3 py-1"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      onClick={() => push('')}
                      className="bg-green-500 hover:bg-green-600 text-sm"
                    >
                      Add Allergy
                    </Button>
                  </div>
                )}
              </FieldArray>
            </div>

            {/* Lifestyle Information */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Lifestyle Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Smoking Status
                  </label>
                  <Field
                    as="select"
                    name="smokingStatus"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select smoking status</option>
                    {smokingOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </Field>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alcohol Consumption
                  </label>
                  <Field
                    as="select"
                    name="alcoholConsumption"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select alcohol consumption</option>
                    {alcoholOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </Field>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Exercise Frequency
                  </label>
                  <Field
                    as="select"
                    name="exerciseFrequency"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select exercise frequency</option>
                    {exerciseOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </Field>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dietary Restrictions
                  </label>
                  <Field
                    name="dietaryRestrictions"
                    placeholder="e.g., Vegetarian, Gluten-free, Diabetic"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Medical History Text Areas */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Surgical History
                </label>
                <Field
                  as="textarea"
                  name="surgicalHistory"
                  rows={3}
                  placeholder="List any previous surgeries with dates..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Family Medical History
                </label>
                <Field
                  as="textarea"
                  name="familyHistory"
                  rows={3}
                  placeholder="Describe relevant family medical history (parents, siblings, grandparents)..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        );

      case 4: // Consent & Preferences
        return (
          <div className="space-y-6">
            {/* Communication Preferences */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Communication Preferences <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {communicationOptions.map(option => (
                  <div key={option.value} className="flex items-center">
                    <Field
                      type="checkbox"
                      name="communicationPreferences"
                      value={option.value}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
              <ErrorMessage name="communicationPreferences" component="div" className="mt-1 text-sm text-red-600" />
            </div>

            {/* Marketing Consent */}
            <div className="border-t pt-6">
              <div className="flex items-start space-x-3">
                <Field
                  type="checkbox"
                  name="marketingConsent"
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="text-sm text-gray-700">
                  I consent to receive marketing communications, health tips, and promotional offers from TrustCareConnect. 
                  You can unsubscribe at any time.
                </label>
              </div>
            </div>

            {/* Required Consents */}
            <div className="border-t pt-6 space-y-6">
              <h3 className="text-lg font-semibold text-gray-800">Required Consents</h3>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Field
                    type="checkbox"
                    name="hipaaConsent"
                    className={`mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 ${
                      errors.hipaaConsent && touched.hipaaConsent ? 'border-red-500' : ''
                    }`}
                  />
                  <div>
                    <label className="text-sm text-gray-700">
                      <span className="text-red-500">*</span> I acknowledge that I have read and understand the 
                      <a href="/hipaa-notice" target="_blank" className="text-blue-600 hover:underline mx-1">
                        HIPAA Notice of Privacy Practices
                      </a>
                      and consent to the use and disclosure of my health information as described.
                    </label>
                    <ErrorMessage name="hipaaConsent" component="div" className="mt-1 text-sm text-red-600" />
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Field
                    type="checkbox"
                    name="treatmentConsent"
                    className={`mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 ${
                      errors.treatmentConsent && touched.treatmentConsent ? 'border-red-500' : ''
                    }`}
                  />
                  <div>
                    <label className="text-sm text-gray-700">
                      <span className="text-red-500">*</span> I consent to receive medical treatment and consultation 
                      through the TrustCareConnect platform. I understand that this platform provides medical 
                      guidance but is not a substitute for emergency medical care.
                    </label>
                    <ErrorMessage name="treatmentConsent" component="div" className="mt-1 text-sm text-red-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Important Information */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">Important Information</h4>
              <div className="text-sm text-yellow-700 space-y-1">
                <p>• This platform is for non-emergency medical consultations only.</p>
                <p>• For medical emergencies, call 911 immediately.</p>
                <p>• Your information is encrypted and stored securely.</p>
                <p>• You can update your preferences at any time in your profile.</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return <LoadingSpinner message="Processing registration..." />;
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border">
      {/* Header with progress */}
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Patient Registration</h1>
        
        {/* Progress indicator */}
        <div className="flex items-center space-x-2">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                index < currentStep ? 'bg-green-600 text-white' :
                index === currentStep ? 'bg-blue-600 text-white' :
                'bg-gray-200 text-gray-600'
              }`}>
                {index < currentStep ? '✓' : index + 1}
              </div>
              <span className={`ml-2 text-sm ${
                index === currentStep ? 'text-blue-600 font-medium' : 'text-gray-600'
              }`}>
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <div className="w-8 h-px bg-gray-300 mx-4"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      <Formik
        initialValues={initialValues}
        validationSchema={steps[currentStep].schema}
        onSubmit={() => {}} // Handled by handleNext/handleSubmit
        enableReinitialize
      >
        {({ values, errors, touched, setFieldValue, isValid }) => (
          <Form className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              {steps[currentStep].title}
            </h2>
            
            {renderStep(values, setFieldValue, errors, touched)}

            {/* Navigation buttons */}
            <div className="flex justify-between items-center pt-8 border-t mt-8">
              <div>
                {currentStep > 0 && (
                  <Button
                    type="button"
                    onClick={() => handlePrevious(values)}
                    className="bg-gray-500 hover:bg-gray-600"
                  >
                    Previous
                  </Button>
                )}
                {onCancel && currentStep === 0 && (
                  <Button
                    type="button"
                    onClick={onCancel}
                    className="bg-gray-500 hover:bg-gray-600"
                  >
                    Cancel
                  </Button>
                )}
              </div>

              <Button
                type="button"
                onClick={() => handleNext(values)}
                disabled={!isValid}
                loading={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {currentStep === steps.length - 1 ? 'Complete Registration' : 'Next'}
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default PatientRegistration;