// Patient Card Component for Doctor Dashboard
import React from 'react';
import { Patient } from '../../types';
import Button from '../common/Button';

interface PatientCardProps {
  patient: Patient;
  onUnassign: () => void;
  loading: boolean;
}

const PatientCard: React.FC<PatientCardProps> = ({
  patient,
  onUnassign,
  loading
}) => {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-gray-900">{patient.name}</h4>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              patient.isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {patient.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          
          <div className="space-y-1 text-sm text-gray-600">
            <p>
              <span className="font-medium">Medical Condition:</span> {patient.condition}
            </p>
            <p>
              <span className="font-medium">Email:</span> {patient.email}
            </p>
            <p>
              <span className="font-medium">Patient ID:</span> 
              <span className="font-mono ml-1">{patient.id}</span>
            </p>
          </div>

          {/* Patient Status Indicators */}
          <div className="flex flex-wrap gap-2 mt-3">
            <div className="flex items-center text-xs text-gray-500">
              <div className={`w-2 h-2 rounded-full mr-2 ${
                patient.isActive ? 'bg-green-400' : 'bg-gray-400'
              }`} />
              {patient.isActive ? 'Currently receiving care' : 'Inactive patient'}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 ml-4">
          <Button
            variant="danger"
            size="small"
            onClick={onUnassign}
            disabled={loading}
          >
            Unassign
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PatientCard;