export const idlFactory = ({ IDL }) => {
  const PatientId = IDL.Text;
  const DoctorId = IDL.Text;
  const Result = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
  const Patient = IDL.Record({
    'id' : PatientId,
    'name' : IDL.Text,
    'isActive' : IDL.Bool,
    'email' : IDL.Text,
    'assignedDoctorId' : IDL.Opt(DoctorId),
    'condition' : IDL.Text,
  });
  const Doctor = IDL.Record({
    'id' : DoctorId,
    'name' : IDL.Text,
    'specialization' : IDL.Text,
  });
  const QueryId = IDL.Text;
  const QueryStatus = IDL.Variant({
    'doctor_review' : IDL.Null,
    'pending' : IDL.Null,
    'completed' : IDL.Null,
  });
  const MedicalQuery = IDL.Record({
    'id' : QueryId,
    'status' : QueryStatus,
    'doctorId' : IDL.Opt(DoctorId),
    'title' : IDL.Text,
    'patientId' : PatientId,
    'createdAt' : IDL.Int,
    'description' : IDL.Text,
    'updatedAt' : IDL.Int,
    'aiDraftResponse' : IDL.Opt(IDL.Text),
    'response' : IDL.Opt(IDL.Text),
  });
  const SystemStats = IDL.Record({
    'totalPatients' : IDL.Nat,
    'pendingQueries' : IDL.Nat,
    'totalQueries' : IDL.Nat,
    'totalDoctors' : IDL.Nat,
    'completedQueries' : IDL.Nat,
  });
  const Result_1 = IDL.Variant({ 'ok' : QueryId, 'err' : IDL.Text });
  return IDL.Service({
    'assignPatientToDoctor' : IDL.Func([PatientId, DoctorId], [Result], []),
    'findPatientByEmail' : IDL.Func([IDL.Text], [IDL.Opt(Patient)], ['query']),
    'getAllDoctors' : IDL.Func([], [IDL.Vec(Doctor)], ['query']),
    'getDoctor' : IDL.Func([DoctorId], [IDL.Opt(Doctor)], ['query']),
    'getDoctorPatients' : IDL.Func([DoctorId], [IDL.Vec(Patient)], ['query']),
    'getDoctorQueries' : IDL.Func(
        [DoctorId],
        [IDL.Vec(MedicalQuery)],
        ['query'],
      ),
    'getPatient' : IDL.Func([PatientId], [IDL.Opt(Patient)], ['query']),
    'getPatientQueries' : IDL.Func(
        [PatientId],
        [IDL.Vec(MedicalQuery)],
        ['query'],
      ),
    'getPendingQueries' : IDL.Func([], [IDL.Vec(MedicalQuery)], ['query']),
    'getQuery' : IDL.Func([QueryId], [IDL.Opt(MedicalQuery)], ['query']),
    'getStats' : IDL.Func([], [SystemStats], ['query']),
    'getUnassignedPatients' : IDL.Func([], [IDL.Vec(Patient)], ['query']),
    'healthCheck' : IDL.Func([], [IDL.Text], ['query']),
    'registerDoctor' : IDL.Func([IDL.Text, IDL.Text], [DoctorId], []),
    'registerPatient' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text],
        [PatientId],
        [],
      ),
    'respondToQuery' : IDL.Func([QueryId, DoctorId, IDL.Text], [Result], []),
    'submitQuery' : IDL.Func([PatientId, IDL.Text, IDL.Text], [Result_1], []),
    'takeQuery' : IDL.Func([QueryId, DoctorId], [Result], []),
    'unassignPatient' : IDL.Func([PatientId, DoctorId], [Result], []),
  });
};
export const init = ({ IDL }) => { return []; };
