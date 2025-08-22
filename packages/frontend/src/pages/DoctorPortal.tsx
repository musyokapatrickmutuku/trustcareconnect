// Doctor Portal Page Component
import React from 'react';
import { Doctor } from '../types';
import DoctorDashboard from '../components/doctor/DoctorDashboard';

interface DoctorPortalProps {
  currentUser: Doctor | null;
  setCurrentUser?: (user: Doctor | null) => void;
  showMessage?: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  loading?: boolean;
  setLoading?: (loading: boolean) => void;
}

const DoctorPortal: React.FC<DoctorPortalProps> = ({
  currentUser,
  setCurrentUser,
  showMessage = () => {},
  loading = false,
  setLoading = () => {}
}) => {
  const handleLogin = (doctor: Doctor) => {
    setCurrentUser?.(doctor);
  };

  const handleLogout = () => {
    setCurrentUser?.(null);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              👨‍⚕️ Doctor Portal
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Please use the authentication system to access the doctor portal
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DoctorDashboard
      currentDoctor={currentUser}
      onLogout={handleLogout}
      showMessage={showMessage}
      loading={loading}
      setLoading={setLoading}
    />
  );
};

export default DoctorPortal;