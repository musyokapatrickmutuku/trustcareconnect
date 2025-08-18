import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Doctor {
  'id' : DoctorId,
  'name' : string,
  'specialization' : string,
}
export type DoctorId = string;
export interface MedicalQuery {
  'id' : QueryId,
  'status' : QueryStatus,
  'doctorId' : [] | [DoctorId],
  'title' : string,
  'patientId' : PatientId,
  'createdAt' : bigint,
  'description' : string,
  'updatedAt' : bigint,
  'aiDraftResponse' : [] | [string],
  'response' : [] | [string],
}
export interface Patient {
  'id' : PatientId,
  'name' : string,
  'isActive' : boolean,
  'email' : string,
  'assignedDoctorId' : [] | [DoctorId],
  'condition' : string,
}
export type PatientId = string;
export type QueryId = string;
export type QueryStatus = { 'doctor_review' : null } |
  { 'pending' : null } |
  { 'completed' : null };
export type Result = { 'ok' : null } |
  { 'err' : string };
export type Result_1 = { 'ok' : QueryId } |
  { 'err' : string };
export interface SystemStats {
  'totalPatients' : bigint,
  'pendingQueries' : bigint,
  'totalQueries' : bigint,
  'totalDoctors' : bigint,
  'completedQueries' : bigint,
}
export interface _SERVICE {
  'assignPatientToDoctor' : ActorMethod<[PatientId, DoctorId], Result>,
  'findPatientByEmail' : ActorMethod<[string], [] | [Patient]>,
  'getAllDoctors' : ActorMethod<[], Array<Doctor>>,
  'getDoctor' : ActorMethod<[DoctorId], [] | [Doctor]>,
  'getDoctorPatients' : ActorMethod<[DoctorId], Array<Patient>>,
  'getDoctorQueries' : ActorMethod<[DoctorId], Array<MedicalQuery>>,
  'getPatient' : ActorMethod<[PatientId], [] | [Patient]>,
  'getPatientQueries' : ActorMethod<[PatientId], Array<MedicalQuery>>,
  'getPendingQueries' : ActorMethod<[], Array<MedicalQuery>>,
  'getQuery' : ActorMethod<[QueryId], [] | [MedicalQuery]>,
  'getStats' : ActorMethod<[], SystemStats>,
  'getUnassignedPatients' : ActorMethod<[], Array<Patient>>,
  'healthCheck' : ActorMethod<[], string>,
  'registerDoctor' : ActorMethod<[string, string], DoctorId>,
  'registerPatient' : ActorMethod<[string, string, string], PatientId>,
  'respondToQuery' : ActorMethod<[QueryId, DoctorId, string], Result>,
  'submitQuery' : ActorMethod<[PatientId, string, string], Result_1>,
  'takeQuery' : ActorMethod<[QueryId, DoctorId], Result>,
  'unassignPatient' : ActorMethod<[PatientId, DoctorId], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
