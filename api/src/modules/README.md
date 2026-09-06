# SynapseX API - Domain Modules Architecture

This directory houses the feature modules for the NestJS API. In alignment with production software engineering principles, each module is organized into its own self-contained folder containing controllers, services, Mongoose schemas, DTOs, and interfaces.

## Planned Domain Modules

| Module | Responsibility | Primary Data Model | Dependencies |
| :--- | :--- | :--- | :--- |
| `auth` | User authentication, JWT issuance, password hashing, RBAC | `User` | Redis (session/blacklist) |
| `cases` | Case lifecycle management, investigator assignment, status tracking | `Case` | `auth` |
| `evidence` | Evidence metadata, file upload to MinIO, hash verification, tagging | `Evidence`, `EvidenceFile` | `storage`, BullMQ (`evidence-ingestion`) |
| `chain-of-custody` | Tamper-evident ledger of all actions performed on evidence | `CustodyLog` | `evidence`, `auth` |
| `investigations` | Active investigation workspaces, notes, hypothesis tracking | `Investigation` | `cases`, `evidence` |
| `timeline` | Chronological event extraction, normalized timestamp management | `TimelineEvent` | `evidence`, BullMQ |
| `intelligence` | Proxy gateway to AI-Service for agent execution, findings & correlations | `Finding`, `Recommendation` | `ai-service` client, BullMQ |
| `reports` | Case report compilation, export templates (PDF/JSON), downloads | `Report` | BullMQ (`report-generation`), MinIO |
| `notifications` | System notifications, alerts, and live event broadcasts | `Notification` | `gateway` (Socket.IO), BullMQ |

## Rules for Adding New Modules

1. **Keep Controllers Thin**: Controllers should only handle HTTP validation (via DTOs with `class-validator`), call services, and return responses.
2. **Encapsulate Schemas**: Define Mongoose schemas with `@Schema()` and `@Prop()` inside a `schemas/` directory within the module.
3. **Use Dependency Injection**: Inject services and Mongoose models (`@InjectModel()`) via constructor parameters.
4. **Queue Async Operations**: Any heavy processing (file parsing, AI orchestration, PDF generation) must be dispatched to BullMQ queues rather than blocking HTTP request threads.
5. **Real-time Updates**: Emit events through the global `EventsGateway` for real-time frontend updates.
