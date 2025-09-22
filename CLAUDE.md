# TrustCareConnect MVP - Healthcare AI Platform

> **Note:** This document represents the original specification for the TrustCareConnect MVP. The project has since evolved, and some of the information in this document may be outdated. Please refer to the `README.md` and `ARCHITECTURE.md` files for the most up-to-date information.

## Project Overview

TrustCareConnect is an AI-powered diabetes care platform providing 24/7 medical guidance with human oversight. It uses a medical LLM via Novita AI API, deployed on the Internet Computer Protocol (ICP) blockchain.

**MVP Goal**: Demonstrate real AI models providing medical guidance via HTTP outcalls from ICP canisters with patient context.

## Core Workflow

1.  **Patient Query**: A patient submits a medical query through the frontend.
2.  **Bridge Service**: The `trustcare-bridge` service receives the query.
3.  **AI Processing**: The bridge service sends the query and patient context to the Novita AI API.
4.  **Canister Storage**: The bridge service stores the query and AI response in the backend canister.
5.  **Doctor Review**: A doctor can review the AI-generated response and provide their own input.
6.  **Final Delivery**: The system delivers the final response to the patient.

## Backend Implementation (Motoko)

The backend is implemented as a Motoko canister. Here are some of the key data structures and functions from `packages/backend/src/main.mo`:

### Core Data Types
```motoko
// Enhanced Patient Data
type PatientData = {
    id: PatientId;
    firstName: Text;
    lastName: Text;
    // ... and many other fields
};

// Enhanced Query Data
type QueryData = {
    id: QueryId;
    patientId: PatientId;
    title: Text;
    description: Text;
    // ... and many other fields
};
```

### Main Processing Function
```motoko
// Enhanced submit query function with AI processing
public func submitQueryEnhanced(queryData: QueryData): async ApiResult<QueryId> {
    // ... implementation details ...
};
```

## Frontend Implementation

This project contains two frontends:

*   `frontend-simple`: A basic HTML/JS frontend for testing and interacting with the bridge.
*   `packages/frontend`: A more advanced React-based frontend (work in progress).

## Setup Commands

```bash
# Clone the repository
git clone https://github.com/musyokapatrickmutuku/trustcareconnect.git
cd trustcareconnect

# Run the one-command setup script
./quickstart.sh
```

## Current Deployment

After running the `quickstart.sh` script, the canister IDs will be available in the `.env` file in the root directory.

## Technical Architecture

-   **Frontend**: A simple HTML/JS frontend (`frontend-simple`) and a React/TypeScript progressive web app (`packages/frontend`).
-   **Backend**: Motoko canisters on the ICP blockchain.
-   **Bridge**: A Node.js service (`trustcare-bridge`) that acts as a gateway between the frontend and the backend.
-   **AI Model**: Baichuan-M2-32B via Novita AI API.
-   **Database**: ICP stable storage with a blockchain audit trail.

## Repository

https://github.com/musyokapatrickmutuku/trustcareconnect
