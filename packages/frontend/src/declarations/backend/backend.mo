// This is a generated Motoko binding.
// Please use `import service "ic:canister_id"` instead to call canisters on the IC if possible.

module {
  public type HttpHeader = { value : Text; name : Text };
  public type HttpResponsePayload = {
    status : Nat;
    body : Blob;
    headers : [HttpHeader];
  };
  public type Patient = {
    id : Text;
    medicalContext : Text;
    name : Text;
    email : Text;
    condition : Text;
  };
  public type Query = {
    id : Text;
    status : Text;
    queryText : Text;
    patientId : Text;
    timestamp : Int;
    aiResponse : ?Text;
    doctorResponse : ?Text;
  };
  public type TransformArgs = {
    context : Blob;
    response : HttpResponsePayload;
  };
  public type Self = actor {
    doctorReviewQuery : shared (Text, Text, Text) -> async Bool;
    getAllPatients : shared query () -> async [Patient];
    getDoctorPendingReviews : shared query Text -> async [Query];
    getPatient : shared query Text -> async ?Patient;
    getPatientQueries : shared query Text -> async [Query];
    getQuery : shared query Text -> async ?Query;
    healthCheck : shared () -> async Text;
    initializeSystem : shared () -> async Text;
    makeHttpCall : shared Text -> async Text;
    makeHttpCallWithContext : shared Text -> async Text;
    processQueryWithAI : shared Text -> async Text;
    submitPatientQuery : shared (Text, Text) -> async Text;
    transform_response : shared query TransformArgs -> async HttpResponsePayload;
  }
}
