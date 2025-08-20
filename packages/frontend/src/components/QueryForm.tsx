import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import { Patient, ComponentProps } from '../types';
import Button from './common/Button';
import LoadingSpinner from './common/LoadingSpinner';
import trustCareAPI from '../api/trustcare';

interface QueryFormProps extends ComponentProps {
  patient: Patient;
  onQuerySubmitted?: (queryId: string) => void;
  onCancel?: () => void;
  initialValues?: Partial<QueryFormValues>;
}

interface QueryFormValues {
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  symptoms: string;
  duration: string;
  previousTreatments: string;
  medications: string;
  allergies: string;
  additionalNotes: string;
  consent: boolean;
}

// Validation schema using Yup
const validationSchema = Yup.object({
  title: Yup.string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must not exceed 100 characters')
    .required('Title is required'),
  
  description: Yup.string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must not exceed 2000 characters')
    .required('Description is required'),
  
  category: Yup.string()
    .oneOf([
      'general',
      'cardiology',
      'dermatology',
      'endocrinology',
      'gastroenterology',
      'neurology',
      'orthopedics',
      'psychiatry',
      'pulmonology',
      'rheumatology',
      'urology',
      'other'
    ], 'Please select a valid category')
    .required('Category is required'),
  
  priority: Yup.string()
    .oneOf(['low', 'medium', 'high', 'urgent'], 'Please select a valid priority')
    .required('Priority is required'),
  
  symptoms: Yup.string()
    .min(10, 'Please provide more detailed symptoms (at least 10 characters)')
    .max(1000, 'Symptoms description must not exceed 1000 characters')
    .required('Symptoms description is required'),
  
  duration: Yup.string()
    .required('Please specify how long you\'ve been experiencing these symptoms'),
  
  previousTreatments: Yup.string()
    .max(500, 'Previous treatments description must not exceed 500 characters'),
  
  medications: Yup.string()
    .max(500, 'Current medications list must not exceed 500 characters'),
  
  allergies: Yup.string()
    .max(300, 'Allergies list must not exceed 300 characters'),
  
  additionalNotes: Yup.string()
    .max(1000, 'Additional notes must not exceed 1000 characters'),
  
  consent: Yup.boolean()
    .oneOf([true], 'You must provide consent to submit this query')
    .required('Consent is required')
});

const QueryForm: React.FC<QueryFormProps> = ({
  patient,
  onQuerySubmitted,
  onCancel,
  initialValues,
  showMessage,
  loading,
  setLoading
}) => {
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const defaultValues: QueryFormValues = {
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    symptoms: '',
    duration: '',
    previousTreatments: '',
    medications: '',
    allergies: '',
    additionalNotes: '',
    consent: false,
    ...initialValues
  };

  const categories = [
    { value: 'general', label: 'General Medicine' },
    { value: 'cardiology', label: 'Cardiology (Heart & Circulation)' },
    { value: 'dermatology', label: 'Dermatology (Skin)' },
    { value: 'endocrinology', label: 'Endocrinology (Hormones & Diabetes)' },
    { value: 'gastroenterology', label: 'Gastroenterology (Digestive System)' },
    { value: 'neurology', label: 'Neurology (Brain & Nervous System)' },
    { value: 'orthopedics', label: 'Orthopedics (Bones & Joints)' },
    { value: 'psychiatry', label: 'Psychiatry (Mental Health)' },
    { value: 'pulmonology', label: 'Pulmonology (Lungs & Breathing)' },
    { value: 'rheumatology', label: 'Rheumatology (Autoimmune & Arthritis)' },
    { value: 'urology', label: 'Urology (Urinary & Reproductive)' },
    { value: 'other', label: 'Other - Please specify in description' }
  ];

  const priorities = [
    { value: 'low', label: 'Low - Non-urgent general question', color: 'text-green-600' },
    { value: 'medium', label: 'Medium - Routine medical concern', color: 'text-yellow-600' },
    { value: 'high', label: 'High - Concerning symptoms', color: 'text-orange-600' },
    { value: 'urgent', label: 'Urgent - Immediate attention needed', color: 'text-red-600' }
  ];

  const durationOptions = [
    'Less than 24 hours',
    '1-3 days',
    '4-7 days',
    '1-2 weeks',
    '2-4 weeks',
    '1-3 months',
    '3-6 months',
    'More than 6 months',
    'Chronic/Ongoing',
    'Recurring episodes'
  ];

  const handleSubmit = async (
    values: QueryFormValues,
    { setSubmitting, resetForm }: FormikHelpers<QueryFormValues>
  ) => {
    setSubmitAttempted(true);
    
    if (!patient.assignedDoctorId) {
      showMessage?.('You must be assigned to a doctor before submitting queries', 'error');
      setSubmitting(false);
      return;
    }

    setLoading?.(true);
    try {
      // Prepare query data
      const queryData = {
        title: values.title.trim(),
        description: values.description.trim(),
        category: values.category,
        priority: values.priority,
        symptoms: values.symptoms.trim(),
        duration: values.duration,
        previousTreatments: values.previousTreatments.trim(),
        medications: values.medications.trim(),
        allergies: values.allergies.trim(),
        additionalNotes: values.additionalNotes.trim(),
        patientConsent: values.consent,
        patientId: patient.id
      };

      const result = await trustCareAPI.submitQuery(
        patient.id,
        queryData.title,
        `**Category:** ${values.category}
**Priority:** ${values.priority}
**Symptoms:** ${queryData.symptoms}
**Duration:** ${queryData.duration}
**Previous Treatments:** ${queryData.previousTreatments || 'None specified'}
**Current Medications:** ${queryData.medications || 'None specified'}
**Known Allergies:** ${queryData.allergies || 'None specified'}

**Description:**
${queryData.description}

**Additional Notes:**
${queryData.additionalNotes || 'None'}

**Patient Consent:** Provided on ${new Date().toLocaleDateString()}`
      );

      if (result.success) {
        showMessage?.('✅ Query submitted successfully! Your query has been processed by our AI system and sent to your assigned doctor for review. You will receive notifications as your query progresses.', 'success');
        resetForm();
        onQuerySubmitted?.(result.data?.id || '');
      } else {
        showMessage?.(result.error || 'Failed to submit query', 'error');
      }
    } catch (error) {
      console.error('Query submission error:', error);
      showMessage?.('An error occurred while submitting your query. Please try again.', 'error');
    } finally {
      setLoading?.(false);
      setSubmitting(false);
    }
  };

  if (!patient.assignedDoctorId) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center">
          <svg className="w-6 h-6 text-yellow-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <h3 className="text-lg font-semibold text-yellow-800">Doctor Assignment Required</h3>
            <p className="text-yellow-700 mt-1">
              You need to be assigned to a doctor before you can submit medical queries. 
              Please contact our support team to get assigned to a healthcare provider.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b">
        <h2 className="text-2xl font-bold text-gray-800">Submit Medical Query</h2>
        <p className="text-gray-600 mt-1">
          Please provide detailed information about your medical concern. This will help your doctor provide the best possible guidance.
        </p>
      </div>

      <Formik
        initialValues={defaultValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        validateOnChange={submitAttempted}
        validateOnBlur={submitAttempted}
      >
        {({ values, errors, touched, isSubmitting, setFieldValue }) => (
          <Form className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Basic Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Query Title <span className="text-red-500">*</span>
                </label>
                <Field
                  as="input"
                  name="title"
                  placeholder="Brief, descriptive title for your medical query"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.title && touched.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <ErrorMessage name="title" component="div" className="mt-1 text-sm text-red-600" />
                <div className="text-xs text-gray-500 mt-1">{values.title.length}/100 characters</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medical Category <span className="text-red-500">*</span>
                  </label>
                  <Field
                    as="select"
                    name="category"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.category && touched.category ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage name="category" component="div" className="mt-1 text-sm text-red-600" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority Level <span className="text-red-500">*</span>
                  </label>
                  <Field
                    as="select"
                    name="priority"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.priority && touched.priority ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    {priorities.map((priority) => (
                      <option key={priority.value} value={priority.value} className={priority.color}>
                        {priority.label}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage name="priority" component="div" className="mt-1 text-sm text-red-600" />
                </div>
              </div>
            </div>

            {/* Symptoms and Medical Details */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Medical Details</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Detailed Description <span className="text-red-500">*</span>
                </label>
                <Field
                  as="textarea"
                  name="description"
                  rows={4}
                  placeholder="Provide a detailed description of your medical concern, including any relevant background information..."
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical ${
                    errors.description && touched.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <ErrorMessage name="description" component="div" className="mt-1 text-sm text-red-600" />
                <div className="text-xs text-gray-500 mt-1">{values.description.length}/2000 characters</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Symptoms <span className="text-red-500">*</span>
                </label>
                <Field
                  as="textarea"
                  name="symptoms"
                  rows={3}
                  placeholder="Describe your current symptoms in detail (pain level, location, type of discomfort, etc.)"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical ${
                    errors.symptoms && touched.symptoms ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <ErrorMessage name="symptoms" component="div" className="mt-1 text-sm text-red-600" />
                <div className="text-xs text-gray-500 mt-1">{values.symptoms.length}/1000 characters</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration <span className="text-red-500">*</span>
                </label>
                <Field
                  as="select"
                  name="duration"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.duration && touched.duration ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">How long have you been experiencing these symptoms?</option>
                  {durationOptions.map((duration) => (
                    <option key={duration} value={duration}>
                      {duration}
                    </option>
                  ))}
                </Field>
                <ErrorMessage name="duration" component="div" className="mt-1 text-sm text-red-600" />
              </div>
            </div>

            {/* Medical History */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Medical History</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Previous Treatments
                </label>
                <Field
                  as="textarea"
                  name="previousTreatments"
                  rows={3}
                  placeholder="Have you tried any treatments, medications, or home remedies for this condition? If so, please describe..."
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical ${
                    errors.previousTreatments && touched.previousTreatments ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <ErrorMessage name="previousTreatments" component="div" className="mt-1 text-sm text-red-600" />
                <div className="text-xs text-gray-500 mt-1">{values.previousTreatments.length}/500 characters</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Medications
                  </label>
                  <Field
                    as="textarea"
                    name="medications"
                    rows={3}
                    placeholder="List any medications you're currently taking (include dosages if possible)"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical ${
                      errors.medications && touched.medications ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <ErrorMessage name="medications" component="div" className="mt-1 text-sm text-red-600" />
                  <div className="text-xs text-gray-500 mt-1">{values.medications.length}/500 characters</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Known Allergies
                  </label>
                  <Field
                    as="textarea"
                    name="allergies"
                    rows={3}
                    placeholder="List any known allergies or adverse reactions to medications, foods, or other substances"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical ${
                      errors.allergies && touched.allergies ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <ErrorMessage name="allergies" component="div" className="mt-1 text-sm text-red-600" />
                  <div className="text-xs text-gray-500 mt-1">{values.allergies.length}/300 characters</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <Field
                  as="textarea"
                  name="additionalNotes"
                  rows={3}
                  placeholder="Any additional information that might be relevant to your query..."
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical ${
                    errors.additionalNotes && touched.additionalNotes ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <ErrorMessage name="additionalNotes" component="div" className="mt-1 text-sm text-red-600" />
                <div className="text-xs text-gray-500 mt-1">{values.additionalNotes.length}/1000 characters</div>
              </div>
            </div>

            {/* Consent and Disclaimers */}
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800">Important Information & Consent</h3>
              
              <div className="text-sm text-gray-600 space-y-2">
                <p>
                  <strong>Medical Disclaimer:</strong> This platform provides medical information and guidance, 
                  but is not a substitute for professional medical advice, diagnosis, or treatment. 
                  Always seek the advice of qualified health providers with questions about your health.
                </p>
                <p>
                  <strong>Emergency Notice:</strong> If you are experiencing a medical emergency, 
                  please call emergency services immediately. Do not use this platform for urgent medical situations.
                </p>
                <p>
                  <strong>Privacy:</strong> Your medical information will be kept confidential and 
                  shared only with assigned healthcare providers for the purpose of providing medical guidance.
                </p>
              </div>

              <div className="flex items-start space-x-3">
                <Field
                  type="checkbox"
                  name="consent"
                  className={`mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 ${
                    errors.consent && touched.consent ? 'border-red-500' : ''
                  }`}
                />
                <label className="text-sm text-gray-700">
                  <span className="text-red-500">*</span> I understand and agree to the above terms. 
                  I consent to sharing my medical information with assigned healthcare providers 
                  for the purpose of receiving medical guidance. I acknowledge that this is not 
                  emergency medical care.
                </label>
              </div>
              <ErrorMessage name="consent" component="div" className="text-sm text-red-600" />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-6 border-t">
              {onCancel && (
                <Button
                  type="button"
                  onClick={onCancel}
                  className="bg-gray-500 hover:bg-gray-600"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              )}
              
              <div className="flex space-x-3 ml-auto">
                <Button
                  type="button"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="bg-gray-200 text-gray-700 hover:bg-gray-300"
                  disabled={isSubmitting}
                >
                  Review Form
                </Button>
                <Button
                  type="submit"
                  loading={isSubmitting}
                  disabled={isSubmitting || loading}
                  className="bg-blue-600 hover:bg-blue-700 px-8"
                >
                  {isSubmitting ? 'Submitting Query...' : 'Submit Medical Query'}
                </Button>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default QueryForm;