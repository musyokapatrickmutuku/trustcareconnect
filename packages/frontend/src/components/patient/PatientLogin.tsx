import React, { useState } from 'react';
import FormField from '../common/FormField';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import { Patient } from '../../types';
import icpService from '../../services/icpService';

interface PatientLoginProps {
  onLoginSuccess: (patient: Patient) => void;
  showMessage: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const PatientLogin: React.FC<PatientLoginProps> = ({
  onLoginSuccess,
  showMessage,
  loading,
  setLoading
}) => {
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
    patientId: ''
  });
  const [loginMode, setLoginMode] = useState<'email' | 'id'>('email');

  const handleInputChange = (field: string, value: string) => {
    setLoginData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogin = async () => {
    if (loginMode === 'email' && (!loginData.email.trim() || !loginData.password.trim())) {
      showMessage('Please enter both email and password', 'error');
      return;
    }
    
    if (loginMode === 'id' && !loginData.patientId.trim()) {
      showMessage('Please enter your patient ID', 'error');
      return;
    }

    setLoading(true);
    
    try {
      let result;
      if (loginMode === 'email') {
        // For demo purposes, we'll validate against our test credentials
        const testCredentials = [
          { email: 'sarah.johnson@email.com', password: 'SarahDiabetes2024!', id: 'patient_1' },
          { email: 'mike.rodriguez@student.edu', password: 'MikeType1Diabetes!', id: 'patient_2' },
          { email: 'carlos.mendoza@gmail.com', password: 'CarlosDiabetes62!', id: 'patient_3' },
          { email: 'priya.patel@work.com', password: 'PriyaDiabetes28!', id: 'patient_4' },
          { email: 'dorothy.williams@senior.net', password: 'DorothyDiabetes71!', id: 'patient_5' }
        ];

        const credential = testCredentials.find(
          cred => cred.email === loginData.email && cred.password === loginData.password
        );

        if (credential) {
          // Search for patient by email in the backend
          result = await icpService.findPatientByEmail(loginData.email);
          if (!result.success || !result.data) {
            // If not found, try to get by our expected ID
            result = await icpService.getPatient(credential.id);
          }
        } else {
          showMessage('Invalid email or password. Please check your credentials.', 'error');
          setLoading(false);
          return;
        }
      } else {
        // Get patient by ID
        result = await icpService.getPatient(loginData.patientId);
      }

      if (result.success && result.data) {
        showMessage('Login successful!', 'success');
        onLoginSuccess(result.data);
      } else {
        showMessage('Patient not found. Please check your credentials.', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      showMessage('Login failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const switchLoginMode = () => {
    setLoginMode(prev => prev === 'email' ? 'id' : 'email');
    setLoginData({ email: '', password: '', patientId: '' });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Patient Login</h2>
        <p className="text-gray-600">Access your medical queries and health information</p>
      </div>

      <div className="mb-4">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setLoginMode('email')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              loginMode === 'email'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Login with Email
          </button>
          <button
            onClick={() => setLoginMode('id')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              loginMode === 'id'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Login with Patient ID
          </button>
        </div>
      </div>

      {loginMode === 'email' ? (
        <>
          <FormField
            label="Email Address"
            type="email"
            name="email"
            value={loginData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="Enter your registered email address"
            required
          />
          <FormField
            label="Password"
            type="password"
            name="password"
            value={loginData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            placeholder="Enter your password"
            required
          />
        </>
      ) : (
        <FormField
          label="Patient ID"
          type="text"
          name="patientId"
          value={loginData.patientId}
          onChange={(e) => handleInputChange('patientId', e.target.value)}
          placeholder="Enter your patient ID (e.g., patient_1)"
          required
        />
      )}

      <div className="mt-6">
        <Button
          onClick={handleLogin}
          disabled={loading}
          className="w-full"
        >
          {loading ? <LoadingSpinner size="small" /> : 'Login'}
        </Button>
      </div>

      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <span className="text-blue-600 font-medium">
            Click "New patient? Register here →" below to register
          </span>
        </p>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-2">Test Patient Accounts:</p>
          <div className="space-y-2 text-xs">
            <div>
              <p className="font-medium">Sarah Johnson (Type 2 Diabetes)</p>
              <p>📧 sarah.johnson@email.com</p>
              <p>🔑 SarahDiabetes2024!</p>
            </div>
            <div>
              <p className="font-medium">Michael Rodriguez (Type 1 Diabetes)</p>
              <p>📧 mike.rodriguez@student.edu</p>
              <p>🔑 MikeType1Diabetes!</p>
            </div>
            <div>
              <p className="font-medium">Carlos Mendoza (Type 2 Diabetes)</p>
              <p>📧 carlos.mendoza@gmail.com</p>
              <p>🔑 CarlosDiabetes62!</p>
            </div>
            <div className="text-xs text-blue-600 mt-2">
              💡 All accounts include comprehensive medical histories for AI context testing
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientLogin;