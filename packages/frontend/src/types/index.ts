// Frontend TypeScript type definitions

export interface Patient {
  id: string;
  name: string;
  condition: string;
  email: string;
  assignedDoctorId?: string;
  isActive: boolean;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
}

export type QueryStatus = 'pending' | 'doctor_review' | 'completed';

export interface MedicalQuery {
  id: string;
  patientId: string;
  title: string;
  description: string;
  status: QueryStatus;
  doctorId?: string;
  response?: string;
  aiDraftResponse?: string;
  createdAt: number;
  updatedAt: number;
}

export interface SystemStats {
  totalPatients: number;
  totalDoctors: number;
  totalQueries: number;
  pendingQueries: number;
  completedQueries: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface FormData {
  [key: string]: string;
}

export interface LoadingStates {
  [key: string]: boolean;
}

export interface ViewState {
  currentView: 'home' | 'patient' | 'doctor';
  currentUser: Patient | Doctor | null;
  loading: LoadingStates;
  message: string;
}

export type UserType = 'patient' | 'doctor';

// Base component props interface for consistent prop handling
export interface BaseComponentProps {
  showMessage?: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  loading?: boolean;
  setLoading?: (loading: boolean) => void;
}

// Extended props for user-aware components
export interface ComponentProps extends BaseComponentProps {
  currentUser?: Patient | Doctor | null;
  setCurrentUser?: (user: Patient | Doctor | null) => void;
}

// Patient-specific component props
export interface PatientComponentProps extends BaseComponentProps {
  patient: Patient;
  onUpdate?: () => void;
}

// Doctor-specific component props
export interface DoctorComponentProps extends BaseComponentProps {
  doctor: Doctor;
  onUpdate?: () => void;
}