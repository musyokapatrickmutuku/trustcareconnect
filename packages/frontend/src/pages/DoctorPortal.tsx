// Doctor Portal Page Component
import React from 'react';
import { Doctor } from '../types';
import DoctorLogin from '../components/doctor/DoctorLogin';
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
          <DoctorLogin
            onLogin={handleLogin}
            showMessage={showMessage}
            loading={loading}
            setLoading={setLoading}
          />
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