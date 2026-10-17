# Project Guidelines: SHARE2GO

## Core Architectural Directives
- **Architecture**: **Modular Monolith** (Clean Architecture). Keep the entire application unified in a single, well-structured codebase.
- **Module Structure**: Feature-based modular structure inside `src/modules/<feature_name>/` containing:
  - `*.routes.js` — HTTP routes and endpoint mappings.
  - `*.controller.js` — Request/response orchestration wrapped in `asyncHandler`.
  - `*.service.js` — Pure business logic and database interactions.
  - `*.validation.js` — Zod request validation schemas.
- **Data Access & Prisma**:
  - Prisma is the primary ORM and source of truth for models, migrations, and database operations.
  - `src/config/db.js` serves solely as the Prisma Client connection singleton to prevent connection pool exhaustion during development and hot-reloading.
  - Avoid creating disconnected, redundant SQL script files unless specifically requested.
- **Error Handling & API Responses**:
  - Always use `ApiError` for throwing controlled HTTP errors.
  - Always use `ApiResponse` for sending consistent client responses.
- **Developer Experience**:
  - Keep code clean, readable, and friction-free.
  - Work collaboratively as a dedicated pair-programming partner until project completion.
