# Haryana Police Case Management System (CMS AK) - Architecture Specification

Refer to the complete design in the system artifact and project design documents.

## Architectural Layers
1. **Presentation Layer**: Next.js App Router, Tailwind CSS, Lucide icons, responsive shell (desktop sidebar + mobile bottom navigation).
2. **Domain Service Layer**: Service modules encapsulating Haryana Police SOPs (`ComplaintService`, `GeneralDiaryService`, `WorkflowService`, `AuditService`).
3. **Validation Layer**: Zod schemas shared between client forms and server actions.
4. **Data Access Layer**: Prisma ORM with PostgreSQL.
5. **Security & Permissions**: Server-enforced Role-Based Access Control (RBAC) and immutable audit trail.
