# SynapseX System Documentation

Welcome to the technical documentation library for **SynapseX**, an AI-Assisted Digital Evidence Intelligence Platform.

## Documentation Index

- [System Architecture](architecture.md): Complete high-level and component architecture, service boundaries, technology choices, and data flow diagrams.
- [Migration Guide](migration-guide.md): Operational guide detailing how modules from the legacy prototype backend are migrated into the new multi-service architecture.
- [API & Event Contracts](api-contracts.md): Specifications for service-to-service HTTP communications, BullMQ asynchronous jobs, and Socket.IO real-time channels.

## Core System Services

```
┌─────────────────────────────────────────────────────────────┐
│                       SynapseX Monorepo                     │
├─────────────────┬─────────────────┬─────────────────────────┤
│ Directory       │ Service Name    │ Technology Stack        │
├─────────────────┼─────────────────┼─────────────────────────┤
│ client/         │ Client Web App  │ React 19, Vite          │
│ api/            │ Main API        │ NestJS, TypeScript, Mongo│
│ ai-service/     │ AI & Analytics  │ FastAPI, LangGraph, Neo │
│ infrastructure/ │ Dev Ops         │ Docker Compose, MinIO   │
│ docs/           │ Architecture    │ Markdown Specifications │
└─────────────────┴─────────────────┴─────────────────────────┘
```
