# Gemini Development Guide for TrustCareConnect

This document provides a contextual guide for developing the TrustCareConnect application with Gemini.

## Project Overview

TrustCareConnect is a platform that connects patients with doctors for medical queries. It uses a WebSocket bridge as the primary service layer, an Internet Computer (IC) canister for data persistence, and a React-based frontend for the user interface.

## Core Components

The project is a monorepo with three main components:

1.  **`trustcare-bridge`**: The primary service layer, built with Node.js. It handles:
    *   Real-time communication via WebSockets.
    *   An HTTP REST API as a fallback.
    *   Integration with the Novita AI API for medical query processing.
    *   Integration with the IC canister for data storage.
    *   Monitoring and health checks.

2.  **`packages/backend`**: The data layer, implemented as an Internet Computer (IC) canister in Motoko. It is responsible for:
    *   Persisting patient and doctor data.
    *   Storing query history.
    *   Providing an audit trail for all medical interactions.

3.  **`packages/frontend`**: The user interface, built with React and TypeScript. It provides:
    *   A portal for patients to submit medical queries.
    *   A portal for doctors to review and respond to queries.
    *   Real-time updates via the WebSocket bridge.

There is also a `frontend-simple` directory, which contains a minimal HTML/JS frontend for basic testing and interaction with the bridge.

## Getting Started

To set up the local development environment, run the following command from the project root:

```bash
./quickstart.sh
```

This script will install all dependencies and configure the necessary services.

To start the primary service (the WebSocket bridge), run:

```bash
cd trustcare-bridge && npm run dev
```

## Development Workflow

When working on a new feature or fixing a bug, it's important to identify the relevant component to modify.

*   **For changes to the real-time communication, AI integration, or data persistence logic**, you will likely need to modify the `trustcare-bridge` component. The main files are:
    *   `trustcare-bridge/src/bridge-server.js`: The main WebSocket and HTTP server.
    *   `trustcare-bridge/src/novita-client.js`: The client for the Novita AI API.
    *   `trustcare-bridge/src/icp-client.js`: The client for the IC canister.

*   **For changes to the data model or on-chain storage**, you will need to modify the `packages/backend` component. The main files are:
    *   `packages/backend/src/main.mo`: The main Motoko canister code.
    *   `packages/backend/src/types.mo`: The type definitions for the canister.

*   **For changes to the user interface**, you will need to modify the `packages/frontend` component. The main files are:
    *   `packages/frontend/src/App.tsx`: The main application component.
    *   `packages/frontend/src/components/`: The directory containing the React components for different parts of the UI.
    *   `packages/frontend/src/pages/`: The directory containing the main pages of the application.

## Testing

To run the test suite for the `trustcare-bridge`, run the following command:

```bash
cd trustcare-bridge && npm test
```

## Deployment

To deploy the application to production, run the following command from the project root:

```bash
./deploy.sh
```

This script will build and deploy all the necessary components.
