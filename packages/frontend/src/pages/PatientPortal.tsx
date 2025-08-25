// Patient Portal Page Component
import React, { useState } from 'react';
import { Patient, ComponentProps } from '../types';
import PatientLogin from '../components/patient/PatientLogin';
import PatientDashboard from '../components/patient/PatientDashboard';
import PatientRegistration from '../components/PatientRegistration';

interface PatientPortalProps {
  currentUser: Patient | null;
  setCurrentUser?: (user: Patient | null) => void;
  showMessage?: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  loading?: boolean;
  setLoading?: (loading: boolean) => void;
}

const PatientPortal: React.FC<PatientPortalProps> = ({
  currentUser,
  setCurrentUser,
  showMessage,
  loading,
  setLoading
}) => {
  const [showRegistration, setShowRegistration] = useState(false);

  const handleLoginSuccess = (patient: Patient) => {
    setCurrentUser?.(patient);
  };

  const handleRegistrationComplete = async (patientId: string) => {
    // Fetch the complete patient data using the ID
    try {
      // For now, we'll create a mock patient - in real implementation, 
      // you'd fetch from the backend using the patientId
      const mockPatient: Patient = {
        id: patientId,
        name: 'New Patient', // This would come from the registration form
        condition: 'General', // This would come from the registration form
        email: '', // This would come from the registration form
        isActive: true
      };
      setCurrentUser?.(mockPatient);
      setShowRegistration(false);
      showMessage?.('Registration successful! You can now submit queries once assigned to a doctor.', 'success');
    } catch (error) {
      showMessage?.('Registration completed but there was an issue loading your profile. Please try logging in.', 'warning');
    }
  };

  const handleLogout = () => {
    setCurrentUser?.(null);
    setShowRegistration(false);
  };

  if (currentUser) {
    return (
      <PatientDashboard
        patient={currentUser}
        onLogout={handleLogout}
        showMessage={showMessage || (() => {})}
        loading={loading ?? false}
        setLoading={setLoading || (() => {})}
      />
    );
  }

  if (showRegistration) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 text-center">
          <button
            onClick={() => setShowRegistration(false)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            ← Back to Login
          </button>
        </div>
        <PatientRegistration
          onRegistrationComplete={handleRegistrationComplete}
          showMessage={showMessage || (() => {})}
          loading={loading}
          setLoading={setLoading || (() => {})}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PatientLogin
        onLoginSuccess={handleLoginSuccess}
        showMessage={showMessage || (() => {})}
        loading={loading ?? false}
        setLoading={setLoading || (() => {})}
      />
      <div className="mt-6 text-center">
        <button
          onClick={() => setShowRegistration(true)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          New patient? Register here →
        </button>
      </div>
    </div>
  );
};

export default PatientPortal;