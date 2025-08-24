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
  const [loginMode, setLoginMode] = useState<'email' | 'id' | 'register'>('email');
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
    doctorId: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setLoginData(prev => ({ ...prev, [field]: value }));
  };

  const handleDoctorLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loginMode === 'email') {
      if (!loginData.email.trim() || !loginData.password.trim()) {
        showMessage('Please enter both email and password');
        return;
      }

      // Validate against test doctor credentials
      const testCredentials = [
        { email: 'dr.rodriguez@trustcare.com', password: 'DrMaria2024Endo!', id: 'doctor_1' },
        { email: 'dr.thompson@trustcare.com', password: 'DrJames2024Endo!', id: 'doctor_2' }
      ];

      const credential = testCredentials.find(
        cred => cred.email === loginData.email && cred.password === loginData.password
      );

      if (!credential) {
        showMessage('Invalid email or password. Please check your credentials.', 'error');
        return;
      }

      setLoading(true);
      try {
        const result = await icpService.getDoctor(credential.id);
        if (result.success && result.data) {
          onLogin(result.data);
          showMessage(`Welcome back, Dr. ${result.data.name}!`, 'success');
        } else {
          showMessage('Doctor not found in system. Please contact administrator.', 'error');
        }
      } catch (error) {
        showMessage('Login failed. Please try again.', 'error');
      } finally {
        setLoading(false);
      }
    } else {
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
            onClick={() => setLoginMode('email')}
            className={`flex-1 py-2 px-2 text-xs font-medium rounded-l-lg border ${
              loginMode === 'email'
                ? 'bg-blue-50 text-blue-700 border-blue-300'
                : 'bg-gray-50 text-gray-500 border-gray-300 hover:bg-gray-100'
            }`}
          >
            Email & Password
          </button>
          <button
            onClick={() => setLoginMode('id')}
            className={`flex-1 py-2 px-2 text-xs font-medium border-t border-b ${
              loginMode === 'id'
                ? 'bg-blue-50 text-blue-700 border-blue-300'
                : 'bg-gray-50 text-gray-500 border-gray-300 hover:bg-gray-100'
            }`}
          >
            Doctor ID
          </button>
          <button
            onClick={() => setLoginMode('register')}
            className={`flex-1 py-2 px-2 text-xs font-medium rounded-r-lg border-t border-r border-b ${
              loginMode === 'register'
                ? 'bg-blue-50 text-blue-700 border-blue-300'
                : 'bg-gray-50 text-gray-500 border-gray-300 hover:bg-gray-100'
            }`}
          >
            Register
          </button>
        </div>

        {loginMode === 'email' ? (
          <form onSubmit={handleDoctorLogin} className="space-y-4">
            <FormField
              label="Email Address"
              type="email"
              name="email"
              value={loginData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter your email address"
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
        ) : loginMode === 'id' ? (
          <form onSubmit={handleDoctorLogin} className="space-y-4">
            <FormField
              label="Doctor ID"
              name="doctorId"
              placeholder="Enter your doctor ID (e.g., doc_123456)"
              required
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

        {/* Test Credentials Section */}
        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <div className="text-sm text-green-800">
            <p className="font-medium mb-2">Test Doctor Accounts:</p>
            <div className="space-y-2 text-xs">
              <div>
                <p className="font-medium">Dr. Maria Elena Rodriguez (Endocrinology)</p>
                <p>📧 dr.rodriguez@trustcare.com</p>
                <p>🔑 DrMaria2024Endo!</p>
                <p className="text-green-600">👥 Assigned: 3 patients (Sarah, Carlos, Dorothy)</p>
              </div>
              <div>
                <p className="font-medium">Dr. James Michael Thompson (Endocrinology)</p>
                <p>📧 dr.thompson@trustcare.com</p>
                <p>🔑 DrJames2024Endo!</p>
                <p className="text-green-600">👥 Assigned: 2 patients (Michael, Priya)</p>
              </div>
              <div className="text-xs text-green-600 mt-2">
                💡 Both specialists have patients with comprehensive medical histories ready for testing
              </div>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <h4 className="font-medium mb-2">Need Help?</h4>
            <ul className="space-y-1 text-xs">
              <li>• Test accounts: Use "Email & Password" with credentials above</li>
              <li>• Existing doctors: Use "Doctor ID" with your assigned ID</li>
              <li>• New doctors: Use "Register" to create your account</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorLogin;