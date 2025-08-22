import React, { useState, useEffect } from 'react';
import { Patient, MedicalQuery, QueryStatus } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { formatters } from '../../utils/formatters';
import icpService from '../../services/icpService';

// Modern Icons Component
const Icons = {
  Dashboard: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  History: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Plus: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  ),
  AI: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  Doctor: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Settings: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Moon: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  ),
  Sun: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  Bell: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.868 19.753A1 1 0 005 18h4l-1-4H5.5a1.5 1.5 0 11-1.5-1.5v-2a6 6 0 1112 0v2a1.5 1.5 0 11-1.5 1.5H12l-1 4h4a1 1 0 01.868 1.753l-7-4z" />
    </svg>
  )
};

interface PatientDashboardProps {
  patient: Patient;
  onLogout: () => void;
  showMessage: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  loading?: boolean;
  setLoading?: (loading: boolean) => void;
}

interface QueryWithEstimate extends MedicalQuery {
  estimatedResponseTime?: string;
  timeRemaining?: string;
}

const PatientDashboardModern: React.FC<PatientDashboardProps> = ({
  patient,
  onLogout,
  showMessage,
  loading: parentLoading = false,
  setLoading: setParentLoading = () => {}
}) => {
  const { actualTheme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'overview' | 'queries' | 'new-query' | 'profile'>('overview');
  const [queries, setQueries] = useState<QueryWithEstimate[]>([]);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);

  useEffect(() => {
    loadPatientQueries();
    const interval = setInterval(() => {
      loadPatientQueries();
      updateTimeEstimates();
    }, 30000);
    return () => clearInterval(interval);
  }, [patient.id]);

  const loadPatientQueries = async () => {
    setLoading(true);
    try {
      const result = await icpService.getPatientQueries(patient.id);
      if (result.success && result.data) {
        const queriesWithEstimates = result.data.map((query: MedicalQuery) => ({
          ...query,
          estimatedResponseTime: calculateEstimatedResponseTime(query),
          timeRemaining: calculateTimeRemaining(query)
        }));
        checkForStatusUpdates(queriesWithEstimates);
        setQueries(queriesWithEstimates);
      }
    } catch (error) {
      console.error('Error loading queries:', error);
      showMessage('Failed to load your queries', 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateEstimatedResponseTime = (query: MedicalQuery): string => {
    switch (query.status) {
      case 'pending': return 'Within 2-4 hours';
      case 'doctor_review': return 'Within 1-2 hours';
      case 'completed': return 'Completed';
      default: return 'Processing...';
    }
  };

  const calculateTimeRemaining = (query: MedicalQuery): string => {
    if (query.status === 'completed') return 'Completed';
    
    const now = Date.now();
    const createdTime = Number(query.createdAt) / 1000000;
    const hoursElapsed = (now - createdTime) / (1000 * 60 * 60);
    
    let targetHours = 4;
    if (query.status === 'doctor_review') targetHours = 2;
    
    const remainingHours = Math.max(0, targetHours - hoursElapsed);
    
    if (remainingHours < 1) {
      const remainingMinutes = Math.floor(remainingHours * 60);
      return `${remainingMinutes}m remaining`;
    } else {
      return `${Math.ceil(remainingHours)}h remaining`;
    }
  };

  const checkForStatusUpdates = (newQueries: QueryWithEstimate[]) => {
    const newNotifications: string[] = [];
    newQueries.forEach(query => {
      const existingQuery = queries.find(q => q.id === query.id);
      if (existingQuery && existingQuery.status !== query.status) {
        switch (query.status) {
          case 'doctor_review':
            newNotifications.push(`Query "${query.title}" is now under doctor review`);
            break;
          case 'completed':
            newNotifications.push(`Query "${query.title}" has been completed!`);
            break;
        }
      }
    });
    
    if (newNotifications.length > 0) {
      setNotifications(prev => [...newNotifications, ...prev].slice(0, 10));
    }
  };

  const updateTimeEstimates = () => {
    setQueries(prev => prev.map(query => ({
      ...query,
      timeRemaining: calculateTimeRemaining(query)
    })));
  };

  const getStatusIndicator = (status: QueryStatus) => {
    const baseClasses = "status-indicator";
    switch (status) {
      case 'pending':
        return <div className={`${baseClasses} status-pending`}>Pending Review</div>;
      case 'doctor_review':
        return <div className={`${baseClasses} status-processing`}>Doctor Review</div>;
      case 'completed':
        return <div className={`${baseClasses} status-approved`}>Completed</div>;
      default:
        return <div className={`${baseClasses} status-pending`}>Processing</div>;
    }
  };

  const pendingQueries = queries.filter(q => q.status === 'pending' || q.status === 'doctor_review');
  const completedQueries = queries.filter(q => q.status === 'completed');

  const navigationItems = [
    { id: 'overview', label: 'Dashboard', icon: Icons.Dashboard, count: queries.length },
    { id: 'queries', label: 'History', icon: Icons.History, count: null },
    { id: 'new-query', label: 'New Query', icon: Icons.Plus, count: null },
    { id: 'profile', label: 'Profile', icon: Icons.Settings, count: null }
  ];

  return (
    <div className="min-h-screen animated-bg particles">
      {/* Modern Header */}
      <header className="glass-header sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="holographic text-2xl font-bold text-white px-4 py-2 rounded-xl">
                TrustCare
              </div>
              <div className="text-white/70 text-sm">
                Welcome back, <span className="text-white font-medium">{patient.name}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative p-2 text-white/70 hover:text-white transition-colors duration-200">
                <Icons.Bell />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-neon-pink rounded-full text-xs text-white flex items-center justify-center animate-pulse">
                    {notifications.length}
                  </span>
                )}
              </button>
              
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 text-white/70 hover:text-white transition-colors duration-200"
              >
                {actualTheme === 'dark' ? <Icons.Sun /> : <Icons.Moon />}
              </button>
              
              {/* Logout */}
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/20"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Floating Notifications */}
        {notifications.length > 0 && (
          <div className="fixed top-20 right-4 z-40 space-y-2 max-w-sm">
            {notifications.slice(0, 3).map((notification, index) => (
              <div 
                key={index} 
                className="glass-card p-4 border-l-4 border-primary-400 animate-slide-down"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="text-primary-400 mt-0.5">
                      <Icons.Bell />
                    </div>
                    <p className="text-sm text-white/90">{notification}</p>
                  </div>
                  <button
                    onClick={() => setNotifications(prev => prev.filter((_, i) => i !== index))}
                    className="text-white/50 hover:text-white/80 ml-2"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Navigation */}
        <nav className="glass-card p-2 mb-8">
          <div className="flex space-x-1">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-primary-500 to-medical-500 text-white neon-glow'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <item.icon />
                <span className="font-medium">{item.label}</span>
                {item.count !== null && (
                  <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-in">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="data-card p-6 text-center">
                <div className="text-4xl font-bold text-transparent bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text mb-2">
                  {queries.length}
                </div>
                <div className="text-white/70 text-sm uppercase tracking-wide">Total Queries</div>
                <div className="mt-4 h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent rounded-full"></div>
              </div>
              
              <div className="data-card p-6 text-center">
                <div className="text-4xl font-bold text-transparent bg-gradient-to-r from-ai-400 to-ai-600 bg-clip-text mb-2">
                  {pendingQueries.length}
                </div>
                <div className="text-white/70 text-sm uppercase tracking-wide">In Progress</div>
                <div className="mt-4 h-1 bg-gradient-to-r from-transparent via-ai-500 to-transparent rounded-full"></div>
              </div>
              
              <div className="data-card p-6 text-center">
                <div className="text-4xl font-bold text-transparent bg-gradient-to-r from-medical-400 to-medical-600 bg-clip-text mb-2">
                  {completedQueries.length}
                </div>
                <div className="text-white/70 text-sm uppercase tracking-wide">Completed</div>
                <div className="mt-4 h-1 bg-gradient-to-r from-transparent via-medical-500 to-transparent rounded-full"></div>
              </div>
            </div>

            {/* Recent Queries */}
            <div className="glass-card">
              <div className="p-6 border-b border-white/10">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-white">Recent Queries</h2>
                  <button
                    onClick={() => setActiveTab('new-query')}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-medical-500 text-white rounded-lg hover:from-primary-600 hover:to-medical-600 transition-all duration-200 neon-glow"
                  >
                    <Icons.Plus />
                    <span>New Query</span>
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="loading-wave">
                      <span></span>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                ) : queries.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-white/50 mb-4">
                      <Icons.Plus />
                    </div>
                    <p className="text-white/70 mb-4">No queries yet</p>
                    <button
                      onClick={() => setActiveTab('new-query')}
                      className="px-6 py-3 bg-gradient-to-r from-primary-500 to-medical-500 text-white rounded-xl hover:from-primary-600 hover:to-medical-600 transition-all duration-200"
                    >
                      Submit Your First Query
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {queries.slice(0, 5).map((query, index) => (
                      <div 
                        key={query.id} 
                        className="neu-card interactive-hover p-6 bg-white/5 border border-white/10"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-white">{query.title}</h3>
                              {getStatusIndicator(query.status)}
                            </div>
                            <p className="text-white/70 mb-4">{query.description}</p>
                            
                            <div className="flex items-center space-x-6 text-sm">
                              <span className="text-white/50">
                                {formatters.formatDate(new Date(Number(query.createdAt) / 1000000))}
                              </span>
                              {query.status !== 'completed' && (
                                <span className="text-ai-400 font-medium">
                                  {query.timeRemaining}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {query.response && (
                          <div className="glass-card p-4 border-l-4 border-medical-400">
                            <div className="flex items-center space-x-2 mb-2">
                              <Icons.Doctor />
                              <span className="text-medical-400 font-medium text-sm">Doctor's Response</span>
                            </div>
                            <p className="text-white/90 text-sm">{query.response}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'queries' && (
          <div className="space-y-8 animate-fade-in">
            {/* All Queries with enhanced styling */}
            <div className="glass-card">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-xl font-semibold text-white">Query History</h2>
              </div>
              <div className="p-6">
                {queries.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-white/70">No queries found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {queries.map((query, index) => (
                      <div 
                        key={query.id} 
                        className="neu-card interactive-hover p-6 bg-white/5 border border-white/10"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-white">{query.title}</h3>
                              {getStatusIndicator(query.status)}
                            </div>
                            <p className="text-white/70 mb-4">{query.description}</p>
                            
                            {query.response && (
                              <div className="glass-card p-4 border-l-4 border-medical-400">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Icons.Doctor />
                                  <span className="text-medical-400 font-medium text-sm">Doctor's Response</span>
                                </div>
                                <p className="text-white/90 text-sm">{query.response}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'new-query' && (
          <div className="glass-card animate-fade-in">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white">Submit New Medical Query</h2>
            </div>
            <div className="p-6">
              <div className="bg-gradient-to-r from-ai-500/20 to-primary-500/20 border border-ai-500/30 rounded-xl p-6 mb-6">
                <div className="flex items-center space-x-3 mb-3">
                  <Icons.AI />
                  <span className="text-ai-400 font-medium">AI-Assisted Healthcare</span>
                </div>
                <p className="text-white/80 text-sm">
                  Your query will be processed by our AI system and then reviewed by a licensed healthcare professional 
                  to ensure accurate and safe medical guidance.
                </p>
              </div>
              
              {/* Query submission form would go here */}
              <div className="text-center py-8">
                <p className="text-white/70">Query submission form component will be integrated here</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="glass-card animate-fade-in">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white">Patient Profile</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-white/70 text-sm mb-2">Patient ID</label>
                    <div className="glass-card p-3 text-white">{patient.id}</div>
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-2">Name</label>
                    <div className="glass-card p-3 text-white">{patient.name}</div>
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-2">Medical Condition</label>
                    <div className="glass-card p-3 text-white">{patient.condition}</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-white/70 text-sm mb-2">Account Status</label>
                    <div className={`glass-card p-3 ${patient.isActive ? 'text-medical-400' : 'text-red-400'}`}>
                      {patient.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                  {patient.assignedDoctorId && (
                    <div>
                      <label className="block text-white/70 text-sm mb-2">Assigned Doctor</label>
                      <div className="glass-card p-3 text-white">{patient.assignedDoctorId}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDashboardModern;