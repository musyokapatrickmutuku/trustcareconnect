// MVP Tester Component - Direct access to processMedicalQuery
import React, { useState } from 'react';
import FormField from './common/FormField';
import Button from './common/Button';
import icpService from '../services/icpService';

const MvpTester: React.FC = () => {
  const [formData, setFormData] = useState({
    patientId: 'P001',
    query: '',
    bloodGlucose: '',
    bloodPressure: '',
    heartRate: '',
    temperature: ''
  });
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.query.trim() || formData.query.trim().length < 10) {
      setError('Please provide a query with at least 10 characters');
      return;
    }

    setLoading(true);
    setError(null);
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
        formData.patientId,
        formData.query.trim(),
        Object.keys(cleanVitalSigns).length > 0 ? cleanVitalSigns : undefined
      );

      if (result.success) {
        setResponse(result.data);
      } else {
        setError(result.error || 'Failed to process query');
      }
    } catch (error) {
      console.error('Query processing error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSampleQuery = (sampleType: 'sarah' | 'michael') => {
    if (sampleType === 'sarah') {
      setFormData({
        patientId: 'P001',
        query: "I've been feeling more tired lately and my morning blood sugars are higher than usual. Should I be concerned?",
        bloodGlucose: '180',
        bloodPressure: '125/75',
        heartRate: '72',
        temperature: ''
      });
    } else {
      setFormData({
        patientId: 'P002',
        query: "I'm having trouble with my blood sugars during college exams. They keep going high even with my pump.",
        bloodGlucose: '220',
        bloodPressure: '',
        heartRate: '85',
        temperature: ''
      });
    }
  };

  return (
    <div className="mvp-tester max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          🧪 MVP Test Interface - processMedicalQuery
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => handleSampleQuery('sarah')}
            className="bg-blue-100 hover:bg-blue-200 text-blue-800 p-4 rounded-lg text-left"
          >
            <div className="font-medium">Sample Query 1: Sarah (P001)</div>
            <div className="text-sm opacity-80">Type 2 Diabetes - Morning hyperglycemia</div>
          </button>
          
          <button
            onClick={() => handleSampleQuery('michael')}
            className="bg-green-100 hover:bg-green-200 text-green-800 p-4 rounded-lg text-left"
          >
            <div className="font-medium">Sample Query 2: Michael (P002)</div>
            <div className="text-sm opacity-80">Type 1 Diabetes - College stress</div>
          </button>
        </div>

        <div className="space-y-4">
          <FormField
            label="Patient ID"
            name="patientId"
            value={formData.patientId}
            onChange={(e) => handleInputChange('patientId', e.target.value)}
            placeholder="P001 or P002"
            required
          />

          <FormField
            label="Medical Query"
            name="query"
            type="textarea"
            value={formData.query}
            onChange={(e) => handleInputChange('query', e.target.value)}
            placeholder="Describe symptoms, concerns, or questions..."
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FormField
              label="Blood Glucose (mg/dL)"
              name="bloodGlucose"
              type="number"
              value={formData.bloodGlucose}
              onChange={(e) => handleInputChange('bloodGlucose', e.target.value)}
              placeholder="e.g., 120"
            />
            
            <FormField
              label="Blood Pressure"
              name="bloodPressure"
              value={formData.bloodPressure}
              onChange={(e) => handleInputChange('bloodPressure', e.target.value)}
              placeholder="e.g., 120/80"
            />
            
            <FormField
              label="Heart Rate (BPM)"
              name="heartRate"
              type="number"
              value={formData.heartRate}
              onChange={(e) => handleInputChange('heartRate', e.target.value)}
              placeholder="e.g., 72"
            />
            
            <FormField
              label="Temperature (°C)"
              name="temperature"
              type="number"
              step="0.1"
              value={formData.temperature}
              onChange={(e) => handleInputChange('temperature', e.target.value)}
              placeholder="e.g., 37.0"
            />
          </div>

          <Button
            onClick={handleSubmit}
            loading={loading}
            disabled={!formData.query.trim() || formData.query.trim().length < 10}
            className="w-full"
          >
            {loading ? 'Processing Medical Query...' : 'Process Medical Query (MVP)'}
          </Button>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium">❌ Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>

      {response && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            🤖 AI Medical Response
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Safety Score</div>
              <div className="text-2xl font-bold text-gray-900">{response.safetyScore}%</div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Urgency Level</div>
              <div className={`text-2xl font-bold ${
                response.urgency === 'HIGH' ? 'text-red-600' :
                response.urgency === 'MEDIUM' ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                {response.urgency}
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Doctor Review</div>
              <div className={`text-2xl font-bold ${
                response.requiresReview ? 'text-blue-600' : 'text-green-600'
              }`}>
                {response.requiresReview ? 'Required' : 'Not Required'}
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h4 className="font-medium text-green-900 mb-3">Medical Guidance:</h4>
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-gray-800">
                {response.content}
              </div>
            </div>
          </div>

          {response.requiresReview && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 font-medium">
                📋 This response has been flagged for doctor review due to:
              </p>
              <ul className="text-blue-700 text-sm mt-2 list-disc list-inside">
                <li>Safety score below 70% threshold</li>
                <li>High urgency medical situation detected</li>
                <li>Requires professional medical validation</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MvpTester;