import React, { useState, useEffect } from 'react';
import icpService from './icpService';

function App() {
  const [currentView, setCurrentView] = useState('home'); // 'home', 'patient', 'doctor'
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Test backend connection on load
    testConnection();
  }, []);

  const testConnection = async () => {
    const result = await icpService.healthCheck();
    if (result.success) {
      setMessage(`Backend connected: ${result.data}`);
    } else {
      setMessage('Backend connection failed');
    }
  };

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>TrustCareConnect MVP</h1>
        <nav className="nav">
          <button 
            onClick={() => setCurrentView('home')}
            className={currentView === 'home' ? 'active' : ''}
          >
            Home
          </button>
          <button 
            onClick={() => setCurrentView('patient')}
            className={currentView === 'patient' ? 'active' : ''}
          >
            Patient View
          </button>
          <button 
            onClick={() => setCurrentView('doctor')}
            className={currentView === 'doctor' ? 'active' : ''}
          >
            Doctor View
          </button>
        </nav>
      </header>

      {message && (
        <div className="message">
          {message}
        </div>
      )}

      <main className="main">
        {currentView === 'home' && (
          <HomeView />
        )}
        
        {currentView === 'patient' && (
          <PatientView 
            currentUser={currentUser} 
            setCurrentUser={setCurrentUser}
            showMessage={showMessage}
            loading={loading}
            setLoading={setLoading}
          />
        )}
        
        {currentView === 'doctor' && (
          <DoctorView 
            currentUser={currentUser}
            setCurrentUser={setCurrentUser} 
            showMessage={showMessage}
            loading={loading}
            setLoading={setLoading}
          />
        )}
      </main>
    </div>
  );
}

// Home View Component
function HomeView() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const result = await icpService.getStats();
    if (result.success) {
      setStats(result.data);
    }
  };

  return (
    <div className="home-view">
      <h2>Welcome to TrustCareConnect</h2>
      <p>A simple healthcare communication platform connecting patients and doctors.</p>
      
      {stats && (
        <div className="stats-card">
          <h3>Platform Statistics</h3>
          <div className="stats-grid">
            <div className="stat">
              <span className="stat-number">{stats.totalPatients}</span>
              <span className="stat-label">Patients</span>
            </div>
            <div className="stat">
              <span className="stat-number">{stats.totalDoctors}</span>
              <span className="stat-label">Doctors</span>
            </div>
            <div className="stat">
              <span className="stat-number">{stats.totalQueries}</span>
              <span className="stat-label">Total Queries</span>
            </div>
            <div className="stat">
              <span className="stat-number">{stats.pendingQueries}</span>
              <span className="stat-label">Pending</span>
            </div>
            <div className="stat">
              <span className="stat-number">{stats.completedQueries}</span>
              <span className="stat-label">Completed</span>
            </div>
          </div>
        </div>
      )}

      <div className="instructions">
        <h3>How to Use</h3>
        <div className="instruction-section">
          <h4>For Patients:</h4>
          <ol>
            <li>Register as a patient</li>
            <li>Submit medical queries</li>
            <li>View your query history and responses</li>
          </ol>
        </div>
        <div className="instruction-section">
          <h4>For Doctors:</h4>
          <ol>
            <li>Register as a doctor</li>
            <li>View pending patient queries</li>
            <li>Take queries and provide responses</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

// Patient View Component
function PatientView({ currentUser, setCurrentUser, showMessage, loading, setLoading }) {
  const [queries, setQueries] = useState([]);
  const [queryForm, setQueryForm] = useState({ title: '', description: '' });
  const [assignedDoctor, setAssignedDoctor] = useState(null);

  useEffect(() => {
    if (currentUser) {
      loadPatientQueries();
      loadAssignedDoctor();
    }
  }, [currentUser]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.target);
    const name = formData.get('name');
    const condition = formData.get('condition');
    const email = formData.get('email');

    const result = await icpService.registerPatient(name, condition, email);
    
    if (result.success) {
      const patientResult = await icpService.getPatient(result.data);
      if (patientResult.success) {
        setCurrentUser(patientResult.data);
        showMessage('Patient registered successfully!');
      }
    } else {
      showMessage(`Error: ${result.error}`);
    }
    
    setLoading(false);
  };

  const handleSubmitQuery = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    
    setLoading(true);
    
    const result = await icpService.submitQuery(
      currentUser.id,
      queryForm.title,
      queryForm.description
    );
    
    if (result.success) {
      showMessage('Query submitted successfully!');
      setQueryForm({ title: '', description: '' });
      loadPatientQueries();
    } else {
      showMessage(`Error: ${result.error}`);
    }
    
    setLoading(false);
  };

  const loadPatientQueries = async () => {
    if (!currentUser) return;
    
    const result = await icpService.getPatientQueries(currentUser.id);
    if (result.success) {
      setQueries(result.data);
    }
  };

  const loadAssignedDoctor = async () => {
    if (!currentUser || !currentUser.assignedDoctorId || currentUser.assignedDoctorId.length === 0) {
      setAssignedDoctor(null);
      return;
    }
    
    const doctorId = currentUser.assignedDoctorId[0]; // Handle Optional type
    const result = await icpService.getDoctor(doctorId);
    if (result.success) {
      setAssignedDoctor(result.data);
    }
  };

  const formatStatus = (status) => {
    if ('pending' in status) return 'Pending';
    if ('doctor_review' in status) return 'Under Review';
    if ('completed' in status) return 'Completed';
    return 'Unknown';
  };

  if (!currentUser) {
    return (
      <div className="patient-view">
        <h2>Patient Registration</h2>
        <form onSubmit={handleRegister} className="register-form">
          <div className="form-group">
            <label>Name:</label>
            <input type="text" name="name" required />
          </div>
          <div className="form-group">
            <label>Medical Condition:</label>
            <input type="text" name="condition" placeholder="e.g., diabetes, hypertension" required />
          </div>
          <div className="form-group">
            <label>Email:</label>
            <input type="email" name="email" required />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Registering...' : 'Register as Patient'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="patient-view">
      <div className="user-info">
        <h2>Welcome, {currentUser.name}</h2>
        <p>Condition: {currentUser.condition} | Email: {currentUser.email}</p>
        {assignedDoctor ? (
          <p>Assigned Doctor: <strong>Dr. {assignedDoctor.name}</strong> ({assignedDoctor.specialization})</p>
        ) : (
          <p className="warning">⚠️ No doctor assigned yet. Please wait for a doctor to assign you to start submitting queries.</p>
        )}
        <button onClick={() => setCurrentUser(null)} className="logout-btn">
          Switch Patient
        </button>
      </div>

      {assignedDoctor ? (
        <div className="submit-query-section">
          <h3>Submit New Query to Dr. {assignedDoctor.name}</h3>
          <form onSubmit={handleSubmitQuery} className="query-form">
            <div className="form-group">
              <label>Query Title:</label>
              <input 
                type="text" 
                value={queryForm.title}
                onChange={(e) => setQueryForm({...queryForm, title: e.target.value})}
                required 
              />
            </div>
            <div className="form-group">
              <label>Description:</label>
              <textarea 
                value={queryForm.description}
                onChange={(e) => setQueryForm({...queryForm, description: e.target.value})}
                rows="4"
                required 
              />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Query'}
            </button>
          </form>
        </div>
      ) : (
        <div className="assignment-waiting">
          <h3>Waiting for Doctor Assignment</h3>
          <p>Once a doctor assigns you as their patient, you'll be able to submit queries and receive personalized care.</p>
        </div>
      )}

      <div className="queries-section">
        <h3>My Queries ({queries.length})</h3>
        {queries.length === 0 ? (
          <p>No queries submitted yet.</p>
        ) : (
          queries.map(query => (
            <div key={query.id} className="query-card">
              <div className="query-header">
                <h4>{query.title}</h4>
                <span className={`status ${formatStatus(query.status).toLowerCase().replace(' ', '-')}`}>
                  {formatStatus(query.status)}
                </span>
              </div>
              <p>{query.description}</p>
              {query.response && query.response[0] && (
                <div className="response">
                  <strong>Doctor's Response:</strong>
                  <p>{query.response[0]}</p>
                </div>
              )}
              <small>Created: {new Date(Number(query.createdAt) / 1000000).toLocaleString()}</small>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Doctor View Component
function DoctorView({ currentUser, setCurrentUser, showMessage, loading, setLoading }) {
  const [pendingQueries, setPendingQueries] = useState([]);
  const [myQueries, setMyQueries] = useState([]);
  const [responseForm, setResponseForm] = useState({ queryId: '', response: '' });
  const [unassignedPatients, setUnassignedPatients] = useState([]);
  const [myPatients, setMyPatients] = useState([]);
  const [currentTab, setCurrentTab] = useState('patients'); // 'patients', 'queries'

  useEffect(() => {
    if (currentUser) {
      loadUnassignedPatients();
      loadMyPatients();
      loadPendingQueries();
      loadMyQueries();
    }
  }, [currentUser]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.target);
    const name = formData.get('name');
    const specialization = formData.get('specialization');

    const result = await icpService.registerDoctor(name, specialization);
    
    if (result.success) {
      const doctorResult = await icpService.getDoctor(result.data);
      if (doctorResult.success) {
        setCurrentUser(doctorResult.data);
        showMessage('Doctor registered successfully!');
      }
    } else {
      showMessage(`Error: ${result.error}`);
    }
    
    setLoading(false);
  };

  const handleTakeQuery = async (queryId) => {
    if (!currentUser) return;
    
    setLoading(true);
    const result = await icpService.takeQuery(queryId, currentUser.id);
    
    if (result.success) {
      showMessage('Query taken successfully!');
      loadPendingQueries();
      loadMyQueries();
    } else {
      showMessage(`Error: ${result.error}`);
    }
    
    setLoading(false);
  };

  const handleRespondToQuery = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    
    setLoading(true);
    const result = await icpService.respondToQuery(
      responseForm.queryId,
      currentUser.id,
      responseForm.response
    );
    
    if (result.success) {
      showMessage('Response submitted successfully!');
      setResponseForm({ queryId: '', response: '' });
      loadMyQueries();
    } else {
      showMessage(`Error: ${result.error}`);
    }
    
    setLoading(false);
  };

  const loadPendingQueries = async () => {
    const result = await icpService.getPendingQueries();
    if (result.success) {
      setPendingQueries(result.data);
    }
  };

  const loadMyQueries = async () => {
    if (!currentUser) return;
    
    const result = await icpService.getDoctorQueries(currentUser.id);
    if (result.success) {
      setMyQueries(result.data);
    }
  };

  const loadUnassignedPatients = async () => {
    const result = await icpService.getUnassignedPatients();
    if (result.success) {
      setUnassignedPatients(result.data);
    }
  };

  const loadMyPatients = async () => {
    if (!currentUser) return;
    
    const result = await icpService.getDoctorPatients(currentUser.id);
    if (result.success) {
      setMyPatients(result.data);
    }
  };

  const handleAssignPatient = async (patientId) => {
    if (!currentUser) return;
    
    setLoading(true);
    const result = await icpService.assignPatientToDoctor(patientId, currentUser.id);
    
    if (result.success) {
      showMessage('Patient assigned successfully!');
      loadUnassignedPatients();
      loadMyPatients();
    } else {
      showMessage(`Error: ${result.error}`);
    }
    
    setLoading(false);
  };

  const handleUnassignPatient = async (patientId) => {
    if (!currentUser) return;
    
    const confirmUnassign = window.confirm('Are you sure you want to unassign this patient?');
    if (!confirmUnassign) return;
    
    setLoading(true);
    const result = await icpService.unassignPatient(patientId, currentUser.id);
    
    if (result.success) {
      showMessage('Patient unassigned successfully!');
      loadUnassignedPatients();
      loadMyPatients();
    } else {
      showMessage(`Error: ${result.error}`);
    }
    
    setLoading(false);
  };

  const formatStatus = (status) => {
    if ('pending' in status) return 'Pending';
    if ('doctor_review' in status) return 'Under Review';
    if ('completed' in status) return 'Completed';
    return 'Unknown';
  };

  if (!currentUser) {
    return (
      <div className="doctor-view">
        <h2>Doctor Registration</h2>
        <form onSubmit={handleRegister} className="register-form">
          <div className="form-group">
            <label>Name:</label>
            <input type="text" name="name" required />
          </div>
          <div className="form-group">
            <label>Specialization:</label>
            <input type="text" name="specialization" placeholder="e.g., endocrinologist, cardiologist" required />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Registering...' : 'Register as Doctor'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="doctor-view">
      <div className="user-info">
        <h2>Dr. {currentUser.name}</h2>
        <p>Specialization: {currentUser.specialization}</p>
        <button onClick={() => setCurrentUser(null)} className="logout-btn">
          Switch Doctor
        </button>
      </div>

      <div className="doctor-tabs">
        <button 
          onClick={() => setCurrentTab('patients')}
          className={currentTab === 'patients' ? 'active' : ''}
        >
          Patient Management
        </button>
        <button 
          onClick={() => setCurrentTab('queries')}
          className={currentTab === 'queries' ? 'active' : ''}
        >
          Query Management
        </button>
      </div>

      {currentTab === 'patients' && (
        <>
          <div className="my-patients-section">
            <h3>My Patients ({myPatients.length})</h3>
            {myPatients.length === 0 ? (
              <p>No patients assigned yet.</p>
            ) : (
              myPatients.map(patient => (
                <div key={patient.id} className="patient-card">
                  <div className="patient-header">
                    <h4>{patient.name}</h4>
                    <span className="condition-badge">{patient.condition}</span>
                  </div>
                  <p>Email: {patient.email}</p>
                  <p>Status: {patient.isActive ? 'Active' : 'Inactive'}</p>
                  <div className="patient-actions">
                    <button 
                      onClick={() => handleUnassignPatient(patient.id)}
                      disabled={loading}
                      className="unassign-btn"
                    >
                      Unassign Patient
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="unassigned-patients-section">
            <h3>Available Patients ({unassignedPatients.length})</h3>
            {unassignedPatients.length === 0 ? (
              <p>No unassigned patients available.</p>
            ) : (
              unassignedPatients.map(patient => (
                <div key={patient.id} className="patient-card">
                  <div className="patient-header">
                    <h4>{patient.name}</h4>
                    <span className="condition-badge">{patient.condition}</span>
                  </div>
                  <p>Email: {patient.email}</p>
                  <p>Seeking care for: {patient.condition}</p>
                  <div className="patient-actions">
                    <button 
                      onClick={() => handleAssignPatient(patient.id)}
                      disabled={loading}
                      className="assign-btn"
                    >
                      Assign to My Care
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {currentTab === 'queries' && (
        <>
          <div className="pending-queries-section">
            <h3>My Patients' Queries ({myQueries.filter(q => formatStatus(q.status) === 'Pending').length})</h3>
            {myQueries.filter(q => formatStatus(q.status) === 'Pending').length === 0 ? (
              <p>No pending queries from your patients.</p>
            ) : (
              myQueries.filter(q => formatStatus(q.status) === 'Pending').map(query => (
                <div key={query.id} className="query-card">
                  <h4>{query.title}</h4>
                  <p>{query.description}</p>
                  <small>Patient ID: {query.patientId} | Created: {new Date(Number(query.createdAt) / 1000000).toLocaleString()}</small>
                  <button 
                    onClick={() => handleTakeQuery(query.id)}
                    disabled={loading}
                    className="take-btn"
                  >
                    Start Review
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="my-queries-section">
            <h3>Queries Under Review & Completed ({myQueries.filter(q => formatStatus(q.status) !== 'Pending').length})</h3>
            {myQueries.filter(q => formatStatus(q.status) !== 'Pending').length === 0 ? (
              <p>No queries in review or completed yet.</p>
            ) : (
              myQueries.filter(q => formatStatus(q.status) !== 'Pending').map(query => (
                <div key={query.id} className="query-card">
                  <div className="query-header">
                    <h4>{query.title}</h4>
                    <span className={`status ${formatStatus(query.status).toLowerCase().replace(' ', '-')}`}>
                      {formatStatus(query.status)}
                    </span>
                  </div>
                  <p>{query.description}</p>
                  <small>Patient ID: {query.patientId} | Created: {new Date(Number(query.createdAt) / 1000000).toLocaleString()}</small>
                  
                  {formatStatus(query.status) === 'Under Review' && (
                    <div className="ai-assisted-response">
                      {query.aiDraftResponse && query.aiDraftResponse[0] && (
                        <div className="ai-draft">
                          <h5>🤖 AI-Generated Draft Response:</h5>
                          <div className="ai-draft-content">
                            <p>{query.aiDraftResponse[0]}</p>
                          </div>
                          <button 
                            type="button"
                            onClick={() => setResponseForm({ 
                              queryId: query.id, 
                              response: query.aiDraftResponse[0] 
                            })}
                            className="use-ai-draft-btn"
                          >
                            Use AI Draft
                          </button>
                        </div>
                      )}
                      
                      <form onSubmit={handleRespondToQuery} className="response-form">
                        <label>Your Final Response:</label>
                        <textarea 
                          placeholder="Edit the AI draft above or write your own response..."
                          value={responseForm.queryId === query.id ? responseForm.response : ''}
                          onChange={(e) => setResponseForm({ queryId: query.id, response: e.target.value })}
                          rows="4"
                          required
                        />
                        <button type="submit" disabled={loading || responseForm.queryId !== query.id}>
                          {loading ? 'Submitting...' : 'Submit Final Response'}
                        </button>
                      </form>
                    </div>
                  )}
                  
                  {query.response && query.response[0] && (
                    <div className="response">
                      <strong>Your Response:</strong>
                      <p>{query.response[0]}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;