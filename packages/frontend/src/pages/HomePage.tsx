// Home Page Component - Enhanced Dashboard with Real Statistics
import React, { useState, useEffect } from 'react';
import { SystemStats } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';
import MvpTester from '../components/MvpTester';
import icpService from '../services/icpService';

const HomePage: React.FC = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<string>('checking');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [setupStatus, setSetupStatus] = useState<string>('ready');
  const [showSetup, setShowSetup] = useState(false);
  const [showMvpTester, setShowMvpTester] = useState(false);

  useEffect(() => {
    loadStats();
    // Set up periodic refresh for real-time dashboard updates
    const interval = setInterval(loadStats, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Test connection first
      // Test connection and load platform statistics
      const result = await icpService.getStats();
      
      if (result.success && result.data) {
        setStats(result.data);
        setLastUpdated(new Date());
        setConnectionStatus('connected');
        console.log('Platform statistics loaded successfully:', result.data);
      } else {
        throw new Error(result.error || 'Failed to load platform statistics');
      }
    } catch (error) {
      console.error('Failed to load platform stats:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      setConnectionStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadStats();
  };

  const handleInitializeTestPatients = async () => {
    setSetupStatus('initializing');
    try {
      const result = await icpService.initializeTestPatients();
      if (result.success) {
        setSetupStatus('success');
        loadStats(); // Refresh stats after setup
      } else {
        setSetupStatus('error');
        setError(result.error || 'Failed to initialize test patients');
      }
    } catch (error) {
      setSetupStatus('error');
      setError(error instanceof Error ? error.message : 'Setup failed');
    }
  };

  const handleSetApiKey = async () => {
    const apiKey = prompt('Enter Novita AI API Key (starts with sk_):');
    if (!apiKey) return;
    
    setSetupStatus('setting_key');
    try {
      const result = await icpService.setApiKey(apiKey);
      if (result.success) {
        setSetupStatus('key_set');
        alert('API key set successfully! You can now test the AI functionality.');
      } else {
        setSetupStatus('error');
        setError(result.error || 'Failed to set API key');
      }
    } catch (error) {
      setSetupStatus('error');
      setError(error instanceof Error ? error.message : 'Failed to set API key');
    }
  };

  return (
    <div className="home-page">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to TrustCareConnect
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          A secure healthcare communication platform connecting patients and doctors 
          through AI-assisted consultations with human oversight.
        </p>
        
        {/* Connection Status Indicator */}
        <div className="mt-4 flex justify-center items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-500' : 
            connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 
            'bg-red-500'
          }`}></div>
          <span className="text-sm text-gray-600">
            Backend Status: {connectionStatus === 'connected' ? 'Connected' : 
                           connectionStatus === 'connecting' ? 'Connecting...' : 
                           'Connection Error'}
          </span>
          {lastUpdated && (
            <span className="text-xs text-gray-400 ml-2">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button 
            onClick={handleRefresh}
            disabled={loading}
            className="ml-2 text-blue-600 hover:text-blue-800 text-sm underline disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-red-500 text-lg">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Connection Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <p className="text-xs text-red-600 mt-2">
                Please check your internet connection and ensure the backend canister is running.
              </p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center">
          <LoadingSpinner size="large" message="Loading platform statistics..." />
        </div>
      ) : stats ? (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Platform Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="stat-card bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.totalPatients}</div>
              <div className="text-sm text-blue-600 mt-1">Patients</div>
            </div>
            <div className="stat-card bg-green-50 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-green-600">{stats.totalDoctors}</div>
              <div className="text-sm text-green-600 mt-1">Doctors</div>
            </div>
            <div className="stat-card bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-purple-600">{stats.totalQueries}</div>
              <div className="text-sm text-purple-600 mt-1">Total Queries</div>
            </div>
            <div className="stat-card bg-yellow-50 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-yellow-600">{stats.pendingQueries}</div>
              <div className="text-sm text-yellow-600 mt-1">Pending</div>
            </div>
            <div className="stat-card bg-emerald-50 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-emerald-600">{stats.completedQueries}</div>
              <div className="text-sm text-emerald-600 mt-1">Completed</div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">For Patients</h3>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              Submit medical queries and concerns
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              Receive AI-assisted responses reviewed by doctors
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              Track your query history and responses
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              Secure, blockchain-based medical records
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">For Healthcare Providers</h3>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">✓</span>
              Review AI-generated draft responses
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">✓</span>
              Provide expert medical oversight
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">✓</span>
              Manage patient assignments efficiently
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">✓</span>
              Access comprehensive patient histories
            </li>
          </ul>
        </div>
      </div>

      {/* MVP Setup Section */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">🚀 MVP Setup</h3>
          <button
            onClick={() => setShowSetup(!showSetup)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showSetup ? 'Hide Setup' : 'Show Setup'}
          </button>
        </div>
        
        {showSetup && (
          <div className="space-y-4">
            <p className="text-gray-700">
              Set up the TrustCareConnect MVP with test patient data and AI functionality:
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={handleSetApiKey}
                disabled={setupStatus === 'setting_key'}
                className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {setupStatus === 'setting_key' ? 'Setting API Key...' : '1. Set Novita AI API Key'}
                <div className="text-xs mt-1 opacity-80">Required for AI responses</div>
              </button>
              
              <button
                onClick={handleInitializeTestPatients}
                disabled={setupStatus === 'initializing'}
                className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {setupStatus === 'initializing' ? 'Initializing...' : '2. Initialize Test Patients'}
                <div className="text-xs mt-1 opacity-80">P001 Sarah & P002 Michael</div>
              </button>
            </div>

            {setupStatus === 'success' && (
              <div className="bg-green-100 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-medium">✅ Setup completed successfully!</p>
                <p className="text-green-700 text-sm mt-1">Test patients initialized with medical histories</p>
              </div>
            )}

            {setupStatus === 'key_set' && (
              <div className="bg-blue-100 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 font-medium">🔑 API Key configured!</p>
                <p className="text-blue-700 text-sm mt-1">AI functionality is now available</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Test Accounts Section */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">🧪 Test Patient Data</h3>
        <p className="text-gray-700 mb-4">
          The platform is now loaded with comprehensive diabetes patient data from patients.txt. 
          Use these test accounts to experience the enhanced AI responses with medical history context.
        </p>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold text-blue-600 mb-3">👥 Test Patient Data (for processMedicalQuery)</h4>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-blue-600">P001 - Sarah Michelle Johnson</span><br/>
                <span className="text-gray-600">Type 2 Diabetes • HbA1c 6.9%</span><br/>
                <span className="text-xs text-gray-500">Metformin 1000mg BID, Empagliflozin 10mg daily</span>
              </div>
              <div>
                <span className="font-medium text-green-600">P002 - Michael David Rodriguez</span><br/>
                <span className="text-gray-600">Type 1 Diabetes • HbA1c 7.8%</span><br/>
                <span className="text-xs text-gray-500">Insulin pump therapy, basal rate 1.2 units/hour</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold text-green-600 mb-3">👨‍⚕️ Doctor Test Accounts</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Dr. Maria Rodriguez (Endocrinology)</span><br/>
                <span className="text-gray-600">dr.rodriguez@trustcare.com • DrMaria2024Endo!</span>
              </div>
              <div>
                <span className="font-medium">Dr. James Thompson (Endocrinology)</span><br/>
                <span className="text-gray-600">dr.thompson@trustcare.com • DrJames2024Endo!</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <div className="p-3 bg-yellow-50 rounded-lg flex-1 mr-4">
            <p className="text-sm text-yellow-800">
              💡 <strong>Test the Enhancement:</strong> Patient queries now include comprehensive medical histories, 
              current medications, HbA1c levels, and treatment progress for personalized AI responses.
            </p>
          </div>
          
          <button
            onClick={() => setShowMvpTester(!showMvpTester)}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 font-medium"
          >
            {showMvpTester ? 'Hide' : 'Test'} MVP
          </button>
        </div>
      </div>

      {/* MVP Tester Section */}
      {showMvpTester && (
        <div className="mb-8">
          <MvpTester />
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">How It Works</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <span className="text-blue-600 font-bold">1</span>
            </div>
            <h4 className="font-semibold mb-2">Patient Submits Query</h4>
            <p className="text-gray-600 text-sm">Patients submit medical questions through the secure portal</p>
          </div>
          <div className="text-center">
            <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <span className="text-purple-600 font-bold">2</span>
            </div>
            <h4 className="font-semibold mb-2">AI Generates Draft</h4>
            <p className="text-gray-600 text-sm">AI creates an initial response based on medical knowledge</p>
          </div>
          <div className="text-center">
            <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <span className="text-green-600 font-bold">3</span>
            </div>
            <h4 className="font-semibold mb-2">Doctor Reviews & Approves</h4>
            <p className="text-gray-600 text-sm">Licensed physician reviews and approves the response</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;