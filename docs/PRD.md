# PRD — METLAND Digital Ecosystem

## 1. Product Overview

METLAND Digital Ecosystem terdiri dari dua aplikasi yang **terpisah secara fungsi dan operasional**, tetapi saling terhubung melalui identity, integration, notification, dan shared standards.

### Product A — METLAND Project Management

**Purpose**

Sentralisasi data dan aktivitas proyek untuk meningkatkan:

- Visibilitas dan transparansi proyek
- Kecepatan pengambilan keputusan
- Akuntabilitas dan ownership tugas
- Pengurangan risiko keterlambatan
- Manajemen proyek berbasis data

**Primary users**

- Management
- Project Manager
- Project Control
- Site Engineer
- Site Supervisor
- Field Staff
- System Administrator

---

### Product B — METLAND AI Catalogue

**Purpose**

Menyediakan centralized catalogue untuk kontraktor dan material serta AI-powered search/recommendation untuk membantu internal procurement menemukan pilihan yang relevan dengan cepat.

**Primary users**

- Procurement
- Purchasing
- Catalogue Admin
- Management / Approver

---

## 2. Product Philosophy

### Project Management

> **Run the Project**

```text
Plan
  ↓
Execute
  ↓
Monitor
  ↓
Report
  ↓
Decision
```

### AI Catalogue

> **Find the Right Choice**

```text
Search
  ↓
Discover
  ↓
Compare
  ↓
AI Recommendation
  ↓
Approval
```

### Ecosystem

> **Connect the Information**

```text
Identity
Master Data
Notification
Audit
API / Integration
```

---

# 3. High-Level Architecture

```text
                    METLAND DIGITAL ECOSYSTEM
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
     Identity             Notification          Integration
       Layer                 Layer                 Layer
        │                     │                     │
        └──────────────┬──────┴──────┬──────────────┘
                       │
             ┌─────────┴─────────┐
             │                   │
             ▼                   ▼
┌────────────────────────┐  ┌────────────────────────┐
│  PROJECT MANAGEMENT    │  │     AI CATALOGUE       │
│                        │  │                        │
│ Project                │  │ Contractor             │
│ Schedule               │  │ Material               │
│ Task                   │  │ Supplier               │
│ Progress               │  │ Search                 │
│ Document               │  │ Recommendation         │
│ Reporting              │  │ Approval               │
│ Notification           │  │                        │
└────────────┬───────────┘  └────────────┬───────────┘
             │                           │
             ▼                           ▼
          TURSO                       TURSO
             │                           │
             └────────────┬──────────────┘
                          ▼
                         R2
                   Object Storage
```

### Architectural Principles

1. Kedua aplikasi tetap independen.
2. Database kedua aplikasi tetap terpisah.
3. Identity dapat digunakan bersama.
4. Role dan permission tetap dikelola per aplikasi.
5. Integrasi dilakukan melalui API/event.
6. AI hanya memberikan recommendation; keputusan final tetap manusia.
7. Aktivitas penting memiliki audit trail.
8. R2 digunakan untuk object/file storage, bukan relational data.

---

# 4. Technology Stack

## Application

- Next.js
- TypeScript
- App Router
- Server Components
- Server Actions / Route Handlers

Kedua aplikasi dikembangkan sebagai fullstack Next.js.

## Database

**Turso**

Digunakan untuk:

- Relational data
- Users
- Roles
- Permissions
- Projects
- Tasks
- Milestones
- Catalogue
- Approval
- Notification
- Audit logs

## Object Storage

**Cloudflare R2**

Digunakan untuk:

- Foto lapangan
- Dokumen proyek
- PDF
- Sertifikat vendor
- Portfolio contractor
- Datasheet material
- Report attachment

Database hanya menyimpan metadata file.

Contoh:

```text
file_id
file_name
mime_type
size
r2_key
uploaded_by
created_at
```

---

# 5. Product A — METLAND Project Management

## 5.1 Objective

Membangun centralized project workspace yang memungkinkan METLAND mengetahui:

- Apa yang sedang terjadi pada proyek
- Siapa yang bertanggung jawab
- Apa yang sudah selesai
- Apa yang terlambat
- Apa yang membutuhkan tindakan
- Informasi dan dokumen proyek berada di mana

---

## 5.2 User Roles

### System Admin

Full access terhadap sistem.

### Management

- View project dashboard
- View project
- View report
- View project status
- Approval tertentu

### Project Manager

- Create/manage project
- Manage team
- Manage task
- Manage milestone
- Update project
- Submit approval

### Project Control

- Monitor schedule
- Monitor progress
- Review project health
- Generate report

### Site Engineer / Supervisor

- Update progress
- Update task
- Upload field photo
- Report issue
- Update field activity

### Field Staff

- View assigned tasks
- Update assigned task
- Submit field update
- Upload photo/document

---

# 6. Project Management Navigation

```text
Dashboard

Projects
├── All Projects
├── My Projects
└── Project Archive

Tasks
├── My Tasks
├── All Tasks
└── Overdue

Schedule

Documents

Reports

Notifications

Administration
├── Users
├── Roles & Permissions
├── Master Data
└── Audit Logs
```

---

# 7. Project Entity

Setiap project memiliki:

```text
Project
├── Project ID
├── Project Code
├── Project Name
├── Description
├── Project Type
├── Location
├── Start Date
├── Planned End Date
├── Actual End Date
├── Status
├── Project Manager
├── Team
├── Progress
├── Health Status
├── Documents
├── Tasks
├── Milestones
├── Issues
└── Activity History
```

---

# 8. Project Lifecycle

```text
DRAFT
  ↓
PLANNED
  ↓
ACTIVE
  ↓
ON HOLD
  ↓
COMPLETED
  ↓
ARCHIVED
```

Project health:

```text
GREEN
On Track

YELLOW
At Risk

RED
Delayed / Critical
```

---

# 9. Project Dashboard

## KPI

Dashboard menampilkan:

```text
Total Projects
Active Projects
Completed Projects
Delayed Projects
At Risk Projects
Upcoming Milestones
Overdue Tasks
```

## Project Health

```text
Project A    🟢 On Track
Project B    🟢 On Track
Project C    🟡 At Risk
Project D    🔴 Delayed
```

## Progress Monitoring

```text
Project
Planned Progress
Actual Progress
Variance
```

---

# 10. Schedule & Milestone

Setiap project memiliki milestone.

Contoh:

```text
Project XYZ

Land Preparation
████████████ 100%

Foundation
████████░░░░ 70%

Structure
████░░░░░░░░ 35%

Finishing
░░░░░░░░░░░░ 0%
```

Milestone fields:

```text
id
project_id
name
description
start_date
due_date
completion_percentage
status
pic_user_id
dependencies
created_at
updated_at
```

---

# 11. Task Management

Task fields:

```text
id
project_id
title
description
assignee_id
priority
start_date
due_date
status
progress
created_by
created_at
updated_at
```

Task status:

```text
TODO
IN_PROGRESS
BLOCKED
DONE
CANCELLED
```

Priority:

```text
LOW
MEDIUM
HIGH
CRITICAL
```

---

# 12. Field Update

Orang lapangan dapat melakukan:

- Update progress
- Upload photo
- Add note
- Submit issue
- Update task
- Upload supporting document

Contoh:

```text
Foundation Block A

Progress: 80%

Note:
Pekerjaan pondasi selesai pada sisi timur.

Attachment:
IMG_20260901.jpg
```

Foto dan file disimpan di R2.

---

# 13. Issue Management

Issue fields:

```text
id
project_id
title
description
severity
reported_by
assigned_to
due_date
status
created_at
updated_at
```

Severity:

```text
LOW
MEDIUM
HIGH
CRITICAL
```

Issue status:

```text
OPEN
IN_PROGRESS
RESOLVED
CLOSED
```

---

# 14. Document Management

Document category:

```text
Contract
Drawing
Report
Approval
Photo
Technical Document
Other
```

Document metadata:

```text
id
entity_type
entity_id
file_name
r2_key
mime_type
file_size
version
uploaded_by
uploaded_at
status
```

Document status dapat berupa:

```text
DRAFT
UNDER_REVIEW
APPROVED
REJECTED
ARCHIVED
```

---

# 15. Approval Workflow

Generic workflow:

```text
DRAFT
  ↓
SUBMITTED
  ↓
IN_REVIEW
  ↓
APPROVED
```

Alternative:

```text
SUBMITTED
  ↓
REJECTED
  ↓
REVISION
  ↓
SUBMITTED
```

Approval action menyimpan:

```text
approver_id
decision
comment
timestamp
```

---

# 16. Notification

Notification event:

```text
Task Assigned
Task Due Soon
Task Overdue
Project Update
Milestone Due
Approval Requested
Approval Approved
Approval Rejected
Issue Assigned
Document Uploaded
```

### MVP Channel

**In-app notification**

Future:

```text
Email
Push Notification
WhatsApp
```

---

# 17. Reporting

## Project Summary Report

Berisi:

```text
Project
Reporting Period
Progress
Milestone
Issues
Task Status
Conclusion
```

## Dashboard Report

```text
Total Project
On Track
At Risk
Delayed
Completion
```

Export:

```text
PDF
Excel
```

---

# 18. Audit Trail

Aktivitas kritis harus dicatat:

```text
user_id
action
entity_type
entity_id
old_value
new_value
timestamp
ip_address
user_agent
```

Contoh:

```text
User: Budi
Action: UPDATED
Entity: Project #PRJ-001
Field: Progress
Old: 60
New: 75
Timestamp: 2026-09-01 10:32
```

---

# 19. Product B — METLAND AI Catalogue

## 19.1 Objective

Menyediakan centralized database kontraktor dan material sehingga procurement dapat:

- Menemukan vendor
- Menemukan material
- Melihat informasi detail
- Membandingkan pilihan
- Mendapatkan AI recommendation
- Mengajukan recommendation untuk approval

AI tidak melakukan final decision.

---

# 20. AI Catalogue Navigation

```text
Dashboard

Contractors
├── All Contractors
├── Categories
└── Portfolio

Materials
├── All Materials
├── Categories
└── Specifications

AI Search

Recommendations

Approvals

Documents

Administration
├── Users
├── Roles & Permissions
├── Import Data
└── Audit Logs
```

---

# 21. Contractor Entity

```text
Contractor
├── Company Name
├── Company Code
├── Description
├── Category
├── Specialization
├── Location
├── Contact
├── Certification
├── Experience
├── Portfolio
├── Status
└── Documents
```

Specialization example:

```text
Structure
MEP
Civil
Architecture
Foundation
Road
Infrastructure
```

---

# 22. Contractor Portfolio

Portfolio fields:

```text
Project Name
Client
Location
Project Type
Year
Scope
Description
Images
Documents
```

Portfolio digunakan sebagai salah satu context untuk recommendation.

---

# 23. Material Entity

```text
Material
├── Name
├── Category
├── Brand
├── Specification
├── Unit
├── Price
├── Supplier
├── Availability
├── Lead Time
├── Certification
├── Datasheet
└── Status
```

---

# 24. Catalogue Search & Filter

Search harus tetap powerful tanpa AI.

Filter:

```text
Category
Specification
Location
Price
Availability
Brand
Certification
Supplier
```

---

# 25. AI Search

User dapat melakukan natural-language query.

Contoh:

> Cari kontraktor struktur untuk proyek high rise.

Flow:

```text
User Query
    ↓
Intent Extraction
    ↓
Search Catalogue
    ↓
Filtering
    ↓
Candidate Retrieval
    ↓
Ranking
    ↓
Recommendation
    ↓
Explanation
```

---

# 26. AI Recommendation

Contoh output:

```text
Recommended Contractors

1. Contractor A
   Match: High

2. Contractor B
   Match: High

3. Contractor C
   Match: Medium
```

Recommendation explanation:

```text
Why recommended?

✓ Relevant specialization
✓ Similar project experience
✓ Location compatible
✓ Relevant portfolio
✓ Certification available
```

AI tidak boleh membuat fakta yang tidak terdapat pada source catalogue.

---

# 27. Recommendation Detail

Detail contractor:

```text
Company Profile
Experience
Specialization
Portfolio
Certification
Documents
AI Recommendation
```

AI summary harus berbasis data catalogue.

Contoh:

> Recommended karena memiliki pengalaman pada proyek high-rise dengan scope struktur yang serupa.

---

# 28. Approval Flow

```text
Search
  ↓
Recommendation
  ↓
Select
  ↓
Request Approval
  ↓
Procurement Review
  ↓
Approved / Rejected
```

Approval record:

```text
requester_id
approver_id
recommendation_id
reason
decision
comment
timestamp
```

---

# 29. Data Import

Karena data awal kemungkinan berasal dari Excel/PDF, import data menjadi fitur penting.

MVP flow:

```text
Upload Excel
    ↓
Column Mapping
    ↓
Validation
    ↓
Preview
    ↓
Import
```

Contoh mapping:

```text
Company Name     → company_name
Specialization   → specialization
Location         → location
```

Validation:

```text
Duplicate
Missing Required Field
Invalid Format
Invalid Category
Invalid Reference
```

---

# 30. AI Architecture

AI tidak boleh langsung melakukan arbitrary database access.

Recommended flow:

```text
User
 ↓
AI Service
 ↓
Structured Query / Intent
 ↓
Catalogue Repository
 ↓
Candidate Results
 ↓
Ranking
 ↓
LLM Explanation
 ↓
User
```

Semua fakta recommendation harus berasal dari data catalogue.

---

# 31. Ecosystem Identity

Kedua aplikasi dapat menggunakan identity yang sama, namun authorization tetap lokal.

Contoh:

```text
User: Budi
Email: budi@metland.co.id
```

Project Management:

```text
Role:
Project Manager
```

AI Catalogue:

```text
Role:
Viewer
```

Sehingga:

```text
Shared Identity
       │
 ┌─────┴─────┐
 ▼           ▼
Project     Catalogue
RBAC        RBAC
```

---

# 32. Role & Permission Model

Gunakan RBAC.

Permission format:

```text
resource.action
```

Contoh Project Management:

```text
project.read
project.create
project.update
project.delete

task.read
task.create
task.update
task.delete

milestone.read
milestone.manage

document.read
document.upload
document.delete

approval.create
approval.approve
approval.reject
```

Contoh AI Catalogue:

```text
catalogue.contractor.read
catalogue.contractor.manage

catalogue.material.read
catalogue.material.manage

recommendation.read
recommendation.create

approval.read
approval.create
approval.approve
approval.reject

import.create
```

---

# 33. Database Design

## 33.1 Project Management DB

Core tables:

```text
users
roles
permissions
role_permissions

projects
project_members

milestones
tasks
issues

documents
document_versions

approvals
approval_actions

notifications
audit_logs

master_project_types
master_locations
```

## 33.2 AI Catalogue DB

Core tables:

```text
users
roles
permissions
role_permissions

contractors
contractor_categories
contractor_specializations
contractor_portfolios
contractor_certifications

materials
material_categories
material_specifications
suppliers

recommendations
approval_requests
approval_actions

documents
notifications
audit_logs
```

---

# 34. R2 Storage Structure

Recommended key structure:

```text
/project-management/
    projects/{projectId}/documents/
    projects/{projectId}/photos/
    projects/{projectId}/reports/

/ai-catalogue/
    contractors/{contractorId}/documents/
    contractors/{contractorId}/portfolio/
    materials/{materialId}/documents/
```

Gunakan UUID/randomized object key dan jangan menggunakan filename sebagai unique identifier.

Private documents sebaiknya diakses menggunakan signed URL.

---

# 35. API Design

Karena menggunakan fullstack Next.js, API dapat menggunakan Route Handlers / Server Actions.

## Project Management

```text
/api/projects
/api/projects/:id
/api/projects/:id/tasks
/api/projects/:id/milestones
/api/projects/:id/issues
/api/projects/:id/documents
/api/projects/:id/progress
/api/notifications
/api/reports
```

## AI Catalogue

```text
/api/catalogue/contractors
/api/catalogue/contractors/:id
/api/catalogue/materials
/api/catalogue/materials/:id
/api/catalogue/search
/api/catalogue/recommendations
/api/catalogue/approvals
/api/catalogue/import
```

## Ecosystem Integration

```text
/api/ecosystem/*
```

Integration dapat berkembang menjadi service-to-service API atau event/webhook.

---

# 36. Security Requirements

Minimum security:

```text
Authentication
Authorization
RBAC
Session Management
Input Validation
Rate Limiting
Audit Logging
File Validation
Signed R2 URLs
Secure Secrets Management
```

Untuk upload:

```text
Allowed MIME Types
Maximum File Size
Filename Sanitization
Randomized Object Key
File Metadata Validation
```

Dokumen internal tidak boleh menggunakan public R2 bucket.

Future:

```text
Virus / Malware Scanning
DLP
Advanced SIEM
```

---

# 37. Non-Functional Requirements

## Performance Targets

Target MVP:

```text
Dashboard       < 2 sec
Catalogue Search < 1.5 sec
Normal CRUD      < 1 sec
AI Recommendation < 5 sec
```

Target dapat dievaluasi kembali berdasarkan actual production usage.

## Availability

MVP:

> Best effort business application SLA.

Future:

> 99.9% availability target.

---

# 38. MVP Scope — Project Management

### Included

```text
✓ Authentication
✓ User & Role
✓ Project
✓ Project Member
✓ Milestone
✓ Task
✓ Progress
✓ Field Update
✓ Photo Upload
✓ Documents
✓ Issue Management
✓ Basic Dashboard
✓ Notification
✓ Approval
✓ Audit Log
✓ Basic Report
```

### Out of Scope

```text
✗ Complex budgeting
✗ Full financial management
✗ Advanced resource planning
✗ Advanced analytics
✗ Complex Gantt dependency engine
✗ Native mobile application
```

---

# 39. MVP Scope — AI Catalogue

### Included

```text
✓ Authentication
✓ User & Role
✓ Contractor Catalogue
✓ Material Catalogue
✓ Portfolio
✓ Documents
✓ Search
✓ Filter
✓ Excel Import
✓ AI Search
✓ AI Recommendation
✓ Recommendation Explanation
✓ Approval
✓ Audit Log
```

### Out of Scope

```text
✗ Procurement transaction
✗ Purchase Order
✗ Vendor bidding
✗ Automatic vendor selection
✗ Autonomous AI agent
✗ Predictive pricing
```

---

# 40. Development Phases

## Phase 0 — Foundation

```text
Design System
Database Schema
Authentication
RBAC
R2 Integration
Audit System
Base Layout
```

## Phase 1 — Project Management

```text
Project
Task
Milestone
Progress
Documents
Issues
Dashboard
```

## Phase 2 — Operational Workflow

```text
Approval
Notification
Reporting
Audit
```

## Phase 3 — AI Catalogue

```text
Contractor
Material
Portfolio
Documents
Search
Filter
Import
```

## Phase 4 — AI Layer

```text
Natural Language Search
Recommendation
Explainability
```

## Phase 5 — Ecosystem

```text
Shared Identity / SSO
Cross-App API
Shared Standards
Cross-App Navigation
Future Integrations
```

---

# 41. Design Direction

Kedua aplikasi **tidak harus memiliki UI identik**, tetapi menggunakan satu design system.

## Project Management

Karakter:

> Professional, Operational, Data-heavy

Visual emphasis:

```text
Dashboard
Tables
Timeline
Progress
Status
Charts
Reports
```

## AI Catalogue

Karakter:

> Search, Discovery, Intelligence

Visual emphasis:

```text
Search
Cards
Filters
Comparison
Recommendation
AI Explanation
```

Shared design system:

```text
Typography
Spacing
Color Tokens
Iconography
Components
Border Radius
Forms
Tables
Modals
Notifications
```

---

# 42. Success Metrics

## Project Management

```text
% project yang masuk sistem
% project dengan progress update
% task overdue
Average time untuk menemukan informasi project
Approval turnaround time
Project data completeness
```

## AI Catalogue

```text
Catalogue coverage
Search usage
Recommendation usage
Recommendation → approval rate
Average search time
Data completeness
Approval turnaround time
```

---

# 43. Core Ecosystem KPI

KPI utama ecosystem:

> **Time to Decision**

### Sebelum sistem

```text
Excel
  ↓
WhatsApp
  ↓
Email
  ↓
Cari dokumen
  ↓
Tanya orang
  ↓
Meeting
  ↓
Decision
```

### Setelah sistem

```text
Data
  ↓
Search
  ↓
Information
  ↓
Recommendation
  ↓
Approval
  ↓
Decision
```

---

# 44. Repository Strategy

Karena kedua aplikasi ingin tetap terpisah:

```text
metland-project-management
metland-ai-catalogue
```

Masing-masing repository memiliki:

```text
app/
components/
lib/
server/
db/
services/
types/
validators/
```

Integrasi antar aplikasi dilakukan melalui:

```text
API
SSO / Identity
Webhooks / Events
```

---

# 45. Recommended Development Order

Urutan yang disarankan:

```text
1. Information Architecture
        ↓
2. User Flow
        ↓
3. Screen List
        ↓
4. Design System
        ↓
5. ERD / Database Schema
        ↓
6. Role & Permission Matrix
        ↓
7. Workflow Definition
        ↓
8. API Contract
        ↓
9. UI Prototype
        ↓
10. Development
        ↓
11. QA / Security
        ↓
12. Deployment
```

---

# 46. Final Product Model

```text
                    METLAND DIGITAL ECOSYSTEM
                              │
                        METLAND IDENTITY
                              │
               ┌──────────────┴──────────────┐
               │                             │
               ▼                             ▼
      PROJECT MANAGEMENT                AI CATALOGUE
               │                             │
           Turso DB                     Turso DB
               │                             │
               └──────────────┬──────────────┘
                              │
                         Cloudflare R2
                         Object Storage
```

### Project Management

> **Operational Project System**

```text
Plan → Execute → Monitor → Report
```

### AI Catalogue

> **Procurement Intelligence System**

```text
Discover → Compare → Recommend → Approve
```

### Ecosystem

> **Identity + Integration + Shared Standards**

---

# 47. Guiding Principles

1. **Separate Apps, One Ecosystem**
2. **Separate Database, Clear Boundaries**
3. **Shared Identity, Local Authorization**
4. **AI Recommends, Human Approves**
5. **Data First, AI Second**
6. **Audit Everything Important**
7. **Start Simple, Scale Later**
8. **Optimize for Faster Decision Making**
