// TypeScript version of the IDL factory for the backend canister
import type { IDL } from '@dfinity/candid';

export const idlFactory = ({ IDL }: { IDL: IDL }): IDL.ServiceClass => {
  const Patient = IDL.Record({
    'id': IDL.Text,
    'name': IDL.Text,
    'condition': IDL.Text,
    'email': IDL.Text,
    'assignedDoctorId': IDL.Opt(IDL.Text),
    'isActive': IDL.Bool,
  });
  
  const Doctor = IDL.Record({
    'id': IDL.Text,
    'name': IDL.Text,
    'specialization': IDL.Text,
  });
  
  const QueryStatus = IDL.Variant({
    'pending': IDL.Null,
    'doctor_review': IDL.Null,
    'completed': IDL.Null,
  });
  
  const MedicalQuery = IDL.Record({
    'id': IDL.Text,
    'patientId': IDL.Text,
    'title': IDL.Text,
    'description': IDL.Text,
    'status': QueryStatus,
    'doctorId': IDL.Opt(IDL.Text),
    'response': IDL.Opt(IDL.Text),
    'createdAt': IDL.Int,
    'updatedAt': IDL.Int,
  });
  
  const Result = IDL.Variant({ 'ok': IDL.Text, 'err': IDL.Text });
  const Result_1 = IDL.Variant({ 'ok': IDL.Null, 'err': IDL.Text });
  
  const Stats = IDL.Record({
    'totalPatients': IDL.Nat,
    'totalDoctors': IDL.Nat,
    'totalQueries': IDL.Nat,
    'pendingQueries': IDL.Nat,
    'completedQueries': IDL.Nat,
  });
  
  return IDL.Service({
    'assignPatientToDoctor': IDL.Func([IDL.Text, IDL.Text], [Result_1], []),
    'getAllDoctors': IDL.Func([], [IDL.Vec(Doctor)], ['query']),
    'getAllPatients': IDL.Func([], [IDL.Vec(Patient)], ['query']),
    'getAllQueries': IDL.Func([], [IDL.Vec(MedicalQuery)], ['query']),
    'getCompletedQueries': IDL.Func([], [IDL.Vec(MedicalQuery)], ['query']),
    'getDoctor': IDL.Func([IDL.Text], [IDL.Opt(Doctor)], ['query']),
    'getDoctorPatients': IDL.Func([IDL.Text], [IDL.Vec(Patient)], ['query']),
    'getDoctorQueries': IDL.Func([IDL.Text], [IDL.Vec(MedicalQuery)], ['query']),
    'getPatient': IDL.Func([IDL.Text], [IDL.Opt(Patient)], ['query']),
    'getPatientQueries': IDL.Func([IDL.Text], [IDL.Vec(MedicalQuery)], ['query']),
    'getPendingQueries': IDL.Func([], [IDL.Vec(MedicalQuery)], ['query']),
    'getQuery': IDL.Func([IDL.Text], [IDL.Opt(MedicalQuery)], ['query']),
    'getStats': IDL.Func([], [Stats], ['query']),
    'getUnassignedPatients': IDL.Func([], [IDL.Vec(Patient)], ['query']),
    'healthCheck': IDL.Func([], [IDL.Text], ['query']),
    'registerDoctor': IDL.Func([IDL.Text, IDL.Text], [IDL.Text], []),
    'registerPatient': IDL.Func([IDL.Text, IDL.Text, IDL.Text], [IDL.Text], []),
    'respondToQuery': IDL.Func([IDL.Text, IDL.Text, IDL.Text], [Result_1], []),
    'submitQuery': IDL.Func([IDL.Text, IDL.Text, IDL.Text], [Result], []),
    'takeQuery': IDL.Func([IDL.Text, IDL.Text], [Result_1], []),
    'unassignPatient': IDL.Func([IDL.Text, IDL.Text], [Result_1], []),
  });
};

export const canisterId = process.env.REACT_APP_BACKEND_CANISTER_ID;