import React, { useState, useEffect } from 'react';
import { Patient, ComponentProps } from '../types';
import LoadingSpinner from './common/LoadingSpinner';
import Button from './common/Button';
import FormField from './common/FormField';
import trustCareAPI from '../api/trustcare';

interface PatientProfileProps extends ComponentProps {
  patient: Patient;
  onUpdate: () => void;
  isEditable?: boolean;
}

interface VitalSigns {
  bloodPressureSystolic: string;
  bloodPressureDiastolic: string;
  heartRate: string;
  temperature: string;
  respiratoryRate: string;
  oxygenSaturation: string;
  weight: string;
  height: string;
  recordedAt: number;
}

interface MedicalHistory {
  id: string;
  condition: string;
  diagnosedDate: string;
  status: 'active' | 'resolved' | 'chronic';
  notes: string;
  createdAt: number;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  prescribedBy: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'discontinued';
  notes: string;
  createdAt: number;
}

interface ExtendedPatientData extends Patient {
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  address?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  allergies?: string[];
  bloodType?: string;
  vitalSigns?: VitalSigns[];
  medicalHistory?: MedicalHistory[];
  medications?: Medication[];
}

const PatientProfile: React.FC<PatientProfileProps> = ({
  patient,
  onUpdate,
  isEditable = true,
  showMessage,
  loading,
  setLoading
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'vitals' | 'history' | 'medications'>('profile');
  const [patientData, setPatientData] = useState<ExtendedPatientData>(patient);
  const [formData, setFormData] = useState<Partial<ExtendedPatientData>>({});
  const [newVitalSigns, setNewVitalSigns] = useState<Partial<VitalSigns>>({});
  const [newMedication, setNewMedication] = useState<Partial<Medication>>({});
  const [newHistoryItem, setNewHistoryItem] = useState<Partial<MedicalHistory>>({});

  useEffect(() => {
    loadPatientData();
  }, [patient.id]);

  const loadPatientData = async () => {
    setLoading?.(true);
    try {
      const result = await trustCareAPI.getPatientProfile(patient.id);
      if (result.success && 'data' in result && result.data) {
        setPatientData({ ...patient, ...result.data });
      }
    } catch (error) {
      console.error('Error loading patient data:', error);
      showMessage?.('Failed to load patient data', 'error');
    } finally {
      setLoading?.(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setFormData({});
    } else {
      setFormData(patientData);
    }
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = async () => {
    if (!formData) return;
    
    setLoading?.(true);
    try {
      const result = await trustCareAPI.updatePatientProfile(patient.id, formData);
      if (result.success) {
        setPatientData(prev => ({ ...prev, ...formData }));
        setIsEditing(false);
        onUpdate();
        showMessage?.('Profile updated successfully', 'success');
      } else {
        showMessage?.(result.error || 'Failed to update profile', 'error');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showMessage?.('Failed to update profile', 'error');
    } finally {
      setLoading?.(false);
    }
  };

  const handleAddVitalSigns = async () => {
    if (!newVitalSigns.bloodPressureSystolic || !newVitalSigns.heartRate) {
      showMessage?.('Blood pressure and heart rate are required', 'error');
      return;
    }

    setLoading?.(true);
    try {
      const vitalSignsData = {
        ...newVitalSigns,
        recordedAt: Date.now()
      };
      
      const result = await trustCareAPI.addVitalSigns(patient.id, vitalSignsData);
      if (result.success) {
        setPatientData(prev => ({
          ...prev,
          vitalSigns: [vitalSignsData as VitalSigns, ...(prev.vitalSigns || [])]
        }));
        setNewVitalSigns({});
        showMessage?.('Vital signs recorded successfully', 'success');
      } else {
        showMessage?.(result.error || 'Failed to record vital signs', 'error');
      }
    } catch (error) {
      console.error('Error adding vital signs:', error);
      showMessage?.('Failed to record vital signs', 'error');
    } finally {
      setLoading?.(false);
    }
  };

  const handleAddMedication = async () => {
    if (!newMedication.name || !newMedication.dosage) {
      showMessage?.('Medication name and dosage are required', 'error');
      return;
    }

    setLoading?.(true);
    try {
      const medicationData = {
        ...newMedication,
        id: Date.now().toString(),
        status: 'active' as const,
        createdAt: Date.now()
      };
      
      const result = await trustCareAPI.addMedication(patient.id, medicationData);
      if (result.success) {
        setPatientData(prev => ({
          ...prev,
          medications: [medicationData as Medication, ...(prev.medications || [])]
        }));
        setNewMedication({});
        showMessage?.('Medication added successfully', 'success');
      } else {
        showMessage?.(result.error || 'Failed to add medication', 'error');
      }
    } catch (error) {
      console.error('Error adding medication:', error);
      showMessage?.('Failed to add medication', 'error');
    } finally {
      setLoading?.(false);
    }
  };

  const handleAddHistoryItem = async () => {
    if (!newHistoryItem.condition || !newHistoryItem.diagnosedDate) {
      showMessage?.('Condition and diagnosed date are required', 'error');
      return;
    }

    setLoading?.(true);
    try {
      const historyData = {
        ...newHistoryItem,
        id: Date.now().toString(),
        createdAt: Date.now()
      };
      
      const result = await trustCareAPI.addMedicalHistory(patient.id, historyData);
      if (result.success) {
        setPatientData(prev => ({
          ...prev,
          medicalHistory: [historyData as MedicalHistory, ...(prev.medicalHistory || [])]
        }));
        setNewHistoryItem({});
        showMessage?.('Medical history updated successfully', 'success');
      } else {
        showMessage?.(result.error || 'Failed to add medical history', 'error');
      }
    } catch (error) {
      console.error('Error adding medical history:', error);
      showMessage?.('Failed to add medical history', 'error');
    } finally {
      setLoading?.(false);
    }
  };

  const formatDate = (timestamp: number | string) => {
    if (typeof timestamp === 'string') return timestamp;
    return new Date(timestamp).toLocaleDateString();
  };

  if (loading && !patientData) {
    return <LoadingSpinner message="Loading patient profile..." />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{patientData.name}</h1>
            <p className="text-gray-600 mt-1">Patient ID: {patientData.id}</p>
            {patientData.assignedDoctorId && (
              <p className="text-green-600 text-sm mt-1">✓ Assigned to Doctor</p>
            )}
          </div>
          {isEditable && (
            <div className="flex space-x-2">
              <Button
                onClick={handleEditToggle}
                className={isEditing ? 'bg-gray-500 hover:bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'}
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </Button>
              {isEditing && (
                <Button onClick={handleSaveProfile} loading={loading} className="bg-green-600 hover:bg-green-700">
                  Save Changes
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="flex border-b">
          {(['profile', 'vitals', 'history', 'medications'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium capitalize ${
                activeTab === tab
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'vitals' ? 'Vital Signs' : tab === 'history' ? 'Medical History' : tab}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Full Name"
                  name="name"
                  value={isEditing ? (formData.name || '') : patientData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  disabled={!isEditing}
                />
                
                <FormField
                  label="Email"
                  name="email"
                  type="email"
                  value={isEditing ? (formData.email || '') : patientData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  disabled={!isEditing}
                />
                
                <FormField
                  label="Date of Birth"
                  name="dateOfBirth"
                  type="date"
                  value={isEditing ? (formData.dateOfBirth || '') : (patientData.dateOfBirth || '')}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  disabled={!isEditing}
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    value={isEditing ? (formData.gender || '') : (patientData.gender || '')}
                    onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <FormField
                  label="Phone"
                  name="phone"
                  value={isEditing ? (formData.phone || '') : (patientData.phone || '')}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  disabled={!isEditing}
                />
                
                <FormField
                  label="Blood Type"
                  name="bloodType"
                  value={isEditing ? (formData.bloodType || '') : (patientData.bloodType || '')}
                  onChange={(e) => setFormData(prev => ({ ...prev, bloodType: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>
              
              <FormField
                label="Address"
                name="address"
                type="textarea"
                value={isEditing ? (formData.address || '') : (patientData.address || '')}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                disabled={!isEditing}
              />
              
              <FormField
                label="Allergies (comma-separated)"
                name="allergies"
                value={isEditing ? (formData.allergies?.join(', ') || '') : (patientData.allergies?.join(', ') || '')}
                onChange={(e) => setFormData(prev => ({ ...prev, allergies: e.target.value.split(',').map(s => s.trim()) }))}
                disabled={!isEditing}
              />
            </div>
          )}

          {/* Vital Signs Tab */}
          {activeTab === 'vitals' && (
            <div className="space-y-6">
              {/* Add New Vital Signs */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-4">Record New Vital Signs</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <FormField
                    label="Systolic BP"
                    name="bloodPressureSystolic"
                    value={newVitalSigns.bloodPressureSystolic || ''}
                    onChange={(e) => setNewVitalSigns(prev => ({ ...prev, bloodPressureSystolic: e.target.value }))}
                    placeholder="120"
                  />
                  <FormField
                    label="Diastolic BP"
                    name="bloodPressureDiastolic"
                    value={newVitalSigns.bloodPressureDiastolic || ''}
                    onChange={(e) => setNewVitalSigns(prev => ({ ...prev, bloodPressureDiastolic: e.target.value }))}
                    placeholder="80"
                  />
                  <FormField
                    label="Heart Rate (bpm)"
                    name="heartRate"
                    value={newVitalSigns.heartRate || ''}
                    onChange={(e) => setNewVitalSigns(prev => ({ ...prev, heartRate: e.target.value }))}
                    placeholder="72"
                  />
                  <FormField
                    label="Temperature (°F)"
                    name="temperature"
                    value={newVitalSigns.temperature || ''}
                    onChange={(e) => setNewVitalSigns(prev => ({ ...prev, temperature: e.target.value }))}
                    placeholder="98.6"
                  />
                </div>
                <Button onClick={handleAddVitalSigns} className="mt-4 bg-green-600 hover:bg-green-700">
                  Record Vital Signs
                </Button>
              </div>

              {/* Vital Signs History */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">Vital Signs History</h3>
                {patientData.vitalSigns?.length ? (
                  patientData.vitalSigns.map((vitals, index) => (
                    <div key={index} className="bg-white border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium">Recorded {formatDate(vitals.recordedAt)}</h4>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Blood Pressure:</span>
                          <div className="font-medium">{vitals.bloodPressureSystolic}/{vitals.bloodPressureDiastolic} mmHg</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Heart Rate:</span>
                          <div className="font-medium">{vitals.heartRate} bpm</div>
                        </div>
                        {vitals.temperature && (
                          <div>
                            <span className="text-gray-600">Temperature:</span>
                            <div className="font-medium">{vitals.temperature}°F</div>
                          </div>
                        )}
                        {vitals.weight && (
                          <div>
                            <span className="text-gray-600">Weight:</span>
                            <div className="font-medium">{vitals.weight} lbs</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No vital signs recorded yet.</p>
                )}
              </div>
            </div>
          )}

          {/* Medical History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              {/* Add New History Item */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-4">Add Medical History</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    label="Condition"
                    name="condition"
                    value={newHistoryItem.condition || ''}
                    onChange={(e) => setNewHistoryItem(prev => ({ ...prev, condition: e.target.value }))}
                    placeholder="Hypertension, Diabetes, etc."
                  />
                  <FormField
                    label="Diagnosed Date"
                    name="diagnosedDate"
                    type="date"
                    value={newHistoryItem.diagnosedDate || ''}
                    onChange={(e) => setNewHistoryItem(prev => ({ ...prev, diagnosedDate: e.target.value }))}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={newHistoryItem.status || 'active'}
                      onChange={(e) => setNewHistoryItem(prev => ({ ...prev, status: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="resolved">Resolved</option>
                      <option value="chronic">Chronic</option>
                    </select>
                  </div>
                </div>
                <FormField
                  label="Notes"
                  name="notes"
                  type="textarea"
                  value={newHistoryItem.notes || ''}
                  onChange={(e) => setNewHistoryItem(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about this condition..."
                  className="mt-4"
                />
                <Button onClick={handleAddHistoryItem} className="mt-4 bg-green-600 hover:bg-green-700">
                  Add to History
                </Button>
              </div>

              {/* Medical History List */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">Medical History</h3>
                {patientData.medicalHistory?.length ? (
                  patientData.medicalHistory.map((item) => (
                    <div key={item.id} className="bg-white border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-lg">{item.condition}</h4>
                          <p className="text-gray-600">Diagnosed: {item.diagnosedDate}</p>
                          {item.notes && <p className="text-gray-700 mt-2">{item.notes}</p>}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          item.status === 'active' ? 'bg-red-100 text-red-800' :
                          item.status === 'chronic' ? 'bg-orange-100 text-orange-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {item.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No medical history recorded yet.</p>
                )}
              </div>
            </div>
          )}

          {/* Medications Tab */}
          {activeTab === 'medications' && (
            <div className="space-y-6">
              {/* Add New Medication */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-4">Add New Medication</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="Medication Name"
                    name="name"
                    value={newMedication.name || ''}
                    onChange={(e) => setNewMedication(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Lisinopril, Metformin, etc."
                  />
                  <FormField
                    label="Dosage"
                    name="dosage"
                    value={newMedication.dosage || ''}
                    onChange={(e) => setNewMedication(prev => ({ ...prev, dosage: e.target.value }))}
                    placeholder="10mg, 500mg, etc."
                  />
                  <FormField
                    label="Frequency"
                    name="frequency"
                    value={newMedication.frequency || ''}
                    onChange={(e) => setNewMedication(prev => ({ ...prev, frequency: e.target.value }))}
                    placeholder="Once daily, Twice daily, etc."
                  />
                  <FormField
                    label="Prescribed By"
                    name="prescribedBy"
                    value={newMedication.prescribedBy || ''}
                    onChange={(e) => setNewMedication(prev => ({ ...prev, prescribedBy: e.target.value }))}
                    placeholder="Dr. Smith"
                  />
                  <FormField
                    label="Start Date"
                    name="startDate"
                    type="date"
                    value={newMedication.startDate || ''}
                    onChange={(e) => setNewMedication(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                  <FormField
                    label="End Date (Optional)"
                    name="endDate"
                    type="date"
                    value={newMedication.endDate || ''}
                    onChange={(e) => setNewMedication(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
                <FormField
                  label="Notes"
                  name="notes"
                  type="textarea"
                  value={newMedication.notes || ''}
                  onChange={(e) => setNewMedication(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about this medication..."
                  className="mt-4"
                />
                <Button onClick={handleAddMedication} className="mt-4 bg-green-600 hover:bg-green-700">
                  Add Medication
                </Button>
              </div>

              {/* Medications List */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">Current & Past Medications</h3>
                {patientData.medications?.length ? (
                  patientData.medications.map((medication) => (
                    <div key={medication.id} className="bg-white border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-lg">{medication.name}</h4>
                          <p className="text-gray-600">{medication.dosage} - {medication.frequency}</p>
                          <p className="text-gray-600">Prescribed by: {medication.prescribedBy}</p>
                          <p className="text-gray-600">
                            From: {medication.startDate} 
                            {medication.endDate && ` to ${medication.endDate}`}
                          </p>
                          {medication.notes && <p className="text-gray-700 mt-2">{medication.notes}</p>}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          medication.status === 'active' ? 'bg-green-100 text-green-800' :
                          medication.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {medication.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No medications recorded yet.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;