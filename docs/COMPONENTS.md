# TrustCareConnect Component Documentation

## Overview

This document provides comprehensive documentation for all React components in the TrustCareConnect healthcare platform. Each component is designed with healthcare-specific requirements including HIPAA compliance, accessibility, and medical workflow optimization.

## Table of Contents

1. [Common Component Patterns](#common-component-patterns)
2. [Authentication Components](#authentication-components)
3. [Dashboard Components](#dashboard-components)
4. [Patient Management Components](#patient-management-components)
5. [Doctor Components](#doctor-components)
6. [Query Management Components](#query-management-components)
7. [Utility Components](#utility-components)
8. [Form Components](#form-components)
9. [Real-time Components](#real-time-components)
10. [Accessibility Features](#accessibility-features)

---

## Common Component Patterns

### Base Component Props

All TrustCareConnect components inherit from a base set of props for consistency:

```typescript
interface BaseComponentProps {
  className?: string;
  testId?: string; // For testing automation
  hipaaCompliant?: boolean; // HIPAA compliance flag
  accessLevel?: 'public' | 'internal' | 'confidential' | 'phi';
  auditLog?: boolean; // Enable audit logging
}

interface LoadingState {
  loading?: boolean;
  error?: string | null;
  retry?: () => void;
}
```

### Healthcare Data Props

```typescript
interface HealthcareDataProps {
  patientId?: string;
  doctorId?: string;
  queryId?: string;
  securityContext?: SecurityContext;
  dataClassification?: DataClassification;
}
```

---

## Authentication Components

### LoginForm

Handles user authentication with Internet Identity integration.

```tsx
interface LoginFormProps extends BaseComponentProps {
  onLoginSuccess: (identity: Identity) => void;
  onLoginError: (error: string) => void;
  userType: 'patient' | 'doctor' | 'admin';
  allowRegistration?: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onLoginSuccess,
  onLoginError,
  userType,
  allowRegistration = true,
  className,
  testId = 'login-form'
}) => {
  // Component implementation
};
```

**Usage Example:**
```tsx
import { LoginForm } from '../components/auth/LoginForm';

const LoginPage: React.FC = () => {
  const handleLoginSuccess = (identity: Identity) => {
    console.log('User logged in:', identity);
    // Redirect to appropriate dashboard
  };

  const handleLoginError = (error: string) => {
    console.error('Login failed:', error);
    // Show error message
  };

  return (
    <div className="login-page">
      <LoginForm
        userType="doctor"
        onLoginSuccess={handleLoginSuccess}
        onLoginError={handleLoginError}
        className="login-form-container"
        testId="doctor-login-form"
      />
    </div>
  );
};
```

### IdentityProvider

Manages authentication state across the application.

```tsx
interface IdentityProviderProps {
  children: React.ReactNode;
  onAuthChange?: (isAuthenticated: boolean) => void;
}

const IdentityProvider: React.FC<IdentityProviderProps> = ({
  children,
  onAuthChange
}) => {
  // Provider implementation
};
```

**Usage Example:**
```tsx
import { IdentityProvider } from '../components/auth/IdentityProvider';

const App: React.FC = () => {
  return (
    <IdentityProvider onAuthChange={(isAuth) => console.log('Auth changed:', isAuth)}>
      <Router>
        <Routes>
          {/* Your routes */}
        </Routes>
      </Router>
    </IdentityProvider>
  );
};
```

---

## Dashboard Components

### DoctorDashboard

Main dashboard for healthcare providers with real-time updates.

```tsx
interface DoctorDashboardProps extends BaseComponentProps, HealthcareDataProps {
  doctorId: string;
  refreshInterval?: number; // Auto-refresh interval in ms
  showPatientAlerts?: boolean;
  showQueryNotifications?: boolean;
  onPatientSelect?: (patientId: string) => void;
  onQuerySelect?: (queryId: string) => void;
}

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({
  doctorId,
  refreshInterval = 30000,
  showPatientAlerts = true,
  showQueryNotifications = true,
  onPatientSelect,
  onQuerySelect,
  className,
  testId = 'doctor-dashboard'
}) => {
  // Component implementation with real-time updates
};
```

**Usage Example:**
```tsx
import { DoctorDashboard } from '../components/dashboard/DoctorDashboard';

const DoctorPortal: React.FC = () => {
  const { doctorId } = useAuth();
  const navigate = useNavigate();

  const handlePatientSelect = (patientId: string) => {
    navigate(`/doctor/patients/${patientId}`);
  };

  const handleQuerySelect = (queryId: string) => {
    navigate(`/doctor/queries/${queryId}`);
  };

  return (
    <DoctorDashboard
      doctorId={doctorId}
      refreshInterval={15000} // 15 seconds for high-priority dashboard
      onPatientSelect={handlePatientSelect}
      onQuerySelect={handleQuerySelect}
      className="main-dashboard"
      testId="primary-doctor-dashboard"
      hipaaCompliant={true}
      auditLog={true}
    />
  );
};
```

### PatientDashboard

Dashboard for patient portal with personal health information.

```tsx
interface PatientDashboardProps extends BaseComponentProps, HealthcareDataProps {
  patientId: string;
  showMedicalHistory?: boolean;
  showUpcomingAppointments?: boolean;
  showRecentQueries?: boolean;
  allowDataExport?: boolean;
}

const PatientDashboard: React.FC<PatientDashboardProps> = ({
  patientId,
  showMedicalHistory = true,
  showUpcomingAppointments = true,
  showRecentQueries = true,
  allowDataExport = true,
  className,
  testId = 'patient-dashboard'
}) => {
  // Component implementation
};
```

**Usage Example:**
```tsx
import { PatientDashboard } from '../components/dashboard/PatientDashboard';

const PatientPortal: React.FC = () => {
  const { patientId } = useAuth();

  return (
    <PatientDashboard
      patientId={patientId}
      showMedicalHistory={true}
      showUpcomingAppointments={true}
      showRecentQueries={true}
      allowDataExport={true}
      className="patient-portal-dashboard"
      accessLevel="phi"
      hipaaCompliant={true}
    />
  );
};
```

---

## Patient Management Components

### PatientProfile

Comprehensive patient information display and editing.

```tsx
interface PatientProfileProps extends BaseComponentProps, HealthcareDataProps {
  patientId: string;
  mode: 'view' | 'edit';
  sections?: PatientSection[];
  onSave?: (patientData: PatientData) => Promise<void>;
  onCancel?: () => void;
  permissions?: PatientPermissions;
  showSensitiveData?: boolean;
}

interface PatientSection {
  id: string;
  title: string;
  visible: boolean;
  editable: boolean;
}

interface PatientPermissions {
  canEditBasicInfo: boolean;
  canEditMedicalInfo: boolean;
  canViewInsurance: boolean;
  canEditEmergencyContact: boolean;
}

const PatientProfile: React.FC<PatientProfileProps> = ({
  patientId,
  mode,
  sections = DEFAULT_SECTIONS,
  onSave,
  onCancel,
  permissions,
  showSensitiveData = false,
  className,
  testId = 'patient-profile'
}) => {
  // Component implementation with validation and security
};
```

**Usage Example:**
```tsx
import { PatientProfile } from '../components/patient/PatientProfile';

const PatientDetailPage: React.FC = () => {
  const { patientId } = useParams();
  const { userRole, permissions } = useAuth();
  const [editMode, setEditMode] = useState(false);

  const handleSave = async (patientData: PatientData) => {
    try {
      await updatePatientData(patientId, patientData);
      setEditMode(false);
      // Show success message
    } catch (error) {
      // Handle error
    }
  };

  const patientPermissions = {
    canEditBasicInfo: userRole === 'admin' || userRole === 'doctor',
    canEditMedicalInfo: userRole === 'doctor',
    canViewInsurance: permissions.includes('view_insurance'),
    canEditEmergencyContact: userRole !== 'patient'
  };

  return (
    <PatientProfile
      patientId={patientId}
      mode={editMode ? 'edit' : 'view'}
      onSave={handleSave}
      onCancel={() => setEditMode(false)}
      permissions={patientPermissions}
      showSensitiveData={userRole === 'doctor'}
      className="patient-detail-profile"
      hipaaCompliant={true}
      auditLog={true}
    />
  );
};
```

### PatientList

Searchable and filterable list of patients.

```tsx
interface PatientListProps extends BaseComponentProps {
  patients?: PatientData[];
  loading?: boolean;
  searchTerm?: string;
  filters?: PatientFilters;
  sortBy?: PatientSortField;
  sortOrder?: 'asc' | 'desc';
  pageSize?: number;
  onPatientSelect?: (patient: PatientData) => void;
  onSearch?: (searchTerm: string) => void;
  onFilter?: (filters: PatientFilters) => void;
  onSort?: (field: PatientSortField, order: 'asc' | 'desc') => void;
  showActions?: boolean;
  actionPermissions?: ActionPermissions;
}

interface PatientFilters {
  status?: 'active' | 'inactive' | 'all';
  department?: string;
  assignedDoctor?: string;
  dateRange?: DateRange;
}

const PatientList: React.FC<PatientListProps> = ({
  patients = [],
  loading = false,
  searchTerm = '',
  filters,
  sortBy = 'lastName',
  sortOrder = 'asc',
  pageSize = 20,
  onPatientSelect,
  onSearch,
  onFilter,
  onSort,
  showActions = true,
  actionPermissions,
  className,
  testId = 'patient-list'
}) => {
  // Component implementation with accessibility
};
```

**Usage Example:**
```tsx
import { PatientList } from '../components/patient/PatientList';

const PatientManagementPage: React.FC = () => {
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<PatientFilters>({});

  const handlePatientSelect = (patient: PatientData) => {
    navigate(`/patients/${patient.id}`);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    // Implement search logic
  };

  const actionPermissions = {
    canEdit: true,
    canDelete: false,
    canAssignDoctor: true,
    canViewMedicalHistory: true
  };

  return (
    <div className="patient-management">
      <PatientList
        patients={patients}
        loading={loading}
        searchTerm={searchTerm}
        filters={filters}
        onPatientSelect={handlePatientSelect}
        onSearch={handleSearch}
        onFilter={setFilters}
        showActions={true}
        actionPermissions={actionPermissions}
        pageSize={25}
        className="main-patient-list"
        hipaaCompliant={true}
      />
    </div>
  );
};
```

---

## Doctor Components

### DoctorProfile

Doctor profile management with credentials and specialties.

```tsx
interface DoctorProfileProps extends BaseComponentProps {
  doctorId: string;
  mode: 'view' | 'edit';
  showCredentials?: boolean;
  showStatistics?: boolean;
  showSchedule?: boolean;
  onSave?: (doctorData: DoctorData) => Promise<void>;
  onCancel?: () => void;
}

const DoctorProfile: React.FC<DoctorProfileProps> = ({
  doctorId,
  mode,
  showCredentials = true,
  showStatistics = true,
  showSchedule = false,
  onSave,
  onCancel,
  className,
  testId = 'doctor-profile'
}) => {
  // Component implementation
};
```

### DoctorSchedule

Doctor availability and appointment scheduling.

```tsx
interface DoctorScheduleProps extends BaseComponentProps {
  doctorId: string;
  viewMode: 'day' | 'week' | 'month';
  selectedDate?: Date;
  showAppointments?: boolean;
  showAvailability?: boolean;
  allowEditing?: boolean;
  onAppointmentSelect?: (appointment: Appointment) => void;
  onTimeSlotSelect?: (timeSlot: TimeSlot) => void;
}

const DoctorSchedule: React.FC<DoctorScheduleProps> = ({
  doctorId,
  viewMode = 'week',
  selectedDate = new Date(),
  showAppointments = true,
  showAvailability = true,
  allowEditing = false,
  onAppointmentSelect,
  onTimeSlotSelect,
  className,
  testId = 'doctor-schedule'
}) => {
  // Component implementation with calendar integration
};
```

---

## Query Management Components

### QueryManagement

Main component for managing medical queries with AI integration.

```tsx
interface QueryManagementProps extends BaseComponentProps {
  queries?: QueryData[];
  loading?: boolean;
  viewMode: 'list' | 'cards' | 'table';
  filters?: QueryFilters;
  sortOptions?: QuerySortOptions;
  showAIAnalysis?: boolean;
  showBulkActions?: boolean;
  onQuerySelect?: (query: QueryData) => void;
  onQueryUpdate?: (queryId: string, updates: Partial<QueryData>) => void;
  onBulkAction?: (action: BulkAction, queryIds: string[]) => void;
  permissions?: QueryPermissions;
}

interface QueryFilters {
  status?: QueryStatus[];
  priority?: QueryPriority[];
  category?: QueryCategory[];
  assignedDoctor?: string;
  dateRange?: DateRange;
  department?: string;
}

const QueryManagement: React.FC<QueryManagementProps> = ({
  queries = [],
  loading = false,
  viewMode = 'cards',
  filters,
  sortOptions,
  showAIAnalysis = true,
  showBulkActions = true,
  onQuerySelect,
  onQueryUpdate,
  onBulkAction,
  permissions,
  className,
  testId = 'query-management'
}) => {
  // Component implementation with AI insights
};
```

**Usage Example:**
```tsx
import { QueryManagement } from '../components/query/QueryManagement';

const QueryManagementPage: React.FC = () => {
  const [queries, setQueries] = useState<QueryData[]>([]);
  const [filters, setFilters] = useState<QueryFilters>({});
  const { userRole } = useAuth();

  const handleQuerySelect = (query: QueryData) => {
    navigate(`/queries/${query.id}`);
  };

  const handleQueryUpdate = async (queryId: string, updates: Partial<QueryData>) => {
    try {
      await updateQuery(queryId, updates);
      // Refresh queries
    } catch (error) {
      // Handle error
    }
  };

  const handleBulkAction = async (action: BulkAction, queryIds: string[]) => {
    try {
      await performBulkAction(action, queryIds);
      // Refresh queries
    } catch (error) {
      // Handle error
    }
  };

  const permissions = {
    canAssign: userRole === 'admin' || userRole === 'supervisor',
    canRespond: userRole === 'doctor',
    canClose: userRole === 'doctor' || userRole === 'admin',
    canEscalate: true,
    canViewAI: userRole === 'doctor'
  };

  return (
    <div className="query-management-page">
      <QueryManagement
        queries={queries}
        viewMode="cards"
        filters={filters}
        showAIAnalysis={true}
        showBulkActions={userRole !== 'patient'}
        onQuerySelect={handleQuerySelect}
        onQueryUpdate={handleQueryUpdate}
        onBulkAction={handleBulkAction}
        permissions={permissions}
        className="main-query-management"
        hipaaCompliant={true}
        auditLog={true}
      />
    </div>
  );
};
```

### QueryForm

Form for submitting new medical queries.

```tsx
interface QueryFormProps extends BaseComponentProps {
  patientId?: string;
  initialData?: Partial<QueryData>;
  onSubmit: (queryData: QueryData) => Promise<void>;
  onCancel?: () => void;
  showAIAssistance?: boolean;
  showAttachments?: boolean;
  requiredFields?: string[];
  validationRules?: ValidationRules;
}

const QueryForm: React.FC<QueryFormProps> = ({
  patientId,
  initialData,
  onSubmit,
  onCancel,
  showAIAssistance = true,
  showAttachments = true,
  requiredFields = ['title', 'description', 'category'],
  validationRules,
  className,
  testId = 'query-form'
}) => {
  // Component implementation with validation and AI assistance
};
```

### QueryDetails

Detailed view of a medical query with responses and AI analysis.

```tsx
interface QueryDetailsProps extends BaseComponentProps {
  queryId: string;
  showAIAnalysis?: boolean;
  showResponseHistory?: boolean;
  showAttachments?: boolean;
  allowResponses?: boolean;
  allowEditing?: boolean;
  onResponse?: (response: QueryResponse) => Promise<void>;
  onUpdate?: (updates: Partial<QueryData>) => Promise<void>;
  onStatusChange?: (status: QueryStatus) => Promise<void>;
}

const QueryDetails: React.FC<QueryDetailsProps> = ({
  queryId,
  showAIAnalysis = true,
  showResponseHistory = true,
  showAttachments = true,
  allowResponses = true,
  allowEditing = false,
  onResponse,
  onUpdate,
  onStatusChange,
  className,
  testId = 'query-details'
}) => {
  // Component implementation with real-time updates
};
```

---

## Utility Components

### LoadingSpinner

Healthcare-themed loading indicator.

```tsx
interface LoadingSpinnerProps extends BaseComponentProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  showMessage?: boolean;
  color?: string;
  overlay?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  message = 'Loading...',
  showMessage = true,
  color = '#007bff',
  overlay = false,
  className,
  testId = 'loading-spinner'
}) => {
  // Component implementation
};
```

### ErrorBoundary

Error handling component with healthcare-specific error reporting.

```tsx
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorBoundaryFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'component' | 'page' | 'app';
}

const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({
  children,
  fallback: Fallback = DefaultErrorFallback,
  onError,
  level = 'component'
}) => {
  // Component implementation with error logging
};
```

### NotificationCenter

Healthcare notifications and alerts system.

```tsx
interface NotificationCenterProps extends BaseComponentProps {
  notifications?: Notification[];
  maxVisible?: number;
  autoHide?: boolean;
  autoHideDelay?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  allowDismiss?: boolean;
  onNotificationClick?: (notification: Notification) => void;
  onNotificationDismiss?: (notificationId: string) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications = [],
  maxVisible = 5,
  autoHide = true,
  autoHideDelay = 5000,
  position = 'top-right',
  allowDismiss = true,
  onNotificationClick,
  onNotificationDismiss,
  className,
  testId = 'notification-center'
}) => {
  // Component implementation
};
```

---

## Form Components

### FormField

Reusable form field with healthcare-specific validation.

```tsx
interface FormFieldProps extends BaseComponentProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'textarea' | 'select';
  value?: any;
  onChange?: (value: any) => void;
  onBlur?: () => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helpText?: string;
  options?: SelectOption[];
  validation?: ValidationRule[];
  hipaaField?: boolean; // Marks field as containing PHI
  autoComplete?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  disabled = false,
  error,
  helpText,
  options,
  validation,
  hipaaField = false,
  autoComplete,
  className,
  testId
}) => {
  // Component implementation with accessibility and validation
};
```

### MedicalHistoryForm

Specialized form for medical history input.

```tsx
interface MedicalHistoryFormProps extends BaseComponentProps {
  initialData?: MedicalHistory;
  onSave: (medicalHistory: MedicalHistory) => Promise<void>;
  onCancel?: () => void;
  readOnly?: boolean;
  showCategories?: MedicalHistoryCategory[];
  validationLevel?: 'basic' | 'comprehensive';
}

interface MedicalHistoryCategory {
  id: string;
  name: string;
  required: boolean;
  fields: string[];
}

const MedicalHistoryForm: React.FC<MedicalHistoryFormProps> = ({
  initialData,
  onSave,
  onCancel,
  readOnly = false,
  showCategories = DEFAULT_CATEGORIES,
  validationLevel = 'comprehensive',
  className,
  testId = 'medical-history-form'
}) => {
  // Component implementation with medical validation
};
```

---

## Real-time Components

### WebSocketProvider

Manages real-time connections for live updates.

```tsx
interface WebSocketProviderProps {
  children: React.ReactNode;
  url?: string;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  onConnectionChange?: (connected: boolean) => void;
  onMessage?: (message: WebSocketMessage) => void;
}

const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
  url = 'ws://localhost:3001/ws',
  autoReconnect = true,
  reconnectInterval = 5000,
  onConnectionChange,
  onMessage
}) => {
  // Provider implementation
};
```

### LiveQueryUpdates

Real-time query status updates.

```tsx
interface LiveQueryUpdatesProps extends BaseComponentProps {
  queryId: string;
  onUpdate?: (update: QueryUpdate) => void;
  showStatusChanges?: boolean;
  showNewResponses?: boolean;
  showAssignmentChanges?: boolean;
}

const LiveQueryUpdates: React.FC<LiveQueryUpdatesProps> = ({
  queryId,
  onUpdate,
  showStatusChanges = true,
  showNewResponses = true,
  showAssignmentChanges = true,
  className,
  testId = 'live-query-updates'
}) => {
  // Component implementation with WebSocket integration
};
```

---

## Accessibility Features

### ScreenReaderText

Hidden text for screen readers.

```tsx
interface ScreenReaderTextProps {
  children: React.ReactNode;
}

const ScreenReaderText: React.FC<ScreenReaderTextProps> = ({ children }) => {
  return (
    <span className="sr-only">
      {children}
    </span>
  );
};
```

### FocusManager

Manages keyboard navigation and focus.

```tsx
interface FocusManagerProps {
  children: React.ReactNode;
  autoFocus?: boolean;
  focusTrap?: boolean;
  restoreFocus?: boolean;
}

const FocusManager: React.FC<FocusManagerProps> = ({
  children,
  autoFocus = false,
  focusTrap = false,
  restoreFocus = true
}) => {
  // Component implementation with focus management
};
```

---

## Component Usage Best Practices

### 1. HIPAA Compliance

Always mark components that handle PHI with the appropriate props:

```tsx
<PatientProfile
  patientId={patientId}
  hipaaCompliant={true}
  auditLog={true}
  accessLevel="phi"
/>
```

### 2. Error Handling

Wrap components in error boundaries:

```tsx
<ErrorBoundary level="page" onError={logError}>
  <QueryManagement />
</ErrorBoundary>
```

### 3. Loading States

Provide loading states for better UX:

```tsx
<PatientList
  loading={isLoading}
  patients={patients}
  error={error}
  retry={refetchPatients}
/>
```

### 4. Accessibility

Always provide accessible labels and descriptions:

```tsx
<FormField
  label="Patient Medical Record Number"
  name="mrn"
  required={true}
  helpText="Enter the patient's unique medical record identifier"
  aria-describedby="mrn-help"
/>
```

### 5. Testing

Use consistent test IDs for automation:

```tsx
<QueryManagement
  testId="main-query-management"
  className="query-page"
/>
```

This comprehensive component documentation ensures consistent usage across the TrustCareConnect healthcare platform while maintaining security, accessibility, and healthcare compliance standards.