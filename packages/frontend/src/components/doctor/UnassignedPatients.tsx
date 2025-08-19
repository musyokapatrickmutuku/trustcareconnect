// Unassigned Patients Component
import React from 'react';
import { Patient } from '../../types';
import Button from '../common/Button';

interface UnassignedPatientsProps {
  unassignedPatients: Patient[];
  onAssign: (patientId: string) => void;
  loading: boolean;
}

const UnassignedPatients: React.FC<UnassignedPatientsProps> = ({
  unassignedPatients,
  onAssign,
  loading
}) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Available Patients ({unassignedPatients.length})
        </h3>
        <div className="text-sm text-gray-600">
          💡 Assign patients to provide them with medical care
        </div>
      </div>

      {unassignedPatients.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">All patients are assigned!</h3>
          <p className="text-gray-600">
            There are currently no unassigned patients waiting for care.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {unassignedPatients.map((patient) => (
            <div key={patient.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-900">{patient.name}</h4>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      Needs Assignment
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-start gap-2">
                      <span className="font-medium text-gray-700 min-w-0">Medical Condition:</span>
                      <span className="flex-1 text-gray-900 font-medium">{patient.condition}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">Contact Email:</span>
                      <span className="text-gray-900">{patient.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">Patient ID:</span>
                      <span className="font-mono text-gray-900">{patient.id}</span>
                    </div>
                  </div>

                  {/* Patient Status */}
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex items-center text-xs text-orange-600">
                      <div className="w-2 h-2 rounded-full bg-orange-400 mr-2" />
                      Waiting for doctor assignment
                    </div>
                    {patient.isActive && (
                      <div className="flex items-center text-xs text-green-600">
                        <div className="w-2 h-2 rounded-full bg-green-400 mr-2" />
                        Active patient account
                      </div>
                    )}
                  </div>

                  {/* Care Description */}
                  <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                    <p className="text-gray-600">
                      <span className="font-medium">Seeking care for:</span> {patient.condition}
                    </p>
                  </div>
                </div>

                <div className="ml-6 flex flex-col gap-2">
                  <Button
                    variant="primary"
                    size="small"
                    onClick={() => onAssign(patient.id)}
                    disabled={loading}
                    className="whitespace-nowrap"
                  >
                    {loading ? 'Assigning...' : 'Assign to My Care'}
                  </Button>
                  
                  {/* Quick info about assignment */}
                  <div className="text-xs text-gray-500 text-center max-w-32">
                    Patient will be added to your dashboard
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Help Section */}
      {unassignedPatients.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">💡 Patient Assignment Guidelines</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Review patient conditions to ensure they match your specialization</li>
            <li>• Assigned patients will appear in your "My Patients" tab</li>
            <li>• You'll receive notifications about new queries from assigned patients</li>
            <li>• You can unassign patients later if needed</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default UnassignedPatients;