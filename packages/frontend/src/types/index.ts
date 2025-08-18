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

export interface QueryStatus {
  pending?: null;
  doctor_review?: null;
  completed?: null;
}

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

export interface ComponentProps {
  currentUser?: Patient | Doctor | null;
  setCurrentUser?: (user: Patient | Doctor | null) => void;
  showMessage?: (message: string) => void;
  loading?: boolean;
  setLoading?: (loading: boolean) => void;
}