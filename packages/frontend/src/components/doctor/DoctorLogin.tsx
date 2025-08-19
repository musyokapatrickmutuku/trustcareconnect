// Doctor Login Component
import React, { useState } from 'react';
import { Doctor } from '../../types';
import Button from '../common/Button';
import FormField from '../common/FormField';
import { UI_MESSAGES, MEDICAL_SPECIALIZATIONS } from '../../constants';
import icpService from '../../services/icpService';

interface DoctorLoginProps {
  onLogin: (doctor: Doctor) => void;
  showMessage: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const DoctorLogin: React.FC<DoctorLoginProps> = ({
  onLogin,
  showMessage,
  loading,
  setLoading
}) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginMode, setLoginMode] = useState<'id' | 'register'>('id');

  const handleDoctorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const doctorId = formData.get('doctorId') as string;

    if (!doctorId.trim()) {
      showMessage('Please enter your Doctor ID');
      return;
    }

    setLoading(true);
    try {
      const result = await icpService.getDoctor(doctorId);
      if (result.success && result.data) {
        onLogin(result.data);
        showMessage(`Welcome back, Dr. ${result.data.name}!`, 'success');
      } else {
        showMessage('Doctor not found. Please check your ID or register as a new doctor.', 'error');
      }
    } catch (error) {
      showMessage('Login failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get('name') as string;
    const specialization = formData.get('specialization') as string;

    if (!name.trim() || !specialization) {
      showMessage('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const result = await icpService.registerDoctor(name, specialization);
      if (result.success && result.data) {
        const doctorResult = await icpService.getDoctor(result.data);
        if (doctorResult.success && doctorResult.data) {
          onLogin(doctorResult.data);
          showMessage(`Registration successful! Your Doctor ID is: ${result.data}. Please save this ID for future logins.`, 'success');
        }
      } else {
        showMessage(`Registration failed: ${result.error}`, 'error');
      }
    } catch (error) {
      showMessage('Registration failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="doctor-login max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            🩺 Doctor Portal
          </h2>
          <p className="text-gray-600 mt-2">
            Access your patient dashboard and medical queries
          </p>
        </div>

        {/* Login Mode Tabs */}
        <div className="flex mb-6">
          <button
            onClick={() => setLoginMode('id')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-l-lg border ${
              loginMode === 'id'
                ? 'bg-blue-50 text-blue-700 border-blue-300'
                : 'bg-gray-50 text-gray-500 border-gray-300 hover:bg-gray-100'
            }`}
          >
            Login with ID
          </button>
          <button
            onClick={() => setLoginMode('register')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-r-lg border-t border-r border-b ${
              loginMode === 'register'
                ? 'bg-blue-50 text-blue-700 border-blue-300'
                : 'bg-gray-50 text-gray-500 border-gray-300 hover:bg-gray-100'
            }`}
          >
            New Registration
          </button>
        </div>

        {loginMode === 'id' ? (
          <form onSubmit={handleDoctorLogin} className="space-y-4">
            <FormField
              label="Doctor ID"
              name="doctorId"
              placeholder="Enter your doctor ID (e.g., doc_123456)"
              required
              autoComplete="username"
            />
            <div className="text-xs text-gray-500 mt-2">
              💡 Don't have a Doctor ID? Switch to "New Registration" to create an account.
            </div>
            <Button
              type="submit"
              loading={loading}
              disabled={loading}
              fullWidth
              className="mt-6"
            >
              {loading ? UI_MESSAGES.LOADING.SIGNING_IN : 'Sign In'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleDoctorRegistration} className="space-y-4">
            <FormField
              label="Full Name"
              name="name"
              placeholder="Enter your full name"
              required
              autoComplete="name"
            />
            <FormField
              label="Medical Specialization"
              type="select"
              name="specialization"
              placeholder="Select your specialization"
              required
              options={[...MEDICAL_SPECIALIZATIONS]}
            />
            <div className="text-xs text-gray-500 mt-2">
              💡 After registration, you'll receive a unique Doctor ID for future logins.
            </div>
            <Button
              type="submit"
              loading={loading}
              disabled={loading}
              fullWidth
              className="mt-6"
            >
              {loading ? UI_MESSAGES.LOADING.REGISTERING : 'Register as Doctor'}
            </Button>
          </form>
        )}

        {/* Help Section */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <h4 className="font-medium mb-2">Need Help?</h4>
            <ul className="space-y-1 text-xs">
              <li>• New doctors: Use "New Registration" to create your account</li>
              <li>• Existing doctors: Use "Login with ID" with your assigned Doctor ID</li>
              <li>• Forgot your ID? Contact system administrator</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorLogin;