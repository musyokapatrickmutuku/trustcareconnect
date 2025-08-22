import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { MedicalQuery, Doctor, ComponentProps } from '../types';
import Button from './common/Button';
import LoadingSpinner from './common/LoadingSpinner';
import trustCareAPI from '../api/trustcare';

interface DoctorResponseProps extends ComponentProps {
  query: MedicalQuery;
  doctor: Doctor;
  onResponseSubmitted?: (queryId: string, response: string) => void;
  onCancel?: () => void;
  existingResponse?: string;
  mode?: 'respond' | 'review' | 'edit';
}

interface ResponseTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
}

interface ResponseData {
  content: string;
  diagnosis: string;
  recommendations: string[];
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }>;
  followUp: string;
  urgency: 'low' | 'medium' | 'high' | 'immediate';
  requiresInPersonVisit: boolean;
  additionalTests: string[];
  patientInstructions: string;
  doctorNotes: string;
}

const DoctorResponse: React.FC<DoctorResponseProps> = ({
  query,
  doctor,
  onResponseSubmitted,
  onCancel,
  existingResponse,
  mode = 'respond',
  showMessage,
  loading,
  setLoading
}) => {
  const [responseData, setResponseData] = useState<ResponseData>({
    content: existingResponse || '',
    diagnosis: '',
    recommendations: [''],
    medications: [],
    followUp: '',
    urgency: 'medium',
    requiresInPersonVisit: false,
    additionalTests: [],
    patientInstructions: '',
    doctorNotes: ''
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [templates, setTemplates] = useState<ResponseTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [wordCount, setWordCount] = useState(0);
  const [isValidating, setIsValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null);

  const quillRef = useRef<ReactQuill>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout>();

  const steps = [
    'Clinical Assessment',
    'Treatment Plan', 
    'Patient Instructions',
    'Review & Submit'
  ];

  // Rich text editor modules and formats
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['blockquote', 'code-block'],
      ['link'],
      [{ 'align': [] }],
      ['clean']
    ],
    clipboard: {
      matchVisual: false
    }
  };

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'color', 'background', 'list', 'bullet', 'indent',
    'blockquote', 'code-block', 'link', 'align'
  ];

  // Load templates on component mount
  useEffect(() => {
    loadResponseTemplates();
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (responseData.content) {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
      
      autoSaveTimer.current = setTimeout(() => {
        autoSaveResponse();
      }, 5000); // Auto-save after 5 seconds of inactivity
    }

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [responseData]);

  // Update word count when content changes
  useEffect(() => {
    if (responseData.content) {
      const text = responseData.content.replace(/<[^>]*>/g, ''); // Strip HTML tags
      setWordCount(text.split(/\s+/).filter(word => word.length > 0).length);
    } else {
      setWordCount(0);
    }
  }, [responseData.content]);

  const loadResponseTemplates = async () => {
    try {
      const result = await trustCareAPI.getResponseTemplates();
      if (result.success && result.data) {
        setTemplates(result.data);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const autoSaveResponse = async () => {
    if (!responseData.content.trim()) return;

    setAutoSaveStatus('saving');
    try {
      await trustCareAPI.saveDraftResponse(query.id, doctor.id, responseData.content);
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus(null), 3000);
    } catch (error) {
      setAutoSaveStatus('error');
      console.error('Auto-save failed:', error);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setResponseData(prev => ({
        ...prev,
        content: prev.content + '\n\n' + template.content
      }));
    }
    setSelectedTemplate('');
  };

  const addRecommendation = () => {
    setResponseData(prev => ({
      ...prev,
      recommendations: [...prev.recommendations, '']
    }));
  };

  const updateRecommendation = (index: number, value: string) => {
    setResponseData(prev => ({
      ...prev,
      recommendations: prev.recommendations.map((rec, i) => i === index ? value : rec)
    }));
  };

  const removeRecommendation = (index: number) => {
    setResponseData(prev => ({
      ...prev,
      recommendations: prev.recommendations.filter((_, i) => i !== index)
    }));
  };

  const addMedication = () => {
    setResponseData(prev => ({
      ...prev,
      medications: [...prev.medications, {
        name: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: ''
      }]
    }));
  };

  const updateMedication = (index: number, field: string, value: string) => {
    setResponseData(prev => ({
      ...prev,
      medications: prev.medications.map((med, i) => 
        i === index ? { ...med, [field]: value } : med
      )
    }));
  };

  const removeMedication = (index: number) => {
    setResponseData(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }));
  };

  const addAdditionalTest = (test: string) => {
    if (test.trim() && !responseData.additionalTests.includes(test.trim())) {
      setResponseData(prev => ({
        ...prev,
        additionalTests: [...prev.additionalTests, test.trim()]
      }));
    }
  };

  const removeAdditionalTest = (index: number) => {
    setResponseData(prev => ({
      ...prev,
      additionalTests: prev.additionalTests.filter((_, i) => i !== index)
    }));
  };

  const validateResponse = () => {
    const errors: string[] = [];

    if (!responseData.content.trim()) {
      errors.push('Response content is required');
    } else if (wordCount < 50) {
      errors.push('Response should be at least 50 words');
    }

    if (!responseData.diagnosis.trim()) {
      errors.push('Clinical assessment/diagnosis is required');
    }

    if (responseData.recommendations.filter(rec => rec.trim()).length === 0) {
      errors.push('At least one recommendation is required');
    }

    if (!responseData.patientInstructions.trim()) {
      errors.push('Patient instructions are required');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async () => {
    setIsValidating(true);
    
    if (!validateResponse()) {
      setIsValidating(false);
      showMessage?.('Please correct the validation errors before submitting', 'error');
      return;
    }

    setLoading?.(true);
    try {
      // Compile the complete response
      const completeResponse = {
        queryId: query.id,
        doctorId: doctor.id,
        content: responseData.content,
        clinicalAssessment: responseData.diagnosis,
        recommendations: responseData.recommendations.filter(rec => rec.trim()),
        medications: responseData.medications.filter(med => med.name.trim()),
        followUpInstructions: responseData.followUp,
        urgencyLevel: responseData.urgency,
        requiresInPersonVisit: responseData.requiresInPersonVisit,
        additionalTestsRecommended: responseData.additionalTests,
        patientInstructions: responseData.patientInstructions,
        internalNotes: responseData.doctorNotes,
        responseTimestamp: new Date().toISOString(),
        wordCount
      };

      const result = await trustCareAPI.submitDoctorResponse(query.id, doctor.id, responseData.content);

      if (result.success) {
        showMessage?.('✅ Response submitted successfully! The patient has been notified.', 'success');
        onResponseSubmitted?.(query.id, responseData.content);
      } else {
        showMessage?.(result.error || 'Failed to submit response', 'error');
      }
    } catch (error) {
      console.error('Response submission error:', error);
      showMessage?.('An error occurred while submitting the response', 'error');
    } finally {
      setLoading?.(false);
      setIsValidating(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Clinical Assessment
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clinical Assessment / Diagnosis <span className="text-red-500">*</span>
              </label>
              <textarea
                value={responseData.diagnosis}
                onChange={(e) => setResponseData(prev => ({ ...prev, diagnosis: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Provide your clinical assessment based on the patient's symptoms and history..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Urgency Level
              </label>
              <select
                value={responseData.urgency}
                onChange={(e) => setResponseData(prev => ({ ...prev, urgency: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low - Routine follow-up</option>
                <option value="medium">Medium - Standard care</option>
                <option value="high">High - Prompt attention needed</option>
                <option value="immediate">Immediate - Urgent care required</option>
              </select>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="requiresVisit"
                checked={responseData.requiresInPersonVisit}
                onChange={(e) => setResponseData(prev => ({ ...prev, requiresInPersonVisit: e.target.checked }))}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="requiresVisit" className="text-sm text-gray-700">
                This condition requires an in-person visit
              </label>
            </div>
          </div>
        );

      case 1: // Treatment Plan
        return (
          <div className="space-y-6">
            {/* Recommendations */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recommendations <span className="text-red-500">*</span>
              </label>
              {responseData.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={recommendation}
                    onChange={(e) => updateRecommendation(index, e.target.value)}
                    placeholder={`Recommendation ${index + 1}`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {responseData.recommendations.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeRecommendation(index)}
                      className="bg-red-500 hover:bg-red-600 text-sm px-3 py-1"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                onClick={addRecommendation}
                className="bg-green-500 hover:bg-green-600 text-sm"
              >
                Add Recommendation
              </Button>
            </div>

            {/* Medications */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Prescribed Medications
              </label>
              {responseData.medications.map((medication, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium">Medication {index + 1}</h4>
                    <Button
                      type="button"
                      onClick={() => removeMedication(index)}
                      className="bg-red-500 hover:bg-red-600 text-sm px-3 py-1"
                    >
                      Remove
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={medication.name}
                      onChange={(e) => updateMedication(index, 'name', e.target.value)}
                      placeholder="Medication name"
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={medication.dosage}
                      onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                      placeholder="Dosage (e.g., 500mg)"
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={medication.frequency}
                      onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                      placeholder="Frequency (e.g., twice daily)"
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={medication.duration}
                      onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                      placeholder="Duration (e.g., 7 days)"
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <textarea
                    value={medication.instructions}
                    onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                    placeholder="Special instructions for this medication..."
                    className="w-full mt-3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>
              ))}
              <Button
                type="button"
                onClick={addMedication}
                className="bg-green-500 hover:bg-green-600"
              >
                Add Medication
              </Button>
            </div>

            {/* Additional Tests */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recommended Additional Tests
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {responseData.additionalTests.map((test, index) => (
                  <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                    {test}
                    <button
                      type="button"
                      onClick={() => removeAdditionalTest(index)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex space-x-2">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      addAdditionalTest(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a test</option>
                  <option value="Blood work (CBC)">Blood work (CBC)</option>
                  <option value="Comprehensive metabolic panel">Comprehensive metabolic panel</option>
                  <option value="X-ray">X-ray</option>
                  <option value="MRI">MRI</option>
                  <option value="CT scan">CT scan</option>
                  <option value="Ultrasound">Ultrasound</option>
                  <option value="ECG/EKG">ECG/EKG</option>
                  <option value="Urine analysis">Urine analysis</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 2: // Patient Instructions
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patient Instructions <span className="text-red-500">*</span>
              </label>
              <textarea
                value={responseData.patientInstructions}
                onChange={(e) => setResponseData(prev => ({ ...prev, patientInstructions: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={6}
                placeholder="Provide clear, actionable instructions for the patient including lifestyle modifications, care instructions, warning signs to watch for, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Follow-up Instructions
              </label>
              <textarea
                value={responseData.followUp}
                onChange={(e) => setResponseData(prev => ({ ...prev, followUp: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="When should the patient follow up? What should they monitor? When to seek immediate care?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Internal Notes (Not visible to patient)
              </label>
              <textarea
                value={responseData.doctorNotes}
                onChange={(e) => setResponseData(prev => ({ ...prev, doctorNotes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Internal notes for your records, differential diagnoses considered, reasoning, etc."
              />
            </div>
          </div>
        );

      case 3: // Review & Submit
        return (
          <div className="space-y-6">
            {validationErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-800 mb-2">Please correct the following errors:</h4>
                <ul className="list-disc list-inside text-red-700 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3">Response Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Word Count:</strong> {wordCount} words
                </div>
                <div>
                  <strong>Urgency Level:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    responseData.urgency === 'immediate' ? 'bg-red-100 text-red-800' :
                    responseData.urgency === 'high' ? 'bg-orange-100 text-orange-800' :
                    responseData.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {responseData.urgency.toUpperCase()}
                  </span>
                </div>
                <div>
                  <strong>Recommendations:</strong> {responseData.recommendations.filter(r => r.trim()).length}
                </div>
                <div>
                  <strong>Medications:</strong> {responseData.medications.filter(m => m.name.trim()).length}
                </div>
                <div>
                  <strong>Additional Tests:</strong> {responseData.additionalTests.length}
                </div>
                <div>
                  <strong>In-Person Visit:</strong> {responseData.requiresInPersonVisit ? 'Required' : 'Not required'}
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold text-gray-800">Response Preview</h4>
                <Button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="bg-gray-500 hover:bg-gray-600 text-sm"
                >
                  {showPreview ? 'Hide Preview' : 'Show Preview'}
                </Button>
              </div>
              
              {showPreview && (
                <div className="border border-gray-200 rounded-lg p-4 bg-white max-h-96 overflow-y-auto">
                  <div dangerouslySetInnerHTML={{ __html: responseData.content }} />
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading && !responseData.content) {
    return <LoadingSpinner message="Loading response editor..." />;
  }

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {mode === 'edit' ? 'Edit Response' : 'Medical Response'}
            </h1>
            <p className="text-gray-600 mt-1">
              Query: {query.title} | Patient ID: {query.patientId}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {autoSaveStatus && (
              <div className={`text-sm ${
                autoSaveStatus === 'saved' ? 'text-green-600' :
                autoSaveStatus === 'saving' ? 'text-blue-600' :
                'text-red-600'
              }`}>
                {autoSaveStatus === 'saved' && '✓ Saved'}
                {autoSaveStatus === 'saving' && '⏳ Saving...'}
                {autoSaveStatus === 'error' && '⚠ Save failed'}
              </div>
            )}
            
            <div className="text-sm text-gray-500">
              Dr. {doctor.name} | {doctor.specialization}
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center space-x-4 mt-6">
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
                {step}
              </span>
              {index < steps.length - 1 && (
                <div className="w-8 h-px bg-gray-300 mx-4"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Query Details */}
      <div className="p-6 border-b bg-gray-50">
        <h3 className="font-semibold text-gray-800 mb-3">Patient Query Details</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-sm">
          <div>
            <strong>Description:</strong>
            <p className="mt-1 text-gray-700">{query.description}</p>
          </div>
          {query.aiDraftResponse && (
            <div className="lg:col-span-2">
              <strong>AI Draft Response:</strong>
              <p className="mt-1 text-gray-700 bg-blue-50 p-3 rounded italic">
                {query.aiDraftResponse}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {currentStep === 0 && (
          <div className="mb-6">
            {/* Template Selection */}
            <div className="flex items-center space-x-4 mb-6">
              <label className="text-sm font-medium text-gray-700">Use Template:</label>
              <select
                value={selectedTemplate}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Rich Text Editor */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Response Content <span className="text-red-500">*</span>
                </label>
                <div className="text-sm text-gray-500">
                  {wordCount} words
                </div>
              </div>
              
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={responseData.content}
                onChange={(content) => setResponseData(prev => ({ ...prev, content }))}
                modules={modules}
                formats={formats}
                placeholder="Provide your medical response to the patient's query. Include your clinical assessment, recommendations, and any important instructions..."
                style={{ minHeight: '200px' }}
              />
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            {steps[currentStep]}
          </h2>
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-6 border-t">
          <div>
            {currentStep > 0 && (
              <Button
                type="button"
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="bg-gray-500 hover:bg-gray-600"
                disabled={loading}
              >
                Previous
              </Button>
            )}
            {onCancel && currentStep === 0 && (
              <Button
                type="button"
                onClick={onCancel}
                className="bg-gray-500 hover:bg-gray-600"
                disabled={loading}
              >
                Cancel
              </Button>
            )}
          </div>

          <div className="flex space-x-3">
            {currentStep < steps.length - 1 ? (
              <Button
                type="button"
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                Next
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="bg-gray-500 hover:bg-gray-600"
                  disabled={loading}
                >
                  Review
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  loading={loading || isValidating}
                  disabled={loading || isValidating || validationErrors.length > 0}
                  className="bg-green-600 hover:bg-green-700 px-8"
                >
                  {isValidating ? 'Validating...' : 'Submit Response'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorResponse;